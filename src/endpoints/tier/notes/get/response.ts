import {
  ApiResponseCode,
  BaseResponse,
  UnitTierData,
  UnitTierNoteGetResponse as UnitTierNoteGetResponseApi,
} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


type UnitTierNoteGetResponseOptions = Omit<UnitTierNoteGetResponseApi, keyof BaseResponse>;

/**
 * API response class for the endpoint to get all unit tier notes.
 */
export class UnitTierNoteGetResponse extends ApiResponse {
  data: UnitTierData;

  /**
   * Construct a unit tier notes fetching endpoint API response.
   *
   * @param {UnitTierNoteGetResponseOptions} options options to construct a unit tier notes fetching response
   */
  constructor(options: UnitTierNoteGetResponseOptions) {
    const responseCode = ApiResponseCode.SUCCESS;

    super(responseCode);

    this.data = options.data;
  }

  /**
   * @inheritDoc
   */
  toJson(): UnitTierNoteGetResponseApi {
    return {
      ...super.toJson(),
      data: this.data,
    };
  }
}
