import cors, {CorsOptions} from 'cors';
import {RequestHandler} from 'express';

export const corsMiddle = (): RequestHandler => {
  let allowedOriginsEnv = process.env.CORS_ALLOWED_ORIGINS;

  if (!allowedOriginsEnv) {
    if (!process.env.CI) {
      console.error('Specify allowed CORS origins as `CORS_ALLOWED_ORIGINS` in env vars.');
      process.exit(1);
    } else {
      allowedOriginsEnv = '';
    }
  }

  const allowedOrigins = allowedOriginsEnv.split(',');

  console.log('Allowed Origins: ', allowedOrigins);

  // Setup CORS
  const options: CorsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  };
  return cors(options);
};
