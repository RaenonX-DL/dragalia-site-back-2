import {google} from '@google-analytics/data/build/protos/protos';

import {GAActiveEntry, GAPeriodicActiveUserData} from '../../../api-def/api';
import {gaClient, property} from '../client';


export const getPeriodicActiveUser = async (
  daysLength: number,
): Promise<GAPeriodicActiveUserData> => {
  const [response] = await gaClient.runReport({
    property,
    dateRanges: [{startDate: `${daysLength}daysAgo`, endDate: 'today'}],
    dimensions: [{name: 'date'}],
    metrics: [{name: 'active1DayUsers'}, {name: 'active7DayUsers'}, {name: 'active28DayUsers'}],
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

  const result: GAPeriodicActiveUserData = {
    data: [],
  };

  response.rows?.forEach((row) => {
    if (!row.dimensionValues || !row.metricValues) {
      return;
    }

    const date = row.dimensionValues[0].value;
    const D1 = Number(row.metricValues[0].value);
    const D7 = Number(row.metricValues[1].value);
    const D28 = Number(row.metricValues[2].value);

    if (!date) {
      return;
    }

    const entry: GAActiveEntry = {
      date,
      D1,
      D7,
      D28,
    };

    result.data.push(entry);
  });

  return result;
};
