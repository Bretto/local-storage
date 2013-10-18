'use strict';
/* App Controllers */

var controllers = angular.module('App.controllers', []);

controllers.controller('AppCtrl', function ($scope, $rootScope, $timeout, $log, $http, DataModel, LocalStorage, WebService, DataContext) {
    $log.log('AppCtrl');

    LocalStorage
        .initDB()
        .then(function () {
            return WebService.getEmployees()
        })
        .then(function (employees) {
            return LocalStorage.setT_EMPLOYEE(employees)
        })
        .then(function () {
            return WebService.getDepartements()
        })
        .then(function (departements) {
            return LocalStorage.setT_DEPARTEMENT(departements)
        })
        .then(function () {
            return WebService.getFonctions()
        })
        .then(function (fonctions) {
            return LocalStorage.setT_FONCTION(fonctions)
        })
//

    $scope.employees = null;
    $scope.departements = null;
    $scope.fonctions = null;

//    $scope.formData = [{label:"Nom", type:"text", key:'nom'}, {label:"Email", type:"email", key:'email'}];


    $scope.isActive = function (item) {
        return this.activeItem === item;
    }

    $scope.onSelect = function (item){
        $scope.activeItem = item;

        var currentEntity = item;

        var props = DataContext.manager.metadataStore.getEntityType(item.entityType.shortName).dataProperties;
        var formData = [];




//        for(var key in currentEntity){

        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            formData.push({label:prop.name, type:"text", key:prop.name});
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
        DataContext.getEmployees().then(function(res){
            console.log(res);
            $scope.employees = res;
            $scope.$digest();


//            employees.byId = filterEmployeesById(employees);
        })
    }

    $scope.onGetFonctions = function () {
        DataContext.getFonctions().then(function(res){
            console.log(res);
            $scope.fonctions = res;
            $scope.$digest();

//            employees.byId = filterEmployeesById(employees);
        })
    }

    $scope.onExportEmployees = function () {
        var exportEmployees = DataContext.exportEmployees(employees);
        console.log(exportEmployees);
    }


    $scope.onGetDepartements = function () {
        DataContext.getDepartements().then(function(res){
            console.log(res);
            $scope.departements = res;
            $scope.$digest();
        })
    }


//    $scope.isUnchanged = function(user) {
//        return angular.equals(user, $scope.o);
//    };




    function filterEmployeesById(employees) {
        return function (id) {
            return employees.filter(function (e) { return e.id === id; });
        };
    }



});

