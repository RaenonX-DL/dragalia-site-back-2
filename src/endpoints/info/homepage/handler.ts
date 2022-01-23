import {
  HomepageData,
  HomepageLandingPayload,
  HomepageLandingResponse as HomepageLandingResponseApi,
  PostType, subKeysInclude,
} from '../../../api-def/api';
import {getGaData} from '../../../thirdparty/ga/controller';
import {SubscriptionRecordController} from '../../../thirdparty/mail/data/subscription/controller';
import {HandlerParams} from '../../lookup';
import {MiscPostController} from '../../post/misc/controller';
import {QuestPostController} from '../../post/quest/controller';
import {UnitInfoLookupController} from '../lookup/controller';
import {HomepageLandingResponse} from './response';
import {transformAnalysisInfo, transformSequencedPostInfo} from './utils';


export const handleHomepageLanding = async ({
  payload,
  mongoClient,
}: HandlerParams<HomepageLandingPayload>): Promise<HomepageLandingResponse> => {
  const gaData = await getGaData(mongoClient);

  const {uid, lang} = payload;

  const [questList, analysisList, miscList, subscriptionKeys] = await Promise.all([
    QuestPostController.getPostList({mongoClient, uid, lang, limit: 5}),
    UnitInfoLookupController.getRecentlyModifiedAnalyses({mongoClient, uid, lang, maxCount: 5}),
    MiscPostController.getPostList({mongoClient, uid, lang, limit: 5}),
    SubscriptionRecordController.getSubscriptionsOfUser(mongoClient, uid),
  ]);

  const data: HomepageData = {
    posts: {
      [PostType.QUEST]: transformSequencedPostInfo(questList, PostType.QUEST),
      [PostType.ANALYSIS]: await transformAnalysisInfo(analysisList, lang),
      [PostType.MISC]: transformSequencedPostInfo(miscList, PostType.MISC),
    },
    stats: {
      user: gaData.data,
      lastFetchedEpoch: gaData.lastFetchedEpoch,
    },
  };

  const subscribed: HomepageLandingResponseApi['subscribed'] = {
    post: {
      [PostType.QUEST]: subKeysInclude(subscriptionKeys, {type: 'const', name: 'ALL_QUEST'}),
      [PostType.ANALYSIS]: subKeysInclude(subscriptionKeys, {type: 'const', name: 'ALL_ANALYSIS'}),
      [PostType.MISC]: subKeysInclude(subscriptionKeys, {type: 'const', name: 'ALL_MISC'}),
    },
    announcement: subKeysInclude(subscriptionKeys, {type: 'const', name: 'ANNOUNCEMENT'}),
  };

  return new HomepageLandingResponse({data, subscribed});
};
