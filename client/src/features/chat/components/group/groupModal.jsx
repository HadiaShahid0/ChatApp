import { useEffect, useState } from "react";
import { createGroup } from "../../services/groupServices";
import { getUsers } from "../../services/chatServices";

const GroupModal = ({ close, refresh }) => {
  const [name, setName] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [search, setSearch] = useState("");

  const loadUsers = async () => {
    const data = await getUsers();

    if (data.success) {
      setUsers(data.users);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);

  const toggleUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id)
        ? prev.filter((userId) => userId !== id)
        : [...prev, id],
    );
  };

  const submit = async (e) => {
    e.preventDefault();

    const form = new FormData();

    form.append("groupName", name);
    form.append("participants", JSON.stringify(selectedUsers));

    if (image) {
      form.append("groupImage", image);
    }

    const data = await createGroup(form);

    if (data.success) {
      refresh();
      close();
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        background: "rgba(0,0,0,.65)",
        zIndex: 9999,
      }}
    >
      <div
        className="bg-white rounded-4 shadow-lg p-4"
        style={{
          width: 460,
          maxHeight: "90vh",
          overflow: "hidden",
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Create Group</h4>

          <button
            className="btn-close"
            onClick={close}
          ></button>
        </div>

        <form onSubmit={submit}>
          {/* Avatar */}
          <div className="text-center mb-3">
            <img
              src={
                preview ||
                "https://ui-avatars.com/api/?name=Group&background=0D8ABC&color=fff"
              }
              className="rounded-circle border"
              width="90"
              height="90"
              style={{ objectFit: "cover" }}
            />

            <div className="mt-2">
              <label className="btn btn-outline-primary btn-sm">
                Choose Image

                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];

                    if (!file) return;

                    setImage(file);
                    setPreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>
          </div>

          {/* Group name */}
          <input
            className="form-control mb-3"
            placeholder="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Search */}
          <input
            className="form-control mb-3"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="d-flex justify-content-between mb-2">
            <strong>Select Members</strong>

            <span className="badge bg-success">
              {selectedUsers.length} Selected
            </span>
          </div>

          <div
            className="border rounded"
            style={{
              maxHeight: 260,
              overflowY: "auto",
            }}
          >
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="d-flex align-items-center justify-content-between p-2 border-bottom"
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
                    className="rounded-circle me-3"
                    width="45"
                    height="45"
                    style={{ objectFit: "cover" }}
                  />

                  <div>
                    <div>{user.name}</div>

                    <small
                      className={
                        user.status === "online"
                          ? "text-success"
                          : "text-muted"
                      }
                    >
                      {user.status}
                    </small>
                  </div>
                </div>

                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={selectedUsers.includes(user._id)}
                  onChange={() => toggleUser(user._id)}
                />
              </div>
            ))}
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={close}
            >
              Cancel
            </button>

            <button
              className="btn btn-success"
              disabled={!name.trim() || selectedUsers.length < 1}
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupModal;