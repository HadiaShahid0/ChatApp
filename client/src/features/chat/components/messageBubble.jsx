import { useState } from "react";
import { BsCheck, BsCheckAll } from "react-icons/bs";

const MessageBubble = ({ message, currentUser, isGroup, conversation }) => {
  const [showImage, setShowImage] = useState(false);

  const isMine = message.sender?._id === currentUser._id;

  const otherMembers =
    conversation?.participants?.filter(
      (member) => String(member._id) !== String(currentUser._id),
    ) || [];
  const deliveredCount = message.deliveredTo?.length || 0;
  const seenCount = message.seenBy?.length || 0;

  const fullyDelivered = isGroup
    ? otherMembers.length > 0 &&
      otherMembers.every((member) =>
        message.deliveredTo?.some(
          (id) => String(id?._id || id) === String(member._id),
        ),
      )
    : deliveredCount > 1;

  const fullySeen = isGroup
    ? otherMembers.length > 0 &&
      otherMembers.every((member) =>
        message.seenBy?.some(
          (id) => String(id?._id || id) === String(member._id),
        ),
      )
    : seenCount > 1;

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  console.log("MESSAGE DELIVERY STATE:", {
    messageId: message._id,
    deliveredTo: message.deliveredTo,
    participants: conversation?.participants,
  });
  return (
    <>
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
          {/* Group sender name */}
          {isGroup && !isMine && (
            <div
              className="fw-bold mb-2"
              style={{
                color: "#0d6efd",
                fontSize: "13px",
              }}
            >
              {message.sender?.name}
            </div>
          )}

          {/* Image */}
          {message.image && (
            <img
              src={`http://localhost:5000/${message.image}`}
              alt="Chat"
              className="img-fluid rounded mb-2"
              style={{
                maxWidth: "250px",
                cursor: "pointer",
              }}
              onClick={() => setShowImage(true)}
            />
          )}

          {/* Text */}
          {message.text && <div>{message.text}</div>}

          {/* Time + Status */}
          <div
            className={`d-flex justify-content-end align-items-center mt-1 ${
              isMine ? "text-light" : "text-muted"
            }`}
            style={{ fontSize: "12px" }}
          >
            <span>{time}</span>

            {isMine && (
              <span className="ms-1">
                {fullySeen ? (
                  <BsCheckAll className="text-info" />
                ) : fullyDelivered ? (
                  <BsCheckAll />
                ) : (
                  <BsCheck />
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Image Preview */}
      {showImage && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            background: "rgba(0,0,0,.92)",
            zIndex: 9999,
          }}
          onClick={() => setShowImage(false)}
        >
          <button
            className="btn btn-light position-absolute top-0 end-0 m-4 rounded-circle"
            onClick={() => setShowImage(false)}
          >
            ✕
          </button>

          <img
            src={`http://localhost:5000/${message.image}`}
            alt="Preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </>
  );
};

export default MessageBubble;
