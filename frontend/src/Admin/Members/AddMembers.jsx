import React, { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const API = "http://localhost:5000/api/members";

const AddMember = () => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "",
    height: "",
    weight: "",
    bmi: "",
    plan: "",
    duration: "",
    joinDate: dayjs().format("YYYY-MM-DD"),
    expiryDate: "",
    status: "active",
    photo: "",
    notes: "",
    address: "",
  });

  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // ✏️ FETCH MEMBER (EDIT)
  useEffect(() => {
    if (!isEdit) return;

    const fetchMember = async () => {
      try {
        const res = await fetch(`${API}/${id}`);
        const data = await res.json();

        setForm({
          ...data,
          height: data.height || "",
          weight: data.weight || "",
          bmi: data.bmi || "",
          notes: data.notes || "",
          address: data.address || "",
          joinDate: dayjs(data.join_date).format("YYYY-MM-DD"),
          expiryDate: data.expiry_date
            ? dayjs(data.expiry_date).format("YYYY-MM-DD")
            : "",
        });
      } catch {
        toast.error("Failed to load member");
      }
    };

    fetchMember();
  }, [id]);

  // 📏 BMI
  useEffect(() => {
    if (form.height && form.weight) {
      const h = Number(form.height) / 100;
      const w = Number(form.weight);
      if (h > 0) {
        const bmi = (w / (h * h)).toFixed(1);
        setForm((prev) => ({ ...prev, bmi }));
      }
    }
  }, [form.height, form.weight]);

  // 📅 EXPIRY
  useEffect(() => {
    if (form.joinDate && form.duration) {
      const expiry = dayjs(form.joinDate)
        .add(Number(form.duration), "month")
        .format("YYYY-MM-DD");

      setForm((prev) => ({ ...prev, expiryDate: expiry }));
    }
  }, [form.joinDate, form.duration]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🖼 IMAGE COMPRESS
  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(compressed);
    } catch {
      toast.error("Image compression failed");
    }
  };

  // 💾 SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        bmi: form.bmi ? Number(form.bmi) : null,
        duration: form.duration ? Number(form.duration) : null,
      };

      console.log('Submitting payload:', payload);

      const url = isEdit ? `${API}/${id}` : API;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('Response:', data);

      if (!res.ok) {
        toast.error(data.message || data.error || "Error saving member");
        setLoading(false);
        return;
      }

      toast.success(isEdit ? "Member updated ✅" : "Member added 💪");
      navigate("/admin/members");
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }

    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition"
      >
        <FaArrowLeft /> Back
      </button>

      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-6xl backdrop-blur-xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] rounded-2xl shadow-2xl p-8">

          <h2 className="text-2xl font-semibold text-white mb-6">
            {isEdit ? "Update Member" : "Add Member"}
          </h2>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">

            <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" required />

            <select name="gender" value={form.gender} onChange={handleChange} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">Gender</option>
              <option className="text-black">Male</option>
              <option className="text-black">Female</option>
            </select>

            <input name="height" value={form.height} onChange={handleChange} placeholder="Height (cm)" className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input name="weight" value={form.weight} onChange={handleChange} placeholder="Weight (kg)" className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input name="bmi" value={form.bmi} readOnly placeholder="BMI" className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />

            <input type="date" name="joinDate" value={form.joinDate} onChange={handleChange} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />

            <select name="plan" value={form.plan} onChange={handleChange} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">Select Plan</option>
              <option className="text-black">Basic</option>
              <option className="text-black">Silver</option>
              <option className="text-black">Gold</option>
              <option className="text-black">Platinum</option>
            </select>

            <input type="number" name="duration" value={form.duration} onChange={handleChange} placeholder="Duration (months)" className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />

            <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} placeholder="Expiry Date" className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" readOnly />

            <select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="active" className="text-black">Active</option>
              <option value="inactive" className="text-black">Inactive</option>
            </select>

            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
              rows={1}
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Notes"
              rows={1}
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            <input type="file" accept="image/*" onChange={handleImage} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />

            {form.photo && (
              <img src={form.photo} alt="preview" className="w-24 h-24 rounded-full object-cover md:col-span-2" />
            )}

            <div className="md:col-span-2 flex justify-end mt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 min-w-[180px] bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition disabled:opacity-60"
              >
                {loading ? "Saving..." : isEdit ? "Update Member" : "Add Member"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMember;
