import { SessiomController } from "./session.controller";
import { SessionService } from "./session.service";

const sessionService = new SessionService();
const sessionController = new SessiomController(sessionService);

export { sessionController, sessionService };