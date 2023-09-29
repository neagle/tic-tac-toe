"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useConditionalEffect from "./hooks/useConditionalEffect";
import * as Ably from "ably";
import { AblyProvider } from "ably/react";
import { useLocalStorage as _useLocalStorage } from "@uidotdev/usehooks";
import { v4 as uuid } from "uuid";
import Grid from "./components/grid/Grid";
import Chat from "./components/chat/Chat";
import { getGameResult } from "../gameUtils";
import { Game } from "../types";

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

  const [game, setGame] = useState<Game | null>(null);

  const fetchGame = useCallback(
    (forceNewGame = false) => {
      fetch(
        `/api/game?playerId=${playerId}&forceNewGame=${
          forceNewGame === true ? "true" : "false"
        }`
      )
        .then((gameResponse) => gameResponse.json())
        .then((currentGame) => {
          if (currentGame?.id !== game?.id) {
            setGame(currentGame as Game);
          }
        });
    },
    [playerId, setGame]
  );

  // Once we have a playerId (or if it changes for some reason) fetch a game for
  // the user from the server. If the player has one going, it will resume the
  // game. If they don't, it will create a new one.
  useConditionalEffect(fetchGame, [playerId]);

  // When the game.id changes, subscribe to updates on that game's channel
  // This is how we'll get updates when the other player makes a move
  useEffect(() => {
    if (!client || !game) return;

    const gameChannel = client.channels.get(game.id);
    gameChannel.presence.enter();

    gameChannel.subscribe("update", (message: Ably.Types.Message) => {
      setGame(message.data);
    });

    // Cleanup
    return () => {
      if (gameChannel) {
        gameChannel.unsubscribe("update");
      }
    };
  }, [client, game?.id]);

  // The result of the game, if it's been concluded.
  const gameResult = useMemo(() => {
    if (!game?.state?.grid) return null;

    return getGameResult(game?.state.grid);
  }, [game?.state?.grid]);

  return (
    <AblyProvider client={client}>
      <main className="flex min-h-screen flex-col items-center p-24">
        <h1 className="text-xl mb-5 font-bold">Tic-Tac-Toe</h1>
        <div className="flex flex-col sm:flex-row">
          <div className="text-center">
            {game && (
              <Grid
                playerId={playerId}
                setGame={setGame}
                game={game}
                gameResult={gameResult}
                fetchGame={fetchGame}
              />
            )}
          </div>
          {game && game.players.length === 2 && (
            <div className="w-80">
              <Chat
                playerId={playerId}
                gameId={game.id}
                players={game.players}
                setGame={setGame}
                fetchGame={fetchGame}
                gameResult={gameResult}
              />
            </div>
          )}
        </div>
      </main>
    </AblyProvider>
  );
}
