const UserItem = ({ user, selectedUser, setSelectedUser }) => {
  console.log(user.profileImage);
  return (
    <div
      className={`d-flex align-items-center p-3 border-bottom cursor-pointer ${
        selectedUser?._id === user._id ? "bg-muted text-black" : "bg-white"
      }`}
      style={{ cursor: "pointer" }}
      onClick={() => setSelectedUser(user)}
    >
      <img
        src={
          user.profileImage
            ? `http://localhost:5000/${user.profileImage}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.name,
              )}`
        }
        
        className="rounded-circle me-3"
        width="55"
        height="55"
      />

      <div className="flex-grow-1">
        <div className="fw-semibold">{user.name}</div>

        <div className="d-flex align-items-center mt-1">
          <span
            className={`rounded-circle me-2 ${
              user.status === "online" ? "bg-success" : "bg-secondary"
            }`}
            style={{
              width: "10px",
              height: "10px",
              display: "inline-block",
            }}
          ></span>

          <small className="text-muted">
            {user.status === "online" ? "Online" : "Offline"}
          </small>
        </div>
      </div>
    </div>
  );
};

export default UserItem;
