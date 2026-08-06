import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import NavigationSidebar from "../common/navigationSidebar";
import { verify, logout } from "../../features/auth/services/authServices";
import socket from "../../services/socket";

const AppLayout = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const loadUser = async () => {
    try {
      const response = await verify();

      if (response.success) {
        setUser(response.user);
      }
    } catch (error) {
      console.log(error.message);
      navigate("/login");
    }
  };

  // Load logged-in user
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUser();
  }, []);

  // Connect socket after user is loaded
  useEffect(() => {
    if (!user) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join", user._id);

    const onConnect = () => {
      console.log("Socket Connected:", socket.id);
    };

    const onDisconnect = () => {
      console.log("Socket Disconnected");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();

      socket.disconnect();

      navigate("/login");
    } catch (error) {
      console.log(error.message);
    }
  };

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="d-flex vh-100">
      <NavigationSidebar user={user} onLogout={handleLogout} />

      <div className="flex-grow-1 overflow-auto">
        <Outlet context={{ currentUser: user }} />
      </div>
    </div>
  );
};

export default AppLayout;
