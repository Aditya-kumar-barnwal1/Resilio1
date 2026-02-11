import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, Shield, Bell, AlertTriangle, Menu, Calendar, Clock, Filter, LogOut, User, Settings, BrainCircuit, Mic, Image as ImageIcon } from 'lucide-react';

import EmergencyMap from '../components/Map/EmergencyMap';
import EmergencyDetail from '../components/Dashboard/EmergencyDetail';

const Dashboard = () => {
  const navigate = useNavigate();

  // 1. Determine Backend URL
  const BACKEND_URL = useMemo(() => 
    window.location.hostname === "localhost" 
      ? "http://localhost:8000" 
      : "https://resilio-tbts.onrender.com",
  []);

  // 2. State Management
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [activeFilter, setActiveFilter] = useState('All');

  // REF TRICK: Tracks selected incident to prevent socket re-renders
  const selectedIncidentRef = useRef(null);
  useEffect(() => { selectedIncidentRef.current = selectedIncident; }, [selectedIncident]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  // EFFECT 1: Fetch Initial Data
  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/v1/emergencies`);
        setEmergencies(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchEmergencies();
  }, [BACKEND_URL]);

  // EFFECT 2: Real-Time Socket
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket'], 
      reconnectionAttempts: 5,
    });

    socket.on("new-emergency", (newReport) => {
      try {
        const audio = new Audio('/alert.mp3'); 
        audio.play().catch(e => console.warn("Audio blocked"));
      } catch (e) { console.warn("No Audio File"); }

      setEmergencies((prev) => [newReport, ...prev]);
      setNotifications((prev) => prev + 1);
    });

    socket.on("emergency-updated", (updatedReport) => {
      setEmergencies((prev) => 
        prev.map((item) => (item._id === updatedReport._id ? updatedReport : item))
      );
      if (selectedIncidentRef.current && selectedIncidentRef.current._id === updatedReport._id) {
        setSelectedIncident(updatedReport);
      }
    });

    socket.on("emergency-deleted", (deletedId) => {
      setEmergencies((prev) => prev.filter(item => item._id !== deletedId));
      if (selectedIncidentRef.current && selectedIncidentRef.current._id === deletedId) {
        setSelectedIncident(null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [BACKEND_URL]);

  // 4. SMART SORTING
  const processedEmergencies = useMemo(() => {
    let data = [...emergencies];

    if (activeFilter !== 'All') {
      data = data.filter(item => item.severity === activeFilter);
    }

    const priorityScore = { 
      'Critical': 4, 
      'Serious': 3, 
      'Pending': 2, 
      'Minor': 1, 
      'Fake': 0 
    };
    
    return data.sort((a, b) => {
      const scoreA = priorityScore[a.severity] || 0;
      const scoreB = priorityScore[b.severity] || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [emergencies, activeFilter]);

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return {
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    };
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col shadow-2xl z-20 hidden md:flex">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-lg">
             <Shield className="text-white" fill="currentColor" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">Resilio Ops</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 rounded-lg text-sm font-semibold shadow-lg shadow-red-900/20">
            <LayoutDashboard size={18} /> Live Feed
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <Menu className="text-slate-500 md:hidden" />
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
              Live Emergency Feed
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer group" onClick={() => setNotifications(0)}>
              <Bell className="text-slate-500 group-hover:text-red-600 transition-colors" size={22} />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-[10px] text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse shadow-sm">
                  {notifications}
                </span>
              )}
            </div>
            
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-lg transition-all border border-transparent hover:border-slate-200">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-slate-900">Officer Aditya</p>
                  <p className="text-[10px] text-slate-500 font-medium">Tier-1 Command</p>
                </div>
                <div className="h-9 w-9 bg-slate-900 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-slate-100">AD</div>
              </button>
              {showProfileMenu && (
                <div className="absolute top-12 right-0 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-bold text-slate-800 truncate">officer.aditya@resilio.gov</p>
                  </div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-bold">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="flex-1 flex p-4 md:p-6 gap-6 overflow-hidden relative">
          <div className="flex-[2] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            <EmergencyMap emergencies={emergencies} />
          </div>
          
          <div className="hidden md:flex flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex-col overflow-hidden min-w-[350px] max-w-[400px]">
              
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <AlertTriangle size={16} className="text-red-600" /> Incoming Reports
                  </h3>
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-bold">{processedEmergencies.length}</span>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {['All', 'Critical', 'Serious', 'Pending', 'Minor'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap ${
                        activeFilter === filter 
                        ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {loading ? (
                  <p className="text-center text-xs text-slate-400 mt-10">Syncing Data...</p>
                ) : processedEmergencies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <Filter size={24} className="mb-2 opacity-50"/>
                    <p className="text-xs">No reports found.</p>
                  </div>
                ) : (
                  processedEmergencies.map(incident => {
                    const { time, date } = formatDateTime(incident.timestamp);
                    return (
                      <div 
                        key={incident._id} 
                        onClick={() => setSelectedIncident(incident)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md active:scale-[0.98] group relative overflow-hidden ${
                          selectedIncident?._id === incident._id 
                          ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500' 
                          : 'border-slate-100 bg-white hover:border-red-200 hover:bg-slate-50'
                        }`}
                      >
                        {/* Status Line */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          incident.severity === 'Critical' ? 'bg-red-600' :
                          incident.severity === 'Serious' ? 'bg-orange-500' : 
                          incident.severity === 'Pending' ? 'bg-slate-300' :
                          'bg-blue-400'
                        }`} />

                        <div className="flex justify-between items-start mb-2 pl-2">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-red-700 transition-colors">{incident.type}</span>
                          
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase shadow-sm flex items-center gap-1 ${
                            incident.severity === 'Critical' ? 'bg-red-600 text-white animate-pulse' : 
                            incident.severity === 'Serious' ? 'bg-orange-500 text-white' : 
                            incident.severity === 'Pending' ? 'bg-slate-200 text-slate-600 border border-slate-300' :
                            'bg-blue-500 text-white'
                          }`}>
                            {incident.severity === 'Pending' && <div className="w-2 h-2 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin"/>}
                            {incident.severity}
                          </span>
                        </div>
                        
                        {/* ✅ DESCRIPTION RESTORED */}
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3 pl-2">
                           {incident.description || "No description provided."}
                        </p>
                        
                        {/* Footer with Metadata & Tags */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 pl-2">
                           <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                              <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                <Clock size={10} /> {time}
                              </span>
                           </div>
                           
                           {/* 🏷️ MEDIA & AI BADGES */}
                           <div className="flex gap-1">
                              {incident.audioUrl && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded border border-red-200 flex items-center gap-1" title="Voice Message">
                                  <Mic size={10}/>
                                </span>
                              )}
                              {incident.imageUrl && (
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1" title="Image Attached">
                                  <ImageIcon size={10}/>
                                </span>
                              )}
                              {incident.aiAnalysis && incident.severity !== 'Pending' && (
                                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 flex items-center gap-1" title="Analyzed by AI">
                                  <BrainCircuit size={10}/> AI
                                </span>
                              )}
                           </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
          </div>
        </section>

        {selectedIncident && (
          <EmergencyDetail 
            incident={selectedIncident} 
            onClose={() => setSelectedIncident(null)} 
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;