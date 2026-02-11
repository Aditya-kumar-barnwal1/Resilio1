import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

// 📍 Custom Icons
const rescuerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1986/1986937.png', // Ambulance/Rescuer Icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const emergencyIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Red Pin
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// 🛣️ Routing Component (The "Swiggy" Path)
const RoutingControl = ({ start, end }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !start || !end) return;

    // Remove previous route if it exists
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    // Create new route using OSRM (Open Source Routing Machine - Free)
    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(start.lat, start.lng),
        L.latLng(end.lat, end.lng)
      ],
      routeWhileDragging: false,
      showAlternatives: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#2563eb', opacity: 0.8, weight: 6 }] // Swiggy Blue Line
      },
      createMarker: () => null, // Hide default markers (we use our own)
      addWaypoints: false,
      draggableWaypoints: false,
    }).addTo(map);

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, start, end]);

  return null;
};

const LiveRouteMap = ({ rescuerLocation, emergencyLocation }) => {
  if (!rescuerLocation || !emergencyLocation) return <div className="h-full flex items-center justify-center bg-slate-100">Waiting for GPS...</div>;

  return (
    <MapContainer 
      center={[rescuerLocation.lat, rescuerLocation.lng]} 
      zoom={15} 
      className="h-full w-full z-0"
    >
      {/* Dark Mode Map Style (optional) */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 🛣️ The Path Drawer */}
      <RoutingControl start={rescuerLocation} end={emergencyLocation} />

      {/* 🚑 Rescuer Marker (Moving) */}
      <Marker position={[rescuerLocation.lat, rescuerLocation.lng]} icon={rescuerIcon}>
        <Popup className="font-bold">You (Rescuer)</Popup>
      </Marker>

      {/* 🚨 Emergency Marker (Static) */}
      <Marker position={[emergencyLocation.lat, emergencyLocation.lng]} icon={emergencyIcon}>
        <Popup className="font-bold text-red-600">Emergency Location</Popup>
      </Marker>

    </MapContainer>
  );
};

export default LiveRouteMap;