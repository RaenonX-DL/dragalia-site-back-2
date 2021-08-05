import {
  ApiResponseCode,
  BaseResponse,
  UnitNameRefEntry,
  UnitNameRefManageResponse as UnitNameRefManageResponseApi,
} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


type UnitNameRefManageResponseOptions = Omit<UnitNameRefManageResponseApi, keyof BaseResponse>;

/**
 * API response class for the endpoint to get the unit name references for managing.
 */
export class UnitNameRefManageResponse extends ApiResponse {
  refs: Array<UnitNameRefEntry>;

  /**
   * Construct an unit name managing endpoint API response.
   *
   * @param {UnitNameRefManageResponseOptions} options options to construct an unit name ref response
   */
  constructor(options: UnitNameRefManageResponseOptions) {
    const responseCode = ApiResponseCode.SUCCESS;

    super(responseCode);

    this.refs = options.refs;
  }

  /**
   * @inheritDoc
   */
  toJson(): UnitNameRefManageResponseApi {
    return {
      ...super.toJson(),
      refs: this.refs,
    };
  }
}
