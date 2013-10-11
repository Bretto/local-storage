'use strict';
/* App Controllers */

var controllers = angular.module('App.controllers', []);

controllers.controller('AppCtrl', function ($scope, $rootScope, $timeout, $log, $http, DataModel, LocalStorage, WebService) {
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

    $scope.onSelectAll = function () {

        LocalStorage.getAllEmployees()
            .then(function (employees) {
                console.log(employees);
            })






    }
});

