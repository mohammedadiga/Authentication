import { Request, Response } from "express";
import { SessionService } from "./session.service";
import { deleteSessionSchema } from "./validators/session.validator";

import { AsyncHandler } from "../../middlewares/async.handler";
import { HttpStatus } from "../../config/http.config";

import { InternalServerException, NotFoundException } from "../../common/utils/catch-errors";


export class SessiomController {
    private sessionService: SessionService;

    constructor(sessionService: SessionService) {
        this.sessionService = sessionService;
    }

    public getAllSession = AsyncHandler( async (req: Request , res: Response) : Promise<any>  => {
        const userId = req.user?.id;
        const sessionId = req.sessionId;

        const { sessions } = await this.sessionService.getAllSession(userId);

        const modifySessions = sessions.map((session) => ({
          ...session.toObject(),
          ...(session.id === sessionId && { isCurrent: true }),
        }));

        return res.status(HttpStatus.OK).json({
            message: "Retrieving all sessions successfully",
            sessions: modifySessions,
        });
    }); 

    public getSession = AsyncHandler( async (req: Request, res: Response) : Promise<any>  => {

      const sessionId = req?.sessionId;
      if(!sessionId) throw new NotFoundException("Session ID not found. Please log in.");

      const { user } = await this.sessionService.getSessionById(sessionId);

      return res.status(HttpStatus.OK).json({
        message: "Session retrieved successfully",
        user,
      });
    });

    public deleteSession = AsyncHandler( async (req: Request, res: Response) : Promise<any>  => {

      const sessionId = deleteSessionSchema.parse(req.params.id);
      const userId = req?.user?.id;

      if(req.sessionId === sessionId) throw new InternalServerException('Session cannot be deleted. Please logout.')

      await this.sessionService.deleteSession(sessionId, userId);


      return res.status(HttpStatus.OK).json({
        message: "Session remove successfully"
      });

    });

}