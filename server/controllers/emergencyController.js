import Emergency from '../model/Emergency.js'; // Ensure correct path
import Rescuer from '../model/Rescuer.js';     // Ensure correct path
import axios from 'axios';

// @desc    Create new emergency report & Trigger AI Analysis
// @route   POST /api/v1/emergencies
// @access  Public
export const createEmergency = async (req, res) => {
  try {
    const { type, description, lat, lng } = req.body;
    
    // 1. EXTRACT CLOUDINARY URLS
    const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
    const imageUrl = imageFile ? imageFile.path : null;

    const audioFile = req.files && req.files['audio'] ? req.files['audio'][0] : null;
    const audioUrl = audioFile ? audioFile.path : null;

    // 2. CREATE INITIAL REPORT
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

    // ⚡ Emit "New Emergency" instantly
    if (req.io) {
      req.io.emit('new-emergency', savedEmergency);
      console.log(`📡 Socket Event Emitted: new-emergency (ID: ${savedEmergency._id})`);
    }

    // 3. BACKGROUND AI ANALYSIS (Fire & Forget)
    if (imageUrl) {
      (async () => {
        try {
          console.log("🤖 Sending to AI for analysis...");
          const AI_API_URL = "https://resilio-qwo6.onrender.com/ai/image-url"; 

          const aiResponse = await axios.post(AI_API_URL, {
            emergencyId: savedEmergency._id.toString(),
            imageUrl: imageUrl
          });

          const analysis = aiResponse.data.analysis; 
          console.log("✅ AI Analysis Complete:", analysis);

          if (analysis) {
            // Update the emergency with AI data
            savedEmergency.aiAnalysis = analysis;
            
            // Auto-update Severity if AI provides it
            if (analysis.severity) {
              const aiSeverity = analysis.severity.charAt(0).toUpperCase() + analysis.severity.slice(1).toLowerCase();
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

        } catch (aiError){
          console.error("❌ AI Analysis Failed:", aiError.message);
        }
      })();
    }

    // 4. Send Response immediately (Client doesn't wait for AI)
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

// @desc    Update emergency details (Dispatch & Resolve Logic)
// @route   PUT /api/v1/emergencies/:id
export const updateEmergency = async (req, res) => {
  try {
    const { severity, department, status, assignedRescuerId, resolutionDetails } = req.body;
    
    // 1. Find Emergency
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ error: 'Emergency not found' });

    // Track previous status to trigger logic only on change
    const prevStatus = emergency.status;

    // 2. Update Fields
    if (severity) emergency.severity = severity;
    if (department) emergency.department = department; 
    if (status) emergency.status = status;
    if (resolutionDetails) emergency.resolutionDetails = resolutionDetails;
    if (assignedRescuerId) emergency.assignedRescuerId = assignedRescuerId;
    // ===============================================
    // 🚨 SCENARIO A: ASSIGNING A RESCUER (Dispatch)
    // ===============================================
    if (status === 'Assigned' && assignedRescuerId) {
       // Find the specific rescuer
       const rescuer = await Rescuer.findById(assignedRescuerId);
       
       if (rescuer) {
         // Mark Rescuer as BUSY
         rescuer.availabilityStatus = 'Busy';
         rescuer.currentTask = emergency._id; // Link task to rescuer
         await rescuer.save();
         
         console.log(`👨‍🚒 Unit ${rescuer.name} assigned to Emergency ${emergency._id}`);
       }
    }

    // ===============================================
    // ✅ SCENARIO B: MARKING RESOLVED (Mission Complete)
    // ===============================================
    if (status === 'Resolved' && prevStatus !== 'Resolved') {
      // Find the rescuer who was working on this task
      const rescuer = await Rescuer.findOne({ currentTask: emergency._id });
      
      if (rescuer) {
        // Free up the Rescuer
        rescuer.availabilityStatus = 'Available';
        rescuer.currentTask = null;
        
        // Add to history if not already there
        if (!rescuer.taskHistory.includes(emergency._id)) {
          rescuer.taskHistory.push(emergency._id);
        }
        
        await rescuer.save();
        console.log(`✅ Unit ${rescuer.name} is back to Available status.`);
      }
    }

    // 3. Save Emergency Updates
    await emergency.save();

    // 4. Notify Dashboard & Mobile Apps
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