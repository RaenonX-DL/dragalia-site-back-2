import {MongoClient} from 'mongodb';
import {GoogleUser} from './model';

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
   * @return {boolean} if the user is newly registered
   */
  static async userLogin(mongoClient: MongoClient, googleUid: string, googleEmail: string): Promise<boolean> {
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
          a: false,
        },
      },
      {
        upsert: true,
      });

    return !updateResult.value;
  }
}
