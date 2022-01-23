import {PostPublishResult} from '../../../../api-def/api';
import {SequencedPostPublishResponse} from '../../base/response/post/publish/sequenced';


/**
 * API response class for the successful quest post publishing.
 *
 * The response contains the post sequential ID.
 */
export class QuestPostPublishResponse extends SequencedPostPublishResponse {
  /**
   * @inheritDoc
   */
  constructor(seqId: number, result: PostPublishResult) {
    super(seqId, result);
  }
}
