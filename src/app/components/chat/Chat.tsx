import { useEffect, useState } from "react";
import * as Ably from "ably";
import { useChannel } from "ably/react";
import { playerName, playerNames } from "../../../gameUtils";
import * as ChatTypes from "../../../types/Chat";
import { useAppContext } from "../../app";
import useTypingStatus from "./useTypingStatus";
import Status from "./Status";
import OpponentPresence from "./OpponentPresence";

const Chat = () => {
  const { game, playerId } = useAppContext();

  const [messages, setMessages] = useState<ChatTypes.Message[]>([]);

  const { channel } = useChannel(game.id, (message: Ably.Types.Message) => {
    const { name, clientId, data: text, timestamp, id } = message;
    if (name === "message") {
      setMessages((messages) => [
        ...messages,
        { clientId, text, timestamp, id },
      ]);
    }
  });

  useEffect(() => {
    console.log("channel name has changed!", channel.name);
    // channel.presence.enter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.name]);

  useEffect(() => {
    setMessages([]);
  }, [game.id]);

  // Maintain a list of who is currently typing so we can indicate that in the UI
  const { onType, whoIsCurrentlyTyping } = useTypingStatus(channel, playerId);

  // State for the chat text input
  const [inputValue, setInputValue] = useState<string>("");

  const onSend = () => {
    channel.publish("message", inputValue);
    // When a message is sent, we want to turn off the typing indicator
    // immediately.
    onType("");
    setInputValue("");
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setInputValue(text);
    onType(text);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && inputValue !== "") {
      onSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ul className="p-2 grow bg-white min-h-[200px] sm:min-h-0">
        {messages.map((message) => {
          const name = playerName(message.clientId, game.players);
          const isSystemMessage = !Boolean(name);

          if (isSystemMessage) {
            return (
              <li key={message.id} className="text-gray-500">
                {message.text}
              </li>
            );
          } else {
            return (
              <li key={message.id}>
                <b
                  className={`${
                    name === playerNames[0] ? "text-orange-400" : ""
                  } ${name === playerNames[1] ? "text-green-600" : ""}`}
                >
                  {name}:
                </b>{" "}
                {message.text}
              </li>
            );
          }
        })}
        <OpponentPresence />
      </ul>
      <Status
        whoIsCurrentlyTyping={whoIsCurrentlyTyping}
        className="p-2 text-xs text-gray-500"
      />
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
