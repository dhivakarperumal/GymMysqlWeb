import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../PrivateRouter/AuthContext";
import PageHeader from "../Components/PageHeader";
import PageContainer from "../Components/PageContainer";

export default function Products() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/products");
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("load products", err);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addToCart = async (prod) => {
    if (!userId) {
      navigate("/login");
      return;
    }

    // build a safe payload with fallback keys
    const payload = {
      userId,
      productId: prod.id ?? prod.product_id,
      variant: null,
      quantity: 1,
      price: Number(prod.offer_price ?? prod.mrp ?? prod.offerPrice ?? 0) || 0,
      productName: prod.name,
      productImage: Array.isArray(prod.images) ? prod.images[0] : prod.images || "",
    };

    try {
      await api.post("/cart", payload);
      toast.success("Added to cart");
    } catch (err) {
      console.error("addToCart failed", err, "payload", payload);
      const message = err.response?.data?.error || err.message || "Failed to add to cart";
      toast.error(message);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-white">Loading...</div>;
  }

  return (
    <div className="bg-black text-white">
      <PageHeader
        title="Products"
        subtitle="Browse our catalog"
        bgImage="https://images.unsplash.com/photo-1571902943202-507ec2618e8f"
      />
      <PageContainer>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => {
            const id = p.id ?? p.product_id;
            if (!id) {
              console.warn("product without id", p);
              return null;
            }
            return (
              <div
                key={id}
                className="bg-white/10 p-4 rounded-xl hover:bg-white/20 cursor-pointer"
              >
                <img
                  src={(Array.isArray(p.images) ? p.images[0] : "") ||
                    "https://via.placeholder.com/150"}
                  alt={p.name}
                  className="w-full h-40 object-contain mb-2"
                  onClick={() => navigate(`/products/${id}`)}
                />
                <p className="font-semibold truncate" onClick={() => navigate(`/products/${id}`)}>
                  {p.name}
                </p>
                <p className="text-sm text-gray-400">₹{p.offer_price || p.mrp}</p>
                <button
                  onClick={() => addToCart(p)}
                  className="mt-2 w-full py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg text-white text-sm"
                >
                  Add to Cart
                </button>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </div>
  );
}
