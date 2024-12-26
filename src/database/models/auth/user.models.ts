import mongoose, { Document, Schema } from "mongoose";
import { compareValue, hashValue } from "../../../common/utils/bcrypt";

interface UserPreferences {
  enable2FA: boolean;
  emailNotification: boolean;
  twoFactorSecret?: string;
}

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UserDocument extends Document {
    firestname: string;
    lastname: string;
    username: string;
    phone: string;
    email: string;
    avatar:{ public_id: string, url: string },
    role: string;
    password: string;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    userPreferences: UserPreferences;
    SignAccessToken: () => string;
    SignRefreshToken: () => string;
    comparePassword(passwords: string): Promise<boolean>;
}

const userPreferencesSchema = new Schema<UserPreferences>({
  enable2FA: { type: Boolean, default: false },
  emailNotification: { type: Boolean, default: true },
  twoFactorSecret: { type: String, required: false },
});

const userSchema = new Schema<UserDocument>(
  {
    firestname: { type: String, required: [true, "Please enter your firestname"] },
    lastname: { type: String, required: [true, "Please enter your lastname"]  },
    username: { type: String, unique: true , required: [true, "Please enter your username"] },
    phone: { type: String, unique: true, required: [true, "Please enter your phone"]  },
    email: { type: String, unique: true, required: [true, "Please enter your email"]  },
    password: { type: String, required: true, minlength: [6, "Password must be at least 6 characters"]},
    avatar:{ public_id: String , url: String },
    role:{ type: String, default: "user" },
    isEmailVerified: { type: Boolean, default: false },
    userPreferences: { type: userPreferencesSchema, default: {} },
  },
  { timestamps: true, toJSON: {} }
);

// Hash Password before saving
userSchema.pre<UserDocument>("save", async function (next) {
  if (!this.isModified("password")) {next()}
  this.password = await hashValue(this.password);
  next();
});

// compare password
userSchema.methods.comparePassword = async function (enteredPassword: string) {
  return compareValue(enteredPassword, this.password);  
};

userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.userPreferences.twoFactorSecret;
    return ret;
  },
});

const UserModel = mongoose.model<UserDocument>("User", userSchema);
export default UserModel;