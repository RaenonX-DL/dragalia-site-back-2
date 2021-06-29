import {
  ApiResponseCode,
  BaseResponse,
  InputDataPreset,
  GetAtkSkillPresetResponse as GetAtkSkillPresetResponseApi,
} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


type GetAtkSkillPresetResponseOptions = Omit<GetAtkSkillPresetResponseApi, keyof BaseResponse>;

/**
 * API response class for getting the ATK skill input preset.
 */
export class GetAtkSkillPresetResponse extends ApiResponse {
  preset: InputDataPreset;

  /**
   * Construct a page meta endpoint API response.
   *
   * @param {GetAtkSkillPresetResponseOptions} options options to get ATK skill input preset response
   */
  constructor(options: GetAtkSkillPresetResponseOptions) {
    const responseCode = ApiResponseCode.SUCCESS;

    super(responseCode);

    this.preset = options.preset;
  }

  /**
   * @inheritDoc
   */
  toJson(): GetAtkSkillPresetResponseApi {
    return {
      ...super.toJson(),
      preset: this.preset,
    };
  }
}
