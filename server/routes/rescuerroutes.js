import express from 'express';
import { createRescuer, getAllRescuers } from '../controllers/rescuerController.js';

const RescuerRouter = express.Router();

// POST: Register a new Rescuer (Unit)
RescuerRouter.post('/', createRescuer);

// GET: Get list of all rescuers (for Admin Dropdown)
RescuerRouter.get('/', getAllRescuers);

export default RescuerRouter;