import BASE_URL from "../../../services/api";

// Get current logged-in user
export const getCurrentUser = async () => {
  const response = await fetch(`${BASE_URL}/users/me`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

// Update profile
export const updateProfile = async (name) => {
  const response = await fetch(`${BASE_URL}/users/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ name }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

// Upload profile image
export const uploadProfileImage = async (image) => {
  const formData = new FormData();

  formData.append("profileImage", image);

  const response = await fetch(`${BASE_URL}/users/profile-image`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};