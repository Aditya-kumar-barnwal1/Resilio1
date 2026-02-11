import mongoose from "mongoose";

const connectDB=async()=>{
    const url=process.env.MONGO_URI;
    await mongoose.connect(url);
    console.log("MongoDB is Connected");
}

export default connectDB;