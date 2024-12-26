import { z } from 'zod';

const usernameSchema = z.string().trim().regex(/^[A-Za-z][A-Za-z0-9]*$/).min(3).max(255)
export const emailSchema = z.string().trim().email().min(1).max(255);
const phoneSchema = z.string().regex(/^\+?[1-9]\d{0,14}$/).min(10).max(15);  // 10 to 15 digits with optional leading + or 00 country code  // ^\+?[1-9]\d{0,14}$
const passwordSchema = z.string().trim().min(6).max(255);
const verificationCodeSchema = z.string().trim().min(1).max(25);

export const registerSchema = z.object({
    firestname: z.string().trim().regex(/^[A-Za-z\s]+$/).min(1).max(255),
    lastname: z.string().trim().regex(/^[A-Za-z\s]+$/).min(1).max(255),
    username: usernameSchema,
    email: emailSchema,
    avatar: z.string().trim().optional(),
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
})
.refine((val) => val.password === val.confirmPassword, { 
    message: 'Passwords does not match',
    path: ['confirmPassword'],
});

export const loginSchema = z.object({
    userData: z.string().trim().min(1).max(255),
    password: passwordSchema,
    userAgent: z.string().optional(),
});

export const verifictionSchema = z.object({
    code : verificationCodeSchema,
});

export const resetPasswordSchema = z.object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
    verificationCode: verificationCodeSchema,
})
.refine((val) => val.password === val.confirmPassword, { 
    message: 'Passwords does not match',
    path: ['confirmPassword'],
});