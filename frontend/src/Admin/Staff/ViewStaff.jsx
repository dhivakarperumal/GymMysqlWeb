import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

/* ================= STYLES ================= */
const glass =
  "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]";

const glassCard =
  "bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl p-5";

const ViewStaff = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "staff", id));
      if (snap.exists()) setStaff(snap.data());

      const docsSnap = await getDocs(collection(db, "staff", id, "documents"));
      setDocuments(docsSnap.docs.map((d) => d.data()));
    };

    load();
  }, [id]);

  if (!staff) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-300">
        Loading staff details…
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-6 text-white">

      {/* BACK */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20"
      >
        <FaArrowLeft /> Back
      </button>

      <div className={`max-w-7xl mx-auto ${glass}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3">

          {/* LEFT PANEL */}
          <div className="p-6 border-r border-white/10 space-y-6">

            <h3 className="text-lg font-semibold">Staff Profile</h3>

            {/* PHOTO */}
            <div className="flex justify-center">
              {documents.find((d) => d.type === "photo") ? (
                <img
                  src={documents.find((d) => d.type === "photo")?.file}
                  alt="Staff"
                  className="h-40 w-40 rounded-full object-cover border-4 border-white/30 shadow-lg"
                />
              ) : (
                <div className="h-40 w-40 rounded-full bg-white/10 flex items-center justify-center text-gray-300">
                  No Photo
                </div>
              )}
            </div>

            <GlassInfo label="Employee ID" value={staff.employeeId} />
            <GlassInfo label="Username" value={staff.username} />

            <div>
              <p className="text-xs text-white/60">Status</p>
              <span
                className={`inline-block px-3 py-1 mt-1 text-xs rounded-full ${
                  staff.status?.toLowerCase() === "active"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-red-500/20 text-red-300"
                }`}
              >
                {staff.status}
              </span>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-2 p-6 space-y-6">

            <div className="grid md:grid-cols-2 gap-6">
              <GlassSection title="Profile Information">
                <GlassInfo label="Name" value={staff.name} />
                <GlassInfo label="Email" value={staff.email} />
                <GlassInfo label="Phone" value={staff.phone} />
                <GlassInfo label="Gender" value={staff.gender} />
                <GlassInfo label="Blood Group" value={staff.bloodGroup} />
                <GlassInfo label="DOB" value={staff.dob} />
              </GlassSection>

              <GlassSection title="Work Details" accent="blue">
                <GlassInfo label="Role" value={staff.role} />
                <GlassInfo label="Department" value={staff.department} />
                <GlassInfo label="Shift" value={staff.shift} />
                <GlassInfo label="Salary" value={staff.salary} />
                <GlassInfo label="Experience" value={staff.experience} />
                <GlassInfo label="Joining Date" value={staff.joiningDate} />
              </GlassSection>
            </div>

            <GlassSection title="Address" accent="purple">
              <p className="text-white/80">{staff.address || "-"}</p>
            </GlassSection>

            <GlassSection title="Emergency Contact" accent="red">
              <GlassInfo label="Name" value={staff.emergencyName} />
              <GlassInfo label="Phone" value={staff.emergencyPhone} />
            </GlassSection>

            <GlassSection title="Documents" accent="green">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {documents.map((doc, i) => (
                  <div
                    key={i}
                    className="bg-white/10 rounded-xl overflow-hidden border border-white/20 hover:scale-105 transition"
                  >
                    <img
                      src={doc.file}
                      alt={doc.type}
                      className="h-28 w-full object-cover"
                    />
                    <p className="text-xs text-center py-2 text-white/70 capitalize">
                      {doc.type}
                    </p>
                  </div>
                ))}

                {documents.length === 0 && (
                  <p className="text-sm text-white/40">
                    No documents uploaded
                  </p>
                )}
              </div>
            </GlassSection>

          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= SMALL COMPONENTS ================= */

const GlassSection = ({ title, children }) => (
  <div className={glassCard}>
    <h3 className="text-sm uppercase tracking-widest text-white/70 mb-4">
      {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const GlassInfo = ({ label, value }) => (
  <div>
    <p className="text-xs text-white/60">{label}</p>
    <p className="text-sm font-medium">{value || "-"}</p>
  </div>
);

export default ViewStaff;

