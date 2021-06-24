import {MongoClient} from 'mongodb';

import {UnitNameRefData} from '../../../api-def/api/data/unitNameRef/elements';
import {SupportedLanguages} from '../../../api-def/api/other/lang';
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
   * @param {SupportedLanguages} lang language of the unit name reference
   * @return {Promise<number>} post unit ID
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
}
