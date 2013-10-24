'use strict';

//Jean-Charles Garin: 28 03 02

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
    'ngSanitize',
    'App.directives',
    'breeze.directives'
]).config(['zDirectivesConfigProvider', configDirective]);


//Configure the Breeze Validation Directive for bootstrap 2
function configDirective(cfg) {
    // Custom template with warning icon before the error message
    cfg.zValidateTemplate =
        '<span class="invalid error-msg"><i class="glyphicon glyphicon-warning-sign"></i>' +
            '%error%</span>';
}



//    XMLHttpRequest.prototype.realOpen = XMLHttpRequest.prototype.open;
//    var newOpen = function(method, url, async, user, password) {
//
//        var index = url.lastIndexOf('/');
//        var str = url.substr(index);
//
//        if(str === '/SaveChanges'){
//            console.log("Intercepted open (" + str + ")");
//        }
//        this.realOpen(method, url, async, user, password);
//    }
//    XMLHttpRequest.prototype.open = newOpen;

//    $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
//        var success = options.success;
//        options.success = function(data, textStatus, jqXHR) {
//            // override success handling
//            console.log("Intercepted open (" + textStatus + ")");
//            if(typeof(success) === "function") return success(data, textStatus, jqXHR);
//        };
//        var error = options.error;
//        options.error = function(jqXHR, textStatus, errorThrown) {
//            // override error handling
//            console.log("Intercepted open (" + textStatus + ")");
//            if(typeof(error) === "function") return error(jqXHR, textStatus, errorThrown);
//        };
//    });





