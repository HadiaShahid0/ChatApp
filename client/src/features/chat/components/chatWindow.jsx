import { useEffect, useRef, useState } from "react";
import {
  getMessages,
  getOrCreateConversation,
  sendMessage,
} from "../services/chatServices";
import MessageBubble from "./messageBubble";
import MessageInput from "./messageInput";
import socket from "../../../services/socket";

const ChatWindow = ({ currentUser, selectedUser }) => {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState("");

  const bottomRef = useRef(null);

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

  const handleSend = async (text) => {
    try {
      const response = await sendMessage(selectedUser._id, text);

      if (response.success) {
        setMessages((prev) => [...prev, response.data]);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversation();
  }, [selectedUser]);

  useEffect(() => {
    socket.on("receiveMessage", (message) => {
      if (message.conversation._id === conversation?._id) {
        setMessages((prev) => [...prev, message]);
      }
    });
    socket.on("typing", () => {
      setTyping(`typing...`);
    });

    socket.on("stopTyping", () => {
      setTyping("");
    });
    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("stopTyping");
    };
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
      {/* Header */}
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
        <span className="text-muted">|</span>
        <span className="text-success">{typing}</span>
      </>
    )}
  </div>
</div>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-grow-1 p-3"
        style={{
          overflowY: "auto",
          background: "#f5f5f5",
        }}
      >
        {messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            currentUser={currentUser}
          />
        ))}

        <div ref={bottomRef}></div>
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        selectedUser={selectedUser}
        currentUser={currentUser}
      />
    </div>
  );
};

export default ChatWindow;
