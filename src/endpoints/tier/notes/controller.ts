import {MongoClient} from 'mongodb';

import {DimensionKey, SupportedLanguages, UnitTierData, UnitTierNote as UnitTierNoteApi} from '../../../api-def/api';
import {DocumentBaseKey} from '../../../api-def/models';
import {UnitPath, makeUnitUrl} from '../../../api-def/paths';
import {sendMailTierUpdated} from '../../../thirdparty/mail/send/tier/edited';
import {getCurrentEpoch} from '../../../utils/misc';
import {getUnitInfo} from '../../../utils/resources/loader/unitInfo';
import {
  TierNote,
  TierNoteEntryDocument,
  TierNoteEntryDocumentKey,
  UnitTierNote,
  UnitTierNoteDocument,
  UnitTierNoteDocumentKey,
} from './model';


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
   * Get the unit tier note of a unit.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang language of the tier note
   * @param {number} unitId unit ID of the tier note
   * @return {Promise<UnitTierNoteApi>}
   */
  static async getUnitTierNoteSingle(
    mongoClient: MongoClient, lang: SupportedLanguages, unitId: number,
  ): Promise<UnitTierNoteApi | null> {
    const tierNoteDoc = await UnitTierNote.getCollection(mongoClient)
      .findOne({[UnitTierNoteDocumentKey.unitId]: unitId});

    if (!tierNoteDoc) {
      return null;
    }

    return UnitTierNote.fromDocument(tierNoteDoc as UnitTierNoteDocument).toUnitTierNote(lang);
  }

  /**
   * Update the tier note of a certain unit.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang language of the tier note to update
   * @param {number} unitId unit ID of the tier note to update
   * @param {Omit<UnitTierNoteApi, 'lastUpdateEpoch'>} tierNote updated tier note
   * @return {Promise<void>}
   */
  static async updateUnitTierNote(
    mongoClient: MongoClient,
    lang: SupportedLanguages,
    unitId: number,
    tierNote: Omit<UnitTierNoteApi, 'lastUpdateEpoch'>,
  ): Promise<void> {
    // Get the original document
    const original: UnitTierNoteDocument = await UnitTierNote.getCollection(mongoClient)
      .findOne({[UnitTierNoteDocumentKey.unitId]: unitId}) as UnitTierNoteDocument;

    await sendMailTierUpdated({
      mongoClient,
      lang,
      sitePath: makeUnitUrl(UnitPath.UNIT_TIER, {lang, id: unitId}),
      title: (await getUnitInfo(unitId))?.name[lang] || `#${unitId}`,
    });

    if (!original) {
      // Original not available - create one and insert it
      await UnitTierNote.getCollection(mongoClient)
        .insertOne(UnitTierNote.fromTierNote(unitId, tierNote, lang).toObject());
      return;
    }

    // Original available - merge then update
    const lastUpdateEpoch = getCurrentEpoch();

    // Remove the id part - should not be updated
    delete original[DocumentBaseKey.id];

    // Get newly added tier notes to avoid overwrite
    const existingTierNoteDimensions = Object.keys(original[UnitTierNoteDocumentKey.tier]);
    const newTierNoteEntries: Array<[DimensionKey, TierNoteEntryDocument]> = Object.entries(tierNote.tier)
      .filter(([dimension, _]) => !(existingTierNoteDimensions.includes(dimension)))
      .map(([dimension, tierNote]) => [
        dimension as DimensionKey,
        new TierNote({...tierNote, note: {[lang]: tierNote.note}}).toObject(),
      ]);

    // Get original tier note entries
    const originalTierNoteEntries = Object.entries(original[UnitTierNoteDocumentKey.tier])
      // Excludes the notes that exist in `original` but not in `tierNote` which is to be overridden
      .filter(([key, originalDoc]) => {
        const dimension = key as DimensionKey;
        const noteLanguages = Object.keys(originalDoc[TierNoteEntryDocumentKey.note]) as Array<SupportedLanguages>;

        // Dimension note has more than 1 language, should keep for override
        if (noteLanguages.length > 1) {
          return true;
        }

        // Remove dimension note if both of the conditions meet:
        // - original note only has it in the update language
        // - updated tier note doesn't contain it
        return !(noteLanguages[0] === lang && !tierNote.tier[dimension]);
      });

    const tierNoteEntries = originalTierNoteEntries
      .map(([key, value]) => {
        const dimensionKey = key as DimensionKey;
        let dimensionOriginalDoc = value as TierNoteEntryDocument;

        const dimensionNoteOverride = tierNote.tier[dimensionKey];
        if (!dimensionNoteOverride) {
          // No corresponding dimension note to override
          return [dimensionKey, dimensionOriginalDoc] as [string, TierNoteEntryDocument];
        }

        // Override tier note of a dimension in `lang`
        dimensionOriginalDoc = new TierNote({
          ...dimensionNoteOverride,
          note: {
            ...dimensionOriginalDoc[TierNoteEntryDocumentKey.note],
            [lang]: dimensionNoteOverride.note,
          },
        }).toObject();

        return [dimensionKey, dimensionOriginalDoc] as [string, TierNoteEntryDocument];
      })
      // Add newly added entries in `tierNote`
      .concat(newTierNoteEntries);

    const updateDoc: UnitTierNoteDocument = {
      [UnitTierNoteDocumentKey.unitId]: unitId,
      [UnitTierNoteDocumentKey.points]: tierNote.points,
      [UnitTierNoteDocumentKey.tier]: Object.fromEntries(tierNoteEntries),
      [UnitTierNoteDocumentKey.lastUpdateEpoch]: lastUpdateEpoch,
    };

    await UnitTierNote.getCollection(mongoClient)
      .updateOne(
        {[UnitTierNoteDocumentKey.unitId]: unitId},
        {$set: updateDoc},
      );
  }
}
