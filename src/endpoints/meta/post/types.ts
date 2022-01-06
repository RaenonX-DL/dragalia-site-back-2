import {MongoClient} from 'mongodb';

import {PostMetaParams, SupportedLanguages} from '../../../api-def/api';


export type ParamGetterOptions = {
  mongoClient: MongoClient,
  postIdentifier: number | string,
  lang: SupportedLanguages,
};

export type ParamGetterFunction = (options: ParamGetterOptions) => Promise<PostMetaParams | null>;
