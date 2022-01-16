import {PostType} from '../../../../api-def/api/post/types';
import {SubscriptionKeyConstName} from '../../data/subscription/key';


export const PostTypeToSubscriptionKey: {[type in PostType]: SubscriptionKeyConstName} = {
  [PostType.ANALYSIS]: 'ALL_ANALYSIS',
  [PostType.QUEST]: 'ALL_QUEST',
  [PostType.MISC]: 'ALL_MISC',
};
