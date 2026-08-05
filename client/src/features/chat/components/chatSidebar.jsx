import { useState } from "react";
import SearchBar from "./searchBar";
import UserItem from "./userItem";

const ChatSidebar = ({ conversations, currentUser, selectedUser, setSelectedUser }) => {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((conversation) => {
    const otherUser = conversation.participants.find(
      (p) => p._id !== currentUser._id,
    );

    return otherUser.name.toLowerCase().includes(search.toLowerCase());
  });
  return (
    <>
      <SearchBar search={search} setSearch={setSearch} />

      <div style={{ overflowY: "auto", height: "92vh" }}>
       {filtered.map((conversation) => (
    <UserItem
        key={conversation._id}
        conversation={conversation}
        currentUser={currentUser}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
    />
))}
      </div>
    </>
  );
};

export default ChatSidebar;
