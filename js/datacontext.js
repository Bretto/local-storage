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

    function saveEntity(entity) {

        var deferred = Q.defer();

        StorageProvider.saveEntity(entity)
            .catch(function (err) {
                $log.error('Error saveEntity', err);
                deferred.reject(new Error(err));
            })
            .done(function (res) {
                var entities = createEntity(entityType, res);
                deferred.resolve(entities);
            })


        return deferred.promise;

    }

    return {
        exportEmployees: exportEmployees,
        getAllEntity: getAllEntity,
        saveEntity:saveEntity,
        manager: manager
    };

})
;