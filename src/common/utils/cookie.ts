import { CookieOptions, Response } from "express";
import { config } from "../../config/app.config";
import { calculateExpirationDate } from "./data-time";

type CookiePayloadType = {
    res: Response,
    accessToken: string,
    refreshToken: string,
}

export const REFRESH_PATH = `${config.BASE_PATH}/auth/refresh`;

const defaults: CookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === "production" ? true : false,
    sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
}

export const getAccessTokenCookieOptions = (): CookieOptions => {
    const expiresIn = config.JWT.EXPIRES_IN;
    const expired = calculateExpirationDate(expiresIn);
    return { ...defaults, expires: expired, path: "/"};
}

export const getRefreshTokenCookieOptions = (): CookieOptions => {
    const expiresIn = config.JWT.REFRESH_EXPIRES_IN;
    const expired = calculateExpirationDate(expiresIn);
    return { ...defaults, expires: expired, path: config.BASE_PATH };
}

export const setAuthentcationCookies = ({ res, accessToken, refreshToken }: CookiePayloadType): Response => 
    res
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

export const clearAuthenticationCookies = (res: Response): Response =>
    res.clearCookie("accessToken").clearCookie("refreshToken", {
        path: REFRESH_PATH,
    });