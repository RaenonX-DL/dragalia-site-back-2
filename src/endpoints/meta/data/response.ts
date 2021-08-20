import {BaseResponse, DataPageMetaResponse as DataPageMetaResponseApi} from '../../../api-def/api';
import {GenericPageMetaResponse} from '../general/response';


type DataMetaResponseOptions = Omit<DataPageMetaResponseApi, keyof BaseResponse>;

/**
 * API response class for the data page meta endpoint.
 */
export class DataPageMetaResponse extends GenericPageMetaResponse {
  /**
   * Construct a data meta endpoint API response.
   *
   * @param {DataMetaResponseOptions} options options to construct a data meta response
   */
  constructor(options: DataMetaResponseOptions) {
    super(options);
  }
}
