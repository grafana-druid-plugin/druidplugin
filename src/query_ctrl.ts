///<reference path="../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import {QueryCtrl} from './sdk/sdk';

export class DruidQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';
  errors: any;
  addFilterMode: boolean;
  addAggregatorMode: boolean;
  addPostAggregatorMode: boolean;
  addDimensionsMode: boolean;
  addMetricsMode: boolean;
  listDataSources: any;
  getDimensionsAndMetrics: any;
  getMetrics: any;
  getDimensions: any;
  getFilterValues: any;
  queryTypes: any;
  filterTypes: any;
  aggregatorTypes: any;
  postAggregatorTypes: any;
  arithmeticPostAggregator: any;
  customGranularity: any;
  target: any;
  datasource: any;

    queryTypeValidators = {
      "timeseries": _.noop.bind(this),
      "groupBy": this.validateGroupByQuery.bind(this),
      "topN": this.validateTopNQuery.bind(this),
      "select": this.validateSelectQuery.bind(this)
    };
    filterValidators = {
      "selector": this.validateSelectorFilter.bind(this),
      "regex": this.validateRegexFilter.bind(this),
      "javascript": this.validateJavascriptFilter.bind(this)
    };
    aggregatorValidators = {
      "count": this.validateCountAggregator,
      "longSum": _.partial(this.validateSimpleAggregator.bind(this), 'longSum'),
      "doubleSum": _.partial(this.validateSimpleAggregator.bind(this), 'doubleSum'),
      "approxHistogramFold": this.validateApproxHistogramFoldAggregator.bind(this),
      "hyperUnique": _.partial(this.validateSimpleAggregator.bind(this), 'hyperUnique'),
      "thetaSketch": this.validateThetaSketchAggregator.bind(this)
    };
    postAggregatorValidators = {
      "arithmetic": this.validateArithmeticPostAggregator.bind(this),
      "quantile": this.validateQuantilePostAggregator.bind(this)
    };

    arithmeticPostAggregatorFns = {'+': null, '-': null, '*': null, '/': null};
    defaultQueryType = "timeseries";
    defaultFilterType = "selector";
    defaultAggregatorType = "count";
    defaultPostAggregator = {type: 'arithmetic', 'fn': '+'};
    customGranularities = ['second', 'minute', 'fifteen_minute', 'thirty_minute', 'hour', 'day', 'all', 'none'];
    defaultCustomGranularity = 'minute';
    defaultSelectDimension = "";
    defaultSelectMetric = "";
    defaultLimit = 5;


  /** @ngInject **/
  constructor($scope, $injector, $q) {
    super($scope, $injector);
      if (!this.target.queryType) {
        this.target.queryType = this.defaultQueryType;
      }

    this.queryTypes = _.keys(this.queryTypeValidators);
    this.filterTypes = _.keys(this.filterValidators);
    this.aggregatorTypes = _.keys(this.aggregatorValidators);
    this.postAggregatorTypes = _.keys(this.postAggregatorValidators);
    this.arithmeticPostAggregator = _.keys(this.arithmeticPostAggregatorFns);
    this.customGranularity = this.customGranularities;

    this.errors = this.validateTarget();
      if (!this.target.currentFilter) {
        this.clearCurrentFilter();
      }

      if (!this.target.currentSelect) {
        this.target.currentSelect = {};
        this.clearCurrentSelectDimension();
        this.clearCurrentSelectMetric();
      }

      if (!this.target.currentAggregator) {
        this.clearCurrentAggregator();
      }

      if (!this.target.currentPostAggregator) {
        this.clearCurrentPostAggregator();
      }

      if (!this.target.customGranularity) {
        this.target.customGranularity = this.defaultCustomGranularity;
      }

      if (!this.target.limit) {
        this.target.limit = this.defaultLimit;
      }

    // needs to be defined here as it is called from typeahead
    this.listDataSources = (query, callback) => {
      this.datasource.getDataSources()
      .then(callback);
    };

    this.getDimensions = (query, callback) => {
      return this.datasource.getDimensionsAndMetrics(this.target.druidDS)
       .then(function (dimsAndMetrics) {
       callback(dimsAndMetrics.dimensions);
       });
    };

    this.getMetrics = (query, callback) => {
    return this.datasource.getDimensionsAndMetrics(this.target.druidDS)
     .then(function (dimsAndMetrics) {
     callback(dimsAndMetrics.metrics);
     });
    };

    this.getDimensionsAndMetrics = (query, callback) => {
      console.log("getDimensionsAndMetrics.query: " + query);
      this.datasource.getDimensionsAndMetrics(this.target.druidDS)
        .then(callback);
    };

    this.getFilterValues = (query, callback) => {
      let dimension = this.target.currentFilter.dimension;
      this.datasource.getFilterValues(this.target, this.panelCtrl.range, query)
          .then(function(results){
            callback(results.data[0].result.map(function(datum){return datum[dimension]; } ));
          } );
    };

      //this.$on('typeahead-updated', function() {
      //  $timeout(this.targetBlur);
      //});
  }

    cachedAndCoalesced(ioFn, $scope, cacheName) {
      var promiseName = cacheName + "Promise";
      if (!$scope[cacheName]) {
        console.log(cacheName + ": no cached value to use");
        if (!$scope[promiseName]) {
          console.log(cacheName + ": making async call");
          $scope[promiseName] = ioFn()
            .then(function(result) {
              $scope[promiseName] = null;
              $scope[cacheName] = result;
              return $scope[cacheName];
            });
        } else {
         console.log(cacheName + ": async call already in progress...returning same promise");
        }
        return $scope[promiseName];
      } else {
        console.log(cacheName + ": using cached value");
        var deferred;// = $q.defer();
        deferred.resolve($scope[cacheName]);
        return deferred.promise;
      }
    }

  targetBlur() {
    this.errors = this.validateTarget();
    this.refresh();
  }

   addFilter() {
      if (!this.addFilterMode) {
        //Enabling this mode will display the filter inputs
        this.addFilterMode = true;
        return;
      }

      if (!this.target.filters) {
        this.target.filters = [];
      }

      this.target.errors = this.validateTarget();
      if (!this.target.errors.currentFilter) {
        //Add new filter to the list
        this.target.filters.push(this.target.currentFilter);
        this.clearCurrentFilter();
        this.addFilterMode = false;
      }

      this.targetBlur();
    }

    editFilter(index) {
      this.addFilterMode = true;
      var delFilter = this.target.filters.splice(index, 1);
      this.target.currentFilter = delFilter[0];
    }

    removeFilter(index) {
      this.target.filters.splice(index, 1);
      this.targetBlur();
    }

    clearCurrentFilter() {
      this.target.currentFilter = {type: this.defaultFilterType};
      this.addFilterMode = false;
      this.targetBlur();
    }

    addSelectDimensions() {
      if (!this.addDimensionsMode) {
        this.addDimensionsMode = true;
        return ;
      }
      if (!this.target.selectDimensions) {
        this.target.selectDimensions = [];
      }
      this.target.selectDimensions.push(this.target.currentSelect.dimension);
      this.clearCurrentSelectDimension();
    }

    removeSelectDimension(index) {
      this.target.selectDimensions.splice(index, 1);
      this.targetBlur();
    }

    clearCurrentSelectDimension() {
      this.target.currentSelect.dimension = this.defaultSelectDimension;
      this.addDimensionsMode = false;
      this.targetBlur();
    }

    addSelectMetrics() {
      if (!this.addMetricsMode) {
        this.addMetricsMode = true;
        return ;
      }
      if (!this.target.selectMetrics) {
        this.target.selectMetrics = [];
      }
      this.target.selectMetrics.push(this.target.currentSelect.metric);
      this.clearCurrentSelectMetric();
    }

    removeSelectMetric(index) {
      this.target.selectMetrics.splice(index, 1);
      this.targetBlur();
    }

    clearCurrentSelectMetric() {
      this.target.currentSelect.metric = this.defaultSelectMetric;
      this.addMetricsMode = false;
      this.targetBlur();
    }

    addAggregator() {
      if (!this.addAggregatorMode) {
        this.addAggregatorMode = true;
        return;
      }

      if (!this.target.aggregators) {
        this.target.aggregators = [];
      }

      this.target.errors = this.validateTarget();
      if (!this.target.errors.currentAggregator) {
        //Add new aggregator to the list
        this.target.aggregators.push(this.target.currentAggregator);
        this.clearCurrentAggregator();
        this.addAggregatorMode = false;
      }

      this.targetBlur();
    }

    editAggregator(index) {
      this.addAggregatorMode = true;
      var delAggregator = this.target.aggregators.splice(index, 1);
      this.target.currentAggregator = delAggregator[0];
    }
    removeAggregator(index) {
      this.target.aggregators.splice(index, 1);
      this.targetBlur();
    }

    clearCurrentAggregator() {
      this.target.currentAggregator = {type: this.defaultAggregatorType};
      this.addAggregatorMode = false;
      this.targetBlur();
    }

    addPostAggregator() {
      if (!this.addPostAggregatorMode) {
        this.addPostAggregatorMode = true;
        return;
      }

      if (!this.target.postAggregators) {
        this.target.postAggregators = [];
      }

      this.target.errors = this.validateTarget();
      if (!this.target.errors.currentPostAggregator) {
        //Add new post aggregator to the list
        this.target.postAggregators.push(this.target.currentPostAggregator);
        this.clearCurrentPostAggregator();
        this.addPostAggregatorMode = false;
      }

      this.targetBlur();
    }

    removePostAggregator(index) {
      this.target.postAggregators.splice(index, 1);
      this.targetBlur();
    }

    clearCurrentPostAggregator() {
      this.target.currentPostAggregator = _.clone(this.defaultPostAggregator);;
      this.addPostAggregatorMode = false;
      this.targetBlur();
    }

    isValidFilterType(type) {
      return _.has(this.filterValidators, type);
    }

    isValidAggregatorType(type) {
      return _.has(this.aggregatorValidators, type);
    }

    isValidPostAggregatorType(type) {
      return _.has(this.postAggregatorValidators, type);
    }

    isValidQueryType(type) {
      return _.has(this.queryTypeValidators, type);
    }

    isValidArithmeticPostAggregatorFn(fn) {
      return _.includes(this.arithmeticPostAggregator, fn);
    }

    validateMaxDataPoints(target, errs) {
      if (target.maxDataPoints) {
        var intMax = parseInt(target.maxDataPoints);
        if (isNaN(intMax) || intMax <= 0) {
          errs.maxDataPoints = "Must be a positive integer";
          return false;
        }
        target.maxDataPoints = intMax;
      }
      return true;
    }

    validateLimit(target, errs) {
      if (!target.limit) {
        errs.limit = "Must specify a limit";
        return false;
      }
      var intLimit = parseInt(target.limit);
      if (isNaN(intLimit)) {
        errs.limit = "Limit must be a integer";
        return false;
      }
      target.limit = intLimit;
      return true;
    }

    validateOrderBy(target) {
      if (target.orderBy && !Array.isArray(target.orderBy)) {
        target.orderBy = target.orderBy.split(",");
      }
      return true;
    }

    validateGroupByQuery(target, errs) {
      if (target.groupBy && !Array.isArray(target.groupBy)) {
        target.groupBy = target.groupBy.split(",");
      }
      if (!target.groupBy) {
        errs.groupBy = "Must list dimensions to group by.";
        return false;
      }
      if (!this.validateLimit(target, errs) || !this.validateOrderBy(target)) {
        return false;
      }
      return true;
    }

    validateTopNQuery(target, errs) {
      if (!target.dimension) {
        errs.dimension = "Must specify a dimension";
        return false;
      }
      if (!target.druidMetric) {
        errs.druidMetric = "Must specify a metric";
        return false;
      }
      console.log(this, this.validateLimit);
      if (!this.validateLimit(target, errs)) {
        return false;
      }
      return true;
    }

    validateSelectQuery(target, errs) {
      if (!target.selectThreshold && target.selectThreshold <= 0) {
        errs.selectThreshold = "Must specify a positive number";
        return false;
      }
      return true;
    }

    validateSelectorFilter(target) {
      if (!target.currentFilter.dimension) {
        return "Must provide dimension name for selector filter.";
      }
      if (!target.currentFilter.value) {
        // TODO Empty string is how you match null or empty in Druid
        return "Must provide dimension value for selector filter.";
      }
      return null;
    }

    validateJavascriptFilter(target) {
      if (!target.currentFilter.dimension) {
        return "Must provide dimension name for javascript filter.";
      }
      if (!target.currentFilter["function"]) {
        return "Must provide func value for javascript filter.";
      }
      return null;
    }

    validateRegexFilter(target) {
      if (!target.currentFilter.dimension) {
        return "Must provide dimension name for regex filter.";
      }
      if (!target.currentFilter.pattern) {
        return "Must provide pattern for regex filter.";
      }
      return null;
    }

    validateCountAggregator(target) {
      if (!target.currentAggregator.name) {
        return "Must provide an output name for count aggregator.";
      }
      return null;
    }

    validateSimpleAggregator(type, target) {
      if (!target.currentAggregator.name) {
        return "Must provide an output name for " + type + " aggregator.";
      }
      if (!target.currentAggregator.fieldName) {
        return "Must provide a metric name for " + type + " aggregator.";
      }
      //TODO - check that fieldName is a valid metric (exists and of correct type)
      return null;
    }

    validateApproxHistogramFoldAggregator(target) {
      var err = this.validateSimpleAggregator('approxHistogramFold', target);
      if (err) { return err; }
      //TODO - check that resolution and numBuckets are ints (if given)
      //TODO - check that lowerLimit and upperLimit are flots (if given)
      return null;
    }

    validateThetaSketchAggregator(target) {
      var err = this.validateSimpleAggregator('thetaSketch', target);
      if (err) { return err;}
      return null;
    }

    validateSimplePostAggregator(type, target) {
      if (!target.currentPostAggregator.name) {
        return "Must provide an output name for " + type + " post aggregator.";
      }
      if (!target.currentPostAggregator.fieldName) {
        return "Must provide an aggregator name for " + type + " post aggregator.";
      }
      //TODO - check that fieldName is a valid aggregation (exists and of correct type)
      return null;
    }

    validateQuantilePostAggregator(target) {
      var err = this.validateSimplePostAggregator('quantile', target);
      if (err) { return err; }
      if (!target.currentPostAggregator.probability) {
        return "Must provide a probability for the quantile post aggregator.";
      }
      return null;
    }

    validateArithmeticPostAggregator(target) {
      if (!target.currentPostAggregator.name) {
        return "Must provide an output name for arithmetic post aggregator.";
      }
      if (!target.currentPostAggregator.fn) {
        return "Must provide a function for arithmetic post aggregator.";
      }
      if (!this.isValidArithmeticPostAggregatorFn(target.currentPostAggregator.fn)) {
        return "Invalid arithmetic function";
      }
      if (!target.currentPostAggregator.fields) {
        return "Must provide a list of fields for arithmetic post aggregator.";
      } else {
        if (!Array.isArray(target.currentPostAggregator.fields)) {
          target.currentPostAggregator.fields = target.currentPostAggregator.fields
            .split(",")
            .map(function (f) { return f.trim(); })
            .map(function (f) { return {type: "fieldAccess", fieldName: f}; });
        }
        if (target.currentPostAggregator.fields.length < 2) {
          return "Must provide at least two fields for arithmetic post aggregator.";
        }
      }
      return null;
    }

  validateTarget() {
    var validatorOut, errs: any = {};
      if (!this.target.druidDS) {
        errs.druidDS = "You must supply a druidDS name.";
      }

      if (!this.target.queryType) {
        errs.queryType = "You must supply a query type.";
      } else if (!this.isValidQueryType(this.target.queryType)) {
        errs.queryType = "Unknown query type: " + this.target.queryType + ".";
      } else {
        this.queryTypeValidators[this.target.queryType](this.target, errs);
      }

      if (this.target.shouldOverrideGranularity) {
        if (this.target.customGranularity) {
          if (!_.includes(this.customGranularity, this.target.customGranularity)) {
            errs.customGranularity = "Invalid granularity.";
          }
        } else {
          errs.customGranularity = "You must choose a granularity.";
        }
      } else {
        this.validateMaxDataPoints(this.target, errs);
      }

      if (this.addFilterMode) {
        if (!this.isValidFilterType(this.target.currentFilter.type)) {
          errs.currentFilter = "Invalid filter type: " + this.target.currentFilter.type + ".";
        } else {
          validatorOut = this.filterValidators[this.target.currentFilter.type](this.target);
          if (validatorOut) {
            errs.currentFilter = validatorOut;
          }
        }
      }

      if (this.addAggregatorMode) {
        if (!this.isValidAggregatorType(this.target.currentAggregator.type)) {
          errs.currentAggregator = "Invalid aggregator type: " + this.target.currentAggregator.type + ".";
        } else {
          validatorOut = this.aggregatorValidators[this.target.currentAggregator.type](this.target);
          if (validatorOut) {
            errs.currentAggregator = validatorOut;
          }
        }
      }

      if (_.isEmpty(this.target.aggregators) && !_.isEqual(this.target.queryType, "select")) {
        errs.aggregators = "You must supply at least one aggregator";
      }

      if (this.addPostAggregatorMode) {
        if (!this.isValidPostAggregatorType(this.target.currentPostAggregator.type)) {
          errs.currentPostAggregator = "Invalid post aggregator type: " + this.target.currentPostAggregator.type + ".";
        } else {
          validatorOut = this.postAggregatorValidators[this.target.currentPostAggregator.type](this.target);
          if (validatorOut) {
            errs.currentPostAggregator = validatorOut;
          }
        }
      }

    return errs;
  }
}
