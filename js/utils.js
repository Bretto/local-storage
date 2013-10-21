var services = angular.module('App.Utils', []);

services.factory('Utils', function () {

    var utils = {};

    utils.closeSingleQuotes = function(str) {
        if (str) str = str.replace(/'/g, "''");
        return str
    }

    return utils;
});