import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken'

// Database Models
import { SessionDocument } from "../../database/models/auth/session.models";
import { UserDocument } from "../../database/models/auth/user.models";
import { config } from '../../config/app.config';

export type AccessTPayload = {
    userId: UserDocument['_id'],
    sessionId: SessionDocument['_id'],
}

export type RefreshTPayload = {
    sessionId: SessionDocument['id'],
}

type SignOptsAndSecret = SignOptions & {
    secret: string,
}

const defaults: SignOptions = {
    audience: ['user'],
}

export const accessTokenSignOptions: SignOptsAndSecret = {
    expiresIn: config.JWT.EXPIRES_IN,
    secret: config.JWT.SECRET,
}

export const refreshTokenSignOptions: SignOptsAndSecret = {
    expiresIn: config.JWT.REFRESH_EXPIRES_IN,
    secret: config.JWT.REFRESH_SECRET,
}

export const signJwtToken = (
    payload: AccessTPayload | RefreshTPayload,
    optional?: SignOptsAndSecret
) => {
    const { secret, ...opts  } = optional || accessTokenSignOptions ;
    return jwt.sign(payload, secret, { ...defaults, ...opts })
}

export const verifyJwtToken = <TPayload extends object = AccessTPayload> (token: string, options?: VerifyOptions & { secret: string} ) => {

    try {
        
        const { secret = config.JWT.SECRET, ...opts } = options || {};
        const payload = jwt.verify(token, secret, { ...defaults, ...opts }) as TPayload;

        return { payload };
    } catch (err: any) {
        return { error: err.message };
    }

}