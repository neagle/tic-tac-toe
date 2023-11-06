import { useEffect, useState } from "react";
import * as Ably from "ably/promises";

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

  useEffect(() => {
    // Declare the user present on the channel
    void channel.presence.enter("");
  }, [channel]);

  const stopTyping = () => {
    setStartedTyping(false);
    void channel.presence.update({ typing: false });
  };

  const onType = (inputValue: string) => {
    if (!startedTyping) {
      setStartedTyping(true);
      void channel.presence.update({ typing: true });
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
    const handlePresenceUpdate = (
      update: Ably.Types.PresenceMessage,
    ) => {
      const { data, clientId } = update;

      if (data?.typing) {
        setWhoIsCurrentlyTyping((currentlyTyping) => [
          ...currentlyTyping,
          clientId,
        ]);
      } else {
        setWhoIsCurrentlyTyping((currentlyTyping) =>
          currentlyTyping.filter((id) => id !== clientId)
        );
      }
    };

    void channel.presence.subscribe(
      "update",
      handlePresenceUpdate,
    );

    // Clean up function
    return () => {
      channel.presence.unsubscribe("update");
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [channel, timer]);

  return { onType, whoIsCurrentlyTyping };
};

export default useTypingStatus;
