import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";

const inputClass =
  "w-full bg-[#0f172a]/70 border border-white/10 rounded-xl px-4 py-4 text-left text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500";

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState("");
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderType, setOrderType] = useState("OFFLINE");

  /* ================= SHIPPING STATE ================= */
  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
  });

  /* ================= LOAD PRODUCTS ================= */
  useEffect(() => {
    const loadProducts = async () => {
      const snap = await getDocs(collection(db, "products"));
      setProducts(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    };
    loadProducts();
  }, []);

  const generateOrderNumber = async () => {
  const ref = doc(db, "counters", "current");

  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const next = (snap.exists() ? snap.data().current : 0) + 1;
    tx.set(ref, { current: next }, { merge: true });
    return `ORD${String(next).padStart(3, "0")}`;
  });
};

  /* ================= ADD TO CART ================= */
  const addToCart = () => {
    if (!product || !variant || qty <= 0)
      return toast.error("Select product, variant & qty");

    const variantData = product.stock?.[variant];

    if (!variantData || qty > variantData.qty)
      return toast.error("Insufficient stock");

    let price = 0;

    if (product.category === "Food") {
      price = Number(variantData.offerPrice || 0);
    } else {
      price = Number(product.offerPrice || 0);
    }

    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        category: product.category,
        variant,
        price,
        quantity: qty,
        total: price * qty,
      },
    ]);

    setQty(1);
    setVariant("");
  };

  const removeItem = (index) =>
    setCart((prev) => prev.filter((_, i) => i !== index));

  const subtotal = cart.reduce((s, i) => s + i.total, 0);

  /* ================= SAVE BILL ================= */
  const saveBill = async () => {
  if (!cart.length) return toast.error("Cart empty");

  for (const key in shipping) {
    if (!shipping[key]) return toast.error("Fill all shipping fields");
  }

  try {
    setLoading(true);

    /* 1️⃣ GET ORDER NUMBER FIRST */
    const orderId = await generateOrderNumber();

    /* 2️⃣ NOW RUN STOCK + ORDER TRANSACTION */
    await runTransaction(db, async (tx) => {
      const productReads = [];

      for (const item of cart) {
        const productRef = doc(db, "products", item.productId);
        const productSnap = await tx.get(productRef);

        if (!productSnap.exists()) {
          throw new Error("Product missing");
        }

        const data = productSnap.data();
        const stock = data.stock || {};
        const variantStock = stock[item.variant];

        if (!variantStock || variantStock.qty < item.quantity) {
          throw new Error(`Stock changed for ${data.name}`);
        }

        productReads.push({
          ref: productRef,
          data,
          variant: item.variant,
          qty: item.quantity,
        });
      }

      /* UPDATE STOCK */
      productReads.forEach((p) => {
        const updatedStock = { ...p.data.stock };

        updatedStock[p.variant] = {
          ...updatedStock[p.variant],
          qty: updatedStock[p.variant].qty - p.qty,
        };

        tx.update(p.ref, {
          stock: updatedStock,
          updatedAt: serverTimestamp(),
        });
      });

      /* SAVE ORDER */
      const orderRef = doc(collection(db, "orders"));

      tx.set(orderRef, {
        docId: orderRef.id,
        orderId,
        orderType,
        items: cart,
        shipping,
        paymentMethod: orderType === "ONLINE" ? "ONLINE" : "CASH",
        paymentStatus: "paid",
        status: "delivered",
        subtotal,
        total: subtotal,
        createdAt: serverTimestamp(),
      });
    });

    toast.success("Order placed successfully");
    setCart([]);
  } catch (err) {
    console.error(err);
    toast.error(err.message || "Billing failed");
  } finally {
    setLoading(false);
  }
};


  /* ================= UI ================= */
  return (
    <div className="p-6 max-w-6xl mx-auto text-white bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">

      <div className="mb-3">
        <h1 className="page-title text-2xl font-bold text-white">Billing</h1>
      </div>

      {/* ADD PRODUCTS */}
      <h3 className="text-lg font-semibold mb-3">Add Products</h3>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <select
          className={inputClass}
          onChange={(e) =>
            setProduct(
              products.find(
                (p) => p.id === e.target.value
              )
            )
          }
        >
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          className={inputClass}
          value={variant}
          onChange={(e) => setVariant(e.target.value)}
        >
          <option value="">Select Variant</option>
          {product &&
            Object.entries(product.stock || {}).map(
              ([k, v]) => (
                <option key={k} value={k}>
                  {k} | Stock: {v.qty}
                </option>
              )
            )}
        </select>

        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) =>
            setQty(Number(e.target.value))
          }
          className={inputClass}
        />

        <button
          onClick={addToCart}
          className="px-6 py-2 rounded-lg bg-orange-600 text-white font-semibold"
        >
          Add
        </button>
      </div>

      {/* SHIPPING DETAILS */}
      <h3 className="text-lg font-semibold mb-3">
        Shipping Details
      </h3>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {Object.keys(shipping).map((key) => (
          <div key={key}>
            <label className="text-xs text-gray-400 uppercase">
              {key}
            </label>
            <input
              className={inputClass}
              value={shipping[key]}
              onChange={(e) =>
                setShipping((prev) => ({
                  ...prev,
                  [key]: e.target.value,
                }))
              }
            />
          </div>
        ))}
      </div>

      <label className="text-xs text-gray-400 uppercase">
  Order Type
</label>

<div className="mb-6">
  <select
    value={orderType}
    onChange={(e) => setOrderType(e.target.value)}
    className={inputClass}
  >
    <option value="OFFLINE">Offline</option>
    <option value="ONLINE">Online</option>
  </select>
</div>

      {/* CART (desktop) */}
      <div className="hidden sm:block overflow-x-auto bg-white/5 rounded-xl mb-6">
        <table className="min-w-full text-sm">
          <thead className="bg-white/10">
            <tr>
              <th className="px-4 py-4 text-left">S.No</th>
              <th className="px-4 py-4 text-left">Product</th>
              <th className="px-4 py-4 text-left">Variant</th>
              <th className="px-4 py-4 text-left">Qty</th>
              <th className="px-4 py-4 text-left">Price</th>
              <th className="px-4 py-4 text-left">Total</th>
              <th className="px-4 py-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((i, idx) => (
              <tr key={idx}>
                <td className="px-4 py-4 text-left">
                  {idx + 1}
                </td>
                <td className="px-4 py-4 text-left">
                  {i.name}
                </td>
                <td className="px-4 py-4 text-left">
                  {i.variant}
                </td>
                <td className="px-4 py-4 text-left">
                  {i.quantity}
                </td>
                <td className="px-4 py-4 text-left">
                  ₹{i.price}
                </td>
                <td className="px-4 py-4 text-left">
                  ₹{i.total}
                </td>
                <td className="px-4 py-4 text-left">
                  <button
                    onClick={() =>
                      removeItem(idx)
                    }
                    className="text-red-400"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CART (mobile cards) */}
      <div className="sm:hidden space-y-3 mb-6">
        {cart.length === 0 ? (
          <div className="text-center py-6 text-white/50">Cart is empty</div>
        ) : (
          cart.map((i, idx) => (
            <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-white">{i.name}</p>
                  <p className="text-xs text-gray-400">{i.variant}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{i.total}</p>
                  <p className="text-xs text-gray-400">Qty: {i.quantity}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button onClick={() => removeItem(idx)} className="text-red-400">Remove</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* TOTAL */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">
          Grand Total: ₹{subtotal}
        </h3>

        <button
          disabled={loading}
          onClick={saveBill}
          className="px-6 py-2 bg-orange-600 rounded-lg text-white font-semibold"
        >
          {loading ? "Saving..." : "Place Order"}
        </button>
      </div>
    </div>
  );
};

export default Billing;
