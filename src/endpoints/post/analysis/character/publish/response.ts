import {PostPublishResult} from '../../../../../api-def/api';
import {AnalysisPublishResponse} from '../../base/response/publish';


/**
 * API response class for a successful character analysis publish.
 */
export class CharaAnalysisPublishedResponse extends AnalysisPublishResponse {
  /**
   * @inheritDoc
   */
  constructor(unitId: number, result: PostPublishResult) {
    super(unitId, result);
  }
}
