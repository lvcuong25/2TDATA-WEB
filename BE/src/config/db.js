import mongoose from "mongoose"

export const connectDB = async (uri) =>{
     try {
        await mongoose.connect(uri)

     } catch (e) {
        }
}