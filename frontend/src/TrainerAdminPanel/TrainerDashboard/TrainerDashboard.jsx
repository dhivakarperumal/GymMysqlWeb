import React, { useEffect, useState } from "react";
import {
  FaUsers,
  FaDumbbell,
  FaClipboardList,
  FaCalendarCheck,
} from "react-icons/fa";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth } from "firebase/auth";

/* -------------------- STAT CARD -------------------- */
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 flex justify-between items-center">
    <div>
      <p className="text-xs uppercase tracking-widest text-gray-300">
        {title}
      </p>
      <h2 className="text-3xl font-bold text-white mt-2">
        {value}
      </h2>
    </div>
    <div
      className={`p-4 rounded-xl bg-gradient-to-br ${color} text-white text-2xl`}
    >
      {icon}
    </div>
  </div>
);

/* -------------------- DATE HELPER -------------------- */
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return {
    start: Timestamp.fromDate(start),
    end: Timestamp.fromDate(end),
  };
};

/* -------------------- TRAINER DASHBOARD -------------------- */
const TrainerDashboard = () => {
  const auth = getAuth();
  const trainerId = auth.currentUser?.uid; // ✅ LOGIN UID

  const [loading, setLoading] = useState(true);
  const [assignedMembers, setAssignedMembers] = useState([]);

  const [stats, setStats] = useState({
    members: 0,
    todayCheckins: 0,
    workoutPlans: 0,
    dietPlans: 0,
  });

  /* ---------------- FIRESTORE LISTENERS ---------------- */
  useEffect(() => {
    if (!trainerId) return;

    const { start, end } = getTodayRange();
    const unsubs = [];

    // 👥 ASSIGNED MEMBERS (FROM trainerAssignments)
    unsubs.push(
      onSnapshot(
        query(
          collection(db, "trainerAssignments"),
          where("trainerId", "==", trainerId),
          where("status", "==", "active")
        ),
        (snap) => {
          setAssignedMembers(
            snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }))
          );
          setStats((p) => ({ ...p, members: snap.size }));
          setLoading(false);
        }
      )
    );

    // 📅 TODAY CHECK-INS
    unsubs.push(
      onSnapshot(
        query(
          collection(db, "checkins"),
          where("trainerId", "==", trainerId),
          where("createdAt", ">=", start),
          where("createdAt", "<=", end)
        ),
        (snap) =>
          setStats((p) => ({ ...p, todayCheckins: snap.size }))
      )
    );

    // 🏋️ WORKOUT PLANS
    unsubs.push(
      onSnapshot(
        query(
          collection(db, "workoutPrograms"),
          where("trainerId", "==", trainerId)
        ),
        (snap) =>
          setStats((p) => ({ ...p, workoutPlans: snap.size }))
      )
    );

    // 🥗 DIET PLANS
    unsubs.push(
      onSnapshot(
        query(
          collection(db, "dietPlans"),
          where("trainerId", "==", trainerId)
        ),
        (snap) =>
          setStats((p) => ({ ...p, dietPlans: snap.size }))
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [trainerId]);

  /* ---------------- LOADING ---------------- */
  if (loading || !trainerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
        Loading Trainer Dashboard...
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen  p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Assigned Members"
            value={stats.members}
            icon={<FaUsers />}
            color="from-blue-500 to-cyan-500"
          />
          <StatCard
            title="Today's Check-ins"
            value={stats.todayCheckins}
            icon={<FaCalendarCheck />}
            color="from-emerald-500 to-teal-500"
          />
          <StatCard
            title="Workout Plans"
            value={stats.workoutPlans}
            icon={<FaDumbbell />}
            color="from-purple-500 to-pink-500"
          />
          <StatCard
            title="Diet Plans"
            value={stats.dietPlans}
            icon={<FaClipboardList />}
            color="from-orange-500 to-amber-500"
          />
        </div>

        {/* ASSIGNED MEMBERS TABLE */}
        <div >
          <h3 className="text-sm uppercase tracking-widest text-gray-300 mb-4">
            Assigned Members
          </h3>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
            {/* desktop table */}
            <div className="hidden sm:block">
                  <table className="min-w-[640px] w-full text-sm text-gray-200">
                <thead className="bg-white/20">
                  <tr>
                    <th className="px-4 py-4 text-left">S No</th>
                    <th className="px-4 py-4 text-left">Member</th>
                    <th className="px-4 py-4 text-left">Email</th>
                    <th className="px-4 py-4 text-left">Plan</th>
                    <th className="px-4 py-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedMembers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-gray-400">
                        No members assigned
                      </td>
                    </tr>
                  ) : (
                    assignedMembers.map((m, ind) => (
                      <tr key={m.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="px-4 py-4 text-left">{ind + 1}</td>
                        <td className="px-4 py-4 text-left">{m.username || "No Name"}</td>
                        <td className="px-4 py-4 text-left">{m.userEmail || "-"}</td>
                        <td className="px-4 py-4 text-left">{m.planName}</td>
                        <td className="px-4 py-4 text-left">
                          <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">{m.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* mobile cards */}
            <div className="sm:hidden space-y-3 p-0">
              {assignedMembers.length === 0 ? (
                <div className="text-center py-6 text-gray-400">No members assigned</div>
              ) : (
                assignedMembers.map((m, ind) => (
                  <div key={m.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{m.username || 'No Name'}</p>
                        <p className="text-xs text-gray-400">{m.userEmail || '-'}</p>
                        <p className="text-xs text-gray-400 mt-1">Plan: {m.planName}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">{m.status}</span>
                        <div className="text-xs text-gray-400 mt-2">#{ind+1}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TrainerDashboard;

