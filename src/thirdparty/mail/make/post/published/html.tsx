import React from 'react';

import {SupportedLanguages} from '../../../../../api-def/api/other/lang';
import {makeLink} from '../../base/link';
import {MakeMailContentPublishedHtmlOpts} from './type';


export const MailContentPublishedComponent: React.FunctionComponent<MakeMailContentPublishedHtmlOpts> = ({
  lang, title, sitePath,
}) => {
  const link = makeLink(sitePath);

  if (lang === SupportedLanguages.EN) {
    return (
      <>
        <p>New post: <a href={link}>{title}</a> has been published.</p>
      </>
    );
  }

  return (
    <>
      <p>新文章: <a href={link}>{title}</a> 已發布。</p>
    </>
  );
};
