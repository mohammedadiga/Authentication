import { Request, Response } from "express";
import { MfaService } from "./mfa.service";
import { verifyMFAForLoginSchema, verifyMFASchema } from "./validators/mfa.validator";


import { AsyncHandler } from "../../middlewares/async.handler";
import { HttpStatus } from "../../config/http.config";

import { UnauthorizedException } from "../../common/utils/catch-errors";
import { setAuthentcationCookies } from "../../common/utils/cookie";

export class MfaController {

        private mfaService: MfaService;
    
        constructor(mfaService: MfaService) {
            this.mfaService = mfaService;
        }

        public generateMFASetup = AsyncHandler( async (req: Request, res: Response) => {

            const user = req.user;
            if(!user) throw new UnauthorizedException("User not authenticated");

            const {secret, qrImageUrl, message } = await this.mfaService.generateMFASetup(user);
            
            res.status(HttpStatus.OK).json({ message, secret, qrImageUrl });

        });

        public verifyMFASetup = AsyncHandler( async (req: Request, res: Response) => {

            const { code, secretKey } = verifyMFASchema.parse({...req.body });

            const user = req.user;
            if(!user) throw new UnauthorizedException("User not authenticated");

            const {userPreferences, message} = await this.mfaService.verifyMFASetup(user, code, secretKey);

            res.status(HttpStatus.OK).json({ message, userPreferences });

        });

        public verifyMFAMForLogin = AsyncHandler( async (req: Request, res: Response) => {

            const userAgent = req.headers["user-agent"]
            const  body  = verifyMFAForLoginSchema.parse({...req.body, userAgent });

            const {accessToken, refreshToken, user} = await this.mfaService.verifyMFAForLogin(body);

            setAuthentcationCookies({res, accessToken, refreshToken})
            .status(HttpStatus.OK).json({
                message: "Verified login successfully",
                data: user,
            });
            
        });

        public revokeMFASetup = AsyncHandler( async (req: Request, res: Response) => {

            const user = req.user;
            if(!user) throw new UnauthorizedException("User not authenticated");

            const { userPreferences, message } = await this.mfaService.revokeMFA(user);

            res.status(HttpStatus.OK).json({ message, userPreferences });

        });
}