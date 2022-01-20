import {ObjectId} from 'mongodb';

import {periodicActiveData, periodicCountryData, periodicLangData} from '../../../../test/data/thirdparty/ga';
import {
  ApiEndPoints,
  ApiResponseCode,
  QuestPostPublishPayload,
  SupportedLanguages, HomepageLandingResponse, PostType,
} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import * as periodicActive from '../../../thirdparty/ga/data/periodicActive';
import * as periodicCountry from '../../../thirdparty/ga/data/periodicCountry';
import * as periodicTotal from '../../../thirdparty/ga/data/periodicTotal';
import {SubscriptionRecord, SubscriptionRecordDocumentKey} from '../../../thirdparty/mail/data/subscription/model';
import {QuestPostController} from '../../post/quest/controller';


describe(`Homepage landing info endpoint`, () => {
  let app: Application;

  const payload: QuestPostPublishPayload = {
    uid: 'uid',
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
    sendUpdateEmail: true,
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();

    jest.spyOn(periodicTotal, 'getPeriodicLanguageUser')
      .mockResolvedValue(periodicLangData);
    jest.spyOn(periodicCountry, 'getPeriodicCountryUser')
      .mockResolvedValue(periodicCountryData);
    jest.spyOn(periodicActive, 'getPeriodicActiveUser')
      .mockResolvedValue(periodicActiveData);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns at most 5 recently updated posts', async () => {
    for (let seqId = 1; seqId <= 7; seqId++) {
      await QuestPostController.publishPost(app.mongoClient, {...payload, seqId});
    }

    const result = await app.app.inject().get(ApiEndPoints.HOME).query({lang: SupportedLanguages.EN});
    expect(result.statusCode).toBe(200);

    const json: HomepageLandingResponse = result.json() as HomepageLandingResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.data.posts[PostType.QUEST].map((entry) => entry.pid)).toStrictEqual([7, 6, 5, 4, 3]);
  });

  it('returns site usage stats', async () => {
    const result = await app.app.inject().get(ApiEndPoints.HOME).query({lang: SupportedLanguages.EN});
    expect(result.statusCode).toBe(200);

    const json: HomepageLandingResponse = result.json() as HomepageLandingResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.data.stats.user.perCountry).toStrictEqual(periodicCountryData);
    expect(json.data.stats.user.perLang).toStrictEqual(periodicLangData);
  });

  it('sends correct global subscription status', async () => {
    const uid = new ObjectId();

    await (await SubscriptionRecord.getCollection(app.mongoClient)).insertMany([
      {
        [SubscriptionRecordDocumentKey.key]: {type: 'const', name: 'ALL_QUEST'},
        [SubscriptionRecordDocumentKey.uid]: uid,
      },
      {
        [SubscriptionRecordDocumentKey.key]: {type: 'const', name: 'ALL_MISC'},
        [SubscriptionRecordDocumentKey.uid]: uid,
      },
    ]);

    const result = await app.app.inject().get(ApiEndPoints.HOME)
      .query({uid: uid.toHexString(), lang: SupportedLanguages.EN});
    expect(result.statusCode).toBe(200);

    const json: HomepageLandingResponse = result.json() as HomepageLandingResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.userSubscribed[PostType.ANALYSIS]).toBeFalsy();
    expect(json.userSubscribed[PostType.QUEST]).toBeTruthy();
    expect(json.userSubscribed[PostType.MISC]).toBeTruthy();
  });
});
