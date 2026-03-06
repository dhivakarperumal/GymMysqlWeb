import React, { useEffect, useState } from "react";
import { Trash2, Pencil, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API = "http://localhost:5000/api/members";

const Members = () => {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();

  // 🔄 FETCH MEMBERS
  const fetchMembers = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setMembers(data);
    } catch {
      toast.error("Failed to load members");
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // 🔎 SEARCH
  const filtered = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.phone?.includes(search)
  );

  // 📄 PAGINATION
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // 🗑 DELETE MEMBER
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this member?")) return;

    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Delete failed");
        return;
      }

      toast.success("Deleted successfully");
      fetchMembers(); // 🔄 refresh list
    } catch {
      toast.error("Server error");
    }
  };
  return (
    <div className="min-h-screen px-0 py-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 px-4 sm:px-0">
        {/* 🔹 TITLE */}


        {/* 🔹 SEARCH + BUTTON */}
        <div className="w-full flex flex-col sm:flex-row gap-3">

          {/* 🔍 SEARCH INPUT */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search name or phone"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-1/2 pl-10 pr-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            {/* Search Icon */}

          </div>

          {/* ➕ ADD MEMBER BUTTON */}
          <button
            onClick={() => navigate("/admin/addmembers")}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-semibold text-white 
      bg-gradient-to-r from-orange-500 to-orange-600 
      hover:scale-105 active:scale-95 transition-all shadow-lg whitespace-nowrap
      w-full sm:w-auto"
          >
            <Plus size={16} />
            Add Member
          </button>
        </div>
      </div>


      {/* DESKTOP TABLE */}
      <div className="hidden sm:block backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm text-gray-200">
          <thead className="border-b border-white/10">
            <tr>
              <th className="p-4 text-left font-medium">S No</th>
              <th className="p-4 text-left font-medium">Name</th>
              <th className="p-4 text-left font-medium">Phone</th>              <th className="p-4 text-left font-medium">Email</th>
              <th className="p-4 text-left font-medium">Workouts</th>
              <th className="p-4 text-left font-medium">Diets</th>              <th className="p-4 text-left font-medium">Role</th>
              {/* <th className="p-4 text-left font-medium">Type</th> */}
              <th className="p-4 text-left font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-400">
                  {filtered.length === 0 ? "No records found" : "No data on this page"}
                </td>
              </tr>
            ) : (
              paginatedData.map((m, index) => (
                <tr key={`${m.source}-${m.id}`} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="p-4 font-medium text-white">{startIndex + index + 1}</td>
                  <td className="p-4 font-medium text-white">{m.name || "N/A"}</td>
                  <td className="p-4">{m.phone || "N/A"}</td>
                  <td className="p-4">{m.email || m.user_email || "-"}</td>
                  <td className="p-4">{m.workout_count || m.workoutCount || 0}</td>
                  <td className="p-4">{m.diet_count || m.dietCount || 0}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-orange-500/20 text-orange-400">
                      {m.role || m.plan || "Member"}
                    </span>
                  </td>
                  {/* <th className="p-4 text-left font-medium">Type</th> */}
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${m.source === "users"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-purple-500/20 text-purple-400"
                      }`}>
                      {m.source === "users" ? "User" : "Gym Member"}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/addmembers/${m.id}`)}
                      className="p-2 rounded-lg bg-yellow-500/80 hover:bg-yellow-500 text-white transition"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {filtered.length > 0 && (
        <div className="mt-6 px-4 sm:px-0 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </div>

          <div className="text-sm text-gray-400">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${currentPage === page
                      ? "bg-orange-500 text-white"
                      : "bg-white/10 text-gray-400 border border-white/20 hover:bg-white/20"
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE VIEW */}
      <div className="sm:hidden space-y-4 px-4">
        {paginatedData.length === 0 ? (
          <div className="p-6 text-center text-gray-400 bg-white/5 border border-white/10 rounded-xl">
            {filtered.length === 0 ? "No records found" : "No data on this page"}
          </div>
        ) : (
          paginatedData.map((m, index) => (
            <div
              key={`${m.source}-${m.id}`}
              className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-lg space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-white">{startIndex + index + 1}. {m.name || "N/A"}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {m.phone || "No phone"} • {m.email || m.user_email || "no email"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-500/20 text-orange-400">
                  {m.role || m.plan || "Member"}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-400">
                  W: {m.workout_count || m.workoutCount || 0}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-500/20 text-green-400">
                  D: {m.diet_count || m.dietCount || 0}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/admin/addmembers/${m.id}`)}
                  className="flex-1 px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium transition"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(m.id)}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MOBILE PAGINATION */}
      {filtered.length > 0 && (
        <div className="sm:hidden mt-6 px-4 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1 flex-wrap justify-center">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition ${currentPage === page
                      ? "bg-orange-500 text-white"
                      : "bg-white/10 text-gray-400 border border-white/20 hover:bg-white/20"
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="text-center text-xs text-gray-400">
            Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length}
          </div>
        </div>
      )}

    </div>
  );
};

export default Members;


