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
import {GoogleUserController} from '../../../../userControl/controller';
import {GoogleUser, GoogleUserDocumentKey} from '../../../../userControl/model';
import {AnalysisController} from '../../controller';


describe(`[Server] POST ${ApiEndPoints.POST_ANALYSIS_EDIT_DRAGON} - edit a dragon analysis`, () => {
  let app: Application;

  const uidAdmin = '78787878887';
  const uidNormal = '1234567890';
  const uidAdsFree = '789123456';

  const payloadPost: DragonAnalysisPublishPayload = {
    googleUid: uidAdmin,
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
      .payload({...payloadEdit, googleUid: uidNormal});
    expect(result.statusCode).toBe(401);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
    expect(json.success).toBe(false);
  });
});
