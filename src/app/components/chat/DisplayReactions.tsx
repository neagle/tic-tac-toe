import * as Ably from "ably";

type DisplayReactionsProps = {
  reactions: Ably.Types.Message[];
};

const DisplayReactions = ({ reactions }: DisplayReactionsProps) => {
  return (
    <div className="display-reactions">
      {reactions.map((reaction) => (
        <b key={reaction.id}>{reaction.data.body}</b>
      ))}
    </div>
  );
};

export default DisplayReactions;
