import { Router } from "express";
import { 
    signUp, 
    signIn, 
    getMe, 
    resetPassword, 
    changePassword,
} from "../controllers/auth.js";
import { getUser } from "../middlewares/getUser.js";
import { checkRequestBody } from "../middlewares/checkRequestBody.js";
import { registerSchema, resetPasswordSchema } from "../validations/auth.js";

const routerAuth = Router();

// Public routes
routerAuth.post("/reset-password", checkRequestBody(resetPasswordSchema), resetPassword);
routerAuth.post("/sign-up", checkRequestBody(registerSchema), signUp);
routerAuth.post("/sign-in", signIn);

// Protected routes - cần authentication
routerAuth.use(getUser);
routerAuth.get("/", getMe);
routerAuth.post("/change-password", changePassword);

export default routerAuth;
