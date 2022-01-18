import {SequencedPostListResponse, ApiResponseCode, SequencedPostInfo, BaseResponse} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';


export type PostListResponseOptions<E extends SequencedPostInfo> =
  Omit<SequencedPostListResponse<E>, keyof BaseResponse>;

/**
 * API response class for a successful post listing.
 */
export abstract class PostListResponse<E extends SequencedPostInfo> extends ApiResponse {
  posts: Array<E>;
  userSubscribed: boolean;

  /**
   * Construct a successful post list API response.
   *
   * @param {PostListResponseOptions} options options to construct a post list API response.
   * @protected
   */
  constructor({posts, userSubscribed}: PostListResponseOptions<E>) {
    super(ApiResponseCode.SUCCESS);

    this.posts = posts;
    this.userSubscribed = userSubscribed;
  }

  /**
   * @inheritDoc
   */
  toJson(): SequencedPostListResponse {
    return {
      ...super.toJson(),
      posts: this.posts,
      userSubscribed: this.userSubscribed,
    };
  }
}
