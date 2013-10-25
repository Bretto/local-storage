'use strict';


var services = angular.module('App.MockServiceBreeze', []);

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

//            return { entityType: "Employee"  }
        }

    }));


services.factory('MockServiceBreeze', function (Utils, $log) {


    var manager = null;

    function getAllEmployee() {
        var query = breeze.EntityQuery
            .from("assets/employes.json");
        return manager.executeQuery(query).then(returnResults);
    }

    function getAllDepartement() {
        var query = breeze.EntityQuery
            .from("assets/fonctions.json");
        return manager.executeQuery(query).then(returnResults);
    }

    function getAllFonction() {
        var query = breeze.EntityQuery
            .from("/assets/departements.json")
        return manager.executeQuery(query).then(returnResults);
    }

    function returnResults(data) {
        return data.results
    }

    var getAllEntity = function (entityType, _manager) {

        var fn = null;
        manager = _manager;

        switch (entityType) {

            case 'Employee':
                fn = getAllEmployee();
                break;

            case 'Departement':
                fn = getAllDepartement();
                break;

            case 'Fonction':
                fn = getAllFonction();
                break;
        }

        return fn
    }


    return {
        getAllEntity: getAllEntity
    };
});