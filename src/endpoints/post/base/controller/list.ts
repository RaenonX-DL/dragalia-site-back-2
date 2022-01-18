import {PostInfo, PostType, SubscriptionKey} from '../../../../api-def/api';
import {EditableDocumentKey} from '../../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../../base/model/viewCount';
import {PostDocumentBase} from '../model/sequencedPost';
import {PostEntryTransformFunction} from './type';


type PostListResultInitOpts<E extends PostInfo> = {
  posts: Array<PostDocumentBase>,
  docTransformFunction: PostEntryTransformFunction<E>,
  subscriptionKeys: SubscriptionKey[],
  globalSubscriptionKey: SubscriptionKey,
  postType: PostType,
};

/**
 * Result object of getting a post list.
 */
export class PostListResult<E extends PostInfo> {
  posts: Array<PostDocumentBase>;
  postListEntries: Array<E>;

  /**
   * Construct a post list getting result.
   *
   * @param {Array<PostListResultInitOpts>} options options to create a post list result
   */
  constructor({
    posts,
    docTransformFunction,
    subscriptionKeys,
    globalSubscriptionKey,
    postType,
  }: PostListResultInitOpts<E>) {
    this.posts = posts;

    const isGlobalSubscription = subscriptionKeys.includes(globalSubscriptionKey);

    this.postListEntries = posts.map((post) => docTransformFunction(
      post,
      isGlobalSubscription ||
        subscriptionKeys.includes({type: 'post', postType, id: post[SequentialDocumentKey.sequenceId]}),
    ));
  }
}

export const defaultTransformFunction = (post: PostDocumentBase, userSubscribed: boolean): PostInfo => ({
  lang: post[MultiLingualDocumentKey.language],
  viewCount: post[ViewCountableDocumentKey.viewCount],
  modifiedEpoch: post[EditableDocumentKey.dateModifiedEpoch],
  publishedEpoch: post[EditableDocumentKey.datePublishedEpoch],
  userSubscribed,
});
