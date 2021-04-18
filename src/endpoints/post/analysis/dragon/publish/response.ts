import {PostPublishSuccessResponse} from '../../../base/response/post/publish';


/**
 * API response class for the successful dragon analysis publishing.
 *
 * The response contains the post sequential ID.
 */
export class DragonAnalysisPublishedResponse extends PostPublishSuccessResponse {
  /**
   * @inheritDoc
   */
  constructor(seqId: number) {
    super(seqId);
  }
}
