


import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";

import api from "../../api";

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
    memberEmail: "",
    memberMobile: "",
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

        const res = await api.get("/assignments");
        const data = res.data;

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
          email: d.userEmail || d.user_email || "",
          mobile: d.userMobile || d.user_mobile || "",
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
        const res = await api.get(`/diet-plans/${id}`);
        const data = res.data;

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
          memberEmail: data.memberEmail || data.member_email || "",
          memberMobile: data.memberMobile || data.member_mobile || "",
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
        memberEmail: form.memberEmail,
        memberMobile: form.memberMobile,
        title: form.title,
        totalCalories: Number(form.totalCalories) || 0,
        duration: form.duration,
        days: form.days,
        status: "active",
      };

      let res;

      if (id) {
        res = await api.put(`/diet-plans/${id}`, payload);
      } else {
        res = await api.post(`/diet-plans`, payload);
      }

      const data = res.data;

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

          {/* MEMBER / USER SELECT */}
          <div>
            <label className="block text-sm font-semibold mb-2">Select Assigned Member ({members.length} available)</label>
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
                  memberEmail: m?.email || "",
                  memberMobile: m?.mobile || "",
                }));
              }}
            >
              <option value="">Select Member</option>
              {members.length > 0 ? (
                members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.email ? ` • ${m.email}` : ""}
                    {m.mobile ? ` • ${m.mobile}` : ""}
                    {m.planName ? ` (${m.planName})` : ""}
                  </option>
                ))
              ) : (
                <option disabled>No assigned members</option>
              )}
            </select>

            {(form.memberEmail || form.memberMobile) && (
              <div className="text-xs text-gray-300 mt-2">
                {form.memberEmail && <div>Email: {form.memberEmail}</div>}
                {form.memberMobile && <div>Mobile: {form.memberMobile}</div>}
              </div>
            )}

            {id && (
              <p className="text-yellow-400 text-sm mt-2">
                (Member cannot be changed in edit mode)
              </p>
            )}
          </div>

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
}

export default AddDietPlans;