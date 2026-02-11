import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Rescuer from './model/Rescuer.js';

dotenv.config();

// Dummy Data
const rescuers = [
  {
    name: "Unit Alpha-1",
    department: "Medical (Ambulance)",
    vehicleId: "AMB-01",
    phone: "9876543210",
    email: "alpha1@resilio.com",
    password: "123",
    availabilityStatus: "Available"
  },
  {
    name: "Unit Bravo-4",
    department: "Fire Dept",
    vehicleId: "FIRE-04",
    phone: "9876543211",
    email: "bravo4@resilio.com",
    password: "123",
    availabilityStatus: "Available"
  },
  {
    name: "Unit Charlie-7",
    department: "Police Force",
    vehicleId: "POL-07",
    phone: "9876543212",
    email: "charlie7@resilio.com",
    password: "123",
    availabilityStatus: "Busy"
  }
];

// Connect & Seed
const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔥 Connected to DB...");

    await Rescuer.deleteMany(); // Clears old data
    console.log("🧹 Old data cleared...");

    await Rescuer.insertMany(rescuers);
    console.log("✅ Rescuers Added!");

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();