
## Grafana Version Compatibility:

**Druid plugin version 0.0.3 and below are supported for Grafana: 3.x.x**

  

**Druid plugin 0.0.4 and above are supported for Grafana: 4.x.x**

  

# Grafana plugin for [Druid](http://druid.io/) real-time OLAP database

  

![Screenshot](https://raw.githubusercontent.com/grafana-druid-plugin/druidplugin/master/img/AddDataSource.png)


![Screenshot](https://raw.githubusercontent.com/grafana-druid-plugin/druidplugin/master/img/DruidPanel.png)

  

## Status

  

This plugin is built on the top of an existing Druid plugin (https://github.com/grafana-druid-plugin/druidplugin). The original plugin get inputs from simple textboxes and drop downs. This comes at cost of generality. This plugin gets query as raw json query.

  

It supports timeseries, group by, topN and Select queries.

  

## How to install

For installation, you just need to copy what is inside `dist` directory to garafana plugins directory.

### step 1
Create a directory for this plugin in grafana plugin directory:

    mkdir -p /var/lib/grafana/plugins/druid-json


### step 2

Get the code in your grafana server:

    git clone https://github.com/abdolsamad/druidplugin
  
### step 3
Get into source code directory:
 

    cd druidplugin


### step 4
Copy `dist` directory  content to created directory:

    cp -r dist/* /var/lib/grafana/plugins/druid-json

### step 4
Restart grafana-server service:

    sudo service grafana-server restart

That's it!
