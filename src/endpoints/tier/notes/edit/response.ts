import {
  ApiResponseCode,
  BaseResponse,
  UnitTierNote,
  UnitTierNoteEditResponse as UnitTierNoteEditResponseApi,
} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


type UnitTierNoteEditResponseOptions = Omit<UnitTierNoteEditResponseApi, keyof BaseResponse>;

/**
 * API response class for the endpoint to get the unit tier notes of an unit for edit.
 */
export class UnitTierNoteEditResponse extends ApiResponse {
  data: UnitTierNote | null;

  /**
   * Construct a unit tier notes editing endpoint API response.
   *
   * @param {UnitTierNoteEditResponseOptions} options options to construct a unit tier notes editing response
   */
  constructor(options: UnitTierNoteEditResponseOptions) {
    const responseCode = ApiResponseCode.SUCCESS;

    super(responseCode);

    this.data = options.data;
  }

  /**
   * @inheritDoc
   */
  toJson(): UnitTierNoteEditResponseApi {
    return {
      ...super.toJson(),
      data: this.data,
    };
  }
}
