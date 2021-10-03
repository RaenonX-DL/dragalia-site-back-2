import {ApiResponseCode} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


/**
 * API response class for the endpoint to update the tier notes of a unit.
 */
export class UnitTierNoteUpdateResponse extends ApiResponse {
  /**
   * Construct a unit tier notes updating endpoint API response.
   */
  constructor() {
    super(ApiResponseCode.SUCCESS);
  }
}
