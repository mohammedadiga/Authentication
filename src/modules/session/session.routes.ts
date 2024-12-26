import { Router } from "express";
import { sessionController } from "./session.module";

const sessionRouter = Router();

sessionRouter.get("/all", sessionController.getAllSession);
sessionRouter.get("/", sessionController.getSession);

sessionRouter.delete("/:id", sessionController.deleteSession);

export default sessionRouter;