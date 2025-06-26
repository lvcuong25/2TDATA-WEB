import express from "express";
import dotenv from 'dotenv';
import router from './router/index.js';
import cors from "cors";
import { connectDB } from "./config/db.js";

// import router from './router';


const app = express();
dotenv.config();
app.use(cors());

const { DB_URI, PORT } = process.env;
connectDB(process.env.DB_URI)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// app.use(express.json());
app.use("/api", router);

app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
  });
  
  app.use((err, req, res, next) => {
    return res.status(500).json({
      name: err.name,
      message: err.message,
    });
  });
  
  
app.listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
  });

