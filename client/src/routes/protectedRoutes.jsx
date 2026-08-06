import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { verify } from "../features/auth/services/authServices";

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await verify();

        setUser(response.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;