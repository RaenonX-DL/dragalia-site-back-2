import {ObjectId} from 'mongodb';

import {
  ApiEndPoints,
  ApiResponseCode,
  FailedResponse,
  KeyPointInfoResponse,
  SupportedLanguages,
} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {TierNote, UnitTierNote} from '../../tier/notes/model';
import {KeyPointEntry} from '../../tier/points/model';


describe('Key point info handler', () => {
  let app: Application;

  let pointIds: Array<string>;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();

    const pointArray = [
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 1'}}),
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 2'}}),
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 3'}}),
    ].map((entry) => entry.toObject());
    const keyPointCol = await KeyPointEntry.getCollection(app.mongoClient);
    pointIds = Object
      .values((await keyPointCol.insertMany(pointArray)).insertedIds)
      .map((id) => id.toHexString());

    const noteArray = [
      new UnitTierNote({
        unitId: 10950101,
        points: [pointIds[2]],
        tier: {
          conAi: new TierNote({ranking: 'S', note: {[SupportedLanguages.EN]: 'B'}, isCompDependent: true}),
        },
        lastUpdateEpoch: 0,
      }),
      new UnitTierNote({
        unitId: 10950102,
        points: [pointIds[0], pointIds[2]],
        tier: {
          conAi: new TierNote({ranking: 'A', note: {[SupportedLanguages.EN]: 'B'}, isCompDependent: true}),
        },
        lastUpdateEpoch: 0,
      }),
    ].map((entry) => entry.toObject());
    await (await UnitTierNote.getCollection(app.mongoClient)).insertMany(noteArray);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns failed response code if the entry does not exist', async () => {
    const response = await app.app.inject().get(ApiEndPoints.DATA_KEY_POINT).query({
      uid: '',
      lang: SupportedLanguages.EN,
      id: new ObjectId().toHexString(),
    });
    expect(response.statusCode).toBe(200);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_DATA_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('returns the key point entry data', async () => {
    const response = await app.app.inject().get(ApiEndPoints.DATA_KEY_POINT).query({
      uid: '',
      lang: SupportedLanguages.EN,
      id: pointIds[0].toString(),
    });
    expect(response.statusCode).toBe(200);

    const json: KeyPointInfoResponse = response.json() as KeyPointInfoResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.info.entry).toStrictEqual({
      type: 'strength',
      description: 'CHT 1',
    });
  });

  it('returns the unit IDs linked to the key point', async () => {
    const response = await app.app.inject().get(ApiEndPoints.DATA_KEY_POINT).query({
      uid: '',
      lang: SupportedLanguages.EN,
      id: pointIds[0].toString(),
    });
    expect(response.statusCode).toBe(200);

    const json: KeyPointInfoResponse = response.json() as KeyPointInfoResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.info.linkedUnits).toStrictEqual([10950102]);
  });

  it('returns an empty array if none of the units are linked to the key point', async () => {
    const response = await app.app.inject().get(ApiEndPoints.DATA_KEY_POINT).query({
      uid: '',
      lang: SupportedLanguages.EN,
      id: pointIds[1].toString(),
    });
    expect(response.statusCode).toBe(200);

    const json: KeyPointInfoResponse = response.json() as KeyPointInfoResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.info.linkedUnits).toStrictEqual([]);
  });
});
