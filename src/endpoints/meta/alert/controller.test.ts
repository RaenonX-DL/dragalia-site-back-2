import {SupportedLanguages} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {AlertController} from './controller';
import {AlertEntry, AlertEntryKey} from './model';


describe('Alert controller', () => {
  let app: Application;

  const dummyAlerts = [
    {
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
      [AlertEntryKey.message]: 'Alert 1',
      [AlertEntryKey.variant]: 'info',
    },
    {
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
      [AlertEntryKey.message]: 'Alert 2',
      [AlertEntryKey.variant]: 'warning',
    },
    {
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
      [AlertEntryKey.message]: 'Alert 3',
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns an empty list if no alerts', async () => {
    let alerts = await AlertController.getSiteAlerts(app.mongoClient, SupportedLanguages.EN);
    expect(alerts).toStrictEqual([]);
    alerts = await AlertController.getSiteAlerts(app.mongoClient, SupportedLanguages.CHT);
    expect(alerts).toStrictEqual([]);
  });

  it('returns a list of alerts in correct language', async () => {
    await insertDummyAlerts();

    const alerts = (await AlertController.getSiteAlerts(app.mongoClient, SupportedLanguages.EN))
      .map((entry) => ({
        message: entry.message,
        variant: entry.variant,
      }));
    expect(alerts).toStrictEqual(dummyAlerts
      .filter((alert) => alert[MultiLingualDocumentKey.language] === SupportedLanguages.EN)
      .map((doc) => AlertEntry.fromDocument(doc).toApiEntry()),
    );
  });
});
