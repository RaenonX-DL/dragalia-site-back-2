import {UnitNameRefUpdateResponse as UnitNameRefUpdateResponseApi} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


type UnitNameRefUpdateResponseOptions = Pick<UnitNameRefUpdateResponseApi, 'code'>;

/**
 * API response class for the endpoint to update the unit name references.
 */
export class UnitNameRefUpdateResponse extends ApiResponse {
  /**
   * Construct an unit name update endpoint API response.
   *
   * @param {UnitNameRefUpdateResponseOptions} options options to construct the response
   */
  constructor(options: UnitNameRefUpdateResponseOptions) {
    super(options.code);
  }

  /**
   * @inheritDoc
   */
  toJson(): UnitNameRefUpdateResponseApi {
    return {...super.toJson()};
  }
}
