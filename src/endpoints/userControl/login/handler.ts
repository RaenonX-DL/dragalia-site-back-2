import {Request} from 'express';
import {UserLoginPayload} from '../../../api-def/api';
import {UserLoginResponse} from './response';
import {UserCollection} from '../model';

export const handleUserLogin = async (req: Request): Promise<UserLoginResponse> => {
  const payload = req.query as unknown as UserLoginPayload;

  const updateResult = await UserCollection.findOneAndUpdate(
    {
      uid: payload.googleUid,
      em: payload.googleEmail,
    },
    {
      $set: {
        lr: new Date(),
      },
      $inc: {
        lc: 1,
      },
    },
    {
      upsert: true,
      setDefaultsOnInsert: true,
      useFindAndModify: false,
    });

  if (updateResult) {
    return new UserLoginResponse(false);
  }

  return new UserLoginResponse(true);
};
