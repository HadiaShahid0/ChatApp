import { useEffect, useRef, useState } from "react";
import {
  getMessages,
  getOrCreateConversation,
  sendMessage,
  sendImage,
  markSeen,
} from "../services/chatServices";

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
        setMessages(response.messages || []);
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
  const updateGroupConversation = (updatedConversation) => {
    setConversations((prev) => {
      const updated = prev.map((conv) =>
        conv._id === updatedConversation._id
          ? {
              ...conv,
              ...updatedConversation,
            }
          : conv,
      );

      // Move updated group to top
      updated.sort((a, b) => {
        if (a._id === updatedConversation._id) return -1;
        if (b._id === updatedConversation._id) return 1;

        return (
          new Date(b.lastMessage?.createdAt || b.updatedAt) -
          new Date(a.lastMessage?.createdAt || a.updatedAt)
        );
      });

      return updated;
    });
  };

  const handleSend = async (text) => {
    try {
      const response = await sendMessage({
        receiverId: conversation.isGroup ? null : selectedUser._id,
        groupId: conversation.isGroup ? conversation._id : null,
        text,
      });

      if (!response.success) return;

      setMessages((prev) => [...prev, response.data]);

      updateConversation(response.data);

      // // Notify other group members
      // if (conversation.isGroup) {
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
      setMessages((prev) => [...prev, response.data]);

      // Update sidebar
      updateConversation(response.data);
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
  useEffect(() => {
    const groupUpdatedHandler = ({ group }) => {
      updateGroupConversation(group);

      if (conversation?._id === group._id) {
        setConversation(group);
      }
    };
    // Socket event listeners for events like receiving messages, typing indicators, and message delivery confirmations
    const receiveMessage = async (message) => {
      updateConversation(message);
      if (message.sender._id === currentUser._id) {
        return;
      }
      if (message.sender._id !== currentUser._id) {
        socket.emit("messageDelivered", {
          messageId: message._id,
          userId: currentUser._id,
        });
      }

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

    const seenHandler = ({messageId,userId})=>{
 setMessages(prev =>
  prev.map(msg=>{
    if(msg._id !== messageId)
      return msg;

    if(msg.seenBy?.includes(userId))
      return msg;

    return {
      ...msg,
      seenBy:[
       ...(msg.seenBy || []),
       userId
      ]
    };
  })
 );
};

   const deliveredHandler = ({messageId,userId})=>{
 setMessages(prev =>
  prev.map(msg=>{
    if(msg._id !== messageId)
      return msg;

    if(msg.deliveredTo?.includes(userId))
      return msg;

    return {
      ...msg,
      deliveredTo:[
       ...(msg.deliveredTo || []),
       userId
      ]
    };
  })
 );
};

    const memberAddedHandler = ({ group }) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === group._id);

        if (exists) {
          return prev.map((c) => (c._id === group._id ? group : c));
        }

        return [group, ...prev];
      });

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

    socket.on("receiveMessage", receiveMessage);
    socket.on("typing", typingHandler);
    socket.on("stopTyping", stopTypingHandler);
    socket.on("messagesSeen", seenHandler);
    socket.on("messageDelivered", deliveredHandler);

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
        conversation={conversation}
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
