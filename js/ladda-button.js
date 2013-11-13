(function(){
    "use strict";

//    var ladda = require('./bower_components/Ladda/js/ladda');



    var module = angular.module('App.LaddaButton', []);

    module.directive('laddaButton', function ($log, $parse, gLadda) {

        function link(scope, element, attrs) {

            element.bind( "click", function() {

                var btn = gLadda.create(this);
                btn.start();

                var fn = $parse(attrs[ 'laddaButton' ]);

                scope.$apply(function () {
                    var promise = fn(scope, {});
                    promise.finally(function(){
                        btn.stop();
                    });

                });
            });
        }

        return {
            restrict: 'A',
            link: link
        };
    });

})();

