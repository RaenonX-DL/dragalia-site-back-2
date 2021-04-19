import cors, {CorsOptions} from 'cors';
import {RequestHandler} from 'express';

export const corsMiddle = (): RequestHandler => {
  // Setup CORS
  const options: CorsOptions = {
    origin: ['https://dl.raenonx.cc', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  };
  return cors(options);
};
