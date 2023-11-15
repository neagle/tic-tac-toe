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

  // const { channel } = useChannel(`[?rewind=100]game:${game.id}`, onMessage);
  const { channel } = useChannel(
    `game:${game.id}`,
    (message: Ably.Types.Message) => console.log("message:", message)
  );

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
    <div className="chat">
      <div>
        <ul className="messages">
          {messages.map((message) => {
            const name = playerName(message.clientId, game.players);
            const isSystemMessage = !Boolean(name);

            if (isSystemMessage) {
              return (
                <li key={message.id} className="system-message">
                  {message.text}
                </li>
              );
            } else {
              return (
                <li key={message.id} className="user-message">
                  <b
                    className={classnames({
                      "player-x": name === playerNames[0],
                      "player-o": name === playerNames[1],
                    })}
                  >
                    {name}:
                  </b>{" "}
                  {message.text}
                </li>
              );
            }
          })}
        </ul>
        <div className="chat-input">
          <input
            type="text"
            autoFocus={true}
            onChange={onChange}
            onKeyDown={onKeyDown}
            value={inputValue}
          />
          <button onClick={onSend} disabled={inputValue === ""}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
