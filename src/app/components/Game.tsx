import { createContext, useContext, useMemo } from "react";
import * as Ably from "ably";
import { useChannel } from "ably/react";
import Grid from "./grid/Grid";
import Chat from "./chat/Chat";
import { useAppContext } from "../app";

type GameContext = {
  opponentId: string;
};

const GameContext = createContext<GameContext>({
  // Set defaults
  opponentId: "",
});

export const useGameContext = () => useContext(GameContext);

const Game = () => {
  const { game, playerId, setGame } = useAppContext();

  // Subscribe to updates from the game channel
  useChannel(`game:${game.id}`, (message: Ably.Types.Message) => {
    const { name, data } = message;

    if (name === "update") {
      setGame(data);
    }
  });

  const opponentId = useMemo(
    () => game.players.filter((id) => id !== playerId)[0],
    [game.players, playerId]
  );

  return (
    <GameContext.Provider value={{ opponentId }}>
      <div className="game">
        <Grid />
        {game.players.length > 1 && <Chat />}
      </div>
    </GameContext.Provider>
  );
};

export default Game;
