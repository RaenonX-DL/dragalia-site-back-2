import {mongoExecInTransaction} from '../../../../../test/utils/mongo';
import {
  ApiEndPoints,
  ApiResponseCode, FailedResponse,
  SupportedLanguages,
  UnitNameRefManageResponse,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {UnitNameRefEntry, UnitNameRefEntryDocumentKey} from '../model';


describe('Unit name reference update handler', () => {
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

  it('fails to update if the names are duplicated', async () => {
    const response = await app.app.inject().post(ApiEndPoints.MANAGE_UNIT_NAME_REF).payload({
      uid: '',
      lang: SupportedLanguages.EN,
      refs: [
        {unitId: 10950101, name: 'Unit 1'},
        {unitId: 10950201, name: 'Unit 1'},
      ],
    });
    expect(response.statusCode).toBe(200);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_UNIT_NAME_DUPLICATED);
    expect(json.success).toBe(false);
  });

  it('keeps the original name references if failed to update', async () => {
    const dataArray = [
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit A', unitId: 10950101}),
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit B', unitId: 10850101}),
    ].map((entry) => entry.toObject());
    await UnitNameRefEntry.getCollection(app.mongoClient).insertMany(dataArray);

    const response = await app.app.inject().post(ApiEndPoints.MANAGE_UNIT_NAME_REF).payload({
      uid: '',
      lang: SupportedLanguages.EN,
      refs: [
        {unitId: 10950101, name: 'Unit 1'},
        {unitId: 10950201, name: 'Unit 1'},
      ],
    });
    expect(response.statusCode).toBe(200);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_UNIT_NAME_DUPLICATED);
    expect(json.success).toBe(false);

    await mongoExecInTransaction(app.mongoClient, async () => {
      expect((await UnitNameRefEntry.getCollection(app.mongoClient).find().toArray()).length).toBe(2);
    });
  });

  it('updates even if multiple entries share the same unit', async () => {
    const response = await app.app.inject().post(ApiEndPoints.MANAGE_UNIT_NAME_REF).payload({
      uid: '',
      lang: SupportedLanguages.EN,
      refs: [
        {unitId: 10950101, name: 'Unit 1'},
        {unitId: 10950101, name: 'Unit 2'},
      ],
    });
    expect(response.statusCode).toBe(200);

    const json: UnitNameRefManageResponse = response.json() as UnitNameRefManageResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    await mongoExecInTransaction(app.mongoClient, async () => {
      const data = await UnitNameRefEntry.getCollection(app.mongoClient).find().toArray();
      expect(data.map((entry) => entry[UnitNameRefEntryDocumentKey.unitId]).sort()).toStrictEqual([10950101, 10950101]);
    });
  });

  it('accepts empty update unit name ref list', async () => {
    const response = await app.app.inject().post(ApiEndPoints.MANAGE_UNIT_NAME_REF).payload({
      uid: '',
      lang: SupportedLanguages.EN,
      refs: [],
    });
    expect(response.statusCode).toBe(200);

    const json: UnitNameRefManageResponse = response.json() as UnitNameRefManageResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    await mongoExecInTransaction(app.mongoClient, async () => {
      const data = await UnitNameRefEntry.getCollection(app.mongoClient).find().toArray();
      expect(data.map((entry) => entry[UnitNameRefEntryDocumentKey.name]).sort()).toStrictEqual([]);
    });
  });

  it('removes entries that are not contained in the update list', async () => {
    const dataArray = [
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit A', unitId: 10950101}),
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit 1', unitId: 10850101}),
    ].map((entry) => entry.toObject());
    await UnitNameRefEntry.getCollection(app.mongoClient).insertMany(dataArray);

    const response = await app.app.inject().post(ApiEndPoints.MANAGE_UNIT_NAME_REF).payload({
      uid: '',
      lang: SupportedLanguages.EN,
      refs: [
        {unitId: 10850101, name: 'Unit 1'},
        {unitId: 10950101, name: 'Unit 2'},
      ],
    });
    expect(response.statusCode).toBe(200);

    const json: UnitNameRefManageResponse = response.json() as UnitNameRefManageResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    await mongoExecInTransaction(app.mongoClient, async () => {
      const data = await UnitNameRefEntry.getCollection(app.mongoClient).find().toArray();
      expect(data.map((entry) => entry[UnitNameRefEntryDocumentKey.name]).sort()).toStrictEqual(['Unit 1', 'Unit 2']);
    });
  });

  it('updates the entries in the given language only', async () => {
    const dataArray = [
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit A', unitId: 10950101}),
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit B', unitId: 10850101}),
      new UnitNameRefEntry({lang: SupportedLanguages.CHT, name: 'Unit 1', unitId: 10850101}),
    ].map((entry) => entry.toObject());
    await UnitNameRefEntry.getCollection(app.mongoClient).insertMany(dataArray);

    const response = await app.app.inject().post(ApiEndPoints.MANAGE_UNIT_NAME_REF).payload({
      uid: '',
      lang: SupportedLanguages.EN,
      refs: [{
        unitId: 10850101,
        name: 'Unit C',
      }],
    });
    expect(response.statusCode).toBe(200);

    const json: UnitNameRefManageResponse = response.json() as UnitNameRefManageResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    await mongoExecInTransaction(app.mongoClient, async () => {
      const data = await UnitNameRefEntry.getCollection(app.mongoClient).find().toArray();
      expect(data.map((entry) => entry[UnitNameRefEntryDocumentKey.name]).sort()).toStrictEqual(['Unit 1', 'Unit C']);
    });
  });
});
