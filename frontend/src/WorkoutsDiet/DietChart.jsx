import React, { useEffect, useState } from "react";
import api from "../api";

const DietChart = ({ planId }) => {

  const [diet, setDiet] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH DIET ================= */

  useEffect(() => {

    if (!planId) return;

    const fetchDiet = async () => {
      try {

        const res = await api.get(`/diet/${planId}`);

        setDiet(res.data);

      } catch (err) {
        console.error("Failed to fetch diet", err);
      }

      setLoading(false);
    };

    fetchDiet();

  }, [planId]);

  if (loading) {
    return <p className="text-gray-400">Loading diet plan...</p>;
  }

  if (!diet) {
    return (
      <div className="text-center p-10">
        <h2 className="text-red-500 text-xl font-bold">
          No Diet Plan Assigned
        </h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-bold text-red-500">
        Diet Chart
      </h2>

      <div className="grid md:grid-cols-2 gap-6">

        {/* BREAKFAST */}
        <div className="bg-gray-900 p-5 rounded-xl border border-red-500/20">
          <h3 className="text-lg font-bold text-yellow-400 mb-2">
            Breakfast
          </h3>

          <p className="text-gray-300">
            {diet.breakfast || "Not Assigned"}
          </p>
        </div>

        {/* SNACK */}
        <div className="bg-gray-900 p-5 rounded-xl border border-red-500/20">
          <h3 className="text-lg font-bold text-green-400 mb-2">
            Morning Snack
          </h3>

          <p className="text-gray-300">
            {diet.snack || "Not Assigned"}
          </p>
        </div>

        {/* LUNCH */}
        <div className="bg-gray-900 p-5 rounded-xl border border-red-500/20">
          <h3 className="text-lg font-bold text-orange-400 mb-2">
            Lunch
          </h3>

          <p className="text-gray-300">
            {diet.lunch || "Not Assigned"}
          </p>
        </div>

        {/* EVENING */}
        <div className="bg-gray-900 p-5 rounded-xl border border-red-500/20">
          <h3 className="text-lg font-bold text-purple-400 mb-2">
            Evening Snack
          </h3>

          <p className="text-gray-300">
            {diet.eveningSnack || "Not Assigned"}
          </p>
        </div>

        {/* DINNER */}
        <div className="bg-gray-900 p-5 rounded-xl border border-red-500/20 md:col-span-2">
          <h3 className="text-lg font-bold text-red-400 mb-2">
            Dinner
          </h3>

          <p className="text-gray-300">
            {diet.dinner || "Not Assigned"}
          </p>
        </div>

      </div>

    </div>
  );
};

export default DietChart;