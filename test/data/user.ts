import {MongoClient, ObjectId} from 'mongodb';

import {SupportedLanguages} from '../../src/api-def/api';
import {UserDocument} from '../../src/api-def/models';
import {User} from '../../src/endpoints/userControl/model';


type MockUserOptions = {
  id?: ObjectId,
  isAdmin?: boolean,
  isAdsFree?: boolean,
  numId?: number,
  lang?: SupportedLanguages,
};

export const insertMockUser = async (mongoClient: MongoClient, options?: MockUserOptions): Promise<ObjectId> => {
  const user: UserDocument = {
    name: 'Fake User',
    email: `${options?.numId || 'fake'}@email.com`,
    image: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/364140589/android/sticker.png',
    isAdmin: options?.isAdmin || false,
    lang: options?.lang,
  };

  if (options?.id) {
    user._id = options.id;
  }

  if (options?.isAdsFree) {
    user.adsFreeExpiry = new Date(new Date().getTime() + 20000);
  }

  const insertResult = await User.getCollection(mongoClient).insertOne(user);
  return insertResult.insertedId;
};
