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
    <span
      className={classnames(["text-sm", "ml-2", "group/reactions", className])}
    >
      <span className="cursor-pointer text-blue-500 hover:text-blue-700 relative">
        <span className="opacity-50">🙂</span>
        <ul
          className={classnames([
            "opacity-0",
            "point-events-none",
            "group-hover/reactions:opacity-100",
            "group-hover/reactions:pointer-events-auto",
            "transition-all",
            "absolute",
            "bottom-0",
            "translate-y-full",
            "left-0",
            "flex",
            "border",
            "bg-white",
            "rounded-lg",
          ])}
        >
          {EMOJIS.map((emoji) => (
            <li key={emoji} className="inline-block">
              <a
                onClick={handleReactionClick}
                className={classnames(
                  {
                    "bg-green-500": alreadyReacted(emoji),
                  },
                  [
                    "rounded-full",
                    "cursor-pointer",
                    "inline-block",
                    "text-2xl",
                    "p-1",
                    "pt-0",
                    "origin-center",
                    "scale-75",
                    "hover:scale-100",
                    "transition-transform",
                  ]
                )}
              >
                {emoji}
              </a>
            </li>
          ))}
        </ul>
      </span>
    </span>
  );
};

export default Reaction;
