import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../../../../test/data/user';
import {
  AnalysisPublishResponse,
  ApiEndPoints,
  ApiResponseCode,
  DragonAnalysisPublishPayload,
  FailedResponse,
  SupportedLanguages,
  UnitType,
} from '../../../../../api-def/api';
import {Application, createApp} from '../../../../../app';
import {MultiLingualDocumentKey} from '../../../../../base/model/multiLang';
import {DragonAnalysis, DragonAnalysisDocument} from '../../model/dragon';
import {UnitAnalysisDocumentKey} from '../../model/unitAnalysis';


describe(`[Server] POST ${ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON} - publish dragon analysis`, () => {
  let app: Application;

  const uidNormal = new ObjectId().toHexString();
  const uidAdmin = new ObjectId().toHexString();

  const payload1: DragonAnalysisPublishPayload = {
    uid: uidNormal,
    type: UnitType.DRAGON,
    lang: SupportedLanguages.CHT,
    unitId: 20040405,
    summary: 'dragonSummary',
    summonResult: 'dragonSummon',
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
    uid: uidAdmin,
  };

  const payload4: DragonAnalysisPublishPayload = {
    ...payload2,
    lang: SupportedLanguages.EN,
  };

  const payload5: DragonAnalysisPublishPayload = {
    ...payload1,
    unitId: 99,
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidNormal)});
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidAdmin), isAdmin: true});
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes', async () => {
    const result = await app.app.inject().post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).payload(payload2);
    expect(result.statusCode).toBe(200);

    const json: AnalysisPublishResponse = result.json() as AnalysisPublishResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.unitId).toBe(payload2.unitId);
  });

  it('publishes given an alternative language', async () => {
    const result = await app.app.inject().post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).payload(payload4);
    expect(result.statusCode).toBe(200);

    const json: AnalysisPublishResponse = result.json() as AnalysisPublishResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.unitId).toBe(payload2.unitId);
  });

  it('blocks publishing with insufficient permission', async () => {
    const result = await app.app.inject().post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).payload(payload1);
    expect(result.statusCode).toBe(200);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
    expect(json.success).toBe(false);
  });

  it('blocks publishing with non-existing unit ID', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON)
      .payload({...payload2, unitId: 7});
    expect(result.statusCode).toBe(200);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_UNIT_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('blocks publishing with duplicated unit ID and language', async () => {
    await app.app.inject().post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).payload(payload2);

    const result = await app.app.inject().post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).payload(payload2);
    expect(result.statusCode).toBe(200);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_ALREADY_EXISTS);
    expect(json.success).toBe(false);
  });

  it('blocks publishing with wrong type of analysis', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON)
      .payload({...payload2, unitId: 10950101});
    expect(result.statusCode).toBe(200);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_WRONG_ANALYSIS_TYPE);
    expect(json.success).toBe(false);
  });

  it('blocks publishing with `seqId` in the payload key', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON)
      .payload({...payload2, seqId: 87});
    expect(result.statusCode).toBe(200);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_PAYLOAD_KEY_DEPRECATED);
    expect(json.success).toBe(false);
  });

  test('if the published analysis exists in the database', async () => {
    await app.app.inject().post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).payload(payload2);

    const docQuery = await DragonAnalysis.getCollection(await app.mongoClient).findOne({
      [UnitAnalysisDocumentKey.unitId]: payload2.unitId,
      [MultiLingualDocumentKey.language]: payload2.lang,
    });
    const doc = DragonAnalysis.fromDocument(docQuery as DragonAnalysisDocument);
    expect(doc).not.toBeFalsy();
    expect(doc.lang).toEqual(payload2.lang);
    expect(doc.unitId).toEqual(payload2.unitId);
    expect(doc.summary).toEqual(payload2.summary);
    expect(doc.summonResult).toEqual(payload2.summonResult);
    expect(doc.passives).toEqual(payload2.passives);
    expect(doc.normalAttacks).toEqual(payload2.normalAttacks);
    expect(doc.ultimate).toEqual(payload2.ultimate);
    expect(doc.notes).toEqual(payload2.notes);
    expect(doc.videos).toEqual(payload2.videos);
    expect(doc.story).toEqual(payload2.story);
    expect(doc.keywords).toEqual(payload2.keywords);
    expect(doc.datePublishedEpoch.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.dateModifiedEpoch.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.editNotes).toHaveLength(0);
    expect(doc.viewCount).toEqual(0);
  });

  test('if the data is unchanged after a failed request', async () => {
    // Admin & new post
    await app.app.inject().post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).payload(payload2);
    // Normal & change unit ID (expect to fail)
    await app.app.inject().post(ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON).payload(payload5);

    const docQuery = await DragonAnalysis.getCollection(await app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: payload2.lang,
      [UnitAnalysisDocumentKey.unitId]: payload2.unitId,
    });
    const doc = DragonAnalysis.fromDocument(docQuery as DragonAnalysisDocument);
    expect(doc).not.toBeFalsy();
    expect(doc.lang).toEqual(payload2.lang);
    expect(doc.unitId).toEqual(payload2.unitId);
    expect(doc.summary).toEqual(payload2.summary);
    expect(doc.summonResult).toEqual(payload2.summonResult);
    expect(doc.passives).toEqual(payload2.passives);
    expect(doc.normalAttacks).toEqual(payload2.normalAttacks);
    expect(doc.ultimate).toEqual(payload2.ultimate);
    expect(doc.notes).toEqual(payload2.notes);
    expect(doc.videos).toEqual(payload2.videos);
    expect(doc.story).toEqual(payload2.story);
    expect(doc.keywords).toEqual(payload2.keywords);
    expect(doc.datePublishedEpoch.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.dateModifiedEpoch.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.editNotes).toHaveLength(0);
    expect(doc.viewCount).toEqual(0);
  });
});
