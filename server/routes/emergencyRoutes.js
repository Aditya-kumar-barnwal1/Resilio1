import express from 'express';
import upload from '../middlewares/uploadMiddleware.js';
import { createEmergency, getEmergencies,resolveEmergency,updateEmergency ,deleteEmergency} from '../controllers/emergencyController.js';

const Emergencyrouter = express.Router();

// POST: Handles form-data with image 'image' field
Emergencyrouter.post('/', upload.fields([{name:'image',maxCount:1},{name:'audio',maxCount:1}
]), createEmergency);

// GET: Fetches list for dashboard
Emergencyrouter.get('/', getEmergencies);
Emergencyrouter.put('/:id/resolve', resolveEmergency);
Emergencyrouter.put('/:id', updateEmergency);
Emergencyrouter.delete('/:id', deleteEmergency);
export default Emergencyrouter;
