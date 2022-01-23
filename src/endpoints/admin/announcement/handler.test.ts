import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../../test/data/user';
import {
  ApiEndPoints,
  ApiResponseCode,
  FailedResponse,
  PostType,
  SiteAnnouncementResponse,
  SubscriptionKey,
  SupportedLanguages,
} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {SubscriptionRecord, SubscriptionRecordDocumentKey} from '../../../thirdparty/mail/data/subscription/model';


describe('Site announcement handler', () => {
  let app: Application;

  let uidNormal: ObjectId;
  let uidAdmin: ObjectId;

  const subKeys: SubscriptionKey[] = [
    {type: 'const', name: 'ANNOUNCEMENT'},
    {type: 'post', postType: PostType.QUEST, id: 7},
  ];

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();

    uidNormal = await insertMockUser(app.mongoClient, {isAdmin: false, lang: SupportedLanguages.CHT});
    uidAdmin = await insertMockUser(app.mongoClient, {isAdmin: true, lang: SupportedLanguages.CHT});
    await (await SubscriptionRecord.getCollection(app.mongoClient)).insertMany(subKeys.map((subKey) => ({
      [SubscriptionRecordDocumentKey.key]: subKey,
      [SubscriptionRecordDocumentKey.uid]: uidAdmin,
    })));
  });

  afterAll(async () => {
    await app.close();
  });

  it('does not send out site announcement if the user is not an admin', async () => {
    const result = await app.app.inject().post(ApiEndPoints.ADMIN_SEND_ANNOUNCEMENT).payload({
      uid: uidNormal,
      lang: SupportedLanguages.CHT,
      markdownBase64: Buffer.from('Test markdown').toString('base64url'),
    });
    expect(result.statusCode).toBe(403);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
    expect(json.success).toBe(false);
  });

  it('sends the announcement if the user is an admin', async () => {
    const result = await app.app.inject().post(ApiEndPoints.ADMIN_SEND_ANNOUNCEMENT).payload({
      uid: uidAdmin,
      lang: SupportedLanguages.CHT,
      markdownBase64: Buffer.from('Test markdown').toString('base64url'),
    });
    expect(result.statusCode).toBe(200);

    const json: SiteAnnouncementResponse = result.json() as SiteAnnouncementResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.result.accepted).toStrictEqual(['fake@email.com']);
  });
});
