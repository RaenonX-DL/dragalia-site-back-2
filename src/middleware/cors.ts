import {FastifyCorsOptions} from 'fastify-cors';


let allowedOriginsEnv: string | undefined = process.env.CORS_ALLOWED_ORIGINS;

if (!allowedOriginsEnv) {
  if (!process.env.CI) {
    throw new Error('Specify allowed CORS origins as `CORS_ALLOWED_ORIGINS` in env vars.');
  } else {
    allowedOriginsEnv = '';
  }
}

const allowedOrigins = allowedOriginsEnv.split(',');

console.info('Allowed Origins: ', allowedOrigins);

// Setup CORS
export const corsOptions: FastifyCorsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
};
