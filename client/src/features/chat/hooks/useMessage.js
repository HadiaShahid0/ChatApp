import { useRef, useState } from "react";
import { getMessages } from "../services/chatServices";

const useMessages = (conversation) => {
  const [messages, setMessages] = useState([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const messagesContainerRef = useRef(null);
  const loadingOlderRef = useRef(false);
  const skipNextAutoScrollRef = useRef(false);

  const loadMessages = async (conversationId) => {
    try {
      const response = await getMessages(conversationId);

      if (response.success) {
        setMessages(response.messages || []);
        setHasMoreMessages(response.hasMore ?? false);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const loadOlderMessages = async () => {
    if (
      loadingOlderRef.current ||
      !hasMoreMessages ||
      messages.length === 0 ||
      !conversation
    ) {
      return;
    }

    const container = messagesContainerRef.current;

    if (!container) return;

    const oldestMessage = messages[0];

    try {
      loadingOlderRef.current = true;
      skipNextAutoScrollRef.current = true;

      setLoadingOlder(true);

      // Save current scroll position
      const oldScrollHeight = container.scrollHeight;
      const oldScrollTop = container.scrollTop;

      const response = await getMessages(
        conversation._id,
        20,
        oldestMessage._id,
      );

      if (response.success && response.messages?.length) {
        setMessages((prev) => [
          ...response.messages,
          ...prev,
        ]);

        setHasMoreMessages(response.hasMore ?? false);

        // Wait until React adds the older messages
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;

          container.scrollTop =
            newScrollHeight - oldScrollHeight + oldScrollTop;
        });
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.log(error.message);
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  };

  return {
    messages,
    setMessages,
    loadingOlder,
    hasMoreMessages,
    messagesContainerRef,
    loadingOlderRef,
    skipNextAutoScrollRef,
    loadMessages,
    loadOlderMessages,
  };
};

export default useMessages;