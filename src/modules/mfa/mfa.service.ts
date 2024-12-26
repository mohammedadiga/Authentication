import speakeasy from "speakeasy";
import qrCode from "qrcode";

import { loginDto } from "./interface/auth.interface";
import { refreshTokenSignOptions, signJwtToken } from "../../common/utils/jwt";
import { BadRequestException, NotFoundException, UnauthorizedException } from "../../common/utils/catch-errors";

import UserModel, { UserDocument } from "../../database/models/auth/user.models";
import SessionModel from "../../database/models/auth/session.models";

export class MfaService {

    public async generateMFASetup( user: UserDocument ) {

        if (user.userPreferences.enable2FA) return { message : "MFA already enabled" }

        let secretKey = user.userPreferences.twoFactorSecret;
        if(!secretKey) {

            const secret = speakeasy.generateSecret({ name: "Roodx" });
            secretKey = secret.base32;
            user.userPreferences.twoFactorSecret = secretKey;
            await user.save();

        }

        const url = speakeasy.otpauthURL({ 
            secret: secretKey,
            label: user.email,
            issuer: "Roodx",
            encoding: "base32"
        });

        const qrImageUrl = await qrCode.toDataURL(url);

        return {
            message: "Scan the QR code or use the setup key.",
            secret: secretKey,
            qrImageUrl
        };
    }

    public async verifyMFASetup( user: UserDocument, code: string, secretKey: string) {

        if (user.userPreferences.enable2FA){
            return { message : "MFA already enabled" }
        }

        const isValid = speakeasy.totp.verify({ secret: secretKey, encoding: "base32", token: code });
        if(!isValid) throw new BadRequestException("Invalid MFA code. Please try again.");

        user.userPreferences.enable2FA = true;
        await user.save();

        return {
            message: "MFA setup completed successfully",
            userPreferences: { enable2FA: user.userPreferences.enable2FA }
        };

    };

    public async verifyMFAForLogin(body: loginDto) {

        const { userAgent , email, code } = body;

        const user = await UserModel.findOne({ email });
        if(!user) throw new NotFoundException('User not foud')

        if(
            !user.userPreferences.enable2FA &&
            !user.userPreferences.twoFactorSecret
        ){
            throw new UnauthorizedException("MFA not enabled for this user")
        }

        const isValid = speakeasy.totp.verify({
            secret: user.userPreferences.twoFactorSecret!,
            encoding: "base32",
            token: code,
        })

        if(!isValid) throw new BadRequestException("Invalid MFA code. Please try again.");

        // sign access token & refresh token
        const session = await SessionModel.create({ userId: user._id, userAgent });

        const accessToken = signJwtToken({ userId: user._id, sessionId: session._id });
        const refreshToken = signJwtToken({ sessionId: session._id }, refreshTokenSignOptions );

        return {
            user,
            accessToken,
            refreshToken
        }

    }

    public async revokeMFA( user: UserDocument ) {

        if (!user.userPreferences.enable2FA){
            return {
                    message : "MFA not enabled",
                    userPreferences: { enable2FA: user.userPreferences.enable2FA }
                }
        }

        user.userPreferences.twoFactorSecret = undefined;
        user.userPreferences.enable2FA = false;
        await user.save();

        return {
            message: "MFA revoke successfully",
            userPreferences: { enable2FA: user.userPreferences.enable2FA }
        };
    };

}