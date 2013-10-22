'use strict';

var services = angular.module('App.BreezeStorage', []);

services.factory('BreezeStorage', function ($log, Utils) {

    var stashName = "entityGraph";

    var getEntityGraph = function(){
        return window.localStorage.getItem(stashName);
    }

    var setEntityGraph = function(exportData){
        return window.localStorage.setItem(stashName, exportData);
    }

    return {
        setEntityGraph: setEntityGraph,
        getEntityGraph: getEntityGraph
    };
});