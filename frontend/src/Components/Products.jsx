import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // adjust path if needed
import PageContainer from "./PageContainer";
import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PageHeader from "./PageHeader";
import AOS from "aos";
import "aos/dist/aos.css";
import ProductCard from "./ProductsCard";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productList);
        setTimeout(() => {
          AOS.refresh();
        }, 100);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    AOS.init({
      duration: 900,
      easing: "ease-out-cubic",
      once: true,
      offset: 120,
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-500 tracking-widest">
        LOADING PRODUCTS...
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Fuel your workouts with quality gym products"
        bgImage="https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?auto=format&fit=crop&w=1600&q=80"
      />
      <div className="bg-black text-white min-h-screen py-16">
        <PageContainer>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 px-4 py-5 md:px-0 items-stretch overflow-hidden">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </PageContainer>
      </div>
    </>
  );
};

export default Products;
