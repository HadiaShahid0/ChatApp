import { Routes, Route } from "react-router-dom";

import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";

import ChatPage from "../features/chat/pages/chatPage";
const AppRoutes = () => {
    return (

<Routes>

    <Route path="/" element={<Login />} />

    <Route path="/login" element={<Login />} />

    <Route path="/register" element={<Register />} />

    <Route path="/chat" element={<ChatPage />} />

</Routes>
  );
};

export default AppRoutes;