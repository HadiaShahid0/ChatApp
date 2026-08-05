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

        if (!socket.connected) {
          socket.connect();
        }

        socket.emit("join", response.user._id);
      }
    } catch (error) {
      console.log(error.message);
      navigate("/login");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUser();

    return () => {
      socket.off();
    };
  }, []);

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
      <NavigationSidebar
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex-grow-1 overflow-auto">
        <Outlet context={{ currentUser: user }} />
      </div>
    </div>
  );
};

export default AppLayout;