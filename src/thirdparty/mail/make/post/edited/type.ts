import {GenerateMailHtmlOpts, GenerateMailOpts, MakeMailContentUpdatedCommonOpts} from '../../base/type';


export type MakeMailContentEditedOpts = GenerateMailOpts & MakeMailContentUpdatedCommonOpts & {
  editNote: string,
};

export type MakeMailContentEditedHtmlOpts =
  GenerateMailHtmlOpts<MakeMailContentEditedOpts> &
  MakeMailContentUpdatedCommonOpts;
