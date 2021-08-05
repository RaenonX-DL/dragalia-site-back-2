import {MongoClient} from 'mongodb';

import {UnitNameRefData, UnitNameRefEntry as UnitNameRefEntryApi, SupportedLanguages} from '../../../api-def/api';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {UnitNameRefEntry, UnitNameRefEntryDocumentKey} from './model';


/**
 * Class to control unit name reference data.
 */
export class UnitNameRefController {
  /**
   * Get all unit name reference data.
   *
   * If `lang` is not specified, all name references will be returned.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang language of the unit name references
   * @return {Promise<UnitNameRefData>} an object containing the unit name references
   */
  static async getData(mongoClient: MongoClient, lang?: SupportedLanguages): Promise<UnitNameRefData> {
    const ret: UnitNameRefData = {};
    const filter = lang ? {[MultiLingualDocumentKey.language]: lang} : {};

    await UnitNameRefEntry.getCollection(mongoClient)
      .find(filter)
      .forEach((data) => {
        ret[data[UnitNameRefEntryDocumentKey.name]] = data[UnitNameRefEntryDocumentKey.unitId];
      });

    return ret;
  }

  /**
   * Get all unit name references as entries.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang language of the unit name references
   * @return {Promise<Array<UnitNameRefEntryApi>>} list of unit name references
   */
  static async getEntries(mongoClient: MongoClient, lang: SupportedLanguages): Promise<Array<UnitNameRefEntryApi>> {
    return await UnitNameRefEntry.getCollection(mongoClient)
      .find({[MultiLingualDocumentKey.language]: lang})
      .map((data) => ({
        unitId: data[UnitNameRefEntryDocumentKey.unitId],
        name: data[UnitNameRefEntryDocumentKey.name],
      }))
      .toArray();
  }
}
