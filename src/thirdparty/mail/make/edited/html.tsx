import React from 'react';

import {SupportedLanguages} from '../../../../api-def/api';
import {makeLink} from '../base/link';
import {MakeMailContentEditedHtmlOpts} from './type';


export const MailContentEditedComponent: React.FunctionComponent<MakeMailContentEditedHtmlOpts> = ({
  lang, title, sitePath, editNote,
}) => {
  const link = makeLink(sitePath);

  if (lang === SupportedLanguages.EN) {
    return (
      <>
        <p><a href={link}>{title}</a> has new update. ({editNote})</p>
      </>
    );
  }

  return (
    <>
      <p><a href={link}>{title}</a> 已更新。({editNote})</p>
    </>
  );
};
