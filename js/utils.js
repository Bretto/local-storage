var services = angular.module('App.Utils', []);

services.factory('Utils', function () {

    var utils = {};

    utils.closeSingleQuotes = function(value) {
        if(angular.isString(value) && angular.isDefined(value)){
            if (value) value = value.replace(/'/g, "''");
        }

        return value
    }

    return utils;
});