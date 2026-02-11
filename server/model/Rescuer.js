import mongoose from 'mongoose';

const rescuerSchema = new mongoose.Schema({
  // --- PERSONAL DETAILS ---
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String, 
    required: true 
  },

  // --- PROFESSIONAL DETAILS ---
  department: { 
    type: String, 
    enum: ['Medical (Ambulance)', 'Fire Dept', 'Police Force', 'Disaster Relief'],
    required: true 
  },
  vehicleId: {
    type: String, // e.g. "AMB-04", "FIRE-TRUCK-1"
    required: true
  },

  // --- REAL-TIME STATUS ---
  availabilityStatus: { 
    type: String, 
    enum: ['Available', 'Busy', 'Offline'], 
    default: 'Available' 
  },
  
  // 📍 FOR LIVE TRACKING
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },

  // --- TASK MANAGEMENT ---
  // If they are busy, this links to the specific Emergency ID
  currentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emergency',
    default: null
  },

  // History of solved cases (Good for gamification/stats)
  taskHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emergency'
  }]
}, { timestamps: true });

export default mongoose.model('Rescuer', rescuerSchema);