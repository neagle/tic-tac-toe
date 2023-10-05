import { kv } from "@vercel/kv";
import { NextApiRequest, NextApiResponse } from "next";
import Ably from "ably/promises";
import * as GameTypes from "../../../src/types/Game";
import { newGameState } from "../../../src/gameUtils";

const {
  ABLY_API_KEY = "",
} = process.env;

function randomizeStartingPlayer(player1: string, player2: string) {
  return Math.random() < 0.5 ? [player1, player2] : [player2, player1];
}

async function eraseGame(currentGameId: string) {
  console.log("-- erase game", currentGameId);
  const currentGame: GameTypes.Game | null = await kv.get(currentGameId);
  if (currentGame) {
    currentGame.players.forEach(async (playerId) => await kv.del(playerId));
  }

  const openGameId: string | null = await kv.get("openGame");
  if (openGameId === currentGameId) {
    await kv.del("openGame");
  }

  // await kv.del(playerId);
  await kv.del(currentGameId);
}

// Create a new game and set it as the open game
async function createNewGame(playerId: string) {
  console.log("++ createNewGame", playerId);
  const newGameId = String(+new Date());

  // Declare this game open for another player to join
  await kv.set("openGame", newGameId);

  const newGame: GameTypes.Game = {
    id: newGameId,
    players: [playerId],
    state: newGameState(),
  };

  // Store this game by its ID
  await kv.set(newGameId, newGame);

  // Store the fact that this player is in this game
  console.log("playerId", playerId);
  console.log("newGameId", newGameId);
  await kv.set(playerId, newGameId);

  return newGame;
}

async function startOpenGame(
  openGame: GameTypes.Game,
  playerId: string,
  channel: Ably.Types.ChannelPromise,
) {
  console.log("++ startOpenGame", openGame, playerId, channel);
  // Get this game started!
  // Add this player to the game and randomize who goes first
  openGame.players = randomizeStartingPlayer(openGame.players[0], playerId);

  // Update the game with the new player added
  await kv.set(openGame.id, openGame);

  // Game is no longer open!
  await kv.set("openGame", null);

  // Store the fact that this player is in this game
  await kv.set(playerId, openGame.id);

  await channel.publish("update", openGame);
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const { playerId, forceNewGame = false } = request.query;
  console.log("-- FETCH GAME -- playerId", playerId);

  if (typeof playerId !== "string") {
    response.status(400).send(
      JSON.stringify("playerId is required and must be a string"),
    );
    return;
  }

  // Check if there is a current game for this player
  let currentGameId: string | null = await kv.get(playerId);

  // If the client tells us to force a new game, we need to clear out references
  // to the current one. This is necessary if a player is in a game and their
  // opponent abandons it mid-game.
  if (currentGameId && forceNewGame === "true") {
    await eraseGame(currentGameId);
    currentGameId = null;
  }

  // Check if this player is in a game
  if (currentGameId) {
    console.log("-- current game id, return the game  --", currentGameId);
    const currentGame = await kv.get(currentGameId);
    console.log("currentGame", currentGame);
    if (!currentGame) {
      await kv.del(currentGameId);
      const newGame = await createNewGame(playerId);
      return response.status(200).send(JSON.stringify(newGame));
    }
    return response.status(200).send(JSON.stringify(currentGame));
  } else {
    console.log("-- no current game, check for a new one --");
    // If not, check to see if there is an open game -- a game whose id is
    // stored in the `openGame` key
    const openGameId: string | null = await kv.get("openGame");
    console.log("open game?", openGameId);

    if (openGameId) {
      console.log(
        "-- open game id, join the game --",
        openGameId,
      );
      // Get the game data for the openGameId
      const openGame: GameTypes.Game | null = await kv.get(openGameId);
      console.log("openGame", openGame);

      // Check for the possibility that our state is broken and we can't find a
      // game with the id indicated in the openGame key
      if (!openGame) {
        await kv.del(openGameId);
        return response.status(500).send(
          JSON.stringify("Broken game state: can't find open game. Try again?"),
        );
      }

      const client = new Ably.Rest(ABLY_API_KEY);
      const channel = client.channels.get(openGame.id);

      // Check Ably's presence API to see if the player who created the open
      // game is still there
      const presentPlayers = await channel.presence.get();
      console.log("presentPlayers", presentPlayers);
      // const noPlayerActuallyPresent = !presentPlayers?.items?.length;
      const noPlayerActuallyPresent = false;
      console.log("noPlayerActuallyPresent", noPlayerActuallyPresent);

      if (noPlayerActuallyPresent) {
        // The open game seems to have been abandoned

        // Delete the game and the openGame key
        await kv.del(openGameId);
        await kv.del("openGame");

        // Create a new game
        const newGame = await createNewGame(playerId);
        return response.status(200).send(JSON.stringify(newGame));
      } else {
        await startOpenGame(openGame, playerId, channel);
        return response.status(200).send(JSON.stringify(openGame));
      }
    } else {
      const newGame = await createNewGame(playerId);
      return response.status(200).send(JSON.stringify(newGame));
    }
  }
}
