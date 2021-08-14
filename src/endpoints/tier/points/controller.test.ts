import {ObjectId} from 'mongodb';

import {mongoExecInTransaction} from '../../../../test/utils/mongo';
import {SupportedLanguages} from '../../../api-def/api';
import {DocumentBaseKey} from '../../../api-def/models';
import {Application, createApp} from '../../../app';
import {KeyPointController} from './controller';
import {DuplicatedDescriptionsError} from './error';
import {KeyPointEntry, KeyPointEntryDocumentKey} from './model';


describe('Key point entry data controller', () => {
  let app: Application;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('getAllEntries()', () => {
    it('returns empty array if no data', async () => {
      expect(await KeyPointController.getAllEntries(app.mongoClient)).toHaveLength(0);
    });

    it('returns entries in specified language', async () => {
      const dataArray = [
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT S1'}}),
        new KeyPointEntry({type: 'weakness', description: {[SupportedLanguages.CHT]: 'CHT W1'}}),
        new KeyPointEntry({type: 'weakness', description: {[SupportedLanguages.CHT]: 'CHT W2'}}),
      ].map((entry) => entry.toObject());
      const ids = Object.values((await KeyPointEntry.getCollection(app.mongoClient).insertMany(dataArray)).insertedIds)
        .map((id) => id.toHexString());

      const data = await KeyPointController.getAllEntries(app.mongoClient);

      expect(data.map((entry) => entry[DocumentBaseKey.id]?.toString())).toStrictEqual(ids);

      const dataEntries = data.map((entry) => ({
        type: entry[KeyPointEntryDocumentKey.type],
        description: entry[KeyPointEntryDocumentKey.description],
      }));
      expect(dataEntries).toStrictEqual([
        {type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT S1'}},
        {type: 'weakness', description: {[SupportedLanguages.CHT]: 'CHT W1'}},
        {type: 'weakness', description: {[SupportedLanguages.CHT]: 'CHT W2'}},
      ]);
    });

    it('returns entries in alternative language if desired one does not exist', async () => {
      const dataArray = [
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT S1'}}),
        new KeyPointEntry({type: 'weakness', description: {[SupportedLanguages.CHT]: 'CHT W1'}}),
        new KeyPointEntry({type: 'weakness', description: {[SupportedLanguages.EN]: 'EN W2'}}),
      ].map((entry) => entry.toObject());
      const ids = Object.values((await KeyPointEntry.getCollection(app.mongoClient).insertMany(dataArray)).insertedIds)
        .map((id) => id.toHexString());

      const data = await KeyPointController.getAllEntries(app.mongoClient);

      expect(data.map((entry) => entry[DocumentBaseKey.id]?.toString())).toStrictEqual(ids);

      const dataEntries = data.map((entry) => ({
        type: entry[KeyPointEntryDocumentKey.type],
        description: entry[KeyPointEntryDocumentKey.description],
      }));
      expect(dataEntries).toStrictEqual([
        {type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT S1'}},
        {type: 'weakness', description: {[SupportedLanguages.CHT]: 'CHT W1'}},
        {type: 'weakness', description: {[SupportedLanguages.EN]: 'EN W2'}},
      ]);
    });
  });

  describe('updateEntries()', () => {
    it('fails to update if the descriptions are duplicated', async () => {
      const fn = async () => {
        await KeyPointController.updateEntries(
          app.mongoClient,
          SupportedLanguages.CHT,
          [
            {type: 'strength', description: 'CHT 1'},
            {type: 'strength', description: 'CHT 1'},
          ],
        );
      };

      await expect(fn).rejects.toThrow(DuplicatedDescriptionsError);
    });

    it('adds new entries', async () => {
      const dataArray = [
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 1'}}),
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 2'}}),
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 3'}}),
      ].map((entry) => entry.toObject());
      const insertIds = Object
        .values((await KeyPointEntry.getCollection(app.mongoClient).insertMany(dataArray)).insertedIds)
        .map((id) => id.toHexString());

      await KeyPointController.updateEntries(
        app.mongoClient,
        SupportedLanguages.CHT,
        [
          {id: insertIds[0], type: 'strength', description: 'CHT 1'},
          {id: insertIds[1], type: 'strength', description: 'CHT 2'},
          {id: insertIds[2], type: 'strength', description: 'CHT 3'},
          {type: 'strength', description: 'CHT 4'},
        ],
      );

      await mongoExecInTransaction(app.mongoClient, async () => {
        expect(await KeyPointEntry.getCollection(app.mongoClient).find().toArray()).toHaveLength(4);
      });
    });

    it('keeps the original key point entries if failed to update', async () => {
      const dataArray = [
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 1'}}),
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 2'}}),
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 3'}}),
      ].map((entry) => entry.toObject());
      await KeyPointEntry.getCollection(app.mongoClient).insertMany(dataArray);

      const fn = async () => {
        await KeyPointController.updateEntries(
          app.mongoClient,
          SupportedLanguages.CHT,
          [
            {type: 'strength', description: 'CHT 1'},
            {type: 'strength', description: 'CHT 1'},
          ],
        );
      };

      await expect(fn).rejects.toThrow(DuplicatedDescriptionsError);

      await mongoExecInTransaction(app.mongoClient, async () => {
        expect((await KeyPointEntry.getCollection(app.mongoClient).find().toArray()).length).toBe(3);
      });
    });

    it('removes all entries on receiving empty update unit name ref list', async () => {
      const dataArray = [
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 1'}}),
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 2'}}),
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 3'}}),
      ].map((entry) => entry.toObject());
      await KeyPointEntry.getCollection(app.mongoClient).insertMany(dataArray);

      await KeyPointController.updateEntries(app.mongoClient, SupportedLanguages.CHT, []);

      await mongoExecInTransaction(app.mongoClient, async () => {
        const data = await KeyPointEntry.getCollection(app.mongoClient).find().toArray();
        expect(data.map((entry) => entry[KeyPointEntryDocumentKey.description]).sort()).toStrictEqual([]);
      });
    });

    it('removes entries that are not contained in the update list', async () => {
      const dataArray = [
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 1'}}),
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 2'}}),
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 3'}}),
      ].map((entry) => entry.toObject());
      const insertIds = Object
        .values((await KeyPointEntry.getCollection(app.mongoClient).insertMany(dataArray)).insertedIds)
        .map((id) => id.toHexString());

      await KeyPointController.updateEntries(
        app.mongoClient,
        SupportedLanguages.CHT,
        [
          {id: insertIds[0], type: 'strength', description: 'CHT 4'},
          {id: insertIds[1], type: 'strength', description: 'CHT 5'},
        ],
      );

      await mongoExecInTransaction(app.mongoClient, async () => {
        const data = (await KeyPointEntry.getCollection(app.mongoClient).find().toArray())
          .map((entry) => entry[KeyPointEntryDocumentKey.description][SupportedLanguages.CHT])
          .sort();
        expect(data).toStrictEqual(['CHT 4', 'CHT 5']);
      });
    });

    it('updates the entries in the given language only', async () => {
      const dataArray = [
        new KeyPointEntry({
          type: 'strength',
          description: {[SupportedLanguages.CHT]: 'CHT 1', [SupportedLanguages.EN]: 'EN 1'},
        }),
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 2'}}),
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 3'}}),
      ].map((entry) => entry.toObject());
      const insertIds = Object
        .values((await KeyPointEntry.getCollection(app.mongoClient).insertMany(dataArray)).insertedIds)
        .map((id) => id.toHexString());

      await KeyPointController.updateEntries(
        app.mongoClient,
        SupportedLanguages.CHT,
        [
          {id: insertIds[0], type: 'strength', description: 'CHT 4'},
          {id: insertIds[1], type: 'strength', description: 'CHT 5'},
          {id: insertIds[2], type: 'strength', description: 'CHT 3'},
        ],
      );

      await mongoExecInTransaction(app.mongoClient, async () => {
        let data = await KeyPointEntry.getCollection(app.mongoClient)
          .findOne({[DocumentBaseKey.id]: new ObjectId(insertIds[0])});
        expect(data?.[KeyPointEntryDocumentKey.description]).toStrictEqual({
          [SupportedLanguages.CHT]: 'CHT 4',
          [SupportedLanguages.EN]: 'EN 1',
        });

        data = await KeyPointEntry.getCollection(app.mongoClient)
          .findOne({[DocumentBaseKey.id]: new ObjectId(insertIds[1])});
        expect(data?.[KeyPointEntryDocumentKey.description]).toStrictEqual({
          [SupportedLanguages.CHT]: 'CHT 5',
        });

        data = await KeyPointEntry.getCollection(app.mongoClient)
          .findOne({[DocumentBaseKey.id]: new ObjectId(insertIds[2])});
        expect(data?.[KeyPointEntryDocumentKey.description]).toStrictEqual({
          [SupportedLanguages.CHT]: 'CHT 3',
        });
      });
    });
  });
});
