import { useEffect, useState } from "react";
import api from "../../api"; // backend HTTP client
import { Users, Dumbbell, Mail, Phone, Calendar, AlertCircle, Search } from "lucide-react";

const AssingnedTrainers = () => {
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assignments, setAssignments] = useState({});
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, assigned, unassigned

  /* ================= FETCH MEMBERSHIPS ================= */
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const res = await api.get("/memberships");
        const membershipsData = Array.isArray(res.data) ? res.data : [];

        // Group memberships by user or treat Each membership as a unique row
        // User wants to see based on membership table
        const usersData = membershipsData.map((m) => ({
          uid: m.userId || `m_${m.id}`,
          membershipId: m.id,
          username: m.username || m.userName || "No Name",
          email: m.email || m.userEmail || "",
          userEmail: m.userEmail || m.email || "",
          workoutCount: 0, 
          dietCount: 0,
          plans: [{
            id: m.id.toString(),
            planName: m.planName,
            duration: m.duration,
            startDate: m.startDate,
            endDate: m.endDate,
            pricePaid: m.pricePaid,
          }],
          source: "memberships",
        }));

        setMembers(usersData);
      } catch (error) {
        console.error("Error fetching memberships:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  /* ================= FETCH TRAINERS ================= */
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await api.get("/staff", { params: { role: "trainer" } });
        const trainers = Array.isArray(res.data) ? res.data : [];
        const normalized = trainers.map((t) => ({
          id: t.id.toString(),
          name: t.name || t.username || "Trainer",
          email: t.email || "",
          source: "staff",
        }));
        setTrainers(normalized);
      } catch (err) {
        console.error("Error fetching trainers:", err);
      }
    };

    fetchTrainers();
  }, []);

  /* ================= FETCH TRAINER ASSIGNMENTS ================= */
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await api.get("/assignments");
        const assignData = {};
        (Array.isArray(res.data) ? res.data : []).forEach((a) => {
          const userId = a.userId?.toString();
          if (!assignData[userId]) assignData[userId] = [];
          assignData[userId].push(a);
        });
        setAssignments(assignData);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };

    fetchAssignments();
  }, []);



  /* ================= ASSIGN / REASSIGN TRAINER ================= */
 const assignTrainer = async () => {
  if (selectedUsers.length === 0) {
    alert("Select at least one member");
    return;
  }

  if (!selectedTrainer) {
    alert("Select a trainer");
    return;
  }

  const trainer = trainers.find((t) => t.id === selectedTrainer);
  if (!trainer) {
    alert("Trainer not found");
    return;
  }

  const safeTrainerName = trainer.name || trainer.username || trainer.email || "Trainer";

  setAssigning(true);
  try {
    const payload = [];
    for (const member of members.filter((m) => selectedUsers.includes(m.uid))) {
      for (const plan of member.plans) {
        payload.push({
          userId: member.uid,
          username: member.username || "No Name",
          userEmail: member.email || "",
          planId: plan.id,
          planName: plan.planName,
          planDuration: plan.duration,
          planStartDate: plan.startDate,
          planEndDate: plan.endDate,
          planPrice: plan.pricePaid,
          trainerId: trainer.id,
          trainerName: safeTrainerName,
          trainerSource: trainer.source || "staff",
          status: "active",
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await api.post("/assignments", { assignments: payload });

    alert("Trainer assigned / reassigned successfully");
    setShowAssignModal(false);
    setSelectedUsers([]);
    setSelectedTrainer("");

    // refresh assignments list
    const res = await api.get("/assignments");
    const assignData = {};
    (Array.isArray(res.data) ? res.data : []).forEach((a) => {
      const userId = a.userId?.toString();
      if (!assignData[userId]) assignData[userId] = [];
      assignData[userId].push(a);
    });
    setAssignments(assignData);
  } catch (err) {
    console.error(err);
    alert("Assignment failed");
  } finally {
    setAssigning(false);
  }
};

  /* ================= FILTER & SEARCH LOGIC ================= */
  const filteredMembers = members.filter((m) => {
    // Search filter
    const searchLower = search.toLowerCase();
    const matchesSearch =
      m.username?.toLowerCase().includes(searchLower) ||
      m.email?.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // Filter type
    if (filterType === "assigned") {
      return assignments[m.uid] && assignments[m.uid].length > 0;
    }
    if (filterType === "unassigned") {
      // Check if this specific membership is unassigned
      // Since we map memberships 1:1 to members in this view, we check if the user has ANY assignment
      // Or more precisely if there's an assignment matching this membershipId if we had it
      return !assignments[m.uid] || assignments[m.uid].length === 0;
    }
    return true; // all
  });

  return (
    <div className="min-h-screen p-4 md:p-8 text-white" dir="ltr">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Assign Trainers</h1>
          <p className="text-gray-400 text-sm mt-1">Manage trainer assignments for members with active plans</p>
        </div>

        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:shadow-lg hover:scale-105 transition-all font-semibold"
        >
          <Dumbbell size={20} />
          Assign New Trainer
        </button>
      </div>

      {/* SEARCH AND FILTER */}
     <div className="mb-8">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    
    {/* 🔍 Search Bar — Left */}
    <div className="relative w-full md:w-1/3">
      <Search className="absolute left-4 top-3 text-gray-400" size={20} />
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-12 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>

    {/* 🎛 Filter Buttons — Right */}
    <div className="flex flex-wrap gap-3 justify-start md:justify-end">
      <button
        onClick={() => setFilterType("all")}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          filterType === "all"
            ? "bg-orange-500 text-white"
            : "bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20"
        }`}
      >
        All Members
      </button>

      <button
        onClick={() => setFilterType("assigned")}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          filterType === "assigned"
            ? "bg-green-500 text-white"
            : "bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20"
        }`}
      >
        ✓ Assigned
      </button>

      <button
        onClick={() => setFilterType("unassigned")}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          filterType === "unassigned"
            ? "bg-red-500 text-white"
            : "bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20"
        }`}
      >
        ✗ Not Assigned
      </button>
    </div>

  </div>
</div>


      {/* MEMBERS WITH TRAINERS */}
      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Loading...
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No members found
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No matching members found
          </div>
        ) : (
          filteredMembers.map((m) => (
            <div
              key={m.uid}
              className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 hover:border-white/40 transition backdrop-blur-lg"
            >
              {/* MEMBER HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 pb-6 border-b border-white/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{m.username || "لا يوجد اسم"}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-400 mt-1">
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        {m.email || "لا يوجد بريد"}
                      </div>
                      {m.userEmail && m.userEmail !== m.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={14} />
                          <span className="underline">{m.userEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 text-sm">
                  <div className="bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                    <span className="text-blue-300 font-medium">{m.plans?.length || 0}</span>
                  </div>
                  <div className="bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/30">
                    <span className="text-purple-300 font-medium">W: {m.workoutCount || 0}</span>
                  </div>
                  <div className="bg-green-500/20 px-3 py-1 rounded-full border border-green-400/30">
                    <span className="text-green-300 font-medium">D: {m.dietCount || 0}</span>
                  </div>
                </div>
              </div>

              {/* ASSIGNED TRAINERS */}
              {assignments[m.uid] && assignments[m.uid].length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-300 mb-4">Assigned Trainers:</p>
                  {assignments[m.uid].map((assign) => (
                    <div
                      key={assign.id}
                      className="bg-white/5 border border-green-400/30 rounded-xl p-4 space-y-3"
                    >
                      {/* TRAINER INFO */}
                      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                          <Dumbbell size={18} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-green-300">{assign.trainerName || "Trainer"}</p>
                          <p className="text-xs text-gray-400">
                            {assign.trainerSource === "users" ? "User System" : "Staff"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Trainer ID</p>
                          <p className="text-xs font-mono text-cyan-300 whitespace-nowrap">{assign.trainerId}</p>
                        </div>
                      </div>

                      {/* PLAN DETAILS GRID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/20">
                          <p className="text-gray-400 text-xs mb-1">Plan Name</p>
                          <p className="font-semibold text-blue-300">{assign.planName}</p>
                        </div>
                        <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
                          <p className="text-gray-400 text-xs mb-1">Duration</p>
                          <p className="font-semibold text-purple-300">{assign.planDuration}</p>
                        </div>
                        <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-400/20">
                          <p className="text-gray-400 text-xs mb-1">Price</p>
                          <p className="font-semibold text-cyan-300">₹ {assign.planPrice}</p>
                        </div>
                        <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-400/20">
                          <p className="text-gray-400 text-xs mb-1">Status</p>
                          <p className="font-semibold text-yellow-300 capitalize">{assign.status || "Active"}</p>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-3 border border-green-400/20">
                          <p className="text-gray-400 text-xs mb-1">Plan ID</p>
                          <p className="text-xs font-mono text-green-300 truncate">{assign.planId}</p>
                        </div>
                        <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-400/20">
                          <p className="text-gray-400 text-xs mb-1">Member Email</p>
                          <p className="text-xs font-mono text-orange-300 truncate">{assign.userEmail}</p>
                        </div>
                      </div>

                      {/* DATE DETAILS */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Start Date</p>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Calendar size={14} />
                            <span>{assign.planStartDate ? new Date(assign.planStartDate).toLocaleDateString() : "N/A"}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">End Date</p>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Calendar size={14} />
                            <span>{assign.planEndDate ? new Date(assign.planEndDate).toLocaleDateString() : "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      {/* MEMBER & UPDATE INFO */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
                        <div>
                          <p className="text-gray-400 mb-1">Member</p>
                          <p className="font-mono text-gray-300">{assign.username}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Last Updated</p>
                          <p className="font-mono text-gray-300">
                            {assign.updatedAt ? new Date(assign.updatedAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-300">No Trainer Assigned</p>
                    <p className="text-xs text-red-400 mt-1">Please assign a trainer to this member</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ================= ASSIGN POPUP ================= */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/70 z-9999 flex items-center justify-center p-4" dir="ltr">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-3xl shadow-2xl">
            
            {/* 🔹 TITLE */}
            <h2 className="text-2xl font-bold mb-6 text-center">Assign Trainer</h2>

            {/* 🔹 MEMBER SELECT */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">Select Members (Only members with active plans):</label>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 bg-black/20 rounded-xl p-3 border border-white/10">
                {members.filter((m) => (m.plans?.length || 0) > 0 && (!assignments[m.uid] || assignments[m.uid].length === 0)).length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No unassigned members with plans found</p>
                ) : (
                  members
                    .filter((m) => (m.plans?.length || 0) > 0 && (!assignments[m.uid] || assignments[m.uid].length === 0))
                    .map((m) => (
                    <label
                      key={m.uid}
                      className="flex items-start gap-3 bg-white/5 p-3 rounded-lg cursor-pointer hover:bg-white/10 transition border border-white/10"
                    >
                      <input
                        type="checkbox"
                        className="accent-orange-500 mt-1 shrink-0"
                        disabled={assigning}
                        checked={selectedUsers.includes(m.uid)}
                        onChange={(e) => {
                          setSelectedUsers((prev) =>
                            e.target.checked
                              ? [...new Set([...prev, m.uid])]
                              : prev.filter((id) => id !== m.uid)
                          );
                        }}
                      />
                      <div className="flex-1 text-sm">
                        <p className="font-semibold text-white">{m.username || "No Name"}</p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                        <p className="text-xs text-cyan-400 mt-1">
                          {m.plans?.length || 0} plans
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* 🔹 SELECTED COUNT */}
            {selectedUsers.length > 0 && (
              <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg px-4 py-3 mb-6 text-sm">
                <p className="text-orange-300 font-semibold">Selected {selectedUsers.length} member(s)</p>
              </div>
            )}

            {/* 🔹 TRAINER SELECT */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">Select Trainer:</label>
              <select
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                disabled={assigning}
                className={`w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  assigning ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <option value="">-- Select Trainer --</option>
                {trainers.length === 0 ? (
                  <option disabled>No trainers available</option>
                ) : (
                  trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || t.username} 
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 🔹 ACTION BUTTONS */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                disabled={assigning}
                className="flex-1 px-4 py-3 bg-gray-500/30 rounded-lg text-white hover:bg-gray-500/40 transition font-medium disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={assignTrainer}
                disabled={assigning || !selectedTrainer || selectedUsers.length === 0}
                className={`flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white font-medium transition hover:shadow-lg ${
                  assigning || !selectedTrainer || selectedUsers.length === 0
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:scale-105"
                }`}
              >
                {assigning ? "Assigning..." : "Assign Trainer"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AssingnedTrainers;
