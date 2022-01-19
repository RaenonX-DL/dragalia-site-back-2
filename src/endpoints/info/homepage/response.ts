import {
  ApiResponseCode,
  BaseResponse,
  HomepageData,
  HomepageLandingResponse as HomepageLandingResponseApi, PostType,
} from '../../../api-def/api';
import {ApiResponse} from '../../../base/response';


type HomepageLandingResponseOptions = Omit<HomepageLandingResponseApi, keyof BaseResponse>;

/**
 * API response class for getting the homepage landing data.
 */
export class HomepageLandingResponse extends ApiResponse {
  data: HomepageData;
  userSubscribed: {[type in PostType]: boolean};

  /**
   * Construct a homepage landing endpoint API response.
   *
   * @param {HomepageLandingResponseOptions} options options to construct homepage landing response
   */
  constructor({data, userSubscribed}: HomepageLandingResponseOptions) {
    super(ApiResponseCode.SUCCESS);

    this.data = data;
    this.userSubscribed = userSubscribed;
  }

  /**
   * @inheritDoc
   */
  toJson(): HomepageLandingResponseApi {
    return {
      ...super.toJson(),
      data: this.data,
      userSubscribed: this.userSubscribed,
    };
  }
}
