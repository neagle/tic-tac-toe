import { kv } from "@vercel/kv";
import { NextApiRequest, NextApiResponse } from "next";
import Ably from "ably";
import { Game, GameState } from "../../../src/types";

const {
  ABLY_API_KEY = "",
  DEBUG = "false",
} = process.env;

function newGameState(): GameState {
  return {
    grid: [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ],
    result: "",
  };
}

function randomizeStartingPlayer(player1: string, player2: string) {
  return Math.random() < 0.5 ? [player1, player2] : [player2, player1];
}

// This is a handy way to turn on and off logging. This flow can be a little
// confusing, and if you need to debug something, it helps to have some
// step-by-step messaging.
const debug = (...args: any[]) =>
  DEBUG.toLowerCase() === "true" && console.log(...args);

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const { playerId, forceNewGame = false } = request.query;
  debug("New request", { playerId, forceNewGame });

  if (typeof playerId !== "string") {
    response.status(400).send(
      JSON.stringify("playerId is required and must be a string"),
    );
    return;
  }

  // Check if there is a current game for this player
  let currentGameId: string | null = await kv.get(playerId);
  debug("currentGameId", currentGameId);

  // If the client tells us to force a new game, we need to clear out references
  // to the current one. This is necessary if a player is in a game and their
  // opponent abandons it mid-game.
  if (currentGameId && forceNewGame === "true") {
    debug("Forcing new game");
    const currentGame: Game | null = await kv.get(currentGameId);
    if (currentGame) {
      currentGame.players.forEach(async (playerId) => await kv.del(playerId));
    }

    const openGameId: string | null = await kv.get("openGame");
    if (openGameId === currentGameId) {
      await kv.del("openGame");
    }

    await kv.del(playerId);
    await kv.del(currentGameId);
    currentGameId = null;
  }

  // Check if this player is in a game
  if (currentGameId) {
    debug("Player is in a game");
    const currentGame = await kv.get(currentGameId);
    return response.status(200).send(JSON.stringify(currentGame));
  } else {
    debug("Player is not in a game, let's check for an open one");
    // If not, check to see if there is an open game -- a game whose id is
    // stored in the `openGame` key
    const openGameId: string | null = await kv.get("openGame");
    debug("checking for openGameId", openGameId);

    if (openGameId) {
      // Get the game data for the openGameId
      const openGame: Game | null = await kv.get(openGameId);
      debug("openGame data", openGame);

      // Check for the possibility that our state is broken and we can't find a
      // game with the id indicated in the openGame key
      if (!openGame) {
        debug("We can't find an actual open game, so let's clear the key");
        await kv.del(openGameId);
        return response.status(500).send(
          JSON.stringify("Broken game state: can't find open game. Try again?"),
        );
      }

      // if (openGame.players[0] === playerId) {
      //   // The openGame actually belongs to this player... we need to keep
      //   // waiting for an opponent
      //   // This check shouldn't be necessary.
      //   debug(
      //     "The openGame belongs to this player, so we need to keep waiting.",
      //   );
      //   return response.status(200).send(JSON.stringify(openGame));
      // }

      // Get this game started!
      debug(
        "Get this game started! Add this player to the game and randomize starting player.",
      );
      // Add this player to the game and randomize who goes first
      openGame.players = randomizeStartingPlayer(openGame.players[0], playerId);

      // Update the game with the new player added
      await kv.set(openGame.id, openGame);

      // Game is no longer open!
      await kv.set("openGame", null);

      // Store the fact that this player is in this game
      await kv.set(playerId, openGame.id);

      const client = new Ably.Rest(ABLY_API_KEY);
      const channel = await client.channels.get(openGame.id);

      debug("Publishing update to channel", openGame.id, openGame);
      await channel.publish("update", openGame);

      return response.status(200).send(JSON.stringify(openGame));
    } else {
      // No open game found. Let's create one!
      const id = String(+new Date());

      // Declare this game open for another player to join
      await kv.set("openGame", id);

      const newGame = {
        id,
        players: [playerId],
        state: newGameState(),
      };

      // Store this game by its ID
      await kv.set(id, newGame);

      // Store the fact that this player is in this game
      await kv.set(playerId, id);

      return response.status(200).send(JSON.stringify(newGame));
    }
  }
}
