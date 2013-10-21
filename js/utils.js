var services = angular.module('App.Utils', []);

services.factory('Utils', function () {

    var utils = {};

    utils.closeSingleQuotes = function(value) {
        if(angular.isString(value) && angular.isDefined(value)){
            if (value) value = value.replace(/'/g, "''");
        }

        return value
    }


    utils.entityToJson = function(entity){
        var json = {};

        var props = entity.entityType.getProperties();
        var keys = [];

        angular.forEach(props, function(obj){
             if(!obj.associationName){
                 keys.push(obj.name);
             }
        });

        angular.forEach(keys, function(key){
            json[key] = entity[key];
        });

        return json
    }

    return utils;
});