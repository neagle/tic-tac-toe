import { useEffect, useState } from "react";
import * as Ably from "ably";
import { useChannel, usePresence } from "ably/react";

const TYPING_TIMEOUT = 2000;

type ChatProps = {
  playerId: string;
  players: string[];
  gameId: string;
};

type Message = {
  clientId: string;
  text: string;
  timestamp: number;
  id: string;
};

const playerNames = ["×", "○"];
const playerName = (playerId: string, players: string[]) => {
  return players[0] === playerId ? playerNames[0] : playerNames[1];
};

const Chat = ({ playerId, gameId, players }: ChatProps) => {
  const { channel } = useChannel(gameId, (message: Ably.Types.Message) => {
    const { name, clientId, data: text, timestamp, id } = message;
    console.log("message", message);
    if (name === "message") {
      setMessages((messages) => [
        ...messages,
        { clientId, text, timestamp, id },
      ]);
    }

    if (name === "startedTyping") {
      console.log("startedTyping", clientId);
      // updateStatus("is typing…");
      setWhoIsCurrentlyTyping((currentlyTyping) => [
        ...currentlyTyping,
        clientId,
      ]);
    }

    if (name === "stoppedTyping") {
      // updateStatus("");
      console.log("stoppedTyping", clientId);
      setWhoIsCurrentlyTyping((currentlyTyping) =>
        currentlyTyping.filter((id) => id !== clientId)
      );
    }
  });

  const [messages, setMessages] = useState<Message[]>([]);
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

  // Clear messages when the game changes
  useEffect(() => {
    setMessages([]);
  }, [gameId]);

  const { presenceData, updateStatus } = usePresence<string>("chat-status", "");
  const peers = presenceData.map((msg, index) => {
    // console.log("msg", msg);

    return (
      <li key={msg.id}>
        {msg.clientId}: {msg.data}
      </li>
    );
  });

  const opponentIsHere =
    presenceData.filter((presence) => presence.clientId !== playerId).length >
    0;

  const stopTyping = () => {
    console.log(`Final input value is: ${inputValue}`);
    setStartedTyping(false); // Reset the startedTyping state.
    channel.publish("stoppedTyping", playerId);
  };

  useEffect(() => {
    if (!hasMounted) return;

    // If the user hasn't started typing yet, log that they've started typing.
    if (!startedTyping) {
      console.log("User started typing");
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

    // DRY this out
    console.log("checking???", startedTyping, timer);

    if (startedTyping && timer) {
      console.log("Stop, stop, STOP!");
      clearTimeout(timer);
      setStartedTyping(false); // Reset the startedTyping state.
      channel.publish("stoppedTyping", playerId);
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    // console.log("--change--", text);

    setInputValue(text);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // console.log("--keydown--", event.key);
    if (event.key === "Enter" && inputValue !== "") {
      onSend();
    }
  };

  const opponentIsTyping = whoIsCurrentlyTyping.filter((id) => id !== playerId);
  const statusMessage =
    opponentIsTyping.length > 0
      ? `${playerName(opponentIsTyping[0], players)} is typing…`
      : "";

  return (
    <div className="flex flex-col h-full">
      <ul className="p-2 grow bg-white">
        {messages.map((message) => (
          <li key={message.id}>
            <b>{playerName(message.clientId, players)}:</b> {message.text}
          </li>
        ))}
        {opponentIsHere ? (
          ""
        ) : (
          <li className="text-gray-500">Your opponent has left the game.</li>
        )}
      </ul>
      {/* <ul>{peers}</ul> */}
      <div className="p-2 text-xs text-gray-500">
        {statusMessage ? statusMessage : "Chat"}
      </div>
      <div className="flex">
        <input
          className="p-2"
          type="text"
          autoFocus={true}
          onChange={onChange}
          onKeyDown={onKeyDown}
          value={inputValue}
        />
        <button className="p-2" onClick={onSend}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
