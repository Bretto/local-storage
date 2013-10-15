var services = angular.module('App.DataContext', []);

services.factory('DataContext', function (EntityModel, jsonResultsAdapter) {

    breeze.config.initializeAdapterInstance("modelLibrary", "backingStore", true);

    var serviceName = "http://localhost/~Separ8/local-storage";

    var ds = new breeze.DataService({
        serviceName: serviceName,
        hasServerMetadata: false,
        useJsonp: false,
        jsonResultsAdapter: jsonResultsAdapter
    });

    var manager = new breeze.EntityManager({dataService: ds});

    EntityModel.initialize(manager.metadataStore);

    function getEmployees() {
        var query = breeze.EntityQuery
            .from("assets/employes.json");
        return manager.executeQuery(query).then(returnResults);
    }

    function getFonctions() {
        var query = breeze.EntityQuery
            .from("assets/fonctions.json");
        return manager.executeQuery(query).then(returnResults);
    }

    function getDepartements() {
        var query = breeze.EntityQuery
            .from("/assets/departements.json")
        return manager.executeQuery(query).then(returnResults);
    }

    function returnResults(data) {
        return data.results
    }

    function exportEmployees(employees){
        return manager.exportEntities(employees)
    }

    return {
        getFonctions: getFonctions,
        getEmployees: getEmployees,
        getDepartements: getDepartements,
        exportEmployees: exportEmployees
    };

});