import React from 'react';

import {SupportedLanguages} from '../../../../api-def/api';
import {I18nData} from '../../../../i18n/trans/mail/data';
import {styles} from './styles';


export type EmailContentProps = {
  title: string,
  content: React.ReactNode,
  lang: SupportedLanguages,
};

export const EmailContent: React.FunctionComponent<EmailContentProps> = ({
  title,
  content,
  lang,
}) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8"/>
        <title>{title}</title>
      </head>
      <body style={styles.body}>
        <h5 style={styles.titleText}>{I18nData.mail.title[lang]}</h5>
        <div style={styles.titleImage}/>
        <h2>{title}</h2>
        <p>{content}</p>
      </body>
    </html>
  );
};
