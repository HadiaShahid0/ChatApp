import BASE_URL from "../../../services/api";

/* --------------------------
   GET MY GROUPS
--------------------------- */
export const getGroups = async () => {
  const res = await fetch(`${BASE_URL}/groups`, {
    credentials: "include",
  });

  return await res.json();
};

/* --------------------------
   CREATE GROUP
--------------------------- */
export const createGroup = async (formData) => {
  const res = await fetch(`${BASE_URL}/groups/create`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return await res.json();
};

/* --------------------------
   ADD MEMBER
--------------------------- */
export const addMember = async (groupId, memberId) => {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/add-member`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      memberId,
    }),
  });

  return await res.json();
};

/* --------------------------
   REMOVE MEMBER
--------------------------- */
export const removeMember = async (groupId, memberId) => {
  const res = await fetch(
    `${BASE_URL}/groups/${groupId}/remove-member/${memberId}`,
    {
      method: "PUT",
      credentials: "include",
    },
  );

  return await res.json();
};

/* --------------------------
   LEAVE GROUP
--------------------------- */
export const leaveGroup = async (groupId) => {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/leave`, {
    method: "PUT",
    credentials: "include",
  });

  return await res.json();
};

/* --------------------------
   DELETE GROUP
--------------------------- */
export const deleteGroup = async (groupId) => {
  const res = await fetch(`${BASE_URL}/groups/${groupId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return await res.json();
};

/* --------------------------
   UPDATE GROUP
--------------------------- */
export const updateGroup = async (groupId, formData) => {
  const res = await fetch(`${BASE_URL}/groups/${groupId}`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  return await res.json();
};