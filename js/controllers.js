'use strict';
/* App Controllers */

var controllers = angular.module('App.controllers', []);

controllers.controller('AppCtrl', function ($scope, $rootScope, $timeout, $log, $http, DataModel, StorageProvider, DataProvider, DataContext) {
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
        $scope.originActiveItem = item;

        var currentEntity = item;

        var props = DataContext.manager.metadataStore.getEntityType(item.entityType.shortName).dataProperties;
        var formData = [];

//        for(var key in currentEntity){

        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            formData.push({label: prop.name, type: "text", key: prop.name});
        }

//            if(key !== 'entityAspect' && key !== '_backingStore' && key !== '_$typeName' && key !== '$$hashKey'){
//                if(currentEntity[key]){
//                    formData.push({label:key, type:"text", key:key});
//                }
//            }
//        }
        $scope.formData = formData;
//        $scope.$digest();
    }

    $scope.onAddEmployee = function () {
        var newEmp = DataContext.manager.createEntity('Employee', {});
        $scope.employees.push(newEmp);
    }


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
//
//
//        return obj;
//    }


    $scope.onSave = function(activeItem){
        DataContext.saveEntity(activeItem)
            .then(function(){

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

