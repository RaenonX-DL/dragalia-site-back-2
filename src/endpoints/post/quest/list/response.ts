import {QuestPostListEntry} from '../../../../api-def/api';
import {PostListResponse} from '../../base/response/post/list';

/**
 * API response class for getting the list of the quest posts.
 */
export class QuestPostListResponse extends PostListResponse<QuestPostListEntry> {}
