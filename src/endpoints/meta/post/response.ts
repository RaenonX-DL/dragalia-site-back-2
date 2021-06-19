import {BaseResponse, PostPageMetaResponse as PostPageMetaResponseApi} from '../../../api-def/api';
import {GenericPageMetaResponse} from '../general/response';


type PostMetaResponseOptions = Omit<PostPageMetaResponseApi, keyof BaseResponse>;

/**
 * API response class for the post meta endpoint.
 */
export class PostPageMetaResponse extends GenericPageMetaResponse {
  /**
   * Construct a post meta endpoint API response.
   *
   * @param {PostMetaResponseOptions} options options to construct a post meta response
   */
  constructor(options: PostMetaResponseOptions) {
    super(options);
  }
}
