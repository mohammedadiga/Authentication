import {ExtractJwt, StrategyOptionsWithRequest, Strategy as JwtStrategy} from "passport-jwt";
import passport,{ PassportStatic } from "passport";
import { ErrorCode } from "../enums/error-code";
import { UnauthorizedException } from "../utils/catch-errors";
import { config } from "../../config/app.config";
import { userService } from "../../modules/user/user.module";

interface JwtPayload {
    userId: string;
    sessionId: string;
}

const options: StrategyOptionsWithRequest = {
    jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
            const accessToken = req.cookies.accessToken;
            if (!accessToken) {
                throw new UnauthorizedException(
                "Unauthorized access token",
                ErrorCode.AUTH_TOKEN_NOT_FOUND
                );
            }
            return accessToken;
        },
    ]),
    secretOrKey: config.JWT.SECRET,
    audience: ["user"],
    algorithms: ["HS256"],
    passReqToCallback: true,
};

export const setupJwtStrategy = (passport: PassportStatic) => {
    passport.use( new JwtStrategy(options, async (req, payload: JwtPayload, done) => {
        try {
          const user = await userService.findUserById(payload.userId);
          if (!user) return done(null, false);
          req.sessionId = payload.sessionId;
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      })
    );
}


export const authenticateJWT = passport.authenticate("jwt", { session: false });