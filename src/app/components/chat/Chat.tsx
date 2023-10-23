import { useEffect, useState } from "react";
import { useAppContext } from "../../app";
import { useChannel } from "ably/react";
import * as ChatTypes from "../../../types/Chat";
import * as Ably from "ably/promises";
import { playerName, playerNames } from "../../../gameUtils";
import classnames from "classnames";

const Chat = () => {
  const { game } = useAppContext();

  const [messages, setMessages] = useState<ChatTypes.Message[]>([]);

  const onMessage = (message: Ably.Types.Message) => {
    const { name, clientId, data, timestamp, id } = message;
    if (name === "message") {
      setMessages((messages) => [
        ...messages,
        { clientId, text: data, timestamp, id },
      ]);
    }
  };

  const { channel } = useChannel(`[?rewind=100]game:${game.id}`, onMessage);

  // Clear the chat when the game changes
  useEffect(() => {
    setMessages([]);
  }, [game.id]);

  // State for the chat text input
  const [inputValue, setInputValue] = useState<string>("");

  const onSend = () => {
    channel.publish("message", inputValue);
    setInputValue("");
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
              <li key={message.id} className="group/message">
                <b
                  className={classnames(
                    {
                      "text-orange-400": name === playerNames[0],
                      "text-green-600": name === playerNames[1],
                    },
                    ["font-mono"]
                  )}
                >
                  {name}:
                </b>{" "}
                {message.text}
              </li>
            );
          }
        })}
      </ul>
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
