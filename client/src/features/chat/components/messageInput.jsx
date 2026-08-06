import { useState } from "react";
import socket from "../../../services/socket";
import { BsImage, BsX } from "react-icons/bs";
import { sendImage } from "../services/chatServices";

const MessageInput = ({ onSend,onImageSend, selectedUser, currentUser }) => {
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState("");
  const handleChange = (e) => {
    setText(e.target.value);

    socket.emit("typing", {
      receiverId: selectedUser._id,
      senderId: currentUser._id,
      sender: currentUser.name,
    });

    clearTimeout(window.typingTimer);

    window.typingTimer = setTimeout(() => {
      socket.emit("stopTyping", {
        receiverId: selectedUser._id,
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Send image if selected
      if (selectedImage) {
        const response = await sendImage(selectedUser._id, selectedImage);
        if (response.success) {
          removeImage();
        }

        return;
      }

      // Send text
      if (!text.trim()) return;

      onSend(text);

      setText("");

      socket.emit("stopTyping", {
        receiverId: selectedUser._id,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
  };
  const removeImage = () => {
    setSelectedImage(null);
    setPreview("");
  };
  const handleImageClick = (e) => {
    e.target.value = null; // Reset the input value to allow re-selecting the same file
  }
  return (
    <>
      {preview && (
        <div className="p-3 border-top bg-white">
          <div className="position-relative d-inline-block">
            <img
              src={preview}
              className="rounded"
              style={{
                maxWidth: 220,
                maxHeight: 220,
              }}
            />

            <button
              type="button"
              className="btn btn-danger btn-sm position-absolute top-0 end-0"
              onClick={removeImage}
            >
              <BsX />
            </button>
          </div>
        </div>
      )}
      <form
        className="d-flex align-items-center p-3 border-top"
        onSubmit={handleSubmit}
      >
        <label className="btn btn-light border rounded-circle me-2 mb-0">
          <BsImage size={20} />
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleImageChange}
            onClick={handleImageClick}
          />
        </label>

        <input
          className="form-control me-2"
          placeholder="Type a message..."
          value={text}
          onChange={handleChange}
        />

        <button className="btn btn-primary" type="submit">
          Send
        </button>
      </form>
    </>
  );
};

export default MessageInput;
