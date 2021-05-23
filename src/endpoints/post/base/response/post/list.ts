import {PostListResponse, ApiResponseCode, PostUnit} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';


/**
 * API response class for a successful post listing.
 */
export abstract class PostListSuccessResponse extends ApiResponse {
  isAdmin: boolean;
  showAds: boolean;

  posts: Array<PostUnit>

  startIdx: number;
  postCount: number;

  /**
   * Construct a successful post listing API response.
   *
   * @param {boolean} isAdmin if the user requested this is an admin
   * @param {boolean} showAds if the user requested this should have ads shown
   * @param {Array<PostUnit>} posts post entries to be listed
   * @param {number} startIdx starting index of the posts
   * @param {number} postCount total count of the posts available
   * @protected
   */
  constructor(
    isAdmin: boolean, showAds: boolean, posts: Array<PostUnit>, startIdx: number, postCount: number,
  ) {
    super(ApiResponseCode.SUCCESS);

    this.isAdmin = isAdmin;
    this.showAds = showAds;
    this.posts = posts;
    this.startIdx = startIdx;
    this.postCount = postCount;
  }

  /**
   * @inheritDoc
   */
  toJson(): PostListResponse {
    return {
      ...super.toJson(),
      isAdmin: this.isAdmin,
      showAds: this.showAds,
      posts: this.posts,
      startIdx: this.startIdx,
      postCount: this.postCount,
    };
  }
}
