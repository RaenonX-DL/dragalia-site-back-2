import {GenerateMailHtmlOpts, GenerateMailOpts, MakeMailContentUpdatedCommonOpts} from '../../base/type';


export type MakeMailContentPublishedOpts = GenerateMailOpts & MakeMailContentUpdatedCommonOpts;

export type MakeMailContentPublishedHtmlOpts =
  GenerateMailHtmlOpts<MakeMailContentPublishedOpts> &
  MakeMailContentUpdatedCommonOpts;
