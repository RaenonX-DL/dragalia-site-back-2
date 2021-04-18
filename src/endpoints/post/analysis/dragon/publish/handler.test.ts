import {default as request} from 'supertest';

import {
  ApiEndPoints,
  DragonAnalysisPublishSuccessResponse,
  DragonAnalysisPublishPayload,
  FailedResponse,
} from '../../../../../api-def/api';
import {ApiResponseCode} from '../../../../../api-def/api/responseCode';
import {Application, createApp} from '../../../../../app';
import {MultiLingualDocumentKey} from '../../../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../../../base/model/seq';
import {GoogleUserController} from '../../../../userControl/controller';
import {PostDocumentKey} from '../../../base/model';
import {DragonAnalysis, DragonAnalysisDocument} from '../../model/dragon';


describe(`[Server] POST ${ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON} - dragon analysis publishing endpoint`, () => {
  let app: Application;

  const uidNormal = '87878787877';
  const uidAdmin = '78787878887';

  const payload1: DragonAnalysisPublishPayload = {
    googleUid: uidAdmin,
    lang: 'cht',
    name: 'dragon',
    summary: 'dragonSummary',
    summon: 'dragonSummon',
    normalAttacks: 'dragonNormal',
    ultimate: 'dragonUltimate',
    passives: 'dragonPassive',
    notes: 'dragonNotes',
    suitableCharacters: 'dragonChara',
    videos: 'dragonVideo',
    story: 'dragonStory',
    keywords: 'dragonKeyword',
  };

  const payload2: DragonAnalysisPublishPayload = {
    ...payload1,
    googleUid: uidAdmin,
  };

  const payload3: DragonAnalysisPublishPayload = {
    ...payload2,
    seqId: 7,
  };

  const payload4: DragonAnalysisPublishPayload = {
    ...payload2,
    lang: 'en',
  };

  const payload5: DragonAnalysisPublishPayload = {
    ...payload1,
    name: 'chara6',
  };

  const payload6: DragonAnalysisPublishPayload = {
    ...payload2,
    seqId: 1,
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await GoogleUserController.userLogin(
      app.mongoClient, uidNormal, 'normal@email.com',
    );
    await GoogleUserController.userLogin(
      app.mongoClient, uidAdmin, 'admin@email.com', true,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes a new character analysis', async () => {
    const result = await request(app.express).post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).query(payload2);
    expect(result.status).toBe(200);

    const json: DragonAnalysisPublishSuccessResponse = result.body as DragonAnalysisPublishSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('publishes a new quest post given an alternative language', async () => {
    const result = await request(app.express).post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).query(payload4);
    expect(result.status).toBe(200);

    const json: DragonAnalysisPublishSuccessResponse = result.body as DragonAnalysisPublishSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('publishes a new quest post given a valid unused sequential ID', async () => {
    const result = await request(app.express).post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).query(payload6);
    expect(result.status).toBe(200);

    const json: DragonAnalysisPublishSuccessResponse = result.body as DragonAnalysisPublishSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('blocks publishing a quest post with insufficient permission', async () => {
    const result = await request(app.express).post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).query(
      {...payload1, googleUid: uidNormal},
    );
    expect(result.status).toBe(200);

    const json: FailedResponse = result.body as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
    expect(json.success).toBe(false);
  });

  it('blocks publishing a quest post with skipping sequential ID', async () => {
    const result = await request(app.express).post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).query(payload3);
    expect(result.status).toBe(200);

    const json: FailedResponse = result.body as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_PUBLISHED_ID_SKIPPED);
    expect(json.success).toBe(false);
  });

  it('blocks publishing a quest post with duplicated ID and language', async () => {
    await request(app.express).post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).query(payload6);

    const result = await request(app.express).post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).query(payload6);
    expect(result.status).toBe(200);

    const json: FailedResponse = result.body as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_ALREADY_EXISTS);
    expect(json.success).toBe(false);
  });

  test('if the published quest post exists in the database', async () => {
    await request(app.express).post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).query(payload2);

    const docQuery = await DragonAnalysis.getCollection(await app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: payload2.lang,
    });
    const doc = DragonAnalysis.fromDocument(docQuery as DragonAnalysisDocument);
    expect(doc).not.toBeFalsy();
    expect(doc.seqId).toEqual(1);
    expect(doc.language).toEqual(payload2.lang);
    expect(doc.title).toEqual(payload2.name);
    expect(doc.summary).toEqual(payload2.summary);
    expect(doc.summonResult).toEqual(payload2.summon);
    expect(doc.passives).toEqual(payload2.passives);
    expect(doc.normalAttacks).toEqual(payload2.normalAttacks);
    expect(doc.ultimate).toEqual(payload2.ultimate);
    expect(doc.notes).toEqual(payload2.notes);
    expect(doc.videos).toEqual(payload2.videos);
    expect(doc.story).toEqual(payload2.story);
    expect(doc.keywords).toEqual(payload2.keywords);
    expect(doc.datePublished.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.dateModified.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.modificationNotes).toHaveLength(0);
    expect(doc.viewCount).toEqual(0);
  });

  test('if the data is unchanged after a failed request', async () => {
    // Admin & new post
    await request(app.express).post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).query(payload2);
    // Normal & change title (expect to fail)
    await request(app.express).post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).query(payload5);

    const docQuery = await DragonAnalysis.getCollection(await app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: payload2.lang,
      [PostDocumentKey.title]: payload2.name,
    });
    const doc = DragonAnalysis.fromDocument(docQuery as DragonAnalysisDocument);
    expect(doc).not.toBeFalsy();
    expect(doc.seqId).toEqual(1);
    expect(doc.language).toEqual(payload2.lang);
    expect(doc.title).toEqual(payload2.name);
    expect(doc.summary).toEqual(payload2.summary);
    expect(doc.summonResult).toEqual(payload2.summon);
    expect(doc.passives).toEqual(payload2.passives);
    expect(doc.normalAttacks).toEqual(payload2.normalAttacks);
    expect(doc.ultimate).toEqual(payload2.ultimate);
    expect(doc.notes).toEqual(payload2.notes);
    expect(doc.videos).toEqual(payload2.videos);
    expect(doc.story).toEqual(payload2.story);
    expect(doc.keywords).toEqual(payload2.keywords);
    expect(doc.datePublished.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.dateModified.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.modificationNotes).toHaveLength(0);
    expect(doc.viewCount).toEqual(0);
  });
});