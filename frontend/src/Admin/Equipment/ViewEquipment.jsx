import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between border-b py-2">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium">{value || "-"}</span>
  </div>
);

const ViewEquipment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =======================
     LOAD EQUIPMENT
  ======================= */
  useEffect(() => {
    const loadEquipment = async () => {
      try {
        const snap = await getDoc(doc(db, "equipment", id));

        if (!snap.exists()) {
          toast.error("Equipment not found");
          navigate(-1);
          return;
        }

        setEquipment(snap.data());
        setLoading(false);
      } catch {
        toast.error("Failed to load equipment");
      }
    };

    loadEquipment();
  }, [id, navigate]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded bg-gray-100"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-2xl font-semibold text-blue-700">
          👁️ View Equipment
        </h2>
      </div>

      {/* DETAILS */}
      <div className="space-y-2">

        <InfoRow label="Equipment Name" value={equipment.name} />
        <InfoRow label="Category" value={equipment.category} />
        <InfoRow label="Purchase Date" value={equipment.purchaseDate} />

        <InfoRow
          label="Status"
          value={equipment.status?.replace("_", " ")}
        />

        <InfoRow
          label="Service Due Month"
          value={equipment.serviceDueMonth || "N/A"}
        />

        <InfoRow
          label="Under Warranty"
          value={equipment.underWarranty ? "Yes" : "No"}
        />

        <InfoRow
          label="Under Maintenance"
          value={equipment.underMaintenance ? "Yes" : "No"}
        />

      </div>

     
      

    </div>
  );
};

export default ViewEquipment;
