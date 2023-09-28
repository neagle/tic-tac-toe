import { kv } from "@vercel/kv";
import { NextApiRequest, NextApiResponse } from "next";
import Ably from "ably";
import { getGameResult, isPlayersMove } from "../../../gameUtils";
import { Game } from "./index";

const {
  ABLY_API_KEY = "",
} = process.env;

const endGame = (game: Game) => {
  kv.del(game.id);
  kv.del(game.players[0]);
  kv.del(game.players[1]);
};

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const { gameId } = request.query;

  if (typeof gameId !== "string") {
    return response.status(400).send(
      JSON.stringify("gameId is required and must be a string"),
    );
  }

  if (request.method !== "POST") {
    return response.status(405).send("Method Not Allowed");
  }

  const { row, column, playerId } = request.body;

  const game: Game | null = await kv.get(gameId);

  if (!game) {
    return response.status(404).send("Game not found");
  }

  const playerIsFirst = game.players[0] === playerId;
  if (!isPlayersMove(playerIsFirst, game.state.grid)) {
    return response.status(400).send("It's not your turn");
  }

  const cell = game.state.grid[row][column];
  if (cell !== "") {
    return response.status(400).send("That cell is already taken");
  }

  game.state.grid[row][column] = playerIsFirst ? "x" : "o";

  const result = getGameResult(game.state.grid);
  if (result) {
    game.state.result = result;
    endGame(game);
  }

  kv.set(gameId, game);

  const client = new Ably.Rest(
    ABLY_API_KEY,
  );

  const channel = client.channels.get(game.id);

  await channel.publish("update", game);

  return response.status(200).send("Success");
}
