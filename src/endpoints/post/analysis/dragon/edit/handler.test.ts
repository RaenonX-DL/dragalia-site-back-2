import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../../../../test/data/user';
import {
  AnalysisEditResponse,
  ApiEndPoints,
  ApiResponseCode,
  DragonAnalysisEditPayload,
  DragonAnalysisPublishPayload,
  FailedResponse,
  SupportedLanguages,
  UnitType,
} from '../../../../../api-def/api';
import {Application, createApp} from '../../../../../app';
import {AnalysisController} from '../../controller';


describe(`[Server] POST ${ApiEndPoints.POST_ANALYSIS_EDIT_DRAGON} - edit a dragon analysis`, () => {
  let app: Application;

  const uidNormal = new ObjectId().toHexString();
  const uidAdmin = new ObjectId().toHexString();

  const payloadPost: DragonAnalysisPublishPayload = {
    uid: uidAdmin,
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

  const payloadEdit: DragonAnalysisEditPayload = {
    ...payloadPost,
    videos: 'videoNew',
    suitableCharacters: '',
    editNote: 'mod',
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidNormal)});
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidAdmin), isAdmin: true});
    await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadPost);
  });

  afterAll(async () => {
    await app.close();
  });

  it('edits', async () => {
    const result = await app.app.inject().post(ApiEndPoints.POST_ANALYSIS_EDIT_DRAGON).payload(payloadEdit);
    expect(result.statusCode).toBe(200);

    const json: AnalysisEditResponse = result.json() as AnalysisEditResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.unitId).toBe(payloadEdit.unitId);
  });

  it('returns success even if no change', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_ANALYSIS_EDIT_DRAGON)
      .payload({...payloadPost, editNote: 'a'});
    expect(result.statusCode).toBe(200);

    const json: AnalysisEditResponse = result.json() as AnalysisEditResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.unitId).toBe(payloadEdit.unitId);
  });

  it('fails if ID is not given', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_ANALYSIS_EDIT_DRAGON)
      .payload({...payloadEdit, unitId: undefined});
    expect(result.statusCode).toBe(400);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_UNIT_ID_NOT_SPECIFIED);
    expect(json.success).toBe(false);
  });

  it('fails for non-existing post ID & language', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_ANALYSIS_EDIT_DRAGON)
      .payload({...payloadEdit, unitId: 20040102});
    expect(result.statusCode).toBe(404);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('fails when permission insufficient', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_ANALYSIS_EDIT_DRAGON)
      .payload({...payloadEdit, uid: uidNormal});
    expect(result.statusCode).toBe(403);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
    expect(json.success).toBe(false);
  });
});
