import {MongoClient} from 'mongodb';
import {GoogleUser, GoogleUserDocument} from './model';

/**
 * Google user data controller.
 */
export class GoogleUserController {
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
        uid: googleUid,
        em: googleEmail,
      },
      {
        $set: {
          lr: new Date(),
        },
        $inc: {
          lc: 1,
        },
        $setOnInsert: {
          a: isAdmin,
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
    const userData = await GoogleUser.getCollection(mongoClient).findOne({uid: googleUid});

    return userData && GoogleUser.fromDocument(userData as GoogleUserDocument).isAdmin;
  }
}
