import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js"; 
import User from "./models/userModel.js"; 

dotenv.config();
connectDB();

const seedAdmin = async () => {
  try {
    await User.deleteMany({ email: "krv.ppp@gmail.com" });

    const adminUser = {
      name: "Admin",
      email: "krv.ppp@gmail.com", 
      password: "admin1234",    
      phone: "0909751803",         
      isAdmin: true,               
      isVerified: true, 
    };

    const createdAdmin = await User.create(adminUser);

    if (createdAdmin) {
      console.log("✅ Admin User Created Successfully!");
      console.log(`📧 Email: ${adminUser.email}`);
      console.log(`🔑 Password: admin1234`);
    }

    process.exit(); 
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();