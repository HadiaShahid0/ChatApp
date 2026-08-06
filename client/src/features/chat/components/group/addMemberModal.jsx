import { useEffect, useState } from "react";
import { getUsers } from "../../services/chatServices";
import { addMember } from "../../services/groupServices";
import socket from "../../../../services/socket";

const AddMemberModal = ({ group, close, onAdded }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  const loadUsers = async () => {
    const res = await getUsers();

    if (res.success) {
      setUsers(res.users);
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);
  const availableUsers = users.filter(
    (user) => !group.participants.some((member) => member._id === user._id),
  );

  const filtered = availableUsers.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = async (memberId) => {
    try {
      setLoadingId(memberId);

      const res = await addMember(group._id, memberId);

      if (!res.success) {
        setLoadingId(null);
        return;
      }

      socket.emit("addMember", {
        groupId: group._id,
        memberId,
      });

      // Update GroupInfoModal and close this modal
      onAdded(res.group);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        background: "rgba(0,0,0,.6)",
        zIndex: 10000,
      }}
    >
      <div
        className="card shadow"
        style={{
          width: 450,
          maxHeight: "80vh",
        }}
      >
        <div className="card-body">
          <h5 className="mb-3">Add Members</h5>

          <input
            className="form-control mb-3"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div
            style={{
              maxHeight: 350,
              overflowY: "auto",
            }}
          >
            {filtered.length > 0 ? (
              filtered.map((user) => (
                <div
                  key={user._id}
                  className="d-flex justify-content-between align-items-center py-2 border-bottom"
                >
                  <div className="d-flex align-items-center">
                    <img
                      src={
                        user.profileImage
                          ? `http://localhost:5000/${user.profileImage}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.name,
                            )}`
                      }
                      className="rounded-circle me-2"
                      width="40"
                      height="40"
                      alt={user.name}
                    />

                    <div>
                      <div>{user.name}</div>

                      <small className="text-muted">{user.status}</small>
                    </div>
                  </div>

                  <button
                    className="btn btn-success btn-sm"
                    disabled={loadingId === user._id}
                    onClick={() => handleAdd(user._id)}
                  >
                    {loadingId === user._id ? "Adding..." : "Add"}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted py-4">No users found</p>
            )}
          </div>

          <button
            className="btn btn-outline-secondary w-100 mt-3"
            onClick={close}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
