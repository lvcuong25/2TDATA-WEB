import authRouter from "./routes/auth.js";
import routerService from "./routes/routerService.js";

// Routes
app.use("/api/auth", authRouter);
app.use("/api/services", routerService); 