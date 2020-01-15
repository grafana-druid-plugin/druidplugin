This plugin is built on the top of an existing Druid plugin (https://github.com/grafana/grafana-plugins) which used to work on older Grafana versions. With the UI changes done on Grafana-3.0 the existing plugin stopped working. Lot of changes have been made to have it work on Grafana 3.0. It supports timeseries, group by, topN and Select queries.

Lot of features might still not be implemented. Your contributions are welcome.

## Grafana Version Compatibility:

**These Druid plugin versions are supported on Grafana below version 6.3.0**

## Status [version from Societe Generale (FR)]

- Made the "limit" attribute optional
- Added some missing aggregators and post-agregators
- Fixed autocompletion for datasources and metric_names
- Default value for "granuarity" field is now 'hour' instead of 'minute'
- Implemented a rate feature
- The metricFindQuery function has been implemented,
- add filters to variable definition, including current interval
- other bugs have been fixed

## Plugin development history

This plugin was originally developed by Quantiply Corporation (Supported for Grafana versions < 2.5): https://github.com/grafana/grafana-plugins/tree/master/datasources/druid

This plugin was further enhanced by Carl Bergquist (https://github.com/grafana/grafana/pull/3328) (to support it on Grafana version 2.5 & 2.6) and Abhishek Sant (https://github.com/grafana-druid-plugin/druidplugin) who cloned the code source from the Pull Request by Carl Bergquist and changed the plugin to have it work on Grafana-3.0.

All the credits for the original code and enahcement to 2.5 goes to Quantiply, Carl Bergquist and Abhishek Sant. 
