import { Router } from "express";
import { 
    signUp, 
    signIn, 
    getUserByToken, 
    sendOTP, 
    resetPassword, 
    changePassword,
} from "../controllers/auth.js";
import { getUser } from "../middlewares/getUser.js";
import { checkRequestBody } from "../middlewares/checkRequestBody.js";
import { registerSchema, resetPasswordSchema } from "../validations/auth.js";

const routerAuth = Router();



routerAuth.post("/send-otp", sendOTP);
routerAuth.post("/reset-password", checkRequestBody(resetPasswordSchema), resetPassword);
routerAuth.post("/sign-up", checkRequestBody(registerSchema), signUp);
routerAuth.post("/sign-in", signIn);
routerAuth.use(getUser)
routerAuth.get("/", getUserByToken);
routerAuth.post("/change-password", changePassword);

export default routerAuth;