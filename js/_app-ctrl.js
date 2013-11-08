(function () {
    "use strict";
//    var Q = require('./bower_components/q/q.js');

    module = angular.module('App.AppCtrl', []);

    module.controller('AppCtrl', function ($scope, $log, $timeout) {

        $log.info('AppCtrl');


        $scope.onSaveEntityGraph = function () {

            var deferred = Q.defer();

            $timeout(function () {
                deferred.resolve();
            }, 5000)

            return deferred.promise;
        }

    });

})();