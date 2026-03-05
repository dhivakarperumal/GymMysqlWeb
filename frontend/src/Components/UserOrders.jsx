import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPrinter } from "react-icons/fi";
import { useAuth } from "../PrivateRouter/AuthContext";
import api from "../api";

/* ---------------- ORDER STEPS ---------------- */
const ORDER_STEPS = [
  "OrderPlaced",
  "Processing",
  "Packing",
  "OutForDelivery",
  "Delivered",
];

const formatStatus = (s) =>
  s.replace(/([A-Z])/g, " $1").trim();

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
  const [loadingDetails, setLoadingDetails] = useState(false);

  /* ---------------- FETCH ORDERS ---------------- */
  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        const allOrders = res.data || [];
        // Filter orders for current user
        const userOrders = allOrders.filter(order => order.user_id === userId);
        setOrders(userOrders);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch orders', err);
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
        console.error('Failed to fetch order details', err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchOrderDetails();
  }, [selectedOrder]);

  /* ---------------- PRINT ---------------- */
  const handlePrint = async (order) => {
    try {
      // Fetch order details including items
      const res = await api.get(`/orders/${order.order_id}`);
      const orderDetails = res.data;

      const win = window.open("", "", "width=800,height=600");
      win.document.write(`
        <h2>Order Invoice</h2>
        <p><b>Order ID:</b> ${orderDetails.order_id}</p>
        <p><b>Status:</b> ${formatStatus(normalizeStatus(orderDetails.status))}</p>
        <table border="1" width="100%" cellspacing="0" cellpadding="8">
          <tr>
            <th>Product</th><th>Qty</th><th>Price</th>
          </tr>
          ${(orderDetails.items || [])
          .map(
            (i) => `
                <tr>
                  <td>${i.name || 'Product'}</td>
                  <td>${i.quantity}</td>
                  <td>₹${i.price}</td>
                </tr>`
          )
          .join("")}
        </table>
        <h3>Total: ₹${orderDetails.total}</h3>
      `);
      win.print();
      win.close();
    } catch (err) {
      console.error('Failed to fetch order details for print', err);
      alert('Failed to load order details for printing');
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
                  <p><b>Order ID:</b> {selectedOrderDetails.order_id}</p>
                  <span className="px-4 py-1 rounded-full bg-red-600 text-white text-sm">
                    {formatStatus(normalizeStatus(selectedOrderDetails.status))}
                  </span>
                </div>

                {/* ADDRESS */}
                {selectedOrderDetails.shipping && (
                  <div className="border border-red-500/20 rounded-xl p-4 mb-6 bg-black">
                    <h4 className="font-semibold mb-2 text-red-500">
                      Delivery Address
                    </h4>
                    <p className="font-medium">{selectedOrderDetails.shipping.name}</p>
                    <p className="text-sm text-gray-400">{selectedOrderDetails.shipping.email}</p>
                    <p className="text-sm text-gray-400">{selectedOrderDetails.shipping.phone}</p>
                    <p className="text-sm text-gray-400">
                      {selectedOrderDetails.shipping.address},{" "}
                      {selectedOrderDetails.shipping.city},{" "}
                      {selectedOrderDetails.shipping.state},{" "}
                      {selectedOrderDetails.shipping.country}
                    </p>
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
                        <td className="p-3">{item.name || 'Product'}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-center">₹{item.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between font-bold mb-6 border-t border-red-500/20 pt-4">
                  <span>Total</span>
                  <span className="text-red-500">₹{selectedOrderDetails.total}</span>
                </div>

                {/* TRACK ORDER */}
                <h4 className="font-semibold mb-4 text-center text-red-500">
                  Track Order
                </h4>

                {(() => {
                  const rawStatus = selectedOrderDetails.status;
                  const normalizedStatus = normalizeStatus(rawStatus);

              const stepIndex = ORDER_STEPS.findIndex(
                (step) => step === normalizedStatus
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
                  ${isCompleted
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
                            className={`flex-1 h-1 mx-2 rounded ${isCompleted ? "bg-red-600" : "bg-gray-700"
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
              <div className="text-center py-8">Failed to load order details</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOrders;