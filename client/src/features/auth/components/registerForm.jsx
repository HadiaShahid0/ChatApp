import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiUser, FiMail, FiLock } from "react-icons/fi";
import { register } from "../services/authServices";

const RegisterForm = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
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

    if (!formData.name.trim()) {
      return alert("Name is required.");
    }

    if (!formData.email.trim()) {
      return alert("Email is required.");
    }

    if (!formData.password.trim()) {
      return alert("Password is required.");
    }

    try {
      setLoading(true);

      await register(formData);

      navigate("/login");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="card shadow-lg border-0 rounded-4"
      style={{ width: "550px" }}
    >
      <div className="card-body p-5">
        <h2 className="fw-bold text-center mb-2">Create Account</h2>

        <p className="text-center text-muted mb-4">Welcome to Chat App</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Full Name</label>

            <div className="input-group">
              <span className="input-group-text">
                <FiUser />
              </span>

              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>

            <div className="input-group">
              <span className="input-group-text">
                <FiMail />
              </span>

              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Password</label>

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

          <button className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-4 mb-0">
          Already have an account?
          <Link to="/login" className="ms-2 text-decoration-none fw-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
