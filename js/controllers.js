'use strict';
/* App Controllers */

var controllers = angular.module('App.controllers', []);

controllers.controller('AppCtrl', function ($scope, $rootScope, $timeout, $log, $http, DataModel, BreezeStorage, StorageProvider, DataProvider, DataContext) {
    $log.log('AppCtrl');

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
//

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

//        if(!$scope.activeItem){
        var newEmp = DataContext.manager.createEntity('Employee', {});
        $scope.onSelect(newEmp);
//        }

//        if($scope.activeItem.entityAspect.entityState.name !== 'Added'){
//            var newEmp = DataContext.manager.createEntity('Employee', {});
//            $scope.onSelect(newEmp);
//        }
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
            if (entity.id < 0) {
                console.log('id:', entity.id, 'State:', entity.entityAspect.entityState.name);
            }
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


        var entities = DataContext.manager.getEntities();
        angular.forEach(entities, function (entity) {

            if (entity.id < 0) {
                entity.entityAspect.hasTempKey = true;
                entity.entityAspect.setModified();
            }
        });

//        var so = new breeze.SaveOptions({ resourceName: "http://localhost:3000/SaveChanges" });
        // listOfEntities may be null in which case all added/modified/deleted entities will be sent
        DataContext.manager.saveChanges().fin(function(){
            //$scope.$digest();
            exportChanges();
            updateUI();
            $scope.$digest();
        })

    }


    function filterEmployeesById(employees) {
        return function (id) {
            return employees.filter(function (e) {
                return e.id === id;
            });
        };
    }


});

