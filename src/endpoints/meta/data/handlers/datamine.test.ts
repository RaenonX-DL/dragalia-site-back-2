import {ApiEndPoints, ApiResponseCode, DataPageMetaResponse, SupportedLanguages} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {AlertEntry, AlertEntryKey} from '../../alert/model';


describe('Data page meta handler - Datamine', () => {
  let app: Application;

  const dummyAlerts = [
    {
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
      [AlertEntryKey.message]: 'Alert 1',
      [AlertEntryKey.variant]: 'info',
    },
    {
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
      [AlertEntryKey.message]: 'Alert 2',
      [AlertEntryKey.variant]: 'warning',
    },
  ];

  const insertDummyAlerts = async () => {
    const col = AlertEntry.getCollection(app.mongoClient);
    await col.insertMany(dummyAlerts);
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();

    await insertDummyAlerts();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns correctly', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_DATA).query({
      uid: '',
      lang: SupportedLanguages.EN,
      type: 'datamine',
      id: 'ABC',
    });
    expect(response.statusCode).toBe(200);

    const json: DataPageMetaResponse = response.json() as DataPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.alerts).toStrictEqual(dummyAlerts
      .filter((alert) => alert[MultiLingualDocumentKey.language] === SupportedLanguages.EN)
      .map((doc) => AlertEntry.fromDocument(doc).toApiEntry()),
    );
    expect(json.params).toStrictEqual({versionCode: 'ABC'});
  });
});
