import {FindCursor, MongoClient} from 'mongodb';

import {SupportedLanguages} from '../../../api-def/api';


type GetAnalysisOptionsCommon = {
  mongoClient: MongoClient,
  uid: string,
  lang: SupportedLanguages,
};

export type GetAnalysisLookupOptions = GetAnalysisOptionsCommon;

export type GetModifiedAnalysisOptions = GetAnalysisOptionsCommon & {
  maxCount?: number,
};

export type GetAnalysisInfoOptions = GetAnalysisOptionsCommon & {
  postFindProcess?: (cursor: FindCursor) => FindCursor,
};
