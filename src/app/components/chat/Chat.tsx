import { useContext, useEffect, useMemo, useState } from "react";
import * as Ably from "ably";
import { useChannel, usePresence } from "ably/react";
import { playerNames } from "../../../gameUtils";
import { ChatTypes } from "../../../types";
import { useGameStateContext } from "../../app";

const TYPING_TIMEOUT = 2000;

const playerName = (playerId: string, players: string[]) => {
  if (playerId === players[0]) {
    return playerNames[0];
  } else if (playerId === players[1]) {
    return playerNames[1];
  } else {
    return;
  }
};

const Chat = () => {
  const { playerId, game, setGame, fetchGame, gameResult } =
    useGameStateContext();

  if (!game) return;

  const { channel } = useChannel(game.id, (message: Ably.Types.Message) => {
    const { name, clientId, data: text, timestamp, id } = message;
    if (name === "message") {
      setMessages((messages) => [
        ...messages,
        { clientId, text, timestamp, id },
      ]);
    }

    if (name === "startedTyping") {
      setWhoIsCurrentlyTyping((currentlyTyping) => [
        ...currentlyTyping,
        clientId,
      ]);
    }

    if (name === "stoppedTyping") {
      setWhoIsCurrentlyTyping((currentlyTyping) =>
        currentlyTyping.filter((id) => id !== clientId)
      );
    }
  });

  const opponentId = game.players.filter((id) => id !== playerId)[0];

  const [messages, setMessages] = useState<ChatTypes.Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [startedTyping, setStartedTyping] = useState(false);
  const [whoIsCurrentlyTyping, setWhoIsCurrentlyTyping] = useState<string[]>(
    []
  );
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { presenceData } = usePresence<string>(game.id, "present");

  const [shouldShowOpponentMessage, setShouldShowOpponentMessage] =
    useState(false);

  const opponentIsHere = useMemo(
    () => !!presenceData.find((presence) => presence.clientId === opponentId),
    [presenceData, opponentId]
  );

  // Create a delay before we show any messages about the opponent leaving.
  // This gives them a chance to reconnect, AND it prevents any flickering of
  // this message when the game is initially created.
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined = undefined;

    if (!opponentIsHere) {
      timer = setTimeout(() => {
        setShouldShowOpponentMessage(true);
      }, 2000);
    } else {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      setShouldShowOpponentMessage(false);
    }

    return () => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [opponentIsHere]);

  const stopTyping = () => {
    setStartedTyping(false); // Reset the startedTyping state.
    channel.publish("stoppedTyping", playerId);
  };

  useEffect(() => {
    if (!hasMounted) return;

    // If the user hasn't started typing yet, log that they've started typing.
    if (!startedTyping) {
      setStartedTyping(true);
      channel.publish("startedTyping", playerId);
    }

    // Clear the existing timer if any
    if (timer) {
      clearTimeout(timer);
    }

    if (inputValue === "") {
      // Send the stopped typing thing right away if there's no value -- this
      // handles when we've just sent a message.
      stopTyping();
    } else {
      // Set a new timer
      const newTimer = setTimeout(stopTyping, TYPING_TIMEOUT);
      setTimer(newTimer);
    }

    // Cleanup
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [inputValue]);

  const onSend = () => {
    channel.publish("message", inputValue);
    setInputValue("");

    if (startedTyping && timer) {
      clearTimeout(timer);
      setStartedTyping(false); // Reset the startedTyping state.
      channel.publish("stoppedTyping", playerId);
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setInputValue(text);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && inputValue !== "") {
      onSend();
    }
  };

  const opponentIsTyping = whoIsCurrentlyTyping.filter((id) => id !== playerId);
  const statusMessage =
    opponentIsTyping.length > 0
      ? `${playerName(opponentIsTyping[0], game.players)} is typing…`
      : "";

  return (
    <div className="flex flex-col h-full">
      <ul className="p-2 grow bg-white min-h-[200px] sm:min-h-0">
        {messages.map((message) => {
          const name = playerName(message.clientId, game.players);

          if (name) {
            return (
              <li key={message.id}>
                <b>{name}:</b> {message.text}
              </li>
            );
          } else {
            return (
              <li key={message.id} className="text-gray-500">
                {message.text}
              </li>
            );
          }
        })}
        {shouldShowOpponentMessage && !opponentIsHere ? (
          <>
            <li className="text-gray-500">Your opponent has left the game.</li>
          </>
        ) : null}

        {shouldShowOpponentMessage && !opponentIsHere && !gameResult ? (
          <>
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
          </>
        ) : null}
      </ul>
      <div className="p-2 text-xs text-gray-500">
        {statusMessage ? statusMessage : "Chat"}
      </div>
      <div className="flex">
        <input
          className="grow p-2 focus:outline outline-4 outline-red-500"
          type="text"
          autoFocus={true}
          onChange={onChange}
          onKeyDown={onKeyDown}
          value={inputValue}
        />
        <button
          className="p-2 pr-0 disabled:opacity-50"
          onClick={onSend}
          disabled={inputValue === ""}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
