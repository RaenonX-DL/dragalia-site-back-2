import {MongoClient, ObjectId} from 'mongodb';

import {SupportedLanguages} from '../../../../api-def/api';
import {UserDocumentKey} from '../../../../api-def/models';
import {UserController} from '../../../../endpoints/userControl/controller';
import {SubscriptionKey} from './key';
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
}
