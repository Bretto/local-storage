
(function(navigator){
    "use strict";

    var module = angular.module('App.LogDecorator', []);

    module.constant('LogDecorator', function (logDelegate) {

        var enchanceLogger = function( $log ){

                var separator = "::",
                    /**
                     * Capture the original $log functions; for use in enhancedLogFn()
                     */
                    _$log = (function( $log )
                    {
                        return {
                            log   : $log.log,
                            info  : $log.info,
                            warn  : $log.warn,
                            debug : $log.debug,
                            error : $log.error
                        };
                    })($log),
                    /**
                     * Chrome Dev tools supports color logging
                     * @see https://developers.google.com/chrome-developer-tools/docs/console#styling_console_output_with_css
                     */
                    colorify  = function( message, colorCSS )
                    {
                        var isChrome    = ( navigator.userAgent.indexOf('Chrome')),
                            canColorize = isChrome && (colorCSS !== undefined );

                        return canColorize ? [ "%c" + message, colorCSS ] : [ message ];
                    },
                    /**
                     * Partial application to pre-capture a logger function
                     */
                    prepareLogFn = function( logFn, className, colorCSS )
                    {
                        /**
                         * Invoke the specified `logFn` with the supplant functionality...
                         */
                        var enhancedLogFn = function ( )
                            {
                                var args = Array.prototype.slice.call(arguments),
                                    now  = buildTimeString(new Date());

                                // prepend a timestamp and optional classname to the original output message
                                args[0] = supplant("{0} - {1}{2}", [ now, className, args[0] ]);
                                args    = colorify( supplant.apply( null, args ), colorCSS );

                                logFn.apply( null, args );
                            };

                        // Only needed to support angular-mocks expectations
                        enhancedLogFn.logs = [ ];

                        return enhancedLogFn;
                    },
                    /**
                     * Support to generate class-specific logger instance with classname only
                     *
                     * @param className Name of object in which $log.<function> calls is invoked.
                     * @param colorCSS Object with CSS style color information for Chrome Dev Tools console log colorizing
                     *
                     * @returns {*} Logger instance
                     */
                    getInstance = function( className, colorCSS, customSeparator )
                    {

                        className = ( className !== undefined ) ? className + (customSeparator || separator)  : "";

                        return {
                            log   : prepareLogFn( _$log.log,    className, colorCSS ),
                            info  : prepareLogFn( _$log.info,   className, colorCSS ),
                            warn  : prepareLogFn( _$log.warn,   className, colorCSS ),
                            debug : prepareLogFn( _$log.debug,  className, colorCSS ),
                            error : prepareLogFn( _$log.error,  className )  // NO styling of ERROR messages
                        };
                    };

                $log.log   = prepareLogFn( $log.log );
                $log.info  = prepareLogFn( $log.info );
                $log.warn  = prepareLogFn( $log.warn );
                $log.debug = prepareLogFn( $log.debug );
                $log.error = prepareLogFn( $log.error );

                // Add special method to AngularJS $log
                $log.getInstance = getInstance;

                return $log;
            };

        return enchanceLogger(logDelegate);
    });


    var buildTimeString = function (date, format) {
        format = format || '%h:%m:%s:%z';

        function pad(value) {
            return (value.toString().length < 2) ? '0' + value : value;
        }

        return format.replace(/%([a-zA-Z])/g, function (_, fmtCode) {
            switch (fmtCode) {
                case 'Y' :
                    return     date.getFullYear();
                case 'M' :
                    return pad(date.getMonth() + 1);
                case 'd' :
                    return pad(date.getDate());
                case 'h' :
                    return pad(date.getHours());
                case 'm' :
                    return pad(date.getMinutes());
                case 's' :
                    return pad(date.getSeconds());
                case 'z':
                    return pad(date.getMilliseconds());
                default:
                    throw new Error('Unsupported format code: ' + fmtCode);
            }
        });
    }

    var supplant = function (template, values, pattern) {
        pattern = pattern || /\{([^\{\}]*)\}/g;

        return template.replace(pattern, function (a, b) {
            var p = b.split('.'),
                r = values;

            try {
                for (var s in p) {
                    r = r[p[s]];
                }
                ;
            } catch (e) {
                r = a;
            }

            return (typeof r === 'string' || typeof r === 'number') ? r : a;
        });
    };

})(window.navigator);