export interface AbstractDruidQuery {
  dataSource: string;
  intervals: Array<string>;
  granularity: Granularity;
  queryType: string;
  filter?: DruidFilter;
  aggregations?: Object;
  postAggregations?: Object;
  context?: Object;
}

export enum Granularity {
  all = 'all',
  none = 'none',
  second = 'second',
  minute = 'minute',
  fifteen_minute = 'fifteen_minute',
  thirty_minute = 'thirty_minute',
  hour = 'hour',
  day = 'day',
  week = 'week',
  month = 'month',
  quarter = 'quarter',
  year = 'year'
}

export interface LimitSpec {
  type: 'default';
  limit: number;
  columns: Array<OrderByColumnSpec>;
}

export interface OrderByColumnSpec {
  dimension: string;
  direction: 'ascending' | 'descending';
  dimensionOrder: 'lexicographic' | 'alphanumeric' | 'strlen' | 'numeric';
}

export interface DruidGroupByQuery extends AbstractDruidQuery {
  queryType: 'groupBy';
  dimensions: Array<string>;
  limitSpec?: LimitSpec;
  having?: Object;
}

export interface DruidTimeSeriesQuery extends AbstractDruidQuery {
  queryType: 'timeseries';
  descending?: 'true' | 'false';
}

export interface DruidTopNQuery extends AbstractDruidQuery {
  queryType: 'topN';
  dimension: string | Object;
  threshold: number;
  metric: string | Object;
}

export interface DruidSelectQuery extends AbstractDruidQuery {
  pagingSpec: {
    pagingIdentifiers: {};
    threshold: Object;
  };
  dimensions: Array<string | Object>;
  metrics: Array<string | Object>;
}

export interface DruidFilterLogical {
  type: 'or' | 'and';
  fields: DruidFilter[];
}

export interface DruidFilterNot {
  type: 'not';
  field: DruidFilter;
}

export interface DruidFilterSelect {
  type: 'selector';
  dimension: string;
  value: string;
}

export interface DruidFilterIn {
  type: string;
  dimension: string;
  values: Array<string>;
}

export interface DruidFilterRegex {
  type: 'regex';
  dimension: string;
  pattern: string;
}

export type DruidFilter = DruidFilterLogical | DruidFilterSelect | DruidFilterRegex | DruidFilterIn | DruidFilterNot;