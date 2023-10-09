"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as Ably from "ably/promises";
import { AblyProvider } from "ably/react";
import { v4 as uuid } from "uuid";
import * as GameTypes from "../types/Game";
import Game from "./components/Game";
import { getGameResult, emptyGame, isPlayersMove } from "../gameUtils";

const PLAYER_ID = "tic-tac-toe-playerId";
let playerId: string = localStorage.getItem(PLAYER_ID) || "";
if (!playerId || typeof playerId !== "string") {
  playerId = uuid();
  localStorage.setItem(PLAYER_ID, playerId);
}

// Create an Ably client
const client = new Ably.Realtime.Promise({
  authUrl: "/api/ably/auth",
  clientId: playerId,
});

let isFetchingGame = false;
let fetchedGame = emptyGame();

const fetchGame = async (forceNewGame = false) => {
  if (isFetchingGame) {
    return fetchedGame;
  }

  isFetchingGame = true;

  const response = await fetch(
    `/api/game?playerId=${playerId}&forceNewGame=${
      forceNewGame === true ? "true" : "false"
    }`
  );
  fetchedGame = await response.json();

  isFetchingGame = false;
  return fetchedGame;
};

type AppContext = {
  playerId: string;
  game: GameTypes.Game;
  fetchGame: (forceNewGame?: boolean) => Promise<GameTypes.Game>;
  setGame: (game: GameTypes.Game | null) => void;
  gameResult: string | null;
  isMyMove: boolean;
};

const AppContext = createContext<AppContext>({
  // Set defaults
  playerId,
  fetchGame,
  game: emptyGame(),
  setGame: () => {},
  gameResult: null,
  isMyMove: false,
});

export const useAppContext = () => useContext(AppContext);

export default function App() {
  // Generate and store a unique player ID
  // Save it in local storage so that it persists across page reloads

  // const [playerId] = useSafeLocalStorage<string>("playerId", uuid(), "string");

  const [game, setGame] = useState<GameTypes.Game>(emptyGame);

  // Fetch a game on mount
  useEffect(() => {
    fetchGame()
      .then((currentGame) => {
        setGame(currentGame);
      })
      .catch((error) => console.log(error));
  }, []);

  // The result of the game, if it's been concluded.
  const gameResult = useMemo(() => {
    if (!game?.state?.grid) return null;

    return getGameResult(game?.state.grid);
  }, [game?.state?.grid]);

  // Is it the current player's move?
  const isMyMove = useMemo(() => {
    if (!game) return false;

    const playerIsFirst = game.players[0] === playerId;
    return isPlayersMove(playerIsFirst, game.state.grid);
  }, [game]);

  return (
    <AblyProvider client={client}>
      <AppContext.Provider
        value={
          {
            playerId,
            game: game as GameTypes.Game,
            fetchGame,
            setGame,
            gameResult,
            isMyMove,
          } as AppContext
        }
      >
        <main className="flex min-h-screen flex-col items-center p-24">
          <h1 className="text-xl mb-5 font-bold">Tic-Tac-Toe</h1>
          {game.id && <Game />}
        </main>
      </AppContext.Provider>
    </AblyProvider>
  );
}
