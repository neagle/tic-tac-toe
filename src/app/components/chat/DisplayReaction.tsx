import * as Ably from "ably";
import { useAppContext } from "../../app";
import { playerName, playerNames } from "../../../gameUtils";
import classnames from "classnames";

type DisplayReactionProps = {
  reaction: Ably.Types.Message;
};

const DisplayReaction = ({ reaction }: DisplayReactionProps) => {
  const { game } = useAppContext();
  const name = playerName(reaction.clientId, game.players);

  return (
    <div className="ml-4">
      <span className="text-xs relative -top-1 text-gray-500">⮑</span>{" "}
      <span
        className={classnames(
          {
            "text-orange-400": name === playerNames[0],
            "text-green-600": name === playerNames[1],
          },
          ["mr-1"]
        )}
      >
        {name}:
      </span>
      {reaction.data.body}
    </div>
  );
};

export default DisplayReaction;
