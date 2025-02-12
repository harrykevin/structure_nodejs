import mongoose from "mongoose";
import dbConfig from "../../config/database.js";

export const connectDB = async () => {
    try {
        mongoose.set({
            strictQuery: true,
        });
        mongoose.connect(dbConfig.db);
        console.log("MongoDB Connected...");


    } catch (err) {
        console.error(err.message);
        // eslint-disable-next-line no-undef
        process.exit(1);
    }
};
