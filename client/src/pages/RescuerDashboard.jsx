import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { MapPin, Navigation, Truck, CheckCircle, AlertOctagon, Clock, Shield } from 'lucide-react';

const RescuerDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [activeMission, setActiveMission] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [reportText, setReportText] = useState("");

  const BACKEND_URL = useMemo(() => 
    window.location.hostname === "localhost" ? "http://localhost:8000" : "https://resilio-tbts.onrender.com", 
  []);

  // 1. Fetch Assigned Tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/v1/emergencies`);
        // Filter for tasks that are Assigned, En Route, or On Scene
        const myTasks = data.filter(e => ['Assigned', 'En Route', 'On Scene'].includes(e.status));
        setTasks(myTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };
    fetchTasks();

    // 2. Real-Time Listener
    const socket = io(BACKEND_URL);
    socket.on('emergency-updated', (updated) => {
      // If status is relevant to us, update list
      if (['Assigned', 'En Route', 'On Scene'].includes(updated.status)) {
        setTasks(prev => {
          const exists = prev.find(p => p._id === updated._id);
          if (exists) return prev.map(p => p._id === updated._id ? updated : p);
          return [updated, ...prev];
        });
        
        // Also update the active view if it's the one currently open
        if (activeMission && activeMission._id === updated._id) {
            setActiveMission(updated);
        }
      } else {
        // If resolved, remove from list
        setTasks(prev => prev.filter(p => p._id !== updated._id));
        if (activeMission && activeMission._id === updated._id) {
            setActiveMission(null);
        }
      }
    });

    return () => socket.disconnect();
  }, [BACKEND_URL, activeMission]); // Added activeMission dependency

  // 3. Status Update Logic
  const updateStatus = async (status) => {
    if (!activeMission) return;
    try {
      await axios.put(`${BACKEND_URL}/api/v1/emergencies/${activeMission._id}`, { status });
      // We rely on the socket to update the state, but optimistic update is faster:
      setActiveMission(prev => ({ ...prev, status }));
    } catch (err) {
      console.log(err);
      alert("Error updating status");
    }
  };

  // 4. Submit Final Report
  const submitResolution = async () => {
    try {
      await axios.put(`${BACKEND_URL}/api/v1/emergencies/${activeMission._id}`, { 
        status: 'Resolved',
        resolutionDetails: {
            report: reportText,
            resolvedAt: new Date(),
            resolvedBy: "Officer Aditya (Rescue Unit)"
        }
      });
      // UI Reset
      setActiveMission(null);
      setReportText("");
      alert("Mission Accomplished! Good work.");
    } catch (err) {
      console.log(err);
      alert("Failed to submit report");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-4 pb-20">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-red-500" /> Rescue Ops
          </h1>
          <p className="text-slate-400 text-xs">Unit: Alpha-1</p>
        </div>
        <div 
          onClick={() => setIsOnline(!isOnline)}
          className={`px-4 py-2 rounded-full font-bold text-sm cursor-pointer transition-all ${
            isOnline ? 'bg-green-500/20 text-green-400 border border-green-500' : 'bg-slate-700 text-slate-400'
          }`}
        >
          {isOnline ? '● ONLINE' : '○ OFFLINE'}
        </div>
      </header>

      {/* NO MISSION STATE */}
      {!activeMission && (
        <div className="space-y-4">
          <h2 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4">
            Incoming Tasks ({tasks.length})
          </h2>
          
          {tasks.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <Truck size={48} className="mx-auto mb-4" />
              <p>No active emergencies assigned.</p>
              <p className="text-xs">Stand by for dispatch.</p>
            </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task._id} 
                onClick={() => setActiveMission(task)}
                className="bg-slate-800 p-4 rounded-xl border border-slate-700 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    task.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {task.severity}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} /> {new Date(task.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{task.type} Incident</h3>
                <p className="text-slate-400 text-sm line-clamp-2">{task.description}</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-blue-400">
                  <MapPin size={16} /> 
                  <span>Tap to view mission details</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ACTIVE MISSION VIEW */}
      {activeMission && (
        <div className="animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Mission Header */}
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 mb-4 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${
               activeMission.status === 'On Scene' ? 'bg-green-500' : 'bg-blue-500'
            }`}></div>
            
            <h2 className="text-2xl font-bold mb-1">{activeMission.type}</h2>
            <p className="text-slate-400 text-sm mb-4">{activeMission.description}</p>
            
            {/* ✅ FIXED NAVIGATION LINK */}
            <button 
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeMission.location.lat},${activeMission.location.lng}`, '_blank')}
              className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
            >
              <Navigation size={18} /> START NAVIGATION
            </button>
          </div>

          {/* Workflow Actions */}
          <div className="space-y-3">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Update Status</p>
            
            {activeMission.status === 'Assigned' && (
              <button 
                onClick={() => updateStatus('En Route')}
                className="w-full bg-slate-700 hover:bg-slate-600 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 border border-slate-600"
              >
                <Truck /> MARK "EN ROUTE"
              </button>
            )}

            {(activeMission.status === 'Assigned' || activeMission.status === 'En Route') && (
              <button 
                onClick={() => updateStatus('On Scene')}
                className="w-full bg-orange-600 hover:bg-orange-500 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-orange-900/20"
              >
                <AlertOctagon /> MARK "ARRIVED"
              </button>
            )}

            {activeMission.status === 'On Scene' && (
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 animate-in fade-in">
                <label className="text-xs font-bold text-slate-400 mb-2 block">FINAL REPORT</label>
                <textarea 
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Describe action taken (e.g. Fire extinguished, 2 injured rescued)..."
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm h-24 mb-3 focus:ring-2 focus:ring-green-500 outline-none"
                />
                <button 
                  onClick={submitResolution}
                  disabled={!reportText}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-green-900/20"
                >
                  <CheckCircle /> MISSION COMPLETE
                </button>
              </div>
            )}

             <button 
                onClick={() => setActiveMission(null)}
                className="w-full py-3 text-slate-500 text-sm font-bold"
              >
                Back to List
              </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default RescuerDashboard;