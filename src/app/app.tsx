"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useConditionalEffect from "./hooks/useConditionalEffect";
import * as Ably from "ably";
import { AblyProvider } from "ably/react";
import { useLocalStorage as _useLocalStorage } from "@uidotdev/usehooks";
import { v4 as uuid } from "uuid";
import Grid from "./components/grid/Grid";
import Chat from "./components/chat/Chat";
import { getGameResult } from "../../gameUtils";

const LOCAL_STORAGE_KEY = "TICTACTOE_";
const useLocalStorage = (key: string, initialValue: any) => {
  const prefixedKey = LOCAL_STORAGE_KEY + key;
  return _useLocalStorage(prefixedKey, initialValue);
};

export default function App() {
  // Generate and store a unique player ID
  const [playerId] = useLocalStorage("playerId", uuid());
  console.log("playerId", playerId);

  const client = useMemo(() => {
    return new Ably.Realtime.Promise({
      authUrl: "/api/ably/auth",
      clientId: playerId,
    });
  }, []);

  const [channel, setChannel] =
    useState<Ably.Types.RealtimeChannelPromise | null>(null);
  const [game, setGame] = useLocalStorage("game", null);

  const fetchGame = useCallback(() => {
    console.log("fetch the current game", playerId);
    fetch(`/api/game?playerId=${playerId}`)
      .then((gameResponse) => gameResponse.json())
      .then((currentGame) => {
        console.log("currentGame", currentGame);

        setGame(currentGame);
      });
  }, [playerId, setGame]);

  useConditionalEffect(fetchGame, [playerId]);

  // Subscribe to game events
  useEffect(() => {
    if (!client) return;

    console.log("subscribe to events for the game channel");
    const gameChannel = client.channels.get(game.id);
    setChannel(game.id);

    gameChannel.subscribe("update", (message: Ably.Types.Message) => {
      console.log("update!", message);
      setGame(message.data);
    });

    gameChannel.subscribe("event", (message: Ably.Types.Message) => {
      console.log("event", message);
    });

    return () => {
      if (channel) {
        // TODO: Make sure this does the needful
        gameChannel.unsubscribe("update");
        gameChannel.unsubscribe("event");
      }
    };
  }, [client, game.id]);

  // Check game state
  const gameResult = useMemo(() => {
    console.log("grid has changed");
    return getGameResult(game?.state.grid);
  }, [game?.state.grid]);

  return (
    <AblyProvider client={client}>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <h1 className="text-xl mb-5">Tic-Tac-Toe</h1>
        <div className="flex">
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
            <div className="">
              <Chat
                playerId={playerId}
                gameId={game.id}
                players={game.players}
              />
            </div>
          )}
        </div>
      </main>
    </AblyProvider>
  );
}
