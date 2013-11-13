(function () {
    "use strict";


    var services = angular.module('App.DataContext', []);

    services.factory('DataContext', function (EntityModel, jsonResultsAdapter, DataProvider, $log, gBreeze, gQ) {

        gBreeze.config.initializeAdapterInstance("modelLibrary", "backingStore", true);

        var serviceName = "http://localhost/~Separ8/local-storage";
//    var serviceName = "http://localhost:3000";

        var ds = new gBreeze.DataService({
            serviceName: serviceName,
            hasServerMetadata: false,
            useJsonp: false,
            jsonResultsAdapter: jsonResultsAdapter
        });

        var manager = new gBreeze.EntityManager({dataService: ds});

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

            // two ways of doing it array of gBreeze query...
            var query = new gBreeze.EntityQuery(entityType).toType(entityType)
            var results = manager.executeQueryLocally(query);

            return results;
        }

        function getAllEntity(entityType) {

            var deferred = gQ.defer();

            DataProvider.getAllEntity(entityType, manager)
                .catch(function (err) {
                    $log.error('Error getAllEntity', err);
                    deferred.reject(new Error(err));
                })
                .done(function (res) {
                    deferred.resolve(res);
                })


            return deferred.promise;

        }


//    function getAllEntity(entityType) {
//
//        var deferred = gQ.defer();
//
//        DataProvider.getAllEntity(entityType)
//            .catch(function (err) {
//                $log.error('Error getAllEntity', err);
//                deferred.reject(new Error(err));
//            })
//            .done(function (res) {
//                var entities = createEntity(entityType, res);
//                deferred.resolve(entities);
//            })
//
//
//        return deferred.promise;
//
//    }

        function saveEntity(entity) {

            var deferred = gQ.defer();

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

        function deleteEntity(entity) {

            var deferred = gQ.defer();

            StorageProvider.deleteEntity(entity)
                .catch(function (err) {
                    $log.error('Error deleteEntity', err);
                    deferred.reject(new Error(err));
                })
                .done(function (res) {

                    deferred.resolve(res);
                })

            return deferred.promise;

        }

        return {
            exportEmployees: exportEmployees,
            getAllEntity: getAllEntity,
            saveEntity: saveEntity,
            deleteEntity: deleteEntity,
            manager: manager
        };

    });

})();