import * as Ably from "ably";
import * as ChatTypes from "../../../types/Chat";
import classnames from "classnames";
import { useAppContext } from "../../app";

type ReactionProps = {
  channel: Ably.Types.RealtimeChannelPromise;
  message: ChatTypes.Message;
  reactions: Ably.Types.Message[];
  className?: string;
};

const EMOJIS = ["🤘", "🤪", "😡", "😂", "😭"];

const Reaction = ({
  channel,
  message,
  reactions,
  className = "",
}: ReactionProps) => {
  const { playerId } = useAppContext();

  const handleReactionClick = async (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    if (event.target instanceof HTMLAnchorElement) {
      const emoji = event.target.textContent;
      if (!emoji) return;
      if (alreadyReacted(emoji)) {
        await channel.publish("remove-reaction", {
          body: emoji,
          extras: {
            reference: { type: "com.ably.reaction", timeserial: message.id },
          },
        });
      } else {
        await channel.publish("add-reaction", {
          body: emoji,
          extras: {
            reference: { type: "com.ably.reaction", timeserial: message.id },
          },
        });
      }
    }
  };

  const alreadyReacted = (emoji: string) => {
    return reactions?.length
      ? reactions
          .filter((reaction) => reaction.clientId === playerId)
          .find((reaction) => reaction.data.body === emoji)
      : false;
  };

  return (
    <span className={`create-reaction ${className}`}>
      <button>
        <span>🙂</span>
        <ul>
          {EMOJIS.map((emoji) => (
            <li key={emoji}>
              <a
                onClick={handleReactionClick}
                className={classnames({
                  selected: alreadyReacted(emoji),
                })}
              >
                {emoji}
              </a>
            </li>
          ))}
        </ul>
      </button>
    </span>
  );
};

export default Reaction;
