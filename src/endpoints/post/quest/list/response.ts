import {PostListEntry} from '../../../../api-def/api';
import {PostListSuccessResponse} from '../../base/response/post/list';

/**
 * API response class for getting the list of the quest posts.
 */
export class QuestPostListSuccessResponse extends PostListSuccessResponse {
  /**
   * @inheritDoc
   */
  constructor(
    isAdmin: boolean, showAds: boolean, posts: Array<PostListEntry>, startIdx: number, postCount: number,
  ) {
    super(isAdmin, showAds, posts, startIdx, postCount);
  }
}
