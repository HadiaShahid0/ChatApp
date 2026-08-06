import { useEffect, useRef, useState } from "react";
import {
  getMessages,
  getOrCreateConversation,
  sendMessage,
  sendImage,
  markSeen,
} from "../services/chatServices";
import { sendGroupMessage, getGroups } from "../services/groupServices";
import MessageBubble from "./messageBubble";
import MessageInput from "./messageInput";
import socket from "../../../services/socket";
import GroupInfoModal from "./group/groupInfoModal";
const ChatWindow = ({ currentUser, selectedUser, setConversations }) => {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState("");
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const bottomRef = useRef(null);

  const loadMessages = async (conversationId) => {
    try {
      const response = await getMessages(conversationId);

      if (response.success) {
        setMessages(response.messages);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const loadConversation = async () => {
    if (!selectedUser) return;

    try {
      // Group selected
      if (selectedUser.isGroup) {
        setConversation(selectedUser);
        await loadMessages(selectedUser._id);
        return;
      }

      // Private chat
      const response = await getOrCreateConversation(selectedUser._id);

      if (response.success) {
        setConversation(response.conversation);
        await loadMessages(response.conversation._id);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleSend = async (text) => {
    try {
      let response;

      if (conversation.isGroup) {
        response = await sendGroupMessage(conversation._id, text);
      } else {
        response = await sendMessage(selectedUser._id, text);
      }

      if (!response.success) return;

      setMessages((prev) => [...prev, response.data]);

      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === response.data.conversation._id
            ? {
                ...conv,
                lastMessage: response.data,
              }
            : conv,
        ),
      );

      // Notify other group members
      if (conversation.isGroup) {
        socket.emit("newGroupMessage", {
          groupId: conversation._id,
          message: response.data,
        });
      }
    } catch (err) {
      console.log(err);
    }
  };
  const handleImageSend = async (file) => {
    try {
      const response = await sendImage(selectedUser._id, file);

      if (!response.success) return;

      // Show image immediately
      setMessages((prev) => [...prev, response.data]);

      // Update sidebar
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === response.data.conversation._id
            ? {
                ...conv,
                lastMessage: response.data,
              }
            : conv,
        ),
      );
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversation();
  }, [selectedUser]);

  useEffect(() => {
    if (!conversation) return;

    const seenMessages = async () => {
      try {
        await markSeen(conversation._id);

        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === conversation._id
              ? {
                  ...conv,
                  unreadCount: 0,
                }
              : conv,
          ),
        );
      } catch (err) {
        console.log(err);
      }
    };

    seenMessages();
  }, [conversation]);

  useEffect(() => {
    const groupUpdatedHandler = async ({ groupId }) => {
      if (conversation?._id !== groupId) return;

      const res = await getGroups();

      if (!res.success) return;

      const updatedGroup = res.groups.find((g) => g._id === groupId);

      if (!updatedGroup) return;

      setConversation(updatedGroup);
    };

    // Socket event listeners for events like receiving messages, typing indicators, and message delivery confirmations
    const receiveMessage = async (message) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv._id !== message.conversation._id) return conv;

          const opened = conv._id === conversation?._id;

          return {
            ...conv,
            lastMessage: message,
            unreadCount:
              message.sender._id === currentUser._id
                ? 0
                : opened
                  ? 0
                  : (conv.unreadCount || 0) + 1,
          };
        });
        return updated;
      });

      if (conversation?._id !== message.conversation._id) return;

      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;

        return [...prev, message];
      });

      if (message.sender._id !== currentUser._id) {
        await markSeen(message.conversation._id);
        console.log("Receiver got:", message._id);
        socket.emit("messageDelivered", {
          messageId: message._id,
          senderId: message.sender._id,
        });
      }
    };

    const typingHandler = ({ senderId }) => {
      if (conversation?.isGroup) return;

      if (selectedUser?._id === senderId) {
        setTyping("typing...");
      }
    };

    const stopTypingHandler = ({ senderId }) => {
      if (selectedUser?._id === senderId) {
        setTyping("");
      }
    };

    const seenHandler = ({ conversationId }) => {
      if (conversationId !== conversation?._id) return;

      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          seen: true,
        })),
      );
    };

    const deliveredHandler = ({ messageId }) => {
      console.log("Sender received delivered:", messageId);

      setMessages((prev) => {
        console.log("Current messages:", prev);

        const updated = prev.map((msg) =>
          msg._id === messageId ? { ...msg, delivered: true } : msg,
        );

        console.log("Updated messages:", updated);

        return updated;
      });
    };
    const newGroupMessageHandler = (message) => {
      if (conversation?._id !== message.conversation._id) return;

      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;

        return [...prev, message];
      });
    };
    const memberAddedHandler = ({ group }) => {
      if (conversation?._id !== group._id) return;

      setConversation(group);

      setConversations((prev) =>
        prev.map((c) => (c._id === group._id ? group : c)),
      );
    };
    const memberRemovedHandler = ({ group }) => {
      if (conversation?._id !== group._id) return;

      setConversation(group);

      setConversations((prev) =>
        prev.map((c) => (c._id === group._id ? group : c)),
      );
    };

    socket.on("receiveMessage", receiveMessage);
    socket.on("typing", typingHandler);
    socket.on("stopTyping", stopTypingHandler);
    socket.on("messagesSeen", seenHandler);
    socket.on("messageDelivered", deliveredHandler);
    socket.on("newGroupMessage", newGroupMessageHandler);
    socket.on("groupUpdated", groupUpdatedHandler);
    socket.on("addMember", memberAddedHandler);
    socket.on("memberRemoved", memberRemovedHandler);
    return () => {
      socket.off("receiveMessage", receiveMessage);
      socket.off("typing", typingHandler);
      socket.off("stopTyping", stopTypingHandler);
      socket.off("messagesSeen", seenHandler);
      socket.off("messageDelivered", deliveredHandler);
      socket.off("groupUpdated", groupUpdatedHandler);
      socket.off("addMember", memberAddedHandler);
      socket.off("memberRemoved", memberRemovedHandler);
      socket.off("newGroupMessage", newGroupMessageHandler);
    };
  }, [conversation, currentUser, selectedUser, setConversations]);
  useEffect(() => {
    if (conversation?.isGroup) {
      socket.emit("joinGroup", {
        groupId: conversation._id,
      });
    }
  }, [conversation]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  if (!selectedUser) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <h4 className="text-muted">Select a user to start chatting</h4>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100">
      <div
        className="border-bottom p-3 bg-white"
        style={{
          cursor: conversation?.isGroup ? "pointer" : "default",
        }}
        onClick={() => {
          if (conversation?.isGroup) {
            setShowGroupInfo(true);
          }
        }}
      >
        <div className="d-flex align-items-center">
          <img
            src={
              conversation?.isGroup
                ? conversation.groupImage
                  ? `http://localhost:5000/${conversation.groupImage}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      conversation.groupName,
                    )}`
                : selectedUser.profileImage
                  ? `http://localhost:5000/${selectedUser.profileImage}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      selectedUser.name,
                    )}`
            }
            className="rounded-circle me-3"
            width="50"
            height="50"
            alt=""
          />

          <div>
            <h5 className="mb-0">
              {conversation?.isGroup
                ? conversation.groupName
                : selectedUser.name}
            </h5>

            <div className="d-flex align-items-center gap-2 small">
              <span
                className={
                  conversation?.isGroup
                    ? "text-secondary"
                    : selectedUser.status === "online"
                      ? "text-success"
                      : "text-secondary"
                }
              >
                {conversation?.isGroup
                  ? `${conversation.participants.length} members`
                  : selectedUser.status}
              </span>

              {typing && !conversation?.isGroup && (
                <>
                  <span>|</span>
                  <span className="text-success">{typing}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        className="flex-grow-1 p-3"
        style={{
          overflowY: "auto",
          background: "#f5f5f5",
        }}
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            currentUser={currentUser}
            isGroup={conversation?.isGroup}
          />
        ))}

        <div ref={bottomRef}></div>
      </div>

      <MessageInput
        onSend={handleSend}
        onImageSend={handleImageSend}
        currentUser={currentUser}
        selectedUser={selectedUser}
      />
      {showGroupInfo && (
        <GroupInfoModal
          group={conversation}
          currentUser={currentUser}
          close={() => setShowGroupInfo(false)}
          refresh={() => {
            setShowGroupInfo(false);
          }}
        />
      )}
    </div>
  );
};

export default ChatWindow;
