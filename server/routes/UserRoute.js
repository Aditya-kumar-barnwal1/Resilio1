import express from 'express';
import { Login, Register } from '../controllers/auth.js';
const UserRouter=express.Router();

UserRouter.post('/register',Register);
UserRouter.post('/login',Login);


export default UserRouter;