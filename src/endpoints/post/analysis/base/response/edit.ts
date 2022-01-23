import {AnalysisEditResponse as AnalysisEditResponseApi, PostEditResult} from '../../../../../api-def/api';
import {PostEditResponse} from '../../../base/response/post/edit/common';

/**
 * API response class for an analysis edit.
 */
export abstract class AnalysisEditResponse extends PostEditResponse {
  unitId: number;

  /**
   * Construct an analysis editing API response.
   *
   * @param {number} unitId unit ID of the edited analysis
   * @param {PostEditResult} result analysis edit result
   */
  constructor(unitId: number, result: PostEditResult) {
    super(result);

    this.unitId = unitId;
  }

  /**
   * @inheritDoc
   */
  toJson(): AnalysisEditResponseApi {
    return {
      ...super.toJson(),
      unitId: this.unitId,
    };
  }
}
