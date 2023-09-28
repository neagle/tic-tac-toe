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

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const { playerId } = request.query;
  if (typeof playerId !== "string") {
    response.status(400).send(
      JSON.stringify("playerId is required and must be a string"),
    );
    return;
  }

  console.log(`See if player ${playerId} has a game`);

  // check if there is a current game for this player
  const currentGameId: string | null = await kv.get(playerId);

  // Check if this player is in a game
  if (currentGameId) {
    console.log(`Player ${playerId} is in game ${currentGameId}`);
    const currentGame = await kv.get(currentGameId);
    return response.status(200).send(JSON.stringify(currentGame));
  } else {
    console.log(
      `Player ${playerId} is not in a game... let's see if one's open.`,
    );
    // If not, check to see if there is an open game
    const openGameId: string | null = await kv.get("openGame");
    console.log("openGameId?????", openGameId);

    if (openGameId) {
      console.log(
        `There is an open game: ${openGameId}!`,
      );
      const openGame: Game | null = await kv.get(openGameId);

      // Check for the possibility that our state is broken and we can't find a
      // game with the id indicated in the openGame key
      if (!openGame) {
        return response.status(500).send(
          JSON.stringify("broken game state: can't find open game"),
        );
      }

      if (openGame.players[0] === playerId) {
        console.log(`The openGame actually belongs to this player!`);
        return response.status(200).send(JSON.stringify(openGame));
      }

      console.log("Get this game started!");
      // Add this player to the game
      openGame.players = randomizeStartingPlayer(openGame.players[0], playerId);
      console.log("randomized player order:", openGame.players);

      // Update the game with the new player added
      kv.set(openGame.id, openGame);

      // Game is no longer open!
      kv.set("openGame", null);

      // Store the fact that this player is in this game
      kv.set(playerId, openGame.id);

      const ably = new Ably.Realtime.Promise(
        ABLY_API_KEY,
      );

      await ably.connection.once("connected");
      const channel = ably.channels.get(openGame.id);

      channel.publish("update", openGame);

      return response.status(200).send(JSON.stringify(openGame));
    } else {
      console.log(`No open game found. Let's create one!`);
      const id = String(+new Date());

      // Declare this game open for another player to join
      kv.set("openGame", id);

      const newGame = {
        id,
        players: [playerId],
        state: newGameState(),
      };

      // Store this game by its ID
      kv.set(id, newGame);

      // Store the fact that this player is in this game
      kv.set(playerId, id);

      return response.status(200).send(JSON.stringify(newGame));
    }
  }
}
