import {PostPublishResult} from '../../../../../api-def/api';
import {AnalysisPublishResponse} from '../../base/response/publish';


/**
 * API response class for the successful dragon analysis publish.
 */
export class DragonAnalysisPublishedResponse extends AnalysisPublishResponse {
  /**
   * @inheritDoc
   */
  constructor(unitId: number, result: PostPublishResult) {
    super(unitId, result);
  }
}
