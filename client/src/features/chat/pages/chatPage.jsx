import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import socket from "../../../services/socket";

import { getConversations } from "../services/chatServices";
import { getGroups } from "../services/groupServices";

import ChatSidebar from "../components/chatSidebar";
import ChatWindow from "../components/chatWindow";
import GroupModal from "../components/group/groupModal";

const Chat = () => {
  const { currentUser } = useOutletContext();

  const [selectedUser, setSelectedUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const loadChats = async () => {
    try {
      const [privateChats, groups] = await Promise.all([
        getConversations(),
        getGroups(),
      ]);

      let allChats = [];

      if (privateChats.success) {
        allChats.push(...privateChats.conversations);
      }

      if (groups.success) {
        allChats.push(...groups.groups);
      }

      allChats.sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt || b.updatedAt) -
          new Date(a.lastMessage?.createdAt || a.updatedAt),
      );

      setConversations(allChats);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChats();
  }, []);
  useEffect(() => {
    const handleAddedToGroup = ({ group }) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === group._id);

        if (exists) {
          return prev.map((c) => (c._id === group._id ? group : c));
        }

        return [group, ...prev];
      });
    };

    const handleRemovedFromGroup = ({ groupId }) => {
      setConversations((prev) => prev.filter((c) => c._id !== groupId));

      setSelectedUser((prev) => (prev?._id === groupId ? null : prev));
    };

    const handleMemberAdded = ({ group }) => {
      setConversations((prev) =>
        prev.map((c) => (c._id === group._id ? group : c)),
      );
    };

    const handleMemberRemoved = ({ group }) => {
      setConversations((prev) =>
        prev.map((c) => (c._id === group._id ? group : c)),
      );
    };

    socket.on("addedToGroup", handleAddedToGroup);
    socket.on("removedFromGroup", handleRemovedFromGroup);
    socket.on("memberAdded", handleMemberAdded);
    socket.on("memberRemoved", handleMemberRemoved);

    return () => {
      socket.off("addedToGroup", handleAddedToGroup);
      socket.off("removedFromGroup", handleRemovedFromGroup);
      socket.off("memberAdded", handleMemberAdded);
      socket.off("memberRemoved", handleMemberRemoved);
    };
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
    <>
      <div className="d-flex h-100">
        {/* Sidebar */}
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
            openGroupModal={() => setShowGroupModal(true)}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-grow-1 bg-light">
          <ChatWindow
            currentUser={currentUser}
            selectedUser={selectedUser}
            conversations={conversations}
            setConversations={setConversations}
          />
        </div>
      </div>

      {showGroupModal && (
        <GroupModal
          close={() => setShowGroupModal(false)}
          refresh={loadChats}
        />
      )}
    </>
  );
};

export default Chat;
