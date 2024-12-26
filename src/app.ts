import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import "dotenv/config";

/* Database */
import connectDB from './database/database';

/* Middlewares */
import { ErrorHandler } from './middlewares/error.handler';
import { AsyncHandler } from './middlewares/async.handler';
import { authenticateJWT } from './common/strategies/jwt.strategie';

/* Configs */
import { config } from './config/app.config';
import { HttpStatus } from './config/http.config';
import passport from './middlewares/passport';

/* Error handling */
import { NotFoundException } from './common/utils/catch-errors';

/* Routers */
import authRouter from './modules/auth/auth.routes';
import sessionRouter from './modules/session/session.routes';
import mfaRouter from './modules/mfa/mfa.routes';


const app = express();
const PORT = config.PORT;
const BASE_PATH = config.BASE_PATH

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: config.APP_ORIGIN,
    credentials: true,
}));

app.use(cookieParser());
app.use(passport.initialize())


/* Routes */

// auth routes
app.use(`${BASE_PATH}/auth`, authRouter);
app.use(`${BASE_PATH}/mfa` ,mfaRouter);
app.use(`${BASE_PATH}/session`, authenticateJWT ,sessionRouter);

// testing api
app.get('/test', AsyncHandler( async (req, res, next) => {
    res.status(HttpStatus.OK).json("Hello World");
}));


// all api
app.all(`*`, AsyncHandler( async (req) => {
    throw new NotFoundException(`Route ${req.originalUrl} not found`);
}));

// middleware
app.use(ErrorHandler);

// Started server
app.listen(PORT,  async () => {
    console.log(`Server is running on port ${PORT} in ${config.NODE_ENV}`);
    await connectDB();
}); 