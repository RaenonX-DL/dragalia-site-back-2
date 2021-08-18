import {MongoClient} from 'mongodb';

import {SupportedLanguages, UnitTierData, UnitTierNote as UnitTierNoteApi} from '../../../api-def/api';
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

  /**
   * Get the unit tier note of a certain unit for editing.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang language of the tier note
   * @param {number} unitId unit ID of the tier note to be edited
   * @return {Promise<UnitTierNoteApi>}
   */
  static async getUnitTierNoteEdit(
    mongoClient: MongoClient, lang: SupportedLanguages, unitId: number,
  ): Promise<UnitTierNoteApi | null> {
    const tierNoteDoc = await UnitTierNote.getCollection(mongoClient)
      .findOne({[UnitTierNoteDocumentKey.unitId]: unitId});

    if (!tierNoteDoc) {
      return null;
    }

    return UnitTierNote.fromDocument(tierNoteDoc as UnitTierNoteDocument).toUnitTierNote(lang);
  }
}
