import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiMail, FiLock } from "react-icons/fi";

import { login } from "../services/authService";
import socket from "../../../services/socket";

const LoginForm = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      return alert("Email is required.");
    }

    if (!formData.password.trim()) {
      return alert("Password is required.");
    }

    try {
      setLoading(true);

      const response = await login(formData);

      // Connect socket
      socket.connect();

      // Join personal room
      socket.emit("join", response.user._id);

      alert(response.message);

      navigate("/chat");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="card shadow-lg border-0 rounded-4"
      style={{ width: "430px" }}
    >
      <div className="card-body p-5">

        <h2 className="fw-bold text-center mb-2">
          Welcome Back
        </h2>

        <p className="text-center text-muted mb-4">
          Login to continue chatting
        </p>

        <form onSubmit={handleSubmit}>

          <div className="mb-3">
            <label className="form-label">
              Email
            </label>

            <div className="input-group">

              <span className="input-group-text">
                <FiMail />
              </span>

              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
              />

            </div>
          </div>

          <div className="mb-4">

            <label className="form-label">
              Password
            </label>

            <div className="input-group">

              <span className="input-group-text">
                <FiLock />
              </span>

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="form-control"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
              />

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>

            </div>

          </div>

          <button
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="text-center mt-4 mb-0">
          Don't have an account?

          <Link
            to="/register"
            className="ms-2 text-decoration-none fw-semibold"
          >
            Register
          </Link>

        </p>

      </div>
    </div>
  );
};

export default LoginForm;