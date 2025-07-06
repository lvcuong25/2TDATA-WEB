import mongoose from "mongoose"

export const connectDB = async (uri) => {
     try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB connected successfully');
        
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });
        
     } catch (e) {
        console.error('❌ Failed to connect to MongoDB:', e);
        process.exit(1);
     }
}
}