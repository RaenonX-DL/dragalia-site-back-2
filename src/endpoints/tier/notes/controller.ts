import {MongoClient} from 'mongodb';

import {SupportedLanguages, UnitTierData} from '../../../api-def/api';
import {UnitTierNote, UnitTierNoteDocument, UnitTierNoteDocumentKey} from './model';


/**
 * Class to control unit tier note data.
 */
export class TierNoteController {
  /**
   * Get all unit tier notes in the given language.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang language of the tier notes
   * @return {Promise<UnitTierData>}
   */
  static async getAllTierNotes(mongoClient: MongoClient, lang: SupportedLanguages): Promise<UnitTierData> {
    return Object.fromEntries(
      await UnitTierNote.getCollection(mongoClient)
        .find()
        .map((doc) => [
          doc[UnitTierNoteDocumentKey.unitId],
          UnitTierNote.fromDocument(doc as UnitTierNoteDocument).toUnitTierNote(lang),
        ])
        .toArray(),
    );
  }
}
