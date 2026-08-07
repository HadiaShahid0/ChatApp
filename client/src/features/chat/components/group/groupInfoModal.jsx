import { useState, useEffect } from "react";
import { removeMember } from "../../services/groupServices";
import socket from "../../../../services/socket";
import AddMemberModal from "./addMemberModal";
import { BsPlusLg } from "react-icons/bs";
const GroupInfoModal = ({ group, currentUser, close, refresh }) => {
  const [groupData, setGroupData] = useState(group);
  const [showAddMember, setShowAddMember] = useState(false);
  const isAdmin = currentUser._id === group.admin._id;
  useEffect(() => {
    const handleMemberRemoved = ({ group }) => {
      if (group._id === groupData._id) {
        setGroupData(group);
      }
    };

    socket.on("removeMember", handleMemberRemoved);

    return () => {
      socket.off("removeMember", handleMemberRemoved);
    };
  }, [groupData._id]);
  const handleRemove = async (memberId) => {
    try {
      const res = await removeMember(groupData._id, memberId);

      if (!res.success) return;

      // Update yourself immediately
      setGroupData(res.group);

      // Notify everyone in the group
      socket.emit("removeMember", {
        groupId: groupData._id,
        memberId,
        group: res.group,
      });

      refresh();
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    const groupUpdatedHandler = ({ group }) => {
      if (group._id === groupData._id) {
        setGroupData(group);
      }
    };

    socket.on("groupUpdated", groupUpdatedHandler);

    return () => {
      socket.off("groupUpdated", groupUpdatedHandler);
    };
  }, [groupData._id]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGroupData(group);
  }, [group]);
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        background: "rgba(0,0,0,.5)",
        zIndex: 9999,
      }}
    >
      <div
        className="card shadow"
        style={{
          width: 500,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div className="card-body">
          <div className="text-center mb-4">
            <img
              src={
                groupData.groupImage
                  ? `http://localhost:5000/${groupData.groupImage}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      groupData.groupName,
                    )}`
              }
              className="rounded-circle"
              width="90"
              height="90"
            />

            <h4 className="mt-3">{groupData.groupName}</h4>

            <p className="text-muted">
              {groupData.participants.length} Members
            </p>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Members</h6>

              {isAdmin && (
                <button
                  className="btn btn-dark rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: 40,
                    height: 40,
                  }}
                  onClick={() => setShowAddMember(true)}
                >
                  <BsPlusLg />
                </button>
              )}
            </div>
          </div>
          {groupData.participants.map((member) => (
            <div
              key={member._id}
              className="d-flex justify-content-between align-items-center border-bottom py-2"
            >
              <div className="d-flex align-items-center">
                <img
                  src={
                    member.profileImage
                      ? `http://localhost:5000/${member.profileImage}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          member.name,
                        )}`
                  }
                  className="rounded-circle me-2"
                  width="40"
                  height="40"
                />

                <div>
                  <div>
                    {member.name}

                    {groupData.admin._id === member._id && (
                      <span className="badge bg-primary ms-2">Admin</span>
                    )}
                  </div>

                  <small>{member.status}</small>
                </div>
              </div>

              {isAdmin && member._id !== currentUser._id && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleRemove(member._id)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          {showAddMember && (
            <AddMemberModal
              group={groupData}
              close={() => setShowAddMember(false)}
              onAdded={(updatedGroup) => {
                setGroupData(updatedGroup);
                setShowAddMember(false);
                refresh();
              }}
            />
          )}
          <button className="btn btn-secondary w-100 mt-4" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;
