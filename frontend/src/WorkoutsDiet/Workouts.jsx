import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../PrivateRouter/AuthContext";
import PageHeader from "../Components/PageHeader";
import PageContainer from "../Components/PageContainer";

export default function Workouts() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [user]);

  const fetchWorkouts = async () => {
    try {
      const res = await api.get("/workouts");

      const data = Array.isArray(res.data) ? res.data : [];

      // SAME LOGIC AS MOBILE APP
      const myWorkouts = data.filter(
        (item) => item.member_email === user.email
      );

      setWorkouts(myWorkouts);
    } catch (err) {
      console.error("Workout fetch error:", err);
      toast.error("Failed to load workouts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <PageHeader
        title="Workouts"
        subtitle="Your assigned workout plans"
        bgImage="https://images.unsplash.com/photo-1534438327276-14e5300c3a48"
      />

      <PageContainer>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-gray-400 text-lg">Loading workouts...</p>
          </div>
        ) : workouts.length === 0 ? (
          <div className="flex flex-col items-center mt-20 text-center">

            <div className="w-28 h-28 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-700 mb-6">
              <span className="text-red-500 text-4xl">🏋️</span>
            </div>

            <h2 className="text-xl font-bold">No Workouts Assigned</h2>

            <p className="text-gray-400 mt-2 max-w-sm">
              You don't have any workout plans yet. Subscribe to a plan to unlock workouts.
            </p>

            <button
              onClick={() => navigate("/pricing")}
              className="mt-6 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold"
            >
              View Plans
            </button>

          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:py-20">

            {workouts.map((item, index) => (
              <div
                key={index}
                onClick={() =>
                  navigate("/workout-details", {
                    state: { workout: item },
                  })
                }
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 cursor-pointer hover:border-red-500 transition"
              >
                <div className="flex items-center justify-between mb-4">

                  <div className="bg-black p-3 rounded-xl border border-red-500">
                    💪
                  </div>

                  <span className="text-gray-400 text-sm">View</span>

                </div>

                <h3 className="text-lg font-semibold">
                  {item.category}
                </h3>

                <p className="text-gray-400 text-sm mt-1">
                  {item.goal}
                </p>

                <p className="text-gray-500 text-xs mt-3">
                  {item.duration_weeks} Weeks • {item.level}
                </p>
              </div>
            ))}

          </div>
        )}
      </PageContainer>
    </div>
  );
}