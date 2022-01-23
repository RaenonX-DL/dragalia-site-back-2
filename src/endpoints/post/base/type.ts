import {PostEditResult, PostPublishResult} from '../../../api-def/api';
import {UpdateResult} from '../../../base/enum/updateResult';


export type PostEditResultCommon = PostEditResult & {
  updated: UpdateResult,
};

type SequencedUpdateResultCommon = {
  seqId: number
};

export type SequencedEditResult = PostEditResultCommon & SequencedUpdateResultCommon;

export type SequencedPublishResult = PostPublishResult & SequencedUpdateResultCommon;
