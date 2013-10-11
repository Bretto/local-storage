'use strict';

var filters = angular.module('App.filters', []);


filters.filter('age',function () {
    return function (text) {

        var age = moment(text, "DD-MM-YYYY").fromNow();

        return age;
    };
});
