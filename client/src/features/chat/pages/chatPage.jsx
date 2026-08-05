import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import socket from "../../../services/socket";
import { getConversations } from "../services/chatServices";
import ChatSidebar from "../components/chatSidebar";
import ChatWindow from "../components/chatWindow";

const Chat = () => {
  const { currentUser } = useOutletContext();
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  

  const loadConversations = async () => {
    try {
      const response = await getConversations();

      if (response.success) {
        setConversations(response.conversations);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations();
  }, []);

  useEffect(() => {
    const handleUserOnline = (userId) => {
      setConversations((prev) =>
        prev.map((conversation) => ({
          ...conversation,
          participants: conversation.participants.map((participant) =>
            participant._id === userId
              ? { ...participant, status: "online" }
              : participant,
          ),
        })),
      );

      setSelectedUser((prev) =>
        prev && prev._id === userId ? { ...prev, status: "online" } : prev,
      );
    };

    const handleUserOffline = (userId) => {
      setConversations((prev) =>
        prev.map((conversation) => ({
          ...conversation,
          participants: conversation.participants.map((participant) =>
            participant._id === userId
              ? { ...participant, status: "offline" }
              : participant,
          ),
        })),
      );

      setSelectedUser((prev) =>
        prev && prev._id === userId ? { ...prev, status: "offline" } : prev,
      );
    };

    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);

    return () => {
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
    };
  }, []);

  return (
    <div className="d-flex h-100">
      {/* Chat Sidebar */}
      <div
        className="border-end bg-white"
        style={{
          width: "320px",
          minWidth: "320px",
        }}
      >
        <ChatSidebar
          conversations={conversations}
          currentUser={currentUser}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-grow-1 bg-light">
        <ChatWindow currentUser={currentUser} selectedUser={selectedUser} />
      </div>
    </div>
  );
};

export default Chat;
