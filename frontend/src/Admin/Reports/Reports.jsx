import { useEffect, useMemo, useState } from "react";
import {
  FaFileAlt,
  FaCalendarAlt,
  FaBox,
  FaEye,
  FaTimes,
} from "react-icons/fa";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

/* ========================
   HELPERS
======================== */

const groupByMonth = (data, dateKey = "createdAt") => {
  const map = {};
  data.forEach(item => {
    if (!item[dateKey]) return;
    const month = dayjs(item[dateKey].toDate()).format("YYYY-MM");
    if (!map[month]) map[month] = [];
    map[month].push(item);
  });
  return map;
};

const getDownloadRows = (report) => {
  switch (report.type) {
    case "Appointments":
      return report.items.map(a => ({
        AppointmentID: a.appointmentId,
        Patient: a.patientName,
        Doctor: a.doctorName,
        Date: a.date,
        Time: a.time,
        Status: a.status,
      }));
    case "Inventory":
      return report.items.map(i => ({
        Item: i.itemName,
        Category: i.category,
        StockQty: i.stockQty,
        Supplier: i.supplier,
      }));
    case "Treatment":
      return report.items.map(t => ({
        TreatmentID: t.treatmentId,
        Patient: t.patientSnapshot?.name,
        Doctor: t.assignedDoctor,
        Cost: t.totalVariantCost,
        Date: dayjs(t.createdAt?.toDate()).format("DD MMM YYYY"),
      }));
    default:
      return [];
  }
};

/* ========================
   STAT CARD
======================== */
const Stat = ({ title, value, icon }) => (
  <div className="
    rounded-2xl p-5 flex justify-between items-center
    bg-white/5 backdrop-blur-xl
    border border-white/10
    shadow-[0_0_40px_rgba(255,140,0,0.08)]
  ">
    <div>
      <p className="text-sm text-white/60">{title}</p>
      <h2 className="text-2xl font-bold text-white">{value}</h2>
    </div>
    <div className="p-3 rounded-xl bg-orange-500/20 text-orange-400 text-xl">
      {icon}
    </div>
  </div>
);

/* ========================
   MAIN
======================== */
const Reports = () => {
  const [appointments, setAppointments] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [selectedReport, setSelectedReport] = useState(null);

  /* ========================
     FIRESTORE
  ======================== */
  useEffect(() => {
    const u1 = onSnapshot(collection(db, "appointments"), s =>
      setAppointments(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const u2 = onSnapshot(collection(db, "inventory"), s =>
      setInventory(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const u3 = onSnapshot(collection(db, "treatments"), s =>
      setTreatments(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { u1(); u2(); u3(); };
  }, []);

  /* ========================
     REPORTS
  ======================== */
  const reports = useMemo(() => {
    const rows = [];
    const push = (grouped, type, title) => {
      Object.entries(grouped).forEach(([month, items]) => {
        rows.push({
          name: `${title} (${dayjs(month).format("MMM YYYY")})`,
          type,
          month,
          items,
        });
      });
    };
    push(groupByMonth(appointments), "Appointments", "Appointments");
    push(groupByMonth(inventory, "updatedAt"), "Inventory", "Inventory");
    push(groupByMonth(treatments), "Treatment", "Treatment");
    return rows.sort((a, b) => b.month.localeCompare(a.month));
  }, [appointments, inventory, treatments]);

  const availableMonths = [...new Set(reports.map(r => r.month))];

  const filteredReports = reports.filter(r =>
    (typeFilter === "All" || r.type === typeFilter) &&
    (monthFilter === "All" || r.month === monthFilter)
  );

  /* ========================
     DOWNLOADS
  ======================== */
  const downloadPDF = (report) => {
    const rows = getDownloadRows(report);
    if (!rows.length) return;
    const doc = new jsPDF();
    doc.text(report.name, 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [Object.keys(rows[0])],
      body: rows.map(r => Object.values(r)),
    });
    doc.save(`${report.name}.pdf`);
  };

  const downloadExcel = (report) => {
    const rows = getDownloadRows(report);
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${report.name}.xlsx`);
  };

  /* ========================
     UI
  ======================== */
  return (
    <div className="p-0 min-h-screen space-y-6">
      <div>
        <h1 className="page-title text-2xl font-bold text-white mb-2">Reports</h1>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Stat title="Appointments" value={appointments.length} icon={<FaCalendarAlt />} />
        <Stat title="Treatments" value={treatments.length} icon={<FaFileAlt />} />
        <Stat title="Inventory Items" value={inventory.length} icon={<FaBox />} />
      </div>

      {/* FILTER BAR */}
     <div
  className="
    bg-white/5 backdrop-blur-xl
    border border-white/10
    rounded-2xl p-4
    flex flex-col sm:flex-row
    gap-4 w-full
  "
>
  {/* Type Filter */}
  <select
    value={typeFilter}
    onChange={(e) => setTypeFilter(e.target.value)}
    className="
      w-full sm:w-48
      px-4 py-3 rounded-lg
      bg-white/10 text-white
      border border-white/10
      focus:outline-none focus:ring-2 focus:ring-orange-500
      [&>option]:bg-white [&>option]:text-black
    "
  >
    <option value="All">All Types</option>
    <option value="Appointments">Appointments</option>
    <option value="Inventory">Inventory</option>
    <option value="Treatment">Treatment</option>
  </select>

  {/* Month Filter */}
  <select
    value={monthFilter}
    onChange={(e) => setMonthFilter(e.target.value)}
    className="
      w-full sm:w-48
      px-4 py-3 rounded-lg
      bg-white/10 text-white
      border border-white/10
      focus:outline-none focus:ring-2 focus:ring-orange-500
      [&>option]:bg-white [&>option]:text-black
    "
  >
    <option value="All">All Months</option>
    {availableMonths.map((m) => (
      <option key={m} value={m}>
        {dayjs(m).format("MMM YYYY")}
      </option>
    ))}
  </select>
</div>


      {/* TABLE (desktop) */}
      <div className="hidden sm:block
        rounded-2xl overflow-hidden
        bg-white/5 backdrop-blur-xl
        border border-white/10
      ">
        <table className="min-w-full text-sm text-white">
          <thead className="bg-white/10">
            <tr>
              {["S No", "Report Name", "Type", "Month", "Actions"].map(h => (
                <th key={h} className="px-4 py-4 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((r, i) => (
              <tr key={i} className="border-b border-white/10 hover:bg-white/5">
                <td className="px-4 py-4">{i + 1}</td>
                <td className="px-4 py-4">{r.name}</td>
                <td className="px-4 py-4">{r.type}</td>
                <td className="px-4 py-4">
                  {dayjs(r.month).format("MMM YYYY")}
                </td>
                <td className="px-4 py-4 flex gap-2">
                  <button
                    onClick={() => setSelectedReport(r)}
                    className="px-3 py-1.5 rounded bg-orange-500 text-white text-xs flex gap-2"
                  >
                    <FaEye /> View
                  </button>
                  <button
                    onClick={() => downloadPDF(r)}
                    className="px-3 py-1.5 rounded bg-white/10 text-white text-xs"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => downloadExcel(r)}
                    className="px-3 py-1.5 rounded bg-white/10 text-white text-xs"
                  >
                    Excel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredReports.length === 0 && (
          <p className="text-center py-6 text-white/50">
            No reports found
          </p>
        )}
      </div>

      {/* MOBILE CARDS */}
      <div className="sm:hidden space-y-3">
        {filteredReports.length === 0 ? (
          <p className="text-center py-6 text-white/50">No reports found</p>
        ) : (
          filteredReports.map((r, i) => (
            <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-white">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.type} • {dayjs(r.month).format('MMM YYYY')}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setSelectedReport(r)} className="px-3 py-1.5 rounded bg-orange-500 text-white text-xs flex gap-2">View</button>
                  <div className="flex gap-2">
                    <button onClick={() => downloadPDF(r)} className="px-3 py-1.5 rounded bg-white/10 text-white text-xs">PDF</button>
                    <button onClick={() => downloadExcel(r)} className="px-3 py-1.5 rounded bg-white/10 text-white text-xs">Excel</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="
            bg-white/5 backdrop-blur-xl
            border border-white/10
            rounded-2xl p-6 w-[90%] max-w-5xl
          ">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                {selectedReport.name}
              </h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-white/60 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-white">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-4 py-3">S No</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReport.items.map((i, idx) => (
                    <tr key={idx} className="border-b border-white/10">
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3">
                        {dayjs(i.createdAt?.toDate()).format("DD MMM YYYY")}
                      </td>
                      <td className="px-4 py-3">
                        {i.patientName || i.itemName || i.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
