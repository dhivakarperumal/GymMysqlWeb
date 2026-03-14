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

import { useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";
import cache from "../../cache";
// import AddressForm from "../Address";



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

  /* ---------- LOADING STATE ---------- */
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // 1. Initial Cache Check
      if (cache.dashboardStats) {
        setStats(cache.dashboardStats);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const [membersRes, plansRes, ordersRes, staffRes, equipmentRes, productsRes] = await Promise.all([
          api.get('/members'),
          api.get('/plans'),
          api.get('/orders'),
          api.get('/staff'),
          api.get('/equipment'),
          api.get('/products'),
        ]);

        const members = membersRes.data || [];
        const plans = (plansRes.data || []).filter(p => p.active);
        const orders = ordersRes.data || [];
        const staff = (staffRes.data || []).filter(s => s.status === 'active');
        const equipment = equipmentRes.data || [];
        const products = productsRes.data || [];

        const newStats = {
          members: members.length,
          checkinsToday: 0, 
          activePlans: plans.length,
          pendingPayments: orders.filter(o => o.status === 'pending').length,
          trainers: staff.length,
          equipmentDue: equipment.length,
          totalOrders: orders.length,
          totalProducts: products.length,
        };

        setStats(newStats);
        cache.dashboardStats = newStats;
        
        // Populate individual caches too since we already fetched them
        cache.adminMembers = members;
        cache.adminStaff = staffRes.data;
        cache.adminOrders = orders;
        cache.adminProducts = products;
        cache.adminEquipment = equipment;

      } catch (err) {
        console.error('Error fetching stats:', err);
        if (!cache.dashboardStats) toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  /* ---------- WEEKLY CHECK-IN CHART ---------- */
  const [checkinData, setCheckinData] = useState([]);

  useEffect(() => {
    const loadWeeklyAttendance = async () => {
      const daysToFetch = Array.from({ length: 7 }, (_, i) => 6 - i);
      
      try {
        const attendancePromises = daysToFetch.map(async (i) => {
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
            const res = await api.get('/attendance', { params: { date: dateStr } });
            const records = res.data || [];
            records.forEach((record) => {
              const status = record.status || '';
              if (status.toLowerCase().includes('present')) dayData.present++;
              else if (status.toLowerCase().includes('absent')) dayData.absent++;
              else if (status.toLowerCase().includes('late')) dayData.late++;
              else if (status.toLowerCase().includes('leave')) dayData.leave++;
            });
          } catch (err) {
            console.log("No attendance data for:", dateStr);
          }
          return dayData;
        });

        const results = await Promise.all(attendancePromises);
        setCheckinData(results);
      } catch (err) {
        console.error("Error loading weekly attendance:", err);
      }
    };

    loadWeeklyAttendance();
  }, []);



  /* ---------- REVENUE ---------- */
  const [revenueData, setRevenueData] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await api.get('/orders');
        const orders = res.data || [];

        const now = new Date();
        const months = Array.from({ length: 12 }, (_, i) => ({
          month: new Date(0, i).toLocaleString("en", { month: "short" }),
          revenue: 0,
        }));

        let currentMonthTotal = 0;

        orders.forEach((order) => {
          // Only count paid orders
          if (order.status !== 'delivered' && order.status !== 'completed') return;

          const orderDate = new Date(order.created_at || order.createdAt);
          const monthIndex = orderDate.getMonth();
          const amount = Number(order.total_amount || order.total_price || order.total || 0);

          months[monthIndex].revenue += amount;

          if (monthIndex === now.getMonth()) {
            currentMonthTotal += amount;
          }
        });

        setRevenueData(months);
        setMonthlyTotal(currentMonthTotal);
      } catch (err) {
        console.error('Error fetching revenue:', err);
      }
    };

    fetchRevenue();
  }, []);



  const [todayOrders, setTodayOrders] = useState(0);
  const [todayOrderAmount, setTodayOrderAmount] = useState(0);
  const [todayOrdersList, setTodayOrdersList] = useState([]);

  useEffect(() => {
    const fetchTodayOrders = async () => {
      try {
        const res = await api.get('/orders');
        const allOrders = res.data || [];

        const today = dayjs().format("YYYY-MM-DD");
        const todayStart = new Date(today);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        let total = 0;

        const rows = allOrders
          .filter(order => {
            const orderDate = new Date(order.created_at || order.createdAt || '');
            return orderDate >= todayStart && orderDate <= todayEnd;
          })
          .slice(0, 10)
          .map((order, i) => {
            const amount = Number(order.total_amount || order.total_price || order.total || 0);
            total += amount;

            const shipping = typeof order.shipping === 'string' 
              ? JSON.parse(order.shipping || '{}')
              : (order.shipping || {});

            return {
              id: order.id,
              index: i + 1,
              customer: shipping.name || "Walk-in",
              phone: shipping.phone || "-",
              city: shipping.city || "-",
              amount,
              method: order.payment_method || order.paymentMethod || "Cash",
              status: order.status || "-",
              time: new Date(order.created_at || order.createdAt || '').toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              }) || "-",
            };
          });

        setTodayOrders(rows.length);
        setTodayOrderAmount(total);
        setTodayOrdersList(rows);
      } catch (err) {
        console.error('Error fetching today\'s orders:', err);
      }
    };

    fetchTodayOrders();
  }, []);




  /* -------------------- UI -------------------- */
  if (loading && !cache.dashboardStats) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white/5 rounded-3xl border border-white/10">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Initializing Command Center</p>
      </div>
    );
  }

  return (
    <div className="p-0 space-y-8 relative min-h-[80vh]">
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Members" value={loading ? "..." : stats.members} icon={<FaUsers />} color="from-blue-500 to-cyan-500" />
        <StatCard title="Today's Check-ins" value={loading ? "..." : stats.checkinsToday} icon={<FaCalendarCheck />} color="from-emerald-500 to-teal-500" />
        <StatCard title="Active Plans" value={loading ? "..." : stats.activePlans} icon={<FaDumbbell />} color="from-purple-500 to-pink-500" />
        <StatCard title="Pending Payments" value={loading ? "..." : stats.pendingPayments} icon={<FaFileInvoiceDollar />} color="from-amber-500 to-orange-500" />
        <StatCard title="Available Trainers" value={loading ? "..." : stats.trainers} icon={<FaUserTie />} color="from-indigo-500 to-violet-500" />
        <StatCard title="Equipment Due" value={loading ? "..." : stats.equipmentDue} icon={<FaBox />} color="from-green-500 to-emerald-500" />
        <StatCard title="Total Products" value={loading ? "..." : stats.totalProducts} icon={<FaBox />} color="from-green-500 to-emerald-500" />
        <StatCard title="Total Orders" value={loading ? "..." : stats.totalOrders} icon={<FaTools />} color="from-red-500 to-rose-500" />
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

{/* <AddressForm/> */}
    </div>
  );
}
