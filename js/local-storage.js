'use strict';

var services = angular.module('App.LocalStorage', []);

services.factory('LocalStorage', function ($http, $log, $rootScope, $sanitize) {


    var db = null;

    function populateTabe(tx, tableName, rows) {

        angular.forEach(rows, function (row) {

            var keys = Object.keys(row).toString()

            var values = [];
            for (var key in row) {
                values.push(row[key]);
            }
            values = "'" + values.join("','") + "'";

            tx.executeSql('INSERT INTO '+tableName+' (' + keys + ') VALUES (' + values + ')');

        });
    }

    var initDB = function () {
        $log.log('initDB');

        var deferred = Q.defer();

        db = window.openDatabase("Database", "1.0", "Demo", 26214400);

        createT_EMPLOYEE()
            .then(function () {
                return createT_DEPARTEMENT();
            })

            .then(function () {
                return createT_FONCTION();
            })

            .catch(function (err) {
                $log.error('Error initDB', err);
                deferred.reject(new Error(err));
            })
            .done(function (data) {
                $log.log('initDB SUCCESS');
                deferred.resolve(data);
            })

        return deferred.promise;
    }








    var setT_EMPLOYEE = function (rows) {

        var deferred = Q.defer();

        function errorCB(err) {
            console.log("Error processing SQL: " + err.message);
            deferred.reject(new Error(err));
        }

        function successCB() {
            console.log("success!");
            deferred.resolve();
        }

        var tableName = 'T_EMPLOYEE';

        db.transaction(function (tx) {
            populateTabe(tx, tableName, rows)
        }, errorCB, successCB);

        return deferred.promise;

    }

    var setT_DEPARTEMENT = function (rows) {

        var deferred = Q.defer();

        function errorCB(err) {
            console.log("Error processing SQL: " + err.message);
            deferred.reject(new Error(err));
        }

        function successCB() {
            console.log("success!");
            deferred.resolve();
        }

        var tableName = 'T_DEPARTEMENT';

        db.transaction(function (tx) {
            populateTabe(tx, tableName, rows)
        }, errorCB, successCB);

        return deferred.promise;

    }

    var setT_FONCTION = function (rows) {

        var deferred = Q.defer();

        function errorCB(err) {
            console.log("Error processing SQL: " + err.message);
            deferred.reject(new Error(err));
        }

        function successCB() {
            console.log("success!");
            deferred.resolve();
        }

        var tableName = 'T_FONCTION';

        db.transaction(function (tx) {
            populateTabe(tx, tableName, rows)
        }, errorCB, successCB);

        return deferred.promise;

    }

    function createT_EMPLOYEE() {

        var deferred = Q.defer();

        function errorCB(err) {
            console.log("Error processing SQL: " + err.message);
            deferred.reject(new Error(err));
        }

        function successCB() {
            console.log("success!");
            deferred.resolve();
        }

        function T_EMPLOYEE(tx) {
            tx.executeSql('DROP TABLE IF EXISTS T_EMPLOYEE');
            tx.executeSql('create table T_EMPLOYEE (' +
                'id                        INTEGER PRIMARY KEY AUTOINCREMENT,' +
                'nom                       varchar2(50) not null,' +
                'prenom                    varchar2(50) not null,' +
                'email                     varchar2(150) not null,' +
                'adresse                   varchar2(300),' +
                'fonction_id               bigint,' +
                'departement_id            bigint)'
                );
        };

        db.transaction(T_EMPLOYEE, errorCB, successCB);

        return deferred.promise;
    }

    function createT_DEPARTEMENT() {

        var deferred = Q.defer();

        function errorCB(err) {
            console.log("Error processing SQL: " + err.message);
            deferred.reject(new Error(err));
        }

        function successCB() {
            console.log("success!");
            deferred.resolve();
        }

        function T_DEPARTEMENT(tx) {

            tx.executeSql('DROP TABLE IF EXISTS T_DEPARTEMENT');
            tx.executeSql('create table T_DEPARTEMENT ( ' +
                'id                       INTEGER PRIMARY KEY AUTOINCREMENT,' +
                'nom                      varchar2(50) not null,' +
                'constraint uq_T_DEPARTEMENT_nom unique (nom))'
                );
        }

        db.transaction(T_DEPARTEMENT, errorCB, successCB);

        return deferred.promise;

    };

    function createT_FONCTION() {

        var deferred = Q.defer();

        function errorCB(err) {
            console.log("Error processing SQL: " + err.message);
            deferred.reject(new Error(err));
        }

        function successCB() {
            console.log("success!");
            deferred.resolve();
        }

        function T_FONCTION(tx) {

            tx.executeSql('DROP TABLE IF EXISTS T_FONCTION');
            tx.executeSql('create table T_FONCTION (' +
                'id                       INTEGER PRIMARY KEY AUTOINCREMENT,' +
                'nom                      varchar2(50) not null,' +
                'constraint uq_T_FONCTION_nom unique (nom))'
                );
        }

        db.transaction(T_FONCTION, errorCB, successCB);
        return deferred.promise;
    };


    function getAllEmployees() {

        var deferred = Q.defer();
        var result = [];

        function errorCB(err) {
            console.log("Error processing SQL: " + err.message);
            deferred.reject(new Error(err));
        }

        function successCB() {
            console.log("success!");
            deferred.resolve(result);
        }

        function allEmployees(tx) {

            function successCB(tx, res) {
                for (var i=0; i<res.rows.length; i++){
                    result.push(res.rows.item(i));
                }
            }

            function errorCB(err) {
                console.log("Error processing SQL: " + err.message);
            }

//            tx.executeSql('SELECT *,' +
//                ' T_FONCTION.NOM AS FONCTION,' +
//                ' T_DEPARTEMENT.NOM AS DEPARTEMENT' +
//                ' FROM T_EMPLOYEE' +
//                ' LEFT JOIN T_DEPARTEMENT' +
//                ' ON T_EMPLOYEE.departement_id = T_DEPARTEMENT.id'+
//                ' LEFT JOIN T_FONCTION' +
//                ' ON T_EMPLOYEE.fonction_id = T_FONCTION.id'
//                , [], successCB, errorCB);

            tx.executeSql('SELECT *' +
                ' FROM T_EMPLOYEE'
                , [], successCB, errorCB);
        }

        db.transaction(allEmployees, errorCB, successCB);
        return deferred.promise;
    };


    var saveEntity = function (entity, rows) {

        var deferred = Q.defer();

        function errorCB(err) {
            console.log("Error processing SQL: " + err.message);
            deferred.reject(new Error(err));
        }

        function successCB() {
            console.log("success!");
            deferred.resolve();
        }

        var tableName = 'T_'+entity.toUpperCase();

        db.transaction(function (tx) {
            populateTabe(tx, tableName, rows)
        }, errorCB, successCB);

        return deferred.promise;

    }




    return {
        initDB: initDB,
        setT_EMPLOYEE: setT_EMPLOYEE,
        setT_DEPARTEMENT: setT_DEPARTEMENT,
        setT_FONCTION: setT_FONCTION,
        getAllEmployees: getAllEmployees,
        saveEntity: saveEntity
    };
});