import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';
import {UserLoginPayload} from '../../../api-def/api';
import {GoogleUserController} from '../controller';
import {UserLoginResponse} from './response';

export const handleUserLogin = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<UserLoginResponse> => {
  const payload = req.query as unknown as UserLoginPayload;

  return new UserLoginResponse(
    await GoogleUserController.userLogin(mongoClient, payload.googleUid, payload.googleEmail),
  );
};
