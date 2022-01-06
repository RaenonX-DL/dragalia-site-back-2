import {SequencedPostListResponse, ApiResponseCode, SequencedPostInfo} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';


/**
 * API response class for a successful post listing.
 */
export abstract class PostListResponse extends ApiResponse {
  posts: Array<SequencedPostInfo>;

  /**
   * Construct a successful post listing API response.
   *
   * @param {boolean} isAdmin if the user requested this is an admin
   * @param {Array<SequencedPostInfo>} posts post entries to be listed
   * @protected
   */
  constructor(isAdmin: boolean, posts: Array<SequencedPostInfo>) {
    super(ApiResponseCode.SUCCESS);

    this.posts = posts;
  }

  /**
   * @inheritDoc
   */
  toJson(): SequencedPostListResponse {
    return {
      ...super.toJson(),
      posts: this.posts,
    };
  }
}
