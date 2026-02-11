import User from "../model/User.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
    // Authority/Admin Model
import Rescuer from "../model/Rescuer.js";  // Rescue Unit Model

export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validation
        if (!email || !password){
            return res.status(400).json({ message: "All Fields are Required", success: false });
        }

        let user = null;
        let role = null;
        let isRescuer = false;

        // 2. CHECK AUTHORITY (USER) TABLE FIRST
        user = await User.findOne({ email: email });
        
        if (user) {
            // Found in Authority table
            role = user.role || 'Officer'; // Fallback to 'admin' if role field is missing
        } else {
            // 3. IF NOT AUTHORITY, CHECK RESCUER TABLE
            user = await Rescuer.findOne({ email: email });
            if (user) {
                // Found in Rescuer table
                // If you saved 'role' in createRescuer, use it. Otherwise default to 'rescuer'
                role = user.role || 'rescuer'; 
                isRescuer = true;
            }
        }

        // 4. USER NOT FOUND IN EITHER COLLECTION
        if (!user) {
            return res.status(404).json({ message: "User Not Found", success: false });
        }

        // 5. CHECK PASSWORD
        // Both models use bcrypt, so this works for both
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid Email or Password", success: false });
        }

        // 6. GENERATE TOKEN (Crucial Step)
        // We embed the 'role' inside the token so the frontend knows where to redirect
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email, 
                role: role,
                name: user.name 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        // 7. SEND SUCCESS RESPONSE
        return res.status(200).json({
            message: `Welcome back, ${user.name}!`,
            success: true,
            token: token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: role,
                // If it's a rescuer, send extra info like department
                ...(isRescuer && { department: user.department, vehicleId: user.vehicleId })
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
export const Register=async(req,res)=>{
    try {
        const {name,email,password,role}=req.body;
        if(!name|| !email || !password || !role)
        {
            return res.status(400).json({message:"All Fields are Required",success:false});
        }
        const prevUser=await User.findOne({email:email});
        if(prevUser){
            console.log(prevUser);
            return res.status(400).json({message:"User already exist",success:false});
        }
        const hashed=await bcrypt.hash(password,10);
        const NewUser=await User.create({name,email,password:hashed,role});
        return res.status(201).json({message:"User Created Successfully",success:true,data:NewUser});
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error")
    }
}
