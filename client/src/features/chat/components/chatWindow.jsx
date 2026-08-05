import EmptyChat from "./emptyChat";

const ChatWindow = ({ selectedUser }) => {
  if (!selectedUser) {
    return <EmptyChat />;
  }

  return (
    <div className="h-100">

      <div className="border-bottom p-3 bg-white shadow-sm">

        <div className="d-flex align-items-center">

          <img
            src={
              selectedUser.profileImage
                ? `http://localhost:5000/${selectedUser.profileImage}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    selectedUser.name
                  )}`
            }
            width="45"
            height="45"
            className="rounded-circle me-3"
          />

          <div>

            <h6 className="mb-0">
              {selectedUser.name}
            </h6>

            <small className="text-success">
              {selectedUser.status}
            </small>

          </div>

        </div>

      </div>

      <div
        className="d-flex justify-content-center align-items-center"
        style={{
          height: "85%",
        }}
      >
        <h4 className="text-muted">
          Messages will appear here...
        </h4>
      </div>

    </div>
  );
};

export default ChatWindow;