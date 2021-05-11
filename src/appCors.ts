import cors, {CorsOptions} from 'cors';
import {RequestHandler} from 'express';

export const corsMiddle = (): RequestHandler => {
  const allowedOriginsEnv = process.env.CORS_ALLOWED_ORIGINS;

  if (!allowedOriginsEnv) {
    console.error('Specify allowed CORS origins as `allowedOrigins` in env vars.');
    process.exit(1);
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
