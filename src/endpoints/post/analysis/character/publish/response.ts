import {PostPublishSuccessResponse} from '../../../base/response/post/publish';


/**
 * API response class for the successful character analysis publishing.
 *
 * The response contains the post sequential ID.
 */
export class CharaAnalysisPublishedResponse extends PostPublishSuccessResponse {
  /**
   * @inheritDoc
   */
  constructor(seqId: number) {
    super(seqId);
  }
}
