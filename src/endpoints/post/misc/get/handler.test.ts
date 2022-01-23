import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../../../test/data/user';
import {
  ApiEndPoints,
  ApiResponseCode,
  FailedResponse,
  MiscPostGetPayload,
  MiscPostGetResponse,
  MiscPostPublishPayload,
  SupportedLanguages,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {MiscPostController} from '../controller';


describe(`Misc post getting EP`, () => {
  let app: Application;

  const uidNormal = new ObjectId().toHexString();
  const uidAdsFree = new ObjectId().toHexString();
  const uidAdmin = new ObjectId().toHexString();

  const payloadGet: MiscPostGetPayload = {
    seqId: 1,
    uid: uidNormal,
    lang: SupportedLanguages.CHT,
  };

  const payloadPost: MiscPostPublishPayload = {
    uid: uidAdmin,
    lang: SupportedLanguages.CHT,
    title: 'post',
    sections: [
      {
        title: 'A',
        content: 'A1',
      },
      {
        title: 'B',
        content: 'B1',
      },
    ],
    sendUpdateEmail: true,
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidNormal)});
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidAdsFree), isAdsFree: true});
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidAdmin), isAdmin: true});
  });

  afterAll(async () => {
    await app.close();
  });

  it('gets an existed post given language and the sequential ID', async () => {
    await MiscPostController.publishPost(app.mongoClient, payloadPost);

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: MiscPostGetResponse = result.json() as MiscPostGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(false);
    expect(json.seqId).toBe(1);
    expect(json.lang).toBe(SupportedLanguages.CHT);
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(json.publishedEpoch).toEqual(expect.any(Number));
    expect(json.modifiedEpoch).toEqual(expect.any(Number));
  });

  it('gets an existed post which has an alt version only given sequential ID', async () => {
    await MiscPostController.publishPost(app.mongoClient, {...payloadPost, lang: SupportedLanguages.EN});

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: MiscPostGetResponse = result.json() as MiscPostGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(true);
    expect(json.seqId).toBe(1);
    expect(json.lang).toBe(SupportedLanguages.EN);
  });

  test('timestamp of edited post is using epoch', async () => {
    const {seqId} = await MiscPostController.publishPost(app.mongoClient, payloadPost);
    await MiscPostController.editMiscPost(app.mongoClient, {...payloadPost, seqId, title: 'TT', editNote: 'edit'});

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: MiscPostGetResponse = result.json() as MiscPostGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(false);
    expect(json.seqId).toBe(1);
    expect(json.lang).toBe(SupportedLanguages.CHT);
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(json.publishedEpoch).toEqual(expect.any(Number));
    expect(json.modifiedEpoch).toEqual(expect.any(Number));
    expect(json.editNotes.length).toBe(1);
    expect(json.editNotes[0].timestampEpoch).toEqual(expect.any(Number));
  });

  it('returns all available languages except the current one', async () => {
    await MiscPostController.publishPost(app.mongoClient, {...payloadPost, seqId: 1, lang: SupportedLanguages.EN});
    await MiscPostController.publishPost(app.mongoClient, {...payloadPost, seqId: 1, lang: SupportedLanguages.CHT});
    await MiscPostController.publishPost(app.mongoClient, {...payloadPost, seqId: 1, lang: SupportedLanguages.JP});

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: MiscPostGetResponse = result.json() as MiscPostGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(false);
    expect(json.seqId).toBe(1);
    expect(json.lang).toBe(SupportedLanguages.CHT);
    expect(json.otherLangs).toStrictEqual([SupportedLanguages.EN, SupportedLanguages.JP]);
  });

  it('fails for non-existing post', async () => {
    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payloadGet);
    expect(result.statusCode).toBe(404);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('fails if sequence ID is not specified', async () => {
    const {seqId, ...payload} = payloadGet;

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payload);
    expect(result.statusCode).toBe(400);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_ID_NOT_SPECIFIED);
    expect(json.success).toBe(false);
  });

  it('indicates that the user has the admin privilege', async () => {
    await MiscPostController.publishPost(app.mongoClient, payloadPost);

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(
      {...payloadGet, uid: uidAdmin},
    );
    expect(result.statusCode).toBe(200);

    const json: MiscPostGetResponse = result.json() as MiscPostGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
  });

  it('increments view count per request', async () => {
    await MiscPostController.publishPost(app.mongoClient, payloadPost);

    await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payloadGet);
    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: MiscPostGetResponse = result.json() as MiscPostGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.viewCount).toBe(4);
  });

  it('increments view count per request on alternative version', async () => {
    await MiscPostController.publishPost(app.mongoClient, {...payloadPost, lang: SupportedLanguages.EN});

    await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payloadGet);
    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: MiscPostGetResponse = result.json() as MiscPostGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.lang).toBe(SupportedLanguages.EN);
    expect(json.viewCount).toBe(4);
  });
});
