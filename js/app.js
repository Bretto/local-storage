(function () {
    "use strict";

//    require('./bower_components/jquery/jquery');
//    require('./bower_components/angular/angular');
//
//    require('./bower_components/q/q.js');
//    require('./bower_components/bower-breeze/breeze.debug.js');

//    require('Q');
//    require('breeze');

//    require('./controllers');
//    require('./entity-model');
//    require('./datacontext');
//    require('./data-provider');
//    require('./utils');
//    require('./filters');
//    require('./services');
//    require('./breeze-storage');
//    require('./web-service');
//    require('./mock-service-breeze');
//    require('./directives');
//    require('./breeze-directives.js');
//    require('./ladda-button');


//    require('./web-sql');
//    require('./storage-provider');
//    require('./mock-service');
//    require('./log-decorator');


    var module = angular.module('App', [
            'App.controllers',
            'App.EntityModel',
            'App.DataContext',
            'App.DataProvider',
            'App.Utils',
            'App.filters',
            'App.services',
            'App.BreezeStorage',
            'App.WebService',
            'App.MockServiceBreeze',
            'App.directives',
            'breeze.directives',
            'App.LaddaButton'
//            'App.WebSql',
//            'App.StorageProvider',
//            'App.MockService',
//            'App.LogDecorator',
        ]).config(function (zDirectivesConfigProvider, $provide) {

            zDirectivesConfigProvider.zValidateTemplate = '<span class="invalid error-msg"><i class="glyphicon glyphicon-warning-sign"></i>%error%</span>';

//            $provide.decorator('$log', function ($delegate) {
//
//                LogDecorator($delegate)
//
//                return $delegate;
//            });
        });


    module.value('gLadda', (function(){

        if("Ladda" in window && "Spinner" in window){
            return Ladda;
        }else{
            throw new Error("The Globals Ladda || Spinner are missing");
        }

    })());

    module.value('gBreeze', (function(){

        if("breeze" in window){
            return breeze;
        }else{
            throw new Error("The Globals breeze is missing");
        }

    })());

    module.value('gQ', (function(){

        if("Q" in window){
            return Q;
        }else{
            throw new Error("The Globals Q is missing");
        }

    })());


})();







