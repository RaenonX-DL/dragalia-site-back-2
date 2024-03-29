import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../../../test/data/user';
import {mongoExecInTransaction} from '../../../../../test/utils/mongo';
import {
  ApiEndPoints,
  ApiResponseCode,
  FailedResponse,
  KeyPointUpdateResponse,
  SupportedLanguages,
} from '../../../../api-def/api';
import {DocumentBaseKey} from '../../../../api-def/models';
import {Application, createApp} from '../../../../app';
import {KeyPointEntry, KeyPointEntryDocumentKey} from '../model';


describe('Key point updating handler', () => {
  let app: Application;

  const uidAdmin = new ObjectId();

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await insertMockUser(app.mongoClient, {id: uidAdmin, isAdmin: true});
  });

  afterAll(async () => {
    await app.close();
  });

  it('fails to update if the descriptions are duplicated', async () => {
    const response = await app.app.inject().post(ApiEndPoints.MANAGE_TIER_POINTS).payload({
      uid: uidAdmin.toHexString(),
      lang: SupportedLanguages.CHT,
      points: [
        {type: 'strength', description: 'CHT 1'},
        {type: 'strength', description: 'CHT 1'},
      ],
    });
    expect(response.statusCode).toBe(200);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_DESCRIPTION_DUPLICATED);
    expect(json.success).toBe(false);
  });

  it('fails to update if the user is not an admin', async () => {
    const response = await app.app.inject().post(ApiEndPoints.MANAGE_TIER_POINTS).payload({
      uid: '',
      lang: SupportedLanguages.CHT,
      points: [
        {type: 'strength', description: 'CHT 1'},
        {type: 'strength', description: 'CHT 1'},
      ],
    });
    expect(response.statusCode).toBe(403);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
    expect(json.success).toBe(false);
  });

  it('does not change the stored data after 403 request', async () => {
    const dataArray = [
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 1'}}),
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 2'}}),
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 3'}}),
    ].map((entry) => entry.toObject());
    await (await KeyPointEntry.getCollection(app.mongoClient)).insertMany(dataArray);

    const response = await app.app.inject().post(ApiEndPoints.MANAGE_TIER_POINTS).payload({
      uid: '',
      lang: SupportedLanguages.CHT,
      points: [
        {type: 'strength', description: 'CHT 4'},
        {type: 'strength', description: 'CHT 5'},
      ],
    });
    expect(response.statusCode).toBe(403);

    expect(await (await KeyPointEntry.getCollection(app.mongoClient)).find().toArray()).toHaveLength(3);
  });

  it('adds new entries', async () => {
    const dataArray = [
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 1'}}),
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 2'}}),
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 3'}}),
    ].map((entry) => entry.toObject());
    const insertIds = Object
      .values((await (await KeyPointEntry.getCollection(app.mongoClient)).insertMany(dataArray)).insertedIds)
      .map((id) => id.toHexString());

    const response = await app.app.inject().post(ApiEndPoints.MANAGE_TIER_POINTS).payload({
      uid: uidAdmin.toHexString(),
      lang: SupportedLanguages.CHT,
      points: [
        {id: insertIds[0], type: 'strength', description: 'CHT 1'},
        {id: insertIds[1], type: 'strength', description: 'CHT 2'},
        {id: insertIds[2], type: 'strength', description: 'CHT 3'},
        {type: 'strength', description: 'CHT 4'},
      ],
    });
    expect(response.statusCode).toBe(200);

    const json: KeyPointUpdateResponse = response.json() as KeyPointUpdateResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    await mongoExecInTransaction(app.mongoClient, async () => {
      const data = await (await KeyPointEntry.getCollection(app.mongoClient)).find().toArray();
      expect(data).toHaveLength(4);
    });
  });

  it('keeps the original key point entries if failed to update', async () => {
    const dataArray = [
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 1'}}),
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 2'}}),
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 3'}}),
    ].map((entry) => entry.toObject());
    await (await KeyPointEntry.getCollection(app.mongoClient)).insertMany(dataArray);

    const response = await app.app.inject().post(ApiEndPoints.MANAGE_TIER_POINTS).payload({
      uid: uidAdmin.toHexString(),
      lang: SupportedLanguages.CHT,
      points: [
        {type: 'strength', description: 'CHT 1'},
        {type: 'strength', description: 'CHT 1'},
      ],
    });
    expect(response.statusCode).toBe(200);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_DESCRIPTION_DUPLICATED);
    expect(json.success).toBe(false);

    await mongoExecInTransaction(app.mongoClient, async () => {
      expect((await (await KeyPointEntry.getCollection(app.mongoClient)).find().toArray()).length).toBe(3);
    });
  });

  it('removes all entries on receiving empty update unit name ref list', async () => {
    const dataArray = [
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 1'}}),
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 2'}}),
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 3'}}),
    ].map((entry) => entry.toObject());
    await (await KeyPointEntry.getCollection(app.mongoClient)).insertMany(dataArray);

    const response = await app.app.inject().post(ApiEndPoints.MANAGE_TIER_POINTS).payload({
      uid: uidAdmin.toHexString(),
      lang: SupportedLanguages.CHT,
      points: [],
    });
    expect(response.statusCode).toBe(200);

    const json: KeyPointUpdateResponse = response.json() as KeyPointUpdateResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    await mongoExecInTransaction(app.mongoClient, async () => {
      const data = await (await KeyPointEntry.getCollection(app.mongoClient)).find().toArray();
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
      .values((await (await KeyPointEntry.getCollection(app.mongoClient)).insertMany(dataArray)).insertedIds)
      .map((id) => id.toHexString());

    const response = await app.app.inject().post(ApiEndPoints.MANAGE_TIER_POINTS).payload({
      uid: uidAdmin.toHexString(),
      lang: SupportedLanguages.CHT,
      points: [
        {id: insertIds[0], type: 'strength', description: 'CHT 4'},
        {id: insertIds[1], type: 'strength', description: 'CHT 5'},
      ],
    });
    expect(response.statusCode).toBe(200);

    const json: KeyPointUpdateResponse = response.json() as KeyPointUpdateResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    await mongoExecInTransaction(app.mongoClient, async () => {
      const data = (await (await KeyPointEntry.getCollection(app.mongoClient)).find().toArray())
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
      .values((await (await KeyPointEntry.getCollection(app.mongoClient)).insertMany(dataArray)).insertedIds)
      .map((id) => id.toHexString());

    const response = await app.app.inject().post(ApiEndPoints.MANAGE_TIER_POINTS).payload({
      uid: uidAdmin.toHexString(),
      lang: SupportedLanguages.CHT,
      points: [
        {id: insertIds[0], type: 'strength', description: 'CHT 4'},
        {id: insertIds[1], type: 'strength', description: 'CHT 5'},
        {id: insertIds[2], type: 'strength', description: 'CHT 3'},
      ],
    });
    expect(response.statusCode).toBe(200);

    const json: KeyPointUpdateResponse = response.json() as KeyPointUpdateResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    await mongoExecInTransaction(app.mongoClient, async () => {
      let data = await (await KeyPointEntry.getCollection(app.mongoClient))
        .findOne({[DocumentBaseKey.id]: new ObjectId(insertIds[0])});
      expect(data?.[KeyPointEntryDocumentKey.description]).toStrictEqual({
        [SupportedLanguages.CHT]: 'CHT 4',
        [SupportedLanguages.EN]: 'EN 1',
      });

      data = await (await KeyPointEntry.getCollection(app.mongoClient))
        .findOne({[DocumentBaseKey.id]: new ObjectId(insertIds[1])});
      expect(data?.[KeyPointEntryDocumentKey.description]).toStrictEqual({
        [SupportedLanguages.CHT]: 'CHT 5',
      });

      data = await (await KeyPointEntry.getCollection(app.mongoClient))
        .findOne({[DocumentBaseKey.id]: new ObjectId(insertIds[2])});
      expect(data?.[KeyPointEntryDocumentKey.description]).toStrictEqual({
        [SupportedLanguages.CHT]: 'CHT 3',
      });
    });
  });
});
