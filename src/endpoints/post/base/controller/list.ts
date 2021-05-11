import {Document} from 'mongodb';

import {PostListEntry} from '../../../../api-def/api';
import {EditableDocumentKey} from '../../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../../base/model/viewCount';
import {PostDocumentKey} from '../model';

type PostEntryTransformFunction<E extends PostListEntry> = (post: Document) => E;

/**
 * Result object of getting a post list.
 */
export class PostListResult<E extends PostListEntry> {
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

export type PostControllerListOptions<E extends PostListEntry, D extends Document> = {
  start?: number,
  limit?: number,
  projection?: D,
  transformFunc: PostEntryTransformFunction<E>,
}

export const defaultTransformFunction = (post: Document): PostListEntry => ({
  seqId: post[SequentialDocumentKey.sequenceId],
  lang: post[MultiLingualDocumentKey.language],
  title: post[PostDocumentKey.title],
  viewCount: post[ViewCountableDocumentKey.viewCount],
  modified: post[EditableDocumentKey.dateModified],
  published: post[EditableDocumentKey.datePublished],
});
