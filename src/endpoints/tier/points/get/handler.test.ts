import {
  ApiEndPoints,
  ApiResponseCode,
  KeyPointGetResponse,
  SupportedLanguages,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {KeyPointEntry} from '../model';


describe('Key point data getting handler', () => {
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

  it('returns empty array if no data', async () => {
    const response = await app.app.inject().get(ApiEndPoints.TIER_KEY_POINTS).query({
      uid: '',
      lang: SupportedLanguages.CHT,
    });
    expect(response.statusCode).toBe(200);

    const json: KeyPointGetResponse = response.json() as KeyPointGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.data).toStrictEqual({});
  });

  it('returns entries in specified language', async () => {
    const dataArray = [
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT S1'}}),
      new KeyPointEntry({type: 'weakness', description: {[SupportedLanguages.CHT]: 'CHT W1'}}),
      new KeyPointEntry({type: 'weakness', description: {[SupportedLanguages.CHT]: 'CHT W2'}}),
    ].map((entry) => entry.toObject());
    const ids = Object.values((await KeyPointEntry.getCollection(app.mongoClient).insertMany(dataArray)).insertedIds)
      .map((id) => id.toHexString());

    const response = await app.app.inject().get(ApiEndPoints.TIER_KEY_POINTS).query({
      uid: '',
      lang: SupportedLanguages.CHT,
    });
    expect(response.statusCode).toBe(200);

    const json: KeyPointGetResponse = response.json() as KeyPointGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.keys(json.data)).toStrictEqual(ids);
    expect(Object.values(json.data)).toStrictEqual([
      {type: 'strength', description: 'CHT S1'},
      {type: 'weakness', description: 'CHT W1'},
      {type: 'weakness', description: 'CHT W2'},
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

    const response = await app.app.inject().get(ApiEndPoints.TIER_KEY_POINTS).query({
      uid: '',
      lang: SupportedLanguages.CHT,
    });
    expect(response.statusCode).toBe(200);

    const json: KeyPointGetResponse = response.json() as KeyPointGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.keys(json.data)).toStrictEqual(ids);
    expect(Object.values(json.data)).toStrictEqual([
      {type: 'strength', description: 'CHT S1'},
      {type: 'weakness', description: 'CHT W1'},
      {type: 'weakness', description: 'EN W2'},
    ]);
  });
});
