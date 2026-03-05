import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../PrivateRouter/AuthContext";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import AOS from "aos";
import "aos/dist/aos.css";
import PricingCard from "./PricingCard";

const BuyPlan = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, profileName } = useAuth();

  const plan = state?.plan;

  // 🔐 PROTECT PAGE
  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: { message: "Please login to purchase a plan" },
      });
    }
    if (!plan) navigate("/pricing");
  }, [user, plan, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchUserProfile = async () => {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();

        setForm((prev) => ({
          ...prev,
          phone: data.mobile || "",
        }));
      }
    };

    fetchUserProfile();
  }, [user]);

  // 📅 TODAY (NO PAST DATES)
  const today = new Date().toISOString().split("T")[0];

  // 🧮 DURATION → DAYS
  const getDaysFromDuration = (duration) => {
    const number = parseInt(duration); // "3 Months" → 3
    return number * 30;
  };

  // 📝 FORM STATE
  const [form, setForm] = useState({
    name: profileName || "",
    email: user?.email || "",
    phone: "",
    address: "",
    startDate: today,
    endDate: "",
  });

  // 🔄 AUTO END DATE CALCULATION
  useEffect(() => {
    if (!plan) return;

    const days = getDaysFromDuration(plan.duration);
    const start = new Date(form.startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + days);

    setForm((prev) => ({
      ...prev,
      endDate: end.toISOString().split("T")[0],
    }));
  }, [form.startDate, plan]);

  // 💳 RAZORPAY PAYMENT
  const handlePayment = () => {
    if (!form.phone || !form.address) {
      alert("Please fill all required fields");
      return;
    }

    const options = {
      key: "rzp_test_2ORD27rb7vGhwj",
      amount: plan.finalPrice * 100,
      currency: "INR",
      name: "Gym Membership",
      description: plan.name,
      handler: async (response) => {
        try {
          // ✅ SAVE PLAN UNDER LOGGED-IN USER
          await addDoc(collection(doc(db, "users", user.uid), "plans"), {
            planId: plan.id,           // Reference to gym_plans doc
            planName: plan.name,
            pricePaid: plan.finalPrice,
            duration: plan.duration,
            startDate: form.startDate,
            endDate: form.endDate,
            paymentId: response.razorpay_payment_id,
            status: "active",
            createdAt: serverTimestamp(),
          });

          navigate("/account", {
            state: { tab: "plans" },
          });
        } catch (err) {
          console.error("Plan save error:", err);
          alert("Plan saved but failed to redirect. Check account.");
        }
      },
      prefill: {
        name: form.name,
        email: form.email,
        contact: form.phone,
      },
      theme: {
        color: "#dc2626",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

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
        title="Buy Membership Plan"
        subtitle="Complete your enrollment and start your fitness journey today"
        bgImage="https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1600&q=80"
      />

      <div className="bg-black text-white min-h-screen">
        <PageContainer>
          <div className="py-10">
              <h1 className="text-3xl font-bold mb-5">Buy Membership Plan</h1>
                  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">

              {/* LEFT SIDE — FORM */}
              <div data-aos="fade-right">
                <div className="bg-black/80 border border-red-500/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(255,0,0,0.12)]">

                <p className="text-white/60 mb-2 text-sm">
                    Enter your details to complete enrollment
                  </p>

                  <div className="space-y-4">

                    {/* NAME + PHONE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        value={form.name}
                        readOnly
                        className="w-full p-3 bg-gray-900 rounded-lg border border-white/5"
                        placeholder="Name"
                      />

                      <input
                        type="tel"
                        placeholder="Mobile Number"
                        value={form.phone}
                        className="w-full p-3 bg-gray-900 rounded-lg border border-white/5"
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                    </div>

                    {/* EMAIL */}
                    <input
                      value={form.email}
                      readOnly
                      className="w-full p-3 bg-gray-900 rounded-lg border border-white/5"
                      placeholder="Email"
                    />

                    {/* ADDRESS */}
                    <textarea
                      placeholder="Address"
                      className="w-full p-3 bg-gray-900 rounded-lg border border-white/5"
                      rows={3}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                    />

                    {/* DATES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="date"
                        min={today}
                        value={form.startDate}
                        className="w-full p-3 bg-gray-900 rounded-lg border border-white/5"
                        onChange={(e) =>
                          setForm({ ...form, startDate: e.target.value })
                        }
                      />

                      <input
                        type="date"
                        value={form.endDate}
                        readOnly
                        className="w-full p-3 bg-gray-900 rounded-lg border border-white/5"
                      />
                    </div>

                    {/* PAY */}
                    <button
                      onClick={handlePayment}
                      className="
          w-full mt-6 bg-red-600 hover:bg-red-700
          py-3 rounded-full tracking-widest
          text-sm font-semibold transition
          shadow-[0_0_20px_rgba(255,0,0,0.45)]
        "
                    >
                      PAY ₹{plan?.finalPrice}
                    </button>

                  </div>
                </div>
              </div>

              {/* RIGHT SIDE — FULL PRICING CARD */}
              <div data-aos="fade-left" className="flex justify-center">
                <PricingCard
                  service={plan}
                  index={0}
                  hasActivePlan={false}
                  checkingPlan={false}
                  onChoose={() => { }}
                />
              </div>

            </div>
          </div>
        </PageContainer>
      </div>
    </>
  );
};

export default BuyPlan;
