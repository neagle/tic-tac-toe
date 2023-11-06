import { useMemo } from "react";
import { useAppContext } from "../../app";
import { playerName } from "../../../gameUtils";

type StatusProps = {
  whoIsCurrentlyTyping: string[];
  defaultText?: string;
  className?: string;
};

const Status = ({
  whoIsCurrentlyTyping,
  defaultText = "Chat",
  className = "",
}: StatusProps) => {
  const { game, playerId } = useAppContext();

  // whoIsCurrentlyTyping tracks both players, but we only care about showing if
  // the opponent is currently typing.
  const opponentIsTyping = useMemo(
    () => whoIsCurrentlyTyping.filter((id: string) => id !== playerId),
    [whoIsCurrentlyTyping, playerId]
  );

  return (
    <div className={`status ${className}`}>
      {opponentIsTyping.length > 0
        ? `${playerName(opponentIsTyping[0], game.players)} is typing…`
        : defaultText}
    </div>
  );
};

export default Status;
