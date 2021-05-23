import {Document} from 'mongodb';

import {PostUnitNoTitle} from '../../../../api-def/api';
import {EditableDocumentKey} from '../../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../../base/model/viewCount';

type PostEntryTransformFunction<E extends PostUnitNoTitle> = (post: Document) => E;

/**
 * Result object of getting a post list.
 */
export class PostListResult<E extends PostUnitNoTitle> {
  posts: Array<Document>;
  postListEntries: Array<E>;
  totalAvailableCount: number;

  /**
   * Construct a post list getting result.
   *
   * @param {Array<Document>} posts posts returned from document
   * @param {number} totalAvailableCount total count of the posts available
   * @param {PostEntryTransformFunction} docTransformFunction function to transform the document into an entry
   */
  constructor(
    posts: Array<Document>,
    totalAvailableCount: number,
    docTransformFunction: PostEntryTransformFunction<E>,
  ) {
    this.posts = posts;
    this.postListEntries = posts.map((post) => docTransformFunction(post));
    this.totalAvailableCount = totalAvailableCount;
  }
}

export type PostControllerListOptions<E extends PostUnitNoTitle, D extends Document> = {
  start?: number,
  limit?: number,
  projection?: D,
  transformFunc: PostEntryTransformFunction<E>,
}

export const defaultTransformFunction = (post: Document): PostUnitNoTitle => ({
  seqId: post[SequentialDocumentKey.sequenceId],
  lang: post[MultiLingualDocumentKey.language],
  viewCount: post[ViewCountableDocumentKey.viewCount],
  modifiedEpoch: post[EditableDocumentKey.dateModifiedEpoch],
  publishedEpoch: post[EditableDocumentKey.datePublishedEpoch],
});
