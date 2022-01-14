import env from 'env-var';
import {FastifyCorsOptions} from 'fastify-cors';

import {isCi} from '../api-def/utils';


const allowedOrigins = env.get('CORS_ALLOWED_ORIGINS')
  .required(!isCi())
  .asArray();

console.info('Allowed Origins: ', allowedOrigins);

// Setup CORS
export const corsOptions: FastifyCorsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
};
