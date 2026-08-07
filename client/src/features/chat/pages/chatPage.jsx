import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import socket from "../../../services/socket";

import { getConversations } from "../services/chatServices";
import { getGroups } from "../services/groupServices";

import ChatSidebar from "../components/chatSidebar";
import ChatWindow from "../components/chatWindow";
import GroupModal from "../components/group/groupModal";

const Chat = () => {
  const { currentUser, setCurrentUser } = useOutletContext();

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

      // Remove duplicate conversations/groups
      allChats = [
        ...new Map(allChats.map((chat) => [chat._id, chat])).values(),
      ];

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
    const profileUpdatedHandler = ({ user }) => {
      // Update logged-in user
      if (currentUser?._id === user._id) {
        setCurrentUser((prev) => ({
          ...prev,
          name: user.name,
          profileImage: user.profileImage,
        }));
      }

      // Update conversations
      setConversations((prev) =>
        prev.map((conversation) => {
          // Group
          if (conversation.isGroup) {
            return {
              ...conversation,
              participants: conversation.participants.map((participant) =>
                participant._id === user._id
                  ? {
                      ...participant,
                      name: user.name,
                      profileImage: user.profileImage,
                    }
                  : participant,
              ),
              admin:
                conversation.admin?._id === user._id
                  ? {
                      ...conversation.admin,
                      name: user.name,
                      profileImage: user.profileImage,
                    }
                  : conversation.admin,
              lastMessage:
                conversation.lastMessage?.sender?._id === user._id
                  ? {
                      ...conversation.lastMessage,
                      sender: {
                        ...conversation.lastMessage.sender,
                        name: user.name,
                        profileImage: user.profileImage,
                      },
                    }
                  : conversation.lastMessage,
            };
          }

          // One-to-one
          return {
            ...conversation,
            participants: conversation.participants.map((participant) =>
              participant._id === user._id
                ? {
                    ...participant,
                    name: user.name,
                    profileImage: user.profileImage,
                  }
                : participant,
            ),
            lastMessage:
              conversation.lastMessage?.sender?._id === user._id
                ? {
                    ...conversation.lastMessage,
                    sender: {
                      ...conversation.lastMessage.sender,
                      name: user.name,
                      profileImage: user.profileImage,
                    },
                  }
                : conversation.lastMessage,
          };
        }),
      );
    };

    socket.on("profileUpdated", profileUpdatedHandler);

    return () => {
      socket.off("profileUpdated", profileUpdatedHandler);
    };
  }, [currentUser]);
  useEffect(() => {
    const handleRemovedFromGroup = ({ groupId }) => {
      setConversations((prev) => prev.filter((c) => c._id !== groupId));

      setSelectedUser((prev) => (prev?._id === groupId ? null : prev));
    };

    const handleMemberAdded = ({ group }) => {
      setConversations((prev) =>
        prev.map((c) => (c._id === group._id ? group : c)),
      );

      // update opened group
      setSelectedUser((prev) => (prev?._id === group._id ? group : prev));
    };

    const handleMemberRemoved = ({ group }) => {
      setConversations((prev) =>
        prev.map((c) => (c._id === group._id ? group : c)),
      );

      setSelectedUser((prev) => (prev?._id === group._id ? group : prev));
    };

    socket.on("removedFromGroup", handleRemovedFromGroup);
    socket.on("addMember", handleMemberAdded);
    socket.on("removeMember", handleMemberRemoved);

    return () => {
      socket.off("removedFromGroup", handleRemovedFromGroup);
      socket.off("addMember", handleMemberAdded);
      socket.off("removeMember", handleMemberRemoved);
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
