// import { useEffect, useState, useMemo } from "react";
// import {
//   collection,
//   getDocs,
//   query,
//   orderBy,
//   addDoc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { db } from "../../firebase";
// import { Search, Download, Users } from "lucide-react";
// import toast from "react-hot-toast";
// import dayjs from "dayjs";

// /* ================= STATUS BADGE ================= */
// const StatusBadge = ({ status }) => {
//   const map = {
//     Present: "bg-green-500/20 text-green-400",
//     Absent: "bg-red-500/20 text-red-400",
//     Late: "bg-yellow-500/20 text-yellow-400",
//     "On Leave": "bg-blue-500/20 text-blue-400",
//   };

//   return (
//     <span
//       className={`px-3 py-1 rounded-full text-xs font-semibold ${
//         map[status] || "bg-white/10 text-white/60"
//       }`}
//     >
//       {status}
//     </span>
//   );
// };

// const OverallAttendance = () => {
//   const [attendanceData, setAttendanceData] = useState([]);
//   const [members, setMembers] = useState([]);
//   const [attendanceForm, setAttendanceForm] = useState({});
//   const [showModal, setShowModal] = useState(false);

//   const [search, setSearch] = useState("");
//   const [selectedDate, setSelectedDate] = useState(
//     dayjs().format("YYYY-MM-DD")
//   );
//   const [loading, setLoading] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 15;

//   useEffect(() => {
//     loadAttendanceData();
//     setCurrentPage(1);
//   }, [selectedDate]);

//   /* ================= LOAD ATTENDANCE ================= */
//   const loadAttendanceData = async () => {
//     setLoading(true);
//     try {
//       const q = query(
//         collection(db, "attendance", selectedDate, "staff"),
//         orderBy("createdAt", "desc")
//       );

//       const snap = await getDocs(q);
//       const data = snap.docs.map((d) => ({
//         id: d.id,
//         ...d.data(),
//       }));

//       setAttendanceData(data);
//     } catch (err) {
//       console.error(err);
//       setAttendanceData([]);
//       toast.error("Failed to load attendance");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= LOAD MEMBERS ================= */
//   const loadMembers = async () => {
//     try {
//       const snap = await getDocs(collection(db, "users"));
//       const data = snap.docs.map((d) => ({
//         id: d.id,
//         ...d.data(),
//       }));

//       setMembers(data);

//       const initial = {};
//       data.forEach((m) => {
//         initial[m.id] = true;
//       });

//       setAttendanceForm(initial);
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to load members");
//     }
//   };

//   /* ================= CHECK IF ALREADY MARKED ================= */
//   const isAlreadyMarked = attendanceData.length > 0;

//   /* ================= SUBMIT ATTENDANCE ================= */
//   const submitAttendance = async () => {
//   if (attendanceData.length > 0) {
//     toast.error("Attendance already marked for this date");
//     return;
//   }

//   try {
//     const promises = members.map((m) =>
//       addDoc(
//         collection(db, "attendance", selectedDate, "staff"),
//         {
//           userId: m.id,
//           username: m.username || m.name || "N/A",
//           email: m.email || "N/A",
//           role: m.role || "member",
//           status: attendanceForm[m.id] ? "Present" : "Absent",
//           loginTime: attendanceForm[m.id]
//             ? serverTimestamp()
//             : null,
//           logoutTime: null,
//           createdAt: serverTimestamp(),
//         }
//       )
//     );

//     await Promise.all(promises);

//     toast.success("Attendance Saved Successfully");
//     setShowModal(false);
//     loadAttendanceData();
//   } catch (err) {
//     console.error(err);
//     toast.error("Failed to save attendance");
//   }
// };


//   /* ================= FILTER ================= */
//   const filtered = useMemo(() => {
//     return attendanceData.filter((item) =>
//       `${item.name || ""} ${item.email || ""} ${item.role || ""}`
//         .toLowerCase()
//         .includes(search.toLowerCase())
//     );
//   }, [attendanceData, search]);

//   const totalPages = Math.ceil(filtered.length / itemsPerPage);

//   const paginatedData = filtered.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   /* ================= DOWNLOAD CSV ================= */
//   const downloadAttendance = () => {
//     if (!attendanceData.length) {
//       toast.error("No attendance data to download");
//       return;
//     }

//     let csv = "Name,Email,Role,Status,Date\n";
//     attendanceData.forEach((i) => {
//       csv += `"${i.name}","${i.email}","${i.role}","${i.status}","${selectedDate}"\n`;
//     });

//     const el = document.createElement("a");
//     el.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
//     el.download = `attendance-${selectedDate}.csv`;
//     el.click();

//     toast.success("Attendance downloaded");
//   };

//   return (
//     <div className="p-0 space-y-6 min-h-screen  text-white">
//       {/* HEADER */}
//       {/* HEADER */}
// <div className="flex flex-col lg:flex-row 
//                 lg:items-center lg:justify-between 
//                 gap-4 mb-6">

//   <h1 className="text-2xl sm:text-3xl font-bold 
//                  flex items-center gap-2 page-title">
//     <Users className="text-orange-400" />
//     Overall Attendance
//   </h1>

//   <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
//     <button
//       onClick={() => {
//         loadMembers();
//         setShowModal(true);
//       }}
//       className="w-full sm:w-auto px-5 py-3 
//                  bg-green-600 hover:bg-green-700 
//                  rounded-lg transition"
//     >
//       Mark Attendance
//     </button>

//     <button
//       onClick={downloadAttendance}
//       className="w-full sm:w-auto px-5 py-3 
//                  bg-orange-500 hover:bg-orange-600 
//                  rounded-lg flex items-center 
//                  justify-center gap-2 transition"
//     >
//       <Download size={16} />
//       Download CSV
//     </button>
//   </div>
// </div>

// {/* DATE + SEARCH SECTION */}
// <div className="flex flex-col md:flex-row gap-4 mb-6">

//   {/* DATE */}
//   <input
//     type="date"
//     value={selectedDate}
//     onChange={(e) => setSelectedDate(e.target.value)}
//     className="w-full md:w-48 px-4 py-2 
//                bg-white/10 border border-white/20 
//                rounded-lg focus:outline-none 
//                focus:ring-2 focus:ring-orange-500"
//   />

//   {/* SEARCH */}
//   <div className="relative w-full">
//     <Search className="absolute left-3 top-1/2 
//                        -translate-y-1/2 
//                        text-white/40" />
//     <input
//       value={search}
//       onChange={(e) => setSearch(e.target.value)}
//       placeholder="Search name, email or role..."
//       className="w-full pl-10 pr-4 py-3 
//                  bg-white/10 border border-white/20 
//                  rounded-lg focus:outline-none 
//                  focus:ring-2 focus:ring-orange-500"
//     />
//   </div>

// </div>


//       {/* TABLE (desktop) */}
//       <div className="hidden sm:block bg-white/5 rounded-xl overflow-hidden">
//         {loading ? (
//           <div className="p-6">Loading...</div>
//         ) : (
//           <table className="min-w-full text-sm">
//             <thead className="bg-white/10">
//               <tr>
//                 <th className="px-4 py-3 text-left">S No</th>
//                 <th className="px-4 py-3 text-left">User</th>
//                 <th className="px-4 py-3 text-left">Role</th>
//                 <th className="px-4 py-3 text-left">Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {paginatedData.map((i,d) => (
//                 <tr key={i.id} className="border-b border-white/10">
//                   <td className="px-4 py-3">{d + 1}</td>
//                   <td className="px-4 py-3">
//                     <div>
                     
//                       <p className="font-semibold">{i.username}</p>
//                       <p className="text-xs text-white/50">{i.email}</p>
//                     </div>
//                   </td>
//                   <td className="px-4 py-3 capitalize">
//                     {i.role}
//                   </td>
//                   <td className="px-4 py-3">
//                     <StatusBadge status={i.status} />
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* MOBILE CARDS */}
//       <div className="sm:hidden space-y-3">
//         {loading ? (
//           <div className="p-6">Loading...</div>
//         ) : paginatedData.length === 0 ? (
//           <div className="text-center py-6 text-white/50">No attendance found</div>
//         ) : (
//           paginatedData.map((i, d) => (
//             <div key={i.id} className="bg-white/5 p-4 rounded-xl border border-white/10">
//               <div className="flex justify-between">
//                 <div>
//                   <p className="font-semibold text-white">{i.username}</p>
//                   <p className="text-xs text-white/50">{i.email}</p>
//                 </div>
//                 <div className="text-right">
//                   <div className="text-sm">{i.role}</div>
//                   <div className="mt-2"><StatusBadge status={i.status} /></div>
//                 </div>
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {/* PAGINATION */}
//       {totalPages > 1 && (
//         <div className="flex justify-center gap-2">
//           {Array.from({ length: totalPages }, (_, i) => (
//             <button
//               key={i}
//               onClick={() => setCurrentPage(i + 1)}
//               className={`px-3 py-1 rounded ${
//                 currentPage === i + 1
//                   ? "bg-orange-500"
//                   : "bg-white/10"
//               }`}
//             >
//               {i + 1}
//             </button>
//           ))}
//         </div>
//       )}

//       {/* MODAL */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
//           <div className="bg-gray-900 w-full max-w-2xl rounded-xl p-6 space-y-4">
//             <h2 className="text-xl font-bold">
//               Mark Attendance ({selectedDate})
//             </h2>

//             <div className="max-h-80 overflow-y-auto space-y-2">
//               {members.map((m) => (
//                 <div
//                   key={m.id}
//                   className="flex justify-between items-center bg-white/5 p-3 rounded-lg"
//                 >
//                   <div>
//                     <p>{m.username}</p>
//                     <p className="text-xs text-white/50">
//                       {m.email}
//                     </p>
//                   </div>

//                   <label className="flex items-center gap-2">
//                     <input
//                       type="checkbox"
//                       checked={attendanceForm[m.id] || false}
//                       onChange={(e) =>
//                         setAttendanceForm({
//                           ...attendanceForm,
//                           [m.id]: e.target.checked,
//                         })
//                       }
//                     />
//                     Present
//                   </label>
//                 </div>
//               ))}
//             </div>

//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="px-4 py-2 bg-gray-700 rounded-lg"
//               >
//                 Cancel
//               </button>

//               <button
//                 onClick={submitAttendance}
//                 className="px-6 py-2 bg-green-600 rounded-lg"
//               >
//                 Submit
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default OverallAttendance;


import { useEffect, useState, useMemo } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Search, Download, Users } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";

/* ================= STAFF ROLES ================= */
const STAFF_ROLES = [
  "trainer",
  "personal_trainer",
  "gym_manager",
  "receptionist",
  "nutritionist",
  "security",
];

/* ================= STATUS BADGE ================= */
const StatusBadge = ({ status }) => {
  const map = {
    Present: "bg-green-500/20 text-green-400",
    Absent: "bg-red-500/20 text-red-400",
    Late: "bg-yellow-500/20 text-yellow-400",
    "On Leave": "bg-blue-500/20 text-blue-400",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        map[status] || "bg-white/10 text-white/60"
      }`}
    >
      {status}
    </span>
  );
};

const OverallAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [members, setMembers] = useState([]);
  const [attendanceForm, setAttendanceForm] = useState({});
  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    loadAttendanceData();
    setCurrentPage(1);
  }, [selectedDate]);

  /* ================= LOAD ATTENDANCE ================= */
  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "attendance", selectedDate, "staff"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      const data = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        .filter((i) => STAFF_ROLES.includes(i.role)); // 🔥 only staff

      setAttendanceData(data);
    } catch (err) {
      console.error(err);
      setAttendanceData([]);
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOAD MEMBERS (ONLY STAFF) ================= */
  const loadMembers = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));

      const data = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        .filter((u) => STAFF_ROLES.includes(u.role));

      setMembers(data);

      const initial = {};
      data.forEach((m) => {
        initial[m.id] = true;
      });

      setAttendanceForm(initial);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load members");
    }
  };

  /* ================= PREVENT DUPLICATE ================= */
  const isAlreadyMarked = attendanceData.length > 0;

  /* ================= SUBMIT ATTENDANCE ================= */
  const submitAttendance = async () => {
    if (isAlreadyMarked) {
      toast.error("Attendance already marked for this date");
      return;
    }

    try {
      const promises = members.map((m) =>
        addDoc(collection(db, "attendance", selectedDate, "staff"), {
          userId: m.id,
          username: m.username || m.name || "N/A",
          email: m.email || "N/A",
          role: m.role || "staff",
          status: attendanceForm[m.id] ? "Present" : "Absent",
          loginTime: attendanceForm[m.id] ? serverTimestamp() : null,
          logoutTime: null,
          createdAt: serverTimestamp(),
        })
      );

      await Promise.all(promises);

      toast.success("Attendance Saved Successfully");
      setShowModal(false);
      loadAttendanceData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save attendance");
    }
  };

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    return attendanceData.filter((item) =>
      `${item.username || ""} ${item.email || ""} ${item.role || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [attendanceData, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ================= DOWNLOAD CSV ================= */
  const downloadAttendance = () => {
    if (!attendanceData.length) {
      toast.error("No attendance data to download");
      return;
    }

    let csv = "Name,Email,Role,Status,Date\n";

    attendanceData.forEach((i) => {
      csv += `"${i.username}","${i.email}","${i.role}","${i.status}","${selectedDate}"\n`;
    });

    const el = document.createElement("a");
    el.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    el.download = `attendance-${selectedDate}.csv`;
    el.click();

    toast.success("Attendance downloaded");
  };

  return (
    <div className="p-0 space-y-6 min-h-screen text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Users className="text-orange-400" />
          Overall Attendance
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <button
            disabled={isAlreadyMarked}
            onClick={() => {
              loadMembers();
              setShowModal(true);
            }}
            className={`w-full sm:w-auto px-5 py-3 rounded-lg transition ${
              isAlreadyMarked
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Mark Attendance
          </button>

          <button
            onClick={downloadAttendance}
            className="w-full sm:w-auto px-5 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Download size={16} />
            Download CSV
          </button>
        </div>
      </div>

      {/* DATE + SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full md:w-48 px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or role..."
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="hidden sm:block bg-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-white/10">
              <tr>
                <th className="px-4 py-3 text-left">S No</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((i, d) => (
                <tr key={i.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {(currentPage - 1) * itemsPerPage + d + 1}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{i.username}</p>
                    <p className="text-xs text-white/50">{i.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{i.role}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={i.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MOBILE */}
      <div className="sm:hidden space-y-3">
        {paginatedData.map((i) => (
          <div key={i.id} className="bg-white/5 p-4 rounded-xl border border-white/10">
            <p className="font-semibold">{i.username}</p>
            <p className="text-xs text-white/50">{i.email}</p>
            <p className="text-sm capitalize">{i.role}</p>
            <div className="mt-2">
              <StatusBadge status={i.status} />
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1 ? "bg-orange-500" : "bg-white/10"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

     {/* MODAL */}
{showModal && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
    <div className="bg-gray-900 w-full max-w-4xl rounded-xl p-6 space-y-4">
      <h2 className="text-xl font-bold">
        Mark Attendance ({selectedDate})
      </h2>

      <div className="max-h-90 overflow-y-auto space-y-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex justify-between items-center bg-white/5 p-3 rounded-lg"
          >
            {/* USER INFO */}
            <div>
              <p className="font-semibold">
                {m.username || m.name || "N/A"}
              </p>
              <p className="text-xs text-white/50">{m.email}</p>

              {/* ROLE BADGE */}
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] rounded bg-orange-500/20 text-orange-400 capitalize">
                {m.role || "staff"}
              </span>
            </div>

            {/* PRESENT CHECKBOX */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={attendanceForm[m.id] || false}
                onChange={(e) =>
                  setAttendanceForm({
                    ...attendanceForm,
                    [m.id]: e.target.checked,
                  })
                }
              />
              Present
            </label>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 bg-gray-700 rounded-lg"
        >
          Cancel
        </button>

        <button
          onClick={submitAttendance}
          className="px-6 py-2 bg-orange-600 rounded-lg"
        >
          Submit
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default OverallAttendance;
