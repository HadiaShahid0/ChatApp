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
        <div>{message.text}</div>

        <div
          className={`small mt-1 text-end ${
            isMine ? "text-light" : "text-muted"
          }`}
          style={{ fontSize: "0.70rem" }}
        >
          {time}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;