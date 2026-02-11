import Emergency from '../model/Emergency.js';
import axios from 'axios'; // 👈 Import Axios for AI calls
import Rescuer from '../model/Rescuer.js';
// @desc    Create new emergency report & Trigger AI Analysis
// @route   POST /api/v1/emergencies
// @access  Public
export const createEmergency = async (req, res) => {
  try {
    const { type, description, lat, lng } = req.body;
    
    // ---------------------------------------------------------
    // 1. EXTRACT CLOUDINARY URLS (Image & Audio)
    // ---------------------------------------------------------
    const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
    const imageUrl = imageFile ? imageFile.path : null;

    const audioFile = req.files && req.files['audio'] ? req.files['audio'][0] : null;
    const audioUrl = audioFile ? audioFile.path : null;

    // ---------------------------------------------------------
    // 2. CREATE INITIAL REPORT (Saved immediately for speed)
    // ---------------------------------------------------------
    // We default severity to 'Pending' until AI or Admin updates it
    const newEmergency = new Emergency({
      type: type || 'General',
      severity: 'Pending',
      description,
      location: { lat, lng },
      imageUrl,
      audioUrl,
      status: 'Pending'
    });

    const savedEmergency = await newEmergency.save();

    // ⚡ Emit "New Emergency" instantly (so Admin sees the pin ASAP)
    if (req.io) {
      req.io.emit('new-emergency', savedEmergency);
      console.log(`📡 Socket Event Emitted: new-emergency (ID: ${savedEmergency._id})`);
    }

  // ---------------------------------------------------------
    // 🤖 3. CALL YOUR AI API (Background Process)
    // ---------------------------------------------------------
    if (imageUrl) {
      (async () => {
        try {
          console.log("🤖 Sending to AI for analysis...");
          
          // ✅ 1. THE EXACT URL FROM YOUR SCREENSHOT
          const AI_API_URL = "https://resilio-qwo6.onrender.com/ai/image-url"; 

          // ✅ 2. SEND DATA MATCHING THE SWAGGER DOCS
          const aiResponse = await axios.post(AI_API_URL, {
            emergencyId: savedEmergency._id.toString(), // "emergencyId" as per docs
            imageUrl: imageUrl                          // "imageUrl" as per docs
          });

          // ✅ 3. HANDLE THE RESPONSE (Matches your other screenshot)
          // The AI returns: { status: "...", analysis: { ... } }
          const analysis = aiResponse.data.analysis; 

          console.log("✅ AI Analysis Complete:", analysis);

          // 4. UPDATE DATABASE
          if (analysis) {
            savedEmergency.aiAnalysis = analysis;
            
            // Update Severity if AI provides it
            if (analysis.severity) {
              const aiSeverity = analysis.severity.charAt(0).toUpperCase() + analysis.severity.slice(1).toLowerCase();
              
              // Validate against your Enum
              if (['Critical', 'Serious', 'Minor', 'Fake'].includes(aiSeverity)) {
                  savedEmergency.severity = aiSeverity;
              }
            }

            await savedEmergency.save();

            // ⚡ Emit Update to Dashboard
            if (req.io) {
              req.io.emit('emergency-updated', savedEmergency);
              console.log("📡 AI Update Emitted to Dashboard");
            }
          }

        } catch (aiError) {
          console.error("❌ AI Analysis Failed:", aiError.message);
          if (aiError.response) {
             console.error("AI Server Response:", aiError.response.data);
          }
        }
      })();
    }

    // 6. Send Response to User (Client doesn't wait for AI)
    res.status(201).json({
      success: true,
      data: savedEmergency,
      message: "Emergency reported successfully. AI analysis started."
    });

  } catch (error) {
    console.error("Error creating emergency:", error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get all active emergencies
// @route   GET /api/v1/emergencies
export const getEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find().sort({ timestamp: -1 });
    res.json(emergencies);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Update emergency details (Severity, Department, Status, Assignment)
// @route   PUT /api/v1/emergencies/:id
export const updateEmergency = async (req, res) => {
  try {
    const { severity, department, status, assignedRescuerId, resolutionDetails } = req.body;
    
    // 1. Find the Emergency
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ error: 'Emergency not found' });

    // 2. Update Basic Fields
    if (severity) emergency.severity = severity;
    if (department) emergency.department = department; 
    
    // Check if status is actually changing to avoid re-running logic unnecessarily
    const statusChanged = status && emergency.status !== status;
    if (status) emergency.status = status;

    // 3. Update Resolution Details (if provided)
    if (resolutionDetails) {
      emergency.resolutionDetails = resolutionDetails;
    }

    // 🚨 SCENARIO A: DISPATCHING A UNIT (Assignment)
    if (status === 'Assigned' && assignedRescuerId) {
      const rescuer = await Rescuer.findById(assignedRescuerId);
      if (rescuer) {
        // Mark Rescuer as BUSY
        rescuer.availabilityStatus = 'Busy';
        rescuer.currentTask = emergency._id;
        await rescuer.save();
        
        console.log(`👨‍🚒 Unit ${rescuer.name} assigned to Emergency ${emergency._id}`);
      }
    }

    // =========================================================
    // ✅ SCENARIO B: MISSION COMPLETE (Resolution)
    // =========================================================
    if (status === 'Resolved' && statusChanged) {
      // Find the rescuer who was working on this specific task
      const rescuer = await Rescuer.findOne({ currentTask: emergency._id });
      
      if (rescuer) {
        // Free up the Rescuer
        rescuer.availabilityStatus = 'Available';
        rescuer.currentTask = null;
        
        // Add to their history (Optional: avoid duplicates)
        if (!rescuer.taskHistory.includes(emergency._id)) {
          rescuer.taskHistory.push(emergency._id);
        }
        
        await rescuer.save();
        console.log(`✅ Unit ${rescuer.name} is back to Available status.`);
      }
    }

    // 4. Save Updates
    await emergency.save();

    // 5. Notify Dashboard & Mobile Apps
    if (req.io) {
      req.io.emit('emergency-updated', emergency);
    }

    res.json({ success: true, data: emergency });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete emergency (Remove from DB completely)
// @route   DELETE /api/v1/emergencies/:id
export const deleteEmergency = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Delete from MongoDB
    const deletedEmergency = await Emergency.findByIdAndDelete(id);

    if (!deletedEmergency) {
      return res.status(404).json({ success: false, error: 'Emergency not found' });
    }

    // 2. Notify ALL Dashboards to remove this pin instantly
    if (req.io) {
      req.io.emit('emergency-deleted', id);
    }

    res.json({ success: true, message: 'Case Closed & Removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Resolve (Legacy function, better to use updateEmergency)
// @route   PUT /api/v1/emergencies/:id/resolve
export const resolveEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, error: 'Emergency not found' });

    emergency.status = 'Resolved';
    await emergency.save();

    if (req.io) {
        // We can just use the generic update event now
        req.io.emit('emergency-updated', emergency); 
    }

    res.json({ success: true, data: emergency });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};