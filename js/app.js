'use strict';

//Jean-Charles Garin: 28 03 02

angular.module('App', [
    'App.controllers',
    'App.EntityModel',
    'App.DataContext',
    'App.filters',
    'App.services',
    'App.LocalStorage',
    'App.WebService',
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







