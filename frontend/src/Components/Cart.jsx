import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import PageContainer from "./PageContainer";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "./PageHeader";
import { ShoppingCart } from "lucide-react";
import { auth } from "../firebase";

export default function Cart() {
  const userId = auth.currentUser?.uid;
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    if (!userId) return;

    const snap = await getDocs(collection(db, "users", userId, "cart"));

    setItems(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })),
    );
  };
  const getAvailableStock = async (item) => {
    const ref = doc(db, "products", item.productId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return 0;

    const product = snap.data();

    if (item.weight) {
      return product.stock?.[item.weight] || 0;
    }

    if (item.size && item.gender) {
      return product.stock?.[`${item.size}-${item.gender}`] || 0;
    }

    return 0;
  };

  const updateQty = async (item, qty) => {
    if (qty < 1) return;

    const stock = await getAvailableStock(item);

    if (qty > stock) {
      alert(`Only ${stock} items available`);
      return;
    }

    updateDoc(doc(db, "users", userId, "cart", item.id), { quantity: qty });
    fetchCart();
  };

  const removeItem = async (id) => {
    await deleteDoc(doc(db, "users", userId, "cart", id));
    fetchCart();
  };

  const total = items.reduce((a, c) => a + c.price * c.quantity, 0);

  const itemCount = items.length;
  const totalQty = items.reduce((a, c) => a + c.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="bg-black text-white ">
        <PageHeader
          title="Cart"
          subtitle="World-class gym equipment & training zones"
          bgImage="https://images.unsplash.com/photo-1571902943202-507ec2618e8f"
        />
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div
              className="
    w-20 h-20
    flex items-center justify-center
    rounded-full
    border-2 border-red-500/50
    shadow-[0_0_40px_rgba(255,0,0,0.4)]
  "
            >
              <ShoppingCart size={36} className="text-red-500" />
            </div>

            <p className="text-white/70 text-xl tracking-widest">
              Your cart is empty
            </p>

            <button
              onClick={() => navigate("/products")}
              className="
      px-10 py-4 rounded-full
      bg-gradient-to-r from-[#eb613e] to-red-700
      tracking-widest text-sm
      shadow-[0_0_40px_rgba(255,0,0,0.6)]
      hover:scale-105 transition cursor-pointer
    "
            >
              GO TO PRODUCTS
            </button>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="bg-black text-white ">
      <PageHeader
        title="Cart"
        subtitle="World-class gym equipment & training zones"
        bgImage="https://images.unsplash.com/photo-1571902943202-507ec2618e8f"
      />
      <PageContainer>
        <div className="grid lg:grid-cols-3 gap-10 py-10">
          {/* LEFT TABLE */}
          <div className="lg:col-span-2 overflow-x-auto">
            <table className="w-full border-collapse bg-[#0b0c10]/90 rounded-2xl overflow-hidden">
              <thead className="bg-gradient-to-r from-orange-500 to-red-700 ">
                <tr className="text-left">
                  <th className="p-4">Product</th>
                  <th className="p-4 min-w-[110px]">Variant</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Subtotal</th>
                  <th className="p-4 text-center">Remove</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-white/30">
                    <td className="p-4">
                      <div className="flex items-center gap-4 md:gap-7">
                        <img
                          src={item.image}
                          className="w-16 h-16 object-contain border border-red-500/40 rounded-xl"
                        />
                        <span className="font-semibold text-red-500 max-w-[180px] block truncate">
                          {item.name}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 pl-8 whitespace-nowrap">
                      {item.weight || `${item.size}-${item.gender}`}
                    </td>

                    <td className="p-4 font-bold">₹{item.price}</td>

                    <td className="p-4">
                      <div className="flex items-center border border-red-500/40 rounded-lg w-fit">
                        <button
                          onClick={() => updateQty(item, item.quantity - 1)}
                          className="px-3 py-1 hover:bg-red-600"
                        >
                          −
                        </button>

                        <span className="px-4">{item.quantity}</span>

                        <button
                          onClick={() => updateQty(item, item.quantity + 1)}
                          className="px-3 py-1 hover:bg-red-600"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="p-4 font-bold">
                      ₹{item.price * item.quantity}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:scale-110 transition"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RIGHT ORDER SUMMARY */}
          <div
            className="
      bg-[#0b0c10]/90 backdrop-blur-xl
      rounded-3xl border-2 border-red-500/60
      p-6 h-fit
      shadow-[0_0_40px_rgba(255,0,0,0.2)]
    "
          >
            <h3 className="text-2xl font-bold text-red-500 mb-6">
              Order Summary
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span>Items</span>
                <span>{itemCount}</span>
              </div>

              <div className="flex justify-between">
                <span>Quantity</span>
                <span>{totalQty}</span>
              </div>

              <div className="flex justify-between">
                <span>Sub Total</span>
                <span>₹{total}</span>
              </div>

              <div className="border-t border-red-500/40 pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-red-500">₹{total}</span>
              </div>
            </div>

            <button
              onClick={() =>
                navigate("/checkout", {
                  state: { items, total },
                })
              }
              className="
        mt-6 w-full py-4 rounded-xl
        bg-gradient-to-r from-orange-500 to-red-700
        tracking-widest text-sm
        shadow-[0_0_40px_rgba(255,0,0,0.6)]
        hover:scale-105 transition cursor-pointer
      "
            >
              Proceed To Checkout
            </button>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
