// const GroupItem = ({ group }) => {
//   return (
//     <div
//       className="
// card 
// bg-dark 
// text-white
// border-secondary
// shadow
// h-100
// "
//     >
//       <div className="card-body">
//         <div className="d-flex align-items-center">
//           <img
//             src={
//               group.groupImage
//                 ? `http://localhost:5000/${group.groupImage}`
//                 : "https://ui-avatars.com/api/?name=" + group.groupName
//             }
//             className="
// rounded-circle
// me-3
// "
//             width="55"
//             height="55"
//           />

//           <div>
//             <h5 className="mb-1">{group.groupName}</h5>

//             <small className="text-secondary">
//               {group.participants.length}
//               members
//             </small>
//           </div>
//         </div>

//         <hr />

//         <div className="d-flex flex-wrap gap-1">
//           {group.participants.slice(0, 5).map((user) => (
//             <span key={user._id} className="badge bg-secondary">
//               <span
//                 className="
// rounded-circle
// bg-success
// d-inline-block
// me-1
// "
//                 style={{
//                   width: "8px",
//                   height: "8px",
//                 }}
//               ></span>

//               {user.name}
//             </span>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default GroupItem;
