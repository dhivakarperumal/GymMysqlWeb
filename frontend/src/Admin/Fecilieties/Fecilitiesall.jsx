import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaCheckCircle,
} from "react-icons/fa";
import api from "../../api"; // axios instance pointing at backend

/* ---------------- UI ---------------- */
const glassCard =
  "bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl";

const glassInput =
  "w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:ring-2 focus:ring-orange-500 outline-none";

/* ================= COMPONENT ================= */
const FacilitiesAll = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */
  const loadFacilities = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/facilities");
      setFacilities(
        data.map((f) => ({
          // ensure we always have an active flag
          active: f.active === false ? false : true,
          ...f,
        }))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load facilities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  /* ================= ACTIONS ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this facility?")) return;
    await api.delete(`/facilities/${id}`);
    toast.success("Facility deleted");
    loadFacilities();
  };

  const toggleStatus = async (id) => {
    // backend has a dedicated endpoint to flip the flag
    await api.patch(`/facilities/${id}/active`);
    toast.success("Status updated");
    loadFacilities();
  };

  /* ================= FILTER ================= */
  const filtered = facilities.filter(
    (f) =>
      f.title?.toLowerCase().includes(search.toLowerCase()) ||
      f.shortDesc?.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= UI ================= */
  return (
    <div className="min-h-screen p-0 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">

        <h2 className="text-xl sm:text-2xl font-semibold text-white text-center sm:text-left">
          Gym Facilities
        </h2>

        <button
          onClick={() => navigate("/admin/addfecilities")}
          className="w-full sm:w-auto flex items-center justify-center gap-2 
          px-6 py-3 rounded-xl text-white font-semibold
          bg-gradient-to-r from-orange-500 to-orange-600 
          hover:scale-105 transition shadow-md"
        >
          <FaPlus />
          Add Facility
        </button>

      </div>

      {/* SEARCH */}
      <div className={`${glassCard} p-4 flex justify-between items-center`}>
        <div className="relative w-full max-w-sm">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            placeholder="Search facilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${glassInput} pl-11`}
          />
        </div>
      </div>

      {/* LIST */}
      <div

        className=" p-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">


        {loading && (
          <p className="text-center text-white/50 py-10">
            Loading facilities…
          </p>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-center text-white/50 py-10">
            No facilities found
          </p>
        )}

        {filtered.map((f) => (
          <div
            key={f.id}
            className={`${glassCard} p-6 flex flex-col md:flex-row gap-6 justify-between`}
          >
            {/* LEFT */}
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold text-white">
                {f.title}
              </h3>

              <p className="text-white/60 text-sm">
                {f.shortDesc}
              </p>

              <div className="flex flex-wrap gap-2 mt-2">
                {f.equipments?.slice(0, 3).map((e, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-3">
              <FaCheckCircle
                onClick={() => toggleStatus(f.id, f.active)}
                className={`cursor-pointer text-2xl ${f.active
                    ? "text-emerald-400"
                    : "text-gray-500"
                  }`}
                title={f.active ? "Active" : "Inactive"}
              />

              <button
                onClick={() => navigate(`/admin/addfecilities/${f.id}`)}
                className="p-3 rounded-xl bg-yellow-500/80 hover:bg-yellow-500 text-white"
              >
                <FaEdit />
              </button>

              <button
                onClick={() => handleDelete(f.id)}
                className="p-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-white"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FacilitiesAll;
