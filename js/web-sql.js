var services = angular.module('App.WebSql', []);

services.factory('WebSql', function ($log, Utils) {

    var db = null;

    function populateTabe(tx, tableName, rows) {

        angular.forEach(rows, function (row) {

            var keys = Object.keys(row).toString()

            var values = [];
            for (var key in row) {
                values.push(row[key]);
            }
            values = "'" + values.join("','") + "'";
            tx.executeSql('REPLACE INTO ' + tableName + ' (' + keys + ') VALUES (' + values + ')');

        });
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
//            tx.executeSql('DROP TABLE IF EXISTS T_EMPLOYEE');
            tx.executeSql('CREATE TABLE IF NOT EXISTS T_EMPLOYEE (' +
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

//            tx.executeSql('DROP TABLE IF EXISTS T_DEPARTEMENT');
            tx.executeSql('CREATE TABLE IF NOT EXISTS T_DEPARTEMENT ( ' +
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

//            tx.executeSql('DROP TABLE IF EXISTS T_FONCTION');
            tx.executeSql('CREATE TABLE IF NOT EXISTS T_FONCTION (' +
                'id                       INTEGER PRIMARY KEY AUTOINCREMENT,' +
                'nom                      varchar2(50) not null,' +
                'constraint uq_T_FONCTION_nom unique (nom))'
            );
        }

        db.transaction(T_FONCTION, errorCB, successCB);
        return deferred.promise;
    };

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

    var saveEntityBatch = function (entity, rows) {

        var deferred = Q.defer();

        function errorCB(err) {
            console.log("Error processing SQL: " + err.message);
            deferred.reject(new Error(err));
        }

        function successCB() {
            console.log("success!");

            getAllEntity(entity).then(function (entities) {
                deferred.resolve(entities);
            })
        }

        var tableName = 'T_' + entity.toUpperCase();

        angular.forEach(rows, function (obj) {
            for (key in obj) {
                var value = obj[key];
                obj[key] = Utils.closeSingleQuotes(value);
            }
        });

        db.transaction(function (tx) {
            populateTabe(tx, tableName, rows)
        }, errorCB, successCB);

        return deferred.promise;

    }

    var saveEntity = function (entity) {

        var entityType = entity.entityType.shortName;
        var data = Utils.entityToJson(entity);

        var deferred = Q.defer();
        var entityId = data.id;

        function errorCB(err) {
            console.log("Error processing SQL: " + err.message);
            deferred.reject(new Error(err));
        }

        function successCB() {
            console.log("success!");

//            getEntityById(entity).then(function (entities) {
//                deferred.resolve(entities);
//            })
        }

        var tableName = 'T_' + entityType.toUpperCase();


        for (key in data) {
            var value = data[key];
            data[key] = Utils.closeSingleQuotes(value);
        }

        db.transaction(function (tx) {

            function successCB2(tx, res) {

                for (var i = 0; i < res.rows.length; i++) {
                    result.push(res.rows.item(i));
                }
            }

            function errorCB2(err) {
                console.log("Error processing SQL: " + err.message);
            }


            var keys = Object.keys(data).toString()

            var values = [];
            for (var key in data) {
                values.push(data[key]);
            }
            values = "'" + values.join("','") + "'";
            tx.executeSql('REPLACE INTO ' + tableName + ' (' + keys + ') VALUES (' + values + ')', [], successCB2, errorCB2);
        }, errorCB, successCB);

        return deferred.promise;

    }

    function getAllEntity(entityType) {

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
                for (var i = 0; i < res.rows.length; i++) {
                    result.push(res.rows.item(i));
                }
            }

            function errorCB(err) {
                console.log("Error processing SQL: " + err.message);
            }

            tx.executeSql('SELECT *' +
                ' FROM T_' + entityType.toUpperCase()
                , [], successCB, errorCB);
        }

        db.transaction(allEmployees, errorCB, successCB);
        return deferred.promise;
    };

    return {
        initDB: initDB,
        saveEntity: saveEntity,
        saveEntityBatch: saveEntityBatch,
        getAllEntity: getAllEntity
    };
});