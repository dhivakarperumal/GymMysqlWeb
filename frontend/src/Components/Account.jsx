import React, { useEffect, useState } from "react";
import PageHeader from "./PageHeader";
import DietChart from "./DietChart";
import PageContainer from "./PageContainer";
import { useNavigate, useLocation } from "react-router-dom";
import UserOrders from "./UserOrders";
import UserAddresses from "./UserAddresses";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";

const Account = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState(
    location.state?.tab || "personal"
  );
  const [userInfo, setUserInfo] = useState({});
  const [plans, setPlans] = useState([]);
  const [hasActivePlan, setHasActivePlan] = useState(false);

  /* ================= FETCH USER INFO ================= */
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${userId}`);
        setUserInfo(res.data || {});
      } catch (err) {
        console.error("failed to fetch user info", err);
      }
    };

    fetchUser();
  }, [userId]);

  /* ================= FETCH USER PLANS ================= */
  useEffect(() => {
    if (!userId) return;

    const fetchPlans = async () => {
      try {
        const res = await api.get(`/members/${userId}/plans`);
        const list = Array.isArray(res.data) ? res.data : [];
        setPlans(list);
        setHasActivePlan(list.some((p) => p.status === "active"));
      } catch (err) {
        console.error("failed to fetch user plans", err);
      }
    };

    fetchPlans();
  }, [userId]);

  /* ================= TABS ================= */
  const tabs = [
    { key: "personal", label: "Personal Details" },
    { key: "address", label: "Address" },
    { key: "orders", label: "My Orders" },
    { key: "plans", label: "Active Plans" },
    ...(hasActivePlan ? [{ key: "diet", label: "Diet Chart" }] : []),
  ];

  /* ================= TAB CONTENT ================= */
  const renderContent = () => {
    switch (activeTab) {
      case "personal":
        return (
          <div className="bg-gray-900 p-6 rounded-xl border border-red-500/30 space-y-4 text-white">
            <h2 className="text-xl font-bold text-red-500">
              Personal Details
            </h2>

            {["username", "email", "mobile"].map((field, i) => (
              <div key={i}>
                <label className="text-sm text-gray-300 capitalize">
                  {field}
                </label>
                <input
                  value={userInfo[field] || ""}
                  readOnly
                  className="w-full bg-black border border-gray-700 p-2 rounded mt-1 text-white"
                />
              </div>
            ))}
          </div>
        );

      case "address":
        return <UserAddresses />;

      case "orders":
        return <UserOrders />;

      case "plans":
        return plans.length === 0 ? (
          /* FULL SCREEN EMPTY STATE – SAME AS ORDERS */
          <div className="flex flex-col items-center justify-center text-center bg-gray-900 border border-red-500/30 rounded-xl p-12 text-white space-y-4 ">

            {/* ICON */}
            <div className="text-5xl">🔥</div>

            {/* TITLE */}
            <h2 className="text-xl font-bold text-red-500">
              No Plans Yet
            </h2>

            {/* DESCRIPTION */}
            <p className="text-gray-300 max-w-md">
              Looks like you haven’t purchased any plans yet.
              Explore our membership plans and start your fitness journey.
            </p>

            {/* CTA BUTTON */}
            <button
              onClick={() => navigate("/pricing")}
              className="mt-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-full font-semibold transition"
            >
              🏋️ View Plans
            </button>
          </div>
        ) : (
          /* PLANS LIST */
          <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-gray-900 border border-red-500/30 rounded-xl p-5 text-white"
              >
                <h3 className="text-lg font-bold text-red-500">
                  {plan.planName}
                </h3>

                <p className="text-sm text-gray-400">
                  Duration: {plan.duration}
                </p>

                <p className="mt-2 font-semibold">
                  Price Paid: ₹{plan.pricePaid}
                </p>

                <p className="text-sm mt-1">
                  Start Date: {plan.startDate}
                </p>

                <p className="text-sm">
                  End Date: {plan.endDate}
                </p>

                <span className="inline-block mt-3 px-3 py-1 text-sm rounded bg-red-600">
                  {plan.status}
                </span>
              </div>
            ))}
          </div>
        );
      case "diet":
        return <DietChart planId={plans[0]?.planId} />;

      default:
        return null;
    }
  };

  /* ================= RENDER ================= */
  return (
    <>
      <PageHeader title="My Account" />

      <div className="bg-black min-h-screen py-20">
        <PageContainer>

          {/* TOP TABS */}
          <div className="flex gap-2 overflow-x-auto border-red-500/30 mb-6 pb-2 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2 rounded-full whitespace-nowrap font-semibold transition
                  ${activeTab === tab.key
                    ? "bg-red-600 text-white"
                    : "bg-gray-900 text-gray-300 hover:bg-red-700 hover:text-white"
                  }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={() => {
                if (window.confirm("Logout?")) {
                  logout();
                  window.location.href = "/";
                }
              }}
              className="ml-auto px-5 py-2 rounded-full bg-red-700 hover:bg-red-800 text-white"
            >
              Logout
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="border border-red-500/30 rounded-xl p-4">
            {renderContent()}
          </div>

        </PageContainer>
      </div>
    </>
  );
};

export default Account;