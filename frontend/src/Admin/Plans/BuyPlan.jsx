// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AOS from "aos";
// import "aos/dist/aos.css";

// // backend endpoints
// const MEMBERS_API = "http://localhost:5000/api/members";
// const PLANS_API = "http://localhost:5000/api/plans";

// const BuyPlanadmin = () => {
//   const navigate = useNavigate();

//   const [members, setMembers] = useState([]);
//   const [plans, setPlans] = useState([]);

//   const [selectedUser, setSelectedUser] = useState(null);
//   const [selectedPlan, setSelectedPlan] = useState(null);

//   const today = new Date().toISOString().split("T")[0];

//   const [form, setForm] = useState({
//     phone: "",
//     email: "",
//     address: "",
//     height: "",
//     weight: "",
//     bmi: "",
//     startDate: today,
//     endDate: "",
//     paymentMode: "cash",
//   });

//   // 🔥 FETCH MEMBERS (from Postgres API)
//   useEffect(() => {
//     const fetchMembers = async () => {
//       try {
//         const res = await fetch(MEMBERS_API);
//         const data = await res.json();
//         setMembers(data);
//       } catch (err) {
//         console.error("fetchMembers error", err);
//         alert("Failed to load members");
//       }
//     };

//     fetchMembers();
//   }, []);

//   // 🔥 FETCH PLANS (active only)
//   useEffect(() => {
//     const fetchPlans = async () => {
//       try {
//         const res = await fetch(PLANS_API);
//         const data = await res.json();
//         setPlans(data.filter((p) => p.active));
//       } catch (err) {
//         console.error("fetchPlans error", err);
//         alert("Failed to load plans");
//       }
//     };

//     fetchPlans();
//   }, []);

//   // 🧮 AUTO CALCULATE END DATE
//   useEffect(() => {
//     if (!selectedPlan) {
//       setForm((prev) => ({
//         ...prev,
//         endDate: "",
//       }));
//       return;
//     }

//     const durationMonths = parseInt(selectedPlan.duration, 10) || 0;
//     if (durationMonths <= 0) return;

//     const start = new Date(today);
//     const end = new Date(start);
//     end.setMonth(start.getMonth() + durationMonths);

//     setForm((prev) => ({
//       ...prev,
//       startDate: today,
//       endDate: end.toISOString().split("T")[0],
//     }));
//   }, [selectedPlan, today]);

//   // 🎬 AOS
//   useEffect(() => {
//     AOS.init({ duration: 900, once: true });
//   }, []);

//   // 📲 WHATSAPP FUNCTION
//   const sendWhatsApp = () => {
//     if (!selectedUser || !selectedPlan) return;

//     const phone = selectedUser.phone?.replace(/\D/g, "");

//     if (!phone) {
//       alert("No phone number available");
//       return;
//     }

//     const message = `
// 🏋️ Gym Membership Activated

// 👤 Name: ${selectedUser.name}
// 📞 Phone: ${form.phone || selectedUser.phone}

// 📦 Plan: ${selectedPlan.name}
// ⏳ Duration: ${selectedPlan.duration}
// 📅 Start Date: ${form.startDate}
// 📅 End Date: ${form.endDate}
// 💰 Paid: ₹${selectedPlan.finalPrice ?? selectedPlan.final_price}
// 💳 Mode: ${form.paymentMode.toUpperCase()}

// 📏 Height: ${form.height || selectedUser.height}
// ⚖️ Weight: ${form.weight || selectedUser.weight}
// 🧮 BMI: ${form.bmi || selectedUser.bmi}

// ✅ Status: Active

// Thank you for joining 💪
// `.trim();

//     const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
//     window.open(url, "_blank");
//   };

//   // 💾 ASSIGN PLAN (update member record)
//   const handleAssignPlan = async () => {
//     if (!selectedUser || !selectedPlan) {
//       alert("Select member and plan");
//       return;
//     }

//     // basic active check
//     if (selectedUser.status === "active" && selectedUser.plan) {
//       alert("Member already has an active plan ❌");
//       return;
//     }

//     try {
//       // build updated object merging existing fields with new plan info
//       const updated = {
//         name: selectedUser.name,
//         phone: form.phone || selectedUser.phone,
//         email: form.email || selectedUser.email,
//         gender: selectedUser.gender,
//         height: form.height || selectedUser.height,
//         weight: form.weight || selectedUser.weight,
//         bmi: form.bmi || selectedUser.bmi,
//         plan: selectedPlan.name,
//         duration: parseInt(selectedPlan.duration) || null,
//         joinDate: form.startDate,
//         expiryDate: form.endDate,
//         status: "active",
//         photo: selectedUser.photo || null,
//         notes: selectedUser.notes || null,
//         address: form.address || selectedUser.address,
//       };

//       const res = await fetch(`${MEMBERS_API}/${selectedUser.id}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(updated),
//       });

//       const data = await res.json();
//       if (!res.ok) {
//         console.error("assignPlan error", data);
//         alert(data.message || data.error || "Plan save failed");
//         return;
//       }

//       alert("Plan assigned successfully ");
//       sendWhatsApp();
//       navigate("/admin/members");
//     } catch (err) {
//       console.error(err);
//       alert("Plan save failed");
//     }
//   };

//   return (
//     <div className="text-white min-h-screen p-6">
//       <h1 className="text-3xl font-bold mb-6">Assign Plan</h1>

//       <div className="grid md:grid-cols-2 gap-10">

//         {/* LEFT FORM */}
//         <div className="w-full max-w-6xl backdrop-blur-xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] rounded-2xl shadow-2xl p-8">

//           {/* 👤 SELECT MEMBER */}
//           <select
//             className="w-full p-3 mb-4 bg-gray-900 rounded-lg text-white cursor-pointer"
//             defaultValue=""
//             onChange={(e) => {
//               const selectedId = parseInt(e.target.value, 10);
//               if (!isNaN(selectedId)) {
//                 const user = members.find((m) => m.id === selectedId);
//                 setSelectedUser(user);

//                 if (user) {
//                   setForm((prev) => ({
//                     ...prev,
//                     phone: user.phone || "",
//                     email: user.email || "",
//                     address: user.address || "",
//                     height: user.height || "",
//                     weight: user.weight || "",
//                     bmi: user.bmi || "",
//                   }));
//                 }
//               } else {
//                 setSelectedUser(null);
//                 setForm((prev) => ({
//                   ...prev,
//                   phone: "",
//                   email: "",
//                   address: "",
//                   height: "",
//                   weight: "",
//                   bmi: "",
//                 }));
//               }
//             }}
//           >
//             <option value="">Select Member</option>
//             {members.map((m) => (
//               <option key={m.id} value={String(m.id)}>
//                 {m.name} ({m.phone})
//               </option>
//             ))}
//           </select>

//           {/* 📞 PHONE */}
//           <input
//             type="tel"
//             value={form.phone || ""}
//             placeholder="Mobile Number"
//             onChange={(e) => setForm({ ...form, phone: e.target.value })}
//             className="w-full p-3 bg-gray-900 rounded-lg mb-4 placeholder-gray-400"
//           />

//           {/* 📧 EMAIL */}
//           <input
//             type="email"
//             value={form.email || ""}
//             placeholder="Email Address"
//             onChange={(e) => setForm({ ...form, email: e.target.value })}
//             className="w-full p-3 bg-gray-900 rounded-lg mb-4 placeholder-gray-400"
//           />

//           {/* 📍 ADDRESS */}
//           <textarea
//             value={form.address || ""}
//             placeholder="Member Address"
//             onChange={(e) => setForm({ ...form, address: e.target.value })}
//             rows={3}
//             className="w-full p-3 bg-gray-900 rounded-lg mb-4 placeholder-gray-400"
//           />


//           {/* 📏 HEIGHT • WEIGHT • BMI */}
//           <div className="grid grid-cols-3 gap-4 mb-4">
//             <input
//               type="text"
//               value={form.height}
//               placeholder="Height"
//               onChange={(e) => setForm({ ...form, height: e.target.value })}
//               className="p-3 bg-gray-900 rounded-lg"
//             />
//             <input
//               type="text"
//               value={form.weight}
//               placeholder="Weight"
//               onChange={(e) => setForm({ ...form, weight: e.target.value })}
//               className="p-3 bg-gray-900 rounded-lg"
//             />
//             <input
//               type="text"
//               value={form.bmi}
//               placeholder="BMI"
//               onChange={(e) => setForm({ ...form, bmi: e.target.value })}
//               className="p-3 bg-gray-900 rounded-lg"
//             />
//           </div>

//           {/* 📅 DATES */}
//           <div className="grid grid-cols-2 gap-4">
//             <input
//               type="date"
//               value={form.startDate}
//               readOnly
//               className="p-3 bg-gray-900 rounded-lg"
//             />

//             <input
//               type="date"
//               value={form.endDate}
//               readOnly
//               className="p-3 bg-gray-900 rounded-lg"
//             />
//           </div>

//           {/* 💳 PAYMENT MODE */}
//           <select
//             className="w-full p-3 bg-gray-900 rounded-lg mt-4"
//             value={form.paymentMode}
//             onChange={(e) =>
//               setForm({ ...form, paymentMode: e.target.value })
//             }
//           >
//             <option value="cash">Cash</option>
//             <option value="upi">UPI</option>
//           </select>

//           {/* 💾 ASSIGN BUTTON */}
//           <button
//             onClick={handleAssignPlan}
//             className="mt-5 w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition"
//           >
//             Assign Plan ₹{selectedPlan ? (selectedPlan.finalPrice ?? selectedPlan.final_price) : 0}
//           </button>
//         </div>

//         {/* RIGHT – PLAN SELECT */}
//         <div className="w-full max-w-6xl backdrop-blur-xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] rounded-2xl shadow-2xl p-8">

//           <h2 className="text-xl font-semibold mb-4">Select Plan</h2>

//           <select
//             className="w-full p-3 bg-gray-900 rounded-lg mb-4 text-white cursor-pointer"
//             defaultValue=""
//             onChange={(e) => {
//               const selectedId = parseInt(e.target.value, 10);
//               if (!isNaN(selectedId)) {
//                 const plan = plans.find((p) => p.id === selectedId);
//                 setSelectedPlan(plan);
//               } else {
//                 setSelectedPlan(null);
//                 setForm((prev) => ({
//                   ...prev,
//                   endDate: "",
//                 }));
//               }
//             }}
//           >
//             <option value="">Select Plan</option>

//             {plans.map((plan) => (
//               <option key={plan.id} value={String(plan.id)}>
//                 {plan.name} – {plan.duration} months – ₹{plan.finalPrice ?? plan.final_price}
//               </option>
//             ))}
//           </select>

//           {selectedPlan && (
//             <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/10">
//               <h3 className="font-bold text-lg">{selectedPlan.name}</h3>
//               <p>Duration: {selectedPlan.duration}</p>
//               <p>Price: ₹{selectedPlan.finalPrice ?? selectedPlan.final_price}</p>
//               {selectedPlan.description && (
//                 <p className="text-sm text-white/70 mt-2">
//                   {selectedPlan.description}
//                 </p>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BuyPlanadmin;


import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

const MEMBERS_API = "http://localhost:5000/api/members";
const PLANS_API = "http://localhost:5000/api/plans";
const MEMBERSHIP_API = "http://localhost:5000/api/memberships";

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

  // ================= FETCH MEMBERS =================
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(MEMBERS_API);
        const data = await res.json();
        setMembers(data);
      } catch (err) {
        console.error(err);
        alert("Failed to load members");
      }
    };

    fetchMembers();
  }, []);

  // ================= FETCH PLANS =================
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(PLANS_API);
        const data = await res.json();
        setPlans(data.filter((p) => p.active));
      } catch (err) {
        console.error(err);
        alert("Failed to load plans");
      }
    };

    fetchPlans();
  }, []);

  // ================= CALCULATE END DATE =================
  useEffect(() => {
    if (!selectedPlan) return;

    const durationMonths = parseInt(selectedPlan.duration) || 0;

    const start = new Date(today);
    const end = new Date(start);

    end.setMonth(start.getMonth() + durationMonths);

    setForm((prev) => ({
      ...prev,
      startDate: today,
      endDate: end.toISOString().split("T")[0],
    }));
  }, [selectedPlan]);

  // ================= AOS =================
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  // ================= WHATSAPP =================
  const sendWhatsApp = () => {
    if (!selectedUser || !selectedPlan) return;

    const phone = selectedUser.phone?.replace(/\D/g, "");

    const message = `
🏋️ Gym Membership Activated

👤 Name: ${selectedUser.name}
📞 Phone: ${form.phone}

📦 Plan: ${selectedPlan.name}
⏳ Duration: ${selectedPlan.duration} Months

📅 Start Date: ${form.startDate}
📅 End Date: ${form.endDate}

💰 Paid: ₹${selectedPlan.finalPrice ?? selectedPlan.final_price}
💳 Mode: ${form.paymentMode}

📏 Height: ${form.height}
⚖️ Weight: ${form.weight}
🧮 BMI: ${form.bmi}

✅ Status: Active

Thank you for joining 💪
`;

    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // ================= ASSIGN PLAN =================
  const handleAssignPlan = async () => {
    if (!selectedUser || !selectedPlan) {
      alert("Select member and plan");
      return;
    }

    if (selectedUser.status === "active" && selectedUser.plan) {
      alert("Member already has active plan");
      return;
    }

    try {
      // ===== SAVE MEMBERSHIP HISTORY =====
      const membershipData = {
        userId: selectedUser.id,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        price: selectedPlan.finalPrice ?? selectedPlan.final_price,
        duration: selectedPlan.duration,
        startDate: form.startDate,
        endDate: form.endDate,
        paymentMode: form.paymentMode,
        status: "active",
      };

      await fetch(MEMBERSHIP_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(membershipData),
      });

      // ===== UPDATE MEMBER =====
      const updatedMember = {
        ...selectedUser,
        phone: form.phone,
        email: form.email,
        address: form.address,
        height: form.height,
        weight: form.weight,
        bmi: form.bmi,
        plan: selectedPlan.name,
        duration: selectedPlan.duration,
        joinDate: form.startDate,
        expiryDate: form.endDate,
        status: "active",
      };

      const res = await fetch(`${MEMBERS_API}/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMember),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Plan assign failed");
        return;
      }

      alert("Plan assigned successfully");

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
        <div className="p-8 rounded-2xl bg-[#1b1b2f] shadow-xl">

          {/* SELECT MEMBER */}
          <select
            className="w-full p-3 mb-4 bg-gray-900 rounded-lg"
            defaultValue=""
            onChange={(e) => {
              const user = members.find(
                (m) => m.id === Number(e.target.value)
              );

              setSelectedUser(user);

              if (user) {
                setForm((prev) => ({
                  ...prev,
                  phone: user.phone || "",
                  email: user.email || "",
                  address: user.address || "",
                  height: user.height || "",
                  weight: user.weight || "",
                  bmi: user.bmi || "",
                }));
              }
            }}
          >
            <option value="">Select Member</option>

            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.phone})
              </option>
            ))}
          </select>

          {/* PHONE */}
          <input
            className="w-full p-3 mb-4 bg-gray-900 rounded-lg"
            value={form.phone}
            placeholder="Phone"
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          {/* EMAIL */}
          <input
            className="w-full p-3 mb-4 bg-gray-900 rounded-lg"
            value={form.email}
            placeholder="Email"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          {/* ADDRESS */}
          <textarea
            className="w-full p-3 mb-4 bg-gray-900 rounded-lg"
            value={form.address}
            placeholder="Address"
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />

          {/* HEIGHT WEIGHT BMI */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input
              className="p-3 bg-gray-900 rounded-lg"
              placeholder="Height"
              value={form.height}
              onChange={(e) =>
                setForm({ ...form, height: e.target.value })
              }
            />

            <input
              className="p-3 bg-gray-900 rounded-lg"
              placeholder="Weight"
              value={form.weight}
              onChange={(e) =>
                setForm({ ...form, weight: e.target.value })
              }
            />

            <input
              className="p-3 bg-gray-900 rounded-lg"
              placeholder="BMI"
              value={form.bmi}
              onChange={(e) =>
                setForm({ ...form, bmi: e.target.value })
              }
            />
          </div>

          {/* DATES */}
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

          {/* PAYMENT */}
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

          <button
            onClick={handleAssignPlan}
            className="mt-5 w-full py-3 bg-orange-500 rounded-lg hover:bg-orange-600"
          >
            Assign Plan ₹
            {selectedPlan
              ? selectedPlan.finalPrice ?? selectedPlan.final_price
              : 0}
          </button>
        </div>

        {/* RIGHT PLAN SELECT */}
        <div className="p-8 rounded-2xl bg-[#1b1b2f] shadow-xl">

          <h2 className="text-xl mb-4">Select Plan</h2>

          <select
            className="w-full p-3 bg-gray-900 rounded-lg mb-4"
            defaultValue=""
            onChange={(e) => {
              const plan = plans.find(
                (p) => p.id === Number(e.target.value)
              );
              setSelectedPlan(plan);
            }}
          >
            <option value="">Select Plan</option>

            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {p.duration} months - ₹
                {p.finalPrice ?? p.final_price}
              </option>
            ))}
          </select>

          {selectedPlan && (
            <div className="p-4 border border-red-400 rounded-lg">
              <h3 className="font-bold text-lg">
                {selectedPlan.name}
              </h3>

              <p>Duration: {selectedPlan.duration} months</p>

              <p>
                Price ₹
                {selectedPlan.finalPrice ??
                  selectedPlan.final_price}
              </p>

              <p className="text-gray-300 text-sm mt-2">
                {selectedPlan.description}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BuyPlanadmin;