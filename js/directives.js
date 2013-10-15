'use strict';

var directives = angular.module('App.directives', []);


directives.directive('nodeMaster', function ($log, $compile) {

    function link(scope, element, attrs) {
        console.log('test')
    }

    return {
        restrict: 'A',
        link: link,
        templateUrl: 'partials/node-master.html',
        scope: {nodes:'='}
    };
});


directives.directive('nodeList', function ($log, $compile) {

    function link(scope, element, attrs) {
        console.log('test')

        scope.newNode = function (data) {
            var d = data || [{"key":"key","value":"value"}];
            scope.nodes.push(d);
        }
    }

    return {
        scope:true,
        restrict: 'A',
        link: link,
//        scope: {nodes:'='},
        templateUrl: 'partials/node-list.html',
        controller: function ($scope, $element) {

            this.newNode = function (data) {
                var d = data || {};
                $scope.nodes.push(d);
            }

            this.deleteNode = function (data) {
                var i = $scope.node.indexOf(data);
                if (i > 0)$scope.node.splice(i, 1);
            }

        }
    };
});


directives.directive('nodeItem', function ($log, $compile) {

    function link(scope, element, attrs, ctrl) {

    }

    return {
        restrict: 'A',
        link: link,
//        scope: {node:'='},
        templateUrl: 'partials/node-item.html',
        controller: function ($scope, $element) {

            this.newData = function (data) {
                var d = data || {};
                $scope.node.push(d);
            }

            this.newChild = function () {
                var d = data || {};
                $scope.node.push(d);
            }
//
            this.deleteData = function (data) {
                var i = $scope.node.indexOf(data);
                if (i > 0)$scope.node.splice(i, 1);
            }

        }
    };
});


directives.directive('nodeData', function ($log, $compile) {

    function link(scope, element, attrs, ctrl) {

        var data = scope.data();
        var newScope = null;
        var newElement = null;
        var oldElement = '<input ng-model="data.value" type="text" class="value" ng-enter="newData(data.value)">';

        scope.data = data;

        scope.newData = function (str) {
            ctrl.newData();
        }

        scope.deleteData = function () {
            ctrl.deleteData(scope.data);
        }

        function newChild(){
            newElement = angular.element("<div node-list nodes='nodes'></div>");

            newScope = scope.$new();
            var nodesData = [[{"key":"key","value":"value"}]];
            if(angular.isArray(scope.data.value)){
                nodesData = scope.data.value;
            }
            newScope.nodes = nodesData;
            scope.data.value = newScope.nodes;

            $compile(newElement)(newScope, function (clonedElement, scope) {
                element.find('.value').replaceWith(clonedElement);
            });
        }

        scope.$watch(function(){return scope.data.key}, function(value){
            if (scope.data.key === 'children') {
                console.log('new Children');
                newChild();

            }else{
                if(angular.isArray(scope.data.value)){
                    console.log('test');
//                    var oldScope = scope.$new();
//                    oldScope.data.value = "value";
                    scope.data.value = 'value'
                    $compile(oldElement)(scope, function (clonedElement, scopeOld) {
                        //element.find('.value-wrap').replaceWith(clonedElement);
//                        scope.data.value = scopeOld.data.value;
                        ctrl.deleteData(scope.data);
                        ctrl.newData();
                    });
                }
            }
        })



    }

    return {
        require: '^nodeItem',
        restrict: 'A',
        scope: {data: '&'},
        templateUrl: 'partials/node-data.html',
        link: link
    };
});


directives.directive('ngEnter', function ($log) {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {

            if (event.which === 13) {

                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});

directives.directive('ngDelete', function ($log) {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {

            if (event.which === 8) {

                if (scope.data.key === undefined || scope.data.key.length === 0) {

                    scope.$apply(function () {
                        scope.$eval(attrs.ngDelete);
                    });
                    event.preventDefault();
                }

            }
        });
    };
});

directives.directive('autoFocus', function ($timeout) {
    return {
        link: function (scope, element, attrs) {
            scope.$watch(attrs.autoFocus, function () {
                $timeout(function () {
                    element[0].focus();
                    scope.$digest();
                }, 0);
            }, true);
        }
    };
});

