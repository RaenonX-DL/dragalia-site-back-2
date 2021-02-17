import {Collection, Document} from 'mongodb';
import {PostListEntry} from '../../../api-def/api/post/base/response';
import {SequencedController} from '../../../base/controller/seq';
import {ModifiableDocumentKey} from '../../../base/model/modifiable';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {PostDocumentBase} from './model';
import {PostGetSuccessResponseParam} from './response/post/get';

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
 * Base object of a post getting result.
 * @template T, R
 */
export abstract class PostGetResult<T extends PostDocumentBase, R> {
  post: T;
  isAltLang: boolean;
  otherLangs: Array<string>;

  /**
   * Construct a post getting result object.
   *
   * @param {T} post post document fetched from the database
   * @param {boolean} isAltLang if the post is returned in an alternative language
   * @param {Array<string>} otherLangs other languages available, if any
   * @protected
   */
  protected constructor(post: T, isAltLang: boolean, otherLangs: Array<string>) {
    this.post = post;
    this.isAltLang = isAltLang;
    this.otherLangs = otherLangs;
  }

  /**
   * Convert the result object to an object ready to be used by the response object.
   *
   * @return {R} object ready to be used by the response object
   */
  abstract toResponseReady(): R;
}


type ResultConstructFunction<D extends PostDocumentBase,
  R extends PostGetSuccessResponseParam,
  T extends PostGetResult<D, R>> =
  (post: D, isAltLang: boolean, otherLangs: Array<string>) => T;


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

  /**
   * Get a specific post.
   *
   * If this is called for post displaying purpose, incCount should be true. Otherwise, it should be false.
   *
   * @param {Collection} collection mongo collection for getting the post
   * @param {number} seqId sequence ID of the post
   * @param {string} langCode language code of the post
   * @param {boolean} incCount if to increase the view count of the post or not
   * @param {ResultConstructFunction} resultConstructFunction function to construct the result object
   * @return {Promise<T>} result of getting a post
   * @protected
   */
  static async getPost<D extends PostDocumentBase,
    R extends PostGetSuccessResponseParam,
    T extends PostGetResult<D, R>>(
    collection: Collection, seqId: number, langCode = 'cht', incCount = true,
    resultConstructFunction: ResultConstructFunction<D, R, T>,
  ): Promise<T | null> {
    // Get the code of other available languages
    let otherLangs = [];
    if (incCount) {
      // Only get the other available languages when incCount is true,
      // because incCount implied that the post fetch is for displaying purpose.
      // If incCount is false, it implies that the post fetch is for other purpose, such as post editing.

      const langCodesAvailable = await collection.find(
        {[SequentialDocumentKey.sequenceId]: seqId, [MultiLingualDocumentKey.language]: {$ne: langCode}},
        {projection: {[MultiLingualDocumentKey.language]: 1}},
      ).toArray();
      otherLangs = langCodesAvailable.map((doc) => doc[MultiLingualDocumentKey.language]);
    }

    const postDataUpdate = {$inc: {[ViewCountableDocumentKey.viewCount]: incCount ? 1 : 0}};

    let isAltLang = false;
    let post = await collection.findOneAndUpdate(
      {[SequentialDocumentKey.sequenceId]: seqId, [MultiLingualDocumentKey.language]: langCode},
      postDataUpdate,
    );

    if (!post.value) {
      post = await collection.findOneAndUpdate(
        {[SequentialDocumentKey.sequenceId]: seqId},
        postDataUpdate,
      );
      if (!post.value) { // Post with the given ID not found
        return null;
      }

      isAltLang = true;
    }

    return resultConstructFunction(post.value as D, isAltLang, otherLangs);
  }
}
