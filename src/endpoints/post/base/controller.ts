import {Collection, Document} from 'mongodb';
import {PostListEntry} from '../../../api-def/api/post/base/response';
import {SequencedController} from '../../../base/controller/seq';
import {ModifiableDocumentKey} from '../../../base/model/modifiable';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';

type PostListDocumentTransformFunction = (post: Document) => PostListEntry;

/**
 * Result object of getting a post list.
 */
export class PostListResult {
  posts: Array<Document>;
  postListEntries: Array<PostListEntry>;
  totalAvailableCount: number;

  /**
   * Construct a post list getting result.
   *
   * @param {Array<Document>} posts posts returned from document
   * @param {number} totalAvailableCount total count of the posts available
   * @param {PostListDocumentTransformFunction} docTransformFunction function to transform the document into an entry
   */
  constructor(
    posts: Array<Document>, totalAvailableCount: number, docTransformFunction: PostListDocumentTransformFunction,
  ) {
    this.posts = posts;
    this.postListEntries = posts.map((post) => docTransformFunction(post));
    this.totalAvailableCount = totalAvailableCount;
  }
}

/**
 * Sequence controller.
 */
export abstract class PostController extends SequencedController {
  /**
   * Get a list of posts.
   *
   * @param {Collection} collection collection to perform the post listing
   * @param {string} langCode language of the posts
   * @param {Document} projection projection to use for returning the posts
   * @param {number} start starting point of the post list
   * @param {number} limit maximum count of the posts to return
   * @param {PostListDocumentTransformFunction} docTransformFunction
   * @return {Promise<PostListResult>} result of getting the post list function to transform the document into an entry
   * @protected
   */
  protected static async listPosts(
    collection: Collection, langCode: string, projection: Document, start = 0, limit = 0,
    docTransformFunction: PostListDocumentTransformFunction,
  ): Promise<PostListResult> {
    const query = {[MultiLingualDocumentKey.language]: langCode};

    const posts = await collection.find(
      query,
      {
        projection,
        sort: {[ModifiableDocumentKey.dateModified]: 'desc'},
      })
      .skip(start)
      .limit(limit)
      .toArray();

    const totalAvailableCount = await collection.countDocuments(query);

    return new PostListResult(posts, totalAvailableCount, docTransformFunction);
  }
}
