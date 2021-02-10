import {NextFunction, Request, Response} from 'express';
import {ApiEndPoints} from '../api-def/api';
import {ResponseBase} from '../base/response';
import {handleRoot} from './root/handler';
import {handleUserLogin} from './userControl/login/handler';
import {handleEmitError} from './test/handler';

type responseFunction = (req: Request, res: Response) => Promise<ResponseBase>;

export const handlerLookupGet: {[endpoint: string]: responseFunction} = {
  [ApiEndPoints.ROOT]: handleRoot,
  [ApiEndPoints.USER_LOGIN]: handleUserLogin,
  [ApiEndPoints.ERROR_TEST]: handleEmitError,
};

export const handlerLookupPost: {[endpoint: string]: responseFunction} = {
  [ApiEndPoints.USER_LOGIN]: handleUserLogin,
};

export const handleResponse = async (
  req: Request, res: Response, responseFunction: responseFunction, nextFunction?: NextFunction,
): Promise<void> => {
  console.log(`${req.method.toUpperCase()} ${req.path}`);

  try {
    const response = await responseFunction(req, res);
    res.status(response.httpCode).json(response.toJson());
  } catch (err) {
    if (nextFunction) {
      nextFunction(err);
    }
    console.error(`${req.method.toUpperCase()} ${req.path} - ERROR: ${err.message}`);
  }
};
