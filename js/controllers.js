(function () {
    "use strict";

    var module = angular.module('App.controllers', []);

    module.controller('AppCtrl', function ($scope, $rootScope, $timeout, $log, $http, DataModel, BreezeStorage, StorageProvider, DataProvider, DataContext) {

        $log = $log.getInstance("AppCtrl", "color:#c44550;");
        $log.error('Debug Test');
        $log.log('Debug Test');
        $log.debug('Debug Test');
        $log.info('Debug Test');
        $log.warn('Debug Test');

        StorageProvider.initDB();

//    LocalStorage
//        .initDB()
//        .then(function () {
//            return WebService.getEmployees()
//        })
//        .then(function (employees) {
//            return LocalStorage.setT_EMPLOYEE(employees)
//        })
//        .then(function () {
//            return WebService.getDepartements()
//        })
//        .then(function (departements) {
//            return LocalStorage.setT_DEPARTEMENT(departements)
//        })
//        .then(function () {
//            return WebService.getFonctions()
//        })
//        .then(function (fonctions) {
//            return LocalStorage.setT_FONCTION(fonctions)
//        })


        $scope.employees = null;
        $scope.departements = null;
        $scope.fonctions = null;

        $scope.isActive = function (item) {
            return this.activeItem === item;
        }

        $scope.onSelect = function (item) {

            if ($scope.activeItem) {
                if ($scope.activeItem.entityAspect.entityState.name !== 'Detached') {
                    $scope.activeItem.entityAspect.rejectChanges();
                }
            }

            $scope.activeItem = item;

            var props = DataContext.manager.metadataStore.getEntityType(item.entityType.shortName).dataProperties;
            var formData = [];

            for (var i = 0; i < props.length; i++) {
                var prop = props[i];
                formData.push({label: prop.name, type: "text", key: prop.name});
            }

            $scope.formData = formData;
        }

        $scope.onAddEmployee = function () {

            var newEntity = DataContext.manager.createEntity('Employee', {});
            $scope.onSelect(newEntity);
            deferred.resolve();
        }

        $scope.isAddEmployeeComplete = function () {
            return 'test';
        }

        $scope.onAddFonction = function () {
            var newEntity = DataContext.manager.createEntity('Fonction', {});
            $scope.onSelect(newEntity);
        }

        $scope.onAddDepartement = function () {
            var newEntity = DataContext.manager.createEntity('Departement', {});
            $scope.onSelect(newEntity);
        }

        $scope.onGetEmployees = function () {
            DataContext.getAllEntity('Employee')
                .then(function (res) {
                    console.log(res);
                    $scope.employees = res;
                    $scope.$digest();
                });
        }

        $scope.onGetFonctions = function () {
            DataContext.getAllEntity('Fonction')
                .then(function (res) {
                    console.log(res);
                    $scope.fonctions = res;
                    $scope.$digest();
                });
        }


        $scope.onGetDepartements = function () {
            DataContext.getAllEntity('Departement')
                .then(function (res) {
                    console.log(res);
                    $scope.departements = res;
                    $scope.$digest();
                });
        }


        $scope.isUnchanged = function (activeItem) {

            if (!activeItem)return;
            var state = activeItem.entityAspect.entityState;

            return (state.isUnchanged()) ? true : false;
        };


        function resetForm() {
            $scope.formData = null;
            $scope.activeItem = null;
        }


        $scope.onSave = function (activeItem) {
            activeItem.entityAspect.setUnchanged();
            exportChanges();
            resetForm();
            $scope.onGetEntityGraph();
        }

        $scope.onCancel = function (activeItem) {
            activeItem.entityAspect.rejectChanges();
        }

        $scope.onDelete = function (activeItem) {

            if (activeItem.id < 0) {
                console.log('setDetached');
                activeItem.entityAspect.setDetached();
            } else {
                console.log('setDeleted');
                activeItem.entityAspect.setDeleted();
            }

            exportChanges();
            resetForm();
            $scope.onGetEntityGraph();
        }

        function exportChanges() {

            var entities = DataContext.manager.getEntities();
            angular.forEach(entities, function (entity) {

                if (entity.id < 0) {
                    entity.entityAspect.hasTempKey = true;
                }

            });

            doIt();


            var exportData = DataContext.manager.exportEntities();

            var data = JSON.parse(exportData);
            data.dataService.serviceName = "http://localhost:3000";
            exportData = JSON.stringify(data);

            BreezeStorage.setEntityGraph(exportData);

        }

        function doIt() {

            var entities = DataContext.manager.getEntities();
            angular.forEach(entities, function (entity) {
//            if (entity.id < 0) {
                console.log('id:', entity.id, 'State:', entity.entityAspect.entityState.name, 'hasTempId:', entity.entityAspect.hasTempKey);

//            }
            });
            console.log('');
        }

        function updateUI() {
            var query = new breeze.EntityQuery('Employee')
            $scope.employees = DataContext.manager.executeQueryLocally(query);

            var query = new breeze.EntityQuery('Departement')
            $scope.departements = DataContext.manager.executeQueryLocally(query);

            var query = new breeze.EntityQuery('Fonction')
            $scope.fonctions = DataContext.manager.executeQueryLocally(query);
        }

        $scope.onGetEntityGraph = function () {

            var importData = BreezeStorage.getEntityGraph();

            DataContext.manager.importEntities(importData, {mergeStrategy: breeze.MergeStrategy.OverwriteChanges});

            var entities = DataContext.manager.getEntities();

            doIt();

            updateUI();
        }

        $scope.onSetEntityGraph = function () {
            exportChanges();
        }


        $scope.onSaveEntityGraph = function () {

            var deferred = Q.defer();
            doIt();

            var entities = DataContext.manager.getEntities();
            angular.forEach(entities, function (entity) {

                if (entity.id < 0) {
                    entity.entityAspect.hasTempKey = true;
                    entity.entityAspect.setModified();
                }
            });


            DataContext.manager.saveChanges().then(function (data) {

                angular.forEach(entities, function (entity) {
                    if (entity.entityAspect.entityState.isDeleted()) {
                        DataContext.manager.detachEntity(entity);
                    } else {
                        entity.entityAspect.acceptChanges();
                    }
                });

                exportChanges();
                $scope.$digest();
                deferred.resolve();

            }).fail(function (err) {
                    console.log('err:', err);
                    deferred.reject();
                })

            return deferred.promise;
        }


        // form the breeze edmunds example
        function filterEntityById(entity) {
            return function (id) {
                return entity.filter(function (e) {
                    return e.id === id;
                });
            };
        }


    });

})();

