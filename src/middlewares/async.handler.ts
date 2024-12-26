import { Request, Response, NextFunction } from "express";

type AsynControllerType = (
    req: Request,
    res: Response,
    next: NextFunction,
) => Promise<void>;

export const AsyncHandler = (controller: AsynControllerType): AsynControllerType => async (req, res, next) => {
    Promise.resolve(controller(req, res, next)).catch(next);
}