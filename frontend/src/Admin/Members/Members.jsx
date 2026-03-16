import React, { useEffect, useState } from "react";
import { Trash2, Pencil, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api"
import cache from "../../cache";
import * as XLSX from "xlsx";


const Members = () => {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔄 FETCH MEMBERS
  const fetchMembers = async () => {
    if (cache.adminMembers) {
      setMembers(cache.adminMembers);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get("/members");
      const data = Array.isArray(res.data) ? res.data : [];
      setMembers(data);
      cache.adminMembers = data;
    } catch {
      if (!cache.adminMembers) toast.error("Failed to load members");
    } finally {
      setLoading(false);
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
  const handleDelete = async (m) => {
    const idToDelete = m.id || m.member_id;
    if (!idToDelete && m.source === "users") {
      toast.error("Cannot delete a registered user from here. Use user management.");
      return;
    }

    if (!window.confirm(`Delete ${m.name || "this member"}?`)) return;

    try {
      await api.delete(`/members/${idToDelete}`);
      toast.success("Deleted successfully");
      fetchMembers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Delete failed");
    }
  };

  /* ================= EXPORT TO EXCEL ================= */
  const exportToExcel = () => {
    if (members.length === 0) {
      toast.error("No members to export");
      return;
    }

    const dataToExport = members.map((m, index) => ({
      "S.No": index + 1,
      Name: m.name || "N/A",
      Phone: m.phone || "N/A",
      Email: m.email || m.user_email || "-",
      Role: m.role || m.plan || "Member",
      Source: m.source === "users" ? "User" : "Gym Member",
      "Join Date": m.join_date || "-",
      "Expiry Date": m.expiry_date || "-",
      Status: m.status || "active"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    XLSX.writeFile(workbook, "members_directory.xlsx");
    toast.success("Exported successfully");
  };

  /* ================= IMPORT FROM EXCEL ================= */
  const excelDateToJSDate = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        for (const row of jsonData) {
          const email = row.Email || row.email;
          if (!email) continue;
          
          const username = email.split('@')[0];
          const joinDate = excelDateToJSDate(row["Join Date"] || row.joinDate || row["JoinDate"]);
          const duration = Number(row.Duration || row.duration || 0);
          
          // Calculate Expiry Date
          let expiryDate = row["Expiry Date"] || row.expiryDate || row["ExpiryDate"];
          if (!expiryDate && joinDate && duration) {
            const d = new Date(joinDate);
            d.setMonth(d.getMonth() + duration);
            expiryDate = d.toISOString().split("T")[0];
          } else if (expiryDate) {
            expiryDate = excelDateToJSDate(expiryDate);
          }

          // Calculate BMI
          const height = row.Height || row.height || "";
          const weight = row.Weight || row.weight || "";
          let bmi = row.BMI || row.bmi || "";
          if (!bmi && height && weight) {
            const h = Number(height) / 100;
            const w = Number(weight);
            if (h > 0) bmi = (w / (h * h)).toFixed(1);
          }

          const payload = {
            name: row.Name || row.name,
            username: username,
            phone: String(row.Phone || row.phone || row.Mobile || ""),
            email: email,
            gender: row.Gender || row.gender || "",
            height: height,
            weight: weight,
            bmi: bmi,
            plan: row.Plan || row.plan || "",
            duration: duration,
            joinDate: joinDate,
            expiryDate: expiryDate,
            status: row.Status || row.status || "active",
            address: row.Address || row.address || "",
            notes: row.Notes || row.notes || "",
            password: String(row.Phone || row.phone || row.Mobile || "123456")
          };

          await api.post("/members", payload);
        }

        toast.success("Imported successfully");
        fetchMembers();
      } catch (err) {
        console.error(err);
        toast.error("Import failed");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (loading && !cache.adminMembers) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Retrieving Member Directory</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-0 py-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 px-4 sm:px-0">
        {/* 🔍 SEARCH */}
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search name or phone"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-4 pr-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* ➕ ADD MEMBER + IMPORT/EXPORT */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Import */}
          <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-600 transition shadow-lg whitespace-nowrap flex-1 sm:flex-none">
            Import Excel
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          </label>

          {/* Export */}
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition shadow-lg whitespace-nowrap flex-1 sm:flex-none"
          >
            Export Excel
          </button>

          <button
            onClick={() => navigate("/admin/addmembers")}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-semibold text-white
            bg-gradient-to-r from-orange-500 to-orange-600
            hover:scale-105 active:scale-95 transition-all shadow-lg whitespace-nowrap flex-1 sm:flex-none"
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
              <th className="p-4 text-left font-medium">Phone</th>
              <th className="p-4 text-left font-medium">Email</th>
              <th className="p-4 text-left font-medium">Workouts</th>
              <th className="p-4 text-left font-medium">Diets</th>
              <th className="p-4 text-left font-medium">Role</th>
              <th className="p-4 text-left font-medium">Type</th>
              <th className="p-4 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-gray-400">
                  {loading ? "Loading members..." : filtered.length === 0 ? "No records found" : "No data on this page"}
                </td>
              </tr>
            ) : (
              paginatedData.map((m, index) => (
                <tr key={m.id || `u-${m.u_id}`} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="p-4 font-medium text-white">{startIndex + index + 1}</td>
                  <td className="p-4 font-medium text-white">{m.name || "N/A"}</td>
                  <td className="p-4">{m.phone || "N/A"}</td>
                  <td className="p-4">{m.email || m.user_email || "-"}</td>
                  <td className="p-4">{m.workout_count || 0}</td>
                  <td className="p-4">{m.diet_count || 0}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-orange-500/20 text-orange-400">
                      {m.plan || m.role || "Member"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      m.source === "users"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-purple-500/20 text-purple-400"
                    }`}>
                      {m.source === "users" ? "User" : "Gym Member"}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => {
                        if (m.source === "users") {
                          navigate(`/admin/addmembers?user_id=${m.u_id}`);
                        } else {
                          navigate(`/admin/addmembers/${m.id}`);
                        }
                      }}
                      className="p-2 rounded-lg bg-yellow-500/80 hover:bg-yellow-500 text-white transition"
                      title={m.source === "users" ? "Convert to Gym Member" : "Edit Member"}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(m)}
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

      {/* DESKTOP PAGINATION */}
      {filtered.length > 0 && (
        <div className="mt-6 px-4 sm:px-0 hidden sm:flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
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
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    currentPage === page ? "bg-orange-500 text-white" : "bg-white/10 text-gray-400 border border-white/20 hover:bg-white/20"
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

      {/* MOBILE CARDS */}
      <div className="sm:hidden space-y-4 px-4 mt-4">
        {paginatedData.length === 0 ? (
          <div className="p-6 text-center text-gray-400 bg-white/5 border border-white/10 rounded-xl">
            {loading ? "Loading..." : filtered.length === 0 ? "No records found" : "No data on this page"}
          </div>
        ) : (
          paginatedData.map((m, index) => (
            <div key={m.id || `u-mob-${m.u_id}`} className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-lg space-y-3">
              <div>
                <p className="font-semibold text-white">{startIndex + index + 1}. {m.name || "N/A"}</p>
                <p className="text-xs text-gray-400 mt-1">{m.phone || "No phone"} • {m.email || m.user_email || "no email"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-500/20 text-orange-400">{m.role || m.plan || "Member"}</span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-400">W: {m.workout_count || 0}</span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-500/20 text-green-400">D: {m.diet_count || 0}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (m.source === "users") {
                      navigate(`/admin/addmembers?user_id=${m.u_id}`);
                    } else {
                      navigate(`/admin/addmembers/${m.id}`);
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium transition"
                >
                  {m.source === "users" ? "Convert" : "Edit"}
                </button>
                <button
                  onClick={() => handleDelete(m)}
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
        <div className="sm:hidden mt-6 px-4 space-y-3">
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
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                    currentPage === page ? "bg-orange-500 text-white" : "bg-white/10 text-gray-400 border border-white/20 hover:bg-white/20"
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
            Page {currentPage} of {totalPages} • Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length}
          </div>
        </div>
      )}

    </div>
  );
};

export default Members;
