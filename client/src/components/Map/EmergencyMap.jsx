import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'; // 👈 Added Circle
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- ICON FIX START ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34] 
});

L.Marker.prototype.options.icon = DefaultIcon;
// --- ICON FIX END ---

const EmergencyMap = ({ emergencies }) => {
  // Center map on Bhubaneswar
  const defaultPosition = [20.2961, 85.8245]; 

  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-inner border border-slate-200">
      <MapContainer center={defaultPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {emergencies.map((incident) => (
          // ✅ React.Fragment is needed to group the Circle and Marker together
          <React.Fragment key={incident._id}>
            
            {/* 🔴 RED ZONE INDICATOR */}
            <Circle 
              center={[incident.location.lat, incident.location.lng]}
              radius={800} // Radius in meters (Adjust size here)
              pathOptions={{ 
                color: 'red',       // Border color
                fillColor: '#ef4444', // Inner color (Tailwind Red-500)
                fillOpacity: 0.2,   // Low opacity allows stacking to create darker "Heatmap" effect
                stroke: false       // Hides the sharp border line for a smoother glow
              }} 
            />

            {/* 📍 EXISTING MARKER & POPUP */}
            <Marker position={[incident.location.lat, incident.location.lng]}>
              <Popup className="custom-popup">
                <div className="w-48">
                  {/* 1. Image Thumbnail */}
                  <div className="h-24 w-full bg-gray-100 rounded-t-md overflow-hidden mb-2 relative">
                     <img 
                       src={incident.imageUrl || "https://via.placeholder.com/150?text=No+Image"} 
                       alt="Emergency"
                       className="w-full h-full object-cover"
                       onError={(e) => e.target.src = "https://via.placeholder.com/150?text=Error"}
                     />
                     {/* Audio Indicator Badge */}
                     {incident.audioUrl && (
                       <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1 rounded">
                         🎤 Audio
                       </div>
                     )}
                  </div>

                  {/* 2. Text Details */}
                  <h3 className="font-bold text-slate-800 text-sm">{incident.type}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2 mt-1">
                    {incident.description || "No description provided."}
                  </p>
                  
                  {/* 3. Severity Badge */}
                  <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    incident.severity === 'Critical' ? 'bg-red-100 text-red-600' : 
                    incident.severity === 'Serious' ? 'bg-orange-100 text-orange-600' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {incident.severity}
                  </span>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
};

export default EmergencyMap;