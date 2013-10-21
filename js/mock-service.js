var services = angular.module('App.MockService', []);

services.factory('MockService', function (Utils, $log) {


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
                        nom: Utils.closeSingleQuotes(employe.nom),
                        prenom: Utils.closeSingleQuotes(employe.prenom),
                        email: employe.email,
                        adresse: Utils.closeSingleQuotes(employe.adresse),
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

    var getAllDepartement = function () {
        $log.log('getAllDepartement');
        var deferred = Q.defer();

        $.getJSON('assets/departements.json')
            .success(function (res) {
                $log.log('getDepartements SUCCESS');

                var employees = [];
                angular.forEach(res.departements, function (departement) {
                    var obj = {
                        id: departement.id,
                        nom: Utils.closeSingleQuotes(departement.nom)
                    };

                    employees.push(obj);
                });

                deferred.resolve(employees);
            })
            .error(function (err) {
                $log.log('getAllDepartement ERROR');
                deferred.reject(new Error(err));
            });

        return deferred.promise;
    }

    var getAllFonction = function () {
        $log.log('getAllFonction');
        var deferred = Q.defer();

        $.getJSON('assets/fonctions.json')
            .success(function (res) {
                $log.log('getAllFonction SUCCESS');

                var fonctions = [];
                angular.forEach(res.fonctions, function (fonction) {
                    var obj = {
                        id: fonction.id,
                        nom: Utils.closeSingleQuotes(fonction.nom)
                    };
                    fonctions.push(obj);
                });

                deferred.resolve(fonctions);
            })
            .error(function (err) {
                $log.log('getAllFonction ERROR');
                deferred.reject(new Error(err));
            });

        return deferred.promise;
    }


    return {
        getAllEmployee: getAllEmployee,
        getAllDepartement: getAllDepartement,
        getAllFonction: getAllFonction
    };
});