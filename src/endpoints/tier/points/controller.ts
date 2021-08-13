import {MongoClient} from 'mongodb';

import {KeyPointEntry, KeyPointEntryDocument} from './model';


/**
 * Class to control key points data displayed in unit tier list page.
 */
export class KeyPointController {
  /**
   * Get all key point entries.
   *
   * @param {MongoClient} mongoClient mongo client
   * @return {Promise<Array<KeyPointEntry>>} array of key point entries
   */
  static async getAllEntries(mongoClient: MongoClient): Promise<Array<KeyPointEntryDocument>> {
    return await KeyPointEntry.getCollection(mongoClient).find().toArray();
  }
}
