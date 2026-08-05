import BASE_URL from "../../../services/api";

export const getUsers = async (search = "") => {
  const response = await fetch(
    `${BASE_URL}/users?search=${search}`,
    {
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};


export const createConversation = async (receiverId) => {
  const response = await fetch(
    `${BASE_URL}/conversations`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiverId,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const getConversations = async () => {
  const response = await fetch(
    `${BASE_URL}/conversations`,
    {
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};