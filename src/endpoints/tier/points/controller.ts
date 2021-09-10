import {Collection, MongoClient, ObjectId} from 'mongodb';

import {KeyPointEntryUpdate, SupportedLanguages} from '../../../api-def/api';
import {DocumentBaseKey} from '../../../api-def/models';
import {execTransaction} from '../../../utils/mongodb';
import {UnitTierNote, UnitTierNoteDocument, UnitTierNoteDocumentKey} from '../notes/model';
import {DuplicatedDescriptionsError} from './error';
import {KeyPointEntry, KeyPointEntryDocument, KeyPointEntryDocumentKey} from './model';


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
    return await KeyPointEntry.getCollection(mongoClient).find().toArray() as Array<KeyPointEntryDocument>;
  }

  /**
   * Get the description of a key point entry.
   *
   * Returns `null` if none of the key point entry has ID of `id`.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang language of the description
   * @param {string} id ID of the key point entry
   * @return {Promise<string | null>} description of the entry, `null` if not found
   */
  static async getDescription(mongoClient: MongoClient, lang: SupportedLanguages, id: string): Promise<string | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const entry = await KeyPointController.getEntry(mongoClient, id);

    if (!entry) {
      return null;
    }

    return entry.getDescription(lang);
  }

  /**
   * Get an entry by its ID.
   *
   * Returns `null` if not found.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string} id id of the key point entry to find the reference
   * @return {Array<number>} unit IDs that shares the requested key point
   */
  static async getEntry(mongoClient: MongoClient, id: string): Promise<KeyPointEntry | null> {
    const entry = await (KeyPointEntry.getCollection(mongoClient) as unknown as Collection<KeyPointEntryDocument>)
      .findOne({[DocumentBaseKey.id]: new ObjectId(id)});

    if (!entry) {
      return null;
    }

    return KeyPointEntry.fromDocument(entry);
  }

  /**
   * Get a list of unit IDs that referenced a certain key point.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string} id id of the key point entry to find the reference
   * @return {Array<number>} unit IDs that shares the requested key point
   */
  static async getReferencedUnitIds(mongoClient: MongoClient, id: string): Promise<Array<number>> {
    return (await UnitTierNote.getCollection(mongoClient) as unknown as Collection<UnitTierNoteDocument>)
      .find({[UnitTierNoteDocumentKey.points]: id})
      .map((doc) => doc[UnitTierNoteDocumentKey.unitId])
      .toArray();
  }

  /**
   * Update all given `entries` in `lang`.
   *
   * Entries that exists in the database but not in `entries` will be removed.
   *
   * Entries that does not exist in the database but exists in `entries` will be added.
   *
   * Entries that exists both in the database and `entries` will be updated.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang target language to update
   * @param {Array<KeyPointEntryUpdate>} entries entries to be added or updated
   * @return {Promise<void>}
   * @throws {DuplicatedDescriptionsError} if there are duplicated descriptions in `entries`
   */
  static async updateEntries(
    mongoClient: MongoClient,
    lang: SupportedLanguages,
    entries: Array<KeyPointEntryUpdate>,
  ): Promise<void> {
    // Check for duplicated descriptions
    if (new Set(entries.map((entry) => entry.description)).size !== entries.length) {
      throw new DuplicatedDescriptionsError();
    }

    await execTransaction(
      mongoClient,
      async (session) => {
        const collection = KeyPointEntry.getCollection(mongoClient);

        if (!entries.length) {
          // Nothing to add but delete all
          await collection.deleteMany({});
          return;
        }

        const entriesHasId = entries.filter((entry) => !!entry.id);
        const entriesNoId = entries.filter((entry) => !entry.id);

        // Delete IDs that exist in the database but not `entries`
        const idsInDatabase: Array<string> = await collection.find()
          .map((doc) => doc[DocumentBaseKey.id].toString()).toArray();
        const idsInEntries = entriesHasId.map((entry) => entry.id);
        const idsToDelete = idsInDatabase.filter((id) => !idsInEntries.includes(id));
        if (idsToDelete.length) {
          // Delete key point entry itself
          await collection.deleteMany(
            {$or: idsToDelete.map((id) => ({[DocumentBaseKey.id]: new ObjectId(id)}))},
            {session},
          );

          // Remove unit tier note references
          await (UnitTierNote.getCollection(mongoClient) as unknown as Collection<UnitTierNoteDocument>).updateMany(
            {},
            {$pullAll: {[UnitTierNoteDocumentKey.points]: idsToDelete}},
          );
        }

        // Insert entries without IDs (new entries)
        if (entriesNoId.length) {
          await collection.insertMany(entriesNoId.map((entry) => ({
            [KeyPointEntryDocumentKey.type]: entry.type,
            [KeyPointEntryDocumentKey.description]: {[lang]: entry.description},
          }) as KeyPointEntryDocument));
        }

        // Update entries
        if (entriesHasId.length) {
          await collection.bulkWrite(entriesHasId.map((entry) => ({
            updateOne: {
              filter: {[DocumentBaseKey.id]: new ObjectId(entry.id)},
              update: {
                $set: {
                  [KeyPointEntryDocumentKey.type]: entry.type,
                  [`${KeyPointEntryDocumentKey.description}.${lang}`]: entry.description,
                },
              },
            },
          })), {session});
        }
      },
    );
  }
}
