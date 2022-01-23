import {
  ApiEndPoints,
  ApiResponseCode,
  SupportedLanguages,
  UnitTierNoteSingleResponse,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {TierNote, UnitTierNote} from '../model';


describe('Single unit tier note handler', () => {
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

  it('returns null if no corresponding tier note available yet', async () => {
    const response = await app.app.inject().get(ApiEndPoints.TIER_UNIT).query({
      uid: '',
      lang: SupportedLanguages.CHT,
      unitId: 10950101,
    });
    expect(response.statusCode).toBe(200);

    const json: UnitTierNoteSingleResponse = response.json() as UnitTierNoteSingleResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.data).toStrictEqual(null);
  });

  it('returns data in specified language', async () => {
    const dataArray = [
      new UnitTierNote({
        unitId: 10950101,
        points: [],
        tier: {conAi: new TierNote({ranking: 'S', note: {[SupportedLanguages.CHT]: 'A'}, isCompDependent: true})},
        lastUpdateEpoch: 0,
      }),
    ].map((entry) => entry.toObject());
    await (await UnitTierNote.getCollection(app.mongoClient)).insertMany(dataArray);

    const response = await app.app.inject().get(ApiEndPoints.TIER_UNIT).query({
      uid: '',
      lang: SupportedLanguages.CHT,
      unitId: 10950101,
    });
    expect(response.statusCode).toBe(200);

    const json: UnitTierNoteSingleResponse = response.json() as UnitTierNoteSingleResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.data).toStrictEqual({
      points: [],
      tier: {conAi: {ranking: 'S', note: 'A', isCompDependent: true}},
      lastUpdateEpoch: 0,
    });
  });

  it('returns data in alternative language if desired one does not exist', async () => {
    const dataArray = [
      new UnitTierNote({
        unitId: 10950101,
        points: [],
        tier: {conAi: new TierNote({ranking: 'S', note: {[SupportedLanguages.CHT]: 'A'}, isCompDependent: true})},
        lastUpdateEpoch: 0,
      }),
    ].map((entry) => entry.toObject());
    await (await UnitTierNote.getCollection(app.mongoClient)).insertMany(dataArray);

    const response = await app.app.inject().get(ApiEndPoints.TIER_UNIT).query({
      uid: '',
      lang: SupportedLanguages.EN,
      unitId: 10950101,
    });
    expect(response.statusCode).toBe(200);

    const json: UnitTierNoteSingleResponse = response.json() as UnitTierNoteSingleResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.data).toStrictEqual({
      points: [],
      tier: {conAi: {ranking: 'S', note: 'A', isCompDependent: true}},
      lastUpdateEpoch: 0,
    });
  });
});
