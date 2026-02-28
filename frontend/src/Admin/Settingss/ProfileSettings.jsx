import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../firebase";
import toast from "react-hot-toast";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaUserShield,
  FaCalendarAlt,
  FaSave,
  FaArrowLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

/* ================= GLASS CLASSES ================= */
const glassCard =
  "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]";

const glassInput =
  "w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:bg-white/5 disabled:cursor-not-allowed";

const ProfileSettings = () => {
  const auth = getAuth();
  const navigate = useNavigate();

  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    username: "",
    mobile: "",
    email: "",
    role: "",
    active: false,
    createdAt: null,
  });

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
      else setLoading(false);
    });
    return () => unsub();
  }, [auth]);

  /* ================= LOAD PROFILE ================= */
  useEffect(() => {
    if (!uid) return;

    const loadProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          setForm(snap.data());
        }
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [uid]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!form.username.trim()) {
      toast.error("Username is required");
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        username: form.username,
        mobile: form.mobile,
        updatedAt: serverTimestamp(),
      });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className={`${glassCard} max-w-xl mx-auto p-6 animate-pulse`}>
        <div className="h-6 bg-white/20 rounded w-1/3 mb-6" />
        <div className="h-12 bg-white/20 rounded mb-4" />
        <div className="h-12 bg-white/20 rounded mb-4" />
        <div className="h-12 bg-white/20 rounded mb-4" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">

      {/* BACK */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition"
      >
        <FaArrowLeft /> Back
      </button>

      {/* CARD */}
      <div className={`${glassCard} max-w-xl mx-auto p-6`}>

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold">
            {form.username?.charAt(0)?.toUpperCase()}
          </div>

          <div>
            <h3 className="text-xl font-semibold">{form.username}</h3>
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center gap-1">
                <FaUserShield /> {form.role}
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  form.active
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-red-500/20 text-red-300"
                }`}
              >
                {form.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* USERNAME */}
        <div className="mb-4">
          <label className="text-sm mb-1 block text-gray-300">Username</label>
          <div className="relative">
            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              className={glassInput}
            />
          </div>
        </div>

        {/* MOBILE */}
        <div className="mb-4">
          <label className="text-sm mb-1 block text-gray-300">Mobile</label>
          <div className="relative">
            <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              className={glassInput}
            />
          </div>
        </div>

        {/* EMAIL */}
        <div className="mb-4">
          <label className="text-sm mb-1 block text-gray-300">Email</label>
          <div className="relative">
            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={form.email}
              disabled
              className={glassInput}
            />
          </div>
        </div>

        {/* CREATED */}
        <div className="mb-6">
          <label className="text-sm mb-1 block text-gray-300">
            Account Created
          </label>
          <div className="relative">
            <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              disabled
              value={
                form.createdAt?.toDate
                  ? form.createdAt.toDate().toLocaleString("en-IN")
                  : ""
              }
              className={glassInput}
            />
          </div>
        </div>

        {/* SAVE */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition
            ${
              saving
                ? "bg-white/20 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-105"
            }`}
        >
          <FaSave />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
