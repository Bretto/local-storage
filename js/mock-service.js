var services = angular.module('App.MockService', []);

services.factory('MockService', function (Utils, $log, StorageProvider) {


    var getAllEmployee = function () {
        $log.log('getAllEmployee');
        var deferred = Q.defer();

        $.getJSON('assets/employes.json')
            .success(function (res) {
                $log.log('getAllEmployee SUCCESS');

                StorageProvider.saveEntityBatch('Employee', res.employes)
                    .then(function (entities) {
                        deferred.resolve(entities);
                    })
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

                StorageProvider.saveEntityBatch('Departement', res.departements)
                    .then(function (entities) {
                        deferred.resolve(entities);
                    })
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

                StorageProvider.saveEntityBatch('Fonction', res.fonctions)
                    .then(function (entities) {
                        deferred.resolve(entities);
                    })
            })
            .error(function (err) {
                $log.log('getAllFonction ERROR');
                deferred.reject(new Error(err));
            });

        return deferred.promise;
    }

    var getAllEntity = function (entityType) {

        var fn = null;

        switch (entityType) {

            case 'Employee':
                fn = getAllEmployee();
                break;

            case 'Departement':
                fn = getAllDepartement();
                break;

            case 'Fonction':
                fn = getAllFonction();
                break;
        }

        return fn
    }


    return {
        getAllEntity: getAllEntity
    };
});