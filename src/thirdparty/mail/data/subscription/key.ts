import {PostType} from '../../../../api-def/api';


export type SubscriptionKeyConstName =
  'ALL_QUEST' |
  'ALL_ANALYSIS' |
  'ALL_MISC' |
  'ALL_TIER' |
  'SITE_FEATURE';

export type SubscriptionKeyConst = {
  type: 'const',
  name: SubscriptionKeyConstName,
};

export type SubscriptionKeyPost = {
  type: 'post',
  postType: PostType,
  id: number,
};

export type SubscriptionKey = SubscriptionKeyConst | SubscriptionKeyPost;
