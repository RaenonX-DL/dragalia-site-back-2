import {google} from '@google-analytics/data/build/protos/protos';

import {GALangUserOfDate, GAPeriodicLangUserData} from '../../../api-def/api';
import {gaClient, property} from '../client';
import {otherLangText} from './const';


export const getPeriodicLanguageUser = async (
  daysLength: number, topLangCount: number,
): Promise<GAPeriodicLangUserData> => {
  const [response] = await gaClient.runReport({
    property,
    dateRanges: [{startDate: `${daysLength}daysAgo`, endDate: 'today'}],
    dimensions: [{name: 'date'}, {name: 'language'}],
    metrics: [{name: 'activeUsers'}],
    orderBys: [
      {
        dimension: {
          dimensionName: 'date',
          orderType: google.analytics.data.v1alpha.OrderBy.DimensionOrderBy.OrderType.NUMERIC,
        },
      },
    ],
    metricAggregations: [google.analytics.data.v1beta.MetricAggregation.TOTAL],
  });

  const result: GAPeriodicLangUserData = [];
  let entry: GALangUserOfDate | undefined = undefined;

  response.rows?.forEach((row) => {
    if (!row.dimensionValues || !row.metricValues) {
      return;
    }

    const date = row.dimensionValues[0].value;
    const lang = row.dimensionValues[1].value;

    if (!date || !lang) {
      return;
    }

    if (!entry) {
      // Initial entry creation
      entry = {date, user: {}};
    } else if (date !== entry.date) {
      // On date changed
      result.push(entry);

      entry = {date, user: {}};
    }

    const count = Number(row.metricValues[0].value);

    if (Object.keys(entry.user).length < topLangCount) {
      entry.user[lang] = count;
    } else {
      entry.user[otherLangText] = (entry.user[otherLangText] || 0) + count;
    }
  });

  if (entry) {
    result.push(entry);
  }

  return result;
};
