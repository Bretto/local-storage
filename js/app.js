(function () {
    "use strict";

    require('./bower_components/jquery/jquery')
    require('./bower_components/angular/angular')


    require('q');
    require('breeze');
    require('./controllers');
    require('./entity-model');
    require('./datacontext');
    require('./data-provider');
    require('./utils');
    require('./filters');
    require('./services');
    require('./web-sql');
    require('./breeze-storage');
    require('./storage-provider');
    require('./web-service');
    require('./mock-service');
    require('./mock-service-breeze');
    require('./directives');
    require('./breeze-directives.js');
    require('./log-decorator');
    require('./ladda-button');




    angular.module('App', [
            'App.controllers',
            'App.EntityModel',
            'App.DataContext',
            'App.DataProvider',
            'App.Utils',
            'App.filters',
            'App.services',
            'App.WebSql',
            'App.BreezeStorage',
            'App.StorageProvider',
            'App.WebService',
            'App.MockService',
            'App.MockServiceBreeze',
            'App.directives',
            'breeze.directives',
            'App.LogDecorator',
            'App.LaddaButton'
        ]).config(function (zDirectivesConfigProvider, $provide, LogDecorator) {

            zDirectivesConfigProvider.zValidateTemplate = '<span class="invalid error-msg"><i class="glyphicon glyphicon-warning-sign"></i>%error%</span>';

            $provide.decorator('$log', function ($delegate) {

                LogDecorator($delegate)

                return $delegate;
            });
        });

})();







