import {MongoClient, MongoError} from 'mongodb';

import {UnitNameRefData, UnitNameRefEntry as UnitNameRefEntryApi, SupportedLanguages} from '../../../api-def/api';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {execTransaction} from '../../../utils/mongodb';
import {DuplicatedNamesError} from './error';
import {UnitNameRefEntry, UnitNameRefEntryDocument, UnitNameRefEntryDocumentKey} from './model';


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

    await (await UnitNameRefEntry.getCollection(mongoClient))
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
    return await (await UnitNameRefEntry.getCollection(mongoClient))
      .find({[MultiLingualDocumentKey.language]: lang})
      .map((data) => ({
        unitId: data[UnitNameRefEntryDocumentKey.unitId],
        name: data[UnitNameRefEntryDocumentKey.name],
      }))
      .toArray();
  }

  /**
   * Update all unit name references in the given ``lang``.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang language of the unit name references to update
   * @param {Array<UnitNameRefEntryApi>} refs list of unit name references to use in the given language
   * @return {Promise<Array<UnitNameRefEntryApi>>} list of unit name references
   */
  static async updateRefs(
    mongoClient: MongoClient,
    lang: SupportedLanguages,
    refs: Array<UnitNameRefEntryApi>,
  ): Promise<void> {
    await execTransaction(mongoClient, async (session) => {
      const collection = await UnitNameRefEntry.getCollection(mongoClient);

      await collection.deleteMany({[MultiLingualDocumentKey.language]: lang}, {session});

      if (!refs.length) {
        // No references to add
        return;
      }

      try {
        await collection.insertMany(
          refs.map((entry) => ({
            [UnitNameRefEntryDocumentKey.name]: entry.name,
            [UnitNameRefEntryDocumentKey.unitId]: entry.unitId,
            [MultiLingualDocumentKey.language]: lang,
          } as UnitNameRefEntryDocument)),
          {session},
        );
      } catch (e) {
        if (e instanceof MongoError && e.code === 11000) {
          // E11000 for duplicated key
          throw new DuplicatedNamesError(e.errmsg);
        } else {
          throw e; // let other type of error bubble up
        }
      }
    },
    );
  }
}
