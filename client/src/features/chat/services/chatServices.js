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

// ---------- Shared for Private & Group ----------

export const getMessages = async (
  conversationId,
  limit = 20,
  before = null,
) => {
  let url = `${BASE_URL}/messages/${conversationId}?limit=${limit}`;

  if (before) {
    url += `&before=${before}`;
  }

  const response = await fetch(url, {
    credentials: "include",
  });

  return await response.json();
};

export const sendMessage = async ({
  receiverId = null,
  groupId = null,
  text = "",
}) => {
  
  const response = await fetch(`${BASE_URL}/messages`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      receiverId,
      groupId,
      text,
    }),
  });

  return await response.json();
};

export const sendImage = async ({
  receiverId = null,
  groupId = null,
  image,
}) => {
  const formData = new FormData();

  if (receiverId) {
    formData.append("receiverId", receiverId);
  }

  if (groupId) {
    formData.append("groupId", groupId);
  }

  formData.append("image", image);

  const response = await fetch(`${BASE_URL}/messages`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return await response.json();
};

export const markSeen = async (conversationId) => {
  const response = await fetch(
    `${BASE_URL}/messages/seen/${conversationId}`,
    {
      method: "PUT",
      credentials: "include",
    },
  );

  return await response.json();
};