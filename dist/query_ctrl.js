System.register(["lodash", "app/plugins/sdk", "./css/query_editor.css!"], function (exports_1, context_1) {
    "use strict";
    var __extends = (this && this.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var lodash_1, sdk_1, DruidQueryCtrl;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (sdk_1_1) {
                sdk_1 = sdk_1_1;
            },
            function (_1) {
            }
        ],
        execute: function () {
            DruidQueryCtrl = (function (_super) {
                __extends(DruidQueryCtrl, _super);
                function DruidQueryCtrl($scope, $injector, $q) {
                    var _this = _super.call(this, $scope, $injector) || this;
                    _this.queryTypeValidators = {
                        "timeseries": lodash_1.default.noop.bind(_this),
                        "groupBy": _this.validateGroupByQuery.bind(_this),
                        "topN": _this.validateTopNQuery.bind(_this),
                        "select": _this.validateSelectQuery.bind(_this)
                    };
                    _this.filterValidators = {
                        "selector": _this.validateSelectorFilter.bind(_this),
                        "regex": _this.validateRegexFilter.bind(_this),
                        "javascript": _this.validateJavascriptFilter.bind(_this)
                    };
                    _this.aggregatorValidators = {
                        "count": _this.validateCountAggregator,
                        "cardinality": lodash_1.default.partial(_this.validateCardinalityAggregator.bind(_this), 'cardinality'),
                        "longSum": lodash_1.default.partial(_this.validateSimpleAggregator.bind(_this), 'longSum'),
                        "doubleSum": lodash_1.default.partial(_this.validateSimpleAggregator.bind(_this), 'doubleSum'),
                        "approxHistogramFold": _this.validateApproxHistogramFoldAggregator.bind(_this),
                        "hyperUnique": lodash_1.default.partial(_this.validateSimpleAggregator.bind(_this), 'hyperUnique'),
                        "thetaSketch": _this.validateThetaSketchAggregator.bind(_this)
                    };
                    _this.postAggregatorValidators = {
                        "arithmetic": _this.validateArithmeticPostAggregator.bind(_this),
                        "max": _this.validateMaxPostAggregator.bind(_this),
                        "min": _this.validateMinPostAggregator.bind(_this),
                        "quantile": _this.validateQuantilePostAggregator.bind(_this)
                    };
                    _this.arithmeticPostAggregatorFns = { '+': null, '-': null, '*': null, '/': null };
                    _this.defaultQueryType = "timeseries";
                    _this.defaultFilterType = "selector";
                    _this.defaultAggregatorType = "count";
                    _this.defaultPostAggregator = { type: 'arithmetic', 'fn': '+' };
                    _this.customGranularities = ['second', 'minute', 'fifteen_minute', 'thirty_minute', 'hour', 'day', 'week', 'month', 'quarter', 'year', 'all'];
                    _this.defaultCustomGranularity = 'minute';
                    _this.defaultSelectDimension = "";
                    _this.defaultSelectMetric = "";
                    _this.defaultLimit = 5;
                    if (!_this.target.queryType) {
                        _this.target.queryType = _this.defaultQueryType;
                    }
                    _this.queryTypes = lodash_1.default.keys(_this.queryTypeValidators);
                    _this.filterTypes = lodash_1.default.keys(_this.filterValidators);
                    _this.aggregatorTypes = lodash_1.default.keys(_this.aggregatorValidators);
                    _this.postAggregatorTypes = lodash_1.default.keys(_this.postAggregatorValidators);
                    _this.arithmeticPostAggregator = lodash_1.default.keys(_this.arithmeticPostAggregatorFns);
                    _this.customGranularity = _this.customGranularities;
                    _this.errors = _this.validateTarget();
                    if (!_this.target.currentFilter) {
                        _this.clearCurrentFilter();
                    }
                    if (!_this.target.currentSelect) {
                        _this.target.currentSelect = {};
                        _this.clearCurrentSelectDimension();
                        _this.clearCurrentSelectMetric();
                    }
                    if (!_this.target.currentAggregator) {
                        _this.clearCurrentAggregator();
                    }
                    if (!_this.target.currentPostAggregator) {
                        _this.clearCurrentPostAggregator();
                    }
                    if (!_this.target.customGranularity) {
                        _this.target.customGranularity = _this.defaultCustomGranularity;
                    }
                    if (!_this.target.limit) {
                        _this.target.limit = _this.defaultLimit;
                    }
                    _this.listDataSources = function (query, callback) {
                        _this.datasource.getDataSources()
                            .then(callback);
                    };
                    _this.getDimensions = function (query, callback) {
                        return _this.datasource.getDimensionsAndMetrics(_this.target.druidDS)
                            .then(function (dimsAndMetrics) {
                            callback(dimsAndMetrics.dimensions);
                        });
                    };
                    _this.getMetrics = function (query, callback) {
                        return _this.datasource.getDimensionsAndMetrics(_this.target.druidDS)
                            .then(function (dimsAndMetrics) {
                            callback(dimsAndMetrics.metrics);
                        });
                    };
                    _this.getMetricsPlusDimensions = function (query, callback) {
                        return _this.datasource.getDimensionsAndMetrics(_this.target.druidDS)
                            .then(function (dimsAndMetrics) {
                            callback([].concat(dimsAndMetrics.metrics).concat(dimsAndMetrics.dimensions));
                        });
                    };
                    _this.getDimensionsAndMetrics = function (query, callback) {
                        _this.datasource.getDimensionsAndMetrics(_this.target.druidDS)
                            .then(callback);
                    };
                    _this.getFilterValues = function (query, callback) {
                        var dimension = _this.target.currentFilter.dimension;
                        _this.datasource.getFilterValues(_this.target, _this.panelCtrl.range, query)
                            .then(function (results) {
                            callback(results.data[0].result.map(function (datum) { return datum[dimension]; }));
                        });
                    };
                    return _this;
                }
                DruidQueryCtrl.prototype.cachedAndCoalesced = function (ioFn, $scope, cacheName) {
                    var promiseName = cacheName + "Promise";
                    if (!$scope[cacheName]) {
                        if (!$scope[promiseName]) {
                            $scope[promiseName] = ioFn()
                                .then(function (result) {
                                $scope[promiseName] = null;
                                $scope[cacheName] = result;
                                return $scope[cacheName];
                            });
                        }
                        return $scope[promiseName];
                    }
                    else {
                        var deferred = void 0;
                        deferred.resolve($scope[cacheName]);
                        return deferred.promise;
                    }
                };
                DruidQueryCtrl.prototype.targetBlur = function () {
                    this.errors = this.validateTarget();
                    this.refresh();
                };
                DruidQueryCtrl.prototype.addFilter = function () {
                    if (!this.addFilterMode) {
                        this.addFilterMode = true;
                        return;
                    }
                    if (!this.target.filters) {
                        this.target.filters = [];
                    }
                    this.target.errors = this.validateTarget();
                    if (!this.target.errors.currentFilter) {
                        this.target.filters.push(this.target.currentFilter);
                        this.clearCurrentFilter();
                        this.addFilterMode = false;
                    }
                    this.targetBlur();
                };
                DruidQueryCtrl.prototype.editFilter = function (index) {
                    this.addFilterMode = true;
                    var delFilter = this.target.filters.splice(index, 1);
                    this.target.currentFilter = delFilter[0];
                };
                DruidQueryCtrl.prototype.removeFilter = function (index) {
                    this.target.filters.splice(index, 1);
                    this.targetBlur();
                };
                DruidQueryCtrl.prototype.clearCurrentFilter = function () {
                    this.target.currentFilter = { type: this.defaultFilterType };
                    this.addFilterMode = false;
                    this.targetBlur();
                };
                DruidQueryCtrl.prototype.addSelectDimensions = function () {
                    if (!this.addDimensionsMode) {
                        this.addDimensionsMode = true;
                        return;
                    }
                    if (!this.target.selectDimensions) {
                        this.target.selectDimensions = [];
                    }
                    this.target.selectDimensions.push(this.target.currentSelect.dimension);
                    this.clearCurrentSelectDimension();
                };
                DruidQueryCtrl.prototype.removeSelectDimension = function (index) {
                    this.target.selectDimensions.splice(index, 1);
                    this.targetBlur();
                };
                DruidQueryCtrl.prototype.clearCurrentSelectDimension = function () {
                    this.target.currentSelect.dimension = this.defaultSelectDimension;
                    this.addDimensionsMode = false;
                    this.targetBlur();
                };
                DruidQueryCtrl.prototype.addSelectMetrics = function () {
                    if (!this.addMetricsMode) {
                        this.addMetricsMode = true;
                        return;
                    }
                    if (!this.target.selectMetrics) {
                        this.target.selectMetrics = [];
                    }
                    this.target.selectMetrics.push(this.target.currentSelect.metric);
                    this.clearCurrentSelectMetric();
                };
                DruidQueryCtrl.prototype.removeSelectMetric = function (index) {
                    this.target.selectMetrics.splice(index, 1);
                    this.targetBlur();
                };
                DruidQueryCtrl.prototype.clearCurrentSelectMetric = function () {
                    this.target.currentSelect.metric = this.defaultSelectMetric;
                    this.addMetricsMode = false;
                    this.targetBlur();
                };
                DruidQueryCtrl.prototype.addAggregator = function () {
                    if (!this.addAggregatorMode) {
                        this.addAggregatorMode = true;
                        return;
                    }
                    if (!this.target.aggregators) {
                        this.target.aggregators = [];
                    }
                    this.target.errors = this.validateTarget();
                    if (!this.target.errors.currentAggregator) {
                        this.target.aggregators.push(this.target.currentAggregator);
                        this.clearCurrentAggregator();
                        this.addAggregatorMode = false;
                    }
                    this.targetBlur();
                };
                DruidQueryCtrl.prototype.editAggregator = function (index) {
                    this.addAggregatorMode = true;
                    var delAggregator = this.target.aggregators.splice(index, 1);
                    this.target.currentAggregator = delAggregator[0];
                };
                DruidQueryCtrl.prototype.removeAggregator = function (index) {
                    this.target.aggregators.splice(index, 1);
                    this.targetBlur();
                };
                DruidQueryCtrl.prototype.clearCurrentAggregator = function () {
                    this.target.currentAggregator = { type: this.defaultAggregatorType };
                    this.addAggregatorMode = false;
                    this.targetBlur();
                };
                DruidQueryCtrl.prototype.addPostAggregator = function () {
                    if (!this.addPostAggregatorMode) {
                        this.addPostAggregatorMode = true;
                        return;
                    }
                    if (!this.target.postAggregators) {
                        this.target.postAggregators = [];
                    }
                    this.target.errors = this.validateTarget();
                    if (!this.target.errors.currentPostAggregator) {
                        this.target.postAggregators.push(this.target.currentPostAggregator);
                        this.clearCurrentPostAggregator();
                        this.addPostAggregatorMode = false;
                    }
                    this.targetBlur();
                };
                DruidQueryCtrl.prototype.removePostAggregator = function (index) {
                    this.target.postAggregators.splice(index, 1);
                    this.targetBlur();
                };
                DruidQueryCtrl.prototype.clearCurrentPostAggregator = function () {
                    this.target.currentPostAggregator = lodash_1.default.clone(this.defaultPostAggregator);
                    ;
                    this.addPostAggregatorMode = false;
                    this.targetBlur();
                };
                DruidQueryCtrl.prototype.isValidFilterType = function (type) {
                    return lodash_1.default.has(this.filterValidators, type);
                };
                DruidQueryCtrl.prototype.isValidAggregatorType = function (type) {
                    return lodash_1.default.has(this.aggregatorValidators, type);
                };
                DruidQueryCtrl.prototype.isValidPostAggregatorType = function (type) {
                    return lodash_1.default.has(this.postAggregatorValidators, type);
                };
                DruidQueryCtrl.prototype.isValidQueryType = function (type) {
                    return lodash_1.default.has(this.queryTypeValidators, type);
                };
                DruidQueryCtrl.prototype.isValidArithmeticPostAggregatorFn = function (fn) {
                    return lodash_1.default.includes(this.arithmeticPostAggregator, fn);
                };
                DruidQueryCtrl.prototype.validateMaxDataPoints = function (target, errs) {
                    if (target.maxDataPoints) {
                        var intMax = parseInt(target.maxDataPoints);
                        if (isNaN(intMax) || intMax <= 0) {
                            errs.maxDataPoints = "Must be a positive integer";
                            return false;
                        }
                        target.maxDataPoints = intMax;
                    }
                    return true;
                };
                DruidQueryCtrl.prototype.validateLimit = function (target, errs) {
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
                };
                DruidQueryCtrl.prototype.validateOrderBy = function (target) {
                    if (target.orderBy && !Array.isArray(target.orderBy)) {
                        target.orderBy = target.orderBy.split(",");
                    }
                    return true;
                };
                DruidQueryCtrl.prototype.validateGroupByQuery = function (target, errs) {
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
                };
                DruidQueryCtrl.prototype.validateTopNQuery = function (target, errs) {
                    if (!target.dimension) {
                        errs.dimension = "Must specify a dimension";
                        return false;
                    }
                    if (!target.druidMetric) {
                        errs.druidMetric = "Must specify a metric";
                        return false;
                    }
                    if (!this.validateLimit(target, errs)) {
                        return false;
                    }
                    return true;
                };
                DruidQueryCtrl.prototype.validateSelectQuery = function (target, errs) {
                    if (!target.selectThreshold && target.selectThreshold <= 0) {
                        errs.selectThreshold = "Must specify a positive number";
                        return false;
                    }
                    return true;
                };
                DruidQueryCtrl.prototype.validateSelectorFilter = function (target) {
                    if (!target.currentFilter.dimension) {
                        return "Must provide dimension name for selector filter.";
                    }
                    if (!target.currentFilter.value) {
                        return "Must provide dimension value for selector filter.";
                    }
                    return null;
                };
                DruidQueryCtrl.prototype.validateJavascriptFilter = function (target) {
                    if (!target.currentFilter.dimension) {
                        return "Must provide dimension name for javascript filter.";
                    }
                    if (!target.currentFilter["function"]) {
                        return "Must provide func value for javascript filter.";
                    }
                    return null;
                };
                DruidQueryCtrl.prototype.validateRegexFilter = function (target) {
                    if (!target.currentFilter.dimension) {
                        return "Must provide dimension name for regex filter.";
                    }
                    if (!target.currentFilter.pattern) {
                        return "Must provide pattern for regex filter.";
                    }
                    return null;
                };
                DruidQueryCtrl.prototype.validateCountAggregator = function (target) {
                    if (!target.currentAggregator.name) {
                        return "Must provide an output name for count aggregator.";
                    }
                    return null;
                };
                DruidQueryCtrl.prototype.validateCardinalityAggregator = function (type, target) {
                    if (!target.currentAggregator.name) {
                        return "Must provide an output name for " + type + " aggregator.";
                    }
                    return null;
                };
                DruidQueryCtrl.prototype.validateSimpleAggregator = function (type, target) {
                    if (!target.currentAggregator.name) {
                        return "Must provide an output name for " + type + " aggregator.";
                    }
                    if (!target.currentAggregator.fieldName) {
                        return "Must provide a metric name for " + type + " aggregator.";
                    }
                    return null;
                };
                DruidQueryCtrl.prototype.validateApproxHistogramFoldAggregator = function (target) {
                    var err = this.validateSimpleAggregator('approxHistogramFold', target);
                    if (err) {
                        return err;
                    }
                    return null;
                };
                DruidQueryCtrl.prototype.validateThetaSketchAggregator = function (target) {
                    var err = this.validateSimpleAggregator('thetaSketch', target);
                    if (err) {
                        return err;
                    }
                    return null;
                };
                DruidQueryCtrl.prototype.validateSimplePostAggregator = function (type, target) {
                    if (!target.currentPostAggregator.name) {
                        return "Must provide an output name for " + type + " post aggregator.";
                    }
                    if (!target.currentPostAggregator.fieldName) {
                        return "Must provide an aggregator name for " + type + " post aggregator.";
                    }
                    return null;
                };
                DruidQueryCtrl.prototype.validateMaxPostAggregator = function (target) {
                    var err = this.validateSimplePostAggregator('max', target);
                    if (err) {
                        return err;
                    }
                    return null;
                };
                DruidQueryCtrl.prototype.validateMinPostAggregator = function (target) {
                    var err = this.validateSimplePostAggregator('min', target);
                    if (err) {
                        return err;
                    }
                    return null;
                };
                DruidQueryCtrl.prototype.validateQuantilePostAggregator = function (target) {
                    var err = this.validateSimplePostAggregator('quantile', target);
                    if (err) {
                        return err;
                    }
                    if (!target.currentPostAggregator.probability) {
                        return "Must provide a probability for the quantile post aggregator.";
                    }
                    return null;
                };
                DruidQueryCtrl.prototype.validateArithmeticPostAggregator = function (target) {
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
                    }
                    else {
                        if (!Array.isArray(target.currentPostAggregator.fields)) {
                            target.currentPostAggregator.fields = target.currentPostAggregator.fields
                                .split(",")
                                .map(function (f) { return f.trim(); })
                                .map(function (f) { return { type: "fieldAccess", fieldName: f }; });
                        }
                        if (target.currentPostAggregator.fields.length < 2) {
                            return "Must provide at least two fields for arithmetic post aggregator.";
                        }
                    }
                    return null;
                };
                DruidQueryCtrl.prototype.validateTarget = function () {
                    var validatorOut, errs = {};
                    if (!this.target.druidDS) {
                        errs.druidDS = "You must supply a druidDS name.";
                    }
                    if (!this.target.queryType) {
                        errs.queryType = "You must supply a query type.";
                    }
                    else if (!this.isValidQueryType(this.target.queryType)) {
                        errs.queryType = "Unknown query type: " + this.target.queryType + ".";
                    }
                    else {
                        this.queryTypeValidators[this.target.queryType](this.target, errs);
                    }
                    if (this.target.shouldOverrideGranularity) {
                        if (this.target.customGranularity) {
                            if (!lodash_1.default.includes(this.customGranularity, this.target.customGranularity)) {
                                errs.customGranularity = "Invalid granularity.";
                            }
                        }
                        else {
                            errs.customGranularity = "You must choose a granularity.";
                        }
                    }
                    else {
                        this.validateMaxDataPoints(this.target, errs);
                    }
                    if (this.addFilterMode) {
                        if (!this.isValidFilterType(this.target.currentFilter.type)) {
                            errs.currentFilter = "Invalid filter type: " + this.target.currentFilter.type + ".";
                        }
                        else {
                            validatorOut = this.filterValidators[this.target.currentFilter.type](this.target);
                            if (validatorOut) {
                                errs.currentFilter = validatorOut;
                            }
                        }
                    }
                    if (this.addAggregatorMode) {
                        if (!this.isValidAggregatorType(this.target.currentAggregator.type)) {
                            errs.currentAggregator = "Invalid aggregator type: " + this.target.currentAggregator.type + ".";
                        }
                        else {
                            validatorOut = this.aggregatorValidators[this.target.currentAggregator.type](this.target);
                            if (validatorOut) {
                                errs.currentAggregator = validatorOut;
                            }
                        }
                    }
                    if (lodash_1.default.isEmpty(this.target.aggregators) && !lodash_1.default.isEqual(this.target.queryType, "select")) {
                        errs.aggregators = "You must supply at least one aggregator";
                    }
                    if (this.addPostAggregatorMode) {
                        if (!this.isValidPostAggregatorType(this.target.currentPostAggregator.type)) {
                            errs.currentPostAggregator = "Invalid post aggregator type: " + this.target.currentPostAggregator.type + ".";
                        }
                        else {
                            validatorOut = this.postAggregatorValidators[this.target.currentPostAggregator.type](this.target);
                            if (validatorOut) {
                                errs.currentPostAggregator = validatorOut;
                            }
                        }
                    }
                    return errs;
                };
                DruidQueryCtrl.templateUrl = 'partials/query.editor.html';
                return DruidQueryCtrl;
            }(sdk_1.QueryCtrl));
            exports_1("DruidQueryCtrl", DruidQueryCtrl);
        }
    };
});
//# sourceMappingURL=query_ctrl.js.map