import { useState } from "react";
import socket from "../../../services/socket";

const MessageInput = ({
  onSend,
  selectedUser,
  currentUser,
}) => {
  const [text, setText] = useState("");

  const handleChange = (e) => {
    setText(e.target.value);

    socket.emit("typing", {
      receiverId: selectedUser._id,
      sender: currentUser.name,
    });

    clearTimeout(window.typingTimer);

    window.typingTimer = setTimeout(() => {
      socket.emit("stopTyping", {
        receiverId: selectedUser._id,
      });
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    onSend(text);

    setText("");

    socket.emit("stopTyping", {
      receiverId: selectedUser._id,
    });
  };

  return (
    <form
      className="d-flex p-3 border-top"
      onSubmit={handleSubmit}
    >
      <input
        className="form-control"
        value={text}
        onChange={handleChange}
        placeholder="Type a message..."
      />

      <button
        className="btn btn-primary ms-2"
        type="submit"
      >
        Send
      </button>
    </form>
  );
};

export default MessageInput;