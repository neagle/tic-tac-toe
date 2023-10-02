import { useEffect, useState } from "react";
import Ably from "ably/promises";

// This hook is used to track which players are currently typing in a chat
// Example Usage:
//  const { onType, whoIsCurrentlyTyping } = useTypingStatus(channel, playerId);
// <input onChange={(e) => onType(e.target.value)} />
// {whoIsCurrentlyTyping.map((playerId) => (
//   <p key={playerId}>{playerId} is typing...</p>
// ))}
const useTypingStatus = (
  channel: Ably.Types.RealtimeChannelPromise,
  playerId: string,
  // How long to wait before considering a player to have stopped typing
  timeoutDuration = 2000,
) => {
  const [startedTyping, setStartedTyping] = useState(false);
  const [whoIsCurrentlyTyping, setWhoIsCurrentlyTyping] = useState<string[]>(
    [],
  );
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const stopTyping = () => {
    setStartedTyping(false);
    channel.publish("stoppedTyping", playerId);
  };

  const onType = (inputValue: string) => {
    if (!startedTyping) {
      setStartedTyping(true);
      channel.publish("startedTyping", playerId);
    }

    if (timer) {
      clearTimeout(timer);
    }

    if (inputValue === "") {
      // Allow the typing indicator to be turned off immediately -- an empty
      // string usually indicates either a sent message or a cleared input
      stopTyping();
    } else {
      const newTimer = setTimeout(stopTyping, timeoutDuration);
      setTimer(newTimer);
    }
  };

  useEffect(() => {
    const handleAblyMessage = (message: Ably.Types.Message) => {
      const { name, clientId } = message;

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
    };

    channel.subscribe(handleAblyMessage);

    return () => {
      channel.unsubscribe(handleAblyMessage);
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [channel]);

  return { onType, whoIsCurrentlyTyping };
};

export default useTypingStatus;
