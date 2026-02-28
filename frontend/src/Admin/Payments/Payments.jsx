import { useEffect, useState } from "react";
import { Search } from "lucide-react";

// backend API
const MEMBERS_API = "http://localhost:5000/api/members";
const PLANS_API = "http://localhost:5000/api/plans";

const Payments = () => {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewType, setViewType] = useState("table");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        // fetch members and plans in parallel
        const [memRes, planRes] = await Promise.all([
          fetch(MEMBERS_API),
          fetch(PLANS_API),
        ]);
        const [membersData, plansData] = await Promise.all([
          memRes.json(),
          planRes.json(),
        ]);

        const planMap = new Map(
          plansData.map((p) => [p.name, p])
        );

        // convert backend rows to same shape used by UI
        const usersData = membersData
          .filter((m) => m.plan) // only members with a plan
          .map((m) => {
            const planObj = planMap.get(m.plan);
            const pricePaid =
              planObj?.finalPrice ?? planObj?.final_price ?? 0;

            return {
              ...m,
              uid: m.id,
              username: m.username || m.name,
              plans: [
                {
                  id: m.id,
                  planName: m.plan,
                  pricePaid,
                  startDate: m.join_date,
                  endDate: m.expiry_date,
                  status: m.status,
                  paymentStatus: m.payment_status || "Paid",
                },
              ],
            };
          });

        setMembers(usersData);
      } catch (error) {
        console.error(error);
        alert("Failed to load payment data");
      }
    };

    fetchPayments();
  }, []);

  /* ================= EXPIRY CHECK ================= */
  const isExpiringPlan = (endDate) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const today = new Date();
    const days = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return days <= 7 && days > 0;
  };

  const getSerialNumber = (index) =>
    (currentPage - 1) * itemsPerPage + index + 1;

  /* ================= MARK INACTIVE ================= */
  const handleMarkInactive = async (memberId, planId) => {
    if (!window.confirm("Mark this plan as inactive?")) return;

    try {
      // update via API
      const res = await fetch(`${MEMBERS_API}/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "inactive" }),
      });
      const updated = await res.json();
      if (!res.ok) {
        console.error("mark inactive failed", updated);
        alert("Update failed");
        return;
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.uid !== memberId
            ? m
            : {
                ...m,
                status: "inactive",
                plans: m.plans.map((p) =>
                  p.id === planId
                    ? { ...p, status: "inactive", paymentStatus: "Unpaid" }
                    : p
                ),
              }
        )
      );
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  /* ================= FILTER ================= */
  const filteredMembers = members
    .map((member) => ({
      ...member,
      plans: member.plans.filter((plan) => {
        const q = search.toLowerCase();

        const match =
          member.username?.toLowerCase().includes(q) ||
          member.email?.toLowerCase().includes(q) ||
          plan.planName?.toLowerCase().includes(q);

        if (!match) return false;

        if (filterType === "active") return plan.status === "active";
        if (filterType === "inactive") return plan.status === "inactive";
        if (filterType === "expiry") return isExpiringPlan(plan.endDate);

        return true;
      }),
    }))
    .filter((m) => m.plans.length > 0);

  /* ================= FLATTEN FOR PAGINATION ================= */
  const allPlans = [];
  filteredMembers.forEach((member) => {
    member.plans.forEach((plan) => {
      allPlans.push({ member, plan });
    });
  });

  const totalPages = Math.ceil(allPlans.length / itemsPerPage);

  const paginatedPlans = allPlans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* RESET PAGE ON SEARCH/FILTER */
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType]);

  return (
    <div className="min-h-screen p-4 md:p-8 text-white">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">
          Payment Details
        </h1>

        {/* TOGGLE PILLS */}
        <div className="flex items-center bg-[#2a2540] rounded-xl p-1 w-fit ml-auto">
          <button
            onClick={() => setViewType("table")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${viewType === "table"
              ? "bg-orange-500 text-white"
              : "text-gray-300 hover:bg-white/10"
              }`}
          >
            Table
          </button>

          <button
            onClick={() => setViewType("card")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${viewType === "card"
              ? "bg-orange-500 text-white"
              : "text-gray-300 hover:bg-white/10"
              }`}
          >
            Card
          </button>
        </div>
      </div>

      {/* SEARCH + FILTERS SAME ROW */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        {/* LEFT → SEARCH */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2 rounded-lg bg-white/10 border border-white/20"
          />
        </div>

        {/* RIGHT → FILTER BUTTONS */}
        <div className="flex flex-wrap gap-3 md:justify-end">
          {["all", "active", "inactive", "expiry"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${filterType === type
                ? "bg-orange-500 text-white"
                : "bg-white/10 border border-white/20"
                }`}
            >
              {type}
            </button>
          ))}
        </div>

      </div>


      {/* ================= GRID VIEW ================= */}
      {viewType === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedPlans.map(({ member, plan }, index) => (
            <div
              key={`${member.uid}_${plan.id}`}
              className="relative bg-white/10 border border-white/20 rounded-xl p-6"
            >
              <span
                className={`absolute top-4 right-4 px-3 py-1 text-xs rounded-full border ${plan.status === "active"
                  ? "bg-green-500/20 text-green-400 border-green-400/30"
                  : "bg-gray-500/20 text-gray-300 border-gray-400/30"
                  }`}
              >
                {plan.status === "active" ? "Active" : "Inactive"}
              </span>

              {/* <div>
                {getSerialNumber(index)}
              </div> */}

              <p className="text-lg font-semibold">
                {member.username || "No Name"}
              </p>
              <p className="text-sm text-gray-300 mb-4">
                {member.email}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Plan</p>
                  <p>{plan.planName}</p>
                </div>

                <div>
                  <p className="text-gray-400">Amount</p>
                  <p>₹ {plan.pricePaid}</p>
                </div>

                <div>
                  <p className="text-gray-400">Start Date</p>
                  <p>{plan.startDate || "—"}</p>
                </div>

                <div>
                  <p className="text-gray-400">End Date</p>
                  <p>{plan.endDate}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                {plan.status === "active" ? (
                  <button
                    onClick={() =>
                      handleMarkInactive(member.uid, plan.id)
                    }
                    className="px-4 py-2 bg-orange-500 rounded-lg text-sm"
                  >
                    Refund & Inactive
                  </button>
                ) : (
                  <span className="px-4 py-2 bg-gray-500/20 rounded-lg text-sm">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= TABLE VIEW ================= */}
      {viewType === "table" && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-white/10 text-gray-300">
              <tr>
                <th className="px-4 py-4">S.No</th>
                <th className="px-4 py-4">Name</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Plan</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Start Date</th>
                <th className="px-4 py-4">End Date</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPlans.map(({ member, plan }, index) => (
                <tr
                  key={`${member.uid}_${plan.id}`}
                  className="border-b border-white/10 hover:bg-white/5"
                >
                  <td className="px-4 py-4">{getSerialNumber(index)}</td>
                  <td className="px-4 py-4">{member.username}</td>
                  <td className="px-4 py-4">{member.email}</td>
                  <td className="px-4 py-4">{plan.planName}</td>
                  <td className="px-4 py-4">₹ {plan.pricePaid}</td>
                  <td className="px-4 py-4">{plan.startDate || "—"}</td>
                  <td className="px-4 py-4">{plan.endDate}</td>
                  <td className="px-4 py-4">
                    {plan.status === "active"
                      ? "Active"
                      : "Inactive"}
                  </td>
                  <td className="px-4 py-4">
                    {plan.status === "active" ? (
                      <button
                        onClick={() =>
                          handleMarkInactive(member.uid, plan.id)
                        }
                        className="px-3 py-1 bg-orange-500 rounded text-sm"
                      >
                        Refund & Inactive
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= PAGINATION ================= */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 mt-8 flex-wrap">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="px-3 py-1 rounded bg-white/10 border border-white/20"
            disabled={currentPage === 1}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded border ${currentPage === page
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white/10 border-white/20"
                  }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(p + 1, totalPages))
            }
            className="px-3 py-1 rounded bg-white/10 border border-white/20"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Payments;
