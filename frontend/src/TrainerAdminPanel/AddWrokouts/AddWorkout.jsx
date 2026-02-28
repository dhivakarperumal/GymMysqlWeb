import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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
  const auth = getAuth();
  const trainerId = auth.currentUser?.uid;
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

  /* ---------------- FETCH MEMBERS ---------------- */
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

  /* ---------------- FETCH WORKOUT IF EDIT ---------------- */
  useEffect(() => {
    if (!isEditMode) return;

    const fetchWorkout = async () => {
      try {
        const snap = await getDoc(doc(db, "workoutPrograms", id));

        if (snap.exists()) {
          const data = snap.data();
          setForm({
            memberId: data.memberId,
            memberName: data.memberName,
            category: data.category,
            level: data.level,
            goal: data.goal,
            durationWeeks: data.durationWeeks,
          });
          setDays(data.days || { Day1: [{ time: "", name: "" }] });
        } else {
          toast.error("Workout not found");
          navigate("/trainer/alladdworkouts");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load workout");
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
      if (isEditMode) {
        await updateDoc(doc(db, "workoutPrograms", id), {
          ...form,
          durationWeeks: Number(form.durationWeeks),
          days,
          updatedAt: serverTimestamp(),
        });

        toast.success("Workout Updated ✅");
      } else {
        await addDoc(collection(db, "workoutPrograms"), {
          trainerId,
          trainerName:
            auth.currentUser.displayName || "Trainer",
          ...form,
          durationWeeks: Number(form.durationWeeks),
          days,
          status: "active",
          createdAt: serverTimestamp(),
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

          {/* MEMBER */}
          <select
            className={inputClass}
            value={form.memberId}
            onChange={(e) => {
              const member = members.find(
                (m) => m.id === e.target.value
              );
              setForm({
                ...form,
                memberId: e.target.value,
                memberName: member?.name || "",
              });
            }}
            disabled={isEditMode}
          >
            <option value="">Select Member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.planName})
              </option>
            ))}
          </select>

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
