export interface registerDto {
    firestname: string;
    lastname: string;
    username: string;
    phone: string;
    email : string;
    password : string;
    confirmPassword : string;
}

export interface loginDto {
    userData : string;
    password : string;
    userAgent? : string;
}

export interface resetPasswordDto {
    password : string;
    verificationCode : string;
}