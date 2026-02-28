import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { FiArrowRight } from "react-icons/fi";
import "swiper/css";
import FacilityCard from "./FacilityCard";
import PageContainer from "./PageContainer";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export default function FacilitiesSwiper() {
  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const q = query(
          collection(db, "gym_facilities"),
          orderBy("createdAt", "desc"),
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setFacilities(data);
      } catch (error) {
        console.error("Failed to load facilities", error);
      }
    };

    fetchFacilities();
  }, []);

  return (
    <section className="bg-[#05060c] py-5">
      <PageContainer>
        <div className="text-center mb-14">
          <p className="text-red-500 tracking-widest mb-2">OUR FACILITIES</p>
          <h2 className="text-white text-4xl md:text-5xl font-bold">
            Premium Training Zones
          </h2>
        </div>

        <Swiper
          key={facilities.length}
          modules={[Autoplay]}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          spaceBetween={20}
          loop={facilities.length > 1}
          breakpoints={{
            0: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="px-4"
        >
          {facilities.map((item, index) => (
            <SwiperSlide key={item.id} className="!h-auto flex min-w-0 mt-3">
              <FacilityCard item={item} index={index} />
            </SwiperSlide>
          ))}
        </Swiper>
      </PageContainer>
    </section>
  );
}
