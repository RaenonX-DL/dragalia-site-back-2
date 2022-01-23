import {MongoClient} from 'mongodb';

import {AlertEntry as AlertEntryApi, SupportedLanguages} from '../../../api-def/api';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {AlertEntry, AlertEntryDocument, AlertEntryKey} from './model';


/**
 * Controller for site alert.
 */
export class AlertController {
  /**
   * Get all site alerts in `lang`.
   *
   * Alerts will be sorted by its priority DESC.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang language of the alert
   * @return {Promise<Array<AlertEntry>>}
   */
  static async getSiteAlerts(mongoClient: MongoClient, lang: SupportedLanguages): Promise<Array<AlertEntryApi>> {
    return await (await AlertEntry.getCollection(mongoClient))
      .find({[MultiLingualDocumentKey.language]: lang}, {sort: {[AlertEntryKey.priority]: 'desc'}})
      .map((doc) => AlertEntry.fromDocument(doc as AlertEntryDocument).toApiEntry())
      .toArray();
  }
}
