import {google} from '@google-analytics/data/build/protos/protos';

import {GAPeriodicTotalUserData} from '../../../api-def/api';
import {gaClient, property} from '../client';


export const getPeriodicTotalUser = async (daysLength: number): Promise<GAPeriodicTotalUserData> => {
  const [response] = await gaClient.runReport({
    property,
    dateRanges: [{startDate: `${daysLength}daysAgo`, endDate: 'today'}],
    dimensions: [{name: 'date'}],
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

  const result: GAPeriodicTotalUserData = [];

  // Fill entries by country
  response.rows?.forEach((row) => {
    if (!row.dimensionValues || !row.metricValues || !row.dimensionValues[0].value) {
      return;
    }

    result.push({user: Number(row.metricValues[0].value), date: row.dimensionValues[0].value});
  });

  return result;
};
