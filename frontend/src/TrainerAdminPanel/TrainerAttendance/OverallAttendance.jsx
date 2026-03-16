import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Users,
  AlertCircle,
  MapPin,
  Save,
  RefreshCcw,
  Check
} from "lucide-react";
import { useAuth } from "../../PrivateRouter/AuthContext";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import api from "../../api";

/* ================= CONFIG ================= */
const GYM_LOCATION = {
  lat: 12.479724, // Tirupattur Gym Location
  lng: 78.573769,
  radius: 1000, // 1km radius
  name: "Tirupattur Gym Main Office"
};

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c * 1000; // Distance in meters
};

const StatusBadge = ({ status }) => {
  const isPresent = status === "Present";
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 w-fit ${
        isPresent
          ? "bg-green-500/10 text-green-400 border-green-500/20"
          : "bg-red-500/10 text-red-400 border-red-500/20"
      }`}
    >
      {isPresent ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {status}
    </span>
  );
};

const OverallAttendance = () => {
  const { user } = useAuth();
  const trainerUserId = user?.id;

  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showMarkModal, setShowMarkModal] = useState(false);

  // States for marking attendance (Checklist)
  const [savingMulti, setSavingMulti] = useState(false);
  const [attendanceStates, setAttendanceStates] = useState({}); // { memberId: boolean }
  const [locationStatus, setLocationStatus] = useState("idle"); 
  const [trainerCoords, setTrainerCoords] = useState(null);
  const [locationName, setLocationName] = useState("");

  /* ---------------- LOAD ASSIGNMENTS (SQL) ---------------- */
  const loadAssignedMembers = async () => {
    if (!trainerUserId) return;
    try {
      const res = await api.get(`/assignments?trainerUserId=${trainerUserId}`);
      const membersRaw = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.assignments || [];

      const activeMembers = membersRaw
        .filter((m) => !m.status || m.status.toLowerCase() === "active")
        .map((m) => ({
          id: m.userId || m.user_id,
          name: m.username || m.user_name || "Unknown Member",
          email: m.userEmail || m.user_email,
        }));

      const unique = Array.from(new Map(activeMembers.map((m) => [m.id, m])).values());
      setAssignedMembers(unique);
    } catch (err) {
      console.error("Load members error:", err);
      toast.error("Failed to load assigned members");
    }
  };

  /* ---------------- LOAD ATTENDANCE (MYSQL API) ---------------- */
  const loadAttendanceData = async (selectedDate) => {
    if (!trainerUserId) return;
    setLoading(true);
    try {
      const res = await api.get(`/attendance?date=${selectedDate}&trainerId=${trainerUserId}`);
      const data = res.data || [];
      setAttendanceData(data);

      // Initialize attendance states from existing records
      const states = {};
      data.forEach(r => {
        states[r.member_id] = r.status === "Present";
      });
      setAttendanceStates(states);
    } catch (err) {
      console.error("Load attendance error:", err);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trainerUserId) {
      loadAssignedMembers();
      loadAttendanceData(date);
    }
  }, [trainerUserId, date]);

  /* ---------------- GEOLOCATION LOGIC ---------------- */
  const verifyLocation = () => {
    setLocationStatus("checking");
    setLocationName("Fetching address...");
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      setLocationStatus("failed");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setTrainerCoords({ lat: latitude, lng: longitude });
        
        // Auto-mark based on distance
        const dist = getDistance(latitude, longitude, GYM_LOCATION.lat, GYM_LOCATION.lng);
        const isAtGym = dist <= GYM_LOCATION.radius;

        const newStates = {};
        assignedMembers.forEach(m => {
          newStates[m.id] = isAtGym;
        });
        setAttendanceStates(newStates);

        try {
          const response = await api.get(`/attendance/reverse-geocode?lat=${latitude}&lng=${longitude}`);
          const data = response.data;
          const address = data.display_name || (isAtGym ? GYM_LOCATION.name : "External Location");
          setLocationName(address);
          setLocationStatus("verified");
          if (isAtGym) {
            toast.success("Verified at Gym Location! Members auto-marked as Present.");
          } else {
            toast.warning(`Outside Gym Area (${Math.round(dist)}m away). Members auto-marked as Absent.`);
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setLocationName(isAtGym ? GYM_LOCATION.name : "External Location");
          setLocationStatus("verified");
        }
      },
      () => {
        toast.error("Location access denied.");
        setLocationStatus("failed");
        setLocationName("");
      },
      { enableHighAccuracy: true }
    );
  };

  /* ---------------- MARK ATTENDANCE (BATCH) ---------------- */
  const toggleMemberStatus = (memberId) => {
    setAttendanceStates(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const handleSelectAll = (checked) => {
    const newStates = {};
    assignedMembers.forEach(m => {
      newStates[m.id] = checked;
    });
    setAttendanceStates(newStates);
  };

  const isAllSelected = assignedMembers.length > 0 && assignedMembers.every(m => attendanceStates[m.id]);

  const handleSaveAll = async () => {
    if (locationStatus !== "verified") {
      return toast.error("Please fetch current location first!");
    }
    
    setSavingMulti(true);
    try {
      const promises = assignedMembers.map(member => {
        const isPresent = attendanceStates[member.id] || false;
        const statusText = isPresent ? "Present" : "Absent";
        
        const payload = {
          memberId: member.id,
          trainerId: trainerUserId,
          status: statusText,
          date: date,
          lat: trainerCoords?.lat || null,
          lng: trainerCoords?.lng || null,
          locationName: locationName || null,
        };
        return api.post('/attendance', payload);
      });

      await Promise.all(promises);
      toast.success("Attendance updated for all assigned members");
      setShowMarkModal(false);
      loadAttendanceData(date);
    } catch (err) {
      console.error(err);
      toast.error("Error saving attendance checklist");
    } finally {
      setSavingMulti(false);
    }
  };

  /* ---------------- FILTERING & STATS ---------------- */
  const filteredRecords = useMemo(() => {
    return attendanceData.filter(r => {
      const matchesSearch = r.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [attendanceData, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const present = attendanceData.filter(r => r.status === "Present").length;
    const absent = attendanceData.filter(r => r.status === "Absent").length;
    return { present, absent, total: attendanceData.length };
  }, [attendanceData]);

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen p-4 sm:p-6 text-white space-y-8 bg-transparent">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Trainer Attendance
          </h2>
          <p className="text-gray-400 mt-1 flex items-center gap-2">
            <Users className="w-4 h-4" /> MySQL Tracking • {assignedMembers.length} Assigned Members
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 w-5 h-5" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-2xl pl-12 pr-6 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          
          <button
            onClick={() => { setShowMarkModal(true); setLocationStatus("idle"); }}
            className="px-8 py-3.5 bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" /> Mark Today
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
          <p className="text-gray-400 text-sm flex items-center gap-2 font-medium">
            <Users className="w-4 h-4 text-blue-400" /> Total Active Records
          </p>
          <h3 className="text-4xl font-black mt-2">{stats.total}</h3>
        </div>
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
          <p className="text-gray-400 text-sm flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 text-green-400" /> Present
          </p>
          <h3 className="text-4xl font-black mt-2 text-green-400">{stats.present}</h3>
        </div>
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
          <p className="text-gray-400 text-sm flex items-center gap-2 font-medium">
            <XCircle className="w-4 h-4 text-red-400" /> Absent
          </p>
          <h3 className="text-4xl font-black mt-2 text-red-400">{stats.absent}</h3>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
         <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              placeholder="Filter logged names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 w-full outline-none focus:ring-2 focus:ring-orange-500"
            />
         </div>

         <div className="flex gap-2">
            {["All", "Present", "Absent"].map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  statusFilter === f ? "bg-orange-600 text-white" : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                {f}
              </button>
            ))}
         </div>
      </div>

      {/* RECORDS TABLE */}
      <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] hide-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Member Name</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5">Log Time</th>
                <th className="px-8 py-5">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="4" className="text-center py-20 text-gray-500">Loading records...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-20 text-gray-500">No attendance data found for this date.</td></tr>
              ) : (
                filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-white/5 transition group">
                    <td className="px-8 py-5 font-bold group-hover:text-orange-400">{r.name || r.member_id}</td>
                    <td className="px-8 py-5 text-center"><StatusBadge status={r.status} /></td>
                    <td className="px-8 py-5 text-sm text-gray-400">
                       <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {r.check_in ? dayjs(r.check_in).format("h:mm A") : "-"}
                       </div>
                    </td>
                    <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                           <MapPin className={`w-4 h-4 ${r.lat ? 'text-green-500' : 'text-white/10'}`} />
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase leading-none">{r.location_name || (r.lat ? 'Verified Location' : 'No GPS')}</p>
                              <p className="text-[10px] font-bold text-gray-600 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3"/> {r.check_in ? dayjs(r.check_in).format("h:mm A") : "-"}
                              </p>
                           </div>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHECKLIST MODAL */}
      {showMarkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowMarkModal(false)} />
          <div className="relative w-full max-w-2xl bg-[#0b0c10] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
             <div className="bg-gradient-to-r from-red-600 to-orange-500 p-8 flex justify-between items-center">
                <div>
                   <h3 className="text-2xl font-black text-white">Attendance Checklist</h3>
                   <p className="text-white/80 mt-1 uppercase text-xs tracking-widest">{dayjs(date).format("DD MMMM YYYY")}</p>
                </div>
                <button onClick={() => setShowMarkModal(false)} className="text-white/50 hover:text-white">
                   <XCircle className="w-6 h-6" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-6 hide-scrollbar">
                
                {/* SELECT ALL & LOCATION FETCH */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-6 bg-white/5 rounded-3xl border border-white/10">
                   <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={isAllSelected} onChange={(e) => handleSelectAll(e.target.checked)} />
                        <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        <span className="ml-3 text-xs font-bold text-gray-300 uppercase">Select All</span>
                      </label>
                   </div>
                   
                   <div className="flex flex-col gap-3">
                       <button 
                        onClick={verifyLocation}
                        className={`px-6 py-4 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 shadow-lg ${
                          locationStatus === "verified" 
                            ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                            : "bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-xl shadow-orange-500/20"
                        }`}
                       >
                         {locationStatus === "checking" ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                         {locationStatus === "verified" ? "Location Verified" : "Verify My Location"}
                       </button>

                       <div className="flex flex-col gap-3 p-4 bg-black/40 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                               <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-gray-500 uppercase">Trainer Current Location</p>
                               <p className="text-xs font-bold text-white truncate max-w-[200px]">
                                 {locationStatus === "verified" ? locationName : (locationStatus === "checking" ? "Fetching..." : "Not Verified")}
                               </p>
                            </div>
                          </div>

                          <div className="h-px bg-white/5 w-full" />

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                               <Check className="w-4 h-4" />
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-gray-500 uppercase">Gym Office Location</p>
                               <p className="text-xs font-bold text-white uppercase italic">{GYM_LOCATION.name}</p>
                            </div>
                          </div>
                       </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] px-2 mb-2">Member List</p>
                   {assignedMembers.length === 0 ? (
                     <div className="text-center py-10 text-gray-600 italic font-medium">No members assigned.</div>
                   ) : (
                     assignedMembers.map(member => {
                       const isChecked = attendanceStates[member.id] || false;
                       return (
                         <div 
                           key={member.id} 
                           onClick={() => toggleMemberStatus(member.id)}
                           className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                             isChecked 
                               ? "bg-green-500/10 border-green-500/30" 
                               : "bg-white/5 border-white/10 hover:border-white/20"
                           }`}
                         >
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isChecked ? "bg-green-500 text-white" : "bg-white/10 text-gray-400"}`}>
                                  {member.name.charAt(0)}
                               </div>
                               <div>
                                  <p className={`font-bold transition-colors ${isChecked ? "text-green-400" : "text-white"}`}>{member.name}</p>
                                  <p className="text-[10px] text-gray-500 uppercase">{member.email || "No Email"}</p>
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                               <span className={`text-[10px] font-black uppercase tracking-tighter ${isChecked ? "text-green-500" : "text-gray-600"}`}>
                                  {isChecked ? "Present" : "Absent"}
                               </span>
                               <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                                 isChecked ? "bg-green-500 border-green-500 scale-110 shadow-lg shadow-green-500/20" : "bg-transparent border-white/20"
                               }`}>
                                  {isChecked && <Check className="w-4 h-4 text-white" />}
                               </div>
                            </div>
                         </div>
                       );
                     })
                   )}
                </div>
             </div>

             <div className="p-8 bg-white/5 border-t border-white/10 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowMarkModal(false)} 
                  className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:text-white transition"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  disabled={savingMulti || assignedMembers.length === 0 || locationStatus !== "verified"}
                  onClick={handleSaveAll}
                  className={`flex-1 py-4 rounded-2xl text-white font-black shadow-xl active:scale-95 transition-all text-sm uppercase flex items-center justify-center gap-2 ${
                    locationStatus === "verified" 
                      ? "bg-gradient-to-r from-red-600 to-orange-500 shadow-red-600/20" 
                      : "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
                  }`}
                >
                  {savingMulti ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      Saving Checklist...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Attendance
                    </>
                  )}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
;

export default OverallAttendance;
