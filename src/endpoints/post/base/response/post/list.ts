import {SequencedPostListResponse, ApiResponseCode, SequencedPostMeta} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';


/**
 * API response class for a successful post listing.
 */
export abstract class PostListResponse extends ApiResponse {
  isAdmin: boolean;

  posts: Array<SequencedPostMeta>

  startIdx: number;
  postCount: number;

  /**
   * Construct a successful post listing API response.
   *
   * @param {boolean} isAdmin if the user requested this is an admin
   * @param {Array<SequencedPostMeta>} posts post entries to be listed
   * @param {number} startIdx starting index of the posts
   * @param {number} postCount total count of the posts available
   * @protected
   */
  constructor(
    isAdmin: boolean, posts: Array<SequencedPostMeta>, startIdx: number, postCount: number,
  ) {
    super(ApiResponseCode.SUCCESS);

    this.isAdmin = isAdmin;
    this.posts = posts;
    this.startIdx = startIdx;
    this.postCount = postCount;
  }

  /**
   * @inheritDoc
   */
  toJson(): SequencedPostListResponse {
    return {
      ...super.toJson(),
      isAdmin: this.isAdmin,
      posts: this.posts,
      startIdx: this.startIdx,
      postCount: this.postCount,
    };
  }
}
