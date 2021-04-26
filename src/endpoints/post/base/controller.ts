import {Collection, Document, MongoClient} from 'mongodb';

import {SupportedLanguages, PostListEntry} from '../../../api-def/api';
import {SequencedController} from '../../../base/controller/seq';
import {UpdateResult} from '../../../base/enum/updateResult';
import {DocumentBaseKey} from '../../../base/model/base';
import {EditableDocumentKey, EditNoteDocumentKey} from '../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {PostDocumentBase, PostDocumentKey} from './model';
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
export abstract class PostGetResult<T extends PostDocumentBase> {
  post: T;
  isAltLang: boolean;
  otherLangs: Array<SupportedLanguages>;

  /**
   * Construct a post getting result object.
   *
   * @param {T} post post document fetched from the database
   * @param {boolean} isAltLang if the post is returned in an alternative language
   * @param {Array<string>} otherLangs other languages available, if any
   * @protected
   */
  protected constructor(post: T, isAltLang: boolean, otherLangs: Array<SupportedLanguages>) {
    this.post = post;
    this.isAltLang = isAltLang;
    this.otherLangs = otherLangs;
  }

  /**
   * Convert the result object to an object ready to be used by the response object.
   *
   * @return {R} object ready to be used by the response object
   */
  protected toResponseReady(): PostGetSuccessResponseParam {
    return {
      seqId: this.post[SequentialDocumentKey.sequenceId],
      lang: this.post[MultiLingualDocumentKey.language],
      title: this.post[PostDocumentKey.title],
      isAltLang: this.isAltLang,
      otherLangs: this.otherLangs,
      viewCount: this.post[ViewCountableDocumentKey.viewCount],
      editNotes: this.post[EditableDocumentKey.editNotes].map((doc) => {
        return {
          timestamp: doc[EditNoteDocumentKey.datetime],
          note: doc[EditNoteDocumentKey.note],
        };
      }),
      modified: this.post[EditableDocumentKey.dateModified],
      published: this.post[EditableDocumentKey.datePublished],
    };
  }
}


type ResultConstructFunction<D extends PostDocumentBase,
  T extends PostGetResult<D>> =
  (post: D, isAltLang: boolean, otherLangs: Array<SupportedLanguages>) => T;


type PostControllerListPostOptions = {
  start?: number,
  limit?: number,
  additionalProjection?: Document,
  docTransformFunction?: PostListDocumentTransformFunction,
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
   * @param {PostControllerListPostOptions} options additional options for listing the posts
   * @return {Promise<PostListResult>} result of getting the post list function to transform the document into an entry
   * @protected
   */
  protected static async listPosts(
    collection: Collection, langCode: string, options: PostControllerListPostOptions = {},
  ): Promise<PostListResult> {
    let {
      start = 0,
      limit = 0,
      additionalProjection = {},
      docTransformFunction,
    } = options;

    if (!docTransformFunction) {
      docTransformFunction = (post) => {
        return {
          seqId: post[SequentialDocumentKey.sequenceId],
          lang: post[MultiLingualDocumentKey.language],
          title: post[PostDocumentKey.title],
          viewCount: post[ViewCountableDocumentKey.viewCount],
          modified: post[EditableDocumentKey.dateModified],
          published: post[EditableDocumentKey.datePublished],
        };
      };
    }

    const query = {[MultiLingualDocumentKey.language]: langCode};

    const posts = await collection.find(
      query,
      {
        projection: {
          ...additionalProjection,
          [SequentialDocumentKey.sequenceId]: 1,
          [MultiLingualDocumentKey.language]: 1,
          [PostDocumentKey.title]: 1,
          [EditableDocumentKey.dateModified]: 1,
          [EditableDocumentKey.datePublished]: 1,
          [ViewCountableDocumentKey.viewCount]: 1,
        },
        sort: {[EditableDocumentKey.dateModified]: 'desc'},
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
   * @param {SupportedLanguages} lang language of the post
   * @param {boolean} incCount if to increase the view count of the post or not
   * @param {ResultConstructFunction} resultConstructFunction function to construct the result object
   * @return {Promise<T>} result of getting a post
   * @protected
   */
  protected static async getPost<D extends PostDocumentBase,
    T extends PostGetResult<D>>(
    collection: Collection, seqId: number, lang = SupportedLanguages.CHT, incCount = true,
    resultConstructFunction: ResultConstructFunction<D, T>,
  ): Promise<T | null> {
    // Get the code of other available languages
    let otherLangs = [];
    if (incCount) {
      // Only get the other available languages when incCount is true,
      // because incCount implied that the post fetch is for displaying purpose.
      // If incCount is false, it implies that the post fetch is for other purpose, such as post editing.

      const langCodesAvailable = await collection.find(
        {[SequentialDocumentKey.sequenceId]: seqId, [MultiLingualDocumentKey.language]: {$ne: lang}},
        {projection: {[MultiLingualDocumentKey.language]: 1}},
      ).toArray();
      otherLangs = langCodesAvailable.map((doc) => doc[MultiLingualDocumentKey.language]);
    }

    const postDataUpdate = {$inc: {[ViewCountableDocumentKey.viewCount]: incCount ? 1 : 0}};

    let isAltLang = false;
    let post = await collection.findOneAndUpdate(
      {[SequentialDocumentKey.sequenceId]: seqId, [MultiLingualDocumentKey.language]: lang},
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

  /**
   * Edit a post.
   *
   * If any of ``seqId`` or ``langCode`` is ``undefined``,
   * ``NOT_FOUND`` will be returned.
   *
   * Note that several document fields will not be updated, and no messages will be emitted.
   *
   * This includes:
   *
   * - Document ID
   * - Sequential ID
   * - Language
   * - Edit notes
   * - Last Modified timestamp
   * - Publish timestamp
   * - View count
   *
   * @param {Collection} collection mongo collection containing the post to be edited
   * @param {number | undefined} seqId sequential ID of the post to be edited
   * @param {string | undefined} langCode language code of the post to be edited
   * @param {D} update document used to replace the old post
   * @param {string} editNote post edit note
   * @param {D} additionalFilter additional filtering conditions
   * @return {Promise<UpdateResult>} promise of the update result
   * @protected
   */
  protected static async editPost<D extends PostDocumentBase>(
    collection: Collection,
    seqId: number | undefined,
    langCode: string | undefined,
    update: D,
    editNote: string,
    additionalFilter?: D,
  ): Promise<UpdateResult> {
    // Returns `NOT_FOUND` if `seqId` or `langCode` is falsy - which post to update?
    if (!seqId || !langCode) {
      return 'NOT_FOUND';
    }

    const now = new Date();

    // Create filter (condition for updating the post)
    let filter = {
      [SequentialDocumentKey.sequenceId]: seqId,
      [MultiLingualDocumentKey.language]: langCode,
    };
    if (additionalFilter) {
      filter = {
        ...filter,
        ...additionalFilter,
      };
    }

    // Remove the document keys to **not** to update
    const omitKeys = [
      DocumentBaseKey.id, // Document ID should be immutable
      SequentialDocumentKey.sequenceId, // Sequential ID should be immutable
      MultiLingualDocumentKey.language, // Language should be immutable
      EditableDocumentKey.editNotes, // Edit notes should not be updated
      EditableDocumentKey.dateModified, // Last modified timestamp should be updated later
      EditableDocumentKey.datePublished, // Publish timestamp should not be updated
      ViewCountableDocumentKey.viewCount, // Post view count should not be changed
    ];
    omitKeys.forEach((key) => delete update[key]);

    const updateResult = await collection.updateOne(filter, {$set: update});

    // Check if there is any document that matches the criteria
    if (!updateResult.matchedCount) {
      return 'NOT_FOUND';
    }

    // Check if there is any document changed
    if (!updateResult.modifiedCount) {
      return 'NO_CHANGE';
    }

    // Add edit note and update the last modified timestamp
    await collection.updateOne(filter, {
      $set: {[EditableDocumentKey.dateModified]: now},
      $push: {
        [EditableDocumentKey.editNotes]: {
          [EditNoteDocumentKey.datetime]: now,
          [EditNoteDocumentKey.note]: editNote,
        },
      },
    });

    return 'UPDATED';
  }

  /**
   * Check if the given ID is available.
   *
   * If ``seqId`` is omitted, returns ``true``.
   * (a new ID will be automatically generated and used when publishing a post without specifying it)
   *
   * @param {T} controller class of the controller
   * @param {MongoClient} mongoClient mongo client
   * @param {Collection} collection mongo collection to check
   * @param {string} langCode post language code to be checked
   * @param {number} seqId post sequential ID to be checked
   * @return {Promise<boolean>} promise containing the availability of the ID
   */
  protected static async isIdAvailable<T extends typeof PostController>(
    controller: T, mongoClient: MongoClient, collection: Collection, langCode: string, seqId?: number,
  ): Promise<boolean> {
    if (!seqId) {
      return true;
    }

    const nextSeqId = await controller.getNextSeqId(mongoClient, {increase: false});
    if (seqId > nextSeqId + 1) {
      return false;
    }

    return !await collection
      .findOne({
        [SequentialDocumentKey.sequenceId]: seqId,
        [MultiLingualDocumentKey.language]: langCode,
      });
  }
}
