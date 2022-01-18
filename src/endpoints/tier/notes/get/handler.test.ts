import {
  ApiEndPoints,
  ApiResponseCode,
  UnitTierNoteGetResponse,
  SupportedLanguages,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {TierNote, UnitTierNote} from '../model';


describe('Tier note getting handler', () => {
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

  it('returns empty object if no data', async () => {
    const response = await app.app.inject().get(ApiEndPoints.TIER_NOTES).query({
      uid: '',
      lang: SupportedLanguages.CHT,
    });
    expect(response.statusCode).toBe(200);

    const json: UnitTierNoteGetResponse = response.json() as UnitTierNoteGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.data).toStrictEqual({});
  });

  it('returns data in specified language', async () => {
    const dataArray = [
      new UnitTierNote({
        unitId: 10950101,
        points: [],
        tier: {
          conAi: new TierNote({
            ranking: 'S', note: {[SupportedLanguages.CHT]: 'A', [SupportedLanguages.EN]: 'B'}, isCompDependent: true,
          }),
        },
        lastUpdateEpoch: 0,
      }),
      new UnitTierNote({
        unitId: 10950102,
        points: ['idA'],
        tier: {
          conAi: new TierNote({
            ranking: 'A', note: {[SupportedLanguages.CHT]: 'C'}, isCompDependent: false,
          }),
        },
        lastUpdateEpoch: 1,
      }),
    ].map((entry) => entry.toObject());
    await (await UnitTierNote.getCollection(app.mongoClient)).insertMany(dataArray);

    const response = await app.app.inject().get(ApiEndPoints.TIER_NOTES).query({
      uid: '',
      lang: SupportedLanguages.CHT,
    });
    expect(response.statusCode).toBe(200);

    const json: UnitTierNoteGetResponse = response.json() as UnitTierNoteGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.keys(json.data)).toStrictEqual(['10950101', '10950102']);
    expect(Object.values(json.data)).toStrictEqual([
      {
        points: [],
        tier: {conAi: {ranking: 'S', note: 'A', isCompDependent: true}},
        lastUpdateEpoch: 0,
      },
      {
        points: ['idA'],
        tier: {conAi: {ranking: 'A', note: 'C', isCompDependent: false}},
        lastUpdateEpoch: 1,
      },
    ]);
  });

  it('returns data in alternative language if desired one does not exist', async () => {
    const dataArray = [
      new UnitTierNote({
        unitId: 10950101,
        points: [],
        tier: {
          conAi: new TierNote({
            ranking: 'S', note: {[SupportedLanguages.CHT]: 'A', [SupportedLanguages.EN]: 'B'}, isCompDependent: true,
          }),
        },
        lastUpdateEpoch: 0,
      }),
      new UnitTierNote({
        unitId: 10950102,
        points: ['idA'],
        tier: {
          conAi: new TierNote({
            ranking: 'A', note: {[SupportedLanguages.CHT]: 'C'}, isCompDependent: false,
          }),
        },
        lastUpdateEpoch: 1,
      }),
    ].map((entry) => entry.toObject());
    await (await UnitTierNote.getCollection(app.mongoClient)).insertMany(dataArray);

    const response = await app.app.inject().get(ApiEndPoints.TIER_NOTES).query({
      uid: '',
      lang: SupportedLanguages.EN,
    });
    expect(response.statusCode).toBe(200);

    const json: UnitTierNoteGetResponse = response.json() as UnitTierNoteGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.keys(json.data)).toStrictEqual(['10950101', '10950102']);
    expect(Object.values(json.data)).toStrictEqual([
      {
        points: [],
        tier: {conAi: {ranking: 'S', note: 'B', isCompDependent: true}},
        lastUpdateEpoch: 0,
      },
      {
        points: ['idA'],
        tier: {conAi: {ranking: 'A', note: 'C', isCompDependent: false}},
        lastUpdateEpoch: 1,
      },
    ]);
  });
});
