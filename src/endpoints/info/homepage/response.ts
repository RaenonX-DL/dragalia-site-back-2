import {
  ApiResponseCode,
  BaseResponse,
  HomepageData,
  HomepageLandingResponse as HomepageLandingResponseApi,
} from '../../../api-def/api';
import {ApiResponse} from '../../../base/response';


type HomepageLandingResponseOptions = Omit<HomepageLandingResponseApi, keyof BaseResponse>;

/**
 * API response class for getting the homepage landing data.
 */
export class HomepageLandingResponse extends ApiResponse {
  data: HomepageData;

  /**
   * Construct a homepage landing endpoint API response.
   *
   * @param {HomepageLandingResponseOptions} options options to construct homepage landing response
   */
  constructor(options: HomepageLandingResponseOptions) {
    const responseCode = ApiResponseCode.SUCCESS;

    super(responseCode);

    this.data = options.data;
  }

  /**
   * @inheritDoc
   */
  toJson(): HomepageLandingResponseApi {
    return {
      ...super.toJson(),
      data: this.data,
    };
  }
}
