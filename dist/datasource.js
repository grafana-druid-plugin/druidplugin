/*
 * Copyright 2014-2015 Quantiply Corporation. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([
  'angular',
  'lodash',
  'app/core/utils/datemath',
  'moment',
],
function (angular, _, dateMath, moment) {
  'use strict';

  /** @ngInject */
  function DruidDatasource(instanceSettings, $q, backendSrv, templateSrv) {
    this.type = 'druid-datasource';
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.basicAuth = instanceSettings.basicAuth;
    instanceSettings.jsonData = instanceSettings.jsonData || {};
    this.supportMetrics = true;
    this.periodGranularity = instanceSettings.jsonData.periodGranularity;

    function replaceTemplateValues(obj, attrList) {
      var substitutedVals = attrList.map(function (attr) {
        return templateSrv.replace(obj[attr]);
      });
      return _.assign(_.clone(obj, true), _.zipObject(attrList, substitutedVals));
    }

    var GRANULARITIES = [
      ['minute', moment.duration(1, 'minute')],
      ['fifteen_minute', moment.duration(15, 'minute')],
      ['thirty_minute', moment.duration(30, 'minute')],
      ['hour', moment.duration(1, 'hour')],
      ['day', moment.duration(1, 'day')]
    ];

    var filterTemplateExpanders = {
      "selector": _.partialRight(replaceTemplateValues, ['value']),
      "regex": _.partialRight(replaceTemplateValues, ['pattern']),
      "javascript": _.partialRight(replaceTemplateValues, ['function']),
      "search": _.partialRight(replaceTemplateValues, []),
    };

    this.testDatasource = function() {
      return this._get('/druid/v2/datasources').then(function () {
        return { status: "success", message: "Druid Data source is working", title: "Success" };
      });
    };

    //Get list of available datasources
    this.getDataSources = function() {
      return this._get('/druid/v2/datasources').then(function (response) {
        return response.data;
      });
    };

    this.getDimensionsAndMetrics = function (datasource) {
      return this._get('/druid/v2/datasources/'+ datasource).then(function (response) {
        return response.data;
      });
    };

    this.getFilterValues = function (target, panelRange, query) {
        var topNquery = {
            "queryType": "topN",
            "dataSource": target.druidDS,
            "granularity": 'all',
            "threshold": 10,
            "dimension": target.currentFilter.dimension,
            "metric": "count",
            "aggregations": [{ "type" : "count", "name" : "count" }],
            "intervals" : getQueryIntervals(panelRange.from, panelRange.to)
        };

        var filters = [];
        if(target.filters){
            filters = angular.copy(target.filters);
        }
        filters.push({
            "type": "search",
            "dimension": target.currentFilter.dimension,
            "query": {
                "type": "insensitive_contains",
                "value": query
            }
        });
        topNquery.filter = buildFilterTree(filters);

        return this._druidQuery(topNquery);
    };

    this._get = function(relativeUrl, params) {
      return backendSrv.datasourceRequest({
        method: 'GET',
        url: this.url + relativeUrl,
        params: params,
      });
    };

    // Called once per panel (graph)
    this.query = function(options) {
      var dataSource = this;
      var from = dateToMoment(options.range.from, false);
      var to = dateToMoment(options.range.to, true);

      console.log("Do query");
      console.log(options);

      var promises = options.targets.map(function (target) {
        if (target.hide===true || _.isEmpty(target.druidDS) || (_.isEmpty(target.aggregators) && target.queryType !== "select")) {
          console.log("target.hide: " + target.hide + ", target.druidDS: " + target.druidDS + ", target.aggregators: " + target.aggregators);
          var d = $q.defer();
          d.resolve([]);
          return d.promise;
        }
        var maxDataPointsByResolution = options.maxDataPoints;
        var maxDataPointsByConfig = target.maxDataPoints? target.maxDataPoints : Number.MAX_VALUE;
        var maxDataPoints = Math.min(maxDataPointsByResolution, maxDataPointsByConfig);
        var granularity = target.shouldOverrideGranularity? target.customGranularity : computeGranularity(from, to, maxDataPoints);
        //Round up to start of an interval
        //Width of bar chars in Grafana is determined by size of the smallest interval
        var roundedFrom = granularity === "all" ? from : roundUpStartTime(from, granularity);
        if(dataSource.periodGranularity!=""){
            if(granularity==='day'){
                granularity = {"type": "period", "period": "P1D", "timeZone": dataSource.periodGranularity}
            }
        }
        return dataSource._doQuery(roundedFrom, to, granularity, target);
      });

      return $q.all(promises).then(function(results) {
        return { data: _.flatten(results) };
      });
    };

    this._doQuery = function (from, to, granularity, target) {
      var datasource = target.druidDS;
      var filters = target.filters;
      var aggregators = target.aggregators;
      var postAggregators = target.postAggregators;
      var groupBy = _.map(target.groupBy, (e) => { return templateSrv.replace(e) });
      var limitSpec = null;
      var metricNames = getMetricNames(aggregators, postAggregators);
      var intervals = getQueryIntervals(from, to);
      var promise = null;

      var selectMetrics = target.selectMetrics;
      var selectDimensions = target.selectDimensions;
      var selectThreshold = target.selectThreshold;
      if(!selectThreshold) {
        selectThreshold = 5;
      }

      if (target.queryType === 'topN') {
        var threshold = target.limit;
        var metric = target.druidMetric;
        var dimension = templateSrv.replace(target.dimension);
        promise = this._topNQuery(datasource, intervals, granularity, filters, aggregators, postAggregators, threshold, metric, dimension)
          .then(function(response) {
            return convertTopNData(response.data, dimension, metric);
          });
      }
      else if (target.queryType === 'groupBy') {
        limitSpec = getLimitSpec(target.limit, target.orderBy);
        promise = this._groupByQuery(datasource, intervals, granularity, filters, aggregators, postAggregators, groupBy, limitSpec)
          .then(function(response) {
            return convertGroupByData(response.data, groupBy, metricNames);
          });
      }
      else if (target.queryType === 'select') {
        promise = this._selectQuery(datasource, intervals, granularity, selectDimensions, selectMetrics, filters, selectThreshold);
        return promise.then(function(response) {
          return convertSelectData(response.data);
        });
      }
      else {
        promise = this._timeSeriesQuery(datasource, intervals, granularity, filters, aggregators, postAggregators)
          .then(function(response) {
            return convertTimeSeriesData(response.data, metricNames);
          });
      }
      /*
        At this point the promise will return an list of time series of this form
      [
        {
          target: <metric name>,
          datapoints: [
            [<metric value>, <timestamp in ms>],
            ...
          ]
        },
        ...
      ]

      Druid calculates metrics based on the intervals specified in the query but returns a timestamp rounded down.
      We need to adjust the first timestamp in each time series
      */
      return promise.then(function (metrics) {
        var fromMs = formatTimestamp(from);
        metrics.forEach(function (metric) {
          if (!_.isEmpty(metric.datapoints[0]) && metric.datapoints[0][1] < fromMs) {
            metric.datapoints[0][1] = fromMs;
          }
        });
        return metrics;
      });
    };

    this._selectQuery = function (datasource, intervals, granularity, dimension, metric, filters, selectThreshold) {
      var query = {
        "queryType": "select",
        "dataSource": datasource,
        "granularity": granularity,
        "pagingSpec": {"pagingIdentifiers": {}, "threshold": selectThreshold},
        "dimensions": dimension,
        "metrics": metric,
        "intervals": intervals
      };

      if (filters && filters.length > 0) {
        query.filter = buildFilterTree(filters);
      }

      return this._druidQuery(query);
    };

    this._timeSeriesQuery = function (datasource, intervals, granularity, filters, aggregators, postAggregators) {
      var query = {
        "queryType": "timeseries",
        "dataSource": datasource,
        "granularity": granularity,
        "aggregations": aggregators,
        "postAggregations": postAggregators,
        "intervals": intervals
      };

      if (filters && filters.length > 0) {
        query.filter = buildFilterTree(filters);
      }

      return this._druidQuery(query);
    };

    this._topNQuery = function (datasource, intervals, granularity, filters, aggregators, postAggregators,
    threshold, metric, dimension) {
      var query = {
        "queryType": "topN",
        "dataSource": datasource,
        "granularity": granularity,
        "threshold": threshold,
        "dimension": dimension,
        "metric": metric,
        // "metric": {type: "inverted", metric: metric},
        "aggregations": aggregators,
        "postAggregations": postAggregators,
        "intervals": intervals
      };

      if (filters && filters.length > 0) {
        query.filter = buildFilterTree(filters);
      }

      return this._druidQuery(query);
    };

    this._groupByQuery = function (datasource, intervals, granularity, filters, aggregators, postAggregators,
    groupBy, limitSpec) {
      var query = {
        "queryType": "groupBy",
        "dataSource": datasource,
        "granularity": granularity,
        "dimensions": groupBy,
        "aggregations": aggregators,
        "postAggregations": postAggregators,
        "intervals": intervals,
        "limitSpec": limitSpec
      };

      if (filters && filters.length > 0) {
        query.filter = buildFilterTree(filters);
      }

      return this._druidQuery(query);
    };

    this._druidQuery = function (query) {
      var options = {
        method: 'POST',
        url: this.url + '/druid/v2/',
        data: query
      };
      console.log("Make http request");
      console.log(options);
      return backendSrv.datasourceRequest(options);
    };

    function getLimitSpec(limitNum, orderBy) {
      return {
        "type": "default",
        "limit": limitNum,
        "columns": !orderBy? null: orderBy.map(function (col) {
          return {"dimension": col, "direction": "DESCENDING"};
        })
      };
    }

    function buildFilterTree(filters) {
      //Do template variable replacement
      var replacedFilters = filters.map(function (filter) {
        return filterTemplateExpanders[filter.type](filter);
      })
      .map(function (filter) {
        var finalFilter = _.omit(filter, 'negate');
        if (filter.negate) {
          return { "type": "not", "field": finalFilter };
        }
        return finalFilter;
      });
      if (replacedFilters) {
        if (replacedFilters.length === 1) {
          return replacedFilters[0];
        }
        return  {
          "type": "and",
          "fields": replacedFilters
        };
      }
      return null;
    }

    function getQueryIntervals(from, to) {
      return [from.toISOString() + '/' + to.toISOString()];
    }

    function getMetricNames(aggregators, postAggregators) {
      var displayAggs = _.filter(aggregators, function (agg) {
        return agg.type !== 'approxHistogramFold' && agg.hidden != true;
      });
      return _.union(_.map(displayAggs, 'name'), _.map(postAggregators, 'name'));
    }

    function formatTimestamp(ts) {
      return moment(ts).format('X')*1000;
    }

    function convertTimeSeriesData(md, metrics) {
      return metrics.map(function (metric) {
        return {
          target: metric,
          datapoints: md.map(function (item) {
            return [
              item.result[metric],
              formatTimestamp(item.timestamp)
            ];
          })
        };
      });
    }

    function getGroupName(groupBy, metric) {
      return groupBy.map(function (dim) {
        return metric.event[dim];
      })
      .join("-");
    }

    function convertTopNData(md, dimension, metric) {
      /*
        Druid topN results look like this:
        [
          {
            "timestamp": "ts1",
            "result": [
              {"<dim>": d1, "<metric>": mv1},
              {"<dim>": d2, "<metric>": mv2}
            ]
          },
          {
            "timestamp": "ts2",
            "result": [
              {"<dim>": d1, "<metric>": mv3},
              {"<dim>": d2, "<metric>": mv4}
            ]
          },
          ...
        ]
      */

      /*
        First, we need make sure that the result for each
        timestamp contains entries for all distinct dimension values
        in the entire list of results.

        Otherwise, if we do a stacked bar chart, Grafana doesn't sum
        the metrics correctly.
      */

      //Get the list of all distinct dimension values for the entire result set
      var dVals = md.reduce(function (dValsSoFar, tsItem) {
        var dValsForTs = _.map(tsItem.result, dimension);
        return _.union(dValsSoFar, dValsForTs);
      }, {});

      //Add null for the metric for any missing dimension values per timestamp result
      md.forEach(function (tsItem) {
        var dValsPresent = _.map(tsItem.result, dimension);
        var dValsMissing = _.difference(dVals, dValsPresent);
        dValsMissing.forEach(function (dVal) {
          var nullPoint = {};
          nullPoint[dimension] = dVal;
          nullPoint[metric] = null;
          tsItem.result.push(nullPoint);
        });
        return tsItem;
      });

      //Re-index the results by dimension value instead of time interval
      var mergedData = md.map(function (item) {
        /*
          This first map() transforms this into a list of objects
          where the keys are dimension values
          and the values are [metricValue, unixTime] so that we get this:
            [
              {
                "d1": [mv1, ts1],
                "d2": [mv2, ts1]
              },
              {
                "d1": [mv3, ts2],
                "d2": [mv4, ts2]
              },
              ...
            ]
        */
        var timestamp = formatTimestamp(item.timestamp);
        var keys = _.map(item.result, dimension);
        var vals = _.map(item.result, metric).map(function (val) { return [val, timestamp];});
        return _.zipObject(keys, vals);
      })
      .reduce(function (prev, curr) {
        /*
          Reduce() collapses all of the mapped objects into a single
          object.  The keys are dimension values
          and the values are arrays of all the values for the same key.
          The _.assign() function merges objects together and it's callback
          gets invoked for every key,value pair in the source (2nd argument).
          Since our initial value for reduce() is an empty object,
          the _.assign() callback will get called for every new val
          that we add to the final object.
        */
        return _.assignWith(prev, curr, function (pVal, cVal) {
          if (pVal) {
            pVal.push(cVal);
            return pVal;
          }
          return [cVal];
        });
      }, {});

      //Convert object keyed by dimension values into an array
      //of objects {target: <dimVal>, datapoints: <metric time series>}
      return _.map(mergedData, function (vals, key) {
        return {
          target: key,
          datapoints: vals
        };
      });
    }

    function convertGroupByData(md, groupBy, metrics) {
      var mergedData = md.map(function (item) {
        /*
          The first map() transforms the list Druid events into a list of objects
          with keys of the form "<groupName>:<metric>" and values
          of the form [metricValue, unixTime]
        */
        var groupName = getGroupName(groupBy, item);
        var keys = metrics.map(function (metric) {
          return groupName + ":" + metric;
        });
        var vals = metrics.map(function (metric) {
          return [
            item.event[metric],
            formatTimestamp(item.timestamp)
          ];
        });
        return _.zipObject(keys, vals);
      })
      .reduce(function (prev, curr) {
        /*
          Reduce() collapses all of the mapped objects into a single
          object.  The keys are still of the form "<groupName>:<metric>"
          and the values are arrays of all the values for the same key.
          The _.assign() function merges objects together and it's callback
          gets invoked for every key,value pair in the source (2nd argument).
          Since our initial value for reduce() is an empty object,
          the _.assign() callback will get called for every new val
          that we add to the final object.
        */
        return _.assignWith(prev, curr, function (pVal, cVal) {
          if (pVal) {
            pVal.push(cVal);
            return pVal;
          }
          return [cVal];
        });
      }, {});

      return _.map(mergedData, function (vals, key) {
        /*
          Second map converts the aggregated object into an array
        */
        return {
          target: key,
          datapoints: vals
        };
      });
    }

    function convertSelectData(data){
      var resultList = _.map(data, "result");
      var eventsList = _.map(resultList, "events");
      var eventList = _.flatten(eventsList);
      var result = {};
      for(var i = 0; i < eventList.length; i++){
        var event = eventList[i].event;
        var timestamp = event.timestamp;
        if(_.isEmpty(timestamp)) {
          continue;
        }
        for(var key in event) {
          if(key !== "timestamp") {
            if(!result[key]){
              result[key] = {"target":key, "datapoints":[]};
            }
            result[key].datapoints.push([event[key], timestamp]);
          }
        }
      }
      return _.values(result);
    }

    function dateToMoment(date, roundUp) {
      if (date === 'now') {
        return moment();
      }
      date = dateMath.parse(date, roundUp);
      return moment(date.valueOf());
    }

    function computeGranularity(from, to, maxDataPoints) {
      var intervalSecs = to.unix() - from.unix();
      /*
        Find the smallest granularity for which there
        will be fewer than maxDataPoints
      */
      var granularityEntry = _.find(GRANULARITIES, function(gEntry) {
        return Math.ceil(intervalSecs/gEntry[1].asSeconds()) <= maxDataPoints;
      });

      console.log("Calculated \"" + granularityEntry[0]  +  "\" granularity [" + Math.ceil(intervalSecs/granularityEntry[1].asSeconds()) +
      " pts]" + " for " + (intervalSecs/60).toFixed(0) + " minutes and max of " + maxDataPoints + " data points");
      return granularityEntry[0];
    }

    function roundUpStartTime(from, granularity) {
      var duration = _.find(GRANULARITIES, function (gEntry) {
        return gEntry[0] === granularity;
      })[1];
      var rounded = null;
      if(granularity==='day'){
        rounded = moment(+from).startOf('day');
      }else{
        rounded = moment(Math.ceil((+from)/(+duration)) * (+duration));
      }
      console.log("Rounding up start time from " + from.format() + " to " + rounded.format() + " for granularity [" + granularity + "]");
      return rounded;
    }

   //changes druid end
  }
  return {
    DruidDatasource: DruidDatasource
  };
});
