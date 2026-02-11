import User from "../model/User.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const Login=async(req,res)=>{
    try {
        
        const {email,password}=req.body;
        if(!email || !password)
        {
            return res.status(400).json({message:"All Fields are Required",success:false});
        }
        const prevUser=await User.findOne({email:email});
        if(!prevUser){
            return res.status(404).json({message:"User Not Found",success:false});
        }
        const isMatch=await bcrypt.compare(password,prevUser.password);
        if(!isMatch)
        {
            return res.status(404).json({message:"Email or Password is Invalid",success:false});
        }
        const token=await jwt.sign({name:prevUser.name,email:email,role:prevUser.role},process.env.JWT_SECRET,{expiresIn:'1d'});
        return res.status(200).json({message:"User Login Successfully",success:true,token:token})
    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false,message:"Internal Server Error"});
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
