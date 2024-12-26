import { NextFunction, Request, Response } from "express";
import { AuthService } from "./auth.service";

import { AsyncHandler } from "../../middlewares/async.handler";
import { loginSchema, registerSchema, resetPasswordSchema, verifictionSchema, emailSchema } from "./validators/auth.validator";
import { HttpStatus } from "../../config/http.config";

import { clearAuthenticationCookies, getAccessTokenCookieOptions, getRefreshTokenCookieOptions, setAuthentcationCookies } from "../../common/utils/cookie";
import { UnauthorizedException } from "../../common/utils/catch-errors";


export class AuthController {
    private authService: AuthService;

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    public register = AsyncHandler( async (req: Request , res: Response): Promise<any> => {

        const body = registerSchema.parse({ ...req.body });

        const user = await this.authService.register(body);

        return res.status(HttpStatus.CREATED).json({
            message: "User registered successfully",
            data: user,
        });
    });

    public login = AsyncHandler( async (req: Request , res: Response): Promise<any> => {

        const userAgent = req.headers["user-agent"];

        const body = loginSchema.parse({ ...req.body, userAgent });

        const { user, accessToken, refreshToken, mfaRequired } = await this.authService.login(body);

        if (mfaRequired) {
            return res.status(HttpStatus.OK).json({
              message: "Verify MFA authentication",
              mfaRequired,
              user
            });
        }

        return setAuthentcationCookies({res, accessToken, refreshToken})
        .status(HttpStatus.OK).json({
            message: "User login successfully",
            mfaRequired,
            data: user,
        });

    });
    
    public refreshToken = AsyncHandler(async (req: Request , res:Response): Promise<any> => {

        const refreshToken = req.cookies.refreshToken as string | undefined;
        if(!refreshToken) throw new UnauthorizedException("Missing refresh token");

        const { accessToken, newRefreshToken } = await this.authService.refreshToken(refreshToken);
        if (newRefreshToken) {
            res.cookie(
                "refreshToken",
                newRefreshToken,
                getRefreshTokenCookieOptions()
            );
        }

        return res
        .status(HttpStatus.OK)
        .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
        .json({ message: "Refresh access token successfully" });

    });

    public verifyEmail = AsyncHandler(async (req: Request , res:Response): Promise<any> => {

        const { code } = verifictionSchema.parse({...req.body });

        await this.authService.verifyEmail(code);

        return res.status(HttpStatus.OK).json({
            message: "Email verified successfully",
        });
    });

    public forgotPassword = AsyncHandler(async (req: Request, res: Response): Promise<any> => {

        const  email = emailSchema.parse(req.body.email);

        await this.authService.forgotPassword(email);

        return res.status(HttpStatus.OK).json({
            message: "password reset email sent",
        });

    });

    public resetPassword = AsyncHandler(async (req: Request, res: Response): Promise<any> => {

        const body = resetPasswordSchema.parse({ ...req.body });

        await this.authService.resetPassword(body);

        return clearAuthenticationCookies(res)
        .status(HttpStatus.OK)
        .json({
            message: "Reset password successfully",
        });

    });

    public logout = AsyncHandler(async (req: Request, res: Response): Promise<any> => {

        const sessionId = req.sessionId;
        if(!sessionId) throw new UnauthorizedException("Session is invalid.");

        await this.authService.logout(sessionId);

        return clearAuthenticationCookies(res)
        .status(HttpStatus.OK).json({
            message: "User logout successfully",
        });
    });
}