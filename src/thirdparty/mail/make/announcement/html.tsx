import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {MakeMailSiteAnnouncementHtmlOpts} from './type';


export const MailContentSiteAnnouncementComponent: React.FunctionComponent<MakeMailSiteAnnouncementHtmlOpts> = ({
  markdown,
}) => {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {markdown}
    </ReactMarkdown>
  );
};
