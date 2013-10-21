var services = angular.module('App.DataProvider', []);

services.factory('DataProvider', function (WebService, StorageProvider, MockService, GLOBALS) {

    var dataProvider = null;

    switch (GLOBALS.MODE) {

        case GLOBALS.WS:
            dataProvider = WebService;
            break;

        case GLOBALS.DB:
            dataProvider = StorageProvider;
            break;

        default:
            dataProvider = MockService;
            break;
    }

    return dataProvider;
});