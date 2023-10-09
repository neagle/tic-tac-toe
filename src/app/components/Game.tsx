import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as Ably from "ably";
import { useChannel } from "ably/react";
import Grid from "./grid/Grid";
import Chat from "./chat/Chat";
import { useAppContext } from "../app";

type GameContext = {
  opponentId: string;
  opponentIsPresent: boolean;
};

const GameContext = createContext<GameContext>({
  // Set defaults
  opponentId: "",
  opponentIsPresent: false,
});

export const useGameContext = () => useContext(GameContext);

const Game = () => {
  const { game, playerId, setGame } = useAppContext();

  // Subscribe to updates from the game channel
  const { channel } = useChannel(game.id, (message: Ably.Types.Message) => {
    const { name, data } = message;

    if (name === "update") {
      setGame(data);
    }
  });

  const [presentInChannel, setPresentInChannel] = useState<string[]>([]);
  const addToPresentInChannel = (id: string) => {
    setPresentInChannel((presentInChannel) => {
      return !presentInChannel.includes(id)
        ? [...presentInChannel, id]
        : presentInChannel;
    });
  };

  const removeFromPresentInChannel = (id: string) => {
    setPresentInChannel((currentPresent) =>
      currentPresent.filter((clientId) => clientId !== id)
    );
  };

  useEffect(() => {
    // Get the initial list of who is present in the channel
    channel.presence
      .get()
      .then((presenceData: Ably.Types.PresenceMessage[]) => {
        presenceData.forEach((presence: Ably.Types.PresenceMessage) => {
          addToPresentInChannel(presence.clientId);
        });
      })
      .catch((error: Error) => {
        console.log("error getting presence data", error);
      });

    // Enter the channel
    channel.presence.enter("present");

    // Subscribe to enter/leave
    channel.presence.subscribe(
      "enter",
      (presence: Ably.Types.PresenceMessage) =>
        addToPresentInChannel(presence.clientId)
    );
    channel.presence.subscribe(
      "leave",
      (presence: Ably.Types.PresenceMessage) =>
        removeFromPresentInChannel(presence.clientId)
    );
    return () => {
      // Leave the channel
      channel.presence.leave();

      // Clean up subscriptions
      channel.presence.unsubscribe("enter");
      channel.presence.unsubscribe("leave");
    };
  }, [channel.name]);

  const opponentId = useMemo(
    () => game.players.filter((id) => id !== playerId)[0],
    [game.players, playerId]
  );

  const opponentIsPresent = useMemo(() => {
    return Boolean(
      presentInChannel.find((clientId) => clientId === opponentId)
    );
  }, [presentInChannel, opponentId]);

  return (
    <GameContext.Provider value={{ opponentId, opponentIsPresent }}>
      <div className="flex flex-col sm:flex-row">
        <div className="text-center">
          <Grid />
        </div>
        {game.players.length > 1 && (
          <div className="w-80">
            <Chat />
          </div>
        )}
      </div>
    </GameContext.Provider>
  );
};

export default Game;
