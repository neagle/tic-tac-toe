"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import useConditionalEffect from "./hooks/useConditionalEffect";
import * as Ably from "ably";
import { AblyProvider } from "ably/react";
import { useLocalStorage as _useLocalStorage } from "@uidotdev/usehooks";
import { v4 as uuid } from "uuid";
import { GameTypes } from "../types";
import Game from "./components/Game";
import { getGameResult, isPlayersMove } from "../gameUtils";

const DEBUG = "true";

const debug = (...args: any[]) =>
  DEBUG.toLowerCase() === "true" && console.log(...args);

export type GameStateContext = {
  playerId: string;
  game?: GameTypes.Game | null;
  fetchGame: (forceNewGame?: boolean) => void;
  setGame: (game: GameTypes.Game | null) => void;
  gameResult: string | null;
  debug: (...args: any[]) => void;
  isMyMove: boolean;
};

const GameContext = createContext<GameStateContext>({
  // Set defaults
  playerId: "",
  fetchGame: () => {},
  setGame: () => {},
  gameResult: null,
  isMyMove: false,
  debug,
});

export const useGameStateContext = () => useContext(GameContext);

// Wrap the useLocalStorage hook to prefix the key with a unique string
// This isn't such a big deal in deployment, where browsers namespace local
// storage by origin, but if you're developing different projects on your local
// box that all use localhost, it's nice to add a layer of namespacing to keep
// things separate.
const LOCAL_STORAGE_KEY = "TICTACTOE_";
const useLocalStorage = (key: string, initialValue: any) => {
  const prefixedKey = LOCAL_STORAGE_KEY + key;
  return _useLocalStorage(prefixedKey, initialValue);
};

export default function App() {
  // Generate and store a unique player ID
  // Save it in local storage so that it persists across page reloads
  const [playerId] = useLocalStorage("playerId", uuid());

  // Create an Ably client
  const client = useMemo(() => {
    return new Ably.Realtime.Promise({
      authUrl: "/api/ably/auth",
      clientId: playerId,
    });
  }, [playerId]);

  const [game, setGame] = useState<GameTypes.Game | null>(null);

  const fetchGame = useCallback(
    (forceNewGame = false) => {
      debug(`fetch new game (force? ${forceNewGame})`);
      // nit -- better way to change boolean to string
      fetch(
        `/api/game?playerId=${playerId}&forceNewGame=${
          forceNewGame === true ? "true" : "false"
        }`
      )
        .then((gameResponse) => gameResponse.json())
        .then((currentGame) => {
          debug("received game from server:", currentGame);
          // if (currentGame?.id !== game?.id) {
          //   debug("game changed, setting new game");
          //   setGame(currentGame as Game);
          // }
          setGame(currentGame as GameTypes.Game);
        });
    },
    [playerId, setGame]
  );

  // Once we have a playerId (or if it changes for some reason) fetch a game for
  // the user from the server. If the player has one going, it will resume the
  // game. If they don't, it will create a new one.
  useConditionalEffect(fetchGame, [playerId]);

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
  }, [game?.state?.grid, playerId]);

  return (
    <AblyProvider client={client}>
      {game !== null && (
        <GameContext.Provider
          value={{
            playerId,
            game,
            fetchGame,
            setGame,
            gameResult,
            isMyMove,
            debug,
          }}
        >
          <main className="flex min-h-screen flex-col items-center p-24">
            <h1 className="text-xl mb-5 font-bold">Tic-Tac-Toe</h1>
            <Game />
          </main>
        </GameContext.Provider>
      )}
    </AblyProvider>
  );
}
