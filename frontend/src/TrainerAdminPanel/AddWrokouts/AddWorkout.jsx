import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";

const API_BASE = "/api";

const inputClass =
  "w-full bg-black/40 border border-white/20 rounded-lg px-3 py-3.5 text-white text-sm";

const timeOptions = [
  "06:00-08:00",
  "08:00-10:00",
  "12:00-14:00",
  "16:00-18:00",
  "20:00-22:00",
];

const categories = [
  "Strength Training",
  "Fat Loss",
  "Muscle Gain",
  "Cardio",
  "Functional Training",
  "CrossFit",
  "Yoga",
];

const AddWorkout = () => {
    const { user } = useAuth();
  // ensure numeric comparison for trainer id
  const trainerId = user ? Number(user.id) : undefined;
  const trainerName = user?.username || "Trainer";
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditMode = !!id;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    memberId: "",
    memberName: "",
    category: "",
    level: "Beginner",
    goal: "",
    durationWeeks: "",
  });

  const [days, setDays] = useState({
    Day1: [{ time: "", name: "" }],
  });
  
  // For debugging - show all assignments
  const [allAssignments, setAllAssignments] = useState([]);

  /* ---------------- FETCH MEMBERS ---------------- */
  useEffect(() => {
    if (!user || (!user.id && !user.username && !user.email)) {
      console.log("Waiting for user authentication...", user);
      return;
    }

    console.log("🔍 Fetching members for trainer:", {
      id: user.id,
      username: user.username,
      email: user.email,
    });

    const fetchMembers = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/assignments`);
        if (!res.ok) throw new Error("Failed to fetch assignments");

        const response = await res.json();
        console.log("📦 Full API Response:", response);

        // Support different backend structures
        const assignments = Array.isArray(response)
          ? response
          : response.data || response.assignments || [];

        console.log("📋 Total assignments from API:", assignments.length);

        // Show ALL assignments for debugging
        console.log("📋 All assignments data:", JSON.stringify(assignments, null, 2));

        // Filter by trainer - try multiple matching strategies
        const filtered = assignments.filter((a) => {
          // Strategy 1: Match by numeric trainer ID (database auth)
          if (user.id) {
            const assignTrainerId = Number(a.trainerId || a.trainer_id);
            const currentTrainerId = Number(user.id);
            if (!isNaN(assignTrainerId) && !isNaN(currentTrainerId) && assignTrainerId === currentTrainerId) {
              console.log(
                `✅ Matched by numeric ID: ${assignTrainerId} === ${currentTrainerId}`
              );
              return true;
            }
          }

          // Strategy 2: Match by trainer name
          if (
            user.username &&
            (a.trainerName || a.trainer_name)
          ) {
            const match =
              (a.trainerName || a.trainer_name)?.toLowerCase() ===
              user.username?.toLowerCase();
            if (match) {
              console.log(
                `✅ Matched by trainer name: ${a.trainerName} === ${user.username}`
              );
              return true;
            }
          }

          // Strategy 3: Match by trainer email
          if (user.email && (a.trainerEmail || a.trainer_email)) {
            const match =
              (a.trainerEmail || a.trainer_email)?.toLowerCase() ===
              user.email?.toLowerCase();
            if (match) {
              console.log(
                `✅ Matched by trainer email: ${a.trainerEmail} === ${user.email}`
              );
              return true;
            }
          }

          // Strategy 4: Match by Firebase trainer ID
          if (user.firebaseId && a.trainerId === user.firebaseId) {
            console.log(`✅ Matched by Firebase ID: ${a.trainerId}`);
            return true;
          }

          console.log(
            `❌ No match for assignment: trainerId=${
              a.trainerId || a.trainer_id
            }, trainerName=${a.trainerName || a.trainer_name}, status=${
              a.status
            }`
          );
          return false;
        });

        console.log("✅ Filtered members for current trainer:", filtered);

        const formatted = filtered.map((d) => ({
          id: String(d.userId || d.user_id),
          name: d.username || d.user_name || "Member",
          planName: d.planName || d.plan_name || "Plan",
        }));

        console.log("📝 Formatted members:", formatted);
        setMembers(formatted);
        setAllAssignments(assignments); // Store all for debugging
      } catch (err) {
        console.error("❌ Error fetching members:", err);
        toast.error("Failed to load members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [user]);

  /* ---------------- FETCH WORKOUT IF EDIT ---------------- */
  useEffect(() => {
    if (!isEditMode) return;

    const fetchWorkout = async () => {
      try {
        const res = await fetch(`/api/workouts/${id}`);
        if (!res.ok) {
          throw new Error("not found");
        }
        const data = await res.json();
        setForm({
          memberId: data.member_id,
          memberName: data.member_name,
          category: data.category,
          level: data.level,
          goal: data.goal,
          durationWeeks: data.duration_weeks,
        });
        setDays(data.days || { Day1: [{ time: "", name: "" }] });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load workout");
        navigate("/trainer/alladdworkouts");
      }
    };

    fetchWorkout();
  }, [id]);

  /* ---------------- ADD DAY ---------------- */
  const addDay = () => {
    const nextDay = `Day${Object.keys(days).length + 1}`;
    setDays({
      ...days,
      [nextDay]: [{ time: "", name: "" }],
    });
  };

  /* ---------------- ADD EXERCISE ---------------- */
  const addExercise = (dayKey) => {
    setDays({
      ...days,
      [dayKey]: [...days[dayKey], { time: "", name: "" }],
    });
  };

  /* ---------------- UPDATE EXERCISE ---------------- */
  const updateExercise = (dayKey, index, field, value) => {
    const updated = [...days[dayKey]];
    updated[index][field] = value;

    setDays({
      ...days,
      [dayKey]: updated,
    });
  };

  /* ---------------- REMOVE EXERCISE ---------------- */
  const removeExercise = (dayKey, index) => {
    const updated = [...days[dayKey]];
    updated.splice(index, 1);

    setDays({
      ...days,
      [dayKey]:
        updated.length > 0 ? updated : [{ time: "", name: "" }],
    });
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.memberId || !form.category || !form.goal) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      const payload = {
        trainerId,
        trainerName,
        memberId: form.memberId,
        memberName: form.memberName,
        category: form.category,
        level: form.level,
        goal: form.goal,
        durationWeeks: Number(form.durationWeeks),
        days,
        status: "active",
      };

      if (isEditMode) {
        await fetch(`/api/workouts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast.success("Workout Updated ✅");
      } else {
        await fetch(`/api/workouts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast.success("Workout Program Created 💪");
      }

      navigate("/trainer/alladdworkouts");
    } catch (err) {
      console.error(err);
      toast.error("Operation failed");
    }
  };

  if (!trainerId || loading) {
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
          {isEditMode
            ? "Update Workout Schedule"
            : "Create Workout Schedule"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* MEMBER SELECT */}
          <div>
            <label className="block text-sm font-semibold mb-2">Select Member ({members.length} available)</label>
            <select
              className={inputClass}
              value={form.memberId}
              onChange={(e) => {
                const selectedId = e.target.value;
                const member = members.find(
                  (m) => String(m.id) === String(selectedId)
                );
                console.log("Selected member:", member);
                setForm({
                  ...form,
                  memberId: selectedId,
                  memberName: member?.name || "",
                });
              }}
              disabled={isEditMode}
            >
              <option value="">Select Member</option>
              {members.length > 0 ? (
                members.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.name} ({m.planName})
                  </option>
                ))
              ) : (
                <option disabled>No members assigned</option>
              )}
            </select>

            {members.length === 0 && (
              <p className="text-red-400 text-sm mt-2">
                ⚠️ No members assigned. Check console (F12) for details.
              </p>
            )}

            {isEditMode && (
              <p className="text-yellow-400 text-sm mt-2">
                (Member cannot be changed in edit mode)
              </p>
            )}
          </div>

          {/* BASIC DETAILS */}
          <div className="grid md:grid-cols-2 gap-4">

            <select
              className={inputClass}
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>

            <select
              className={inputClass}
              value={form.level}
              onChange={(e) =>
                setForm({ ...form, level: e.target.value })
              }
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>

            <input
              className={inputClass}
              placeholder="Goal"
              value={form.goal}
              onChange={(e) =>
                setForm({ ...form, goal: e.target.value })
              }
            />

            <input
              type="number"
              className={inputClass}
              placeholder="Duration (Weeks)"
              value={form.durationWeeks}
              onChange={(e) =>
                setForm({
                  ...form,
                  durationWeeks: e.target.value,
                })
              }
            />
          </div>

          {/* DAYS */}
          {Object.keys(days).map((dayKey) => (
            <div key={dayKey} className="bg-black/40 p-4 rounded-xl">

              <h3 className="font-semibold mb-4 text-orange-400">
                {dayKey}
              </h3>

              {days[dayKey].map((item, index) => (
                <div
                  key={index}
                  className="grid md:grid-cols-3 gap-3 mb-3"
                >
                  <select
                    className={inputClass}
                    value={item.time}
                    onChange={(e) =>
                      updateExercise(
                        dayKey,
                        index,
                        "time",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select Time</option>
                    {timeOptions.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>

                  <input
                    className={inputClass}
                    placeholder="Exercise Name"
                    value={item.name}
                    onChange={(e) =>
                      updateExercise(
                        dayKey,
                        index,
                        "name",
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeExercise(dayKey, index)
                    }
                    className="bg-red-500/20 text-red-400 rounded-lg"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addExercise(dayKey)}
                className="text-sm text-orange-400 mt-2"
              >
                + Add Exercise
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addDay}
            className="px-4 py-2 bg-gray-800 rounded-lg"
          >
            + Add Day
          </button>

          <div className="text-right">
            <button
              type="submit"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600"
            >
              {isEditMode ? "Update Program" : "Save Program"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddWorkout;


