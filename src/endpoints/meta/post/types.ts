import {MongoClient} from 'mongodb';

import {PostMetaParams, SupportedLanguages} from '../../../api-def/api';


export type ParamGetterOptions = {
  mongoClient: MongoClient,
  uid: string,
  postIdentifier: number | string,
  lang: SupportedLanguages,
};

export type ParamGetterFunction = (options: ParamGetterOptions) => Promise<PostMetaParams | null>;
