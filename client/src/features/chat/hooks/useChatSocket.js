import { useEffect } from "react";
import socket from "../../../services/socket";
import { markSeen } from "../services/chatServices";

const useChatSocket = ({
  conversation,
  currentUser,
  selectedUser,
  setMessages,
  setTyping,
  setConversation,
  setConversations,
  updateConversation,
  updateGroupConversation,
}) => {
  useEffect(() => {
    const groupUpdatedHandler = ({ group }) => {
      updateGroupConversation(group);

      if (conversation?._id === group._id) {
        setConversation(group);
      }
    };
    const receiveGroupMessage = async (message) => {
      // Update sidebar
      updateConversation(message);

      // Don't process our own message as received
      if (String(message.sender?._id) === String(currentUser._id)) {
        return;
      }

      // Only process if this is the currently opened conversation
      if (String(conversation?._id) !== String(message.conversation?._id)) {
        // Still mark it delivered even if the group chat isn't open
        socket.emit("messageDelivered", {
          messageId: message._id,
          userId: currentUser._id,
        });

        return;
      }

      // Add message to current chat
      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(message._id))) {
          return prev;
        }

        return [...prev, message];
      });

      // Mark delivered
      socket.emit("messageDelivered", {
        messageId: message._id,
        userId: currentUser._id,
      });

      // Mark seen only if chat is visible
      if (document.visibilityState === "visible") {
        try {
          await markSeen(message.conversation._id);

          socket.emit("messagesSeen", {
            conversationId: message.conversation._id,
            userId: currentUser._id,
          });
        } catch (error) {
          console.log("Group seen error:", error);
        }
      }
    };
    // Socket event listeners for events like receiving messages, typing indicators, and message delivery confirmations
    const receiveMessage = async (message) => {
      updateConversation(message);

      if (message.sender._id === currentUser._id) {
        return;
      }

      socket.emit("messageDelivered", {
        messageId: message._id,
        userId: currentUser._id,
      });

      if (conversation?._id !== message.conversation._id) return;

      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;

        return [...prev, message];
      });

      if (
        conversation?._id === message.conversation._id &&
        document.visibilityState === "visible"
      ) {
        await markSeen(message.conversation._id);

        socket.emit("messagesSeen", {
          conversationId: message.conversation._id,
          userId: currentUser._id,
          messageIds: [message._id],
        });
      }
    };

    const typingHandler = ({ senderId, groupId, sender }) => {
      if (!conversation) return;

      // Private chat
      if (!conversation.isGroup) {
        if (selectedUser?._id !== senderId) return;
        setTyping("typing...");
        return;
      }

      // Group chat
      if (conversation._id !== groupId) return;

      if (senderId === currentUser._id) return;

      setTyping(`${sender} is typing...`);
    };

    const stopTypingHandler = ({ senderId, groupId }) => {
      if (!conversation) return;

      if (!conversation.isGroup) {
        if (selectedUser?._id === senderId) setTyping("");
        return;
      }

      if (conversation._id === groupId) setTyping("");
    };

    const seenHandler = ({ conversationId, userId, messageIds }) => {
      if (
        conversationId !== conversation?._id ||
        !userId ||
        !Array.isArray(messageIds)
      ) {
        return;
      }

      setMessages((prev) =>
        prev.map((msg) => {
          if (!messageIds.includes(msg._id)) {
            return msg;
          }

          const seenBy = msg.seenBy || [];

          const alreadySeen = seenBy.some(
            (id) => id && id.toString() === userId.toString(),
          );

          if (alreadySeen) {
            return msg;
          }

          return {
            ...msg,
            seenBy: [...seenBy, userId],
          };
        }),
      );
    };
    const deliveredHandler = ({ messageId, userId }) => {
      if (!messageId || !userId) return;

      setMessages((prev) =>
        prev.map((msg) => {
          if (String(msg._id) !== String(messageId)) {
            return msg;
          }

          const deliveredTo = Array.isArray(msg.deliveredTo)
            ? msg.deliveredTo.filter(Boolean)
            : [];

          const alreadyDelivered = deliveredTo.some(
            (id) => String(id?._id || id) === String(userId),
          );

          if (alreadyDelivered) {
            return msg;
          }

          return {
            ...msg,
            deliveredTo: [...deliveredTo, userId],
          };
        }),
      );
    };
    const newGroupCreatedHandler = ({ group }) => {
      if (!group?._id) return;

      setConversations((prev) => {
        const exists = prev.some(
          (conversation) => String(conversation._id) === String(group._id),
        );

        if (exists) {
          return prev;
        }

        return [group, ...prev];
      });
    };
    const memberAddedHandler = ({ group }) => {
      updateGroupConversation(group);

      if (conversation?._id === group._id) {
        setConversation(group);
      }
    };
    const memberRemovedHandler = ({ group }) => {
      updateGroupConversation(group);

      if (conversation?._id === group._id) {
        setConversation(group);
      }
    };

    const groupLeftHandler = ({ groupId }) => {
      setConversations((prev) => prev.filter((conv) => conv._id !== groupId));

      if (conversation?._id === groupId) {
        setConversation(null);
        setMessages([]);
      }
    };

    const groupDeletedHandler = ({ groupId }) => {
      setConversations((prev) => prev.filter((conv) => conv._id !== groupId));

      if (conversation?._id === groupId) {
        setConversation(null);
        setMessages([]);
      }
    };
    const removedFromGroupHandler = ({ groupId }) => {
      // Remove group from sidebar
      setConversations((prev) =>
        prev.filter((conv) => String(conv._id) !== String(groupId)),
      );

      // If removed user's current chat is this group,
      // close the conversation
      if (String(conversation?._id) === String(groupId)) {
        setConversation(null);
        setMessages([]);
      }
    };
    socket.on("newGroupCreated", newGroupCreatedHandler);
    socket.on("removedFromGroup", removedFromGroupHandler);
    socket.on("receiveMessage", receiveMessage);
    socket.on("typing", typingHandler);
    socket.on("stopTyping", stopTypingHandler);
    socket.on("messagesSeen", seenHandler);
    socket.on("messageDelivered", deliveredHandler);
    socket.on("newGroupMessage", receiveGroupMessage);
    socket.on("groupUpdated", groupUpdatedHandler);
    socket.on("addMember", memberAddedHandler);
    socket.on("memberRemoved", memberRemovedHandler);

    socket.on("groupLeft", groupLeftHandler);
    socket.on("groupDeleted", groupDeletedHandler);
    return () => {
      socket.off("removedFromGroup", removedFromGroupHandler);
      socket.off("newGroupCreated", newGroupCreatedHandler);
      socket.off("newGroupMessage", receiveGroupMessage);
      socket.off("receiveMessage", receiveMessage);
      socket.off("typing", typingHandler);
      socket.off("stopTyping", stopTypingHandler);
      socket.off("messagesSeen", seenHandler);
      socket.off("messageDelivered", deliveredHandler);
      socket.off("groupUpdated", groupUpdatedHandler);
      socket.off("addMember", memberAddedHandler);
      socket.off("groupLeft", groupLeftHandler);
      socket.off("groupDeleted", groupDeletedHandler);
      socket.off("memberRemoved", memberRemovedHandler);
    };
  }, [
    conversation,
    currentUser,
    selectedUser,
    setConversations,
    setMessages,
    setTyping,
    setConversation,
    updateConversation,
    updateGroupConversation,
  ]);

  useEffect(() => {
    if (conversation?.isGroup) {
      socket.emit("joinGroup", {
        groupId: conversation._id,
      });
    }
  }, [conversation]);
};

export default useChatSocket;
