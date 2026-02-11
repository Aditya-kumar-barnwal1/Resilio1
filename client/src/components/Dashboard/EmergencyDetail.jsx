import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, MapPin, ShieldCheck, Send, PlayCircle, Navigation, CheckCircle, Truck, AlertTriangle, BrainCircuit, User } from 'lucide-react';

// --- 🔔 CUSTOM TOAST COMPONENT ---
const Toast = ({ message, type, onClose }) => (
  <div className="fixed top-6 right-6 z-[2000] animate-in slide-in-from-top-2 fade-in duration-300">
    <div className="bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex flex-col gap-1 min-w-[300px] border border-slate-700">
      <div className="flex items-center gap-2 font-bold text-lg">
        {type === 'success' ? <CheckCircle className="text-green-500" size={20} /> : <AlertTriangle className="text-red-500" size={20} />}
        {type === 'success' ? 'Success' : 'Error'}
      </div>
      <p className="text-slate-300 text-sm whitespace-pre-line">{message}</p>
      <button onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white p-1"><X size={14}/></button>
    </div>
  </div>
);

// --- ⚠️ CUSTOM CONFIRM MODAL ---
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-700 transform scale-100 transition-all">
        <div className="flex items-center gap-3 mb-3 text-amber-500">
          <AlertTriangle size={24} />
          <h3 className="font-bold text-lg">{title}</h3>
        </div>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition">
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const EmergencyDetail = ({ incident, onClose }) => {
  const [status, setStatus] = useState(incident?.status || 'Pending');
  const [severity, setSeverity] = useState(incident?.severity || 'Minor');
  const [department, setDepartment] = useState(incident?.department || 'Medical (Ambulance)');
  
  // 🆕 NEW: State for Rescuer Selection
  const [rescuers, setRescuers] = useState([]);
  const [selectedRescuerId, setSelectedRescuerId] = useState("");

  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false); 
  const [toast, setToast] = useState(null); 
  const [showConfirm, setShowConfirm] = useState(false);

  const BACKEND_URL = window.location.hostname === "localhost" 
    ? "http://localhost:8000" 
    : "https://resilio-tbts.onrender.com";

  // ✅ 1. FETCH RESCUERS ON LOAD
  useEffect(() => {
    const fetchRescuers = async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/v1/rescuers`);
        setRescuers(data);
      } catch (err) {
        console.error("Failed to load rescuers", err);
      }
    };
    fetchRescuers();
  }, [BACKEND_URL]);

  useEffect(() => {
    if (incident) {
      setSeverity(incident.severity);
      setStatus(incident.status);
      if (incident.department) setDepartment(incident.department);
    }
  }, [incident]);

  if (!incident) return null;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ✅ 2. UPDATED DISPATCH LOGIC
  const handleDispatch = async () => {
    if (!selectedRescuerId) {
        showToast("Please assign a specific Rescue Unit!", "error");
        return;
    }

    setDispatching(true);
    setTimeout(async () => {
      try {
        await axios.put(`${BACKEND_URL}/api/v1/emergencies/${incident._id}`, {
          status: 'Assigned',
          severity,
          department,
          assignedRescuerId: selectedRescuerId // 👈 Send the ID to backend
        });
        
        setStatus('Assigned');
        setDispatching(false);
        showToast(`Unit Dispatched Successfully!\nNotification sent to Rescuer App.`, 'success');
      } catch (err) {
        console.error(err);
        setDispatching(false);
        showToast("Failed to dispatch unit.", 'error');
      }
    }, 1500); 
  };

  const confirmDelete = async () => {
    setShowConfirm(false); 
    setLoading(true);
    try {
      await axios.delete(`${BACKEND_URL}/api/v1/emergencies/${incident._id}`);
      showToast("Case Closed & Removed from System.", 'success');
      setTimeout(() => onClose(), 1500); 
    } catch (err) {
      console.error(err);
      showToast("Error deleting case.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <ConfirmModal 
        isOpen={showConfirm} 
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
        title="Permanently Delete Case?"
        message="This will remove the emergency record from the database entirely. This action cannot be undone. Are you sure the job is complete?"
      />

      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[650px]">
          
          <div className="md:w-1/2 bg-slate-200 relative group">
            <img 
              src={incident.imageUrl || "https://via.placeholder.com/600x800?text=No+Image"} 
              alt="Evidence"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/600x800?text=Image+Load+Failed" }}
            />
            
            {status === 'Assigned' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-xl animate-pulse flex items-center gap-2 z-20 whitespace-nowrap">
                <Truck size={24} /> UNIT DISPATCHED
              </div>
            )}
            
            {/* Show status overlay for other statuses too */}
            {['En Route', 'On Scene'].includes(status) && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-600 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 z-20 whitespace-nowrap">
                <Truck size={24} /> {status.toUpperCase()}
              </div>
            )}

            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg z-10">
              <MapPin size={12} /> Geo-Verified
            </div>
          </div>

          <div className="md:w-1/2 p-6 md:p-8 flex flex-col bg-white">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{incident.type} Report</h2>
                <p className="text-slate-400 text-xs font-mono mt-1">ID: #RES-{incident._id ? incident._id.slice(-6) : '000'}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <BrainCircuit size={18} className="text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-700">AI Assessment</h3>
                </div>

                {incident.aiAnalysis ? (
                  <div className="space-y-3 animate-in fade-in duration-500">
                    <div className="flex gap-2">
                       <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                          incident.aiAnalysis.human_at_risk 
                          ? 'bg-red-100 text-red-700 border-red-200' 
                          : 'bg-green-100 text-green-700 border-green-200'
                       }`}>
                          {incident.aiAnalysis.human_at_risk ? '⚠️ Human Risk Detected' : '✅ No Immediate Human Risk'}
                       </span>
                       <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-slate-200 text-slate-600 border border-slate-300">
                          {incident.aiAnalysis.incident}
                       </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{incident.aiAnalysis.reason}"
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                     <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-2"></div>
                     <p className="text-xs font-medium text-slate-500">Scanning image for threats...</p>
                  </div>
                )}
              </div>

              <div className={`p-4 rounded-xl border transition-colors duration-300 ${
                severity === 'Critical' ? 'bg-red-50 border-red-200' : 
                severity === 'Serious' ? 'bg-orange-50 border-orange-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <ShieldCheck size={18} /> Severity Level
                  </div>
                  {incident.aiAnalysis && (
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Set by AI (Editable)
                    </span>
                  )}
                </div>
                
                <select 
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  disabled={status !== 'Pending'}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-bold text-sm bg-white focus:ring-2 focus:ring-slate-400 outline-none shadow-sm"
                >
                  <option value="Critical">🔴 CRITICAL (Life Threatening)</option>
                  <option value="Serious">🟠 SERIOUS (Immediate Action)</option>
                  <option value="Minor">🔵 MINOR (Standard Response)</option>
                  <option value="Fake">⚪ FAKE / HOAX</option>
                </select>
              </div>

              {incident.audioUrl && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
                      <PlayCircle size={14} /> Voice Evidence
                  </h3>
                  <audio controls className="w-full h-8 accent-red-600">
                    <source src={incident.audioUrl} />
                  </audio>
                </div>
              )}
              
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-700 block mb-1">User Description:</span>
                  {incident.description || "No description provided."}
              </div>

              {status === 'Pending' && (
                <div className="space-y-3 pt-2">
                   <button 
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=$${incident.location.lat},${incident.location.lng}`, '_blank')}
                    className="w-full flex items-center justify-center gap-2 bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition border border-slate-200 text-sm shadow-sm"
                  >
                    <Navigation size={16} /> Locate GPS
                  </button>
                  
                  {/* 🆕 RESCUER ASSIGNMENT DROPDOWN */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
                      <User size={14} /> Assign Unit
                    </label>
                    <select 
                      value={selectedRescuerId}
                      onChange={(e) => setSelectedRescuerId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">-- Select Available Unit --</option>
                      {rescuers.map(rescuer => (
                        <option 
                            key={rescuer._id} 
                            value={rescuer._id} 
                            disabled={rescuer.availabilityStatus !== 'Available'}
                        >
                          {rescuer.availabilityStatus === 'Available' ? '🟢' : '🔴'} {rescuer.name} ({rescuer.vehicleId})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              {status === 'Pending' ? (
                <button 
                  onClick={handleDispatch}
                  disabled={dispatching}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-lg transition-all ${
                    dispatching ? 'bg-slate-800 cursor-wait' : 'bg-slate-900 hover:bg-black active:scale-[0.98]'
                  }`}
                >
                  {dispatching ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connecting to Grid...
                    </>
                  ) : (
                    <>
                      <Send size={18} /> CONFIRM & DISPATCH UNIT
                    </>
                  )}
                </button>
              ) : (
                <button 
                  onClick={() => setShowConfirm(true)}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
                >
                  {loading ? "Closing Case..." : (
                    <>
                      <CheckCircle size={20} /> MARK RESOLVED (ARCHIVE)
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default EmergencyDetail;