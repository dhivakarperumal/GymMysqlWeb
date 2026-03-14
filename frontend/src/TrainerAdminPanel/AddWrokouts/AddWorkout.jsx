import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";

import api from "../../api";
import { Search, Users, CheckSquare, Square, X, RefreshCw } from "lucide-react";

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
    memberEmail: "",
    memberMobile: "",
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
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- FETCH MEMBERS/USERS ---------------- */
  useEffect(() => {
    if (!user || (!user.id && !user.username && !user.email)) {
      console.log("Waiting for user authentication...", user);
      return;
    }

    const fetchMembers = async () => {
      try {
        setLoading(true);

        // Server-side filter by trainer's user ID — avoids the users.id vs staff.id mismatch
        const aRes = await api.get(`/assignments?trainerUserId=${user.id}`);
        const aData = aRes.data;
        const assignments = Array.isArray(aData)
          ? aData
          : aData.data || aData.assignments || [];

        const assignedMembers = assignments.map((a) => ({
          id: String(a.userId || a.user_id),
          name: a.username || a.user_name || "Member",
          planName: a.planName || a.plan_name || "Plan",
          email: a.userEmail || a.user_email || "",
          mobile: a.userMobile || a.user_mobile || "",
          source: "assign",
        }));

        console.log("🔍 Assigned members list:", assignedMembers.length);
        setMembers(assignedMembers);
        setAllAssignments(assignments);
      } catch (err) {
        console.error("❌ Error fetching members/users:", err);
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
        const res = await api.get(`/workouts/${id}`);
        const data = res.data;
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

    if (!isEditMode && selected.size === 0) {
      toast.error("Please select at least one member");
      return;
    }
    if (isEditMode && !form.memberId) {
      toast.error("Member ID is missing");
      return;
    }
    if (!form.category || !form.goal) {
      toast.error("Please fill required fields (Category, Goal)");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode) {
        const payload = {
          trainerId,
          trainerName,
          memberId: form.memberId,
          memberName: form.memberName,
          memberEmail: form.memberEmail,
          memberMobile: form.memberMobile,
          category: form.category,
          level: form.level,
          goal: form.goal,
          durationWeeks: Number(form.durationWeeks),
          days,
          status: "active",
        };
        await api.put(`/workouts/${id}`, payload);
        toast.success("Workout Updated ✅");
        navigate("/trainer/alladdworkouts");
      } else {
        // Bulk Create
        const selectedMembers = members.filter((m) => selected.has(m.id));
        let successCount = 0;
        let failCount = 0;

        for (const m of selectedMembers) {
          try {
            const payload = {
              trainerId,
              trainerName,
              memberId: m.id,
              memberName: m.name,
              memberEmail: m.email,
              memberMobile: m.mobile,
              category: form.category,
              level: form.level,
              goal: form.goal,
              durationWeeks: Number(form.durationWeeks),
              days,
              status: "active",
            };
            await api.post(`/workouts`, payload);
            successCount++;
          } catch (err) {
            console.error(`Failed for member ${m.name}:`, err);
            failCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Created workout for ${successCount} member(s) 💪`);
        }
        if (failCount > 0) {
          toast.error(`Failed to create for ${failCount} member(s)`);
        }
        
        if (successCount > 0) {
          navigate("/trainer/alladdworkouts");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- SELECTION HELPERS ---------------- */
  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q) ||
      (m.mobile || "").includes(q)
    );
  });

  const toggleOne = (mId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(mId)) next.delete(mId);
      else next.add(mId);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filteredMembers.length && filteredMembers.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredMembers.map((m) => m.id)));
    }
  };

  const allSelected = filteredMembers.length > 0 && selected.size === filteredMembers.length;


  return (
    <div className="min-h-screen p-6 text-white">
      
      

      <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">

        <h2 className="text-2xl font-bold mb-6">
          {isEditMode
            ? "Update Workout Schedule"
            : "Create Workout Schedule"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* MEMBER SELECTION */}
          {!isEditMode ? (
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Users size={18} className="text-orange-400" />
                  Select Members ({selected.size} / {members.length})
                </label>
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-medium text-orange-400 hover:text-orange-300 transition"
                >
                  {allSelected ? "Deselect All" : "Select All Available"}
                </button>
              </div>

              {/* Member Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/60 text-white text-sm border border-white/10 focus:ring-1 focus:ring-orange-500 outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Member List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <div className="col-span-full py-4 text-center text-white/40 text-sm flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin" />
                    Loading members...
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="col-span-full py-4 text-center text-white/40 text-sm">
                    No members found
                  </div>
                ) : (
                  filteredMembers.map((m) => {
                    const isSelected = selected.has(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleOne(m.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition border ${
                          isSelected ? "bg-orange-500/20 border-orange-500/50" : "bg-white/5 border-white/5 hover:bg-white/10"
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-orange-400 shrink-0" />
                        ) : (
                          <Square size={18} className="text-white/20 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{m.name}</p>
                          <p className="text-[10px] text-white/40 truncate">
                            {[m.email, m.planName].filter(Boolean).join(" • ")}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <label className="block text-sm font-semibold mb-2">Member</label>
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg opacity-80">
                <Users size={18} className="text-white/40" />
                <div>
                  <p className="text-sm font-medium">{form.memberName || "Selected Member"}</p>
                  <p className="text-xs text-white/40">{form.memberEmail || "No Email"}</p>
                </div>
              </div>
              <p className="text-yellow-400 text-[10px] mt-2 italic">
                (Member cannot be changed in edit mode)
              </p>
            </div>
          )}

          {/* BASIC DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 ml-1">Category</label>
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
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 ml-1">Training Level</label>
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
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 ml-1">Duration (Weeks)</label>
              <input
                type="number"
                className={inputClass}
                placeholder="e.g. 12"
                value={form.durationWeeks}
                onChange={(e) =>
                  setForm({
                    ...form,
                    durationWeeks: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-white/50 ml-1">Primary Goal</label>
              <input
                className={inputClass}
                placeholder="Describe the main goal for this member..."
                value={form.goal}
                onChange={(e) =>
                  setForm({ ...form, goal: e.target.value })
                }
              />
            </div>
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
                    className="bg-red-500/20 text-red-400 rounded-lg py-3.5 hover:bg-red-500/30 transition text-sm font-medium"
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
              disabled={submitting}
              className={`px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center gap-2 ml-auto ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 transition'}`}
            >
              {submitting && <RefreshCw size={18} className="animate-spin" />}
              {submitting ? "Processing..." : (isEditMode ? "Update Program" : "Save Program")}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddWorkout;


