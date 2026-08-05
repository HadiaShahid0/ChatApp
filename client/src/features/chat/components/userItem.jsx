const UserItem = ({
  conversation,
  currentUser,
  selectedUser,
  setSelectedUser,
}) => {
  const user = conversation.participants.find((p) => p._id !== currentUser._id);

  const lastMessage = conversation.lastMessage;

  return (
    <div
      className={`d-flex align-items-center p-3 border-bottom ${
        selectedUser?._id === user._id ? "bg-light" : ""
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
        alt={user.name}
      />

      <div className="flex-grow-1">
        <div className="d-flex justify-content-between">
          <strong>{user.name}</strong>

          {lastMessage && (
            <small className="text-muted">
              {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          )}
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <small
            className="text-truncate text-muted"
            style={{ maxWidth: "170px" }}
          >
            {lastMessage ? lastMessage.text : "Start chatting"}
          </small>

          <div className="d-flex align-items-center">
            <span
              className={`rounded-circle me-2 ${
                user.status === "online" ? "bg-success" : "bg-secondary"
              }`}
              style={{
                width: 10,
                height: 10,
              }}
            />

            {conversation.unreadCount > 0 && (
              <span className="badge bg-success rounded-pill">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserItem;
