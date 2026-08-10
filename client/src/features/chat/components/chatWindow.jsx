import { useEffect, useRef, useState } from "react";
import {
  getOrCreateConversation,
  sendMessage,
  sendImage,
  markSeen,
} from "../services/chatServices";

import MessageBubble from "./messageBubble";
import MessageInput from "./messageInput";
import GroupInfoModal from "./group/groupInfoModal";
import useChatSocket from "../hooks/useChatSocket";
import useMessages from "../hooks/useMessage";

const ChatWindow = ({ currentUser, selectedUser, setConversations }) => {
  const [conversation, setConversation] = useState(null);
  const [typing, setTyping] = useState("");
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const bottomRef = useRef(null);
  const {
    messages,
    setMessages,
    loadingOlder,
    messagesContainerRef,
    skipNextAutoScrollRef,
    loadMessages,
    loadOlderMessages,
  } = useMessages(conversation);

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

  const updateConversation = (message) => {
    setConversations((prev) => {
      const updated = prev.map((conv) =>
        conv._id === message.conversation._id
          ? {
              ...conv,
              lastMessage: message,
              unreadCount:
                message.sender._id === currentUser._id
                  ? conv.unreadCount || 0
                  : conversation?._id === conv._id
                    ? 0
                    : (conv.unreadCount || 0) + 1,
            }
          : conv,
      );

      updated.sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt || b.updatedAt) -
          new Date(a.lastMessage?.createdAt || a.updatedAt),
      );

      return updated;
    });
  };

  const updateGroupConversation = (updatedGroup) => {
    setConversations((prev) => {
      const exists = prev.some((conv) => conv._id === updatedGroup._id);

      if (!exists) {
        return [updatedGroup, ...prev];
      }

      const updated = prev.map((conv) =>
        conv._id === updatedGroup._id
          ? {
              ...conv,
              ...updatedGroup,
            }
          : conv,
      );

      updated.sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt || b.updatedAt) -
          new Date(a.lastMessage?.createdAt || a.updatedAt),
      );

      return updated;
    });
  };
  const addSentMessage = (message) => {
    setMessages((prev) => {
      if (prev.some((m) => String(m._id) === String(message._id))) {
        return prev;
      }

      return [...prev, message];
    });

    updateConversation(message);
  };
  const handleSend = async (text) => {
    try {
      const response = await sendMessage({
        receiverId: conversation.isGroup ? null : selectedUser._id,
        groupId: conversation.isGroup ? conversation._id : null,
        text,
      });

      if (!response.success) return;

      addSentMessage(response.data);

      //   socket.emit("newGroupMessage", {
      //     groupId: conversation._id,
      //     message: response.data,
      //   });
      // }
    } catch (err) {
      console.log(err);
    }
  };

  const handleImageSend = async (file) => {
    try {
      const response = await sendImage({
        receiverId: conversation.isGroup ? null : selectedUser._id,
        groupId: conversation.isGroup ? conversation._id : null,
        image: file,
      });
      if (!response.success) return;

      // Show image immediately
      addSentMessage(response.data);
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
    return () => {
      setTyping("");
    };
  }, [selectedUser?._id]);

  useChatSocket({
    conversation,
    currentUser,
    selectedUser,
    setMessages,
    setTyping,
    setConversation,
    setConversations,
    updateConversation,
    updateGroupConversation,
  });

  useEffect(() => {
    if (skipNextAutoScrollRef.current) {
      skipNextAutoScrollRef.current = false;
      return;
    }

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
        ref={messagesContainerRef}
        className="flex-grow-1 p-3"
        style={{
          overflowY: "auto",
          background: "#f5f5f5",
        }}
        onScroll={(e) => {
          if (e.currentTarget.scrollTop <= 50) {
            loadOlderMessages();
          }
        }}
      >
        {loadingOlder && (
          <div className="text-center py-2 text-secondary small">
            Loading older messages...
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            currentUser={currentUser}
            isGroup={conversation?.isGroup}
            conversation={conversation}
          />
        ))}

        <div ref={bottomRef}></div>
      </div>

      <MessageInput
        onSend={handleSend}
        onImageSend={handleImageSend}
        currentUser={currentUser}
        selectedUser={selectedUser}
        conversation={conversation}
      />

      {showGroupInfo && conversation && (
        <GroupInfoModal
          group={conversation}
          currentUser={currentUser}
          closegroup={() => setShowGroupInfo(false)}
          onLeave={(groupId) => {
            setShowGroupInfo(false);

            // Clear selected conversation
            setConversation(null);

            // Clear messages
            setMessages([]);

            // Remove group from sidebar
            setConversations((prev) =>
              prev.filter((conv) => conv._id !== groupId),
            );
          }}
        />
        // <GroupInfoModal
        //   group={conversation}
        //   currentUser={currentUser}
        //   close={() => setShowGroupInfo(false)}
        //   refresh={() => {
        //     const groupId = conversation._id;

        //     setShowGroupInfo(false);

        //     setConversations((prev) =>
        //       prev.filter((conv) => conv._id !== groupId),
        //     );

        //     setConversation(null);
        //     setMessages([]);
        //   }}
        // />
      )}
    </div>
  );
};

export default ChatWindow;
