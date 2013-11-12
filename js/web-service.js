(function () {
    "use strict";

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
                        nom: addSingleQuotes(employe.nom),
                        prenom: addSingleQuotes(employe.prenom),
                        email: employe.email,
                        adresse: addSingleQuotes(employe.adresse),
                        fonction_id: employe.fonction_id,
                        departement_id: employe.departement_id
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
                        nom: addSingleQuotes(departement.nom)
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
                        nom: addSingleQuotes(fonction.nom)
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

    var getAllEmployee = function () {
        $log.log('getAllEmployee');
        var deferred = Q.defer();

        $.getJSON('assets/employes.json')
            .success(function (res) {
                $log.log('getAllEmployee SUCCESS');

                var employees = [];
                angular.forEach(res.employes, function (employe) {
                    var e = {
                        id: employe.id,
                        nom: addSingleQuotes(employe.nom),
                        prenom: addSingleQuotes(employe.prenom),
                        email: employe.email,
                        adresse: addSingleQuotes(employe.adresse),
                        fonction_id: employe.fonction_id,
                        departement_id: employe.departement_id
                    };

                    employees.push(e);
                });

                deferred.resolve(employees);

            })
            .error(function (err) {
                $log.log('getAllEmployee ERROR');
                deferred.reject(new Error(err));
            });

        return deferred.promise;
    }


    return {
        getAllEmployee: getAllEmployee,
        getEmployees: getEmployees,
        getDepartements: getDepartements,
        getFonctions: getFonctions
    };
});

})();

