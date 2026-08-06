import { useEffect, useRef, useState } from "react";
import {
  getMessages,
  getOrCreateConversation,
  sendMessage,
  markSeen,
} from "../services/chatServices";
import MessageBubble from "./messageBubble";
import MessageInput from "./messageInput";
import socket from "../../../services/socket";

const ChatWindow = ({ currentUser, selectedUser, setConversations }) => {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState("");

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
      const response = await getOrCreateConversation(selectedUser._id);

      if (response.success) {
        setConversation(response.conversation);
        loadMessages(response.conversation._id);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleSend = async (text) => {
    try {
      const response = await sendMessage(selectedUser._id, text);

      if (!response.success) return;

      // Show sender message immediately
      setMessages((prev) => [...prev, response.data]);

      // Update sidebar
      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv._id === response.data.conversation._id
            ? {
                ...conv,
                lastMessage: response.data,
                unreadCount: 0,
              }
            : conv,
        );

        updated.sort(
          (a, b) =>
            new Date(b.lastMessage?.createdAt || 0) -
            new Date(a.lastMessage?.createdAt || 0),
        );

        return updated;
      });
    } catch (error) {
      console.log(error);
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

    socket.on("receiveMessage", receiveMessage);
    socket.on("typing", typingHandler);
    socket.on("stopTyping", stopTypingHandler);
    socket.on("messagesSeen", seenHandler);
    socket.on("messageDelivered", deliveredHandler);

    return () => {
      socket.off("receiveMessage", receiveMessage);
      socket.off("typing", typingHandler);
      socket.off("stopTyping", stopTypingHandler);
      socket.off("messagesSeen", seenHandler);
      socket.off("messageDelivered", deliveredHandler);
    };
  }, [conversation, currentUser, selectedUser, setConversations]);

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
      <div className="border-bottom p-3 bg-white">
        <div className="d-flex align-items-center">
          <img
            src={
              selectedUser.profileImage
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
            <h5 className="mb-0">{selectedUser.name}</h5>

            <div className="d-flex align-items-center gap-2 small">
              <span
                className={
                  selectedUser.status === "online"
                    ? "text-success"
                    : "text-secondary"
                }
              >
                {selectedUser.status}
              </span>

              {typing && (
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
          />
        ))}

        <div ref={bottomRef}></div>
      </div>

      <MessageInput
        onSend={handleSend}
        currentUser={currentUser}
        selectedUser={selectedUser}
      />
    </div>
  );
};

export default ChatWindow;
