import {Request, Response} from 'express';

import {NotExistsResponse} from './response';

export const handleMethodNotAllowed = (allowedMethods: Array<string>) =>
  async (_: Request, res: Response): Promise<NotExistsResponse> => {
    res.set('Allow', allowedMethods.join(', ').toUpperCase());

    return new NotExistsResponse();
  };
