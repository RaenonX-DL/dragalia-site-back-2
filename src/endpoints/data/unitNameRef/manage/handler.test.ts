import {
  ApiEndPoints,
  ApiResponseCode,
  SupportedLanguages,
  UnitNameRefManageResponse,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {UnitNameRefEntry} from '../model';


describe('Unit name reference manage handler', () => {
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

  it('returns empty response if no data', async () => {
    const response = await app.app.inject().get(ApiEndPoints.MANAGE_UNIT_NAME_REF).query({
      uid: '',
      lang: SupportedLanguages.EN,
    });
    expect(response.statusCode).toBe(200);

    const json: UnitNameRefManageResponse = response.json() as UnitNameRefManageResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.refs).toStrictEqual([]);
  });

  it('returns entries in the given language only', async () => {
    const dataArray = [
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit', unitId: 10950101}),
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit 2', unitId: 10950101}),
      new UnitNameRefEntry({lang: SupportedLanguages.JP, name: 'Unit 3', unitId: 10850101}),
    ].map((entry) => entry.toObject());
    await (await UnitNameRefEntry.getCollection(app.mongoClient)).insertMany(dataArray);

    const response = await app.app.inject().get(ApiEndPoints.MANAGE_UNIT_NAME_REF).query({
      uid: '',
      lang: SupportedLanguages.EN,
    });
    expect(response.statusCode).toBe(200);

    const json: UnitNameRefManageResponse = response.json() as UnitNameRefManageResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.keys(json.refs).length).toBe(2);
  });

  it('returns empty response if no entries is in the given language', async () => {
    const dataArray = [
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit', unitId: 10950101}),
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit 2', unitId: 10950101}),
    ].map((entry) => entry.toObject());
    await (await UnitNameRefEntry.getCollection(app.mongoClient)).insertMany(dataArray);

    const response = await app.app.inject().get(ApiEndPoints.MANAGE_UNIT_NAME_REF).query({
      uid: '',
      lang: SupportedLanguages.JP,
    });
    expect(response.statusCode).toBe(200);

    const json: UnitNameRefManageResponse = response.json() as UnitNameRefManageResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.refs).toStrictEqual([]);
  });
});
