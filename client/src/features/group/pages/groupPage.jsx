// import { useEffect, useState } from "react";
// import GroupList from "../components/groupList";
// import GroupModal from "../components/groupModal";
// import { getGroups } from "../../chat/services/groupServices";

// const GroupPage = () => {
//   const [groups, setGroups] = useState([]);

//   const [showModal, setShowModal] = useState(false);

//   const loadGroups = async () => {
//     const data = await getGroups();

//     if (data.success) {
//       setGroups(data.groups);
//     }
//   };

//   useEffect(() => {
//     loadGroups();
//   }, []);

//   return (
//     <div className="container-fluid bg-black text-white min-vh-100 p-3">
//       <div className="d-flex justify-content-between align-items-center mb-3">
//         <h3 className="fw-bold">Groups</h3>

//         <button className="btn btn-light" onClick={() => setShowModal(true)}>
//           + Create
//         </button>
//       </div>

//       <GroupList groups={groups} />

//       {showModal && (
//         <GroupModal close={() => setShowModal(false)} refresh={loadGroups} />
//       )}
//     </div>
//   );
// };

// export default GroupPage;
