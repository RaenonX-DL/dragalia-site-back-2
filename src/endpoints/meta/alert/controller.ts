import {MongoClient} from 'mongodb';

import {AlertEntry as AlertEntryApi, SupportedLanguages} from '../../../api-def/api';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {AlertEntry, AlertEntryDocument} from './model';


/**
 * Controller for site alert.
 */
export class AlertController {
  /**
   * Get all site alerts in `lang`.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang language of the alert
   * @return {Promise<Array<AlertEntry>>}
   */
  static async getSiteAlerts(mongoClient: MongoClient, lang: SupportedLanguages): Promise<Array<AlertEntryApi>> {
    return AlertEntry.getCollection(mongoClient)
      .find({[MultiLingualDocumentKey.language]: lang})
      .map((doc) => AlertEntry.fromDocument(doc as AlertEntryDocument).toApiEntry())
      .toArray();
  }
}
