import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";

const MemberAttendance = () => {
  const todayString = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(todayString);
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);

  /* 🔹 LOAD USERS WITH ACTIVE PLANS */
  useEffect(() => {
    const loadUsersWithPlans = async () => {
      setLoading(true);

      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const plansSnap = await getDocs(collection(db, "userPlans"));

        const selectedDate = new Date(date);

        const planMap = {};
        plansSnap.forEach((p) => {
          planMap[p.id] = p.data(); // docId = uid
        });

        const validUsers = usersSnap.docs
          .map((u) => {
            const plan = planMap[u.id];
            if (!plan || plan.status !== "active") return null;

            // 🔥 Convert Firestore Timestamp to JS Date
            const startDate = plan.startDate?.toDate?.();
            const endDate = plan.endDate?.toDate?.();

            if (!startDate || !endDate) return null;

            if (selectedDate < startDate || selectedDate > endDate)
              return null;

            return {
              uid: u.id,
              name: u.data().name || "Member",
              planName: plan.planName || "No Plan",
            };
          })
          .filter(Boolean);

        setUsers(validUsers);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load members");
      }

      setLoading(false);
    };

    loadUsersWithPlans();
  }, [date]);

  /* 🔹 LOAD ATTENDANCE */
  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const snap = await getDoc(doc(db, "attendance", date));
        setAttendance(snap.exists() ? snap.data() : {});
      } catch (e) {
        console.error(e);
      }
    };

    loadAttendance();
  }, [date]);

  /* 🔹 MARK ATTENDANCE */
  const markAttendance = async (user, status) => {
    try {
      const data = {
        name: user.name,
        planName: user.planName,
        present: status,
        timestamp: serverTimestamp(),
      };

      await setDoc(
        doc(db, "attendance", date),
        {
          [user.uid]: data,
        },
        { merge: true }
      );

      setAttendance((prev) => ({
        ...prev,
        [user.uid]: data,
      }));

      toast.success(
        `${user.name} → ${status ? "Present" : "Absent"}`
      );
    } catch (error) {
      console.error(error);
      toast.error("Attendance update failed");
    }
  };

  const presentCount = Object.values(attendance).filter(
    (a) => a?.present === true
  ).length;

  const absentCount = Object.values(attendance).filter(
    (a) => a?.present === false
  ).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Member Attendance
      </h1>

      {/* DATE */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border px-3 py-2 rounded mb-4"
      />

      {loading ? (
        <p>Loading members...</p>
      ) : (
        <>
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Member</th>
                <th className="border p-2">Plan</th>
                <th className="border p-2">Mark</th>
                <th className="border p-2">Status</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="border p-4 text-center text-gray-500"
                  >
                    No Active Members
                  </td>
                </tr>
              )}

              {users.map((u) => {
                const status = attendance[u.uid]?.present;

                return (
                  <tr key={u.uid} className="text-center">
                    <td className="border p-2">{u.name}</td>
                    <td className="border p-2">{u.planName}</td>

                    <td className="border p-2 space-x-2">
                      <button
                        onClick={() => markAttendance(u, true)}
                        className={`px-3 py-1 rounded text-white ${
                          status === true
                            ? "bg-green-600"
                            : "bg-gray-400"
                        }`}
                      >
                        Present
                      </button>

                      <button
                        onClick={() => markAttendance(u, false)}
                        className={`px-3 py-1 rounded text-white ${
                          status === false
                            ? "bg-red-600"
                            : "bg-gray-400"
                        }`}
                      >
                        Absent
                      </button>
                    </td>

                    <td className="border p-2">
                      {status === true && (
                        <span className="text-green-600 font-semibold">
                          Present
                        </span>
                      )}
                      {status === false && (
                        <span className="text-red-600 font-semibold">
                          Absent
                        </span>
                      )}
                      {status === undefined && (
                        <span className="text-gray-500">
                          Not Marked
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* SUMMARY */}
          <div className="mt-4 font-medium">
            Present: {presentCount} | Absent: {absentCount}
          </div>
        </>
      )}
    </div>
  );
};

export default MemberAttendance;
