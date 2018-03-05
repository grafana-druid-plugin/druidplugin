define(['moment'], function(moment) {
  var GRANULARITIES = {
    minute: {
      duration: "PT1M",
      seconds: 60
    },
    fifteen_minute: {
      duration: "PT15M",
      seconds: 900
    },
    thirty_minute: {
      duration: "PT30M",
      seconds: 1800
    },
    hour: {
      duration: "PT1H",
      seconds: 3600
    },
    day: {
      duration: "PT24H",
      seconds: 86400
    }
  };

  function formatTimestamp(ts) {
    return moment(ts).format('X') * 1000;
  }

  function grabDimensions(keys) {
    return keys.filter(function(k) {
      return k != 'measure' && k != 'timestamp';
    });
  }

  function targetFromDimensions(keys) {
    return function(row) {
      return keys.map(function(k) {
        return row[k] || '';
      }).join('-');
    };
  }

  function transformResultSet(r) {
    if (!r.length) {
      return [];
    }

    var dimensions = grabDimensions(Object.keys(r[0]));
    var namer = targetFromDimensions(dimensions);
    var targets = {};
    r.forEach(function(row) {
      var targetName = namer(row);
      if (!targets[targetName]) {
        targets[targetName] = [];
      }


      targets[targetName].push([row.measure, formatTimestamp(row.timestamp)]);
    });

    return Object.keys(targets).map(function(k) {
      return {
        target: k,
        datapoints: targets[k]
      };
    });
  }

  function momentToTimestampClause(m) {
    return 'MILLIS_TO_TIMESTAMP(' + m.format('x') + ')';
  }

  function timeClause(from, to) {
    return '__time >= ' + momentToTimestampClause(from) + ' AND __time <= ' + momentToTimestampClause(to);
  }

  function prepareQuery(from, to, granularity, rawQuery) {
    var intervalSpec = "TIME_FLOOR(__time, '{}')".replace('{}', granularity);
    var timestampCol = intervalSpec + ' as "timestamp"';
    var timeRange = timeClause(from, to);
    var q = rawQuery.replace('$interval', intervalSpec).replace('$timeRange', timeRange).replace('$timestamp', timestampCol);
    console.log("Druid query:", q);
    return q;
  }

  function makeScopedVars(from, to, granularity) {
    var g = GRANULARITIES[granularity];
    var duration = g.duration;
    var intervalSeconds = g.seconds;
    var interval = "TIME_FLOOR(__time, '{}')".replace('{}', duration);
    return {
      interval: {
        value: interval
      },
      timeRange: {
        value: timeClause(from, to)
      },
      timestamp: {
        value: interval + ' as "timestamp"'
      },
      intervalSeconds: {
        value: intervalSeconds
      }
    };
  }

  return {
    prepareQuery: prepareQuery,
    transformResultSet: transformResultSet,
    makeScopedVars: makeScopedVars,
  };
});