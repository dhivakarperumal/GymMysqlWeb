import { useEffect, useState } from "react";
import TrainersCard from "./TrainersCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

import "swiper/css";
import PageContainer from "./PageContainer";

export default function TrainerSwiper() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const staffSnap = await getDocs(collection(db, "staff"));

        const staffWithImages = await Promise.all(
          staffSnap.docs.map(async (docSnap) => {
            const staffData = docSnap.data();

            // 🔥 fetch photo from sub-collection "documents"
            const docsSnap = await getDocs(
              collection(db, "staff", docSnap.id, "documents"),
            );

            const photoDoc = docsSnap.docs.find(
              (d) => d.data().type === "photo",
            );

            return {
              id: docSnap.id,
              name: staffData.name,
              role:
                staffData.qualification || staffData.department || "Trainer",
              image: photoDoc?.data()?.file || "/images/placeholder.png",
            };
          }),
        );

        setTrainers(staffWithImages);
      } catch (err) {
        console.error("Failed to fetch trainers", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
  }, []);

  if (loading) return null; // keeps UI clean

  return (
    <section className="bg-[#05060c] py-15">
      <PageContainer>
        <div>
          {/* Heading */}
          <div className="text-center mb-14">
            <p className="text-orange-400 tracking-widest mb-2">OUR TEAM</p>
            <h2 className="text-white text-4xl md:text-5xl font-bold">
              Expert Trainers
            </h2>
          </div>

          {/* Swiper */}
          <Swiper
            modules={[Autoplay]}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            loop={true}
            spaceBetween={25}
            breakpoints={{
              0: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {trainers.map((trainer, index) => (
              <SwiperSlide
                key={trainer.id}
                className="mt-5"
              >
                <TrainersCard trainer={trainer} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </PageContainer>
    </section>
  );
}
