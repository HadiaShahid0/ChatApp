import { useState } from "react";
import SearchBar from "./searchBar";
import UserItem from "./userItem";

const ChatSidebar = ({
  conversations,
  currentUser,
  selectedUser,
  setSelectedUser,
  openGroupModal,
}) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = conversations.filter((conversation) => {
    // Search
    const matchesSearch = conversation.isGroup
      ? (conversation.groupName || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      : (
          conversation.participants.find(
            (p) => p._id !== currentUser._id,
          )?.name || ""
        )
          .toLowerCase()
          .includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Filter
    switch (filter) {
      case "unread":
        return conversation.unreadCount > 0;

      case "groups":
        return conversation.isGroup;

      default:
        return true;
    }
  });

  return (
    <>
      <SearchBar search={search} setSearch={setSearch} />

      {/* Create Group */}
      <div className="px-3 mt-2">
        <button
          className="btn btn-dark w-100 rounded-pill"
          onClick={openGroupModal}
        >
          + Create Group
        </button>
      </div>

      {/* Filters */}
      <div className="d-flex gap-2 px-3 py-3">
        <button
          className={`btn btn-sm rounded-pill ${
            filter === "all"
              ? "btn-dark"
              : "btn-outline-secondary"
          }`}
          onClick={() => setFilter("all")}
        >
          All
        </button>

        <button
          className={`btn btn-sm rounded-pill ${
            filter === "unread"
              ? "btn-dark"
              : "btn-outline-secondary"
          }`}
          onClick={() => setFilter("unread")}
        >
          Unread
        </button>

        <button
          className={`btn btn-sm rounded-pill ${
            filter === "groups"
              ? "btn-dark"
              : "btn-outline-secondary"
          }`}
          onClick={() => setFilter("groups")}
        >
          Groups
        </button>
      </div>

      <div
        style={{
          overflowY: "auto",
          height: "calc(92vh - 120px)",
        }}
      >
        {filtered.map((conversation) => (
          <UserItem
            key={conversation._id}
            conversation={conversation}
            currentUser={currentUser}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center text-muted mt-5">
            No conversations found.
          </div>
        )}
      </div>
    </>
  );
};

export default ChatSidebar;