import { Routes, Route } from "react-router-dom";

import Login from "../features/auth/pages/login";
import Register from "../features/auth/pages/register";

import ChatPage from "../features/chat/pages/chatPage";
import ProtectedRoute from "./protectedRoutes";
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
