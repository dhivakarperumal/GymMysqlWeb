/* Trainer Dashboard (simplified) */
import React, { useEffect, useState } from "react";
import {
  FaUsers,
  FaDumbbell,
  FaClipboardList,
  FaCalendarCheck,
} from "react-icons/fa";
import { useAuth } from "../../PrivateRouter/AuthContext";

const API_BASE = "/api";

/* -------------------- STAT CARD -------------------- */
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 flex justify-between items-center">
    <div>
      <p className="text-xs uppercase tracking-widest text-gray-300">
        {title}
      </p>
      <h2 className="text-3xl font-bold text-white mt-2">{value !== undefined ? value : 0}</h2>
    </div>

    <div
      className={`p-4 rounded-xl bg-gradient-to-br ${color} text-white text-2xl`}
    >
      {icon}
    </div>
  </div>
);

/* -------------------- TRAINER DASHBOARD -------------------- */
const TrainerDashboard = () => {
  const { user } = useAuth();
  const trainerId = user?.id;

  const [loading, setLoading] = useState(true);
  const [assignedMembers, setAssignedMembers] = useState([]);

  const [stats, setStats] = useState({
    members: 0,
    todayCheckins: 0,
    workoutPlans: 0,
    dietPlans: 0,
  });

  /* ---------------- LOAD DASHBOARD DATA ---------------- */
  useEffect(() => {
    if (!trainerId || !user) return;

    const loadDashboard = async () => {
      try {
        setLoading(true);

        /* FETCH ASSIGNMENTS */
        const memberRes = await fetch(
          `${API_BASE}/assignments`
        );

        const memberData = await memberRes.json();

        const membersRaw = Array.isArray(memberData)
          ? memberData
          : memberData.data || memberData.assignments || [];

        // Filter by current trainer only
        const filteredByTrainer = membersRaw.filter((a) => {
          let include = false;
          
          // Match by trainer ID
          if (user?.id) {
            const assignTrainerId = Number(a.trainerId || a.trainer_id);
            const currentTrainerId = Number(user.id);
            if (!isNaN(assignTrainerId) && assignTrainerId === currentTrainerId) {
              include = true;
            }
          }
          
          // Match by trainer name
          if (!include && user?.username && (a.trainerName || a.trainer_name)) {
            if ((a.trainerName || a.trainer_name).toLowerCase() === user.username.toLowerCase()) {
              include = true;
            }
          }
          
          // Match by trainer email
          if (!include && user?.email && (a.trainerEmail || a.trainer_email)) {
            if ((a.trainerEmail || a.trainer_email).toLowerCase() === user.email.toLowerCase()) {
              include = true;
            }
          }
          
          return include;
        });

        console.log("📊 Filtered by trainer:", filteredByTrainer.length);

        /* show only ACTIVE members */
        const activeMembers = filteredByTrainer.filter(
          (m) => (m.status || "").toLowerCase() === "active"
        );

        /* remove duplicates by userId */
        const uniqueMembers = Array.from(
          new Map(
            activeMembers.map((m) => [m.userId || m.user_id, m])
          ).values()
        );

        setAssignedMembers(uniqueMembers);

        const assignedMemberIds = uniqueMembers.map(m => String(m.userId || m.user_id));
        console.log("👥 Assigned members:", assignedMemberIds);

        let workoutCount = 0;
        let dietCount = 0;
        let checkinCount = 0;

        try {
          /* WORKOUT PLANS for assigned members only */
          const workoutRes = await fetch(
            `${API_BASE}/workouts`
          );
          if (workoutRes.ok) {
            const workoutData = await workoutRes.json();
            const workoutsRaw = Array.isArray(workoutData) ? workoutData : workoutData?.data || [];
            const userWorkouts = workoutsRaw.filter(w => 
              assignedMemberIds.includes(String(w.member_id || w.memberId))
            );
            workoutCount = userWorkouts.length;
            console.log("💪 Workouts:", workoutCount);
          }
        } catch (e) {
          console.error("Workout fetch error:", e);
        }

        try {
          /* DIET PLANS for assigned members only */
          const dietRes = await fetch(
            `${API_BASE}/diet-plans`
          );
          if (dietRes.ok) {
            const dietData = await dietRes.json();
            const dietsRaw = Array.isArray(dietData) ? dietData : dietData?.data || [];
            const userDiets = dietsRaw.filter(d => 
              assignedMemberIds.includes(String(d.member_id || d.memberId))
            );
            dietCount = userDiets.length;
            console.log("🥗 Diets:", dietCount);
          }
        } catch (e) {
          console.error("Diet fetch error:", e);
        }

        try {
          /* TODAY CHECKINS */
          const checkinRes = await fetch(
            `${API_BASE}/checkins/today?trainerId=${trainerId}`
          );
          if (checkinRes.ok) {
            const checkinData = await checkinRes.json();
            checkinCount = checkinData?.count || checkinData?.length || 0;
            console.log("📅 Checkins:", checkinCount);
          }
        } catch (e) {
          console.error("Checkin fetch error:", e);
        }

        setStats({
          members: uniqueMembers.length,
          todayCheckins: checkinCount,
          workoutPlans: workoutCount,
          dietPlans: dietCount,
        });

        console.log("📈 Final stats:", {
          members: uniqueMembers.length,
          todayCheckins: checkinCount,
          workoutPlans: workoutCount,
          dietPlans: dietCount,
        });
      } catch (err) {
        console.error("Dashboard error:", err);
        setStats({
          members: 0,
          todayCheckins: 0,
          workoutPlans: 0,
          dietPlans: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [trainerId, user]);

  /* ---------------- LOADING ---------------- */

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-8">

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
        <div>
          <h3 className="text-sm uppercase tracking-widest text-gray-300 mb-4">
            Assigned Members
          </h3>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">

            {/* DESKTOP TABLE */}
            <div className="hidden sm:block">
              <table className="min-w-[640px] w-full text-sm text-gray-200">

                <thead className="bg-white/20">
                  <tr>
                    <th className="px-4 py-4 text-left">S No</th>
                    <th className="px-4 py-4 text-left">Member</th>
                    <th className="px-4 py-4 text-left">Email</th>
                    <th className="px-4 py-4 text-left">Mobile</th>
                    <th className="px-4 py-4 text-left">Plan</th>
                    <th className="px-4 py-4 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {assignedMembers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-gray-400">
                        No members assigned
                      </td>
                    </tr>
                  ) : (
                    assignedMembers.map((m, ind) => (
                      <tr
                        key={m.id || ind}
                        className="border-b border-white/10 hover:bg-white/5"
                      >

                        <td className="px-4 py-4">{ind + 1}</td>

                        <td className="px-4 py-4">
                          {m.username || m.user_name || "No Name"}
                        </td>

                        <td className="px-4 py-4">
                          {m.userEmail || m.user_email || "-"}
                        </td>

                        <td className="px-4 py-4">
                          {m.userMobile || m.user_mobile || "-"}
                        </td>

                        <td className="px-4 py-4">
                          {m.planName || m.plan_name || "-"}
                        </td>

                        <td className="px-4 py-4">
                          <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                            {m.status || "Active"}
                          </span>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>

              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="sm:hidden space-y-3 p-3">

              {assignedMembers.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  No members assigned
                </div>
              ) : (
                assignedMembers.map((m, ind) => (

                  <div
                    key={m.id || ind}
                    className="bg-white/5 border border-white/10 rounded-lg p-4"
                  >

                    <div className="flex justify-between items-start">

                      <div>
                        <p className="font-semibold">
                          {m.username || m.user_name || "No Name"}
                        </p>

                        <p className="text-xs text-gray-400">
                          {m.userEmail || m.user_email || "-"}
                        </p>

                        <p className="text-xs text-gray-400">
                          {m.userMobile || m.user_mobile || "-"}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          Plan: {m.planName || m.plan_name || "-"}
                        </p>
                      </div>

                      <div className="text-right">

                        <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                          {m.status || "Active"}
                        </span>

                        <div className="text-xs text-gray-400 mt-2">
                          #{ind + 1}
                        </div>

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