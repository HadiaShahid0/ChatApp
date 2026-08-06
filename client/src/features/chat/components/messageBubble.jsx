import { BsCheck, BsCheckAll } from "react-icons/bs";

const MessageBubble = ({ message, currentUser }) => {
  const isMine = message.sender._id === currentUser._id;

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`d-flex mb-3 ${
        isMine ? "justify-content-end" : "justify-content-start"
      }`}
    >
      <div
        className={`px-3 py-2 shadow-sm ${
          isMine
            ? "bg-dark text-white rounded-4 rounded-bottom-0"
            : "bg-white rounded-4 rounded-bottom-start-0"
        }`}
        style={{
          maxWidth: "70%",
          wordBreak: "break-word",
        }}
      >
        <>
          {message.image && (
            <img
              src={`http://localhost:5000/${message.image}`}
              alt="Chat"
              className="img-fluid rounded mb-2"
              style={{
                maxWidth: "250px",
                cursor: "pointer",
              }}
            />
          )}

          {message.text && <div>{message.text}</div>}
        </>
        <div
          className={`d-flex justify-content-end align-items-center mt-1 ${
            isMine ? "text-light" : "text-muted"
          }`}
          style={{ fontSize: "12px" }}
        >
          <span>{time}</span>

          {isMine && (
            <span className="ms-1">
              {message.seen ? (
                <BsCheckAll className="text-info" />
              ) : message.delivered ? (
                <BsCheckAll />
              ) : (
                <BsCheck />
              )}
            </span>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
