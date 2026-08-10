import { useState, useEffect } from "react";
import {
  removeMember,
  leaveGroup,
  deleteGroup,
} from "../../services/groupServices";
import socket from "../../../../services/socket";
import AddMemberModal from "./addMemberModal";
import { BsPlusLg } from "react-icons/bs";
const GroupInfoModal = ({
  group,
  currentUser,
  closegroup,
  onLeave
}) => {
  const [groupData, setGroupData] = useState(group);
  const [showAddMember, setShowAddMember] = useState(false);

  
  // UPDATE GROUP DATA
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGroupData(group);
  }, [group]);

  
  // GROUP MEMBER REMOVED
  
  useEffect(() => {
    const handleMemberRemoved = ({ group }) => {
      if (!groupData) return;

      if (group._id === groupData._id) {
        setGroupData(group);
      }
    };

    socket.on("removeMember", handleMemberRemoved);

    return () => {
      socket.off("removeMember", handleMemberRemoved);
    };
  }, [groupData]);

  
  // GROUP UPDATED
  
  useEffect(() => {
    const groupUpdatedHandler = ({ group }) => {
      if (!groupData) return;

      if (group._id === groupData._id) {
        setGroupData(group);
      }
    };

    socket.on("groupUpdated", groupUpdatedHandler);

    return () => {
      socket.off("groupUpdated", groupUpdatedHandler);
    };
  }, [groupData]);

  
  // NOW SAFE TO CHECK
  
  if (!groupData) {
    return null;
  }

  const isAdmin =
    currentUser?._id === groupData?.admin?._id;

  
  // REMOVE MEMBER
  
  const handleRemove = async (memberId) => {
  try {
    const res = await removeMember(groupData._id, memberId);

    if (!res.success) {
      alert(res.message);
      return;
    }

    setGroupData(res.group);

    socket.emit("removeMember", {
      groupId: groupData._id,
      memberId,
    });

  } catch (err) {
    console.log(err);
  }
};

  
  // LEAVE GROUP
  
  const handleLeaveGroup = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to leave this group?"
    );

    if (!confirmed) return;

    try {
      const res = await leaveGroup(groupData._id);

      if (!res.success) {
        alert(res.message);
        return;
      }

      onLeave?.(groupData._id)
      closegroup();
    } catch (err) {
      console.log(err);
    }
  };

  
  // DELETE GROUP
  
  const handleDeleteGroup = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this group?"
    );

    if (!confirmed) return;

    try {
      const res = await deleteGroup(groupData._id);

      if (!res.success) {
        alert(res.message);
        return;
      }

      closegroup();
    } catch (err) {
      console.log(err);
    }
  };

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
        <div className="p-4 text-center">

          {/* GROUP HEADER */}
          <img
            src={
              groupData.groupImage
                ? `http://localhost:5000/${groupData.groupImage}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    groupData.groupName
                  )}`
            }
            className="rounded-circle"
            width="90"
            height="90"
            alt=""
          />

          <h4 className="mt-3">
            {groupData.groupName}
          </h4>

          <p className="text-muted">
            {groupData.participants?.length || 0} Members
          </p>

          {/* MEMBERS HEADER */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Members</h6>

            {isAdmin && (
              <button
                className="btn btn-dark rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: 40,
                  height: 40,
                }}
                onClick={() =>
                  setShowAddMember(true)
                }
              >
                <BsPlusLg />
              </button>
            )}
          </div>

          {/* MEMBERS */}
          {groupData.participants?.map((member) => (
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
                          member.name
                        )}`
                  }
                  className="rounded-circle me-2"
                  width="40"
                  height="40"
                  alt=""
                />

                <div>
                  <div>
                    {member.name}

                    {groupData.admin?._id ===
                      member._id && (
                      <span className="badge bg-primary ms-2">
                        Admin
                      </span>
                    )}
                  </div>

                  <small>{member.status}</small>
                </div>
              </div>

              {isAdmin &&
                member._id !== currentUser._id && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() =>
                      handleRemove(member._id)
                    }
                  >
                    Remove
                  </button>
                )}
            </div>
          ))}

          {/* ADD MEMBER */}
          {showAddMember && (
            <AddMemberModal
              group={groupData}
              closegroup={() =>
                setShowAddMember(false)
              }
              onAdded={(updatedGroup) => {
                setGroupData(updatedGroup);
                setShowAddMember(false);
              }}
            />
          )}

          {/* ACTIONS */}
          <div className="mt-4">

            <button
              className="btn btn-outline-danger w-100 mb-2"
              onClick={handleLeaveGroup}
            >
              Leave Group
            </button>

            {isAdmin && (
              <button
                className="btn btn-danger w-100 mb-2"
                onClick={handleDeleteGroup}
              >
                Delete Group
              </button>
            )}

            <button
              className="btn btn-secondary w-100"
              onClick={closegroup}
            >
              Close
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;
