import { Router } from "express";
import { authController } from "./auth.module";
import { authenticateJWT } from "../../common/strategies/jwt.strategie";

const authRouter = Router();

authRouter.get("/refresh", authController.refreshToken);

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/verify/email", authController.verifyEmail);
authRouter.post("/password/forgot", authController.forgotPassword);

authRouter.put("/password/reset", authController.resetPassword);

authRouter.delete("/logout", authenticateJWT, authController.logout);


export default authRouter;