import {MongoClient, ObjectId} from 'mongodb';

import {UserDocument} from '../../src/api-def/models';
import {User} from '../../src/endpoints/userControl/model';


type MockUserOptions = {
  id?: ObjectId,
  isAdmin?: boolean,
  isAdsFree?: boolean,
};

export const insertMockUser = async (mongoClient: MongoClient, options?: MockUserOptions): Promise<ObjectId> => {
  const user: UserDocument = {
    name: 'Fake User',
    email: 'fake@email.com',
    image: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/364140589/android/sticker.png',
    createdAt: new Date(),
    updatedAt: new Date(),
    isAdmin: options?.isAdmin || false,
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
