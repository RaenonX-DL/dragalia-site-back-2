import {MongoClient} from 'mongodb';

import {UserIdEmptyError, UserNotExistsError} from './error';
import {User, UserDocument, UserDocumentKey} from './model';


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
  static async getUserData(mongoClient: MongoClient, uid?: string | null): Promise<User | null> {
    if (!uid) {
      return null;
    }

    // `toString()` to prevent number being accidentally passed in
    const data = await User.getCollection(mongoClient).findOne({
      [UserDocumentKey.userId]: uid.toString(),
    });

    if (!data) {
      return null;
    }

    return User.fromDocument(data as UserDocument);
  }

  /**
   * Log that a user has logged in and return if the user is new.
   *
   * If the user is new, a new user data will be created.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string | null | undefined} uid user ID
   * @param {string} email user email
   * @param {boolean} isAdmin if the user is admin
   * @throws {UserIdEmptyError} if `uid` is falsy
   * @return {boolean} if the user is newly registered
   */
  static async userLogin(
    mongoClient: MongoClient, uid: string | null | undefined, email: string, isAdmin = false,
  ): Promise<boolean> {
    if (!uid) {
      throw new UserIdEmptyError();
    }

    const updateResult = await User.getCollection(mongoClient).findOneAndUpdate(
      {
        [UserDocumentKey.userId]: uid,
      },
      {
        $set: {
          [UserDocumentKey.lastLogin]: new Date(),
          [UserDocumentKey.email]: email,
        },
        $inc: {
          [UserDocumentKey.loginCount]: 1,
        },
        $setOnInsert: {
          [UserDocumentKey.isAdmin]: isAdmin,
        },
      },
      {
        upsert: true,
      });

    return !updateResult.value;
  }

  /**
   * Check if the user is an admin.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string | null | undefined} uid user ID
   * @param {boolean} throwOnMissing if `UserNotExistsError` should be thrown if the user does not exist
   * @throws {UserNotExistsError} if `throwOnMissing` and the user does not exist
   * @return {Promise<boolean>} if the user is an admin
   */
  static async isAdmin(
    mongoClient: MongoClient,
    uid: string | null | undefined,
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
