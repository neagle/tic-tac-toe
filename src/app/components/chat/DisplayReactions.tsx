import * as Ably from "ably";
import classnames from "classnames";

type DisplayReactionsProps = {
  reactions: Ably.Types.Message[];
};

const DisplayReactions = ({ reactions }: DisplayReactionsProps) => {
  return (
    <div className="ml-4">
      {reactions.map((reaction) => (
        <b key={reaction.id} className={classnames(["m-1"])}>
          {reaction.data.body}
        </b>
      ))}
    </div>
  );
};

export default DisplayReactions;
