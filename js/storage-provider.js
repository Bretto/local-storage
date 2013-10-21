var services = angular.module('App.StorageProvider', []);

services.factory('StorageProvider', function (WebSql, GLOBALS) {

    var storageProvider = null;

    switch (GLOBALS.STORAGE) {

        default:
            storageProvider = WebSql;
            break;
    }

    return storageProvider;

});