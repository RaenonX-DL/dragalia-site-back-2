import {PostType, SubscriptionKeyConstName} from '../../../../api-def/api';


export const PostTypeToSubscriptionKey: {[type in PostType]: SubscriptionKeyConstName} = {
  [PostType.ANALYSIS]: 'ALL_ANALYSIS',
  [PostType.QUEST]: 'ALL_QUEST',
  [PostType.MISC]: 'ALL_MISC',
};
