import {PostIdCheckResponse} from '../../base/response/post/idCheck';

/**
 * API response class for getting the list of the quest posts.
 */
export class QuestPostIdCheckResponse extends PostIdCheckResponse {
  /**
   * @inheritDoc
   */
  constructor(isAdmin: boolean, isAvailable: boolean) {
    super(isAdmin, isAvailable);
  }
}
