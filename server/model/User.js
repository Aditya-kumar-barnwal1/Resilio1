import mongoose from "mongoose";
const userSchema=new mongoose.Schema({
    name:{type:String,required:true},
    email:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
        minLength:8,
        required:true
    },
    role:{
        type:String,
        required:true,
        enum:["User","Officer","rescuer"],
        default:"User"
    }

},{timestamps:true})

const User=mongoose.model('User',userSchema);
export default User;