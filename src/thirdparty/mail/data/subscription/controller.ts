import {MongoClient, ObjectId} from 'mongodb';

import {SubscriptionUpdatePayload, SupportedLanguages, SubscriptionKey} from '../../../../api-def/api';
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
    const uidSubscribed = await SubscriptionRecord.getCollection(mongoClient)
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
   * @param {SubscriptionUpdatePayload} payload user subscription update payload
   * @return {Promise<void>}
   */
  static async updateSubscriptions(mongoClient: MongoClient, payload: SubscriptionUpdatePayload): Promise<void> {
    const {uid, subKeysBase64} = payload;

    const subKeys = JSON.parse(Buffer.from(subKeysBase64, 'base64url').toString() || '[]') as SubscriptionKey[];

    await execTransaction(mongoClient, async (session) => {
      const uidObjectId = new ObjectId(uid);
      const collection = SubscriptionRecord.getCollection(mongoClient);

      await collection.deleteMany({[SubscriptionRecordDocumentKey.uid]: new ObjectId(uid)}, {session});

      if (!subKeys.length) {
        return;
      }

      await collection.insertMany(
        subKeys.map((key) => ({
          [SubscriptionRecordDocumentKey.key]: key,
          [SubscriptionRecordDocumentKey.uid]: uidObjectId,
        })),
        {session},
      );
    });
  }
}
