import React, { useEffect, useState } from "react";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../PrivateRouter/AuthContext";
import AOS from "aos";
import "aos/dist/aos.css";
import PricingCard from "./PricingCard";

/* 🔥 helper */
const normalizeDuration = (duration) =>
  duration.toLowerCase().replace(/\s+/g, "_");

const Pricing = () => {
  const [services, setServices] = useState([]);
  const [availableDurations, setAvailableDurations] = useState([]);
  const [duration, setDuration] = useState(null);

  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);

    const [selectedDuration, setSelectedDuration] = useState("ALL");

  const navigate = useNavigate();
  const { user } = useAuth();

  /* 🔥 fetch plans */
    useEffect(() => {
      const q = query(collection(db, "gym_plans"), where("active", "==", true));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setServices(data);

        // get unique durations like ["3 Months", "6 Months"]
        const durations = [...new Set(data.map((p) => p.duration))];
        setAvailableDurations(durations);
      });

    return () => unsubscribe();
  }, []);

    const filteredServices =
      selectedDuration === "ALL"
        ? services
        : services.filter((service) => service.duration === selectedDuration);

  /* 🔥 AOS */
  useEffect(() => {
    AOS.init({
      duration: 900,
      easing: "ease-out-cubic",
      once: true,
      offset: 120,
    });
  }, []);

  /* 🔥 active plan check */
  useEffect(() => {
    if (!user) {
      setHasActivePlan(false);
      setCheckingPlan(false);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "plans"),
      where("status", "==", "active"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasActivePlan(!snapshot.empty);
      setCheckingPlan(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="bg-black text-white">
      <PageHeader
        title="Pricing"
        subtitle="Flexible plans designed for every fitness goal and lifestyle"
        bgImage="https://images.unsplash.com/photo-1554284126-aa88f22d8b74?auto=format&fit=crop&w=1600&q=80"
      />

      <div className="my-10 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 w-max mx-auto">
                      <button
                  onClick={() => setSelectedDuration("ALL")}
                  className={`px-8 py-2 rounded-full text-sm tracking-widest transition
      ${selectedDuration === "ALL"
              ? "bg-red-600 text-white"
              : "border border-red-500/40 text-white/70 hover:bg-red-600/20"
            }`}
                >
                  ALL
                </button>

                {/* 3 MONTHS, 6 MONTHS, etc */}
                {availableDurations.map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setSelectedDuration(duration)}
                    className={`px-8 py-2 rounded-full text-sm tracking-widest transition
        ${selectedDuration === duration
                ? "bg-red-600 text-white"
                : "border border-red-500/40 text-white/70 hover:bg-red-600/20"
              }`}
                  >
                    {duration.toUpperCase()}
                  </button>
                ))}
              </div>
      </div>

      {/* 🔥 PRICING CARDS */}
      <PageContainer>
        <section className="pb-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredServices.map((service, index) => (
            <PricingCard
              key={service.id}
              service={service}
              index={index}
              hasActivePlan={hasActivePlan}
              checkingPlan={checkingPlan}
              onChoose={(selected) => {
                if (!user) {
                  navigate("/login", {
                    state: { message: "Please login to purchase a plan" },
                  });
                  return;
                }

                if (hasActivePlan) {
                  alert("You already have an active plan.");
                  return;
                }

                navigate("/buy-plan", { state: { plan: selected } });
              }}
            />
          ))}
        </section>

        {/* CTA */}
        <section className="py-20 text-center border-t border-red-500/20">
          <h2 className="text-3xl font-bold mb-6">
            Save More With Long-Term Plans
          </h2>
          <p className="text-white/70 mb-8">
            Yearly plans offer the best value and consistency.
          </p>
          <button
            onClick={() => navigate("/contact")}
            className="bg-red-600 hover:bg-red-700 transition px-12 py-4 rounded-full tracking-widest font-semibold cursor-pointer"
          >
            CONTACT US
          </button>
        </section>
      </PageContainer>
    </div>
  );
};

export default Pricing;
