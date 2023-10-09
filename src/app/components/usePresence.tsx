import { useEffect, useState } from "react";
import * as Ably from "ably/promises";

const usePresence = (channel: Ably.Types.RealtimeChannelPromise) => {
  const [presentInChannel, setPresentInChannel] = useState<string[]>([]);
  const addToPresentInChannel = (id: string) => {
    setPresentInChannel((presentInChannel) => {
      return !presentInChannel.includes(id)
        ? [...presentInChannel, id]
        : presentInChannel;
    });
  };

  const removeFromPresentInChannel = (id: string) => {
    setPresentInChannel((currentPresent) =>
      currentPresent.filter((clientId) => clientId !== id)
    );
  };

  useEffect(() => {
    // Get the initial list of who is present in the channel
    channel.presence
      .get()
      .then((presenceData: Ably.Types.PresenceMessage[]) => {
        presenceData.forEach((presence: Ably.Types.PresenceMessage) => {
          addToPresentInChannel(presence.clientId);
        });
      })
      .catch((error: Error) => {
        console.log("error getting presence data", error);
      });

    // Enter the channel
    void channel.presence.enter("present");

    // Subscribe to enter/leave
    channel.presence
      .subscribe("enter", (presence: Ably.Types.PresenceMessage) =>
        addToPresentInChannel(presence.clientId)
      )
      .catch((error: Error) =>
        console.log("error subscribing to enter", error)
      );
    channel.presence
      .subscribe("leave", (presence: Ably.Types.PresenceMessage) =>
        removeFromPresentInChannel(presence.clientId)
      )
      .catch((error: Error) =>
        console.log("error subscribing to leave", error)
      );
    return () => {
      // Leave the channel
      void channel.presence.leave();

      // Clean up subscriptions
      channel.presence.unsubscribe("enter");
      channel.presence.unsubscribe("leave");
    };
  }, [channel]);

  return { presentInChannel };
};

export default usePresence;
