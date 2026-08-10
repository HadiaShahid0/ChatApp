const UserItem = ({
  conversation,
  currentUser,
  selectedUser,
  setSelectedUser,
}) => {
  const user = conversation.participants.find((p) => p._id !== currentUser._id);
  const isGroup = conversation.isGroup;
  if (!isGroup && !user) {
    return null;
  }
  const lastMessage = conversation.lastMessage;

  return (
    <div
      className={`d-flex align-items-center p-3 border-bottom ${
        selectedUser?._id === (isGroup ? conversation._id : user._id)
          ? "bg-light"
          : ""
      }`}
      style={{ cursor: "pointer" }}
      onClick={() => setSelectedUser(isGroup ? conversation : user)}
    >
      {/* Avatar */}
      <img
        src={
          isGroup
            ? conversation.groupImage
              ? `http://localhost:5000/${conversation.groupImage}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  conversation.groupName,
                )}`
            : user.profileImage
              ? `http://localhost:5000/${user.profileImage}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name,
                )}`
        }
        className="rounded-circle me-3"
        width="55"
        height="55"
        alt={isGroup ? conversation.groupName : user.name}
      />

      <div className="flex-grow-1">
        {/* Name + Time */}
        <div className="d-flex justify-content-between">
          <strong>{isGroup ? conversation.groupName : user.name}</strong>

          {lastMessage && (
            <small className="text-muted">
              {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          )}
        </div>

        {/* Last message / Members */}
        <div className="d-flex justify-content-between align-items-center">
          <small
            className="text-truncate text-muted"
            style={{ maxWidth: "180px" }}
          >
            {lastMessage
              ? lastMessage.text || "📷 Image"
              : isGroup
                ? `${conversation.participants.length} members`
                : "Start chatting"}
          </small>

          <div className="d-flex align-items-center">
            {isGroup ? (
              <>
                {conversation.participants.slice(0, 3).map((member) => (
                  <img
                    key={member._id}
                    src={
                      member.profileImage
                        ? `http://localhost:5000/${member.profileImage}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            member.name,
                          )}`
                    }
                    className="rounded-circle border border-white"
                    width="20"
                    height="20"
                    style={{
                      marginLeft: "-6px",
                    }}
                    alt={member.name}
                  />
                ))}
              </>
            ) : (
              <span
                className={`rounded-circle me-2 ${
                  user.status === "online" ? "bg-success" : "bg-secondary"
                }`}
                style={{
                  width: 15,
                  height: 15,
                }}
              />
            )}

            {conversation.unreadCount > 0 && (
              <span className="badge bg-success rounded-pill ms-2">
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
