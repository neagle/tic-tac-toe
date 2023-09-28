import { kv } from "@vercel/kv";
import { NextApiRequest, NextApiResponse } from "next";
import Ably from "ably";

const {
  ABLY_API_KEY = "",
} = process.env;

export type GameState = {
  grid: string[][];
  result: string | null;
};

function newGameState(): GameState {
  return {
    grid: [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ],
    result: null,
  };
}

function randomizeStartingPlayer(player1: string, player2: string) {
  return Math.random() < 0.5 ? [player1, player2] : [player2, player1];
}

export type Game = {
  id: string;
  players: string[];
  state: GameState;
};

// This is a handy way to turn on and off logging. This flow can be a little
// confusing, and if you need to debug something, it helps to have some
// step-by-step messaging.
const DEBUG = false;
const debug = (...args: any[]) => DEBUG && console.log(...args);

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
    // If not, check to see if there is an open game
    const openGameId: string | null = await kv.get("openGame");
    debug("openGameId", openGameId);

    if (openGameId) {
      const openGame: Game | null = await kv.get(openGameId);
      debug("openGame", openGame);

      // Check for the possibility that our state is broken and we can't find a
      // game with the id indicated in the openGame key
      if (!openGame) {
        await kv.del(playerId);
        return response.status(500).send(
          JSON.stringify("Broken game state: can't find open game. Try again?"),
        );
      }

      if (openGame.players[0] === playerId) {
        // The openGame actually belongs to this player... we need to keep
        // waiting for an opponent
        return response.status(200).send(JSON.stringify(openGame));
      }

      // Get this game started!
      // Add this player to the game and randomize who goes first
      openGame.players = randomizeStartingPlayer(openGame.players[0], playerId);

      // Update the game with the new player added
      await kv.set(openGame.id, openGame);

      // Game is no longer open!
      await kv.set("openGame", null);

      // Store the fact that this player is in this game
      await kv.set(playerId, openGame.id);

      const ably = new Ably.Realtime.Promise(
        ABLY_API_KEY,
      );

      await ably.connection.once("connected");
      const channel = ably.channels.get(openGame.id);

      channel.publish("update", openGame);

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
