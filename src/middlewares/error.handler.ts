import { z } from "zod";
import { ErrorRequestHandler, Response } from "express";
import { HttpStatus } from "../config/http.config";
import { AppError } from "../common/utils/appError";
import { clearAuthenticationCookies, REFRESH_PATH } from "../common/utils/cookie";

const formatZodError = (res: Response, error: z.ZodError) => {
  const errors = error?.issues?.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
  return res.status(HttpStatus.BAD_REQUEST).json({
    message: "Validation failed",
    errors: errors,
  });
};

export const ErrorHandler: ErrorRequestHandler = ( error, req, res, next ): any => {

  if(req.path === REFRESH_PATH) clearAuthenticationCookies(res);


  if (error instanceof SyntaxError) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: "Invalid JSON format, please check your request body",
    });
  }

  if (error instanceof z.ZodError) {
    return formatZodError(res, error);
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      errorCode: error.errorCode,
    });
  }

  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    message: "Internal Server Error",
    error: error?.message || "Unknown error occurred",
  });
};