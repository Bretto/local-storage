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

//    $scope.formData = [{label:"Nom", type:"text", key:'nom'}, {label:"Email", type:"email", key:'email'}];


    $scope.isActive = function (item) {
        return this.activeItem === item;
    }

    $scope.onSelect = function (item) {
        $scope.activeItem = item;



        var props = DataContext.manager.metadataStore.getEntityType(item.entityType.shortName).dataProperties;
        var formData = [];

        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            formData.push({label: prop.name, type: "text", key: prop.name});
        }

        $scope.formData = formData;
//        $scope.$digest();
    }

    $scope.onAddEmployee = function () {



        if(!$scope.activeItem){
            var newEmp = DataContext.manager.createEntity('Employee', {});
            $scope.onSelect(newEmp);
        }

        if($scope.activeItem.entityAspect.entityState.name !== 'Added'){
            var newEmp = DataContext.manager.createEntity('Employee', {});
            $scope.onSelect(newEmp);
        }
    }


    function createEntity(entityName) {
        var entityType = DataContext.manager.metadataStore.getEntityType(entityName);
        var entity = entityType.createEntity({});
        return entity;
    };


    $scope.onSelectAll = function () {
        LocalStorage.getAllEmployees()
            .then(function (employees) {
                console.log(employees);
            })
    }

    $scope.onSelectEmployee = function () {
        var emp = employees.byId(1);
        console.log(emp);
    }

    $scope.onGetEmployees = function () {
//        DataContext.getEmployees().then(function(res){
//            console.log(res);
//            $scope.employees = res;
//            $scope.$digest();

//            employees.byId = filterEmployeesById(employees);
//        })

//        LocalStorage.getAllEmployees()
//            .then(function (res) {
//
//                angular.forEach(res, function (entity) {
//                    var newEmp = DataContext.manager.createEntity('Employee', entity);
//                    newEmp.entityAspect.acceptChanges();
//                })
//
//                DataContext.getEmployees().then(function (res) {
//
//                    angular.forEach(res, function (entity) {
//
//                    });
//
//                    console.log(res);
//                    $scope.employees = res;
//                    $scope.$digest();
//
//                })
//            });

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
//        DataContext.getFonctions().then(function (res) {
//            console.log(res);
//            $scope.fonctions = res;
//            $scope.$digest();
//
////            employees.byId = filterEmployeesById(employees);
//        })
    }

    $scope.onExportEmployees = function () {
        var exportEmployees = DataContext.exportEmployees(employees);
        console.log(exportEmployees);
    }


    $scope.onGetDepartements = function () {
        DataContext.getAllEntity('Departement')
            .then(function (res) {
                console.log(res);
                $scope.departements = res;
                $scope.$digest();
            });
//        DataContext.getDepartements().then(function (res) {
//            console.log(res);
//            $scope.departements = res;
//            $scope.$digest();
//        })
    }


    $scope.isUnchanged = function (activeItem) {

//        console.log('state:', activeItem.entityAspect.entityState.name);
//        console.log('originaleVals:', activeItem.entityAspect.originalValues);
//        angular.equals(activeItem, $scope.originActiveItem);

        if (!activeItem)return;
        var state = activeItem.entityAspect.entityState;

        return (state.isUnchanged()) ? true : false;
    };


//    function getSimpleObject(entity){
//
//        var obj = {};
//
//        var props = DataContext.manager.metadataStore.getEntityType(item.entityType.shortName).dataProperties;
//
//        return obj;
//    }

    function resetForm() {
        $scope.formData = null;
        $scope.activeItem = null;
    }



    $scope.onSave = function (activeItem) {

//        $timeout(function(){},0)
//        resetForm();
//        $scope.$digest();

//        var query = new breeze.EntityQuery('Employee')
//        $scope.employees = DataContext.manager.executeQueryLocally(query);
//
//        var exportData = DataContext.manager.exportEntities();
//        BreezeStorage.setEntityGraph(exportData);
//        DataContext.manager.addEntity(activeItem);
//        DataContext.manager.saveChanges();


        activeItem.entityAspect.setUnchanged();
        exportChanges();
        resetForm();
        $scope.onGetEntityGraph();
    }

    $scope.onCancel = function (activeItem) {

//        console.log('entityState:', activeItem.entityAspect.entityState);
//        activeItem.entityAspect.rejectChanges();
//        resetForm();

//        if(activeItem.entityAspect.entityState.name === 'Modified'){
            activeItem.entityAspect.rejectChanges();
//        }else if(activeItem.entityAspect.entityState.name === 'Added'){

//        }
// else{

//        }
//            resetForm();
    }

    $scope.onDelete = function (activeItem) {

        if(activeItem.entityAspect.hasTempKey){
            console.log('setDetached');
            activeItem.entityAspect.setDetached();
        }else{
            console.log('setDeleted');
            activeItem.entityAspect.setDeleted();
        }

        exportChanges();
//        resetForm();
        $scope.onGetEntityGraph();
    }

    function exportChanges() {
//        DataContext.manager.saveChanges();


//        var keyMappings = data.KeyMappings.map(function(km) {
//            var entityTypeName = MetadataStore.normalizeTypeName(km.EntityTypeName);
//            return { entityTypeName: entityTypeName, tempValue: km.TempValue, realValue: km.RealValue };
//        });
//        var saveResult = { entities: data.Entities, keyMappings: keyMappings, XHR: data.XHR };
//        deferred.resolve(saveResult);

//        private int AddMapping(Type type, int tempId)
//        {
//            var newId = IdGenerator.Instance.GetNextId(type);
//            _keyMappings.Add(new KeyMapping
//            {
//                EntityTypeName = type.FullName,
//                    RealValue = newId,
//                    TempValue = tempId
//            });
//            return newId;
//        }


        var entities = DataContext.manager.getEntities();
        angular.forEach(entities, function(entity){

            if(entity.id < 0){
//                entity.entityAspect.hasTempKey = true;
            }

        });

        doIt();


        var exportData = DataContext.manager.exportEntities();
        BreezeStorage.setEntityGraph(exportData);

    }

    function doIt(){

        $timeout(function(){
        var entities = DataContext.manager.getEntities();
        angular.forEach(entities, function(entity){
            if(entity.entityAspect.hasTempKey){
                console.log('id:', entity.id, 'State:', entity.entityAspect.entityState.name )
            }
        });
        },100);

//        var deferred = Q.defer();
//
//        $timeout(function(){
//            var entities = DataContext.manager.getEntities();
//            var keyMappings = [];
//            angular.forEach(entities, function(entity){
//                if(entity.id < 0){
//                    keyMappings.push({
//                        entityTypeName: entity.entityType.name,
//                        realValue: entity.id + 100,
//                        tempValue: entity.id
//                    })
//                }
//            });
//
//            var res = { entities: entities, keyMappings: keyMappings};
//            deferred.resolve(res);
//
//        },1000)
//
//        return deferred.promise;
    }

    function updateUI(){
        var query = new breeze.EntityQuery('Employee')
        $scope.employees = DataContext.manager.executeQueryLocally(query);

        var query = new breeze.EntityQuery('Departement')
        $scope.departements = DataContext.manager.executeQueryLocally(query);

        var query = new breeze.EntityQuery('Fonction')
        $scope.fonctions = DataContext.manager.executeQueryLocally(query);
    }

//    DataContext.manager.importEntities(importData)
//    Object {entities: Array[17], tempKeyMapping: Object}

    $scope.onGetEntityGraph = function () {


//        DataContext.manager.clear();
        var importData = BreezeStorage.getEntityGraph();



        DataContext.manager.importEntities(importData, {mergeStrategy: breeze.MergeStrategy.OverwriteChanges});

        var entities = DataContext.manager.getEntities();
        angular.forEach(entities, function(entity){

            if(entity.id < 0){
//                entity.entityAspect.hasTempKey = true;
            }

        });

        doIt();


//        DataContext.manager.clear();
//        var entities = DataContext.manager.importEntities(importData, {mergeStrategy: breeze.MergeStrategy.OverwriteChanges}).entities;

        // fix the disaperering hasTempKey after the manager.clear()
//        angular.forEach(entities, function (entity) {
//            if (entity.id < 0) {
//                entity.entityAspect.hasTempKey = true;
//            }
//        });

        updateUI();

//        console.log(DataContext.manager.importEntities(importData));
//        DataContext.manager.keyGenerator.getTempKeys()
    }

    $scope.onSetEntityGraph = function () {
        exportChanges();
    }


    function filterEmployeesById(employees) {
        return function (id) {
            return employees.filter(function (e) {
                return e.id === id;
            });
        };
    }


});

