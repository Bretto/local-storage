(function () {
    "use strict";

    var services = angular.module('App.DataProvider', []);

    services.factory('DataProvider', function (WebService, GLOBALS, MockServiceBreeze) {

        var dataProvider = null;

        switch (GLOBALS.MODE) {

            case GLOBALS.WS:
                dataProvider = WebService;
                break;

            case GLOBALS.DB:
//            dataProvider = StorageProvider;
                break;

            case GLOBALS.MOCK_BREEZE:
                dataProvider = MockServiceBreeze;
                break;

            default:
//            dataProvider = MockService;
                break;
        }

        return dataProvider;
    });

})();