import { createContext, useContext, useMemo } from "react";
import * as Ably from "ably";
import { useChannel } from "ably/react";
import usePresence from "./usePresence";
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

  const { presentInChannel } = usePresence(channel);

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
