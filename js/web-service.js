'use strict';

var services = angular.module('App.WebService', []);

services.factory('WebService', function ($http, $log, $rootScope) {

    function addSingleQuotes(str) {
        if (str) str = str.replace(/'/g, "''");
        return str
    }


    var getEmployees = function () {
        $log.log('getEmployees');
        var deferred = Q.defer();

        $.getJSON('assets/employes.json')
            .success(function (res) {
                $log.log('getEmployees SUCCESS');

                var employees = [];
                angular.forEach(res.employes, function (employe) {
                    var e = {
                        id: employe.id,
                        NOM: addSingleQuotes(employe.nom),
                        PRENOM: addSingleQuotes(employe.prenom),
                        EMAIL: employe.email,
                        ADRESSE: addSingleQuotes(employe.adresse),
                        fonction_id: employe.fonction.id,
                        departement_id: employe.departement.id
                    };

                    employees.push(e);
                });

                deferred.resolve(employees);
            })
            .error(function (err) {
                $log.log('getEmployees ERROR');
                deferred.reject(new Error(err));
            });

        return deferred.promise;
    }

    var getDepartements = function () {
        $log.log('getDepartements');
        var deferred = Q.defer();

        $.getJSON('assets/departements.json')
            .success(function (res) {
                $log.log('getDepartements SUCCESS');

                var employees = [];
                angular.forEach(res.departements, function (departement) {
                    var obj = {
                        id: departement.id,
                        NOM: addSingleQuotes(departement.nom)
                    };

                    employees.push(obj);
                });

                deferred.resolve(employees);
            })
            .error(function (err) {
                $log.log('getDepartements ERROR');
                deferred.reject(new Error(err));
            });

        return deferred.promise;
    }

    var getFonctions = function () {
        $log.log('getFonctions');
        var deferred = Q.defer();

        $.getJSON('assets/fonctions.json')
            .success(function (res) {
                $log.log('getFonctions SUCCESS');

                var fonctions = [];
                angular.forEach(res.fonctions, function (fonction) {
                    var obj = {
                        id: fonction.id,
                        NOM: addSingleQuotes(fonction.nom)
                    };
                    fonctions.push(obj);
                });

                deferred.resolve(fonctions);
            })
            .error(function (err) {
                $log.log('getFonctions ERROR');
                deferred.reject(new Error(err));
            });

        return deferred.promise;
    }

    return {
        getEmployees: getEmployees,
        getDepartements: getDepartements,
        getFonctions: getFonctions
    };
});

