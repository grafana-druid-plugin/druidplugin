System.register(["./datasource", "./query_ctrl", "./config_ctrl"], function (exports_1, context_1) {
    "use strict";
    var datasource_1, query_ctrl_1, config_ctrl_1, DruidAnnotationsQueryCtrl;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (datasource_1_1) {
                datasource_1 = datasource_1_1;
            },
            function (query_ctrl_1_1) {
                query_ctrl_1 = query_ctrl_1_1;
            },
            function (config_ctrl_1_1) {
                config_ctrl_1 = config_ctrl_1_1;
            }
        ],
        execute: function () {
            exports_1("Datasource", datasource_1.default);
            exports_1("QueryCtrl", query_ctrl_1.DruidQueryCtrl);
            exports_1("ConfigCtrl", config_ctrl_1.DruidConfigCtrl);
            DruidAnnotationsQueryCtrl = (function () {
                function DruidAnnotationsQueryCtrl() {
                }
                DruidAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';
                return DruidAnnotationsQueryCtrl;
            }());
        }
    };
});
//# sourceMappingURL=module.js.map