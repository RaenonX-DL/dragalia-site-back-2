import {
  ApiEndPoints,
  ApiResponseCode,
  CharaAnalysisPublishPayload,
  PostPageMetaResponse,
  PostType,
  QuestPostPublishPayload,
  SupportedLanguages,
  UnitType,
} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {AnalysisController} from '../../post/analysis/controller';
import {QuestPostController} from '../../post/quest/controller';
import {GoogleUserController} from '../../userControl/controller';
import {GoogleUser, GoogleUserDocumentKey} from '../../userControl/model';

describe(`[Server] GET ${ApiEndPoints.PAGE_META_POST} - post page meta`, () => {
  let app: Application;

  const uidNormal = 'uidNormal';
  const uidAdsFree = 'uidAdsFree';
  const uidAdmin = 'uidAdmin';

  const payloadQuest: QuestPostPublishPayload = {
    googleUid: 'uid',
    seqId: 1,
    lang: SupportedLanguages.EN,
    title: 'post',
    general: 'general',
    video: 'video',
    positional: [
      {
        position: 'pos1',
        builds: 'build1',
        rotations: 'rot1',
        tips: 'tip1',
      },
      {
        position: 'pos2',
        builds: 'build2',
        rotations: 'rot2',
        tips: 'tip2',
      },
    ],
    addendum: 'addendum',
  };

  const payloadAnalysis: CharaAnalysisPublishPayload = {
    googleUid: uidAdmin,
    type: UnitType.CHARACTER,
    lang: SupportedLanguages.EN,
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
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadAnalysis);
    await QuestPostController.publishPost(app.mongoClient, payloadQuest);
  });

  afterAll(async () => {
    await app.close();
  });

  test('the return is correct for admin users', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_POST).query({
      googleUid: uidAdmin,
      lang: SupportedLanguages.EN,
      postId: payloadAnalysis.unitId,
      postType: PostType.ANALYSIS,
    });
    expect(response.statusCode).toBe(200);

    const json: PostPageMetaResponse = response.json() as PostPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
    expect(json.showAds).toBe(true);
  });

  test('the return is correct for ads-free users', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_POST).query({
      googleUid: uidAdsFree,
      lang: SupportedLanguages.EN,
      postId: payloadAnalysis.unitId,
      postType: PostType.ANALYSIS,
    });
    expect(response.statusCode).toBe(200);

    const json: PostPageMetaResponse = response.json() as PostPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.showAds).toBe(false);
  });

  test('the return is correct for normal users', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_POST).query({
      googleUid: uidNormal,
      lang: SupportedLanguages.EN,
      postId: payloadAnalysis.unitId,
      postType: PostType.ANALYSIS,
    });
    expect(response.statusCode).toBe(200);

    const json: PostPageMetaResponse = response.json() as PostPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.showAds).toBe(true);
  });

  test('the return is correct without user ID', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_POST).query({
      googleUid: '',
      lang: SupportedLanguages.EN,
      postId: payloadAnalysis.unitId,
      postType: PostType.ANALYSIS,
    });
    expect(response.statusCode).toBe(200);

    const json: PostPageMetaResponse = response.json() as PostPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.showAds).toBe(true);
  });

  it('returns unit name as analysis meta if unit info exists', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_POST).query({
      googleUid: '',
      lang: SupportedLanguages.EN,
      postId: payloadAnalysis.unitId,
      postType: PostType.ANALYSIS,
    });
    expect(response.statusCode).toBe(200);

    const json: PostPageMetaResponse = response.json() as PostPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.params).toStrictEqual({
      title: 'Gala Leonidas',
      description: payloadAnalysis.summary,
    });
  });

  it('returns not exists if unit info does not exist', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_POST).query({
      googleUid: '',
      lang: SupportedLanguages.EN,
      postId: 888,
      postType: PostType.ANALYSIS,
    });
    expect(response.statusCode).toBe(200);

    const json: PostPageMetaResponse = response.json() as PostPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_EXISTS);
    expect(json.success).toBeFalsy();
  });

  test('getting analysis does not increase view count', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_POST).query({
      googleUid: '',
      lang: SupportedLanguages.EN,
      postId: payloadAnalysis.unitId,
      postType: PostType.ANALYSIS,
    });
    expect(response.statusCode).toBe(200);

    const post = await AnalysisController.getAnalysis(
      app.mongoClient, payloadAnalysis.unitId, SupportedLanguages.EN, false,
    );

    expect(post?.post[ViewCountableDocumentKey.viewCount]).toBe(0);
  });

  it('returns correct quest meta', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_POST).query({
      googleUid: '',
      lang: SupportedLanguages.EN,
      postId: 1,
      postType: PostType.QUEST,
    });
    expect(response.statusCode).toBe(200);

    const json: PostPageMetaResponse = response.json() as PostPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.params).toStrictEqual({
      title: payloadQuest.title,
      description: payloadQuest.general,
    });
  });

  test('getting quest does not increase view count', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_POST).query({
      googleUid: '',
      lang: SupportedLanguages.EN,
      postId: 1,
      postType: PostType.QUEST,
    });
    expect(response.statusCode).toBe(200);

    const post = await QuestPostController.getQuestPost(app.mongoClient, 1, SupportedLanguages.EN, false);

    expect(post?.post[ViewCountableDocumentKey.viewCount]).toBe(0);
  });

  it('fails if the post does not exist', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_POST).query({
      googleUid: '',
      lang: SupportedLanguages.EN,
      postId: 88888888,
      postType: PostType.QUEST,
    });
    expect(response.statusCode).toBe(200);

    const json: PostPageMetaResponse = response.json() as PostPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_EXISTS);
    expect(json.success).toBeFalsy();
  });

  it('returns meta if the post exists in alt language', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_POST).query({
      googleUid: '',
      lang: SupportedLanguages.CHT,
      postId: 1,
      postType: PostType.QUEST,
    });
    expect(response.statusCode).toBe(200);

    const json: PostPageMetaResponse = response.json() as PostPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.params).toStrictEqual({
      title: payloadQuest.title,
      description: payloadQuest.general,
    });
  });
});
