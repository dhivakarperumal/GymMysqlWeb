import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPrinter } from "react-icons/fi";
import { useAuth } from "../PrivateRouter/AuthContext";
import api from "../api";

// helper to produce usable image URL or data URI
const makeImageUrl = (img) => {
  if (!img) return "";
  // already full URL or data URI
  if (img.startsWith("http") || img.startsWith("data:")) return img;
  // looks like raw base64 without prefix (common when stored in order_items)
  const maybeBase64 = /^[A-Za-z0-9+/=]+$/.test(img);
  if (maybeBase64 && img.length > 50) {
    return `data:image/webp;base64,${img}`;
  }
  // otherwise treat as relative path on API server
  const base = import.meta.env.VITE_API_URL || "";
  return `${base.replace(/\/$/, "")}/${img.replace(/^\/+/, "")}`;
};

/* ---------------- ORDER STEPS ---------------- */
const ORDER_STEPS = [
  "OrderPlaced",
  "Processing",
  "Packing",
  "OutForDelivery",
  "Delivered",
];

const formatStatus = (s) => s.replace(/([A-Z])/g, " $1").trim();

/* ---------------- NORMALIZE STATUS ---------------- */
const normalizeStatus = (status) => {
  if (!status) return "OrderPlaced";

  const clean = status
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  // ⚠️ Order matters — most specific first
  if (clean === "delivered") return "Delivered";
  if (clean === "outfordelivery") return "OutForDelivery";
  if (clean === "packing") return "Packing";
  if (clean === "processing") return "Processing";
  if (clean === "orderplaced") return "OrderPlaced";

  return "OrderPlaced";
};

const UserOrders = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const shipping =
    typeof selectedOrderDetails?.shipping === "string"
      ? JSON.parse(selectedOrderDetails.shipping)
      : selectedOrderDetails?.shipping;
  const [loadingDetails, setLoadingDetails] = useState(false);

  /* ---------------- FETCH ORDERS ---------------- */
  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders");
        const allOrders = res.data || [];
        // Filter orders for current user
        const userOrders = allOrders.filter(
          (order) => order.user_id === userId,
        );
        setOrders(userOrders);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch orders", err);
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  /* ---------------- FETCH ORDER DETAILS ---------------- */
  useEffect(() => {
    if (!selectedOrder) {
      setSelectedOrderDetails(null);
      return;
    }

    const fetchOrderDetails = async () => {
      setLoadingDetails(true);
      try {
        const res = await api.get(`/orders/${selectedOrder.order_id}`);
        setSelectedOrderDetails(res.data);
      } catch (err) {
        console.error("Failed to fetch order details", err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchOrderDetails();
  }, [selectedOrder]);

  /* ---------------- PRINT ---------------- */
  const handlePrint = async (order) => {
    try {
      const res = await api.get(`/orders/${order.order_id}`);
      const orderDetails = res.data;

      const shipping =
        typeof orderDetails.shipping === "string"
          ? JSON.parse(orderDetails.shipping)
          : orderDetails.shipping;

      const items = orderDetails.items || [];

      const subtotal = items.reduce(
        (sum, i) => sum + Number(i.price) * Number(i.qty),
        0,
      );

      const win = window.open("", "", "width=900,height=700");

      win.document.write(`
<html>
<head>
<title>Invoice</title>

<style>

body{
font-family:Arial, Helvetica, sans-serif;
padding:40px;
background:#fafafa;
color:#333;
}

.header{
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:30px;
border-bottom:2px solid #eee;
padding-bottom:15px;
}

.logo{
font-size:22px;
font-weight:bold;
color:#dc2626;
}

.invoice-title{
font-size:28px;
font-weight:bold;
color:#111;
}

.section{
margin-top:25px;
}

.card{
background:#fff;
border:1px solid #eee;
border-radius:10px;
padding:20px;
margin-top:10px;
}

.grid{
display:grid;
grid-template-columns:1fr 1fr;
gap:20px;
}

.label{
font-weight:bold;
color:#555;
}

table{
width:100%;
border-collapse:collapse;
margin-top:20px;
background:#fff;
border-radius:10px;
overflow:hidden;
}

th{
background:#111;
color:#fff;
padding:12px;
font-size:14px;
}

td{
padding:12px;
border-bottom:1px solid #eee;
font-size:14px;
}

.product{
display:flex;
align-items:center;
gap:10px;
}

.product img{
width:50px;
height:50px;
object-fit:cover;
border-radius:6px;
border:1px solid #eee;
}

.total-box{
margin-top:25px;
background:#fff;
padding:20px;
border-radius:10px;
border:1px solid #eee;
width:280px;
margin-left:auto;
}

.total-row{
display:flex;
justify-content:space-between;
margin-bottom:8px;
font-size:14px;
}

.grand{
font-size:18px;
font-weight:bold;
color:#dc2626;
}

</style>
</head>

<body>

<div class="header">
<div class="logo">
<img src="/images/logo-dark.png" style="height:50px; object-fit:contain;" />
</div>
<div class="invoice-title">INVOICE</div>
</div>

<div class="grid">

<div class="card">
<p class="label">Order Details</p>
<p><b>Order ID:</b> ${orderDetails.order_id}</p>
<p><b>Status:</b> ${formatStatus(normalizeStatus(orderDetails.status))}</p>
<p><b>Date:</b> ${new Date(orderDetails.created_at).toLocaleString()}</p>
<p><b>Payment Method:</b> ${orderDetails.payment_method}</p>
<p><b>Payment Status:</b> ${orderDetails.payment_status}</p>
</div>

${
  shipping
    ? `
<div class="card">
<p class="label">Shipping Address</p>
<p>${shipping.name}</p>
<p>${shipping.phone}</p>
<p>${shipping.email || ""}</p>
<p>${shipping.address}</p>
<p>${shipping.city || ""}, ${shipping.state || ""}</p>
<p>${shipping.zip || ""}</p>
<p>${shipping.country || ""}</p>
</div>
`
    : ""
}

</div>


<div class="section">
<h3>Order Items</h3>

<table>

<tr>
<th>Product</th>
<th>Variant</th>
<th>Qty</th>
<th>Price</th>
<th>Total</th>
</tr>

${items
  .map(
    (i) => `
<tr>

<td>
<div class="product">
<img src="${makeImageUrl(i.image) || "https://via.placeholder.com/50"}"/>
<span>${i.product_name}</span>
</div>
</td>

<td>${i.size || i.color || i.variant || "-"}</td>

<td>${i.qty}</td>

<td>₹${Number(i.price).toLocaleString()}</td>

<td>₹${(i.price * i.qty).toLocaleString()}</td>

</tr>
`,
  )
  .join("")}

</table>
</div>


<div class="total-box">

<div class="total-row">
<span>Subtotal</span>
<span>₹${subtotal.toLocaleString()}</span>
</div>

<div class="total-row grand">
<span>Total</span>
<span>₹${Number(orderDetails.total).toLocaleString()}</span>
</div>

</div>


</body>
</html>
`);

      win.document.close();
      win.focus();
      win.print();
    } catch (err) {
      console.error("Failed to fetch order details for print", err);
      alert("Failed to load order details for printing");
    }
  };

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="p-10 text-center text-red-500 tracking-widest bg-black min-h-screen">
        LOADING ORDERS...
      </div>
    );
  }

  /* ---------------- EMPTY ---------------- */
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="flex flex-col items-center text-center bg-gray-900 border border-red-500/30 rounded-xl p-12 text-white space-y-4">
          <div className="text-5xl">🛒</div>
          <h2 className="text-xl font-bold text-red-500">No Orders Yet</h2>
          <p className="text-gray-400 max-w-md">
            Looks like you haven’t purchased anything yet.
          </p>
          <button
            onClick={() => navigate("/products")}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-full font-semibold"
          >
            🏋️ Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6">
      {/* ---------------- ORDER CARDS ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className="cursor-pointer bg-gray-900 border border-red-500/30 rounded-xl p-5 text-white hover:border-red-500 transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-red-500">
                  Order ID: {order.order_id}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs rounded-full bg-red-600">
                  {formatStatus(normalizeStatus(order.status))}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrint(order);
                  }}
                  className="p-2 bg-black border border-red-500/30 rounded-lg hover:bg-red-600 transition"
                >
                  <FiPrinter />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <p className="font-semibold">Total: ₹{order.total}</p>
              <p className="text-sm text-gray-400">
                Payment: {order.payment_status}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ---------------- ORDER DETAILS MODAL ---------------- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-gray-900 text-white w-full max-w-3xl rounded-2xl p-6 relative max-h-[85vh] hide-scrollbar overflow-y-auto border border-red-500/30">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold mb-4 text-red-500">
              Order Details
            </h3>

            {loadingDetails ? (
              <div className="text-center py-8">Loading order details...</div>
            ) : selectedOrderDetails ? (
              <>
                <div className="flex justify-between mb-4">
                  <p>
                    <b>Order ID:</b> {selectedOrderDetails.order_id}
                  </p>
                  <span className="px-4 py-1 rounded-full bg-red-600 text-white text-sm">
                    {formatStatus(normalizeStatus(selectedOrderDetails.status))}
                  </span>
                </div>

                {/* ADDRESS */}
                {shipping && (
                  <div className="border border-red-500/20 rounded-xl p-4 mb-6 bg-black">
                    <h4 className="font-semibold mb-2 text-red-500">
                      Delivery Address
                    </h4>

                    <p className="font-medium">{shipping.name}</p>
                    <p className="text-sm text-gray-400">{shipping.email}</p>
                    <p className="text-sm text-gray-400">{shipping.phone}</p>

                    <p className="text-sm text-gray-400">
                      {shipping.address}, {shipping.city}
                    </p>

                    <p className="text-sm text-gray-400">
                      {shipping.state} - {shipping.zip}
                    </p>

                    <p className="text-sm text-gray-400">{shipping.country}</p>
                  </div>
                )}

                {/* ITEMS */}
                <table className="w-full text-sm mb-4">
                  <thead className="bg-black border-b border-red-500/30">
                    <tr>
                      <th className="p-3 text-left text-red-500">Product</th>
                      <th className="p-3 text-center text-red-500">Qty</th>
                      <th className="p-3 text-center text-red-500">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrderDetails.items || []).map((item, i) => (
                      <tr key={i} className="border-b border-red-500/20">
                        <td className="p-3 flex items-center gap-3">
                          {/* PRODUCT IMAGE */}
                          {(() => {
                            const raw = makeImageUrl(item.image);
                            // if it's a data uri but extremely short/likely truncated, force invalid to trigger onError
                            const src =
                              raw && raw.startsWith("data:") && raw.length < 150
                                ? "invalid"
                                : raw;
                            return (
                              <img
                                src={src || "https://via.placeholder.com/60"}
                                alt={item.product_name}
                                className="w-14 h-14 object-cover rounded-lg border border-red-500/30"
                                onError={(e) => {
                                  console.error(
                                    "order item image failed to load",
                                    e.target.src,
                                    "length",
                                    e.target.src.length,
                                  );
                                  e.target.src =
                                    "https://via.placeholder.com/60";
                                }}
                              />
                            );
                          })()}

                          <div>
                            <p className="font-semibold">{item.product_name}</p>

                            {item.size && (
                              <p className="text-xs text-gray-400">
                                Size: {item.size}
                              </p>
                            )}

                            {item.color && (
                              <p className="text-xs text-gray-400">
                                Color: {item.color}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="p-3 text-center">{item.qty}</td>

                        <td className="p-3 text-center">
                          ₹{Number(item.price).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between font-bold mb-6 border-t border-red-500/20 pt-4">
                  <span>Total</span>
                  <span className="text-red-500">
                    ₹{selectedOrderDetails.total}
                  </span>
                </div>

                {/* TRACK ORDER */}
                <h4 className="font-semibold mb-4 text-center text-red-500">
                  Track Order
                </h4>

                {(() => {
                  const rawStatus = selectedOrderDetails.status;
                  const normalizedStatus = normalizeStatus(rawStatus);

                  const stepIndex = ORDER_STEPS.findIndex(
                    (step) => step === normalizedStatus,
                  );

                  console.log("🧾 RAW STATUS FROM FIRESTORE 👉", rawStatus);
                  console.log("🧹 NORMALIZED STATUS 👉", normalizedStatus);
                  console.log("📍 ORDER STEPS 👉", ORDER_STEPS);
                  console.log("🔢 STEP INDEX 👉", stepIndex);

                  const safeStep = stepIndex === -1 ? 0 : stepIndex;

                  return (
                    <div className="flex items-center justify-between w-full mt-6">
                      {ORDER_STEPS.map((step, index) => {
                        const isCompleted = index < safeStep;
                        const isActive = index === safeStep;

                        return (
                          <React.Fragment key={step}>
                            <div className="flex flex-col items-center min-w-[70px]">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                  ${
                    isCompleted
                      ? "bg-red-600 text-white"
                      : isActive
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-gray-700 text-gray-400"
                  }
                `}
                              >
                                {index + 1}
                              </div>

                              <span className="text-xs mt-2 text-center">
                                {formatStatus(step)}
                              </span>
                            </div>

                            {index !== ORDER_STEPS.length - 1 && (
                              <div
                                className={`flex-1 h-1 mx-2 rounded ${
                                  isCompleted ? "bg-red-600" : "bg-gray-700"
                                }`}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="text-center py-8">
                Failed to load order details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOrders;
