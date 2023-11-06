import { useEffect, useState } from "react";
import * as Ably from "ably";
import classnames from "classnames";
import { useChannel } from "ably/react";
import { playerName, playerNames } from "../../../gameUtils";
import * as ChatTypes from "../../../types/Chat";
import { useAppContext } from "../../app";
import useTypingStatus from "./useTypingStatus";
import Status from "./Status";
import OpponentPresence from "./OpponentPresence";
import CreateReaction from "./CreateReaction";
import DisplayReactions from "./DisplayReactions";

const Chat = () => {
  const { game, playerId } = useAppContext();

  const [messages, setMessages] = useState<ChatTypes.Message[]>([]);
  const [reactions, setReactions] = useState<
    Record<string, Ably.Types.Message[]>
  >({});

  const onMessage = (message: Ably.Types.Message) => {
    const { name, clientId, data, timestamp, id } = message;
    if (name === "message") {
      setMessages((messages) => [
        ...messages,
        { clientId, text: data, timestamp, id },
      ]);
    }

    if (name === "add-reaction") {
      setReactions((reactions) => {
        const newReactions = { ...reactions };
        const key = data.extras.reference.timeserial;

        // Create a new array if it doesn't exist
        if (!newReactions[key]) {
          newReactions[key] = [];
        }

        // Prevent duplicates
        if (!newReactions[key].find((reaction) => reaction.id === id)) {
          newReactions[key].push(message);
        }

        return newReactions;
      });
    }

    if (name === "remove-reaction") {
      setReactions((reactions) => {
        const newReactions = { ...reactions };
        const key = data.extras.reference.timeserial;
        newReactions[key] = newReactions[key]?.filter(
          (reaction) => reaction.data.body !== data.body
        );
        return newReactions;
      });
    }
  };

  const { channel } = useChannel(`[?rewind=100]game:${game.id}`, onMessage);

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
                  {message.clientId !== playerId && (
                    <CreateReaction
                      channel={channel}
                      message={message}
                      reactions={reactions[message.id]}
                    />
                  )}
                  {reactions[message.id] && (
                    <DisplayReactions reactions={reactions[message.id]} />
                  )}
                </li>
              );
            }
          })}
          <OpponentPresence />
        </ul>
        <Status whoIsCurrentlyTyping={whoIsCurrentlyTyping} />
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
