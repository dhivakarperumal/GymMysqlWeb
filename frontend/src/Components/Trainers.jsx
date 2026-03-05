import { useEffect, useState } from "react";
import api from "../api";

import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import TrainersCard from "./TrainersCard";
import AOS from "aos";
import "aos/dist/aos.css";

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const response = await api.get("/staff");
        setTrainers(response.data);
      } catch (err) {
        console.error("Failed to load trainers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
  }, []);

  useEffect(() => {
    AOS.init({
      duration: 900,
      easing: "ease-out-cubic",
      once: true,
      offset: 120,
    });
  }, []);

  return (
    <>
      <PageHeader
        title="Trainers"
        subtitle="Certified trainers dedicated to your strength, health, and transformation"
        bgImage="https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1600&q=80"
      />

      <section className="bg-[#05060c] py-15">
        <PageContainer>
          {loading ? (
            <p className="text-center text-white/60">Loading trainers...</p>
          ) : (
            <div
              data-aos="fade-up"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {trainers.map((trainer, index) => (
                <TrainersCard
                  data-aos="fade-up"
                  data-aos-delay={index * 120}
                  key={trainer.id}
                  trainer={trainer}
                />
              ))}
            </div>
          )}
        </PageContainer>
      </section>
    </>
  );
}
