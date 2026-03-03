import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";

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
  const auth = getAuth();
  const trainerId = auth.currentUser?.uid;
  const { id } = useParams(); // edit id
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (!trainerId) return;

    const unsub = onSnapshot(
      query(
        collection(db, "trainerAssignments"),
        where("trainerId", "==", trainerId),
        where("status", "==", "active")
      ),
      (snap) => {
        setMembers(
          snap.docs.map((d) => ({
            id: d.data().userId,
            name: d.data().username,
            planName: d.data().planName,
          }))
        );
        setLoading(false);
      }
    );

    return () => unsub();
  }, [trainerId]);

  /* ================= LOAD DIET FOR EDIT ================= */
  useEffect(() => {
    if (!id) return;

    const fetchDiet = async () => {
      try {
        const snap = await getDoc(doc(db, "dietPlans", id));
        if (snap.exists()) {
          const data = snap.data();

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
            memberId: data.memberId,
            memberName: data.memberName,
            title: data.title,
            totalCalories: data.totalCalories || "",
            duration: data.duration || 1,
            days: fixedDays,
          });
        }
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

    try {
      if (id) {
        await updateDoc(doc(db, "dietPlans", id), {
          ...form,
          totalCalories: Number(form.totalCalories) || 0,
          updatedAt: serverTimestamp(),
        });
        toast.success("Diet Plan Updated Successfully 🥗🔥");
      } else {
        await addDoc(collection(db, "dietPlans"), {
          trainerId,
          ...form,
          totalCalories: Number(form.totalCalories) || 0,
          status: "active",
          createdAt: serverTimestamp(),
        });
        toast.success("Diet Plan Added Successfully 🥗🔥");
      }

      navigate("/trainer/diets");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save diet");
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

          {/* MEMBER */}
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
                {m.name} ({m.planName})
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
            onChange={(e) =>
              setForm((p) => ({ ...p, totalCalories: e.target.value }))
            }
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
                className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700"
              >
                + Add Day
              </button>

              <button
                type="button"
                onClick={handleRemoveDay}
                className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700"
              >
                Remove Day
              </button>
            </div>
          </div>

          {/* DAYS */}
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
            {Object.keys(form.days)
              .sort(
                (a, b) =>
                  Number(a.replace("Day", "")) -
                  Number(b.replace("Day", ""))
              )
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
