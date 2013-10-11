'use strict';

var services = angular.module('App.services', []);

services.value('STATES', {
    online: true,
    lockUI: false
});

services.factory('DataModel', function ($http, $log, $rootScope) {

    var dataModel = {};
    dataModel.toggleViewOpen = true;
    dataModel.sideNav = [];
    dataModel.currentPage = {};


    dataModel.isOnline = function () {
        return STATES.online;
    }

    dataModel.isLockUI = function () {
        return STATES.lockUI;
    }

    dataModel.isPriNavActive = function (value) {
        return ( value === $stateParams.navId ) ? 'active' : '';
    }

    return dataModel;
});



