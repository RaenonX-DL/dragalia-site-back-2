import {MongoClient, ObjectId} from 'mongodb';

import {DocumentBaseKey, UserDocument} from '../../api-def/models';
import {UserNotExistsError} from './error';
import {User} from './model';


/**
 * User data controller.
 */
export class UserController {
  /**
   * Get the user data.
   *
   * This does not log that the user has logged in. To log such, call {@linkcode userLogin}() instead.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string | null} uid user ID
   * @return {Promise<User | null>} user object if found, null otherwise
   */
  static async getUserData(mongoClient: MongoClient, uid: string | ObjectId): Promise<User | null> {
    if (!uid) {
      return null;
    }

    const data = await User.getCollection(mongoClient).findOne({
      // Ensure `uid` is converted to `ObjectId`
      [DocumentBaseKey.id]: new ObjectId(uid),
    });

    if (!data) {
      return null;
    }

    return User.fromDocument(data as UserDocument);
  }

  /**
   * Check if the user is an admin.
   *
   * This calls {@linkcode getUserData}() and extract `isAdmin` of the return,
   * so if the other properties of the user data might be used after this,
   * consider calling {@linkcode getUserData}() instead.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string | ObjectId | null | undefined} uid user ID
   * @param {boolean} throwOnMissing if `UserNotExistsError` should be thrown if the user does not exist
   * @throws {UserNotExistsError} if `throwOnMissing` and the user does not exist
   * @return {Promise<boolean>} if the user is an admin
   */
  static async isAdmin(
    mongoClient: MongoClient,
    uid: string | ObjectId | null | undefined,
    throwOnMissing = false,
  ): Promise<boolean> {
    if (!uid) {
      return false;
    }

    const userData = await UserController.getUserData(mongoClient, uid);

    if (!userData && throwOnMissing) {
      throw new UserNotExistsError(uid);
    }

    return userData?.isAdmin || false;
  }
}
