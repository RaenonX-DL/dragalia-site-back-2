import {
  ApiResponseCode,
  BaseResponse,
  UnitNameRefData,
  UnitNameRefResponse as UnitNameRefResponseApi,
} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


type UnitNameRefResponseOptions = Omit<UnitNameRefResponseApi, keyof BaseResponse>;

/**
 * API response class for the endpoint to get the unit name references.
 */
export class UnitNameRefResponse extends ApiResponse {
  data: UnitNameRefData;

  /**
   * Construct a unit name reference endpoint API response.
   *
   * @param {UnitNameRefResponseOptions} options options to construct the response
   */
  constructor(options: UnitNameRefResponseOptions) {
    const responseCode = ApiResponseCode.SUCCESS;

    super(responseCode);

    this.data = options.data;
  }

  /**
   * @inheritDoc
   */
  toJson(): UnitNameRefResponseApi {
    return {
      ...super.toJson(),
      data: this.data,
    };
  }
}
