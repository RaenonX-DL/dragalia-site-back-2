import {ObjectId} from 'mongodb';

import {
  ApiResponseCode,
  BaseResponse,
  SetAtkSkillPresetResponse as SetAtkSkillPresetResponseApi,
} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


type SetAtkSkillPresetResponseOptions = Omit<SetAtkSkillPresetResponseApi, keyof BaseResponse | 'presetId'> & {
  presetId: ObjectId,
};

/**
 * API response class for making an ATK skill input preset.
 */
export class SetAtkSkillPresetResponse extends ApiResponse {
  presetId: ObjectId;

  /**
   * Construct a set ATK skill input preset response.
   *
   * @param {SetAtkSkillPresetResponseOptions} options options to construct a set ATK skill preset response
   */
  constructor(options: SetAtkSkillPresetResponseOptions) {
    const responseCode = ApiResponseCode.SUCCESS;

    super(responseCode);

    this.presetId = options.presetId;
  }

  /**
   * @inheritDoc
   */
  toJson(): SetAtkSkillPresetResponseApi {
    return {
      ...super.toJson(),
      presetId: this.presetId.toHexString(),
    };
  }
}
