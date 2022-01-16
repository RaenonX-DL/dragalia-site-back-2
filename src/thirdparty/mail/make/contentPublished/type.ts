import {GenerateMailHtmlOpts, GenerateMailOpts} from '../base/type';


export type MakeMailContentPublishedCommonOpts = {
  sitePath: string,
};

export type MakeMailContentPublishedOpts = GenerateMailOpts & MakeMailContentPublishedCommonOpts;

export type MakeMailContentPublishedHtmlOpts =
  GenerateMailHtmlOpts<MakeMailContentPublishedOpts> &
  MakeMailContentPublishedCommonOpts;
