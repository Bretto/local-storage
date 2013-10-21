var services = angular.module('App.DataContext', []);

services.factory('DataContext', function (EntityModel, jsonResultsAdapter, DataProvider, StorageProvider, $log) {

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

    function exportEmployees(employees) {
        return manager.exportEntities(employees)
    }

    function createEntity(entityType, rows) {

        var entities = [];

        angular.forEach(rows, function (row) {
            var newEntity = manager.createEntity(entityType, row);
            newEntity.entityAspect.acceptChanges();
            entities.push(newEntity);
        });

        // two ways of doing it array of breeze query...
        var query = new breeze.EntityQuery(entityType).toType(entityType)
        var results = manager.executeQueryLocally(query);

        return results;
    }

    function getAllEntity(entityType) {

        var deferred = Q.defer();

        DataProvider.getAllEntity(entityType)
            .catch(function (err) {
                $log.error('Error getAllEntity', err);
                deferred.reject(new Error(err));
            })
            .done(function (res) {
                var entities = createEntity(entityType, res);
                deferred.resolve(entities);
            })


        return deferred.promise;

    }

    return {
        getAllEntity: getAllEntity,
        getFonctions: getFonctions,
        getEmployees: getEmployees,
        getDepartements: getDepartements,
        exportEmployees: exportEmployees,
        manager: manager
    };

})
;