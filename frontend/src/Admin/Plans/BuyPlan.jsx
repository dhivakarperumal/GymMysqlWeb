import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

// backend endpoints
const MEMBERS_API = "http://localhost:5000/api/members";
const PLANS_API = "http://localhost:5000/api/plans";

const BuyPlanadmin = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    phone: "",
    email: "",
    address: "",
    height: "",
    weight: "",
    bmi: "",
    startDate: today,
    endDate: "",
    paymentMode: "cash",
  });

  // 🔥 FETCH MEMBERS (from Postgres API)
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(MEMBERS_API);
        const data = await res.json();
        setMembers(data);
      } catch (err) {
        console.error("fetchMembers error", err);
        alert("Failed to load members");
      }
    };

    fetchMembers();
  }, []);

  // 🔥 FETCH PLANS (active only)
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(PLANS_API);
        const data = await res.json();
        setPlans(data.filter((p) => p.active));
      } catch (err) {
        console.error("fetchPlans error", err);
        alert("Failed to load plans");
      }
    };

    fetchPlans();
  }, []);

  // 🧮 AUTO CALCULATE END DATE
  useEffect(() => {
    if (!selectedPlan) return;

    const durationMonths = parseInt(selectedPlan.duration);
    const start = new Date(today);
    const end = new Date(start);
    end.setMonth(start.getMonth() + durationMonths);

    setForm((prev) => ({
      ...prev,
      startDate: today,
      endDate: end.toISOString().split("T")[0],
    }));
  }, [selectedPlan]);

  // 🎬 AOS
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  // 📲 WHATSAPP FUNCTION
  const sendWhatsApp = () => {
    if (!selectedUser || !selectedPlan) return;

    const phone = selectedUser.phone?.replace(/\D/g, "");

    if (!phone) {
      alert("No phone number available");
      return;
    }

    const message = `
🏋️ Gym Membership Activated

👤 Name: ${selectedUser.name}
📞 Phone: ${selectedUser.phone}

📦 Plan: ${selectedPlan.name}
⏳ Duration: ${selectedPlan.duration}
📅 Start Date: ${form.startDate}
📅 End Date: ${form.endDate}
💰 Paid: ₹${selectedPlan.finalPrice ?? selectedPlan.final_price}
💳 Mode: ${form.paymentMode.toUpperCase()}

📏 Height: ${form.height}
⚖️ Weight: ${form.weight}
🧮 BMI: ${form.bmi}

✅ Status: Active

Thank you for joining 💪
`.trim();

    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // 💾 ASSIGN PLAN (update member record)
  const handleAssignPlan = async () => {
    if (!selectedUser || !selectedPlan) {
      alert("Select member and plan");
      return;
    }

    // basic active check
    if (selectedUser.status === "active" && selectedUser.plan) {
      alert("Member already has an active plan ❌");
      return;
    }

    try {
      // build updated object merging existing fields with new plan info
      const updated = {
        name: selectedUser.name,
        phone: selectedUser.phone,
        email: selectedUser.email,
        gender: selectedUser.gender,
        height: form.height,
        weight: form.weight,
        bmi: form.bmi,
        plan: selectedPlan.name,
        duration: parseInt(selectedPlan.duration) || null,
        joinDate: form.startDate,
        expiryDate: form.endDate,
        status: "active",
        photo: selectedUser.photo || null,
        notes: selectedUser.notes || null,
        address: selectedUser.address || "",
      };

      const res = await fetch(`${MEMBERS_API}/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("assignPlan error", data);
        alert(data.message || data.error || "Plan save failed");
        return;
      }

      alert("Plan assigned successfully ✅");
      sendWhatsApp();
      navigate("/admin/members");
    } catch (err) {
      console.error(err);
      alert("Plan save failed");
    }
  };

  return (
    <div className="text-white min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Assign Plan</h1>

      <div className="grid md:grid-cols-2 gap-10">

        {/* LEFT FORM */}
        <div className="w-full max-w-6xl backdrop-blur-xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] rounded-2xl shadow-2xl p-8">

          {/* 👤 SELECT MEMBER */}
          <select
            className="w-full p-3 mb-4 bg-gray-900 rounded-lg"
            onChange={(e) => {
              const user = members.find((m) => m.id === e.target.value);
              setSelectedUser(user);

              setForm((prev) => ({
                ...prev,
                phone: user?.phone || "",
                email: user?.email || "",
                address: user?.address || "",
                height: user?.height || "",
                weight: user?.weight || "",
                bmi: user?.bmi || "",
              }));
            }}
          >
            <option value="">Select Member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.phone})
              </option>
            ))}
          </select>

          {/* 📞 PHONE */}
          <input
            type="tel"
            value={form.phone || ""}
            placeholder="Mobile Number"
            readOnly
            className="w-full p-3 bg-gray-900 rounded-lg mb-4 placeholder-gray-400"
          />

          {/* 📧 EMAIL */}
          <input
            type="email"
            value={form.email || ""}
            placeholder="Email Address"
            readOnly
            className="w-full p-3 bg-gray-900 rounded-lg mb-4 placeholder-gray-400"
          />

          {/* 📍 ADDRESS */}
          <textarea
            value={form.address || ""}
            placeholder="Member Address"
            readOnly
            rows={3}
            className="w-full p-3 bg-gray-900 rounded-lg mb-4 placeholder-gray-400"
          />


          {/* 📏 HEIGHT • WEIGHT • BMI */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              value={form.height}
              placeholder="Height"
              readOnly
              className="p-3 bg-gray-900 rounded-lg"
            />
            <input
              type="text"
              value={form.weight}
              placeholder="Weight"
              readOnly
              className="p-3 bg-gray-900 rounded-lg"
            />
            <input
              type="text"
              value={form.bmi}
              placeholder="BMI"
              readOnly
              className="p-3 bg-gray-900 rounded-lg"
            />
          </div>

          {/* 📅 DATES */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              value={form.startDate}
              readOnly
              className="p-3 bg-gray-900 rounded-lg"
            />

            <input
              type="date"
              value={form.endDate}
              readOnly
              className="p-3 bg-gray-900 rounded-lg"
            />
          </div>

          {/* 💳 PAYMENT MODE */}
          <select
            className="w-full p-3 bg-gray-900 rounded-lg mt-4"
            value={form.paymentMode}
            onChange={(e) =>
              setForm({ ...form, paymentMode: e.target.value })
            }
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
          </select>

          {/* 💾 ASSIGN BUTTON */}
          <button
            onClick={handleAssignPlan}
            className="mt-5 w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition"
          >
            Assign Plan ₹{selectedPlan ? (selectedPlan.finalPrice ?? selectedPlan.final_price) : 0}
          </button>
        </div>

        {/* RIGHT – PLAN SELECT */}
        <div className="w-full max-w-6xl backdrop-blur-xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] rounded-2xl shadow-2xl p-8">

          <h2 className="text-xl font-semibold mb-4">Select Plan</h2>

          <select
            className="w-full p-3 bg-gray-900 rounded-lg mb-4"
            onChange={(e) => {
              const plan = plans.find((p) => p.id === e.target.value);
              setSelectedPlan(plan);
            }}
          >
            <option value="">Select Plan</option>

            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} – {plan.duration} – ₹{plan.finalPrice ?? plan.final_price}
              </option>
            ))}
          </select>

          {selectedPlan && (
            <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/10">
              <h3 className="font-bold text-lg">{selectedPlan.name}</h3>
              <p>Duration: {selectedPlan.duration}</p>
              <p>Price: ₹{selectedPlan.finalPrice ?? selectedPlan.final_price}</p>
              {selectedPlan.description && (
                <p className="text-sm text-white/70 mt-2">
                  {selectedPlan.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyPlanadmin;
