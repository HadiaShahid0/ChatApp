import { useState } from "react";
import SearchBar from "./searchBar";
import UserItem from "./userItem";

const ChatSidebar = ({
  users,
  selectedUser,
  setSelectedUser,
}) => {
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <SearchBar
        search={search}
        setSearch={setSearch}
      />

      <div style={{ overflowY: "auto", height: "92vh" }}>
        {filteredUsers.map((user) => (
          <UserItem
            key={user._id}
            user={user}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
          />
        ))}
      </div>
    </>
  );
};

export default ChatSidebar;