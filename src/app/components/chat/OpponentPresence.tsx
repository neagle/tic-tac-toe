import { useEffect, useState } from "react";
// import { usePresence } from "ably/react";
// import { usePresence } from "../../../../node_modules/ably/src/platform/react-hooks/src/hooks/usePresence";
import { useAppContext } from "../../app";
import { useGameContext } from "../Game";

// This component shows a message if the opponent has left the game.
// It also provides an important link to restart the game if the opponent has
// abandoned an in-progress game.

const OpponentStatus = () => {
  const { game, gameResult, fetchGame, setGame } = useAppContext();
  const { opponentIsPresent } = useGameContext();

  useEffect(() => {
    console.log("OpponentStatus component mount", game.id);
    return () => {
      console.log("OpponentStatus component unmount", game.id);
    };
  }, [game.id]);

  const [shouldShowOpponentMessage, setShouldShowOpponentMessage] =
    useState(false);

  // Only show the opponent's status after a delay. This prevents an initial
  // flicker in the chat window as the game gets underway.
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (!opponentIsPresent) {
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
  }, [opponentIsPresent]);

  return (
    <>
      {shouldShowOpponentMessage && !opponentIsPresent ? (
        <li className="text-gray-500">Your opponent has left the&nbsp;game.</li>
      ) : null}
      {shouldShowOpponentMessage && !opponentIsPresent && !gameResult ? (
        <li className="mt-2">
          <a
            onClick={() => {
              fetchGame(true)
                .then(setGame)
                .catch((error) => console.log(error));
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
