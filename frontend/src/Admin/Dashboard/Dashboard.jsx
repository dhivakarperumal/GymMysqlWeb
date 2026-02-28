import React, { useEffect, useState } from "react";
import {
  FaCalendarCheck,
  FaDumbbell,
  FaFileInvoiceDollar,
  FaUserTie,
  FaTools,
  FaUsers,
  FaBox,
} from "react-icons/fa";
import dayjs from "dayjs";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
  limit,
  collectionGroup,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";



const statusClass = (status) => {
  switch (status) {
    case "delivered":
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    case "cancelled":
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    case "processing":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  }
};


/* -------------------- STAT CARD -------------------- */

const StatCard = ({ title, value, icon, color }) => (
  <div className="
    relative overflow-hidden rounded-2xl
    bg-white/10 backdrop-blur-xl
    border border-white/20
    p-6 flex justify-between items-center
  ">
    <div>
      <p className="text-xs uppercase tracking-widest text-gray-300">
        {title}
      </p>
      <h2 className="text-3xl font-extrabold text-white mt-2">
        {value}
      </h2>
    </div>
    <div className={`p-4 rounded-xl bg-gradient-to-br ${color} text-white text-2xl`}>
      {icon}
    </div>
  </div>
);

/* -------------------- HELPERS -------------------- */

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

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* -------------------- DASHBOARD -------------------- */

export default function Dashboard() {
  const navigate = useNavigate();

  /* ---------- TOP STATS (GYM) ---------- */
  const [stats, setStats] = useState({
    members: 0,
    checkinsToday: 0,
    activePlans: 0,
    pendingPayments: 0,
    trainers: 0,
    equipmentDue: 0,
    totalOrders: 0,
    totalProducts: 0,
  });

  useEffect(() => {
    const { start, end } = getTodayRange();
    const unsubs = [];

    // 👥 MEMBERS
    unsubs.push(
      onSnapshot(collection(db, "gymMembers"), snap =>
        setStats(p => ({ ...p, members: snap.size }))
      )
    );

    // 📅 TODAY CHECK-INS


    // 🏋️ ACTIVE PLANS
    unsubs.push(
      onSnapshot(
        query(collection(db, "gym_plans"), where("active", "==", true)),
        snap =>
          setStats(p => ({ ...p, activePlans: snap.size }))
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, "orders"),
        (snap) =>
          setStats((p) => ({
            ...p,
            totalOrders: snap.size,
          }))
      )
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, "orders"),
          where("paymentMethod", "==", "Cash"),
          where("paymentStatus", "==", "pending")
        ),
        (snap) =>
          setStats((p) => ({
            ...p,
            pendingPayments: snap.size,
          }))
      )
    );

    unsubs.push(
      onSnapshot(collection(db, "products"), (snap) =>
        setStats((p) => ({
          ...p,
          totalProducts: snap.size,
        }))
      )
    );
    // 🧑‍🏫 TRAINERS
    unsubs.push(
      onSnapshot(
        query(collection(db, "staff"), where("status", "==", "active")),
        snap =>
          setStats(p => ({ ...p, trainers: snap.size }))
      )
    );

    // 🧰 EQUIPMENT
    unsubs.push(
      onSnapshot(collection(db, "gym_equipment"), snap =>
        setStats(p => ({ ...p, equipmentDue: snap.size }))
      )
    );

    return () => unsubs.forEach(u => u());
  }, []);


  useEffect(() => {
    const today = dayjs().format("YYYY-MM-DD");

    const unsub = onSnapshot(
      collection(db, "attendance", today, "staff"),
      (snap) => {
        const presentCount = snap.docs.filter(
          (doc) => doc.data().status === "Present"
        ).length;

        setStats((p) => ({
          ...p,
          checkinsToday: presentCount,
        }));
      }
    );

    return () => unsub();
  }, []);

  /* ---------- WEEKLY CHECK-IN CHART ---------- */
  const [checkinData, setCheckinData] = useState([]);

  useEffect(() => {
    const loadWeeklyAttendance = async () => {
      const temp = [];

      for (let i = 6; i >= 0; i--) {
        const date = dayjs().subtract(i, "day");
        const dateStr = date.format("YYYY-MM-DD");

        const dayData = {
          day: date.format("ddd"),
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
        };

        try {
          const snap = await getDocs(
            collection(db, "attendance", dateStr, "staff")
          );

          snap.forEach((doc) => {
            const status = doc.data().status;

            if (status === "Present") dayData.present++;
            else if (status === "Absent") dayData.absent++;
            else if (status === "Late") dayData.late++;
            else if (status === "On Leave") dayData.leave++;
          });
        } catch (err) {
          console.log("No folder for:", dateStr);
        }

        temp.push(dayData);
      }

      setCheckinData(temp);
    };

    loadWeeklyAttendance();
  }, []);



  /* ---------- REVENUE ---------- */
  const [revenueData, setRevenueData] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    const unsub = onSnapshot(
      query(
        collection(db, "orders"),
        where("createdAt", ">=", Timestamp.fromDate(start)),
        where("createdAt", "<=", Timestamp.fromDate(end))
      ),
      (snap) => {
        const months = Array.from({ length: 12 }, (_, i) => ({
          month: new Date(0, i).toLocaleString("en", { month: "short" }),
          revenue: 0,
        }));

        let currentMonthTotal = 0;

        snap.forEach((doc) => {
          const d = doc.data();

          // ✅ correct status check
          if (d.paymentStatus !== "paid") return;

          const monthIndex = d.createdAt.toDate().getMonth();
          const amount = Number(d.subtotal || d.total || 0);

          months[monthIndex].revenue += amount;

          if (monthIndex === now.getMonth()) {
            currentMonthTotal += amount;
          }
        });

        setRevenueData(months);
        setMonthlyTotal(currentMonthTotal);
      }
    );

    return () => unsub();
  }, []);



  const [todayOrders, setTodayOrders] = useState(0);
  const [todayOrderAmount, setTodayOrderAmount] = useState(0);
  const [todayOrdersList, setTodayOrdersList] = useState([]);
  const PAGE_SIZE = 10;

  useEffect(() => {
    // use Firestore Timestamps for accurate range queries
    const startDate = dayjs().startOf("day").toDate();
    const endDate = dayjs().endOf("day").toDate();

    const startTs = Timestamp.fromDate(startDate);
    const endTs = Timestamp.fromDate(endDate);

    const q = query(
  collection(db, "orders"),
  where("createdAt", ">=", startTs),
  where("createdAt", "<=", endTs),
  orderBy("createdAt", "desc"),
  limit(10)
);

    console.log("[Dashboard] today's range:", startTs.toDate().toString(), endTs.toDate().toString());

    const unsub = onSnapshot(q, (snap) => {
  let total = 0;

  const rows = snap.docs
    .map((doc, i) => {
      const d = doc.data();
      if (!d.createdAt) return null;

      const amount =
        Number(d.total) ||
        Number(d.subtotal) ||
        d.items?.reduce((sum, item) => sum + Number(item.ProductTotal || 0), 0) ||
        0;

      total += amount;

      return {
        id: doc.id,
        index: i + 1,
        customer: d.shipping?.name || "Walk-in",
        phone: d.shipping?.phone || "-",
        city: d.shipping?.city || "-",
        amount,
        method: d.paymentMethod || "Cash",
        status: d.status || "-",
        time: d.createdAt?.toDate()?.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }) || "-",
      };
    })
    .filter(Boolean);

  setTodayOrders(rows.length);
  setTodayOrderAmount(total);
  setTodayOrdersList(rows);
});

    return () => unsub();
  }, []);




  /* -------------------- UI -------------------- */

  return (
    <div className="p-0 space-y-8">

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Members" value={stats.members} icon={<FaUsers />} color="from-blue-500 to-cyan-500" />
        <StatCard title="Today's Check-ins" value={stats.checkinsToday} icon={<FaCalendarCheck />} color="from-emerald-500 to-teal-500" />
        <StatCard title="Active Plans" value={stats.activePlans} icon={<FaDumbbell />} color="from-purple-500 to-pink-500" />
        <StatCard title="Pending Payments" value={stats.pendingPayments} icon={<FaFileInvoiceDollar />} color="from-amber-500 to-orange-500" />
        <StatCard title="Available Trainers" value={stats.trainers} icon={<FaUserTie />} color="from-indigo-500 to-violet-500" />
        <StatCard title="Equipment Due" value={stats.equipmentDue} icon={<FaBox />} color="from-green-500 to-emerald-500" />
        <StatCard title="Total Products" value={stats.totalProducts} icon={<FaBox />} color="from-green-500 to-emerald-500" />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={<FaTools />} color="from-red-500 to-rose-500" />

      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-2xl p-6">
          <h3 className="text-sm uppercase tracking-widest text-gray-200 mb-4">
            Weekly Attendance
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={checkinData}>
                <CartesianGrid
                  strokeDasharray="3 6"
                  stroke="rgba(255,255,255,0.08)"
                />
                <XAxis dataKey="day" tick={{ fill: "#cbd5f5" }} />
                <YAxis tick={{ fill: "#cbd5f5" }} />
                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="present"
                  stroke="#22c55e"
                  strokeWidth={3}
                  name="Present"
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  stroke="#ef4444"
                  strokeWidth={3}
                  name="Absent"
                />
                <Line
                  type="monotone"
                  dataKey="late"
                  stroke="#facc15"
                  strokeWidth={3}
                  name="Late"
                />
                <Line
                  type="monotone"
                  dataKey="leave"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="On Leave"
                />
              </LineChart>
            </ResponsiveContainer>

          </div>
        </div>



        {/* MONTHLY REVENUE */}
        <div className="bg-white/10 rounded-2xl p-6">
          <h3 className="text-sm uppercase tracking-widest text-gray-200 mb-2">
            Revenue This Month
          </h3>
          <h2 className="text-3xl font-bold text-white mb-4">
            ₹ {monthlyTotal.toLocaleString("en-IN")}
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" tick={{ fill: "#cbd5f5" }} />
                <YAxis tick={{ fill: "#cbd5f5" }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <h3 className="text-sm uppercase tracking-widest text-gray-200 mb-4">
          Today Orders
        </h3>

        <div>
          {/* Desktop / Tablet: table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-white/10 text-gray-300">
                <tr>
                  <th className="px-4 py-3">S No</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>

                </tr>
              </thead>

              <tbody>
                {todayOrdersList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-gray-400">
                      No orders today
                    </td>
                  </tr>
                ) : (
                  todayOrdersList.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-white/10 hover:bg-white/5 transition"
                    >
                      <td className="px-4 py-3">{o.index}</td>
                      <td className="px-4 py-3">{o.customer}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-400">
                        ₹ {o.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">{o.time}</td>
                      <td className="px-4 py-3">{o.method}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusClass(
                            o.status
                          )}`}
                        >
                          {o.status}
                        </span>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="sm:hidden space-y-3">
            {todayOrdersList.length === 0 ? (
              <div className="text-center py-6 text-gray-400">No orders today</div>
            ) : (
              todayOrdersList.map((o) => (
                <div
                  key={o.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-300 font-semibold">{o.customer}</p>
                      <p className="text-xs text-gray-400">{o.phone} • {o.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">₹ {o.amount.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-gray-400">{o.time}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-gray-300">{o.method}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusClass(o.status)}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
