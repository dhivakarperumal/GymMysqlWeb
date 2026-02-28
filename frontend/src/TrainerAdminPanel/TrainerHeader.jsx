// import { useState, useRef, useEffect } from "react";
// import { useNavigate, Link, useLocation } from "react-router-dom";
// import {
//   Menu,
//   Search,
//   Bell,
//   Settings,
//   User,
//   LogOut,
//   ChevronDown,
//   X,
// } from "lucide-react";
// import { useAuth } from "../PrivateRouter/AuthContext";
// import toast from "react-hot-toast";
// import { signOut } from "firebase/auth";
// import { auth } from "../firebase";

// const pageTitles = {
//   "/trainer": "Dashboard",
//   "/trainer/addworkouts": "Add Workouts",
//   "/trainer/alladdworkouts": "All Workouts",
//   "/trainer/adddietplans": "Add Diet Plans",
//   "/trainer/alladddietplans": "All Diet Plans",

//   "/trainer/overall-attendance": "Attendance",
//   "/trainer/reports": "Reports",
//   "/trainer/settings/profile": "Profile",

// };

// const Header = ({ onMenuClick }) => {
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [showSearch, setShowSearch] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const searchInputRef = useRef(null);

//   const { userProfile, logout } = useAuth();

//   const navigate = useNavigate();
//   const location = useLocation();

//   useEffect(() => {
//     if (showSearch && searchInputRef.current) {
//       searchInputRef.current.focus();
//     }
//   }, [showSearch]);

//   const getPageTitle = () => {
//     if (pageTitles[location.pathname]) return pageTitles[location.pathname];
//     for (const [path, title] of Object.entries(pageTitles)) {
//       if (location.pathname.startsWith(path + "/")) return title;
//     }
//     return "Dashboard";
//   };

//   // 🔐 Firebase Logout
// const handleLogout = async () => {
//   try {
//     await signOut(auth);

//     // reset UI
//     setOpen(false);
//     setShowCategory(false);
//     setActiveCategory(null);
//     setMobileOpen(false);

//     navigate("/login", { replace: true });
//   } catch (error) {
//     console.error("Logout error:", error);
//   }
// };




//   return (
  //   <header className="sticky top-0 z-30 
  // bg-white/10 backdrop-blur-xl 
  // border-b border-white/20
  // shadow-[0_8px_30px_rgb(0,0,0,0.12)]">

//   <div className="flex items-center justify-between px-4 py-3 sm:px-6">

//     {/* LEFT */}
//     <div className="flex items-center gap-3 min-w-0">
//       <button
//         onClick={onMenuClick}
//         className="lg:hidden p-2 rounded-xl 
//         bg-white/10 hover:bg-white/20 
//         text-white transition"
//       >
//         <Menu className="w-6 h-6" />
//       </button>

//       <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold 
//         text-white tracking-wide truncate">
//         {getPageTitle()}
//       </h1>
//     </div>

//     {/* RIGHT */}
//     <div className="flex items-center gap-2">

//       {/* SEARCH BUTTON */}
//       <button
//         onClick={() => setShowSearch(p => !p)}
//         className="p-2 rounded-xl 
//         bg-white/10 hover:bg-white/20 
//         text-white transition"
//       >
//         <Search className="w-5 h-5" />
//       </button>

//       {/* NOTIFICATION */}
//       <div className="relative">
//         <button
//           onClick={() => setShowNotifications(p => !p)}
//           className="relative p-2 rounded-xl 
//           bg-white/10 hover:bg-white/20 
//           text-white transition"
//         >
//           <Bell className="w-5 h-5" />
//           <span className="absolute top-2 right-2 w-2 h-2 
//             bg-red-500 rounded-full ring-2 ring-black/30" />
//         </button>

//         {showNotifications && (
//           <>
//             <div
//               onClick={() => setShowNotifications(false)}
//               className="fixed inset-0 z-40"
//             />

//             <div className="absolute right-0 mt-4 w-80 
//               bg-white/20 backdrop-blur-xl
//               border border-white/20
//               rounded-2xl shadow-2xl z-50">

//               <div className="px-4 py-3 border-b border-white/10">
//                 <h3 className="text-sm font-semibold text-white">
//                   Notifications
//                 </h3>
//               </div>

//               <div className="px-6 py-10 text-center text-white/70">
//                 <Bell className="mx-auto w-10 h-10 opacity-40" />
//                 <p className="mt-2 text-sm">
//                   You're all caught up
//                 </p>
//               </div>
//             </div>
//           </>
//         )}
//       </div>

//       {/* USER PROFILE */}
//       <div className="relative">
//         <button
//           onClick={() => setShowDropdown(p => !p)}
//           className="flex items-center gap-3 px-3 py-1.5 
//           rounded-2xl bg-white/10 hover:bg-white/20 
//           transition"
//         >
//           <div className="w-9 h-9 rounded-full 
//             bg-gradient-to-br from-cyan-500 to-sky-600
//             flex items-center justify-center text-white font-semibold">
//             {userProfile?.displayName?.[0] || "A"}
//           </div>

//           <div className="hidden sm:block text-left">
//             <p className="text-sm font-semibold text-white">
//               {userProfile?.displayName || "Admin"}
//             </p>
//             <p className="text-xs text-white/60">
//               {userProfile?.role || "Administrator"}
//             </p>
//           </div>

//           <ChevronDown
//             className={`hidden sm:block w-4 h-4 text-white/70 transition 
//             ${showDropdown ? "rotate-180" : ""}`}
//           />
//         </button>

//         {showDropdown && (
//           <>
//             <div
//               onClick={() => setShowDropdown(false)}
//               className="fixed inset-0 z-40"
//             />

//             <div className="absolute right-0 mt-4 w-52
//               bg-white/20 backdrop-blur-xl
//               border border-white/20
//               rounded-2xl shadow-2xl z-50 p-1">

//               <div className="px-3 py-2 border-b border-white/10">
//                 <p className="text-sm font-semibold text-white">
//                   {userProfile?.displayName}
//                 </p>
//                 <p className="text-xs text-white/60">
//                   {userProfile?.email}
//                 </p>
//               </div>

//               <Link
//                 to="/trainer/settings/profile"
//                 className="flex items-center gap-3 px-3 py-2 
//                 rounded-xl hover:bg-white/20 
//                 text-sm text-white transition"
//               >
//                 <User className="w-4 h-4" /> Profile
//               </Link>

//               <Link
//                 to="/trainer/settings"
//                 className="flex items-center gap-3 px-3 py-2 
//                 rounded-xl hover:bg-white/20 
//                 text-sm text-white transition"
//               >
//                 <Settings className="w-4 h-4" /> Settings
//               </Link>

//               <button
//                 onClick={handleLogout}
//                 className="flex items-center gap-3 px-3 py-2 
//                 rounded-xl hover:bg-red-500/20 
//                 text-sm text-red-400 w-full transition"
//               >
//                 <LogOut className="w-4 h-4" /> Logout
//               </button>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   </div>
// </header>

//   );
// };

// export default Header;


import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../PrivateRouter/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const pageTitles = {
  "/trainer": "Dashboard",
  "/trainer/addworkouts": "Add Workouts",
  "/trainer/alladdworkouts": "All Workouts",
  "/trainer/adddietplans": "Add Diet Plans",
  "/trainer/alladddietplans": "All Diet Plans",
  "/trainer/overall-attendance": "Attendance",
  "/trainer/reports": "Reports",
  "/trainer/settings/profile": "Profile",
};

const Header = ({ onMenuClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const searchInputRef = useRef(null);

  // ✅ CORRECT VALUES FROM AUTH CONTEXT
  const { user, role, profileName, email } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const getPageTitle = () => {
    if (pageTitles[location.pathname]) return pageTitles[location.pathname];
    for (const [path, title] of Object.entries(pageTitles)) {
      if (location.pathname.startsWith(path + "/")) return title;
    }
    return "Dashboard";
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ✅ Safe values
  const userName = profileName || "User";

  const userRole =
    role
      ? role.charAt(0).toUpperCase() + role.slice(1)
      : "User";

  return (
       <header className="sticky top-0 z-30 
  bg-white/10 backdrop-blur-xl 
  border-b border-white/20
  shadow-[0_8px_30px_rgb(0,0,0,0.12)]">

      <div className="flex items-center justify-between px-4 py-3 sm:px-6">

        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl 
            bg-white/10 hover:bg-white/20 
            text-white transition"
          >
            <Menu className="w-6 h-6" />
          </button>

          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold 
            text-white tracking-wide truncate">
            {getPageTitle()}
          </h1>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          {/* Notification */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(p => !p)}
              className="relative p-2 rounded-xl 
              bg-white/10 hover:bg-white/20 
              text-white transition"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 
                bg-red-500 rounded-full" />
            </button>
          </div>

          {/* USER PROFILE */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(p => !p)}
              className="flex items-center gap-3 px-3 py-1.5 
              rounded-2xl bg-white/10 hover:bg-white/20 
              transition"
            >
              <div className="w-9 h-9 rounded-full 
                bg-gradient-to-br from-cyan-500 to-sky-600
                flex items-center justify-center text-white font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-white">
                  {userName}
                </p>
                <p className="text-xs text-white/60">
                  {userRole}
                </p>
              </div>

              <ChevronDown
                className={`hidden sm:block w-4 h-4 text-white/70 transition 
                ${showDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showDropdown && (
              <>
                <div
                  onClick={() => setShowDropdown(false)}
                  className="fixed inset-0 z-40"
                />

                <div className="absolute right-0 mt-4 w-56
                  bg-slate-800/90 backdrop-blur-xl
                  border border-white/10
                  rounded-2xl shadow-2xl z-50 p-2">

                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-sm font-semibold text-white">
                      {userName}
                    </p>
                    <p className="text-xs text-white/60">
                      {email}
                    </p>
                  </div>

                  <Link
                    to="/trainer/settings/profile"
                    className="flex items-center gap-3 px-3 py-2 
                    rounded-xl hover:bg-white/10 
                    text-sm text-white transition"
                  >
                    <User className="w-4 h-4" /> Profile
                  </Link>

                  {/* <Link
                    to="/trainer/settings"
                    className="flex items-center gap-3 px-3 py-2 
                    rounded-xl hover:bg-white/10 
                    text-sm text-white transition"
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </Link> */}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 
                    rounded-xl hover:bg-red-500/20 
                    text-sm text-red-400 w-full transition"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
