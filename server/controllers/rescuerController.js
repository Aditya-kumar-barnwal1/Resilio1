import Rescuer from '../model/Rescuer.js';

// @desc    Register a new Rescue Unit
// @route   POST /api/v1/rescuers
export const createRescuer = async (req, res) => {
  try {
    const { name, department, vehicleId, phone, email, password } = req.body;
    
    const newRescuer = new Rescuer({
      name,
      department,
      vehicleId,
      phone,
      email,
      password, // In a real app, hash this!
      availabilityStatus: 'Available'
    });

    await newRescuer.save();
    res.status(201).json({ success: true, data: newRescuer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all rescuers
// @route   GET /api/v1/rescuers
export const getAllRescuers = async (req, res) => {
  try {
    const rescuers = await Rescuer.find().sort({ availabilityStatus: 1 });
    res.json(rescuers);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};