import {SupportedLanguages} from '../../../../../api-def/api';
import {MakeMailContentEditedOpts} from './type';


export const makeMailContentEditedText = ({
  lang, title, sitePath, editNote,
}: MakeMailContentEditedOpts): string => {
  if (lang === SupportedLanguages.EN) {
    return `${title} has a new update (${editNote}). Link: ${sitePath}.`;
  }

  return `文章更新: ${title} (${editNote})。連結: ${sitePath}`;
};
