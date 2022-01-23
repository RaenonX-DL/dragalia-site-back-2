import {MiscPostListEntry} from '../../../../api-def/api';
import {PostListResponse} from '../../base/response/post/list';


/**
 * API response class for getting the list of the misc posts.
 */
export class MiscPostListResponse extends PostListResponse<MiscPostListEntry> {}
