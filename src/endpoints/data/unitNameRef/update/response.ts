import {ApiResponseCode, UnitNameRefUpdateResponse as UnitNameRefUpdateResponseApi} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


/**
 * API response class for the endpoint to update the unit name references.
 *
 * Using this response class indicates that the update succeeds.
 */
export class UnitNameRefUpdateResponse extends ApiResponse {
  /**
   * Construct an unit name update endpoint API response.
   */
  constructor() {
    super(ApiResponseCode.SUCCESS);
  }

  /**
   * @inheritDoc
   */
  toJson(): UnitNameRefUpdateResponseApi {
    return {...super.toJson()};
  }
}
