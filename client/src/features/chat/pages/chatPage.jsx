import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import socket from "../../../services/socket";
import { getUsers } from "../services/chatServices";
import ChatSidebar from "../components/chatSidebar";
import ChatWindow from "../components/chatWindow";

const Chat = () => {
  const { currentUser } = useOutletContext();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadUsers = async () => {
    try {
      const response = await getUsers();

      if (response.success) {
        setUsers(response.users);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);

  useEffect(() => {
    socket.on("userOnline", (userId) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? { ...user, status: "online" }
            : user
        )
      );
    });

    socket.on("userOffline", (userId) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? { ...user, status: "offline" }
            : user
        )
      );
    });

    return () => {
      socket.off("userOnline");
      socket.off("userOffline");
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
          users={users}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-grow-1 bg-light">
        <ChatWindow
          currentUser={currentUser}
          selectedUser={selectedUser}
        />
      </div>
    </div>
  );
};

export default Chat;