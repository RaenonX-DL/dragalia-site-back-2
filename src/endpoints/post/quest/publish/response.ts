import {PostPublishSuccessResponse} from '../../base/response/post/publish';


/**
 * API response class for the successful quest post publishing.
 *
 * The response contains the post sequential ID.
 */
export class QuestPostPublishSuccessResponse extends PostPublishSuccessResponse {
  /**
   * @inheritDoc
   */
  constructor(seqId: number) {
    super(seqId);
  }
}
