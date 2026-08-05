import { BsChatDotsFill, BsPersonCircle, BsBoxArrowRight } from "react-icons/bs";
import { Link } from "react-router-dom";

const NavigationSidebar = ({ user, onLogout }) => {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-between bg-dark text-white py-4"
      style={{ width: "60px", height: "100vh" }}
    >
      {/* Top Section */}
      <div className="d-flex flex-column align-items-center gap-4">
        <Link to="/profile">
          <img
            src={
              user?.profileImage
                ? `http://localhost:5000/${user.profileImage}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || "User"
                  )}`
            }
            alt="Profile"
            className="rounded-circle border border-2 border-light"
            style={{
              width: "45px",
              height: "45px",
              objectFit: "cover",
              cursor: "pointer",
            }}
          />
        </Link>

        <Link
          to="/chat"
          className="text-white"
          title="Chats"
        >
          <BsChatDotsFill size={24} />
        </Link>

        <Link
          to="/profile"
          className="text-white"
          title="Profile"
        >
          <BsPersonCircle size={24} />
        </Link>
      </div>

      {/* Bottom Section */}
      <button
        className="btn btn-link text-white p-0"
        onClick={onLogout}
        title="Logout"
      >
        <BsBoxArrowRight size={24}  />
      </button>
    </div>
  );
};

export default NavigationSidebar;