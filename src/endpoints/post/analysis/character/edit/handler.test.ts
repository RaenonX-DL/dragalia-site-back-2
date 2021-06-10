import {
  AnalysisEditResponse,
  ApiEndPoints,
  ApiResponseCode,
  CharaAnalysisEditPayload,
  CharaAnalysisPublishPayload,
  FailedResponse,
  SupportedLanguages,
  UnitType,
} from '../../../../../api-def/api';
import {Application, createApp} from '../../../../../app';
import {UserController} from '../../../../userControl/controller';
import {User, UserDocumentKey} from '../../../../userControl/model';
import {AnalysisController} from '../../controller';


describe(`[Server] POST ${ApiEndPoints.POST_ANALYSIS_EDIT_CHARA} - edit a character analysis`, () => {
  let app: Application;

  const uidAdmin = '78787878887';
  const uidNormal = '1234567890';
  const uidAdsFree = '789123456';

  const payloadPost: CharaAnalysisPublishPayload = {
    uid: uidAdmin,
    type: UnitType.CHARACTER,
    lang: SupportedLanguages.CHT,
    unitId: 10950101,
    summary: 'sum1',
    summonResult: 'smn1',
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
    videos: 'videoNew',
    skills: [],
    editNote: 'mod',
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await UserController.userLogin(
      app.mongoClient, uidNormal, 'normal@email.com',
    );
    await UserController.userLogin(
      app.mongoClient, uidAdmin, 'admin@email.com', true,
    );
    await UserController.userLogin(
      app.mongoClient, uidAdsFree, 'adsFree@email.com',
    );
    await User.getCollection(app.mongoClient).updateOne(
      {[UserDocumentKey.userId]: uidAdsFree},
      {$set: {[UserDocumentKey.adsFreeExpiry]: new Date(new Date().getTime() + 20000)}},
    );
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadPost);
  });

  afterAll(async () => {
    await app.close();
  });

  it('edits', async () => {
    const result = await app.app.inject().post(ApiEndPoints.POST_ANALYSIS_EDIT_CHARA).payload(payloadEdit);
    expect(result.statusCode).toBe(200);

    const json: AnalysisEditResponse = result.json() as AnalysisEditResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.unitId).toBe(payloadEdit.unitId);
  });

  it('returns success even if no change', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_ANALYSIS_EDIT_CHARA)
      .payload({...payloadPost, editNote: 'a'});
    expect(result.statusCode).toBe(200);

    const json: AnalysisEditResponse = result.json() as AnalysisEditResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.unitId).toBe(payloadEdit.unitId);
  });

  it('fails if unit ID is not given', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_ANALYSIS_EDIT_CHARA)
      .payload({...payloadEdit, unitId: undefined});
    expect(result.statusCode).toBe(400);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_UNIT_ID_NOT_SPECIFIED);
    expect(json.success).toBe(false);
  });

  it('fails for non-existing post ID & language', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_ANALYSIS_EDIT_CHARA)
      .payload({...payloadEdit, unitId: 10950102, lang: SupportedLanguages.CHT});
    expect(result.statusCode).toBe(404);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('fails when permission insufficient', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_ANALYSIS_EDIT_CHARA)
      .payload({...payloadEdit, uid: uidNormal});
    expect(result.statusCode).toBe(401);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
    expect(json.success).toBe(false);
  });
});
