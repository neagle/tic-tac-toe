import * as Ably from "ably";
import { useChannel } from "ably/react";
import Grid from "./grid/Grid";
import Chat from "./chat/Chat";
import { useGameStateContext } from "../app";

const Game = () => {
  const { game, setGame } = useGameStateContext();

  if (!game) return;

  useChannel(game.id, (message: Ably.Types.Message) => {
    const { name, data } = message;

    if (name === "update") {
      setGame(data);
    }
  });

  return (
    <div className="flex flex-col sm:flex-row">
      <div className="text-center">
        <Grid />
      </div>
      {game.players?.length === 2 && (
        <div className="w-80">
          <Chat />
        </div>
      )}
    </div>
  );
};

export default Game;
