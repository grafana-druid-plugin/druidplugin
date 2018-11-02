import DruidDatasource from './datasource';
import {DruidQueryCtrl} from './query_ctrl';
import {DruidConfigCtrl} from './config_ctrl';

class DruidAnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';
}

export {
  DruidDatasource as Datasource,
  DruidQueryCtrl as QueryCtrl,
  DruidConfigCtrl as ConfigCtrl
};
