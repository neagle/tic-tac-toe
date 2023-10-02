import { useEffect, useMemo, useState } from "react";
import { usePresence } from "ably/react";
import { useGameStateContext } from "../../app";

// This component shows a message if the opponent has left the game.
// It also provides an important link to restart the game if the opponent has
// abandoned an in-progress game.
const OpponentStatus = () => {
  const { playerId, game, gameResult, fetchGame } = useGameStateContext();
  if (!game) return;

  // Use Ably's presence API to determine if the opponent is still connected
  const { presenceData } = usePresence<string>(game.id, "present");

  const [shouldShowOpponentMessage, setShouldShowOpponentMessage] =
    useState(false);

  const opponentId = useMemo(
    () => game.players.filter((id) => id !== playerId)[0],
    [game.players, playerId]
  );

  const opponentIsHere = useMemo(
    () =>
      Boolean(
        presenceData.find((presence) => presence.clientId === opponentId)
      ),
    [presenceData, opponentId]
  );

  // Only show the opponent's status after a delay. This prevents an initial
  // flicker in the chat window as the game gets underway.
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (!opponentIsHere) {
      timer = setTimeout(() => {
        setShouldShowOpponentMessage(true);
      }, 1000);
    } else {
      if (timer) {
        clearTimeout(timer);
      }
      setShouldShowOpponentMessage(false);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [opponentIsHere]);

  return (
    <>
      {shouldShowOpponentMessage && !opponentIsHere ? (
        <li className="text-gray-500">Your opponent has left the&nbsp;game.</li>
      ) : null}
      {shouldShowOpponentMessage && !opponentIsHere && !gameResult ? (
        <li className="mt-2">
          <a
            onClick={() => {
              fetchGame(true);
            }}
            className="cursor-pointer underline underline-offset-2 text-blue-500"
          >
            Play again?
          </a>
        </li>
      ) : null}
    </>
  );
};

export default OpponentStatus;
