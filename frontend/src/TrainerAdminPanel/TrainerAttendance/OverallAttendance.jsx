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
// import { Search, Download, Calendar, Users } from "lucide-react";
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
//   }, [selectedDate]);

//   /* ================= LOAD ATTENDANCE ================= */
//   const loadAttendanceData = async () => {
//     setLoading(true);
//     try {
//       const q = query(
//         collection(db, "attendance", selectedDate, "staff"),
//         orderBy("loginTime", "desc")
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
//     } catch {
//       toast.error("Failed to load members");
//     }
//   };

//   /* ================= SUBMIT ATTENDANCE ================= */
//   const submitAttendance = async () => {
//     try {
//       const promises = members.map((m) =>
//         addDoc(
//           collection(db, "attendance", selectedDate, "staff"),
//           {
//             name: m.name || "N/A",
//             role: m.role || "member",
//             status: attendanceForm[m.id]
//               ? "Present"
//               : "Absent",
//             loginTime: attendanceForm[m.id]
//               ? serverTimestamp()
//               : null,
//             logoutTime: null,
//           }
//         )
//       );

//       await Promise.all(promises);

//       toast.success("Attendance Saved");
//       setShowModal(false);
//       loadAttendanceData();
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to save attendance");
//     }
//   };

//   /* ================= FILTER ================= */
//   const filtered = useMemo(() => {
//     return attendanceData.filter((item) =>
//       `${item.name || ""} ${item.role || ""}`
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
//     let csv = "Name,Role,Status,Date\n";
//     attendanceData.forEach((i) => {
//       csv += `"${i.name}","${i.role}","${i.status}","${selectedDate}"\n`;
//     });

//     const el = document.createElement("a");
//     el.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
//     el.download = `attendance-${selectedDate}.csv`;
//     el.click();

//     toast.success("Attendance downloaded");
//   };

//   return (
//     <div className="p-6 space-y-6 min-h-screen">

//       {/* HEADER */}
//       <div className="flex justify-between items-center flex-wrap gap-3">
//         <h1 className="text-3xl font-bold text-white flex items-center gap-2">
//           <Users className="text-orange-400" />
//           Overall Attendance
//         </h1>

//         <div className="flex gap-3">
//           <button
//             onClick={() => {
//               loadMembers();
//               setShowModal(true);
//             }}
//             className="px-5 py-3 bg-green-600 rounded-lg text-white"
//           >
//             Mark Attendance
//           </button>

//           <button
//             onClick={downloadAttendance}
//             className="px-5 py-3 bg-orange-500 rounded-lg text-white"
//           >
//             <Download size={16} className="inline mr-1" />
//             Download CSV
//           </button>
//         </div>
//       </div>

//       {/* DATE */}
//       <input
//         type="date"
//         value={selectedDate}
//         onChange={(e) => setSelectedDate(e.target.value)}
//         className="px-4 py-2 bg-white/10 text-white rounded-lg"
//       />

//       {/* SEARCH */}
//       <div className="relative">
//         <Search className="absolute left-3 top-3 text-white/40" />
//         <input
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           placeholder="Search..."
//           className="w-full pl-10 pr-4 py-3 bg-white/10 text-white rounded-lg"
//         />
//       </div>

//       {/* TABLE */}
//       <div className="bg-white/5 rounded-xl overflow-hidden">
//         {loading ? (
//           <div className="p-6 text-white">Loading...</div>
//         ) : (
//           <table className="min-w-full text-white text-sm">
//             <thead className="bg-white/10">
//               <tr>
//                 <th className="px-4 py-3 text-left">Name</th>
//                 <th className="px-4 py-3 text-left">Role</th>
//                 <th className="px-4 py-3 text-left">Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {paginatedData.map((i) => (
//                 <tr key={i.id} className="border-b border-white/10">
//                   <td className="px-4 py-3">{i.name}</td>
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

//       {/* MODAL */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
//           <div className="bg-gray-900 w-full max-w-2xl rounded-xl p-6 space-y-4">

//             <h2 className="text-xl font-bold text-white">
//               Mark Attendance ({selectedDate})
//             </h2>

//             <div className="max-h-80 overflow-y-auto space-y-2">
//               {members.map((m) => (
//                 <div
//                   key={m.id}
//                   className="flex justify-between items-center bg-white/5 p-3 rounded-lg"
//                 >
//                   <div>
//                     <p className="text-white">{m.name}</p>
//                     <p className="text-xs text-white/50 capitalize">
//                       {m.role}
//                     </p>
//                   </div>

//                   <label className="flex items-center gap-2 text-white">
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
//                 className="px-4 py-2 bg-gray-700 rounded-lg text-white"
//               >
//                 Cancel
//               </button>

//               <button
//                 onClick={submitAttendance}
//                 className="px-6 py-2 bg-green-600 rounded-lg text-white"
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
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth } from "firebase/auth";
import { Search, Users, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";

/* ================= STATUS BADGE ================= */
const StatusBadge = ({ status }) => {
  const map = {
    Present: "bg-green-500/20 text-green-400",
    Absent: "bg-red-500/20 text-red-400",
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
  const auth = getAuth();
  const trainerId = auth.currentUser?.uid;

  const [attendanceData, setAttendanceData] = useState([]);
  const [members, setMembers] = useState([]);
  const [attendanceForm, setAttendanceForm] = useState({});
  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [loading, setLoading] = useState(false);

  /* ================= LOAD ATTENDANCE ================= */
  const loadAttendanceData = async () => {
    if (!trainerId) return;

    setLoading(true);

    try {
      const q = query(
        collection(db, "attendance", selectedDate, "staff"),
        where("trainerId", "==", trainerId)
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // frontend sorting
      data.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setAttendanceData(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate, trainerId]);

  /* ================= LOAD ASSIGNED MEMBERS ================= */
  const loadMembers = async () => {
    if (!trainerId) return;

    try {
      const q = query(
        collection(db, "trainerAssignments"),
        where("trainerId", "==", trainerId),
        where("status", "==", "active")
      );

      const snap = await getDocs(q);

      const assigned = snap.docs.map((d) => ({
        id: d.data().userId,
        name: d.data().username,
      }));

      setMembers(assigned);

      const initial = {};
      assigned.forEach((m) => {
        initial[m.id] = true;
      });

      setAttendanceForm(initial);
    } catch {
      toast.error("Failed to load members");
    }
  };

  /* ================= PREVENT DUPLICATE ================= */
  const checkIfAlreadyMarked = async () => {
    const q = query(
      collection(db, "attendance", selectedDate, "staff"),
      where("trainerId", "==", trainerId)
    );

    const snap = await getDocs(q);
    return !snap.empty;
  };

  /* ================= SUBMIT ================= */
  const submitAttendance = async () => {
    const alreadyMarked = await checkIfAlreadyMarked();

    if (alreadyMarked) {
      toast.error("Attendance already marked for this date");
      return;
    }

    try {
      const promises = members.map((m) =>
        addDoc(
          collection(db, "attendance", selectedDate, "staff"),
          {
            trainerId,
            memberId: m.id,
            name: m.name,
            status: attendanceForm[m.id]
              ? "Present"
              : "Absent",
            createdAt: serverTimestamp(),
          }
        )
      );

      await Promise.all(promises);

      toast.success("Attendance Saved");
      setShowModal(false);
      loadAttendanceData();
    } catch {
      toast.error("Failed to save attendance");
    }
  };

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    return attendanceData.filter((item) => {
      const matchesSearch = (item.name || "")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [attendanceData, search, statusFilter]);

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    const total = attendanceData.length;
    const present = attendanceData.filter(
      (i) => i.status === "Present"
    ).length;
    const absent = attendanceData.filter(
      (i) => i.status === "Absent"
    ).length;

    return { total, present, absent };
  }, [attendanceData]);

  return (
    <div className="p-6 space-y-6 min-h-screen text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="text-orange-400" />
          Overall Attendance
        </h1>

        <button
          onClick={() => {
            loadMembers();
            setShowModal(true);
          }}
          className="px-5 py-3 bg-green-600 rounded-lg"
        >
          Mark Attendance
        </button>
      </div>

      {/* DATE */}
      <div className="flex items-center gap-3">
        <Calendar className="text-orange-400" />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 bg-white/10 rounded-lg"
        />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 p-4 rounded-xl">
          <p>Total</p>
          <h2 className="text-2xl font-bold">{stats.total}</h2>
        </div>
        <div className="bg-green-500/10 p-4 rounded-xl">
          <p>Present</p>
          <h2 className="text-2xl font-bold text-green-400">
            {stats.present}
          </h2>
        </div>
        <div className="bg-red-500/10 p-4 rounded-xl">
          <p>Absent</p>
          <h2 className="text-2xl font-bold text-red-400">
            {stats.absent}
          </h2>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search member..."
          className="px-4 py-2 bg-white/10 rounded-lg"
        />

        {["All", "Present", "Absent"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === s
                ? "bg-orange-500"
                : "bg-white/10"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* TABLE (desktop) */}
      <div className="hidden sm:block bg-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-white/60">No attendance found</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-white/10">
              <tr>
                <th className="px-4 py-3 text-left">S No</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i,d) => (
                <tr key={i.id} className="border-b border-white/10">
                  <td className="px-4 py-3">{d+1}</td>
                  <td className="px-4 py-3">{i.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CARDS (mobile) */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="p-4">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-white/60">No attendance found</div>
        ) : (
          filtered.map((i, idx) => (
            <div key={i.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{i.name}</p>
                  <p className="text-xs text-gray-400">{i.role}</p>
                </div>
                <div>
                  <StatusBadge status={i.status} />
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2">#{idx+1}</div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="bg-gray-900 w-full max-w-2xl rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold">
              Mark Attendance ({selectedDate})
            </h2>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex justify-between items-center bg-white/5 p-3 rounded-lg"
                >
                  <p>{m.name}</p>

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
                className="px-6 py-2 bg-green-600 rounded-lg"
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
