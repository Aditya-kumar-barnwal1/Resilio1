import mongoose from 'mongoose';

const emergencySchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: [true, 'Emergency type is required'] // e.g., Fire, Medical
  },
  severity: { 
    type: String, 
    // Added 'Fake' to handle cases where AI detects a hoax
    enum: ['Critical', 'Serious', 'Minor', 'Pending', 'Fake'],
    default: 'Pending' 
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  imageUrl: {
    type: String // Stores the path/URL to the uploaded image
  },
  audioUrl: { type: String },
  voiceTranscript: {
    type: String // came from app by voice to text
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Assigned', 'En Route', 'On Scene', 'Resolved'], 
    default: 'Pending' 
  },
  
  // ✅ NEW FIELD: Stores the full AI Analysis response
  aiAnalysis: {
    incident: { type: String },       // e.g., "fire", "accident", "normal"
    human_at_risk: { type: Boolean }, // e.g., true/false
    severity: { type: String },       // e.g., "critical", "minor"
    reason: { type: String }          // e.g., "The image shows a large fire..."
  },
  // 2. ADD FINAL REPORT FIELD
  resolutionDetails: {
    report: String,      // "Patient transported to City Hospital"
    resolvedAt: Date,
    resolvedBy: String   // "Unit-Alpha"
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// Export using ES Module syntax
export default mongoose.model('Emergency', emergencySchema);