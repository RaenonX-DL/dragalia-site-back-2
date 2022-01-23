import {MongoClient, MongoError, ObjectId} from 'mongodb';

import {
  SubscriptionAddPayload,
  SubscriptionKey,
  SubscriptionRemovePayload,
  SupportedLanguages,
} from '../../../../api-def/api';
import {UserDocumentKey} from '../../../../api-def/models';
import {UserController} from '../../../../endpoints/userControl/controller';
import {execTransaction} from '../../../../utils/mongodb';
import {SubscriptionRecord, SubscriptionRecordDocumentKey} from './model';


/**
 * Email subscription record controller.
 */
export class SubscriptionRecordController {
  /**
   * Get the subscription recipients of `keys` in `lang`.
   *
   * The returned list includes the recipients who have any of the subscription key in `keys`.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang recipient language
   * @param {SubscriptionKey} keys subscription keys
   * @return {Promise<string[]>} recipients in all supported languages
   */
  static async getRecipients(
    mongoClient: MongoClient,
    lang: SupportedLanguages,
    keys: SubscriptionKey[],
  ): Promise<string[]> {
    const uidSubscribed = await (await SubscriptionRecord.getCollection(mongoClient))
      .find({[SubscriptionRecordDocumentKey.key]: {$in: keys}})
      .map((doc) => doc[SubscriptionRecordDocumentKey.uid].toHexString())
      .toArray();

    return (await UserController.getUserDataOfLang(
      mongoClient,
      uidSubscribed.map((uid) => new ObjectId(uid)),
      lang,
    ))
      .map((doc) => doc[UserDocumentKey.email]);
  }

  /**
   * Update the user subscriptions by payload.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string} uid ID of the user to update the subscriptions
   * @param {SubscriptionKey[]} subscriptionKeys user subscription keys
   * @return {Promise<void>}
   */
  static async updateSubscriptions(
    mongoClient: MongoClient,
    uid: string,
    subscriptionKeys: SubscriptionKey[],
  ): Promise<void> {
    await execTransaction(mongoClient, async (session) => {
      const uidObjectId = new ObjectId(uid);
      const collection = await SubscriptionRecord.getCollection(mongoClient);

      await collection.deleteMany({[SubscriptionRecordDocumentKey.uid]: new ObjectId(uid)}, {session});

      if (!subscriptionKeys.length) {
        return;
      }

      await collection.insertMany(
        subscriptionKeys.map((key) => ({
          [SubscriptionRecordDocumentKey.key]: key,
          [SubscriptionRecordDocumentKey.uid]: uidObjectId,
        })),
        {session},
      );
    });
  }

  /**
   * Adds a subscription.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SubscriptionAddPayload} payload subscription addition payload
   * @return {Promise<void>}
   */
  static async addSubscription(mongoClient: MongoClient, payload: SubscriptionAddPayload): Promise<void> {
    const {uid, subKeyBase64} = payload;

    const subKey = JSON.parse(Buffer.from(subKeyBase64, 'base64url').toString()) as SubscriptionKey;

    try {
      await (await SubscriptionRecord.getCollection(mongoClient))
        .insertOne({
          [SubscriptionRecordDocumentKey.uid]: new ObjectId(uid),
          [SubscriptionRecordDocumentKey.key]: subKey,
        });
    } catch (e) {
      if (e instanceof MongoError && e.code === 11000) {
        return;
      }

      throw e;
    }
  }

  /**
   * Removes a subscription.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SubscriptionRemovePayload} payload subscription removing payload
   * @return {Promise<void>}
   */
  static async removeSubscription(mongoClient: MongoClient, payload: SubscriptionRemovePayload): Promise<void> {
    const {uid, subKeyBase64} = payload;

    const subKey = JSON.parse(Buffer.from(subKeyBase64, 'base64url').toString()) as SubscriptionKey;

    await (await SubscriptionRecord.getCollection(mongoClient))
      .deleteOne({
        [SubscriptionRecordDocumentKey.uid]: new ObjectId(uid),
        [SubscriptionRecordDocumentKey.key]: subKey,
      });
  }

  /**
   * Checks if the user has subscribed to any of the given keys.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string} uid user to check against
   * @param {SubscriptionKey[]} keys subscription keys to check against
   * @return {Promise<boolean>} if the user has subscribed
   */
  static async isUserSubscribed(mongoClient: MongoClient, uid: string, keys: SubscriptionKey[]): Promise<boolean> {
    if (!uid) {
      // No need to check if the UID is empty
      return false;
    }

    return !!await (await SubscriptionRecord.getCollection(mongoClient)).findOne({
      [SubscriptionRecordDocumentKey.key]: {$in: keys},
      [SubscriptionRecordDocumentKey.uid]: new ObjectId(uid),
    });
  }

  /**
   * Get the subscription keys of a user.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string} uid user ID to check the subscription
   * @return {Promise<SubscriptionKey[]>} subscription keys of a user
   */
  static async getSubscriptionsOfUser(mongoClient: MongoClient, uid: string): Promise<SubscriptionKey[]> {
    if (!uid) {
      // `uid` could be an empty string
      return [];
    }

    return await (await SubscriptionRecord.getCollection(mongoClient))
      .find({[SubscriptionRecordDocumentKey.uid]: new ObjectId(uid)})
      .map((doc) => doc[SubscriptionRecordDocumentKey.key])
      .toArray();
  }
}
