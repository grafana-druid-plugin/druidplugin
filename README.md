Grafana plugin for [Druid](http://druid.io/) real-time OLAP database works for Grafana 3.0.

## How to use the plugin

### Using druid plugin from Grafana executable:

1. Download grafana-3.0.4 tar executable: https://grafanarel.s3.amazonaws.com/builds/grafana-3.0.4-1464167696.linux-x64.tar.gz

2. Go the following directory in the grafana executable:
public/app/plugins/datasource

3. Create a directory named: "druid"

4. Copy all the files in "https://github.com/grafana-druid-plugin/druidplugin/tree/master/dist" to the "druid" 
directory.

5. Restart grafana


### Using druid plugin from Grafana source:

1. Follow instructions to build Grafana from the source:
http://docs.grafana.org/project/building_from_source/

2. Go the following directory in the grafana source path:
src/github.com/grafana/grafana/public/app/plugins/datasource/

3. Create a directory named: "druid"

4. Copy all the files in "https://github.com/grafana-druid-plugin/druidplugin/tree/master/src" to the "druid"
directory.

5. Build the source code using grunt

6. Restart grafana

## Configuration

Add new Druid Datasource with url to Druid broker instance. For example http://druid.internal

## Status

This plugin is built on the top of an existing Druid plugin (https://github.com/grafana/grafana-plugins)  which used to work on older Grafana versions. With the UI changes done on Grafana-3.0 the existing plugin stopped working. Made changes to have it work on Grafana 3.0. It supports timeseries, group by, topN and Select queries.

Lot of features might still not be implemented. Your contributions are welcome.

