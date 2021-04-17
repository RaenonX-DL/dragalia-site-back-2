import {MongoClient} from 'mongodb';

import {GoogleUser, GoogleUserDocument, GoogleUserDocumentKey} from './model';

/**
 * Google user data controller.
 */
export class GoogleUserController {
  /**
   * Get the user data.
   *
   * This does not log that the user has logged in. To log such, call {@linkcode userLogin}() instead.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string} googleUid Google user ID
   * @return {Promise<GoogleUser | null>} Google user object if found, null otherwise
   */
  static async getUserData(mongoClient: MongoClient, googleUid?: string): Promise<GoogleUser | null> {
    if (!googleUid) {
      return null;
    }

    // `toString()` to prevent number being accidentally passed in
    const data = await GoogleUser.getCollection(mongoClient).findOne({
      [GoogleUserDocumentKey.userId]: googleUid.toString(),
    });

    if (!data) {
      return null;
    }

    return GoogleUser.fromDocument(data as GoogleUserDocument);
  }

  /**
   * Log that a user has logged in and return if the user is new.
   *
   * If the user is new, a new user data will be created.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string} googleUid Google user ID
   * @param {string} googleEmail Google user email
   * @param {boolean} isAdmin if the user is admin
   * @return {boolean} if the user is newly registered
   */
  static async userLogin(
    mongoClient: MongoClient, googleUid: string, googleEmail: string, isAdmin = false,
  ): Promise<boolean> {
    const updateResult = await GoogleUser.getCollection(mongoClient).findOneAndUpdate(
      {
        [GoogleUserDocumentKey.userId]: googleUid,
      },
      {
        $set: {
          [GoogleUserDocumentKey.lastLogin]: new Date(),
          [GoogleUserDocumentKey.email]: googleEmail,
        },
        $inc: {
          [GoogleUserDocumentKey.loginCount]: 1,
        },
        $setOnInsert: {
          [GoogleUserDocumentKey.isAdmin]: isAdmin,
        },
      },
      {
        upsert: true,
      });

    return !updateResult.value;
  }

  /**
   * Check if the user is admin.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string} googleUid Google user ID
   * @return {Promise<boolean>} if the user is an admin
   */
  static async isAdmin(mongoClient: MongoClient, googleUid: string): Promise<boolean> {
    const userData = await GoogleUserController.getUserData(mongoClient, googleUid);

    return userData?.isAdmin || false;
  }
}
