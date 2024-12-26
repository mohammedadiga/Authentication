import { registerDto, loginDto, resetPasswordDto } from "./interface/auth.interface";
import { refreshTokenSignOptions, RefreshTPayload, signJwtToken, verifyJwtToken } from "../../common/utils/jwt";
import { config } from "../../config/app.config";
import ejs from 'ejs';
import path from "path";

// Database Models
import UserModel from "../../database/models/auth/user.models";
import VerificationCodeModel from "../../database/models/auth/verification.model";
import sessionModel from "../../database/models/auth/session.models";

// Enums
import { ErrorCode } from "../../common/enums/error-code";
import { verificationEnum } from "../../common/enums/verification-code";

// Catch Errors Hooks
import { BadRequestException, HttpException, UnauthorizedException } from "../../common/utils/catch-errors";

// Time Utils
import { anHourFromNew, calculateExpirationDate, fortyFiveMinutesFromNow, oneDayInMs, thrreMinutesAgo } from "../../common/utils/data-time";

// Send Mail Utils
import sendMail from "../../common/utils/sendMail";
import { HttpStatus } from "../../config/http.config";
import { hashValue } from "../../common/utils/bcrypt";

export class AuthService {
    public async register (registerData: registerDto){

        const {firestname, lastname, username, phone, email, password } = registerData
        if (!email || !password) throw new BadRequestException("Please enter email and password") ;

        // البحث عن المستخدم الذي يمتلك أي من القيم
        const existingUser = await UserModel.findOne({
            $or: [ { email }, { username }, { phone } ],
        });

        if (existingUser) {
            if (existingUser.email === email) throw new BadRequestException('Email already exist', );
            if (existingUser.username === username) throw new BadRequestException('Username already exist');
            if (existingUser.phone === phone) throw new BadRequestException('Phone number already exist');
        }


        const user  ={ firestname, lastname, username, phone, email, password }

        const newUser = await UserModel.create(user);
        const userId = newUser._id;

        const verification = await VerificationCodeModel.create({
            userId,
            type: verificationEnum.EMAIL_VERIFICATION,
            expiredAt: fortyFiveMinutesFromNow(),
        });

        // Sengin verification email link
        const verificationUrl = `${config.APP_ORIGIN}${config.BASE_PATH}/auth/verify/email/${verification.code}`;
        const data = {url: verificationUrl}
        // const html = await ejs.renderFile(path.join(__dirname, "../../mailers/templates/activation-mail.ejs"), data);

        try {
            await sendMail({
                email: email,
                subject: "Account Activation",
                template: "activation-mail.ejs",
                data
            });
        } catch (error: any) {
            throw new Error(error)
        }

        return { user: newUser }
    }

    public async login (loginData: loginDto){

        const {userData, password, userAgent } = loginData

        const user = await UserModel.findOne({  $or: [ { email:userData }, { username:userData }, { phone:userData } ] });
        if(!user) throw new BadRequestException( "Invalid email or password", ErrorCode.AUTH_USER_NOT_FOUND );
        
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) throw new BadRequestException("Invalid email or password", ErrorCode.AUTH_USER_NOT_FOUND);
        
        //  Check if the user enable 2FA return user=  null
        if(user.userPreferences.enable2FA){
            return {
                user: null,
                accessToken: '',
                refreshToken: '',
                mfaRequired: true
            }
        }


        // sign access token & refresh token
        const session = await sessionModel.create({ userId: user._id, userAgent });

        const accessToken = signJwtToken({ userId: user._id, sessionId: session._id });
        const refreshToken = signJwtToken({ sessionId: session._id }, refreshTokenSignOptions );

        return {
            user,
            accessToken: accessToken,
            refreshToken: refreshToken,
            mfaRequired: false,
        }
    }

    public async refreshToken(refreshToken: string) { 

        const now = Date.now();
        
        const { payload } = verifyJwtToken<RefreshTPayload>(refreshToken, {
            secret: refreshTokenSignOptions.secret,
        });
        if (!payload) throw new UnauthorizedException("Invalid refresh token");

        const session = await sessionModel.findById(payload.sessionId);
        if (!session) throw new UnauthorizedException("session does not exist");

        if (session.expiredAt.getTime() <= now) throw new UnauthorizedException("session expired");

        const sessionRequireRefresh = session.expiredAt.getTime() - now <= oneDayInMs;
        if (sessionRequireRefresh) {
            session.expiredAt = calculateExpirationDate(
                config.JWT.REFRESH_EXPIRES_IN
            );
            await session.save();
        }

        const newRefreshToken = sessionRequireRefresh 
         ? signJwtToken(
            { sessionId: session._id },
            refreshTokenSignOptions)
        : undefined;

        const accessToken = signJwtToken({
            userId: session.userId,
            sessionId: session._id,
        })

        return { accessToken, newRefreshToken };
    }

    public async verifyEmail(code: string ){

        const validator = await VerificationCodeModel.findOne({
            code:code,
            type: verificationEnum.EMAIL_VERIFICATION,
            expiredAt: { $gt: new Date() },
        });

        if(!validator) throw new BadRequestException("Invalid or expired verification code");

        const updateUser = await UserModel.findByIdAndUpdate(
            validator.userId,
            { isEmailVerified: true },
            { new: true }
        );

        if(!updateUser) throw new BadRequestException("Unable to verify email address", ErrorCode.VALIDATION_ERROR);

        await validator.deleteOne();

    }

    public async forgotPassword( email: string){

        const user = await UserModel.findOne({email : email});
        if(!user) throw new BadRequestException("User not found");

        // Check mail rate limit is 2 email per 3 or 10
        const timAgo = thrreMinutesAgo();
        const maxAttempts = 2

        const count = await VerificationCodeModel.countDocuments({
            userId: user._id,
            type: verificationEnum.PASSWORD_RESET,
            createdAt: { $gt: timAgo },
        })

        if(count >= maxAttempts) throw new HttpException(
                "Too many password reset attempts in the last 3 minutes",
                HttpStatus.TOO_MANY_REQUESTS,
                ErrorCode.AUTH_TOO_MANY_ATTEMPTS
            );

        const expiresAt = anHourFromNew();
        const validCode = await VerificationCodeModel.create({
            userId: user._id,
            type: verificationEnum.PASSWORD_RESET,
            expiredAt: expiresAt,
        })

        const resetLink = `${config.APP_ORIGIN}${config.BASE_PATH}/auth/reset-password?code=${validCode.code}&exp=${expiresAt.getTime()}`;
        const data = {url: resetLink}

        try {
            await sendMail({
                email: email,
                subject: "Account Activation",
                template: "forgotPassword-mail.ejs",
                data
            });
        } catch (error: any) {
            throw new Error(error)
        }

        return {
            url: resetLink
        }


    }

    public async resetPassword({ password, verificationCode }: resetPasswordDto){

        const validCode = await VerificationCodeModel.findOne({
            code: verificationCode,
            type: verificationEnum.PASSWORD_RESET,
            expiredAt: { $gt:new Date() }
        });
        if(!validCode) throw new BadRequestException("Invalid or expired verification code");

        const hasedPassword = await hashValue(password);

        const updateUser = await UserModel.findByIdAndUpdate(validCode.userId, {
            password: hasedPassword,
        })

        if(!updateUser) throw new BadRequestException("Unable to reset password");

        await validCode.deleteOne();

        await sessionModel.deleteMany({ userId: updateUser._id});

        return {
            user: updateUser
        }

    }

    public async logout(sessionId: string){

        return await sessionModel.findByIdAndDelete(sessionId);

    }
}