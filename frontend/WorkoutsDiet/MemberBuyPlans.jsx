import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../frontend/src/PrivateRouter/AuthContext";
import api from "../src/api";



const MemberSBuyPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH USER MEMBERSHIPS ================= */

  useEffect(() => {
    if (!user?.id) return;

    const fetchMemberships = async () => {
      try {
        const res = await api.get(`/memberships/user/${user.id}`);

        setPlans(res.data || []);
      } catch (err) {
        console.error("Failed to fetch memberships", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberships();
  }, [user]);

  return (
    <>
  

      <div className="bg-black text-white min-h-screen py-16">
        

          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-red-500">
              My Plans
            </h2>

            <p className="text-gray-400 mt-2">
              Your purchased membership plans
            </p>
          </div>

          {loading ? (
            <div className="text-center text-gray-400">
              Loading plans...
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center p-12">
              <h2 className="text-xl text-red-500 font-bold">
                No Plans Yet
              </h2>

              <p className="text-gray-400 mt-2">
                Start your fitness journey today.
              </p>

              <button
                onClick={() => navigate("/pricing")}
                className="mt-4 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg"
              >
                View Plans
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {plans.map((plan) => {
                const price = Number(plan.pricePaid || 0);

                const start = new Date(plan.startDate).toLocaleDateString();
                const end = new Date(plan.endDate).toLocaleDateString();

                const isExpired =
                  new Date(plan.endDate) < new Date();

                return (
                  <div
                    key={plan.id}
                    className="bg-gray-900 border border-red-500/20 p-6 rounded-xl"
                  >
                    <h3 className="text-xl font-bold text-red-500">
                      {plan.planName}
                    </h3>

                    <p className="text-sm text-gray-400 mt-1">
                      Duration: {plan.duration}
                    </p>

                    <p className="mt-3 text-lg font-semibold">
                      ₹{price.toLocaleString("en-IN")}
                    </p>

                    <p className="text-sm text-gray-400 mt-2">
                      Start: {start}
                    </p>

                    <p className="text-sm text-gray-400">
                      End: {end}
                    </p>

                    <span
                      className={`inline-block mt-3 px-3 py-1 rounded text-sm font-semibold ${
                        isExpired
                          ? "bg-gray-600"
                          : "bg-green-600"
                      }`}
                    >
                      {isExpired ? "EXPIRED" : plan.status.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

      
      </div>
    </>
  );
};

export default MemberSBuyPlans;