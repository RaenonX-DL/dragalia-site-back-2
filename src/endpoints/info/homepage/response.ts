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
  subscribed: HomepageLandingResponseApi['subscribed'];

  /**
   * Construct a homepage landing endpoint API response.
   *
   * @param {HomepageLandingResponseOptions} options options to construct homepage landing response
   */
  constructor({data, subscribed}: HomepageLandingResponseOptions) {
    super(ApiResponseCode.SUCCESS);

    this.data = data;
    this.subscribed = subscribed;
  }

  /**
   * @inheritDoc
   */
  toJson(): HomepageLandingResponseApi {
    return {
      ...super.toJson(),
      data: this.data,
      subscribed: this.subscribed,
    };
  }
}
