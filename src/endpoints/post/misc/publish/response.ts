import {PostPublishResult} from '../../../../api-def/api';
import {SequencedPostPublishResponse} from '../../base/response/post/publish/sequenced';


/**
 * API response class for the successful misc post publishing.
 *
 * The response contains the post sequential ID.
 */
export class MiscPostPublishResponse extends SequencedPostPublishResponse {
  /**
   * @inheritDoc
   */
  constructor(seqId: number, result: PostPublishResult) {
    super(seqId, result);
  }
}
