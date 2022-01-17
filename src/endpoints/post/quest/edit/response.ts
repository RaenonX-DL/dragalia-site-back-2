import {PostEditResult} from '../../../../api-def/api';
import {SequencedPostEditResponse} from '../../base/response/post/edit/sequenced';

/**
 * API response class for editing a quest post.
 */
export class QuestPostEditResponse extends SequencedPostEditResponse {
  /**
   * @inheritDoc
   */
  constructor(seqId: number, result: PostEditResult) {
    super({seqId, ...result});
  }
}
