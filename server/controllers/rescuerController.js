import Rescuer from '../model/Rescuer.js'; // Note: Ensure filename matches casing
import bcrypt from 'bcryptjs';

// @desc    Register a new Rescue Unit
// @route   POST /api/v1/rescuers
export const createRescuer = async (req, res) => {
  try {
    const { name, department, vehicleId, phone, email, password, role } = req.body;

    // 1. Validation
    if (!name || !department || !vehicleId || !phone || !email || !password || !role) {
      return res.status(400).json({ success: false, error: "Please provide all fields" });
    }

    // 2. Check for Duplicates
    const existingRescuer = await Rescuer.findOne({ email });
    if (existingRescuer) {
      return res.status(400).json({ success: false, error: "Rescuer with this email already exists" });
    }

    // 3. Hash Password (CRITICAL for Login to work!)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 4. Create Rescuer
    const newRescuer = new Rescuer({
      name,
      department,
      vehicleId,
      phone,
      email,
      password: hashedPassword, // Save the HASH, not the plain text
      availabilityStatus: 'Available',
      role
 
    });

    await newRescuer.save();

    // 5. Success Response (Don't send back the password)
    res.status(201).json({ 
      success: true, 
      data: {
        _id: newRescuer._id,
        name: newRescuer.name,
        department: newRescuer.department,
        vehicleId: newRescuer.vehicleId,
        email: newRescuer.email
      }
    });

  } catch (error) {
    console.error("Create Rescuer Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all rescuers
// @route   GET /api/v1/rescuers
export const getAllRescuers = async (req, res) => {
  try {
    // Return all rescuers sorted by availability (Available first)
    // We exclude the password field for security
    const rescuers = await Rescuer.find().select('-password').sort({ availabilityStatus: 1 });
    res.json(rescuers);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};