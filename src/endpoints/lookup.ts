import {Request, Response} from 'express';
import {ApiEndPoints} from '../api-def/api';
import {ResponseBase} from '../base/response';
import {handleRoot} from './root/handler';
import {handleEmitError} from './test/handler';

type responseFunction = (req: Request, res: Response) => ResponseBase;

export const handlerLookup: {[endpoint: string]: responseFunction} = {
  [ApiEndPoints.ROOT]: handleRoot,
  [ApiEndPoints.ERROR_TEST]: handleEmitError,
};

export const handleResponse = (req: Request, res: Response, responseFunction: responseFunction): void => {
  const resObj = responseFunction(req, res);

  res.status(resObj.httpCode).json(resObj.toJson());
};
