import {
  ApiResponseCode,
  BaseResponse,
  UnitTierNote,
  UnitTierNoteSingleResponse as UnitTierNoteSingleResponseApi,
} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


type UnitTierNoteSingleResponseOptions = Omit<UnitTierNoteSingleResponseApi, keyof BaseResponse>;

/**
 * API response class for the endpoint to get the unit tier notes of a unit.
 */
export class UnitTierNoteSingleResponse extends ApiResponse {
  data: UnitTierNote | null;

  /**
   * Construct a single unit tier notes endpoint API response.
   *
   * @param {UnitTierNoteEditResponseOptions} options options to construct a single unit tier notes response
   */
  constructor(options: UnitTierNoteSingleResponseOptions) {
    const responseCode = ApiResponseCode.SUCCESS;

    super(responseCode);

    this.data = options.data;
  }

  /**
   * @inheritDoc
   */
  toJson(): UnitTierNoteSingleResponseApi {
    return {
      ...super.toJson(),
      data: this.data,
    };
  }
}
