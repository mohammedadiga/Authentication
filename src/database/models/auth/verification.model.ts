import mongoose, { Document, Schema } from "mongoose";
import { verificationEnum } from "../../../common/enums/verification-code";
import { generateUniqueCode } from "../../../common/utils/uuid";


export interface verificationDocument extends Document {
    userId: mongoose.Types.ObjectId;
    code: string;
    type: verificationEnum;
    expiredAt: Date;
    createdAt: Date;
}

const verificationCodeSchema = new Schema<verificationDocument>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    code: { type: String, unique: true, required: true, default: generateUniqueCode },
    type: { type: String, required: true },
    expiredAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
})

const VerificationCodeModel = mongoose.model<verificationDocument>(
    'VerificationCode',
    verificationCodeSchema,
    "verification_codes"
);

export default VerificationCodeModel;