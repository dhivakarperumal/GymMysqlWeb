import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

import ProductCard from "./ProductsCard";
import PageContainer from "./PageContainer";

export default function ProductSwiper() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const snap = await getDocs(collection(db, "products"));
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(list);
    };

    fetchProducts();
  }, []);

  return (
    <div className="py-7 bg-black">
        <PageContainer >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-red-500 tracking-widest">
          FEATURED PRODUCTS
        </h2>
        <p className="text-white/60 text-sm mt-2">
          Fuel your workouts with premium gear
        </p>
      </div>

      <Swiper
        modules={[Autoplay]}
        loop={[true]}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
        }}
        spaceBetween={25}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
          1280: { slidesPerView: 4 },
        }}
        className="px-4 md:px-12"
      >
        {products.map((product, index) => (
          <SwiperSlide key={product.id} className="mt-3">
            <ProductCard product={product} index={index} />
          </SwiperSlide>
        ))}
      </Swiper>
      </PageContainer>
    </div>
  );
}
