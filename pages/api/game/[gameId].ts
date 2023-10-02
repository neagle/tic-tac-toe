import { kv } from "@vercel/kv";
import { NextApiRequest, NextApiResponse } from "next";
import Ably from "ably/promises";
import {
  getGameResult,
  isPlayersMove,
  translatePlayerName,
} from "../../../src/gameUtils";
import { GameTypes } from "../../../src/types";

const {
  ABLY_API_KEY = "",
} = process.env;

const client = new Ably.Rest(
  ABLY_API_KEY,
);

const endGame = async (game: GameTypes.Game, result: GameTypes.GameResult) => {
  const channel = await client.channels.get(game.id);

  const resultMessage = result === "draw"
    ? "It’s a draw."
    : `${translatePlayerName(result)} wins!`;
  await channel.publish("message", resultMessage);
  await kv.del(game.id);
  await kv.del(game.players[0]);
  await kv.del(game.players[1]);
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

  const game: GameTypes.Game | null = await kv.get(gameId);

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
    await endGame(game, result);
  }

  kv.set(gameId, game);

  const channel = client.channels.get(gameId);

  await channel.publish("update", game);
  return response.status(200).send("Success");
}
