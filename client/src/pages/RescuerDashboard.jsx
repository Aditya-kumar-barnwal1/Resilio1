import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  MapPin, Navigation, Truck, CheckCircle, AlertOctagon, 
  Clock, Shield, Phone, X, RefreshCw, UserCircle ,Signal
} from 'lucide-react';

import LiveRouteMap from '../components/Map/LiveRouteMap'; 

const RescuerDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [activeMission, setActiveMission] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [reportText, setReportText] = useState("");
  const [myLocation, setMyLocation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // ✅ FIX: Initialize User directly (Prevents the error you saw)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const BACKEND_URL = useMemo(() => 
    window.location.hostname === "localhost" 
      ? "http://localhost:8000" 
      : "https://resilio-tbts.onrender.com", 
  []);

// 1. 🛰️ GPS TRACKER WITH HARD FALLBACK (Fixed & Warning-Free)
  useEffect(() => {
    const JATNI_LOCATION = { lat: 20.173371, lng: 85.706037 };
    let realGpsFound = false;

    // ⏳ 1. START THE 5-SECOND TIMER
    const fallbackTimer = setTimeout(() => {
      if (!realGpsFound) {
        console.warn("⚠️ GPS took too long (5s). Forcing Jatni Location.");
        setMyLocation(JATNI_LOCATION);
      }
    }, 5000); 

    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          // ✅ SUCCESS: Real GPS found!
          realGpsFound = true;
          clearTimeout(fallbackTimer); 
          setMyLocation({ 
            lat: position.coords.latitude, 
            lng: position.coords.longitude 
          });
        },
        (error) => {
          console.error("GPS Error:", error);
          // ❌ ERROR: If it fails instantly, set fallback
          if (!realGpsFound) {
             // ⚡ FIX: Use setTimeout to make this update asynchronous
             setTimeout(() => setMyLocation(JATNI_LOCATION), 0);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      return () => {
        clearTimeout(fallbackTimer);
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      // ⚡ FIX: Wrap this in setTimeout to avoid the "Synchronous State" warning
      setTimeout(() => setMyLocation(JATNI_LOCATION), 0);
    }
  }, []);

  // 2. 🔄 FETCH TASKS (Auto-Refresh Logic)
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        if (!currentUser) return;

        const { data } = await axios.get(`${BACKEND_URL}/api/v1/emergencies`);
        
        // 🛡️ ROBUST FILTER
        const myTasks = data.filter(task => {
            const isActive = ['Assigned', 'En Route', 'On Scene'].includes(task.status);
            
            // Check if ID exists
            if (!task.assignedRescuerId) return false;
            
            // Safe Compare (Handle String vs Object)
            const taskRescuerId = task.assignedRescuerId._id 
                ? task.assignedRescuerId._id.toString() 
                : task.assignedRescuerId.toString();

            return isActive && taskRescuerId === currentUser._id.toString();
        });

        setTasks(myTasks);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();

    // Auto-refresh every 15s
    const intervalId = setInterval(fetchTasks, 15000);

    // Socket Listener
    const socket = io(BACKEND_URL);
    socket.on('emergency-updated', () => fetchTasks());

    return () => {
      clearInterval(intervalId);
      socket.disconnect();
    };
  }, [BACKEND_URL, currentUser]);

  // 3. Update Status
  const updateStatus = async (status) => {
    if (!activeMission) return;
    const prevStatus = activeMission.status;
    setActiveMission(prev => ({ ...prev, status })); 

    try {
      await axios.put(`${BACKEND_URL}/api/v1/emergencies/${activeMission._id}`, { status });
      // Quick refresh to sync list
      const { data } = await axios.get(`${BACKEND_URL}/api/v1/emergencies`);
      const updatedTask = data.find(t => t._id === activeMission._id);
      if(updatedTask) setActiveMission(updatedTask);
    } catch (err) {
       if (err.response && err.response.status === 404) {
         alert("🚫 Task no longer exists.");
         setActiveMission(null);
         setTasks(prev => prev.filter(t => t._id !== activeMission._id));
       } else {
         alert("⚠️ Connection Error");
         setActiveMission(prev => ({ ...prev, status: prevStatus }));
       }
    }
  };

  // 4. Submit Report
  const submitResolution = async () => {
    try {
      await axios.put(`${BACKEND_URL}/api/v1/emergencies/${activeMission._id}`, { 
        status: 'Resolved',
        resolutionDetails: { 
            report: reportText, 
            resolvedAt: new Date(),
            resolvedBy: currentUser?.name || "Unknown Unit"
        }
      });
      setActiveMission(null);
      setReportText("");
      setTasks(prev => prev.filter(t => t._id !== activeMission._id));
      alert("Great job! Mission Resolved.");
    } catch (err) {
      console.log(err);
      alert("Failed to submit report");
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* LEFT PANEL: LIST */}
      <div className={`
          flex flex-col bg-slate-900 border-r border-slate-800 z-30 transition-all duration-300 shadow-2xl
          ${activeMission ? 'hidden md:flex w-96' : 'w-full md:w-96'} 
      `}>
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2 text-white tracking-wide">
                <Shield className="text-red-500 fill-current" size={24} /> 
                RESILIO OPS
              </h1>
              {/* 👤 NAME BADGE */}
              <div className="flex items-center gap-2 mt-2 text-slate-300 bg-slate-800/50 py-1 px-3 rounded-lg w-fit">
                  <UserCircle size={14} className="text-blue-400"/>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {currentUser?.name || "Unknown Unit"}
                  </span>
              </div>
            </div>
            
            <button 
               onClick={() => setIsOnline(!isOnline)}
               className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                 isOnline 
                 ? 'bg-green-500/10 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                 : 'bg-slate-800 text-slate-500 border-slate-700'
               }`}
            >
              {isOnline ? '● ONLINE' : '○ OFF DUTY'}
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
             <span className="flex items-center gap-1">
                {myLocation ? <Signal size={10} className="text-green-500"/> : <Signal size={10} className="text-red-500 animate-pulse"/>}
                {myLocation ? "GPS LOCKED" : "SEARCHING..."}
             </span>
             <span className="flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin-slow"/> 
                Updated: {lastUpdated.toLocaleTimeString()}
             </span>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-950/50">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-600 opacity-60">
              <div className="bg-slate-900 p-6 rounded-full mb-4 border border-slate-800">
                 <Truck size={40} className="text-slate-700" />
              </div>
              <p className="text-sm font-medium">No active missions</p>
              <p className="text-xs text-slate-500">Stand by for dispatch</p>
            </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task._id} 
                onClick={() => setActiveMission(task)}
                className={`
                  relative p-4 rounded-xl border cursor-pointer transition-all duration-200 group
                  ${activeMission?._id === task._id 
                    ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.15)]' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
                  }
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    task.severity === 'Critical' 
                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {task.severity}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                    <Clock size={10} /> {new Date(task.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                <h3 className="font-bold text-white text-base mb-1 truncate group-hover:text-blue-400 transition-colors">
                    {task.type} Incident
                </h3>
                <p className="text-slate-400 text-xs line-clamp-2 mb-3 leading-relaxed border-l-2 border-slate-700 pl-2">
                   {task.description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                   <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <MapPin size={12} className={activeMission?._id === task._id ? "text-blue-400" : "text-slate-500"} /> 
                      <span>Tap to Navigate</span>
                   </div>
                   {myLocation && (
                       <span className="text-[10px] bg-slate-950 px-2 py-1 rounded text-slate-400 font-mono border border-slate-800">
                          ~{(Math.abs(task.location.lat - myLocation.lat) * 111).toFixed(1)} km
                       </span>
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: MAP */}
      <div className={`flex-1 relative bg-slate-900 w-full ${!activeMission ? 'hidden md:block' : 'block'}`}>
        
        {/* Mobile Close Button */}
        {activeMission && (
             <button 
                onClick={() => setActiveMission(null)}
                className="md:hidden absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-full shadow-lg border border-slate-700 active:scale-95 transition-transform"
             >
                <X size={24} />
             </button>
        )}

        {/* 🗺️ THE MAP */}
        <div className="absolute inset-0 z-0">
             {activeMission && myLocation ? (
                 <LiveRouteMap 
                    rescuerLocation={myLocation} 
                    emergencyLocation={activeMission.location} 
                 />
             ) : (
                 <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse-slow"></div>
                        <Navigation size={80} className="relative z-10 text-slate-700" />
                    </div>
                    <h2 className="mt-6 text-lg font-bold text-slate-600 tracking-widest uppercase">Awaiting Mission Selection</h2>
                    <p className="text-xs text-slate-600 mt-1">Select a task from the list to view route</p>
                 </div>
             )}
        </div>

        {/* BOTTOM CONTROL SHEET */}
        {activeMission && (
          <div className="absolute bottom-0 left-0 right-0 z-[999] bg-slate-900 border-t border-slate-700 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.6)] md:m-6 md:rounded-2xl md:w-96 md:border md:left-auto md:bottom-6 animate-in slide-in-from-bottom-10 duration-300">
            
            <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-16 h-1.5 bg-slate-700 rounded-full"></div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white leading-tight">{activeMission.type}</h2>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1 flex items-center gap-1">
                    <MapPin size={10}/> {activeMission.location.lat.toFixed(4)}, {activeMission.location.lng.toFixed(4)}
                  </p>
                </div>
                <div className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg ${
                    activeMission.severity === 'Critical' 
                    ? 'bg-red-600 text-white shadow-red-900/20' 
                    : 'bg-blue-600 text-white shadow-blue-900/20'
                }`}>
                   {activeMission.severity}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <a href="tel:100" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                  <Phone size={18} /> Contact HQ
                </a>
                <a 
                   href={`https://www.google.com/maps/dir/?api=1&destination=${activeMission.location.lat},${activeMission.location.lng}`}
                   target="_blank" rel="noreferrer"
                   className="bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/30"
                >
                   <Navigation size={18} /> Open Maps
                </a>
              </div>

              <div className="space-y-3">
                {activeMission.status === 'Assigned' && (
                  <button 
                    onClick={() => updateStatus('En Route')}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all border border-slate-600 group"
                  >
                     <Truck size={20} className="text-yellow-500 group-hover:scale-110 transition-transform" /> 
                     <span>START NAVIGATION</span>
                  </button>
                )}

                {activeMission.status === 'En Route' && (
                  <button 
                    onClick={() => updateStatus('On Scene')}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-orange-900/30 transition-all transform active:scale-[0.98]"
                  >
                    <AlertOctagon size={20} className="animate-pulse"/> 
                    <span>I HAVE ARRIVED</span>
                  </button>
                )}

                {activeMission.status === 'On Scene' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <textarea 
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder="Final Report: Describe the outcome..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm h-28 mb-3 focus:ring-2 focus:ring-green-500 outline-none text-slate-200 placeholder:text-slate-600 resize-none shadow-inner"
                    />
                    <button 
                      onClick={submitResolution}
                      disabled={!reportText.trim()}
                      className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:grayscale text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all"
                    >
                      <CheckCircle size={20} /> 
                      <span>COMPLETE MISSION</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default RescuerDashboard;