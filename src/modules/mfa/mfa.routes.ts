import { Router } from "express";
import { mfaController } from "./mfa.module";
import { authenticateJWT } from "../../common/strategies/jwt.strategie";

const mfaRouter = Router();

mfaRouter.get("/setup", authenticateJWT, mfaController.generateMFASetup);

mfaRouter.post("/verify", authenticateJWT, mfaController.verifyMFASetup);
mfaRouter.post("/verify-login", mfaController.verifyMFAMForLogin);

mfaRouter.put("/revoke", authenticateJWT, mfaController.revokeMFASetup);

export default mfaRouter;