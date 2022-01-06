import {HomepageData, HomepageLandingPayload, PostType} from '../../../api-def/api';
import {getGaData} from '../../../thirdparty/ga/controller';
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
  const gaData = await getGaData();

  const data: HomepageData = {
    posts: {
      [PostType.QUEST]: transformSequencedPostInfo(
        await QuestPostController.getPostList(mongoClient, payload.lang, 5),
        PostType.QUEST,
      ),
      [PostType.ANALYSIS]: await transformAnalysisInfo(
        await UnitInfoLookupController.getRecentlyModifiedAnalyses(mongoClient, payload.lang, 5),
        payload.lang,
      ),
      [PostType.MISC]: transformSequencedPostInfo(
        await MiscPostController.getPostList(mongoClient, payload.lang, 5),
        PostType.MISC,
      ),
    },
    stats: {
      user: gaData.data,
      lastFetchedEpoch: gaData.lastFetchedEpoch,
    },
  };

  return new HomepageLandingResponse({data});
};