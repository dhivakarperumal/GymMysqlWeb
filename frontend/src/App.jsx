import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import AOS from "aos";
import "aos/dist/aos.css";
import { PacmanLoader } from "react-spinners";
import { AnimatePresence, motion } from "framer-motion";

import ScrollNavigator from "./Components/ScrollNavigator";
import ScrollToTop from "./Components/ScrollToTop";
import { useAuth } from "./PrivateRouter/AuthContext";
import PercentageSpinner from "./Components/PercentageSpinner";

function App() {
  const { user } = useAuth(); // ✅ SAFE
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);

          // ✅ wait so user sees 100%
          setTimeout(() => {
            setLoading(false);
          }, 300);

          return 100;
        }
        return prev + 1;
      });
    }, 15);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div
        className="h-screen w-full flex flex-col items-center justify-center text-white"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.95)), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Pacman Loader */}
        <PacmanLoader color="#ef4444" size={40} speedMultiplier={1.2} />

        {/* Percentage */}
        <p className="mt-4 text-2xl font-bold text-red-500">{progress}%</p>

        {/* Text */}
        <p className="mt-2 text-white text-4xl tracking-widest uppercase text-center lg:text-left mx-auto lg:mx-0">
          Preparing Workout
        </p>
      </div>
    );
  }
  // 🔐 Hide layout on auth pages
  const hideLayout = ["/login", "/register"].includes(location.pathname);

  return (
    <section>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          className="relative overflow-hidden"
        >
          {/* LEFT PAGE */}
          <motion.div
            className="absolute top-0 left-0 w-1/2 h-full bg-black z-20"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            exit={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ transformOrigin: "left" }}
          />

          {/* RIGHT PAGE */}
          <motion.div
            className="absolute top-0 right-0 w-1/2 h-full bg-black z-20"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            exit={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ transformOrigin: "right" }}
          />

          {/* ACTUAL PAGE CONTENT */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {!hideLayout && <Navbar />}
            <ScrollToTop />
            <ScrollNavigator />
            <Outlet />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {!hideLayout && <Footer />}
    </section>
  );
}

export default App;
