import {MongoClient} from 'mongodb';

import {
  SequencedPostListPayload,
  SequencedPostInfo,
  SubscriptionKeyConstName,
} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {PostListResult} from '../controller/list';
import {ListPostOptions} from '../controller/type';
import {PostListResponse, PostListResponseOptions} from '../response/post/list';


type FunctionGetPostList<E extends SequencedPostInfo> = (options: ListPostOptions) => Promise<PostListResult<E>>;

type FunctionConstructResponse<E extends SequencedPostInfo, R extends PostListResponse<E>> = (
  options: PostListResponseOptions<E>
) => R;

type ListPostHandlerOptions<
  P extends SequencedPostListPayload,
  R extends PostListResponse<E>,
  E extends SequencedPostInfo
> = {
  mongoClient: MongoClient,
  payload: P,
  fnGetPostList: FunctionGetPostList<E>,
  fnConstructResponse: FunctionConstructResponse<E, R>,
  globalSubscriptionKeyName: SubscriptionKeyConstName,
};

export const handleListPost = async <
  P extends SequencedPostListPayload,
  R extends PostListResponse<E>,
  E extends SequencedPostInfo
>(options: ListPostHandlerOptions<P, R, E>): Promise<R> => {
  const {mongoClient, payload, fnGetPostList, fnConstructResponse, globalSubscriptionKeyName} = options;

  const {uid, lang} = payload;

  // Get a list of posts
  const {postListEntries: posts} = await fnGetPostList({mongoClient, uid, lang});

  const userSubscribed = await SubscriptionRecordController.isUserSubscribed(
    mongoClient, uid, [{type: 'const', name: globalSubscriptionKeyName}],
  );

  return fnConstructResponse({posts, userSubscribed});
};
