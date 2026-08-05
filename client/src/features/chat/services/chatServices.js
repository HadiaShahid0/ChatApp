const BASE_URL = "http://localhost:5000/api";

export const getUsers = async (search = "") => {
  const response = await fetch(`${BASE_URL}/users?search=${search}`, {
    credentials: "include",
  });

  return await response.json();
};

export const getOrCreateConversation = async (receiverId) => {
  const response = await fetch(`${BASE_URL}/conversations`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      receiverId,
    }),
  });

  return await response.json();
};
export const getConversations = async () => {
  const response = await fetch(`${BASE_URL}/conversations`, {
    credentials: "include",
  });

  return await response.json();
};
export const getMessages = async (conversationId) => {
  const response = await fetch(`${BASE_URL}/messages/${conversationId}`, {
    credentials: "include",
  });

  return await response.json();
};

export const sendMessage = async (receiverId, text) => {
  const response = await fetch(`${BASE_URL}/messages`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      receiverId,
      text,
    }),
  });

  return await response.json();
};
export const markSeen = async (
  conversationId
) => {
  const response = await fetch(
    `${BASE_URL}/messages/seen/${conversationId}`,
    {
      method: "PUT",
      credentials: "include",
    }
  );

  return await response.json();
};