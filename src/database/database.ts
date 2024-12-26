import mongoose from "mongoose";
import { config } from "../config/app.config";

const connectDB = async () => {

    try{
        await mongoose.connect(config.MONGO_DB);
        console.log("Connected to MongoDB database");
    } catch (error) {
        console.error("Error connecting to MongoDB database", error);
        process.exit(1);
    }

};

export default connectDB;