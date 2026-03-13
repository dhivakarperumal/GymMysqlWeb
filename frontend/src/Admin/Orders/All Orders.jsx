import { useEffect, useState, useMemo } from "react";
import api from "../../api";
import {
  FaPrint,
  FaTruck,
  FaClipboardList,
  FaMoneyBillWave,
  FaCheckCircle,
  FaSearch,
  FaTimesCircle,
  FaThLarge,
  FaList,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

/* ================= HELPERS ================= */

// format order ID with prefix and padding
const formatOrderId = (id) => {
  if (!id) return "";
  const num = parseInt(String(id).replace(/[^0-9]/g, ""), 10) || 0;
  return `ORD${String(num).padStart(3, "0")}`;
};

const normalizeKey = (s) =>
  String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const formatStatusLabel = (status) => {
  const k = normalizeKey(status);
  const map = {
    orderplaced: "Order Placed",
    processing: "Processing",
    packing: "Packing",
    shipped: "Shipped",
    outfordelivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return map[k] || status || "-";
};

const STATUS_SEQUENCE = [
  "orderplaced",
  "processing",
  "packing",
  "shipped",
  "outfordelivery",
  "delivered",
];


const makeImageUrl = (img) => {
  if (!img) return "";
  if (img.startsWith("http") || img.startsWith("data:")) return img;
  const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return `${base.replace(/\/$/, "")}/${img.replace(/^\/+/, "")}`;
};


const getCustomerDetails = (o) => {
  if (normalizeKey(o.orderType) === "pickup") {
    return { name: o.pickup?.name || "-" };
  }
  return { name: o.shipping?.name || "-" };
};

/* ================= STAT CARD ================= */
const StatCard = ({ title, value, icon, gradient }) => (
  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-xs text-gray-300">{title}</p>
        <h2 className="text-2xl font-bold text-white">{value}</h2>
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
        {icon}
      </div>
    </div>
  </div>
);

/* ================= PAGE ================= */
const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [view, setView] = useState("table");
  const navigate=useNavigate();

  /* PAGINATION */
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  /* ================= LOAD ================= */
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/orders");
        const raw = res.data || [];
        const formatted = raw.map((o) => ({
          ...o,
          orderId: o.order_id,
          paymentStatus: o.payment_status,
          orderType: o.order_type,
          shipping: o.shipping,
          pickup: o.pickup,
          createdAt: o.created_at,
        }));
        setOrders(formatted);
      } catch (err) {
        console.error("failed to load orders", err);
      }
    };
    fetch();
  }, []);

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter(
      (o) => normalizeKey(o.status) === "delivered"
    ).length;
    const cancelled = orders.filter(
      (o) => normalizeKey(o.status) === "cancelled"
    ).length;
    const paid = orders.filter(
      (o) => normalizeKey(o.paymentStatus) === "paid"
    ).length;

    const revenue = orders
      .filter((o) => normalizeKey(o.status) !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    return { total, delivered, cancelled, paid, revenue };
  }, [orders]);

  /* ================= FILTER ================= */
  const filteredOrders = orders.filter((o) => {
    const customer = getCustomerDetails(o);

    const matchSearch =
      String(o.order_id || o.orderId || "").toLowerCase().includes(search.toLowerCase()) ||
      customer.name?.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "all" ||
      normalizeKey(o.status) === normalizeKey(statusFilter);

    const matchPayment =
      paymentFilter === "all" ||
      normalizeKey(o.paymentStatus) === normalizeKey(paymentFilter);
    // DELIVERY ONLY → SHOW DELIVERED ORDERS ONLY
    if (deliveryOnly) {
      if (!normalizeKey(o.status).includes("delivered")) return false;
    }


    return matchSearch && matchStatus && matchPayment;
  });

  /* ================= PAGINATION LOGIC ================= */
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, currentPage]);

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (orderId, newStatus) => {
    let reason = null;

    if (newStatus === "cancelled") {
      reason = window.prompt("Enter cancel reason:");
      if (reason === null) return;
    }

    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus, cancelledReason: reason });
      const res = await api.get("/orders");
      const raw = res.data || [];
      const formatted = raw.map((o) => ({
        ...o,
        orderId: o.order_id,
        paymentStatus: o.payment_status,
        orderType: o.order_type,
        shipping: o.shipping,
        pickup: o.pickup,
        createdAt: o.created_at,
      }));
      setOrders(formatted);
    } catch (err) {
      console.error("updateStatus error:", err);
      
      // Better error messaging
      let errorMessage = "Failed to update status";
      if (err.code === "ERR_NETWORK" || !err.response) {
        errorMessage = "Cannot connect to server. Please check:\n1. Backend server is running on localhost:5000\n2. Network connectivity";
      } else if (err.response?.status === 401) {
        errorMessage = "Unauthorized. Please login again.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      alert(errorMessage);
    }
  };

  /* ================= PRINT ================= */
  const printOrder = (o) => {
    const w = window.open("", "_blank");
    if (!w) return alert("Popup blocked");

    w.document.write(`<h2>Order ${o.orderId}</h2>`);
    w.document.write(
      `<p>Total: ₹ ${Number(o.total).toLocaleString("en-IN")}</p>`
    );
    w.document.close();
    w.print();
  };

  /* ================= STATUS BADGE ================= */
  const statusBadge = (status) => {
    const key = normalizeKey(status);
    const base =
      key === "delivered"
        ? "bg-emerald-500/20 text-emerald-300"
        : key === "shipped"
          ? "bg-blue-500/20 text-blue-300"
          : key === "cancelled"
            ? "bg-red-500/20 text-red-300"
            : "bg-amber-500/20 text-amber-300";

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${base}`}>
        {formatStatusLabel(status)}
      </span>
    );
  };

  return (
    <div className="space-y-8 text-white">

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total" value={stats.total} icon={<FaClipboardList />} gradient="from-blue-500 to-cyan-500" />
        <StatCard title="Delivered" value={stats.delivered} icon={<FaTruck />} gradient="from-emerald-500 to-teal-500" />
        <StatCard title="Cancelled" value={stats.cancelled} icon={<FaTimesCircle />} gradient="from-red-500 to-rose-500" />
        <StatCard title="Paid" value={stats.paid} icon={<FaCheckCircle />} gradient="from-green-500 to-emerald-500" />
        <StatCard title="Revenue" value={`₹ ${stats.revenue.toLocaleString("en-IN")}`} icon={<FaMoneyBillWave />} gradient="from-indigo-500 to-violet-500" />
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex flex-col lg:flex-row gap-3 justify-between">

        {/* SEARCH */}
        <div className="relative w-full lg:w-1/3">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            placeholder="Search Order ID or Member"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white"
          />
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-2">

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="orderplaced">Order Placed</option>
            <option value="processing">Processing</option>
            <option value="packing">Packing</option>
            <option value="shipped">Shipped</option>
            <option value="outfordelivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>

          <button
            onClick={() => setDeliveryOnly((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-sm border flex items-center gap-2 ${deliveryOnly
                ? "bg-orange-500 border-orange-500"
                : "bg-white/10 border-white/20"
              }`}
          >
            <FaTruck /> Delivery Only
          </button>

          {/* VIEW TOGGLE */}
          <div className="flex border border-white/20 rounded-xl overflow-hidden">
            <button
              onClick={() => setView("table")}
              className={`px-3 py-2 ${view === "table" ? "bg-white/20" : "bg-transparent"
                }`}
            >
              <FaList />
            </button>
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-2 ${view === "grid" ? "bg-white/20" : "bg-transparent"
                }`}
            >
              <FaThLarge />
            </button>
          </div>
        </div>
      </div>

      {/* ================= TABLE VIEW ================= */}
      {view === "table" && (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/20">
                <tr>
                  
                  <th className="px-4 py-4 text-left">Order ID</th>
                  <th className="px-4 py-4 text-left">Member</th>
                  <th className="px-4 py-4 text-left">Amount</th>
                  <th className="px-4 py-4 text-left">Payment</th>
                  <th className="px-4 py-4 text-left">Status</th>
                  <th className="px-4 py-4 text-left">Products</th>
                  <th className="px-4 py-4 text-left">Actions</th>

                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((o) => (
                  <tr key={o.order_id} className="border-b border-white/10 hover:bg-white/5">
                   
                    <td onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }} className="px-4 py-3 cursor-pointer hover:text-orange-400">{formatOrderId(o.order_id)}</td>
                    <td onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }} className="px-4 py-3">
                      {o.shipping?.name || o.pickup?.name || "-"}
                    </td>
                    <td className="px-4 py-3">
                      ₹{Number(o.total).toLocaleString("en-IN")}
                    </td>
                    <td onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }} className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        normalizeKey(o.paymentStatus) === "paid" 
                          ? "bg-green-500/20 text-green-300" 
                          : "bg-amber-500/20 text-amber-300"
                      }`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(o.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 max-w-[200px]">
                        {(o.items || []).map((item, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white/5 border border-white/10 rounded-lg p-1 flex items-center gap-2 group relative cursor-help"
                            title={`${item.product_name} x ${item.qty}`}
                          >
                             {item.image && (
                               <img 
                                 src={makeImageUrl(item.image)} 
                                 className="w-6 h-6 object-cover rounded" 
                                 alt="" 
                               />
                             )}
                             <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1 rounded">x{item.qty}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                       <select
                        value={normalizeKey(o.status)}
                        onChange={(e) => updateStatus(o.order_id, e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                      >
                        {normalizeKey(o.status) === "cancelled" ? (
                          <option value="cancelled">Cancelled</option>
                        ) : (
                          <>
                            {STATUS_SEQUENCE.map((step, idx) => {
                              const currentIdx = STATUS_SEQUENCE.indexOf(normalizeKey(o.status));
                              // Only show current and future statuses
                              if (idx < currentIdx && currentIdx !== -1) return null;
                              return <option key={step} value={step}>{formatStatusLabel(step)}</option>;
                            })}
                            
                            {/* Only show Cancelled if NOT yet shipped or beyond */}
                            {(STATUS_SEQUENCE.indexOf(normalizeKey(o.status)) < STATUS_SEQUENCE.indexOf("shipped")) && (
                              <option value="cancelled">Cancelled</option>
                            )}
                          </>
                        )}
                      </select>

                      <button
                        onClick={() => printOrder(o)}
                        className="px-2 py-1 bg-gray-700 rounded-lg text-xs flex items-center gap-1"
                      >
                        <FaPrint /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= GRID VIEW ================= */}
      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedOrders.map((o) => (
            <div
              key={o.order_id}
              className="bg-white/10 border border-white/20 rounded-2xl p-4 space-y-2"
            >
              <div onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }} className="flex justify-between items-center">
                <h3 className="font-bold">{formatOrderId(o.order_id || o.orderId)}</h3>
                {statusBadge(o.status)}
              </div>

              <p onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }} className="text-sm text-gray-300">
                {o.shipping?.name || o.pickup?.name || "-"}
              </p>

              <div className="flex flex-wrap gap-2 py-2">
                {(o.items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
                     {item.image && (
                       <img 
                         src={makeImageUrl(item.image)} 
                         className="w-8 h-8 object-cover rounded-lg" 
                         alt="" 
                       />
                     )}
                     <div className="min-w-0">
                       <p className="text-[10px] font-medium truncate w-[100px]">{item.product_name}</p>
                       <p className="text-[9px] text-gray-400">Qty: {item.qty} | ₹{item.price}</p>
                     </div>
                  </div>
                ))}
              </div>

              <p onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }} className="font-semibold">
                ₹ {Number(o.total).toLocaleString("en-IN")}
              </p>

              <p className="text-xs">{o.paymentStatus}</p>

              <div className="flex gap-2">
                <select
                  value={normalizeKey(o.status)}
                  onChange={(e) => updateStatus(o.order_id, e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs w-full focus:ring-1 focus:ring-orange-500 outline-none"
                >
                  {normalizeKey(o.status) === "cancelled" ? (
                    <option value="cancelled">Cancelled</option>
                  ) : (
                    <>
                      {STATUS_SEQUENCE.map((step, idx) => {
                        const currentIdx = STATUS_SEQUENCE.indexOf(normalizeKey(o.status));
                        if (idx < currentIdx && currentIdx !== -1) return null;
                        return <option key={step} value={step}>{formatStatusLabel(step)}</option>;
                      })}
                      
                      {/* Hide Cancelled if Shipped/Delivered */}
                      {(STATUS_SEQUENCE.indexOf(normalizeKey(o.status)) < STATUS_SEQUENCE.indexOf("shipped")) && (
                        <option value="cancelled">Cancelled</option>
                      )}
                    </>
                  )}
                </select>

                <button
                  onClick={() => printOrder(o)}
                  className="px-2 py-1 bg-gray-700 rounded-lg text-xs flex items-center gap-1"
                >
                  <FaPrint />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= PAGINATION ================= */}
      <div className="flex justify-end gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg disabled:opacity-50"
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded-lg border ${currentPage === i + 1
                ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white/10 border-white/20"
              }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AllOrders;
