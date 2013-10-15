'use strict';

var services = angular.module('App.services', []);

services.value('STATES', {
    online: true,
    lockUI: false
});


services.value('jsonResultsAdapter',
    new breeze.JsonResultsAdapter({

        name: "context",

        extractResults: function (data) {
            var results = data.results;
            if (!results) throw new Error("Unable to resolve 'results' property");
            // Parse only the make and model types
            return results && (results.employes || results.departements || results.fonctions);
        },

        visitNode: function (node, parseContext, nodeContext) {

            var index = parseContext.url.lastIndexOf('/');
            var str = parseContext.url.substr(index);

            if(str === '/employes.json'){
                return { entityType: "Employee"  }
            }else if(str === '/departements.json'){
                return { entityType: "Departement"  }
            }else if(str === '/fonctions.json'){
                return {entityType: "Fonction"}
            }
        }

    }));

services.factory('DataModel', function ($http, $log, $rootScope) {

    var dataModel = {};
    dataModel.toggleViewOpen = true;
    dataModel.sideNav = [];
    dataModel.currentPage = {};


    dataModel.isOnline = function () {
        return STATES.online;
    }

    dataModel.isLockUI = function () {
        return STATES.lockUI;
    }

    dataModel.isPriNavActive = function (value) {
        return ( value === $stateParams.navId ) ? 'active' : '';
    }

    return dataModel;
});



