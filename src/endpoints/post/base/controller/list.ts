import {Document} from 'mongodb';

import {PostInfo} from '../../../../api-def/api';
import {EditableDocumentKey} from '../../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {ViewCountableDocumentKey} from '../../../../base/model/viewCount';


type PostEntryTransformFunction<E extends PostInfo> = (post: Document) => E;

/**
 * Result object of getting a post list.
 */
export class PostListResult<E extends PostInfo> {
  posts: Array<Document>;
  postListEntries: Array<E>;

  /**
   * Construct a post list getting result.
   *
   * @param {Array<Document>} posts posts returned from document
   * @param {PostEntryTransformFunction} docTransformFunction function to transform the document into an entry
   */
  constructor(
    posts: Array<Document>,
    docTransformFunction: PostEntryTransformFunction<E>,
  ) {
    this.posts = posts;
    this.postListEntries = posts.map((post) => docTransformFunction(post));
  }
}

export type PostControllerListOptions<E extends PostInfo, D extends Document> = {
  projection?: D,
  transformFunc: PostEntryTransformFunction<E>,
}

export const defaultTransformFunction = (post: Document): PostInfo => ({
  lang: post[MultiLingualDocumentKey.language],
  viewCount: post[ViewCountableDocumentKey.viewCount],
  modifiedEpoch: post[EditableDocumentKey.dateModifiedEpoch],
  publishedEpoch: post[EditableDocumentKey.datePublishedEpoch],
});
