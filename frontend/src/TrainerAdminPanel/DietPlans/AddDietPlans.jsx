//  import React, { useEffect, useState } from "react";
// import toast from "react-hot-toast";
// import { useParams, useNavigate } from "react-router-dom";
// import { useAuth } from "../../PrivateRouter/AuthContext";  // use backend auth

// const API_BASE = "/api";

// const inputClass =
//   "w-full bg-black/40 border border-white/20 rounded-lg px-3 py-3.5 text-white text-sm";

// const meals = ["Morning", "Breakfast", "Lunch", "Evening", "Dinner"];

// /* ---------- GENERATE SINGLE DAY ---------- */
// const generateSingleDay = () => {
//   const day = {};
//   meals.forEach((meal) => {
//     day[meal] = {
//       food: "",
//       quantity: "",
//       calories: "",
//     };
//   });
//   return day;
// };

// const AddDietPlans = () => {
//   const { user } = useAuth();
//   const trainerId = user?.id; // numeric backend id
//   const trainerName = user?.username || "";
//   const trainerEmail = user?.email || "";
//   const { id } = useParams(); // edit id
//   const navigate = useNavigate();

//   const [members, setMembers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [allAssignments, setAllAssignments] = useState([]); // debug

//   const [form, setForm] = useState({
//     memberId: "",
//     memberName: "",
//     title: "",
//     totalCalories: "",
//     duration: 7,
//     days: {
//       Day1: generateSingleDay(),
//       Day2: generateSingleDay(),
//       Day3: generateSingleDay(),
//       Day4: generateSingleDay(),
//       Day5: generateSingleDay(),
//       Day6: generateSingleDay(),
//       Day7: generateSingleDay(),
//     },
//   });

//   /* ================= FETCH MEMBERS ================= */
//   useEffect(() => {
//     if (!user) return;

//     const fetchMembers = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(`${API_BASE}/assignments`);
//         if (!res.ok) throw new Error("Failed to fetch assignments");
//         const data = await res.json();

//         const assignments = Array.isArray(data)
//           ? data
//           : data.data || data.assignments || [];

//         console.log("[Diet] assignments:", assignments);

//         const filtered = assignments.filter((a) => {
//           const assignTrainerId = Number(a.trainerId || a.trainer_id);
//           const currentTrainerId = Number(user.id);
//           if (!isNaN(assignTrainerId) && assignTrainerId === currentTrainerId) {
//             return true;
//           }
//           // fallback: match by username or email
//           if (user.username &&
//               ((a.trainerName || a.trainer_name)?.toLowerCase() === user.username.toLowerCase())) {
//             return true;
//           }
//           if (user.email &&
//               ((a.trainerEmail || a.trainer_email)?.toLowerCase() === user.email.toLowerCase())) {
//             return true;
//           }
//           return false;
//         });

//         const formatted = filtered.map((d) => ({
//           id: String(d.userId || d.user_id),
//           name: d.username || d.user_name || "Member",
//           planName: d.planName || d.plan_name || "Plan",
//         }));

//         console.log("[Diet] filtered members:", formatted);
//         setMembers(formatted);
//         setAllAssignments(assignments);
//       } catch (err) {
//         console.error("Error fetching diet members:", err);
//         toast.error("Failed to load members");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMembers();
//   }, [user]);

//   /* ================= LOAD DIET FOR EDIT ================= */
//   useEffect(() => {
//     if (!id) return;

//     const fetchDiet = async () => {
//       try {
//         const res = await fetch(`${API_BASE}/diet-plans/${id}`);
//         if (!res.ok) throw new Error("diet not found");
//         const data = await res.json();

//         // handle both camel and snake case
//         const memberId = data.memberId || data.member_id;
//         const memberName = data.memberName || data.member_name;
//         const title = data.title;
//         const totalCalories = data.totalCalories || data.total_calories || "";
//         const duration = data.duration;

//         const fixedDays = {};
//         Object.keys(data.days || {}).forEach((dayKey) => {
//           fixedDays[dayKey] = {};
//           meals.forEach((meal) => {
//             const mealData = data.days[dayKey][meal];
//             if (typeof mealData === "string") {
//               fixedDays[dayKey][meal] = {
//                 food: mealData,
//                 quantity: "",
//                 calories: "",
//               };
//             } else {
//               fixedDays[dayKey][meal] = {
//                 food: mealData?.food || "",
//                 quantity: mealData?.quantity || "",
//                 calories: mealData?.calories || "",
//               };
//             }
//           });
//         });

//         setForm({
//           memberId,
//           memberName,
//           title,
//           totalCalories,
//           duration: duration || 1,
//           days: fixedDays,
//         });
//       } catch (err) {
//         console.error(err);
//         toast.error("Failed to load diet");
//       }
//     };

//     fetchDiet();
//   }, [id]);

//   /* ================= HANDLE MEAL CHANGE ================= */
//   const handleMealChange = (day, meal, field, value) => {
//     setForm((prev) => ({
//       ...prev,
//       days: {
//         ...prev.days,
//         [day]: {
//           ...prev.days[day],
//           [meal]: {
//             ...prev.days[day][meal],
//             [field]: value,
//           },
//         },
//       },
//     }));
//   };

//   /* ================= ADD DAY ================= */
//   const handleAddDay = () => {
//     const count = Object.keys(form.days).length;

//     if (count >= 60) {
//       toast.error("Maximum 60 days allowed");
//       return;
//     }

//     const newKey = `Day${count + 1}`;

//     setForm((prev) => ({
//       ...prev,
//       duration: count + 1,
//       days: {
//         ...prev.days,
//         [newKey]: generateSingleDay(),
//       },
//     }));
//   };

//   /* ================= REMOVE DAY ================= */
//   const handleRemoveDay = () => {
//     const count = Object.keys(form.days).length;

//     if (count <= 1) {
//       toast.error("Minimum 1 day required");
//       return;
//     }

//     const lastKey = `Day${count}`;
//     const updated = { ...form.days };
//     delete updated[lastKey];

//     setForm((prev) => ({
//       ...prev,
//       duration: count - 1,
//       days: updated,
//     }));
//   };

//   /* ================= SUBMIT ================= */
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!form.memberId || !form.title) {
//       toast.error("Fill required fields");
//       return;
//     }

//     try {
//       const payload = {
//         trainerId,
//         trainerName,
//         trainerSource: user?.role || "trainer",
//         memberId: form.memberId,
//         memberName: form.memberName,
//         title: form.title,
//         totalCalories: Number(form.totalCalories) || 0,
//         duration: form.duration,
//         days: form.days,
//         status: form.status || "active",
//       };

//       if (id) {
//         const res = await fetch(`${API_BASE}/diet-plans/${id}`, {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         });
//         if (!res.ok) throw new Error("update failed");
//         toast.success("Diet Plan Updated Successfully 🥗🔥");
//       } else {
//         const res = await fetch(`${API_BASE}/diet-plans`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         });
//         if (!res.ok) throw new Error("create failed");
//         toast.success("Diet Plan Added Successfully 🥗🔥");
//       }

//       // after saving redirect to the list page defined in routes
//       navigate("/trainer/alladddietplans");
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to save diet");
//     }
//   };

//   if (loading || !trainerId) {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-white">
//         Loading...
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen p-6 text-white">
//       {/* DEBUG PANEL */}
//       <div className="max-w-6xl mx-auto mb-4 bg-blue-900/40 border border-blue-500 rounded-lg p-4">
//         <details className="cursor-pointer">
//           <summary className="font-semibold text-blue-300">🔍 Debug Info (Click to expand)</summary>
//           <div className="mt-3 space-y-2 text-sm font-mono bg-black/40 p-3 rounded">
//             <p>👤 Trainer: <span className="text-green-400">{trainerName || user?.username}</span></p>
//             <p>🔑 Trainer ID: <span className="text-yellow-400">{trainerId}</span></p>
//             <p>📧 Email: <span className="text-cyan-400">{trainerEmail}</span></p>
//             <p>📦 Members Found: <span className={members.length>0?"text-green-400":"text-red-400"}>{members.length}</span></p>
//             {members.length>0 && members.map((m,i)=>(<p key={i} className="text-xs text-gray-300 ml-2">• {m.name} (ID: {m.id})</p>))}
//             {allAssignments.length>0 && (
//               <div className="mt-2 border-t border-blue-500 pt-2">
//                 <p className="text-yellow-400">⚠️ ALL Assignments:</p>
//                 {allAssignments.map((a,i)=>(
//                   <p key={i} className="text-xs text-gray-400 ml-2">• {a.trainerName||a.trainer_name} (ID:{a.trainerId||a.trainer_id})→{a.username}</p>
//                 ))}
//               </div>
//             )}
//           </div>
//         </details>
//       </div>

//       <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
//         <h2 className="text-2xl font-bold mb-6">
//           {id ? "Edit Diet Plan" : "Create Custom Diet Plan"}
//         </h2>

//         <form onSubmit={handleSubmit} className="space-y-6">

//           {/* MEMBER */}
//           <select
//             className={inputClass}
//             value={form.memberId}
//             disabled={id}
//             onChange={(e) => {
//               const m = members.find((x) => x.id === e.target.value);
//               setForm((p) => ({
//                 ...p,
//                 memberId: e.target.value,
//                 memberName: m?.name || "",
//               }));
//             }}
//           >
//             <option value="">Select Member</option>
//             {members.map((m) => (
//               <option key={m.id} value={m.id}>
//                 {m.name} ({m.planName})
//               </option>
//             ))}
//           </select>

//           {/* TITLE */}
//           <input
//             className={inputClass}
//             placeholder="Diet Title"
//             value={form.title}
//             onChange={(e) =>
//               setForm((p) => ({ ...p, title: e.target.value }))
//             }
//           />

//           {/* TOTAL CALORIES */}
//           <input
//             type="number"
//             className={inputClass}
//             placeholder="Total Calories"
//             value={form.totalCalories}
//             onChange={(e) =>
//               setForm((p) => ({ ...p, totalCalories: e.target.value }))
//             }
//           />

//           {/* DAY CONTROLS */}
//           <div className="flex justify-between items-center">
//             <h3 className="font-semibold">
//               Total Days: {Object.keys(form.days).length}
//             </h3>

//             <div className="space-x-3">
//               <button
//                 type="button"
//                 onClick={handleAddDay}
//                 className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700"
//               >
//                 + Add Day
//               </button>

//               <button
//                 type="button"
//                 onClick={handleRemoveDay}
//                 className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700"
//               >
//                 Remove Day
//               </button>
//             </div>
//           </div>

//           {/* DAYS */}
//           <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
//             {Object.keys(form.days)
//               .sort(
//                 (a, b) =>
//                   Number(a.replace("Day", "")) -
//                   Number(b.replace("Day", ""))
//               )
//               .map((day) => (
//                 <div
//                   key={day}
//                   className="bg-black/30 border border-white/10 rounded-lg p-4 space-y-4"
//                 >
//                   <h3 className="font-semibold text-emerald-400">{day}</h3>

//                   {meals.map((meal) => (
//                     <div key={meal} className="grid md:grid-cols-3 gap-3">
//                       <input
//                         className={inputClass}
//                         placeholder={`${meal} Food`}
//                         value={form.days[day][meal]?.food || ""}
//                         onChange={(e) =>
//                           handleMealChange(day, meal, "food", e.target.value)
//                         }
//                       />
//                       <input
//                         className={inputClass}
//                         placeholder="Quantity"
//                         value={form.days[day][meal]?.quantity || ""}
//                         onChange={(e) =>
//                           handleMealChange(day, meal, "quantity", e.target.value)
//                         }
//                       />
//                       <input
//                         type="number"
//                         className={inputClass}
//                         placeholder="Calories"
//                         value={form.days[day][meal]?.calories || ""}
//                         onChange={(e) =>
//                           handleMealChange(day, meal, "calories", e.target.value)
//                         }
//                       />
//                     </div>
//                   ))}
//                 </div>
//               ))}
//           </div>

//           {/* SUBMIT */}
//           <div className="flex justify-end">
//             <button
//               type="submit"
//               className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-105"
//             >
//               {id ? "Update Diet Plan" : "Save Diet Plan"}
//             </button>
//           </div>

//         </form>
//       </div>
//     </div>
//   );
// };

// export default AddDietPlans;


import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";

const API_BASE = "/api";

const inputClass =
  "w-full bg-black/40 border border-white/20 rounded-lg px-3 py-3.5 text-white text-sm";

const meals = ["Morning", "Breakfast", "Lunch", "Evening", "Dinner"];

/* ---------- GENERATE SINGLE DAY ---------- */
const generateSingleDay = () => {
  const day = {};
  meals.forEach((meal) => {
    day[meal] = {
      food: "",
      quantity: "",
      calories: "",
    };
  });
  return day;
};

const AddDietPlans = () => {
  const { user } = useAuth();

  const trainerId = Number(user?.id || 0);
  const trainerName = user?.username || "";
  const trainerEmail = user?.email || "";

  const { id } = useParams();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allAssignments, setAllAssignments] = useState([]);

  const [form, setForm] = useState({
    memberId: "",
    memberName: "",
    title: "",
    totalCalories: "",
    duration: 7,
    days: {
      Day1: generateSingleDay(),
      Day2: generateSingleDay(),
      Day3: generateSingleDay(),
      Day4: generateSingleDay(),
      Day5: generateSingleDay(),
      Day6: generateSingleDay(),
      Day7: generateSingleDay(),
    },
  });

  /* ================= FETCH MEMBERS ================= */
  useEffect(() => {
    if (!user) return;

    const fetchMembers = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/assignments`);
        if (!res.ok) throw new Error("Failed to fetch assignments");

        const data = await res.json();

        const assignments = Array.isArray(data)
          ? data
          : data.data || data.assignments || [];

        const filtered = assignments.filter((a) => {
          const assignTrainerId = Number(a.trainerId || a.trainer_id);
          const currentTrainerId = Number(user?.id);

          if (assignTrainerId === currentTrainerId) return true;

          const trainerName = (a.trainerName || a.trainer_name || "").toLowerCase();
          const trainerEmail = (a.trainerEmail || a.trainer_email || "").toLowerCase();

          if (trainerName === user?.username?.toLowerCase()) return true;
          if (trainerEmail === user?.email?.toLowerCase()) return true;

          return false;
        });

        const formatted = filtered.map((d) => ({
          id: String(d.userId || d.user_id),
          name: d.username || d.user_name || "Member",
          planName: d.planName || d.plan_name || "Plan",
        }));

        setMembers(formatted);
        setAllAssignments(assignments);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [user]);

  /* ================= AUTO CALCULATE CALORIES ================= */
  useEffect(() => {
    let total = 0;

    Object.values(form.days).forEach((day) => {
      Object.values(day).forEach((meal) => {
        total += Number(meal.calories || 0);
      });
    });

    setForm((prev) => ({
      ...prev,
      totalCalories: total,
    }));
  }, [form.days]);

  /* ================= LOAD DIET FOR EDIT ================= */
  useEffect(() => {
    if (!id) return;

    const fetchDiet = async () => {
      try {
        const res = await fetch(`${API_BASE}/diet-plans/${id}`);
        if (!res.ok) throw new Error("diet not found");

        const data = await res.json();

        const memberId = data.memberId || data.member_id;
        const memberName = data.memberName || data.member_name;

        const fixedDays = {};

        Object.keys(data.days || {}).forEach((dayKey) => {
          fixedDays[dayKey] = {};

          meals.forEach((meal) => {
            const mealData = data.days[dayKey][meal];

            if (typeof mealData === "string") {
              fixedDays[dayKey][meal] = {
                food: mealData,
                quantity: "",
                calories: "",
              };
            } else {
              fixedDays[dayKey][meal] = {
                food: mealData?.food || "",
                quantity: mealData?.quantity || "",
                calories: mealData?.calories || "",
              };
            }
          });
        });

        setForm({
          memberId,
          memberName,
          title: data.title || "",
          totalCalories: data.totalCalories || data.total_calories || "",
          duration: data.duration || 1,
          days: fixedDays,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load diet");
      }
    };

    fetchDiet();
  }, [id]);

  /* ================= HANDLE MEAL CHANGE ================= */
  const handleMealChange = (day, meal, field, value) => {
    setForm((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: {
          ...prev.days[day],
          [meal]: {
            ...prev.days[day][meal],
            [field]: value,
          },
        },
      },
    }));
  };

  /* ================= ADD DAY ================= */
  const handleAddDay = () => {
    const count = Object.keys(form.days).length;

    if (count >= 60) {
      toast.error("Maximum 60 days allowed");
      return;
    }

    const newKey = `Day${count + 1}`;

    setForm((prev) => ({
      ...prev,
      duration: count + 1,
      days: {
        ...prev.days,
        [newKey]: generateSingleDay(),
      },
    }));
  };

  /* ================= REMOVE DAY ================= */
  const handleRemoveDay = () => {
    const count = Object.keys(form.days).length;

    if (count <= 1) {
      toast.error("Minimum 1 day required");
      return;
    }

    const lastKey = `Day${count}`;

    const updated = { ...form.days };
    delete updated[lastKey];

    setForm((prev) => ({
      ...prev,
      duration: count - 1,
      days: updated,
    }));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.memberId || !form.title) {
      toast.error("Fill required fields");
      return;
    }

    const hasFood = Object.values(form.days).some((day) =>
      Object.values(day).some((meal) => meal.food.trim() !== "")
    );

    if (!hasFood) {
      toast.error("Add at least one food item");
      return;
    }

    try {
      const payload = {
        trainerId,
        trainerName,
        trainerSource: user?.role || "trainer",
        memberId: form.memberId,
        memberName: form.memberName,
        title: form.title,
        totalCalories: Number(form.totalCalories) || 0,
        duration: form.duration,
        days: form.days,
        status: "active",
      };

      let res;

      if (id) {
        res = await fetch(`${API_BASE}/diet-plans/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/diet-plans`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save diet");
      }

      toast.success("Diet Plan Saved Successfully 🥗🔥");

      setTimeout(() => {
        navigate("/trainer/alladddietplans");
      }, 1200);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error saving diet");
    }
  };

  if (loading || !trainerId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 text-white">
      <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">

        <h2 className="text-2xl font-bold mb-6">
          {id ? "Edit Diet Plan" : "Create Custom Diet Plan"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* MEMBER SELECT */}
          <select
            className={inputClass}
            value={form.memberId}
            disabled={id}
            onChange={(e) => {
              const m = members.find((x) => x.id === e.target.value);

              setForm((p) => ({
                ...p,
                memberId: e.target.value,
                memberName: m?.name || "",
              }));
            }}
          >
            <option value="">Select Member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.planName}
              </option>
            ))}
          </select>

          {/* TITLE */}
          <input
            className={inputClass}
            placeholder="Diet Title"
            value={form.title}
            onChange={(e) =>
              setForm((p) => ({ ...p, title: e.target.value }))
            }
          />

          {/* TOTAL CALORIES */}
          <input
            type="number"
            className={inputClass}
            placeholder="Total Calories"
            value={form.totalCalories}
            readOnly
          />

          {/* DAY CONTROLS */}
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">
              Total Days: {Object.keys(form.days).length}
            </h3>

            <div className="space-x-3">
              <button
                type="button"
                onClick={handleAddDay}
                className="px-4 py-2 bg-green-600 rounded-lg"
              >
                + Add Day
              </button>

              <button
                type="button"
                onClick={handleRemoveDay}
                className="px-4 py-2 bg-red-600 rounded-lg"
              >
                Remove Day
              </button>
            </div>
          </div>

          {/* DAYS */}
          <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">

            {Object.keys(form.days)
              .sort((a, b) => parseInt(a.slice(3)) - parseInt(b.slice(3)))
              .map((day) => (
                <div
                  key={day}
                  className="bg-black/30 border border-white/10 rounded-lg p-4 space-y-4"
                >
                  <h3 className="font-semibold text-emerald-400">{day}</h3>

                  {meals.map((meal) => (
                    <div key={meal} className="grid md:grid-cols-3 gap-3">

                      <input
                        className={inputClass}
                        placeholder={`${meal} Food`}
                        value={form.days[day][meal]?.food || ""}
                        onChange={(e) =>
                          handleMealChange(day, meal, "food", e.target.value)
                        }
                      />

                      <input
                        className={inputClass}
                        placeholder="Quantity"
                        value={form.days[day][meal]?.quantity || ""}
                        onChange={(e) =>
                          handleMealChange(day, meal, "quantity", e.target.value)
                        }
                      />

                      <input
                        type="number"
                        className={inputClass}
                        placeholder="Calories"
                        value={form.days[day][meal]?.calories || ""}
                        onChange={(e) =>
                          handleMealChange(day, meal, "calories", e.target.value)
                        }
                      />

                    </div>
                  ))}

                </div>
              ))}

          </div>

          {/* SUBMIT */}
          <div className="flex justify-end">

            <button
              type="submit"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-105"
            >
              {id ? "Update Diet Plan" : "Save Diet Plan"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default AddDietPlans;