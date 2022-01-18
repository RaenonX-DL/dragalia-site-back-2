import {MongoClient, ObjectId} from 'mongodb';

import {SupportedLanguages} from '../../api-def/api';
import {DocumentBaseKey, UserDocument, UserDocumentKey} from '../../api-def/models';
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

    try {
      const data = await (await User.getCollection(mongoClient)).findOne({
        // Ensure `uid` is converted to `ObjectId`
        [DocumentBaseKey.id]: new ObjectId(uid),
      });

      if (!data) {
        return null;
      }

      return User.fromDocument(data as UserDocument);
    } catch (e) {
      if (e instanceof TypeError) {
        return null;
      }
      throw e;
    }
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

  /**
   * Record the language of the user `uid`.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string | ObjectId} uid user ID
   * @param {SupportedLanguages} lang language the user is using
   */
  static async recordLang(mongoClient: MongoClient, uid: string | ObjectId, lang: SupportedLanguages): Promise<void> {
    if (!uid) {
      return;
    }

    await (await User.getCollection(mongoClient)).updateOne(
      {
        // Ensure `uid` is converted to `ObjectId`
        [DocumentBaseKey.id]: new ObjectId(uid),
      },
      {$set: {[UserDocumentKey.lang]: lang}},
    );
  }

  /**
   * Get a list of user data whose preferred language is `lang`.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {ObjectId[]} uids user IDs to include in the return
   * @param {SupportedLanguages} lang user preferred language to return
   * @return {UserDocument[]} user data array
   */
  static async getUserDataOfLang(
    mongoClient: MongoClient, uids: ObjectId[], lang: SupportedLanguages,
  ): Promise<UserDocument[]> {
    return await (await User.getCollection(mongoClient))
      .find({[DocumentBaseKey.id]: {$in: uids}, [UserDocumentKey.lang]: lang})
      .toArray();
  }
}
