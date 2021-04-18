import {default as request} from 'supertest';

import {
  AnalysisEditSuccessResponse,
  ApiEndPoints, ApiResponseCode,
  CharaAnalysisEditPayload,
  CharaAnalysisPublishPayload,
  FailedResponse,
} from '../../../../../api-def/api';
import {Application, createApp} from '../../../../../app';
import {GoogleUserController} from '../../../../userControl/controller';
import {GoogleUser, GoogleUserDocumentKey} from '../../../../userControl/model';
import {AnalysisController} from '../../controller';


describe(`[Server] POST ${ApiEndPoints.POST_ANALYSIS_EDIT_CHARA} - edit a character analysis`, () => {
  let app: Application;

  const uidAdmin = '78787878887';
  const uidNormal = '1234567890';
  const uidAdsFree = '789123456';

  const payloadPost: CharaAnalysisPublishPayload = {
    googleUid: uidAdmin,
    seqId: 1,
    lang: 'cht',
    name: 'chara1',
    summary: 'sum1',
    summon: 'smn1',
    passives: 'passive1',
    forceStrikes: 'fs1',
    normalAttacks: 'na1',
    skills: [{
      name: 's1',
      info: 's1info',
      rotations: 's1rot',
      tips: 's1tips',
    }],
    tipsBuilds: 'tip1',
    videos: 'video1',
    story: 'story1',
    keywords: 'kw1',
  };

  const payloadEdit: CharaAnalysisEditPayload = {
    ...payloadPost,
    name: 'edit',
    videos: 'videoNew',
    skills: [],
    modifyNote: 'mod',
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
    await GoogleUserController.userLogin(
      app.mongoClient, uidAdsFree, 'adsFree@email.com',
    );
    await GoogleUser.getCollection(app.mongoClient).updateOne(
      {[GoogleUserDocumentKey.userId]: uidAdsFree},
      {$set: {[GoogleUserDocumentKey.adsFreeExpiry]: new Date(new Date().getTime() + 20000)}},
    );
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadPost);
  });

  afterAll(async () => {
    await app.close();
  });

  it('edits a post', async () => {
    const result = await request(app.express).post(ApiEndPoints.POST_ANALYSIS_EDIT_CHARA).query(payloadEdit);
    expect(result.status).toBe(200);

    const json: AnalysisEditSuccessResponse = result.body as AnalysisEditSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('returns success even if no change', async () => {
    const result = await request(app.express)
      .post(ApiEndPoints.POST_ANALYSIS_EDIT_CHARA)
      .query({...payloadPost, modifyNote: 'a'});
    expect(result.status).toBe(200);

    const json: AnalysisEditSuccessResponse = result.body as AnalysisEditSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('returns failure if ID is not given', async () => {
    const result = await request(app.express)
      .post(ApiEndPoints.POST_ANALYSIS_EDIT_CHARA)
      .query({...payloadEdit, seqId: undefined});
    expect(result.status).toBe(400);

    const json: FailedResponse = result.body as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_ID_NOT_SPECIFIED);
    expect(json.success).toBe(false);
  });

  it('returns failure for non-existing post ID & language', async () => {
    const result = await request(app.express)
      .post(ApiEndPoints.POST_ANALYSIS_EDIT_CHARA)
      .query({...payloadEdit, seqId: 8});
    expect(result.status).toBe(404);

    const json: FailedResponse = result.body as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('returns failure for non-existing post language', async () => {
    const result = await request(app.express)
      .post(ApiEndPoints.POST_ANALYSIS_EDIT_CHARA)
      .query({...payloadEdit, lang: 'jp'});
    expect(result.status).toBe(404);

    const json: FailedResponse = result.body as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('returns failure when permission insufficient', async () => {
    const result = await request(app.express)
      .post(ApiEndPoints.POST_ANALYSIS_EDIT_CHARA)
      .query({...payloadEdit, googleUid: uidNormal});
    expect(result.status).toBe(401);

    const json: FailedResponse = result.body as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
    expect(json.success).toBe(false);
  });
});
