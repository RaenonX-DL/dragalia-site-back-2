import {PostConstructParamsNoTitle, PostDocumentBaseNoTitle, PostNoTitle} from './postNoTitle';

export enum PostDocumentKey {
  title = 't',
}

export type PostDocumentBase = PostDocumentBaseNoTitle & {
  [PostDocumentKey.title]: string,
}

export type PostConstructParams = PostConstructParamsNoTitle & {
  title: string,
}

/**
 * Post data class.
 */
export abstract class Post extends PostNoTitle {
  title: string;

  /**
   * Construct a post data.
   *
   * @param {PostConstructParams} params parameters to construct a post data
   */
  protected constructor(params: PostConstructParams) {
    super(params);

    this.title = params.title;
  }

  /**
   * @inheritDoc
   */
  toObject(): PostDocumentBase {
    return {
      ...super.toObject(),
      [PostDocumentKey.title]: this.title,
    };
  }
}
