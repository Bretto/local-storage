!function(definition) {
    if ("function" == typeof bootstrap) bootstrap("promise", definition); else if ("object" == typeof exports) module.exports = definition(); else if ("function" == typeof define && define.amd) define(definition); else if ("undefined" != typeof ses) {
        if (!ses.ok()) return;
        ses.makeQ = definition;
    } else Q = definition();
}(function() {
    "use strict";
    function uncurryThis(f) {
        return function() {
            return call.apply(f, arguments);
        };
    }
    function isObject(value) {
        return value === Object(value);
    }
    function isStopIteration(exception) {
        return "[object StopIteration]" === object_toString(exception) || exception instanceof QReturnValue;
    }
    function makeStackTraceLong(error, promise) {
        if (hasStacks && promise.stack && "object" == typeof error && null !== error && error.stack && -1 === error.stack.indexOf(STACK_JUMP_SEPARATOR)) {
            for (var stacks = [], p = promise; p; p = p.source) p.stack && stacks.unshift(p.stack);
            stacks.unshift(error.stack);
            var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
            error.stack = filterStackString(concatedStacks);
        }
    }
    function filterStackString(stackString) {
        for (var lines = stackString.split("\n"), desiredLines = [], i = 0; i < lines.length; ++i) {
            var line = lines[i];
            isInternalFrame(line) || isNodeFrame(line) || !line || desiredLines.push(line);
        }
        return desiredLines.join("\n");
    }
    function isNodeFrame(stackLine) {
        return -1 !== stackLine.indexOf("(module.js:") || -1 !== stackLine.indexOf("(node.js:");
    }
    function getFileNameAndLineNumber(stackLine) {
        var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
        if (attempt1) return [ attempt1[1], Number(attempt1[2]) ];
        var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
        if (attempt2) return [ attempt2[1], Number(attempt2[2]) ];
        var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
        return attempt3 ? [ attempt3[1], Number(attempt3[2]) ] : void 0;
    }
    function isInternalFrame(stackLine) {
        var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);
        if (!fileNameAndLineNumber) return !1;
        var fileName = fileNameAndLineNumber[0], lineNumber = fileNameAndLineNumber[1];
        return fileName === qFileName && lineNumber >= qStartingLine && qEndingLine >= lineNumber;
    }
    function captureLine() {
        if (hasStacks) try {
            throw new Error();
        } catch (e) {
            var lines = e.stack.split("\n"), firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2], fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
            if (!fileNameAndLineNumber) return;
            return qFileName = fileNameAndLineNumber[0], fileNameAndLineNumber[1];
        }
    }
    function deprecate(callback, name, alternative) {
        return function() {
            return "undefined" != typeof console && "function" == typeof console.warn && console.warn(name + " is deprecated, use " + alternative + " instead.", new Error("").stack), 
            callback.apply(callback, arguments);
        };
    }
    function Q(value) {
        return isPromise(value) ? value : isPromiseAlike(value) ? coerce(value) : fulfill(value);
    }
    function defer() {
        function become(newPromise) {
            resolvedPromise = newPromise, promise.source = newPromise, array_reduce(messages, function(undefined, message) {
                nextTick(function() {
                    newPromise.promiseDispatch.apply(newPromise, message);
                });
            }, void 0), messages = void 0, progressListeners = void 0;
        }
        var resolvedPromise, messages = [], progressListeners = [], deferred = object_create(defer.prototype), promise = object_create(Promise.prototype);
        if (promise.promiseDispatch = function(resolve, op, operands) {
            var args = array_slice(arguments);
            messages ? (messages.push(args), "when" === op && operands[1] && progressListeners.push(operands[1])) : nextTick(function() {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }, promise.valueOf = deprecate(function() {
            if (messages) return promise;
            var nearerValue = nearer(resolvedPromise);
            return isPromise(nearerValue) && (resolvedPromise = nearerValue), nearerValue;
        }, "valueOf", "inspect"), promise.inspect = function() {
            return resolvedPromise ? resolvedPromise.inspect() : {
                state: "pending"
            };
        }, Q.longStackSupport && hasStacks) try {
            throw new Error();
        } catch (e) {
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
        return deferred.promise = promise, deferred.resolve = function(value) {
            resolvedPromise || become(Q(value));
        }, deferred.fulfill = function(value) {
            resolvedPromise || become(fulfill(value));
        }, deferred.reject = function(reason) {
            resolvedPromise || become(reject(reason));
        }, deferred.notify = function(progress) {
            resolvedPromise || array_reduce(progressListeners, function(undefined, progressListener) {
                nextTick(function() {
                    progressListener(progress);
                });
            }, void 0);
        }, deferred;
    }
    function promise(resolver) {
        if ("function" != typeof resolver) throw new TypeError("resolver must be a function.");
        var deferred = defer();
        try {
            resolver(deferred.resolve, deferred.reject, deferred.notify);
        } catch (reason) {
            deferred.reject(reason);
        }
        return deferred.promise;
    }
    function race(answerPs) {
        return promise(function(resolve, reject) {
            for (var i = 0, len = answerPs.length; len > i; i++) Q(answerPs[i]).then(resolve, reject);
        });
    }
    function Promise(descriptor, fallback, inspect) {
        void 0 === fallback && (fallback = function(op) {
            return reject(new Error("Promise does not support operation: " + op));
        }), void 0 === inspect && (inspect = function() {
            return {
                state: "unknown"
            };
        });
        var promise = object_create(Promise.prototype);
        if (promise.promiseDispatch = function(resolve, op, args) {
            var result;
            try {
                result = descriptor[op] ? descriptor[op].apply(promise, args) : fallback.call(promise, op, args);
            } catch (exception) {
                result = reject(exception);
            }
            resolve && resolve(result);
        }, promise.inspect = inspect, inspect) {
            var inspected = inspect();
            "rejected" === inspected.state && (promise.exception = inspected.reason), promise.valueOf = deprecate(function() {
                var inspected = inspect();
                return "pending" === inspected.state || "rejected" === inspected.state ? promise : inspected.value;
            });
        }
        return promise;
    }
    function when(value, fulfilled, rejected, progressed) {
        return Q(value).then(fulfilled, rejected, progressed);
    }
    function nearer(value) {
        if (isPromise(value)) {
            var inspected = value.inspect();
            if ("fulfilled" === inspected.state) return inspected.value;
        }
        return value;
    }
    function isPromise(object) {
        return isObject(object) && "function" == typeof object.promiseDispatch && "function" == typeof object.inspect;
    }
    function isPromiseAlike(object) {
        return isObject(object) && "function" == typeof object.then;
    }
    function isPending(object) {
        return isPromise(object) && "pending" === object.inspect().state;
    }
    function isFulfilled(object) {
        return !isPromise(object) || "fulfilled" === object.inspect().state;
    }
    function isRejected(object) {
        return isPromise(object) && "rejected" === object.inspect().state;
    }
    function displayUnhandledReasons() {
        unhandledReasonsDisplayed || "undefined" == typeof window || window.Touch || !window.console || console.warn("[Q] Unhandled rejection reasons (should be empty):", unhandledReasons), 
        unhandledReasonsDisplayed = !0;
    }
    function logUnhandledReasons() {
        for (var i = 0; i < unhandledReasons.length; i++) {
            var reason = unhandledReasons[i];
            console.warn("Unhandled rejection reason:", reason);
        }
    }
    function resetUnhandledRejections() {
        unhandledReasons.length = 0, unhandledRejections.length = 0, unhandledReasonsDisplayed = !1, 
        trackUnhandledRejections || (trackUnhandledRejections = !0, "undefined" != typeof process && process.on && process.on("exit", logUnhandledReasons));
    }
    function trackRejection(promise, reason) {
        trackUnhandledRejections && (unhandledRejections.push(promise), reason && "undefined" != typeof reason.stack ? unhandledReasons.push(reason.stack) : unhandledReasons.push("(no stack) " + reason), 
        displayUnhandledReasons());
    }
    function untrackRejection(promise) {
        if (trackUnhandledRejections) {
            var at = array_indexOf(unhandledRejections, promise);
            -1 !== at && (unhandledRejections.splice(at, 1), unhandledReasons.splice(at, 1));
        }
    }
    function reject(reason) {
        var rejection = Promise({
            when: function(rejected) {
                return rejected && untrackRejection(this), rejected ? rejected(reason) : this;
            }
        }, function() {
            return this;
        }, function() {
            return {
                state: "rejected",
                reason: reason
            };
        });
        return trackRejection(rejection, reason), rejection;
    }
    function fulfill(value) {
        return Promise({
            when: function() {
                return value;
            },
            get: function(name) {
                return value[name];
            },
            set: function(name, rhs) {
                value[name] = rhs;
            },
            "delete": function(name) {
                delete value[name];
            },
            post: function(name, args) {
                return null === name || void 0 === name ? value.apply(void 0, args) : value[name].apply(value, args);
            },
            apply: function(thisp, args) {
                return value.apply(thisp, args);
            },
            keys: function() {
                return object_keys(value);
            }
        }, void 0, function() {
            return {
                state: "fulfilled",
                value: value
            };
        });
    }
    function coerce(promise) {
        var deferred = defer();
        return nextTick(function() {
            try {
                promise.then(deferred.resolve, deferred.reject, deferred.notify);
            } catch (exception) {
                deferred.reject(exception);
            }
        }), deferred.promise;
    }
    function master(object) {
        return Promise({
            isDef: function() {}
        }, function(op, args) {
            return dispatch(object, op, args);
        }, function() {
            return Q(object).inspect();
        });
    }
    function spread(value, fulfilled, rejected) {
        return Q(value).spread(fulfilled, rejected);
    }
    function async(makeGenerator) {
        return function() {
            function continuer(verb, arg) {
                var result;
                if (hasES6Generators) {
                    try {
                        result = generator[verb](arg);
                    } catch (exception) {
                        return reject(exception);
                    }
                    return result.done ? result.value : when(result.value, callback, errback);
                }
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return isStopIteration(exception) ? exception.value : reject(exception);
                }
                return when(result, callback, errback);
            }
            var generator = makeGenerator.apply(this, arguments), callback = continuer.bind(continuer, "next"), errback = continuer.bind(continuer, "throw");
            return callback();
        };
    }
    function spawn(makeGenerator) {
        Q.done(Q.async(makeGenerator)());
    }
    function _return(value) {
        throw new QReturnValue(value);
    }
    function promised(callback) {
        return function() {
            return spread([ this, all(arguments) ], function(self, args) {
                return callback.apply(self, args);
            });
        };
    }
    function dispatch(object, op, args) {
        return Q(object).dispatch(op, args);
    }
    function all(promises) {
        return when(promises, function(promises) {
            var countDown = 0, deferred = defer();
            return array_reduce(promises, function(undefined, promise, index) {
                var snapshot;
                isPromise(promise) && "fulfilled" === (snapshot = promise.inspect()).state ? promises[index] = snapshot.value : (++countDown, 
                when(promise, function(value) {
                    promises[index] = value, 0 === --countDown && deferred.resolve(promises);
                }, deferred.reject, function(progress) {
                    deferred.notify({
                        index: index,
                        value: progress
                    });
                }));
            }, void 0), 0 === countDown && deferred.resolve(promises), deferred.promise;
        });
    }
    function allResolved(promises) {
        return when(promises, function(promises) {
            return promises = array_map(promises, Q), when(all(array_map(promises, function(promise) {
                return when(promise, noop, noop);
            })), function() {
                return promises;
            });
        });
    }
    function allSettled(promises) {
        return Q(promises).allSettled();
    }
    function progress(object, progressed) {
        return Q(object).then(void 0, void 0, progressed);
    }
    function nodeify(object, nodeback) {
        return Q(object).nodeify(nodeback);
    }
    var hasStacks = !1;
    try {
        throw new Error();
    } catch (e) {
        hasStacks = !!e.stack;
    }
    var qFileName, QReturnValue, qStartingLine = captureLine(), noop = function() {}, nextTick = function() {
        function flush() {
            for (;head.next; ) {
                head = head.next;
                var task = head.task;
                head.task = void 0;
                var domain = head.domain;
                domain && (head.domain = void 0, domain.enter());
                try {
                    task();
                } catch (e) {
                    if (isNodeJS) throw domain && domain.exit(), setTimeout(flush, 0), domain && domain.enter(), 
                    e;
                    setTimeout(function() {
                        throw e;
                    }, 0);
                }
                domain && domain.exit();
            }
            flushing = !1;
        }
        var head = {
            task: void 0,
            next: null
        }, tail = head, flushing = !1, requestTick = void 0, isNodeJS = !1;
        if (nextTick = function(task) {
            tail = tail.next = {
                task: task,
                domain: isNodeJS && process.domain,
                next: null
            }, flushing || (flushing = !0, requestTick());
        }, "undefined" != typeof process && process.nextTick) isNodeJS = !0, requestTick = function() {
            process.nextTick(flush);
        }; else if ("function" == typeof setImmediate) requestTick = "undefined" != typeof window ? setImmediate.bind(window, flush) : function() {
            setImmediate(flush);
        }; else if ("undefined" != typeof MessageChannel) {
            var channel = new MessageChannel();
            channel.port1.onmessage = function() {
                requestTick = requestPortTick, channel.port1.onmessage = flush, flush();
            };
            var requestPortTick = function() {
                channel.port2.postMessage(0);
            };
            requestTick = function() {
                setTimeout(flush, 0), requestPortTick();
            };
        } else requestTick = function() {
            setTimeout(flush, 0);
        };
        return nextTick;
    }(), call = Function.call, array_slice = uncurryThis(Array.prototype.slice), array_reduce = uncurryThis(Array.prototype.reduce || function(callback, basis) {
        var index = 0, length = this.length;
        if (1 === arguments.length) for (;;) {
            if (index in this) {
                basis = this[index++];
                break;
            }
            if (++index >= length) throw new TypeError();
        }
        for (;length > index; index++) index in this && (basis = callback(basis, this[index], index));
        return basis;
    }), array_indexOf = uncurryThis(Array.prototype.indexOf || function(value) {
        for (var i = 0; i < this.length; i++) if (this[i] === value) return i;
        return -1;
    }), array_map = uncurryThis(Array.prototype.map || function(callback, thisp) {
        var self = this, collect = [];
        return array_reduce(self, function(undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0), collect;
    }), object_create = Object.create || function(prototype) {
        function Type() {}
        return Type.prototype = prototype, new Type();
    }, object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty), object_keys = Object.keys || function(object) {
        var keys = [];
        for (var key in object) object_hasOwnProperty(object, key) && keys.push(key);
        return keys;
    }, object_toString = uncurryThis(Object.prototype.toString);
    QReturnValue = "undefined" != typeof ReturnValue ? ReturnValue : function(value) {
        this.value = value;
    };
    var hasES6Generators;
    try {
        new Function("(function* (){ yield 1; })"), hasES6Generators = !0;
    } catch (e) {
        hasES6Generators = !1;
    }
    var STACK_JUMP_SEPARATOR = "From previous event:";
    Q.resolve = Q, Q.nextTick = nextTick, Q.longStackSupport = !1, Q.defer = defer, 
    defer.prototype.makeNodeResolver = function() {
        var self = this;
        return function(error, value) {
            error ? self.reject(error) : arguments.length > 2 ? self.resolve(array_slice(arguments, 1)) : self.resolve(value);
        };
    }, Q.promise = promise, Q.passByCopy = function(object) {
        return object;
    }, Promise.prototype.passByCopy = function() {
        return this;
    }, Q.join = function(x, y) {
        return Q(x).join(y);
    }, Promise.prototype.join = function(that) {
        return Q([ this, that ]).spread(function(x, y) {
            if (x === y) return x;
            throw new Error("Can't join: not the same: " + x + " " + y);
        });
    }, Q.race = race, Promise.prototype.race = function() {
        return this.then(Q.race);
    }, Q.makePromise = Promise, Promise.prototype.toString = function() {
        return "[object Promise]";
    }, Promise.prototype.then = function(fulfilled, rejected, progressed) {
        function _fulfilled(value) {
            try {
                return "function" == typeof fulfilled ? fulfilled(value) : value;
            } catch (exception) {
                return reject(exception);
            }
        }
        function _rejected(exception) {
            if ("function" == typeof rejected) {
                makeStackTraceLong(exception, self);
                try {
                    return rejected(exception);
                } catch (newException) {
                    return reject(newException);
                }
            }
            return reject(exception);
        }
        function _progressed(value) {
            return "function" == typeof progressed ? progressed(value) : value;
        }
        var self = this, deferred = defer(), done = !1;
        return nextTick(function() {
            self.promiseDispatch(function(value) {
                done || (done = !0, deferred.resolve(_fulfilled(value)));
            }, "when", [ function(exception) {
                done || (done = !0, deferred.resolve(_rejected(exception)));
            } ]);
        }), self.promiseDispatch(void 0, "when", [ void 0, function(value) {
            var newValue, threw = !1;
            try {
                newValue = _progressed(value);
            } catch (e) {
                if (threw = !0, !Q.onerror) throw e;
                Q.onerror(e);
            }
            threw || deferred.notify(newValue);
        } ]), deferred.promise;
    }, Q.when = when, Promise.prototype.thenResolve = function(value) {
        return this.then(function() {
            return value;
        });
    }, Q.thenResolve = function(promise, value) {
        return Q(promise).thenResolve(value);
    }, Promise.prototype.thenReject = function(reason) {
        return this.then(function() {
            throw reason;
        });
    }, Q.thenReject = function(promise, reason) {
        return Q(promise).thenReject(reason);
    }, Q.nearer = nearer, Q.isPromise = isPromise, Q.isPromiseAlike = isPromiseAlike, 
    Q.isPending = isPending, Promise.prototype.isPending = function() {
        return "pending" === this.inspect().state;
    }, Q.isFulfilled = isFulfilled, Promise.prototype.isFulfilled = function() {
        return "fulfilled" === this.inspect().state;
    }, Q.isRejected = isRejected, Promise.prototype.isRejected = function() {
        return "rejected" === this.inspect().state;
    };
    var unhandledReasons = [], unhandledRejections = [], unhandledReasonsDisplayed = !1, trackUnhandledRejections = !0;
    Q.resetUnhandledRejections = resetUnhandledRejections, Q.getUnhandledReasons = function() {
        return unhandledReasons.slice();
    }, Q.stopUnhandledRejectionTracking = function() {
        resetUnhandledRejections(), "undefined" != typeof process && process.on && process.removeListener("exit", logUnhandledReasons), 
        trackUnhandledRejections = !1;
    }, resetUnhandledRejections(), Q.reject = reject, Q.fulfill = fulfill, Q.master = master, 
    Q.spread = spread, Promise.prototype.spread = function(fulfilled, rejected) {
        return this.all().then(function(array) {
            return fulfilled.apply(void 0, array);
        }, rejected);
    }, Q.async = async, Q.spawn = spawn, Q["return"] = _return, Q.promised = promised, 
    Q.dispatch = dispatch, Promise.prototype.dispatch = function(op, args) {
        var self = this, deferred = defer();
        return nextTick(function() {
            self.promiseDispatch(deferred.resolve, op, args);
        }), deferred.promise;
    }, Q.get = function(object, key) {
        return Q(object).dispatch("get", [ key ]);
    }, Promise.prototype.get = function(key) {
        return this.dispatch("get", [ key ]);
    }, Q.set = function(object, key, value) {
        return Q(object).dispatch("set", [ key, value ]);
    }, Promise.prototype.set = function(key, value) {
        return this.dispatch("set", [ key, value ]);
    }, Q.del = Q["delete"] = function(object, key) {
        return Q(object).dispatch("delete", [ key ]);
    }, Promise.prototype.del = Promise.prototype["delete"] = function(key) {
        return this.dispatch("delete", [ key ]);
    }, Q.mapply = Q.post = function(object, name, args) {
        return Q(object).dispatch("post", [ name, args ]);
    }, Promise.prototype.mapply = Promise.prototype.post = function(name, args) {
        return this.dispatch("post", [ name, args ]);
    }, Q.send = Q.mcall = Q.invoke = function(object, name) {
        return Q(object).dispatch("post", [ name, array_slice(arguments, 2) ]);
    }, Promise.prototype.send = Promise.prototype.mcall = Promise.prototype.invoke = function(name) {
        return this.dispatch("post", [ name, array_slice(arguments, 1) ]);
    }, Q.fapply = function(object, args) {
        return Q(object).dispatch("apply", [ void 0, args ]);
    }, Promise.prototype.fapply = function(args) {
        return this.dispatch("apply", [ void 0, args ]);
    }, Q["try"] = Q.fcall = function(object) {
        return Q(object).dispatch("apply", [ void 0, array_slice(arguments, 1) ]);
    }, Promise.prototype.fcall = function() {
        return this.dispatch("apply", [ void 0, array_slice(arguments) ]);
    }, Q.fbind = function(object) {
        var promise = Q(object), args = array_slice(arguments, 1);
        return function() {
            return promise.dispatch("apply", [ this, args.concat(array_slice(arguments)) ]);
        };
    }, Promise.prototype.fbind = function() {
        var promise = this, args = array_slice(arguments);
        return function() {
            return promise.dispatch("apply", [ this, args.concat(array_slice(arguments)) ]);
        };
    }, Q.keys = function(object) {
        return Q(object).dispatch("keys", []);
    }, Promise.prototype.keys = function() {
        return this.dispatch("keys", []);
    }, Q.all = all, Promise.prototype.all = function() {
        return all(this);
    }, Q.allResolved = deprecate(allResolved, "allResolved", "allSettled"), Promise.prototype.allResolved = function() {
        return allResolved(this);
    }, Q.allSettled = allSettled, Promise.prototype.allSettled = function() {
        return this.then(function(promises) {
            return all(array_map(promises, function(promise) {
                function regardless() {
                    return promise.inspect();
                }
                return promise = Q(promise), promise.then(regardless, regardless);
            }));
        });
    }, Q.fail = Q["catch"] = function(object, rejected) {
        return Q(object).then(void 0, rejected);
    }, Promise.prototype.fail = Promise.prototype["catch"] = function(rejected) {
        return this.then(void 0, rejected);
    }, Q.progress = progress, Promise.prototype.progress = function(progressed) {
        return this.then(void 0, void 0, progressed);
    }, Q.fin = Q["finally"] = function(object, callback) {
        return Q(object)["finally"](callback);
    }, Promise.prototype.fin = Promise.prototype["finally"] = function(callback) {
        return callback = Q(callback), this.then(function(value) {
            return callback.fcall().then(function() {
                return value;
            });
        }, function(reason) {
            return callback.fcall().then(function() {
                throw reason;
            });
        });
    }, Q.done = function(object, fulfilled, rejected, progress) {
        return Q(object).done(fulfilled, rejected, progress);
    }, Promise.prototype.done = function(fulfilled, rejected, progress) {
        var onUnhandledError = function(error) {
            nextTick(function() {
                if (makeStackTraceLong(error, promise), !Q.onerror) throw error;
                Q.onerror(error);
            });
        }, promise = fulfilled || rejected || progress ? this.then(fulfilled, rejected, progress) : this;
        "object" == typeof process && process && process.domain && (onUnhandledError = process.domain.bind(onUnhandledError)), 
        promise.then(void 0, onUnhandledError);
    }, Q.timeout = function(object, ms, message) {
        return Q(object).timeout(ms, message);
    }, Promise.prototype.timeout = function(ms, message) {
        var deferred = defer(), timeoutId = setTimeout(function() {
            deferred.reject(new Error(message || "Timed out after " + ms + " ms"));
        }, ms);
        return this.then(function(value) {
            clearTimeout(timeoutId), deferred.resolve(value);
        }, function(exception) {
            clearTimeout(timeoutId), deferred.reject(exception);
        }, deferred.notify), deferred.promise;
    }, Q.delay = function(object, timeout) {
        return void 0 === timeout && (timeout = object, object = void 0), Q(object).delay(timeout);
    }, Promise.prototype.delay = function(timeout) {
        return this.then(function(value) {
            var deferred = defer();
            return setTimeout(function() {
                deferred.resolve(value);
            }, timeout), deferred.promise;
        });
    }, Q.nfapply = function(callback, args) {
        return Q(callback).nfapply(args);
    }, Promise.prototype.nfapply = function(args) {
        var deferred = defer(), nodeArgs = array_slice(args);
        return nodeArgs.push(deferred.makeNodeResolver()), this.fapply(nodeArgs).fail(deferred.reject), 
        deferred.promise;
    }, Q.nfcall = function(callback) {
        var args = array_slice(arguments, 1);
        return Q(callback).nfapply(args);
    }, Promise.prototype.nfcall = function() {
        var nodeArgs = array_slice(arguments), deferred = defer();
        return nodeArgs.push(deferred.makeNodeResolver()), this.fapply(nodeArgs).fail(deferred.reject), 
        deferred.promise;
    }, Q.nfbind = Q.denodeify = function(callback) {
        var baseArgs = array_slice(arguments, 1);
        return function() {
            var nodeArgs = baseArgs.concat(array_slice(arguments)), deferred = defer();
            return nodeArgs.push(deferred.makeNodeResolver()), Q(callback).fapply(nodeArgs).fail(deferred.reject), 
            deferred.promise;
        };
    }, Promise.prototype.nfbind = Promise.prototype.denodeify = function() {
        var args = array_slice(arguments);
        return args.unshift(this), Q.denodeify.apply(void 0, args);
    }, Q.nbind = function(callback, thisp) {
        var baseArgs = array_slice(arguments, 2);
        return function() {
            function bound() {
                return callback.apply(thisp, arguments);
            }
            var nodeArgs = baseArgs.concat(array_slice(arguments)), deferred = defer();
            return nodeArgs.push(deferred.makeNodeResolver()), Q(bound).fapply(nodeArgs).fail(deferred.reject), 
            deferred.promise;
        };
    }, Promise.prototype.nbind = function() {
        var args = array_slice(arguments, 0);
        return args.unshift(this), Q.nbind.apply(void 0, args);
    }, Q.nmapply = Q.npost = function(object, name, args) {
        return Q(object).npost(name, args);
    }, Promise.prototype.nmapply = Promise.prototype.npost = function(name, args) {
        var nodeArgs = array_slice(args || []), deferred = defer();
        return nodeArgs.push(deferred.makeNodeResolver()), this.dispatch("post", [ name, nodeArgs ]).fail(deferred.reject), 
        deferred.promise;
    }, Q.nsend = Q.nmcall = Q.ninvoke = function(object, name) {
        var nodeArgs = array_slice(arguments, 2), deferred = defer();
        return nodeArgs.push(deferred.makeNodeResolver()), Q(object).dispatch("post", [ name, nodeArgs ]).fail(deferred.reject), 
        deferred.promise;
    }, Promise.prototype.nsend = Promise.prototype.nmcall = Promise.prototype.ninvoke = function(name) {
        var nodeArgs = array_slice(arguments, 1), deferred = defer();
        return nodeArgs.push(deferred.makeNodeResolver()), this.dispatch("post", [ name, nodeArgs ]).fail(deferred.reject), 
        deferred.promise;
    }, Q.nodeify = nodeify, Promise.prototype.nodeify = function(nodeback) {
        return nodeback ? (this.then(function(value) {
            nextTick(function() {
                nodeback(null, value);
            });
        }, function(error) {
            nextTick(function() {
                nodeback(error);
            });
        }), void 0) : this;
    };
    var qEndingLine = captureLine();
    return Q;
}), function(window, undefined) {
    function isArraylike(obj) {
        var length = obj.length, type = jQuery.type(obj);
        return jQuery.isWindow(obj) ? !1 : 1 === obj.nodeType && length ? !0 : "array" === type || "function" !== type && (0 === length || "number" == typeof length && length > 0 && length - 1 in obj);
    }
    function createOptions(options) {
        var object = optionsCache[options] = {};
        return jQuery.each(options.match(core_rnotwhite) || [], function(_, flag) {
            object[flag] = !0;
        }), object;
    }
    function Data() {
        Object.defineProperty(this.cache = {}, 0, {
            get: function() {
                return {};
            }
        }), this.expando = jQuery.expando + Math.random();
    }
    function dataAttr(elem, key, data) {
        var name;
        if (data === undefined && 1 === elem.nodeType) if (name = "data-" + key.replace(rmultiDash, "-$1").toLowerCase(), 
        data = elem.getAttribute(name), "string" == typeof data) {
            try {
                data = "true" === data ? !0 : "false" === data ? !1 : "null" === data ? null : +data + "" === data ? +data : rbrace.test(data) ? JSON.parse(data) : data;
            } catch (e) {}
            data_user.set(elem, key, data);
        } else data = undefined;
        return data;
    }
    function returnTrue() {
        return !0;
    }
    function returnFalse() {
        return !1;
    }
    function safeActiveElement() {
        try {
            return document.activeElement;
        } catch (err) {}
    }
    function sibling(cur, dir) {
        for (;(cur = cur[dir]) && 1 !== cur.nodeType; ) ;
        return cur;
    }
    function winnow(elements, qualifier, not) {
        if (jQuery.isFunction(qualifier)) return jQuery.grep(elements, function(elem, i) {
            return !!qualifier.call(elem, i, elem) !== not;
        });
        if (qualifier.nodeType) return jQuery.grep(elements, function(elem) {
            return elem === qualifier !== not;
        });
        if ("string" == typeof qualifier) {
            if (isSimple.test(qualifier)) return jQuery.filter(qualifier, elements, not);
            qualifier = jQuery.filter(qualifier, elements);
        }
        return jQuery.grep(elements, function(elem) {
            return core_indexOf.call(qualifier, elem) >= 0 !== not;
        });
    }
    function manipulationTarget(elem, content) {
        return jQuery.nodeName(elem, "table") && jQuery.nodeName(1 === content.nodeType ? content : content.firstChild, "tr") ? elem.getElementsByTagName("tbody")[0] || elem.appendChild(elem.ownerDocument.createElement("tbody")) : elem;
    }
    function disableScript(elem) {
        return elem.type = (null !== elem.getAttribute("type")) + "/" + elem.type, elem;
    }
    function restoreScript(elem) {
        var match = rscriptTypeMasked.exec(elem.type);
        return match ? elem.type = match[1] : elem.removeAttribute("type"), elem;
    }
    function setGlobalEval(elems, refElements) {
        for (var l = elems.length, i = 0; l > i; i++) data_priv.set(elems[i], "globalEval", !refElements || data_priv.get(refElements[i], "globalEval"));
    }
    function cloneCopyEvent(src, dest) {
        var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;
        if (1 === dest.nodeType) {
            if (data_priv.hasData(src) && (pdataOld = data_priv.access(src), pdataCur = data_priv.set(dest, pdataOld), 
            events = pdataOld.events)) {
                delete pdataCur.handle, pdataCur.events = {};
                for (type in events) for (i = 0, l = events[type].length; l > i; i++) jQuery.event.add(dest, type, events[type][i]);
            }
            data_user.hasData(src) && (udataOld = data_user.access(src), udataCur = jQuery.extend({}, udataOld), 
            data_user.set(dest, udataCur));
        }
    }
    function getAll(context, tag) {
        var ret = context.getElementsByTagName ? context.getElementsByTagName(tag || "*") : context.querySelectorAll ? context.querySelectorAll(tag || "*") : [];
        return tag === undefined || tag && jQuery.nodeName(context, tag) ? jQuery.merge([ context ], ret) : ret;
    }
    function fixInput(src, dest) {
        var nodeName = dest.nodeName.toLowerCase();
        "input" === nodeName && manipulation_rcheckableType.test(src.type) ? dest.checked = src.checked : ("input" === nodeName || "textarea" === nodeName) && (dest.defaultValue = src.defaultValue);
    }
    function vendorPropName(style, name) {
        if (name in style) return name;
        for (var capName = name.charAt(0).toUpperCase() + name.slice(1), origName = name, i = cssPrefixes.length; i--; ) if (name = cssPrefixes[i] + capName, 
        name in style) return name;
        return origName;
    }
    function isHidden(elem, el) {
        return elem = el || elem, "none" === jQuery.css(elem, "display") || !jQuery.contains(elem.ownerDocument, elem);
    }
    function getStyles(elem) {
        return window.getComputedStyle(elem, null);
    }
    function showHide(elements, show) {
        for (var display, elem, hidden, values = [], index = 0, length = elements.length; length > index; index++) elem = elements[index], 
        elem.style && (values[index] = data_priv.get(elem, "olddisplay"), display = elem.style.display, 
        show ? (values[index] || "none" !== display || (elem.style.display = ""), "" === elem.style.display && isHidden(elem) && (values[index] = data_priv.access(elem, "olddisplay", css_defaultDisplay(elem.nodeName)))) : values[index] || (hidden = isHidden(elem), 
        (display && "none" !== display || !hidden) && data_priv.set(elem, "olddisplay", hidden ? display : jQuery.css(elem, "display"))));
        for (index = 0; length > index; index++) elem = elements[index], elem.style && (show && "none" !== elem.style.display && "" !== elem.style.display || (elem.style.display = show ? values[index] || "" : "none"));
        return elements;
    }
    function setPositiveNumber(elem, value, subtract) {
        var matches = rnumsplit.exec(value);
        return matches ? Math.max(0, matches[1] - (subtract || 0)) + (matches[2] || "px") : value;
    }
    function augmentWidthOrHeight(elem, name, extra, isBorderBox, styles) {
        for (var i = extra === (isBorderBox ? "border" : "content") ? 4 : "width" === name ? 1 : 0, val = 0; 4 > i; i += 2) "margin" === extra && (val += jQuery.css(elem, extra + cssExpand[i], !0, styles)), 
        isBorderBox ? ("content" === extra && (val -= jQuery.css(elem, "padding" + cssExpand[i], !0, styles)), 
        "margin" !== extra && (val -= jQuery.css(elem, "border" + cssExpand[i] + "Width", !0, styles))) : (val += jQuery.css(elem, "padding" + cssExpand[i], !0, styles), 
        "padding" !== extra && (val += jQuery.css(elem, "border" + cssExpand[i] + "Width", !0, styles)));
        return val;
    }
    function getWidthOrHeight(elem, name, extra) {
        var valueIsBorderBox = !0, val = "width" === name ? elem.offsetWidth : elem.offsetHeight, styles = getStyles(elem), isBorderBox = jQuery.support.boxSizing && "border-box" === jQuery.css(elem, "boxSizing", !1, styles);
        if (0 >= val || null == val) {
            if (val = curCSS(elem, name, styles), (0 > val || null == val) && (val = elem.style[name]), 
            rnumnonpx.test(val)) return val;
            valueIsBorderBox = isBorderBox && (jQuery.support.boxSizingReliable || val === elem.style[name]), 
            val = parseFloat(val) || 0;
        }
        return val + augmentWidthOrHeight(elem, name, extra || (isBorderBox ? "border" : "content"), valueIsBorderBox, styles) + "px";
    }
    function css_defaultDisplay(nodeName) {
        var doc = document, display = elemdisplay[nodeName];
        return display || (display = actualDisplay(nodeName, doc), "none" !== display && display || (iframe = (iframe || jQuery("<iframe frameborder='0' width='0' height='0'/>").css("cssText", "display:block !important")).appendTo(doc.documentElement), 
        doc = (iframe[0].contentWindow || iframe[0].contentDocument).document, doc.write("<!doctype html><html><body>"), 
        doc.close(), display = actualDisplay(nodeName, doc), iframe.detach()), elemdisplay[nodeName] = display), 
        display;
    }
    function actualDisplay(name, doc) {
        var elem = jQuery(doc.createElement(name)).appendTo(doc.body), display = jQuery.css(elem[0], "display");
        return elem.remove(), display;
    }
    function buildParams(prefix, obj, traditional, add) {
        var name;
        if (jQuery.isArray(obj)) jQuery.each(obj, function(i, v) {
            traditional || rbracket.test(prefix) ? add(prefix, v) : buildParams(prefix + "[" + ("object" == typeof v ? i : "") + "]", v, traditional, add);
        }); else if (traditional || "object" !== jQuery.type(obj)) add(prefix, obj); else for (name in obj) buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
    }
    function addToPrefiltersOrTransports(structure) {
        return function(dataTypeExpression, func) {
            "string" != typeof dataTypeExpression && (func = dataTypeExpression, dataTypeExpression = "*");
            var dataType, i = 0, dataTypes = dataTypeExpression.toLowerCase().match(core_rnotwhite) || [];
            if (jQuery.isFunction(func)) for (;dataType = dataTypes[i++]; ) "+" === dataType[0] ? (dataType = dataType.slice(1) || "*", 
            (structure[dataType] = structure[dataType] || []).unshift(func)) : (structure[dataType] = structure[dataType] || []).push(func);
        };
    }
    function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {
        function inspect(dataType) {
            var selected;
            return inspected[dataType] = !0, jQuery.each(structure[dataType] || [], function(_, prefilterOrFactory) {
                var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);
                return "string" != typeof dataTypeOrTransport || seekingTransport || inspected[dataTypeOrTransport] ? seekingTransport ? !(selected = dataTypeOrTransport) : void 0 : (options.dataTypes.unshift(dataTypeOrTransport), 
                inspect(dataTypeOrTransport), !1);
            }), selected;
        }
        var inspected = {}, seekingTransport = structure === transports;
        return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");
    }
    function ajaxExtend(target, src) {
        var key, deep, flatOptions = jQuery.ajaxSettings.flatOptions || {};
        for (key in src) src[key] !== undefined && ((flatOptions[key] ? target : deep || (deep = {}))[key] = src[key]);
        return deep && jQuery.extend(!0, target, deep), target;
    }
    function ajaxHandleResponses(s, jqXHR, responses) {
        for (var ct, type, finalDataType, firstDataType, contents = s.contents, dataTypes = s.dataTypes; "*" === dataTypes[0]; ) dataTypes.shift(), 
        ct === undefined && (ct = s.mimeType || jqXHR.getResponseHeader("Content-Type"));
        if (ct) for (type in contents) if (contents[type] && contents[type].test(ct)) {
            dataTypes.unshift(type);
            break;
        }
        if (dataTypes[0] in responses) finalDataType = dataTypes[0]; else {
            for (type in responses) {
                if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
                    finalDataType = type;
                    break;
                }
                firstDataType || (firstDataType = type);
            }
            finalDataType = finalDataType || firstDataType;
        }
        return finalDataType ? (finalDataType !== dataTypes[0] && dataTypes.unshift(finalDataType), 
        responses[finalDataType]) : void 0;
    }
    function ajaxConvert(s, response, jqXHR, isSuccess) {
        var conv2, current, conv, tmp, prev, converters = {}, dataTypes = s.dataTypes.slice();
        if (dataTypes[1]) for (conv in s.converters) converters[conv.toLowerCase()] = s.converters[conv];
        for (current = dataTypes.shift(); current; ) if (s.responseFields[current] && (jqXHR[s.responseFields[current]] = response), 
        !prev && isSuccess && s.dataFilter && (response = s.dataFilter(response, s.dataType)), 
        prev = current, current = dataTypes.shift()) if ("*" === current) current = prev; else if ("*" !== prev && prev !== current) {
            if (conv = converters[prev + " " + current] || converters["* " + current], !conv) for (conv2 in converters) if (tmp = conv2.split(" "), 
            tmp[1] === current && (conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]])) {
                conv === !0 ? conv = converters[conv2] : converters[conv2] !== !0 && (current = tmp[0], 
                dataTypes.unshift(tmp[1]));
                break;
            }
            if (conv !== !0) if (conv && s["throws"]) response = conv(response); else try {
                response = conv(response);
            } catch (e) {
                return {
                    state: "parsererror",
                    error: conv ? e : "No conversion from " + prev + " to " + current
                };
            }
        }
        return {
            state: "success",
            data: response
        };
    }
    function createFxNow() {
        return setTimeout(function() {
            fxNow = undefined;
        }), fxNow = jQuery.now();
    }
    function createTween(value, prop, animation) {
        for (var tween, collection = (tweeners[prop] || []).concat(tweeners["*"]), index = 0, length = collection.length; length > index; index++) if (tween = collection[index].call(animation, prop, value)) return tween;
    }
    function Animation(elem, properties, options) {
        var result, stopped, index = 0, length = animationPrefilters.length, deferred = jQuery.Deferred().always(function() {
            delete tick.elem;
        }), tick = function() {
            if (stopped) return !1;
            for (var currentTime = fxNow || createFxNow(), remaining = Math.max(0, animation.startTime + animation.duration - currentTime), temp = remaining / animation.duration || 0, percent = 1 - temp, index = 0, length = animation.tweens.length; length > index; index++) animation.tweens[index].run(percent);
            return deferred.notifyWith(elem, [ animation, percent, remaining ]), 1 > percent && length ? remaining : (deferred.resolveWith(elem, [ animation ]), 
            !1);
        }, animation = deferred.promise({
            elem: elem,
            props: jQuery.extend({}, properties),
            opts: jQuery.extend(!0, {
                specialEasing: {}
            }, options),
            originalProperties: properties,
            originalOptions: options,
            startTime: fxNow || createFxNow(),
            duration: options.duration,
            tweens: [],
            createTween: function(prop, end) {
                var tween = jQuery.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);
                return animation.tweens.push(tween), tween;
            },
            stop: function(gotoEnd) {
                var index = 0, length = gotoEnd ? animation.tweens.length : 0;
                if (stopped) return this;
                for (stopped = !0; length > index; index++) animation.tweens[index].run(1);
                return gotoEnd ? deferred.resolveWith(elem, [ animation, gotoEnd ]) : deferred.rejectWith(elem, [ animation, gotoEnd ]), 
                this;
            }
        }), props = animation.props;
        for (propFilter(props, animation.opts.specialEasing); length > index; index++) if (result = animationPrefilters[index].call(animation, elem, props, animation.opts)) return result;
        return jQuery.map(props, createTween, animation), jQuery.isFunction(animation.opts.start) && animation.opts.start.call(elem, animation), 
        jQuery.fx.timer(jQuery.extend(tick, {
            elem: elem,
            anim: animation,
            queue: animation.opts.queue
        })), animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
    }
    function propFilter(props, specialEasing) {
        var index, name, easing, value, hooks;
        for (index in props) if (name = jQuery.camelCase(index), easing = specialEasing[name], 
        value = props[index], jQuery.isArray(value) && (easing = value[1], value = props[index] = value[0]), 
        index !== name && (props[name] = value, delete props[index]), hooks = jQuery.cssHooks[name], 
        hooks && "expand" in hooks) {
            value = hooks.expand(value), delete props[name];
            for (index in value) index in props || (props[index] = value[index], specialEasing[index] = easing);
        } else specialEasing[name] = easing;
    }
    function defaultPrefilter(elem, props, opts) {
        var prop, value, toggle, tween, hooks, oldfire, anim = this, orig = {}, style = elem.style, hidden = elem.nodeType && isHidden(elem), dataShow = data_priv.get(elem, "fxshow");
        opts.queue || (hooks = jQuery._queueHooks(elem, "fx"), null == hooks.unqueued && (hooks.unqueued = 0, 
        oldfire = hooks.empty.fire, hooks.empty.fire = function() {
            hooks.unqueued || oldfire();
        }), hooks.unqueued++, anim.always(function() {
            anim.always(function() {
                hooks.unqueued--, jQuery.queue(elem, "fx").length || hooks.empty.fire();
            });
        })), 1 === elem.nodeType && ("height" in props || "width" in props) && (opts.overflow = [ style.overflow, style.overflowX, style.overflowY ], 
        "inline" === jQuery.css(elem, "display") && "none" === jQuery.css(elem, "float") && (style.display = "inline-block")), 
        opts.overflow && (style.overflow = "hidden", anim.always(function() {
            style.overflow = opts.overflow[0], style.overflowX = opts.overflow[1], style.overflowY = opts.overflow[2];
        }));
        for (prop in props) if (value = props[prop], rfxtypes.exec(value)) {
            if (delete props[prop], toggle = toggle || "toggle" === value, value === (hidden ? "hide" : "show")) {
                if ("show" !== value || !dataShow || dataShow[prop] === undefined) continue;
                hidden = !0;
            }
            orig[prop] = dataShow && dataShow[prop] || jQuery.style(elem, prop);
        }
        if (!jQuery.isEmptyObject(orig)) {
            dataShow ? "hidden" in dataShow && (hidden = dataShow.hidden) : dataShow = data_priv.access(elem, "fxshow", {}), 
            toggle && (dataShow.hidden = !hidden), hidden ? jQuery(elem).show() : anim.done(function() {
                jQuery(elem).hide();
            }), anim.done(function() {
                var prop;
                data_priv.remove(elem, "fxshow");
                for (prop in orig) jQuery.style(elem, prop, orig[prop]);
            });
            for (prop in orig) tween = createTween(hidden ? dataShow[prop] : 0, prop, anim), 
            prop in dataShow || (dataShow[prop] = tween.start, hidden && (tween.end = tween.start, 
            tween.start = "width" === prop || "height" === prop ? 1 : 0));
        }
    }
    function Tween(elem, options, prop, end, easing) {
        return new Tween.prototype.init(elem, options, prop, end, easing);
    }
    function genFx(type, includeWidth) {
        var which, attrs = {
            height: type
        }, i = 0;
        for (includeWidth = includeWidth ? 1 : 0; 4 > i; i += 2 - includeWidth) which = cssExpand[i], 
        attrs["margin" + which] = attrs["padding" + which] = type;
        return includeWidth && (attrs.opacity = attrs.width = type), attrs;
    }
    function getWindow(elem) {
        return jQuery.isWindow(elem) ? elem : 9 === elem.nodeType && elem.defaultView;
    }
    var rootjQuery, readyList, core_strundefined = typeof undefined, location = window.location, document = window.document, docElem = document.documentElement, _jQuery = window.jQuery, _$ = window.$, class2type = {}, core_deletedIds = [], core_version = "2.0.3", core_concat = core_deletedIds.concat, core_push = core_deletedIds.push, core_slice = core_deletedIds.slice, core_indexOf = core_deletedIds.indexOf, core_toString = class2type.toString, core_hasOwn = class2type.hasOwnProperty, core_trim = core_version.trim, jQuery = function(selector, context) {
        return new jQuery.fn.init(selector, context, rootjQuery);
    }, core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source, core_rnotwhite = /\S+/g, rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/, rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/, rmsPrefix = /^-ms-/, rdashAlpha = /-([\da-z])/gi, fcamelCase = function(all, letter) {
        return letter.toUpperCase();
    }, completed = function() {
        document.removeEventListener("DOMContentLoaded", completed, !1), window.removeEventListener("load", completed, !1), 
        jQuery.ready();
    };
    jQuery.fn = jQuery.prototype = {
        jquery: core_version,
        constructor: jQuery,
        init: function(selector, context, rootjQuery) {
            var match, elem;
            if (!selector) return this;
            if ("string" == typeof selector) {
                if (match = "<" === selector.charAt(0) && ">" === selector.charAt(selector.length - 1) && selector.length >= 3 ? [ null, selector, null ] : rquickExpr.exec(selector), 
                !match || !match[1] && context) return !context || context.jquery ? (context || rootjQuery).find(selector) : this.constructor(context).find(selector);
                if (match[1]) {
                    if (context = context instanceof jQuery ? context[0] : context, jQuery.merge(this, jQuery.parseHTML(match[1], context && context.nodeType ? context.ownerDocument || context : document, !0)), 
                    rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) for (match in context) jQuery.isFunction(this[match]) ? this[match](context[match]) : this.attr(match, context[match]);
                    return this;
                }
                return elem = document.getElementById(match[2]), elem && elem.parentNode && (this.length = 1, 
                this[0] = elem), this.context = document, this.selector = selector, this;
            }
            return selector.nodeType ? (this.context = this[0] = selector, this.length = 1, 
            this) : jQuery.isFunction(selector) ? rootjQuery.ready(selector) : (selector.selector !== undefined && (this.selector = selector.selector, 
            this.context = selector.context), jQuery.makeArray(selector, this));
        },
        selector: "",
        length: 0,
        toArray: function() {
            return core_slice.call(this);
        },
        get: function(num) {
            return null == num ? this.toArray() : 0 > num ? this[this.length + num] : this[num];
        },
        pushStack: function(elems) {
            var ret = jQuery.merge(this.constructor(), elems);
            return ret.prevObject = this, ret.context = this.context, ret;
        },
        each: function(callback, args) {
            return jQuery.each(this, callback, args);
        },
        ready: function(fn) {
            return jQuery.ready.promise().done(fn), this;
        },
        slice: function() {
            return this.pushStack(core_slice.apply(this, arguments));
        },
        first: function() {
            return this.eq(0);
        },
        last: function() {
            return this.eq(-1);
        },
        eq: function(i) {
            var len = this.length, j = +i + (0 > i ? len : 0);
            return this.pushStack(j >= 0 && len > j ? [ this[j] ] : []);
        },
        map: function(callback) {
            return this.pushStack(jQuery.map(this, function(elem, i) {
                return callback.call(elem, i, elem);
            }));
        },
        end: function() {
            return this.prevObject || this.constructor(null);
        },
        push: core_push,
        sort: [].sort,
        splice: [].splice
    }, jQuery.fn.init.prototype = jQuery.fn, jQuery.extend = jQuery.fn.extend = function() {
        var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = !1;
        for ("boolean" == typeof target && (deep = target, target = arguments[1] || {}, 
        i = 2), "object" == typeof target || jQuery.isFunction(target) || (target = {}), 
        length === i && (target = this, --i); length > i; i++) if (null != (options = arguments[i])) for (name in options) src = target[name], 
        copy = options[name], target !== copy && (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy))) ? (copyIsArray ? (copyIsArray = !1, 
        clone = src && jQuery.isArray(src) ? src : []) : clone = src && jQuery.isPlainObject(src) ? src : {}, 
        target[name] = jQuery.extend(deep, clone, copy)) : copy !== undefined && (target[name] = copy));
        return target;
    }, jQuery.extend({
        expando: "jQuery" + (core_version + Math.random()).replace(/\D/g, ""),
        noConflict: function(deep) {
            return window.$ === jQuery && (window.$ = _$), deep && window.jQuery === jQuery && (window.jQuery = _jQuery), 
            jQuery;
        },
        isReady: !1,
        readyWait: 1,
        holdReady: function(hold) {
            hold ? jQuery.readyWait++ : jQuery.ready(!0);
        },
        ready: function(wait) {
            (wait === !0 ? --jQuery.readyWait : jQuery.isReady) || (jQuery.isReady = !0, wait !== !0 && --jQuery.readyWait > 0 || (readyList.resolveWith(document, [ jQuery ]), 
            jQuery.fn.trigger && jQuery(document).trigger("ready").off("ready")));
        },
        isFunction: function(obj) {
            return "function" === jQuery.type(obj);
        },
        isArray: Array.isArray,
        isWindow: function(obj) {
            return null != obj && obj === obj.window;
        },
        isNumeric: function(obj) {
            return !isNaN(parseFloat(obj)) && isFinite(obj);
        },
        type: function(obj) {
            return null == obj ? String(obj) : "object" == typeof obj || "function" == typeof obj ? class2type[core_toString.call(obj)] || "object" : typeof obj;
        },
        isPlainObject: function(obj) {
            if ("object" !== jQuery.type(obj) || obj.nodeType || jQuery.isWindow(obj)) return !1;
            try {
                if (obj.constructor && !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) return !1;
            } catch (e) {
                return !1;
            }
            return !0;
        },
        isEmptyObject: function(obj) {
            var name;
            for (name in obj) return !1;
            return !0;
        },
        error: function(msg) {
            throw new Error(msg);
        },
        parseHTML: function(data, context, keepScripts) {
            if (!data || "string" != typeof data) return null;
            "boolean" == typeof context && (keepScripts = context, context = !1), context = context || document;
            var parsed = rsingleTag.exec(data), scripts = !keepScripts && [];
            return parsed ? [ context.createElement(parsed[1]) ] : (parsed = jQuery.buildFragment([ data ], context, scripts), 
            scripts && jQuery(scripts).remove(), jQuery.merge([], parsed.childNodes));
        },
        parseJSON: JSON.parse,
        parseXML: function(data) {
            var xml, tmp;
            if (!data || "string" != typeof data) return null;
            try {
                tmp = new DOMParser(), xml = tmp.parseFromString(data, "text/xml");
            } catch (e) {
                xml = undefined;
            }
            return (!xml || xml.getElementsByTagName("parsererror").length) && jQuery.error("Invalid XML: " + data), 
            xml;
        },
        noop: function() {},
        globalEval: function(code) {
            var script, indirect = eval;
            code = jQuery.trim(code), code && (1 === code.indexOf("use strict") ? (script = document.createElement("script"), 
            script.text = code, document.head.appendChild(script).parentNode.removeChild(script)) : indirect(code));
        },
        camelCase: function(string) {
            return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
        },
        nodeName: function(elem, name) {
            return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
        },
        each: function(obj, callback, args) {
            var value, i = 0, length = obj.length, isArray = isArraylike(obj);
            if (args) {
                if (isArray) for (;length > i && (value = callback.apply(obj[i], args), value !== !1); i++) ; else for (i in obj) if (value = callback.apply(obj[i], args), 
                value === !1) break;
            } else if (isArray) for (;length > i && (value = callback.call(obj[i], i, obj[i]), 
            value !== !1); i++) ; else for (i in obj) if (value = callback.call(obj[i], i, obj[i]), 
            value === !1) break;
            return obj;
        },
        trim: function(text) {
            return null == text ? "" : core_trim.call(text);
        },
        makeArray: function(arr, results) {
            var ret = results || [];
            return null != arr && (isArraylike(Object(arr)) ? jQuery.merge(ret, "string" == typeof arr ? [ arr ] : arr) : core_push.call(ret, arr)), 
            ret;
        },
        inArray: function(elem, arr, i) {
            return null == arr ? -1 : core_indexOf.call(arr, elem, i);
        },
        merge: function(first, second) {
            var l = second.length, i = first.length, j = 0;
            if ("number" == typeof l) for (;l > j; j++) first[i++] = second[j]; else for (;second[j] !== undefined; ) first[i++] = second[j++];
            return first.length = i, first;
        },
        grep: function(elems, callback, inv) {
            var retVal, ret = [], i = 0, length = elems.length;
            for (inv = !!inv; length > i; i++) retVal = !!callback(elems[i], i), inv !== retVal && ret.push(elems[i]);
            return ret;
        },
        map: function(elems, callback, arg) {
            var value, i = 0, length = elems.length, isArray = isArraylike(elems), ret = [];
            if (isArray) for (;length > i; i++) value = callback(elems[i], i, arg), null != value && (ret[ret.length] = value); else for (i in elems) value = callback(elems[i], i, arg), 
            null != value && (ret[ret.length] = value);
            return core_concat.apply([], ret);
        },
        guid: 1,
        proxy: function(fn, context) {
            var tmp, args, proxy;
            return "string" == typeof context && (tmp = fn[context], context = fn, fn = tmp), 
            jQuery.isFunction(fn) ? (args = core_slice.call(arguments, 2), proxy = function() {
                return fn.apply(context || this, args.concat(core_slice.call(arguments)));
            }, proxy.guid = fn.guid = fn.guid || jQuery.guid++, proxy) : undefined;
        },
        access: function(elems, fn, key, value, chainable, emptyGet, raw) {
            var i = 0, length = elems.length, bulk = null == key;
            if ("object" === jQuery.type(key)) {
                chainable = !0;
                for (i in key) jQuery.access(elems, fn, i, key[i], !0, emptyGet, raw);
            } else if (value !== undefined && (chainable = !0, jQuery.isFunction(value) || (raw = !0), 
            bulk && (raw ? (fn.call(elems, value), fn = null) : (bulk = fn, fn = function(elem, key, value) {
                return bulk.call(jQuery(elem), value);
            })), fn)) for (;length > i; i++) fn(elems[i], key, raw ? value : value.call(elems[i], i, fn(elems[i], key)));
            return chainable ? elems : bulk ? fn.call(elems) : length ? fn(elems[0], key) : emptyGet;
        },
        now: Date.now,
        swap: function(elem, options, callback, args) {
            var ret, name, old = {};
            for (name in options) old[name] = elem.style[name], elem.style[name] = options[name];
            ret = callback.apply(elem, args || []);
            for (name in options) elem.style[name] = old[name];
            return ret;
        }
    }), jQuery.ready.promise = function(obj) {
        return readyList || (readyList = jQuery.Deferred(), "complete" === document.readyState ? setTimeout(jQuery.ready) : (document.addEventListener("DOMContentLoaded", completed, !1), 
        window.addEventListener("load", completed, !1))), readyList.promise(obj);
    }, jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
        class2type["[object " + name + "]"] = name.toLowerCase();
    }), rootjQuery = jQuery(document), function(window, undefined) {
        function Sizzle(selector, context, results, seed) {
            var match, elem, m, nodeType, i, groups, old, nid, newContext, newSelector;
            if ((context ? context.ownerDocument || context : preferredDoc) !== document && setDocument(context), 
            context = context || document, results = results || [], !selector || "string" != typeof selector) return results;
            if (1 !== (nodeType = context.nodeType) && 9 !== nodeType) return [];
            if (documentIsHTML && !seed) {
                if (match = rquickExpr.exec(selector)) if (m = match[1]) {
                    if (9 === nodeType) {
                        if (elem = context.getElementById(m), !elem || !elem.parentNode) return results;
                        if (elem.id === m) return results.push(elem), results;
                    } else if (context.ownerDocument && (elem = context.ownerDocument.getElementById(m)) && contains(context, elem) && elem.id === m) return results.push(elem), 
                    results;
                } else {
                    if (match[2]) return push.apply(results, context.getElementsByTagName(selector)), 
                    results;
                    if ((m = match[3]) && support.getElementsByClassName && context.getElementsByClassName) return push.apply(results, context.getElementsByClassName(m)), 
                    results;
                }
                if (support.qsa && (!rbuggyQSA || !rbuggyQSA.test(selector))) {
                    if (nid = old = expando, newContext = context, newSelector = 9 === nodeType && selector, 
                    1 === nodeType && "object" !== context.nodeName.toLowerCase()) {
                        for (groups = tokenize(selector), (old = context.getAttribute("id")) ? nid = old.replace(rescape, "\\$&") : context.setAttribute("id", nid), 
                        nid = "[id='" + nid + "'] ", i = groups.length; i--; ) groups[i] = nid + toSelector(groups[i]);
                        newContext = rsibling.test(selector) && context.parentNode || context, newSelector = groups.join(",");
                    }
                    if (newSelector) try {
                        return push.apply(results, newContext.querySelectorAll(newSelector)), results;
                    } catch (qsaError) {} finally {
                        old || context.removeAttribute("id");
                    }
                }
            }
            return select(selector.replace(rtrim, "$1"), context, results, seed);
        }
        function createCache() {
            function cache(key, value) {
                return keys.push(key += " ") > Expr.cacheLength && delete cache[keys.shift()], cache[key] = value;
            }
            var keys = [];
            return cache;
        }
        function markFunction(fn) {
            return fn[expando] = !0, fn;
        }
        function assert(fn) {
            var div = document.createElement("div");
            try {
                return !!fn(div);
            } catch (e) {
                return !1;
            } finally {
                div.parentNode && div.parentNode.removeChild(div), div = null;
            }
        }
        function addHandle(attrs, handler) {
            for (var arr = attrs.split("|"), i = attrs.length; i--; ) Expr.attrHandle[arr[i]] = handler;
        }
        function siblingCheck(a, b) {
            var cur = b && a, diff = cur && 1 === a.nodeType && 1 === b.nodeType && (~b.sourceIndex || MAX_NEGATIVE) - (~a.sourceIndex || MAX_NEGATIVE);
            if (diff) return diff;
            if (cur) for (;cur = cur.nextSibling; ) if (cur === b) return -1;
            return a ? 1 : -1;
        }
        function createInputPseudo(type) {
            return function(elem) {
                var name = elem.nodeName.toLowerCase();
                return "input" === name && elem.type === type;
            };
        }
        function createButtonPseudo(type) {
            return function(elem) {
                var name = elem.nodeName.toLowerCase();
                return ("input" === name || "button" === name) && elem.type === type;
            };
        }
        function createPositionalPseudo(fn) {
            return markFunction(function(argument) {
                return argument = +argument, markFunction(function(seed, matches) {
                    for (var j, matchIndexes = fn([], seed.length, argument), i = matchIndexes.length; i--; ) seed[j = matchIndexes[i]] && (seed[j] = !(matches[j] = seed[j]));
                });
            });
        }
        function setFilters() {}
        function tokenize(selector, parseOnly) {
            var matched, match, tokens, type, soFar, groups, preFilters, cached = tokenCache[selector + " "];
            if (cached) return parseOnly ? 0 : cached.slice(0);
            for (soFar = selector, groups = [], preFilters = Expr.preFilter; soFar; ) {
                (!matched || (match = rcomma.exec(soFar))) && (match && (soFar = soFar.slice(match[0].length) || soFar), 
                groups.push(tokens = [])), matched = !1, (match = rcombinators.exec(soFar)) && (matched = match.shift(), 
                tokens.push({
                    value: matched,
                    type: match[0].replace(rtrim, " ")
                }), soFar = soFar.slice(matched.length));
                for (type in Expr.filter) !(match = matchExpr[type].exec(soFar)) || preFilters[type] && !(match = preFilters[type](match)) || (matched = match.shift(), 
                tokens.push({
                    value: matched,
                    type: type,
                    matches: match
                }), soFar = soFar.slice(matched.length));
                if (!matched) break;
            }
            return parseOnly ? soFar.length : soFar ? Sizzle.error(selector) : tokenCache(selector, groups).slice(0);
        }
        function toSelector(tokens) {
            for (var i = 0, len = tokens.length, selector = ""; len > i; i++) selector += tokens[i].value;
            return selector;
        }
        function addCombinator(matcher, combinator, base) {
            var dir = combinator.dir, checkNonElements = base && "parentNode" === dir, doneName = done++;
            return combinator.first ? function(elem, context, xml) {
                for (;elem = elem[dir]; ) if (1 === elem.nodeType || checkNonElements) return matcher(elem, context, xml);
            } : function(elem, context, xml) {
                var data, cache, outerCache, dirkey = dirruns + " " + doneName;
                if (xml) {
                    for (;elem = elem[dir]; ) if ((1 === elem.nodeType || checkNonElements) && matcher(elem, context, xml)) return !0;
                } else for (;elem = elem[dir]; ) if (1 === elem.nodeType || checkNonElements) if (outerCache = elem[expando] || (elem[expando] = {}), 
                (cache = outerCache[dir]) && cache[0] === dirkey) {
                    if ((data = cache[1]) === !0 || data === cachedruns) return data === !0;
                } else if (cache = outerCache[dir] = [ dirkey ], cache[1] = matcher(elem, context, xml) || cachedruns, 
                cache[1] === !0) return !0;
            };
        }
        function elementMatcher(matchers) {
            return matchers.length > 1 ? function(elem, context, xml) {
                for (var i = matchers.length; i--; ) if (!matchers[i](elem, context, xml)) return !1;
                return !0;
            } : matchers[0];
        }
        function condense(unmatched, map, filter, context, xml) {
            for (var elem, newUnmatched = [], i = 0, len = unmatched.length, mapped = null != map; len > i; i++) (elem = unmatched[i]) && (!filter || filter(elem, context, xml)) && (newUnmatched.push(elem), 
            mapped && map.push(i));
            return newUnmatched;
        }
        function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
            return postFilter && !postFilter[expando] && (postFilter = setMatcher(postFilter)), 
            postFinder && !postFinder[expando] && (postFinder = setMatcher(postFinder, postSelector)), 
            markFunction(function(seed, results, context, xml) {
                var temp, i, elem, preMap = [], postMap = [], preexisting = results.length, elems = seed || multipleContexts(selector || "*", context.nodeType ? [ context ] : context, []), matcherIn = !preFilter || !seed && selector ? elems : condense(elems, preMap, preFilter, context, xml), matcherOut = matcher ? postFinder || (seed ? preFilter : preexisting || postFilter) ? [] : results : matcherIn;
                if (matcher && matcher(matcherIn, matcherOut, context, xml), postFilter) for (temp = condense(matcherOut, postMap), 
                postFilter(temp, [], context, xml), i = temp.length; i--; ) (elem = temp[i]) && (matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem));
                if (seed) {
                    if (postFinder || preFilter) {
                        if (postFinder) {
                            for (temp = [], i = matcherOut.length; i--; ) (elem = matcherOut[i]) && temp.push(matcherIn[i] = elem);
                            postFinder(null, matcherOut = [], temp, xml);
                        }
                        for (i = matcherOut.length; i--; ) (elem = matcherOut[i]) && (temp = postFinder ? indexOf.call(seed, elem) : preMap[i]) > -1 && (seed[temp] = !(results[temp] = elem));
                    }
                } else matcherOut = condense(matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut), 
                postFinder ? postFinder(null, results, matcherOut, xml) : push.apply(results, matcherOut);
            });
        }
        function matcherFromTokens(tokens) {
            for (var checkContext, matcher, j, len = tokens.length, leadingRelative = Expr.relative[tokens[0].type], implicitRelative = leadingRelative || Expr.relative[" "], i = leadingRelative ? 1 : 0, matchContext = addCombinator(function(elem) {
                return elem === checkContext;
            }, implicitRelative, !0), matchAnyContext = addCombinator(function(elem) {
                return indexOf.call(checkContext, elem) > -1;
            }, implicitRelative, !0), matchers = [ function(elem, context, xml) {
                return !leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
            } ]; len > i; i++) if (matcher = Expr.relative[tokens[i].type]) matchers = [ addCombinator(elementMatcher(matchers), matcher) ]; else {
                if (matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches), matcher[expando]) {
                    for (j = ++i; len > j && !Expr.relative[tokens[j].type]; j++) ;
                    return setMatcher(i > 1 && elementMatcher(matchers), i > 1 && toSelector(tokens.slice(0, i - 1).concat({
                        value: " " === tokens[i - 2].type ? "*" : ""
                    })).replace(rtrim, "$1"), matcher, j > i && matcherFromTokens(tokens.slice(i, j)), len > j && matcherFromTokens(tokens = tokens.slice(j)), len > j && toSelector(tokens));
                }
                matchers.push(matcher);
            }
            return elementMatcher(matchers);
        }
        function matcherFromGroupMatchers(elementMatchers, setMatchers) {
            var matcherCachedRuns = 0, bySet = setMatchers.length > 0, byElement = elementMatchers.length > 0, superMatcher = function(seed, context, xml, results, expandContext) {
                var elem, j, matcher, setMatched = [], matchedCount = 0, i = "0", unmatched = seed && [], outermost = null != expandContext, contextBackup = outermostContext, elems = seed || byElement && Expr.find.TAG("*", expandContext && context.parentNode || context), dirrunsUnique = dirruns += null == contextBackup ? 1 : Math.random() || .1;
                for (outermost && (outermostContext = context !== document && context, cachedruns = matcherCachedRuns); null != (elem = elems[i]); i++) {
                    if (byElement && elem) {
                        for (j = 0; matcher = elementMatchers[j++]; ) if (matcher(elem, context, xml)) {
                            results.push(elem);
                            break;
                        }
                        outermost && (dirruns = dirrunsUnique, cachedruns = ++matcherCachedRuns);
                    }
                    bySet && ((elem = !matcher && elem) && matchedCount--, seed && unmatched.push(elem));
                }
                if (matchedCount += i, bySet && i !== matchedCount) {
                    for (j = 0; matcher = setMatchers[j++]; ) matcher(unmatched, setMatched, context, xml);
                    if (seed) {
                        if (matchedCount > 0) for (;i--; ) unmatched[i] || setMatched[i] || (setMatched[i] = pop.call(results));
                        setMatched = condense(setMatched);
                    }
                    push.apply(results, setMatched), outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1 && Sizzle.uniqueSort(results);
                }
                return outermost && (dirruns = dirrunsUnique, outermostContext = contextBackup), 
                unmatched;
            };
            return bySet ? markFunction(superMatcher) : superMatcher;
        }
        function multipleContexts(selector, contexts, results) {
            for (var i = 0, len = contexts.length; len > i; i++) Sizzle(selector, contexts[i], results);
            return results;
        }
        function select(selector, context, results, seed) {
            var i, tokens, token, type, find, match = tokenize(selector);
            if (!seed && 1 === match.length) {
                if (tokens = match[0] = match[0].slice(0), tokens.length > 2 && "ID" === (token = tokens[0]).type && support.getById && 9 === context.nodeType && documentIsHTML && Expr.relative[tokens[1].type]) {
                    if (context = (Expr.find.ID(token.matches[0].replace(runescape, funescape), context) || [])[0], 
                    !context) return results;
                    selector = selector.slice(tokens.shift().value.length);
                }
                for (i = matchExpr.needsContext.test(selector) ? 0 : tokens.length; i-- && (token = tokens[i], 
                !Expr.relative[type = token.type]); ) if ((find = Expr.find[type]) && (seed = find(token.matches[0].replace(runescape, funescape), rsibling.test(tokens[0].type) && context.parentNode || context))) {
                    if (tokens.splice(i, 1), selector = seed.length && toSelector(tokens), !selector) return push.apply(results, seed), 
                    results;
                    break;
                }
            }
            return compile(selector, match)(seed, context, !documentIsHTML, results, rsibling.test(selector)), 
            results;
        }
        var i, support, cachedruns, Expr, getText, isXML, compile, outermostContext, sortInput, setDocument, document, docElem, documentIsHTML, rbuggyQSA, rbuggyMatches, matches, contains, expando = "sizzle" + -new Date(), preferredDoc = window.document, dirruns = 0, done = 0, classCache = createCache(), tokenCache = createCache(), compilerCache = createCache(), hasDuplicate = !1, sortOrder = function(a, b) {
            return a === b ? (hasDuplicate = !0, 0) : 0;
        }, strundefined = typeof undefined, MAX_NEGATIVE = 1 << 31, hasOwn = {}.hasOwnProperty, arr = [], pop = arr.pop, push_native = arr.push, push = arr.push, slice = arr.slice, indexOf = arr.indexOf || function(elem) {
            for (var i = 0, len = this.length; len > i; i++) if (this[i] === elem) return i;
            return -1;
        }, booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", whitespace = "[\\x20\\t\\r\\n\\f]", characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+", identifier = characterEncoding.replace("w", "w#"), attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace + "*(?:([*^$|!~]?=)" + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]", pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace(3, 8) + ")*)|.*)\\)|)", rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"), rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"), rcombinators = new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"), rsibling = new RegExp(whitespace + "*[+~]"), rattributeQuotes = new RegExp("=" + whitespace + "*([^\\]'\"]*)" + whitespace + "*\\]", "g"), rpseudo = new RegExp(pseudos), ridentifier = new RegExp("^" + identifier + "$"), matchExpr = {
            ID: new RegExp("^#(" + characterEncoding + ")"),
            CLASS: new RegExp("^\\.(" + characterEncoding + ")"),
            TAG: new RegExp("^(" + characterEncoding.replace("w", "w*") + ")"),
            ATTR: new RegExp("^" + attributes),
            PSEUDO: new RegExp("^" + pseudos),
            CHILD: new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i"),
            bool: new RegExp("^(?:" + booleans + ")$", "i"),
            needsContext: new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
        }, rnative = /^[^{]+\{\s*\[native \w/, rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, rinputs = /^(?:input|select|textarea|button)$/i, rheader = /^h\d$/i, rescape = /'|\\/g, runescape = new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig"), funescape = function(_, escaped, escapedWhitespace) {
            var high = "0x" + escaped - 65536;
            return high !== high || escapedWhitespace ? escaped : 0 > high ? String.fromCharCode(high + 65536) : String.fromCharCode(high >> 10 | 55296, 1023 & high | 56320);
        };
        try {
            push.apply(arr = slice.call(preferredDoc.childNodes), preferredDoc.childNodes), 
            arr[preferredDoc.childNodes.length].nodeType;
        } catch (e) {
            push = {
                apply: arr.length ? function(target, els) {
                    push_native.apply(target, slice.call(els));
                } : function(target, els) {
                    for (var j = target.length, i = 0; target[j++] = els[i++]; ) ;
                    target.length = j - 1;
                }
            };
        }
        isXML = Sizzle.isXML = function(elem) {
            var documentElement = elem && (elem.ownerDocument || elem).documentElement;
            return documentElement ? "HTML" !== documentElement.nodeName : !1;
        }, support = Sizzle.support = {}, setDocument = Sizzle.setDocument = function(node) {
            var doc = node ? node.ownerDocument || node : preferredDoc, parent = doc.defaultView;
            return doc !== document && 9 === doc.nodeType && doc.documentElement ? (document = doc, 
            docElem = doc.documentElement, documentIsHTML = !isXML(doc), parent && parent.attachEvent && parent !== parent.top && parent.attachEvent("onbeforeunload", function() {
                setDocument();
            }), support.attributes = assert(function(div) {
                return div.className = "i", !div.getAttribute("className");
            }), support.getElementsByTagName = assert(function(div) {
                return div.appendChild(doc.createComment("")), !div.getElementsByTagName("*").length;
            }), support.getElementsByClassName = assert(function(div) {
                return div.innerHTML = "<div class='a'></div><div class='a i'></div>", div.firstChild.className = "i", 
                2 === div.getElementsByClassName("i").length;
            }), support.getById = assert(function(div) {
                return docElem.appendChild(div).id = expando, !doc.getElementsByName || !doc.getElementsByName(expando).length;
            }), support.getById ? (Expr.find.ID = function(id, context) {
                if (typeof context.getElementById !== strundefined && documentIsHTML) {
                    var m = context.getElementById(id);
                    return m && m.parentNode ? [ m ] : [];
                }
            }, Expr.filter.ID = function(id) {
                var attrId = id.replace(runescape, funescape);
                return function(elem) {
                    return elem.getAttribute("id") === attrId;
                };
            }) : (delete Expr.find.ID, Expr.filter.ID = function(id) {
                var attrId = id.replace(runescape, funescape);
                return function(elem) {
                    var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
                    return node && node.value === attrId;
                };
            }), Expr.find.TAG = support.getElementsByTagName ? function(tag, context) {
                return typeof context.getElementsByTagName !== strundefined ? context.getElementsByTagName(tag) : void 0;
            } : function(tag, context) {
                var elem, tmp = [], i = 0, results = context.getElementsByTagName(tag);
                if ("*" === tag) {
                    for (;elem = results[i++]; ) 1 === elem.nodeType && tmp.push(elem);
                    return tmp;
                }
                return results;
            }, Expr.find.CLASS = support.getElementsByClassName && function(className, context) {
                return typeof context.getElementsByClassName !== strundefined && documentIsHTML ? context.getElementsByClassName(className) : void 0;
            }, rbuggyMatches = [], rbuggyQSA = [], (support.qsa = rnative.test(doc.querySelectorAll)) && (assert(function(div) {
                div.innerHTML = "<select><option selected=''></option></select>", div.querySelectorAll("[selected]").length || rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")"), 
                div.querySelectorAll(":checked").length || rbuggyQSA.push(":checked");
            }), assert(function(div) {
                var input = doc.createElement("input");
                input.setAttribute("type", "hidden"), div.appendChild(input).setAttribute("t", ""), 
                div.querySelectorAll("[t^='']").length && rbuggyQSA.push("[*^$]=" + whitespace + "*(?:''|\"\")"), 
                div.querySelectorAll(":enabled").length || rbuggyQSA.push(":enabled", ":disabled"), 
                div.querySelectorAll("*,:x"), rbuggyQSA.push(",.*:");
            })), (support.matchesSelector = rnative.test(matches = docElem.webkitMatchesSelector || docElem.mozMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector)) && assert(function(div) {
                support.disconnectedMatch = matches.call(div, "div"), matches.call(div, "[s!='']:x"), 
                rbuggyMatches.push("!=", pseudos);
            }), rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|")), rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join("|")), 
            contains = rnative.test(docElem.contains) || docElem.compareDocumentPosition ? function(a, b) {
                var adown = 9 === a.nodeType ? a.documentElement : a, bup = b && b.parentNode;
                return a === bup || !(!bup || 1 !== bup.nodeType || !(adown.contains ? adown.contains(bup) : a.compareDocumentPosition && 16 & a.compareDocumentPosition(bup)));
            } : function(a, b) {
                if (b) for (;b = b.parentNode; ) if (b === a) return !0;
                return !1;
            }, sortOrder = docElem.compareDocumentPosition ? function(a, b) {
                if (a === b) return hasDuplicate = !0, 0;
                var compare = b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition(b);
                return compare ? 1 & compare || !support.sortDetached && b.compareDocumentPosition(a) === compare ? a === doc || contains(preferredDoc, a) ? -1 : b === doc || contains(preferredDoc, b) ? 1 : sortInput ? indexOf.call(sortInput, a) - indexOf.call(sortInput, b) : 0 : 4 & compare ? -1 : 1 : a.compareDocumentPosition ? -1 : 1;
            } : function(a, b) {
                var cur, i = 0, aup = a.parentNode, bup = b.parentNode, ap = [ a ], bp = [ b ];
                if (a === b) return hasDuplicate = !0, 0;
                if (!aup || !bup) return a === doc ? -1 : b === doc ? 1 : aup ? -1 : bup ? 1 : sortInput ? indexOf.call(sortInput, a) - indexOf.call(sortInput, b) : 0;
                if (aup === bup) return siblingCheck(a, b);
                for (cur = a; cur = cur.parentNode; ) ap.unshift(cur);
                for (cur = b; cur = cur.parentNode; ) bp.unshift(cur);
                for (;ap[i] === bp[i]; ) i++;
                return i ? siblingCheck(ap[i], bp[i]) : ap[i] === preferredDoc ? -1 : bp[i] === preferredDoc ? 1 : 0;
            }, doc) : document;
        }, Sizzle.matches = function(expr, elements) {
            return Sizzle(expr, null, null, elements);
        }, Sizzle.matchesSelector = function(elem, expr) {
            if ((elem.ownerDocument || elem) !== document && setDocument(elem), expr = expr.replace(rattributeQuotes, "='$1']"), 
            !(!support.matchesSelector || !documentIsHTML || rbuggyMatches && rbuggyMatches.test(expr) || rbuggyQSA && rbuggyQSA.test(expr))) try {
                var ret = matches.call(elem, expr);
                if (ret || support.disconnectedMatch || elem.document && 11 !== elem.document.nodeType) return ret;
            } catch (e) {}
            return Sizzle(expr, document, null, [ elem ]).length > 0;
        }, Sizzle.contains = function(context, elem) {
            return (context.ownerDocument || context) !== document && setDocument(context), 
            contains(context, elem);
        }, Sizzle.attr = function(elem, name) {
            (elem.ownerDocument || elem) !== document && setDocument(elem);
            var fn = Expr.attrHandle[name.toLowerCase()], val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn(elem, name, !documentIsHTML) : undefined;
            return val === undefined ? support.attributes || !documentIsHTML ? elem.getAttribute(name) : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null : val;
        }, Sizzle.error = function(msg) {
            throw new Error("Syntax error, unrecognized expression: " + msg);
        }, Sizzle.uniqueSort = function(results) {
            var elem, duplicates = [], j = 0, i = 0;
            if (hasDuplicate = !support.detectDuplicates, sortInput = !support.sortStable && results.slice(0), 
            results.sort(sortOrder), hasDuplicate) {
                for (;elem = results[i++]; ) elem === results[i] && (j = duplicates.push(i));
                for (;j--; ) results.splice(duplicates[j], 1);
            }
            return results;
        }, getText = Sizzle.getText = function(elem) {
            var node, ret = "", i = 0, nodeType = elem.nodeType;
            if (nodeType) {
                if (1 === nodeType || 9 === nodeType || 11 === nodeType) {
                    if ("string" == typeof elem.textContent) return elem.textContent;
                    for (elem = elem.firstChild; elem; elem = elem.nextSibling) ret += getText(elem);
                } else if (3 === nodeType || 4 === nodeType) return elem.nodeValue;
            } else for (;node = elem[i]; i++) ret += getText(node);
            return ret;
        }, Expr = Sizzle.selectors = {
            cacheLength: 50,
            createPseudo: markFunction,
            match: matchExpr,
            attrHandle: {},
            find: {},
            relative: {
                ">": {
                    dir: "parentNode",
                    first: !0
                },
                " ": {
                    dir: "parentNode"
                },
                "+": {
                    dir: "previousSibling",
                    first: !0
                },
                "~": {
                    dir: "previousSibling"
                }
            },
            preFilter: {
                ATTR: function(match) {
                    return match[1] = match[1].replace(runescape, funescape), match[3] = (match[4] || match[5] || "").replace(runescape, funescape), 
                    "~=" === match[2] && (match[3] = " " + match[3] + " "), match.slice(0, 4);
                },
                CHILD: function(match) {
                    return match[1] = match[1].toLowerCase(), "nth" === match[1].slice(0, 3) ? (match[3] || Sizzle.error(match[0]), 
                    match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * ("even" === match[3] || "odd" === match[3])), 
                    match[5] = +(match[7] + match[8] || "odd" === match[3])) : match[3] && Sizzle.error(match[0]), 
                    match;
                },
                PSEUDO: function(match) {
                    var excess, unquoted = !match[5] && match[2];
                    return matchExpr.CHILD.test(match[0]) ? null : (match[3] && match[4] !== undefined ? match[2] = match[4] : unquoted && rpseudo.test(unquoted) && (excess = tokenize(unquoted, !0)) && (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length) && (match[0] = match[0].slice(0, excess), 
                    match[2] = unquoted.slice(0, excess)), match.slice(0, 3));
                }
            },
            filter: {
                TAG: function(nodeNameSelector) {
                    var nodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
                    return "*" === nodeNameSelector ? function() {
                        return !0;
                    } : function(elem) {
                        return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
                    };
                },
                CLASS: function(className) {
                    var pattern = classCache[className + " "];
                    return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function(elem) {
                        return pattern.test("string" == typeof elem.className && elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "");
                    });
                },
                ATTR: function(name, operator, check) {
                    return function(elem) {
                        var result = Sizzle.attr(elem, name);
                        return null == result ? "!=" === operator : operator ? (result += "", "=" === operator ? result === check : "!=" === operator ? result !== check : "^=" === operator ? check && 0 === result.indexOf(check) : "*=" === operator ? check && result.indexOf(check) > -1 : "$=" === operator ? check && result.slice(-check.length) === check : "~=" === operator ? (" " + result + " ").indexOf(check) > -1 : "|=" === operator ? result === check || result.slice(0, check.length + 1) === check + "-" : !1) : !0;
                    };
                },
                CHILD: function(type, what, argument, first, last) {
                    var simple = "nth" !== type.slice(0, 3), forward = "last" !== type.slice(-4), ofType = "of-type" === what;
                    return 1 === first && 0 === last ? function(elem) {
                        return !!elem.parentNode;
                    } : function(elem, context, xml) {
                        var cache, outerCache, node, diff, nodeIndex, start, dir = simple !== forward ? "nextSibling" : "previousSibling", parent = elem.parentNode, name = ofType && elem.nodeName.toLowerCase(), useCache = !xml && !ofType;
                        if (parent) {
                            if (simple) {
                                for (;dir; ) {
                                    for (node = elem; node = node[dir]; ) if (ofType ? node.nodeName.toLowerCase() === name : 1 === node.nodeType) return !1;
                                    start = dir = "only" === type && !start && "nextSibling";
                                }
                                return !0;
                            }
                            if (start = [ forward ? parent.firstChild : parent.lastChild ], forward && useCache) {
                                for (outerCache = parent[expando] || (parent[expando] = {}), cache = outerCache[type] || [], 
                                nodeIndex = cache[0] === dirruns && cache[1], diff = cache[0] === dirruns && cache[2], 
                                node = nodeIndex && parent.childNodes[nodeIndex]; node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop(); ) if (1 === node.nodeType && ++diff && node === elem) {
                                    outerCache[type] = [ dirruns, nodeIndex, diff ];
                                    break;
                                }
                            } else if (useCache && (cache = (elem[expando] || (elem[expando] = {}))[type]) && cache[0] === dirruns) diff = cache[1]; else for (;(node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) && ((ofType ? node.nodeName.toLowerCase() !== name : 1 !== node.nodeType) || !++diff || (useCache && ((node[expando] || (node[expando] = {}))[type] = [ dirruns, diff ]), 
                            node !== elem)); ) ;
                            return diff -= last, diff === first || diff % first === 0 && diff / first >= 0;
                        }
                    };
                },
                PSEUDO: function(pseudo, argument) {
                    var args, fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo);
                    return fn[expando] ? fn(argument) : fn.length > 1 ? (args = [ pseudo, pseudo, "", argument ], 
                    Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function(seed, matches) {
                        for (var idx, matched = fn(seed, argument), i = matched.length; i--; ) idx = indexOf.call(seed, matched[i]), 
                        seed[idx] = !(matches[idx] = matched[i]);
                    }) : function(elem) {
                        return fn(elem, 0, args);
                    }) : fn;
                }
            },
            pseudos: {
                not: markFunction(function(selector) {
                    var input = [], results = [], matcher = compile(selector.replace(rtrim, "$1"));
                    return matcher[expando] ? markFunction(function(seed, matches, context, xml) {
                        for (var elem, unmatched = matcher(seed, null, xml, []), i = seed.length; i--; ) (elem = unmatched[i]) && (seed[i] = !(matches[i] = elem));
                    }) : function(elem, context, xml) {
                        return input[0] = elem, matcher(input, null, xml, results), !results.pop();
                    };
                }),
                has: markFunction(function(selector) {
                    return function(elem) {
                        return Sizzle(selector, elem).length > 0;
                    };
                }),
                contains: markFunction(function(text) {
                    return function(elem) {
                        return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1;
                    };
                }),
                lang: markFunction(function(lang) {
                    return ridentifier.test(lang || "") || Sizzle.error("unsupported lang: " + lang), 
                    lang = lang.replace(runescape, funescape).toLowerCase(), function(elem) {
                        var elemLang;
                        do if (elemLang = documentIsHTML ? elem.lang : elem.getAttribute("xml:lang") || elem.getAttribute("lang")) return elemLang = elemLang.toLowerCase(), 
                        elemLang === lang || 0 === elemLang.indexOf(lang + "-"); while ((elem = elem.parentNode) && 1 === elem.nodeType);
                        return !1;
                    };
                }),
                target: function(elem) {
                    var hash = window.location && window.location.hash;
                    return hash && hash.slice(1) === elem.id;
                },
                root: function(elem) {
                    return elem === docElem;
                },
                focus: function(elem) {
                    return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
                },
                enabled: function(elem) {
                    return elem.disabled === !1;
                },
                disabled: function(elem) {
                    return elem.disabled === !0;
                },
                checked: function(elem) {
                    var nodeName = elem.nodeName.toLowerCase();
                    return "input" === nodeName && !!elem.checked || "option" === nodeName && !!elem.selected;
                },
                selected: function(elem) {
                    return elem.parentNode && elem.parentNode.selectedIndex, elem.selected === !0;
                },
                empty: function(elem) {
                    for (elem = elem.firstChild; elem; elem = elem.nextSibling) if (elem.nodeName > "@" || 3 === elem.nodeType || 4 === elem.nodeType) return !1;
                    return !0;
                },
                parent: function(elem) {
                    return !Expr.pseudos.empty(elem);
                },
                header: function(elem) {
                    return rheader.test(elem.nodeName);
                },
                input: function(elem) {
                    return rinputs.test(elem.nodeName);
                },
                button: function(elem) {
                    var name = elem.nodeName.toLowerCase();
                    return "input" === name && "button" === elem.type || "button" === name;
                },
                text: function(elem) {
                    var attr;
                    return "input" === elem.nodeName.toLowerCase() && "text" === elem.type && (null == (attr = elem.getAttribute("type")) || attr.toLowerCase() === elem.type);
                },
                first: createPositionalPseudo(function() {
                    return [ 0 ];
                }),
                last: createPositionalPseudo(function(matchIndexes, length) {
                    return [ length - 1 ];
                }),
                eq: createPositionalPseudo(function(matchIndexes, length, argument) {
                    return [ 0 > argument ? argument + length : argument ];
                }),
                even: createPositionalPseudo(function(matchIndexes, length) {
                    for (var i = 0; length > i; i += 2) matchIndexes.push(i);
                    return matchIndexes;
                }),
                odd: createPositionalPseudo(function(matchIndexes, length) {
                    for (var i = 1; length > i; i += 2) matchIndexes.push(i);
                    return matchIndexes;
                }),
                lt: createPositionalPseudo(function(matchIndexes, length, argument) {
                    for (var i = 0 > argument ? argument + length : argument; --i >= 0; ) matchIndexes.push(i);
                    return matchIndexes;
                }),
                gt: createPositionalPseudo(function(matchIndexes, length, argument) {
                    for (var i = 0 > argument ? argument + length : argument; ++i < length; ) matchIndexes.push(i);
                    return matchIndexes;
                })
            }
        }, Expr.pseudos.nth = Expr.pseudos.eq;
        for (i in {
            radio: !0,
            checkbox: !0,
            file: !0,
            password: !0,
            image: !0
        }) Expr.pseudos[i] = createInputPseudo(i);
        for (i in {
            submit: !0,
            reset: !0
        }) Expr.pseudos[i] = createButtonPseudo(i);
        setFilters.prototype = Expr.filters = Expr.pseudos, Expr.setFilters = new setFilters(), 
        compile = Sizzle.compile = function(selector, group) {
            var i, setMatchers = [], elementMatchers = [], cached = compilerCache[selector + " "];
            if (!cached) {
                for (group || (group = tokenize(selector)), i = group.length; i--; ) cached = matcherFromTokens(group[i]), 
                cached[expando] ? setMatchers.push(cached) : elementMatchers.push(cached);
                cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers));
            }
            return cached;
        }, support.sortStable = expando.split("").sort(sortOrder).join("") === expando, 
        support.detectDuplicates = hasDuplicate, setDocument(), support.sortDetached = assert(function(div1) {
            return 1 & div1.compareDocumentPosition(document.createElement("div"));
        }), assert(function(div) {
            return div.innerHTML = "<a href='#'></a>", "#" === div.firstChild.getAttribute("href");
        }) || addHandle("type|href|height|width", function(elem, name, isXML) {
            return isXML ? void 0 : elem.getAttribute(name, "type" === name.toLowerCase() ? 1 : 2);
        }), support.attributes && assert(function(div) {
            return div.innerHTML = "<input/>", div.firstChild.setAttribute("value", ""), "" === div.firstChild.getAttribute("value");
        }) || addHandle("value", function(elem, name, isXML) {
            return isXML || "input" !== elem.nodeName.toLowerCase() ? void 0 : elem.defaultValue;
        }), assert(function(div) {
            return null == div.getAttribute("disabled");
        }) || addHandle(booleans, function(elem, name, isXML) {
            var val;
            return isXML ? void 0 : (val = elem.getAttributeNode(name)) && val.specified ? val.value : elem[name] === !0 ? name.toLowerCase() : null;
        }), jQuery.find = Sizzle, jQuery.expr = Sizzle.selectors, jQuery.expr[":"] = jQuery.expr.pseudos, 
        jQuery.unique = Sizzle.uniqueSort, jQuery.text = Sizzle.getText, jQuery.isXMLDoc = Sizzle.isXML, 
        jQuery.contains = Sizzle.contains;
    }(window);
    var optionsCache = {};
    jQuery.Callbacks = function(options) {
        options = "string" == typeof options ? optionsCache[options] || createOptions(options) : jQuery.extend({}, options);
        var memory, fired, firing, firingStart, firingLength, firingIndex, list = [], stack = !options.once && [], fire = function(data) {
            for (memory = options.memory && data, fired = !0, firingIndex = firingStart || 0, 
            firingStart = 0, firingLength = list.length, firing = !0; list && firingLength > firingIndex; firingIndex++) if (list[firingIndex].apply(data[0], data[1]) === !1 && options.stopOnFalse) {
                memory = !1;
                break;
            }
            firing = !1, list && (stack ? stack.length && fire(stack.shift()) : memory ? list = [] : self.disable());
        }, self = {
            add: function() {
                if (list) {
                    var start = list.length;
                    !function add(args) {
                        jQuery.each(args, function(_, arg) {
                            var type = jQuery.type(arg);
                            "function" === type ? options.unique && self.has(arg) || list.push(arg) : arg && arg.length && "string" !== type && add(arg);
                        });
                    }(arguments), firing ? firingLength = list.length : memory && (firingStart = start, 
                    fire(memory));
                }
                return this;
            },
            remove: function() {
                return list && jQuery.each(arguments, function(_, arg) {
                    for (var index; (index = jQuery.inArray(arg, list, index)) > -1; ) list.splice(index, 1), 
                    firing && (firingLength >= index && firingLength--, firingIndex >= index && firingIndex--);
                }), this;
            },
            has: function(fn) {
                return fn ? jQuery.inArray(fn, list) > -1 : !(!list || !list.length);
            },
            empty: function() {
                return list = [], firingLength = 0, this;
            },
            disable: function() {
                return list = stack = memory = undefined, this;
            },
            disabled: function() {
                return !list;
            },
            lock: function() {
                return stack = undefined, memory || self.disable(), this;
            },
            locked: function() {
                return !stack;
            },
            fireWith: function(context, args) {
                return !list || fired && !stack || (args = args || [], args = [ context, args.slice ? args.slice() : args ], 
                firing ? stack.push(args) : fire(args)), this;
            },
            fire: function() {
                return self.fireWith(this, arguments), this;
            },
            fired: function() {
                return !!fired;
            }
        };
        return self;
    }, jQuery.extend({
        Deferred: function(func) {
            var tuples = [ [ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ], [ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ], [ "notify", "progress", jQuery.Callbacks("memory") ] ], state = "pending", promise = {
                state: function() {
                    return state;
                },
                always: function() {
                    return deferred.done(arguments).fail(arguments), this;
                },
                then: function() {
                    var fns = arguments;
                    return jQuery.Deferred(function(newDefer) {
                        jQuery.each(tuples, function(i, tuple) {
                            var action = tuple[0], fn = jQuery.isFunction(fns[i]) && fns[i];
                            deferred[tuple[1]](function() {
                                var returned = fn && fn.apply(this, arguments);
                                returned && jQuery.isFunction(returned.promise) ? returned.promise().done(newDefer.resolve).fail(newDefer.reject).progress(newDefer.notify) : newDefer[action + "With"](this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments);
                            });
                        }), fns = null;
                    }).promise();
                },
                promise: function(obj) {
                    return null != obj ? jQuery.extend(obj, promise) : promise;
                }
            }, deferred = {};
            return promise.pipe = promise.then, jQuery.each(tuples, function(i, tuple) {
                var list = tuple[2], stateString = tuple[3];
                promise[tuple[1]] = list.add, stateString && list.add(function() {
                    state = stateString;
                }, tuples[1 ^ i][2].disable, tuples[2][2].lock), deferred[tuple[0]] = function() {
                    return deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments), 
                    this;
                }, deferred[tuple[0] + "With"] = list.fireWith;
            }), promise.promise(deferred), func && func.call(deferred, deferred), deferred;
        },
        when: function(subordinate) {
            var progressValues, progressContexts, resolveContexts, i = 0, resolveValues = core_slice.call(arguments), length = resolveValues.length, remaining = 1 !== length || subordinate && jQuery.isFunction(subordinate.promise) ? length : 0, deferred = 1 === remaining ? subordinate : jQuery.Deferred(), updateFunc = function(i, contexts, values) {
                return function(value) {
                    contexts[i] = this, values[i] = arguments.length > 1 ? core_slice.call(arguments) : value, 
                    values === progressValues ? deferred.notifyWith(contexts, values) : --remaining || deferred.resolveWith(contexts, values);
                };
            };
            if (length > 1) for (progressValues = new Array(length), progressContexts = new Array(length), 
            resolveContexts = new Array(length); length > i; i++) resolveValues[i] && jQuery.isFunction(resolveValues[i].promise) ? resolveValues[i].promise().done(updateFunc(i, resolveContexts, resolveValues)).fail(deferred.reject).progress(updateFunc(i, progressContexts, progressValues)) : --remaining;
            return remaining || deferred.resolveWith(resolveContexts, resolveValues), deferred.promise();
        }
    }), jQuery.support = function(support) {
        var input = document.createElement("input"), fragment = document.createDocumentFragment(), div = document.createElement("div"), select = document.createElement("select"), opt = select.appendChild(document.createElement("option"));
        return input.type ? (input.type = "checkbox", support.checkOn = "" !== input.value, 
        support.optSelected = opt.selected, support.reliableMarginRight = !0, support.boxSizingReliable = !0, 
        support.pixelPosition = !1, input.checked = !0, support.noCloneChecked = input.cloneNode(!0).checked, 
        select.disabled = !0, support.optDisabled = !opt.disabled, input = document.createElement("input"), 
        input.value = "t", input.type = "radio", support.radioValue = "t" === input.value, 
        input.setAttribute("checked", "t"), input.setAttribute("name", "t"), fragment.appendChild(input), 
        support.checkClone = fragment.cloneNode(!0).cloneNode(!0).lastChild.checked, support.focusinBubbles = "onfocusin" in window, 
        div.style.backgroundClip = "content-box", div.cloneNode(!0).style.backgroundClip = "", 
        support.clearCloneStyle = "content-box" === div.style.backgroundClip, jQuery(function() {
            var container, marginDiv, divReset = "padding:0;margin:0;border:0;display:block;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box", body = document.getElementsByTagName("body")[0];
            body && (container = document.createElement("div"), container.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px", 
            body.appendChild(container).appendChild(div), div.innerHTML = "", div.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%", 
            jQuery.swap(body, null != body.style.zoom ? {
                zoom: 1
            } : {}, function() {
                support.boxSizing = 4 === div.offsetWidth;
            }), window.getComputedStyle && (support.pixelPosition = "1%" !== (window.getComputedStyle(div, null) || {}).top, 
            support.boxSizingReliable = "4px" === (window.getComputedStyle(div, null) || {
                width: "4px"
            }).width, marginDiv = div.appendChild(document.createElement("div")), marginDiv.style.cssText = div.style.cssText = divReset, 
            marginDiv.style.marginRight = marginDiv.style.width = "0", div.style.width = "1px", 
            support.reliableMarginRight = !parseFloat((window.getComputedStyle(marginDiv, null) || {}).marginRight)), 
            body.removeChild(container));
        }), support) : support;
    }({});
    var data_user, data_priv, rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/, rmultiDash = /([A-Z])/g;
    Data.uid = 1, Data.accepts = function(owner) {
        return owner.nodeType ? 1 === owner.nodeType || 9 === owner.nodeType : !0;
    }, Data.prototype = {
        key: function(owner) {
            if (!Data.accepts(owner)) return 0;
            var descriptor = {}, unlock = owner[this.expando];
            if (!unlock) {
                unlock = Data.uid++;
                try {
                    descriptor[this.expando] = {
                        value: unlock
                    }, Object.defineProperties(owner, descriptor);
                } catch (e) {
                    descriptor[this.expando] = unlock, jQuery.extend(owner, descriptor);
                }
            }
            return this.cache[unlock] || (this.cache[unlock] = {}), unlock;
        },
        set: function(owner, data, value) {
            var prop, unlock = this.key(owner), cache = this.cache[unlock];
            if ("string" == typeof data) cache[data] = value; else if (jQuery.isEmptyObject(cache)) jQuery.extend(this.cache[unlock], data); else for (prop in data) cache[prop] = data[prop];
            return cache;
        },
        get: function(owner, key) {
            var cache = this.cache[this.key(owner)];
            return key === undefined ? cache : cache[key];
        },
        access: function(owner, key, value) {
            var stored;
            return key === undefined || key && "string" == typeof key && value === undefined ? (stored = this.get(owner, key), 
            stored !== undefined ? stored : this.get(owner, jQuery.camelCase(key))) : (this.set(owner, key, value), 
            value !== undefined ? value : key);
        },
        remove: function(owner, key) {
            var i, name, camel, unlock = this.key(owner), cache = this.cache[unlock];
            if (key === undefined) this.cache[unlock] = {}; else {
                jQuery.isArray(key) ? name = key.concat(key.map(jQuery.camelCase)) : (camel = jQuery.camelCase(key), 
                key in cache ? name = [ key, camel ] : (name = camel, name = name in cache ? [ name ] : name.match(core_rnotwhite) || [])), 
                i = name.length;
                for (;i--; ) delete cache[name[i]];
            }
        },
        hasData: function(owner) {
            return !jQuery.isEmptyObject(this.cache[owner[this.expando]] || {});
        },
        discard: function(owner) {
            owner[this.expando] && delete this.cache[owner[this.expando]];
        }
    }, data_user = new Data(), data_priv = new Data(), jQuery.extend({
        acceptData: Data.accepts,
        hasData: function(elem) {
            return data_user.hasData(elem) || data_priv.hasData(elem);
        },
        data: function(elem, name, data) {
            return data_user.access(elem, name, data);
        },
        removeData: function(elem, name) {
            data_user.remove(elem, name);
        },
        _data: function(elem, name, data) {
            return data_priv.access(elem, name, data);
        },
        _removeData: function(elem, name) {
            data_priv.remove(elem, name);
        }
    }), jQuery.fn.extend({
        data: function(key, value) {
            var attrs, name, elem = this[0], i = 0, data = null;
            if (key === undefined) {
                if (this.length && (data = data_user.get(elem), 1 === elem.nodeType && !data_priv.get(elem, "hasDataAttrs"))) {
                    for (attrs = elem.attributes; i < attrs.length; i++) name = attrs[i].name, 0 === name.indexOf("data-") && (name = jQuery.camelCase(name.slice(5)), 
                    dataAttr(elem, name, data[name]));
                    data_priv.set(elem, "hasDataAttrs", !0);
                }
                return data;
            }
            return "object" == typeof key ? this.each(function() {
                data_user.set(this, key);
            }) : jQuery.access(this, function(value) {
                var data, camelKey = jQuery.camelCase(key);
                if (elem && value === undefined) {
                    if (data = data_user.get(elem, key), data !== undefined) return data;
                    if (data = data_user.get(elem, camelKey), data !== undefined) return data;
                    if (data = dataAttr(elem, camelKey, undefined), data !== undefined) return data;
                } else this.each(function() {
                    var data = data_user.get(this, camelKey);
                    data_user.set(this, camelKey, value), -1 !== key.indexOf("-") && data !== undefined && data_user.set(this, key, value);
                });
            }, null, value, arguments.length > 1, null, !0);
        },
        removeData: function(key) {
            return this.each(function() {
                data_user.remove(this, key);
            });
        }
    }), jQuery.extend({
        queue: function(elem, type, data) {
            var queue;
            return elem ? (type = (type || "fx") + "queue", queue = data_priv.get(elem, type), 
            data && (!queue || jQuery.isArray(data) ? queue = data_priv.access(elem, type, jQuery.makeArray(data)) : queue.push(data)), 
            queue || []) : void 0;
        },
        dequeue: function(elem, type) {
            type = type || "fx";
            var queue = jQuery.queue(elem, type), startLength = queue.length, fn = queue.shift(), hooks = jQuery._queueHooks(elem, type), next = function() {
                jQuery.dequeue(elem, type);
            };
            "inprogress" === fn && (fn = queue.shift(), startLength--), fn && ("fx" === type && queue.unshift("inprogress"), 
            delete hooks.stop, fn.call(elem, next, hooks)), !startLength && hooks && hooks.empty.fire();
        },
        _queueHooks: function(elem, type) {
            var key = type + "queueHooks";
            return data_priv.get(elem, key) || data_priv.access(elem, key, {
                empty: jQuery.Callbacks("once memory").add(function() {
                    data_priv.remove(elem, [ type + "queue", key ]);
                })
            });
        }
    }), jQuery.fn.extend({
        queue: function(type, data) {
            var setter = 2;
            return "string" != typeof type && (data = type, type = "fx", setter--), arguments.length < setter ? jQuery.queue(this[0], type) : data === undefined ? this : this.each(function() {
                var queue = jQuery.queue(this, type, data);
                jQuery._queueHooks(this, type), "fx" === type && "inprogress" !== queue[0] && jQuery.dequeue(this, type);
            });
        },
        dequeue: function(type) {
            return this.each(function() {
                jQuery.dequeue(this, type);
            });
        },
        delay: function(time, type) {
            return time = jQuery.fx ? jQuery.fx.speeds[time] || time : time, type = type || "fx", 
            this.queue(type, function(next, hooks) {
                var timeout = setTimeout(next, time);
                hooks.stop = function() {
                    clearTimeout(timeout);
                };
            });
        },
        clearQueue: function(type) {
            return this.queue(type || "fx", []);
        },
        promise: function(type, obj) {
            var tmp, count = 1, defer = jQuery.Deferred(), elements = this, i = this.length, resolve = function() {
                --count || defer.resolveWith(elements, [ elements ]);
            };
            for ("string" != typeof type && (obj = type, type = undefined), type = type || "fx"; i--; ) tmp = data_priv.get(elements[i], type + "queueHooks"), 
            tmp && tmp.empty && (count++, tmp.empty.add(resolve));
            return resolve(), defer.promise(obj);
        }
    });
    var nodeHook, boolHook, rclass = /[\t\r\n\f]/g, rreturn = /\r/g, rfocusable = /^(?:input|select|textarea|button)$/i;
    jQuery.fn.extend({
        attr: function(name, value) {
            return jQuery.access(this, jQuery.attr, name, value, arguments.length > 1);
        },
        removeAttr: function(name) {
            return this.each(function() {
                jQuery.removeAttr(this, name);
            });
        },
        prop: function(name, value) {
            return jQuery.access(this, jQuery.prop, name, value, arguments.length > 1);
        },
        removeProp: function(name) {
            return this.each(function() {
                delete this[jQuery.propFix[name] || name];
            });
        },
        addClass: function(value) {
            var classes, elem, cur, clazz, j, i = 0, len = this.length, proceed = "string" == typeof value && value;
            if (jQuery.isFunction(value)) return this.each(function(j) {
                jQuery(this).addClass(value.call(this, j, this.className));
            });
            if (proceed) for (classes = (value || "").match(core_rnotwhite) || []; len > i; i++) if (elem = this[i], 
            cur = 1 === elem.nodeType && (elem.className ? (" " + elem.className + " ").replace(rclass, " ") : " ")) {
                for (j = 0; clazz = classes[j++]; ) cur.indexOf(" " + clazz + " ") < 0 && (cur += clazz + " ");
                elem.className = jQuery.trim(cur);
            }
            return this;
        },
        removeClass: function(value) {
            var classes, elem, cur, clazz, j, i = 0, len = this.length, proceed = 0 === arguments.length || "string" == typeof value && value;
            if (jQuery.isFunction(value)) return this.each(function(j) {
                jQuery(this).removeClass(value.call(this, j, this.className));
            });
            if (proceed) for (classes = (value || "").match(core_rnotwhite) || []; len > i; i++) if (elem = this[i], 
            cur = 1 === elem.nodeType && (elem.className ? (" " + elem.className + " ").replace(rclass, " ") : "")) {
                for (j = 0; clazz = classes[j++]; ) for (;cur.indexOf(" " + clazz + " ") >= 0; ) cur = cur.replace(" " + clazz + " ", " ");
                elem.className = value ? jQuery.trim(cur) : "";
            }
            return this;
        },
        toggleClass: function(value, stateVal) {
            var type = typeof value;
            return "boolean" == typeof stateVal && "string" === type ? stateVal ? this.addClass(value) : this.removeClass(value) : jQuery.isFunction(value) ? this.each(function(i) {
                jQuery(this).toggleClass(value.call(this, i, this.className, stateVal), stateVal);
            }) : this.each(function() {
                if ("string" === type) for (var className, i = 0, self = jQuery(this), classNames = value.match(core_rnotwhite) || []; className = classNames[i++]; ) self.hasClass(className) ? self.removeClass(className) : self.addClass(className); else (type === core_strundefined || "boolean" === type) && (this.className && data_priv.set(this, "__className__", this.className), 
                this.className = this.className || value === !1 ? "" : data_priv.get(this, "__className__") || "");
            });
        },
        hasClass: function(selector) {
            for (var className = " " + selector + " ", i = 0, l = this.length; l > i; i++) if (1 === this[i].nodeType && (" " + this[i].className + " ").replace(rclass, " ").indexOf(className) >= 0) return !0;
            return !1;
        },
        val: function(value) {
            var hooks, ret, isFunction, elem = this[0];
            {
                if (arguments.length) return isFunction = jQuery.isFunction(value), this.each(function(i) {
                    var val;
                    1 === this.nodeType && (val = isFunction ? value.call(this, i, jQuery(this).val()) : value, 
                    null == val ? val = "" : "number" == typeof val ? val += "" : jQuery.isArray(val) && (val = jQuery.map(val, function(value) {
                        return null == value ? "" : value + "";
                    })), hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()], 
                    hooks && "set" in hooks && hooks.set(this, val, "value") !== undefined || (this.value = val));
                });
                if (elem) return hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()], 
                hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== undefined ? ret : (ret = elem.value, 
                "string" == typeof ret ? ret.replace(rreturn, "") : null == ret ? "" : ret);
            }
        }
    }), jQuery.extend({
        valHooks: {
            option: {
                get: function(elem) {
                    var val = elem.attributes.value;
                    return !val || val.specified ? elem.value : elem.text;
                }
            },
            select: {
                get: function(elem) {
                    for (var value, option, options = elem.options, index = elem.selectedIndex, one = "select-one" === elem.type || 0 > index, values = one ? null : [], max = one ? index + 1 : options.length, i = 0 > index ? max : one ? index : 0; max > i; i++) if (option = options[i], 
                    !(!option.selected && i !== index || (jQuery.support.optDisabled ? option.disabled : null !== option.getAttribute("disabled")) || option.parentNode.disabled && jQuery.nodeName(option.parentNode, "optgroup"))) {
                        if (value = jQuery(option).val(), one) return value;
                        values.push(value);
                    }
                    return values;
                },
                set: function(elem, value) {
                    for (var optionSet, option, options = elem.options, values = jQuery.makeArray(value), i = options.length; i--; ) option = options[i], 
                    (option.selected = jQuery.inArray(jQuery(option).val(), values) >= 0) && (optionSet = !0);
                    return optionSet || (elem.selectedIndex = -1), values;
                }
            }
        },
        attr: function(elem, name, value) {
            var hooks, ret, nType = elem.nodeType;
            if (elem && 3 !== nType && 8 !== nType && 2 !== nType) return typeof elem.getAttribute === core_strundefined ? jQuery.prop(elem, name, value) : (1 === nType && jQuery.isXMLDoc(elem) || (name = name.toLowerCase(), 
            hooks = jQuery.attrHooks[name] || (jQuery.expr.match.bool.test(name) ? boolHook : nodeHook)), 
            value === undefined ? hooks && "get" in hooks && null !== (ret = hooks.get(elem, name)) ? ret : (ret = jQuery.find.attr(elem, name), 
            null == ret ? undefined : ret) : null !== value ? hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined ? ret : (elem.setAttribute(name, value + ""), 
            value) : (jQuery.removeAttr(elem, name), void 0));
        },
        removeAttr: function(elem, value) {
            var name, propName, i = 0, attrNames = value && value.match(core_rnotwhite);
            if (attrNames && 1 === elem.nodeType) for (;name = attrNames[i++]; ) propName = jQuery.propFix[name] || name, 
            jQuery.expr.match.bool.test(name) && (elem[propName] = !1), elem.removeAttribute(name);
        },
        attrHooks: {
            type: {
                set: function(elem, value) {
                    if (!jQuery.support.radioValue && "radio" === value && jQuery.nodeName(elem, "input")) {
                        var val = elem.value;
                        return elem.setAttribute("type", value), val && (elem.value = val), value;
                    }
                }
            }
        },
        propFix: {
            "for": "htmlFor",
            "class": "className"
        },
        prop: function(elem, name, value) {
            var ret, hooks, notxml, nType = elem.nodeType;
            if (elem && 3 !== nType && 8 !== nType && 2 !== nType) return notxml = 1 !== nType || !jQuery.isXMLDoc(elem), 
            notxml && (name = jQuery.propFix[name] || name, hooks = jQuery.propHooks[name]), 
            value !== undefined ? hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined ? ret : elem[name] = value : hooks && "get" in hooks && null !== (ret = hooks.get(elem, name)) ? ret : elem[name];
        },
        propHooks: {
            tabIndex: {
                get: function(elem) {
                    return elem.hasAttribute("tabindex") || rfocusable.test(elem.nodeName) || elem.href ? elem.tabIndex : -1;
                }
            }
        }
    }), boolHook = {
        set: function(elem, value, name) {
            return value === !1 ? jQuery.removeAttr(elem, name) : elem.setAttribute(name, name), 
            name;
        }
    }, jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g), function(i, name) {
        var getter = jQuery.expr.attrHandle[name] || jQuery.find.attr;
        jQuery.expr.attrHandle[name] = function(elem, name, isXML) {
            var fn = jQuery.expr.attrHandle[name], ret = isXML ? undefined : (jQuery.expr.attrHandle[name] = undefined) != getter(elem, name, isXML) ? name.toLowerCase() : null;
            return jQuery.expr.attrHandle[name] = fn, ret;
        };
    }), jQuery.support.optSelected || (jQuery.propHooks.selected = {
        get: function(elem) {
            var parent = elem.parentNode;
            return parent && parent.parentNode && parent.parentNode.selectedIndex, null;
        }
    }), jQuery.each([ "tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable" ], function() {
        jQuery.propFix[this.toLowerCase()] = this;
    }), jQuery.each([ "radio", "checkbox" ], function() {
        jQuery.valHooks[this] = {
            set: function(elem, value) {
                return jQuery.isArray(value) ? elem.checked = jQuery.inArray(jQuery(elem).val(), value) >= 0 : void 0;
            }
        }, jQuery.support.checkOn || (jQuery.valHooks[this].get = function(elem) {
            return null === elem.getAttribute("value") ? "on" : elem.value;
        });
    });
    var rkeyEvent = /^key/, rmouseEvent = /^(?:mouse|contextmenu)|click/, rfocusMorph = /^(?:focusinfocus|focusoutblur)$/, rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;
    jQuery.event = {
        global: {},
        add: function(elem, types, handler, data, selector) {
            var handleObjIn, eventHandle, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = data_priv.get(elem);
            if (elemData) {
                for (handler.handler && (handleObjIn = handler, handler = handleObjIn.handler, selector = handleObjIn.selector), 
                handler.guid || (handler.guid = jQuery.guid++), (events = elemData.events) || (events = elemData.events = {}), 
                (eventHandle = elemData.handle) || (eventHandle = elemData.handle = function(e) {
                    return typeof jQuery === core_strundefined || e && jQuery.event.triggered === e.type ? undefined : jQuery.event.dispatch.apply(eventHandle.elem, arguments);
                }, eventHandle.elem = elem), types = (types || "").match(core_rnotwhite) || [ "" ], 
                t = types.length; t--; ) tmp = rtypenamespace.exec(types[t]) || [], type = origType = tmp[1], 
                namespaces = (tmp[2] || "").split(".").sort(), type && (special = jQuery.event.special[type] || {}, 
                type = (selector ? special.delegateType : special.bindType) || type, special = jQuery.event.special[type] || {}, 
                handleObj = jQuery.extend({
                    type: type,
                    origType: origType,
                    data: data,
                    handler: handler,
                    guid: handler.guid,
                    selector: selector,
                    needsContext: selector && jQuery.expr.match.needsContext.test(selector),
                    namespace: namespaces.join(".")
                }, handleObjIn), (handlers = events[type]) || (handlers = events[type] = [], handlers.delegateCount = 0, 
                special.setup && special.setup.call(elem, data, namespaces, eventHandle) !== !1 || elem.addEventListener && elem.addEventListener(type, eventHandle, !1)), 
                special.add && (special.add.call(elem, handleObj), handleObj.handler.guid || (handleObj.handler.guid = handler.guid)), 
                selector ? handlers.splice(handlers.delegateCount++, 0, handleObj) : handlers.push(handleObj), 
                jQuery.event.global[type] = !0);
                elem = null;
            }
        },
        remove: function(elem, types, handler, selector, mappedTypes) {
            var j, origCount, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = data_priv.hasData(elem) && data_priv.get(elem);
            if (elemData && (events = elemData.events)) {
                for (types = (types || "").match(core_rnotwhite) || [ "" ], t = types.length; t--; ) if (tmp = rtypenamespace.exec(types[t]) || [], 
                type = origType = tmp[1], namespaces = (tmp[2] || "").split(".").sort(), type) {
                    for (special = jQuery.event.special[type] || {}, type = (selector ? special.delegateType : special.bindType) || type, 
                    handlers = events[type] || [], tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)"), 
                    origCount = j = handlers.length; j--; ) handleObj = handlers[j], !mappedTypes && origType !== handleObj.origType || handler && handler.guid !== handleObj.guid || tmp && !tmp.test(handleObj.namespace) || selector && selector !== handleObj.selector && ("**" !== selector || !handleObj.selector) || (handlers.splice(j, 1), 
                    handleObj.selector && handlers.delegateCount--, special.remove && special.remove.call(elem, handleObj));
                    origCount && !handlers.length && (special.teardown && special.teardown.call(elem, namespaces, elemData.handle) !== !1 || jQuery.removeEvent(elem, type, elemData.handle), 
                    delete events[type]);
                } else for (type in events) jQuery.event.remove(elem, type + types[t], handler, selector, !0);
                jQuery.isEmptyObject(events) && (delete elemData.handle, data_priv.remove(elem, "events"));
            }
        },
        trigger: function(event, data, elem, onlyHandlers) {
            var i, cur, tmp, bubbleType, ontype, handle, special, eventPath = [ elem || document ], type = core_hasOwn.call(event, "type") ? event.type : event, namespaces = core_hasOwn.call(event, "namespace") ? event.namespace.split(".") : [];
            if (cur = tmp = elem = elem || document, 3 !== elem.nodeType && 8 !== elem.nodeType && !rfocusMorph.test(type + jQuery.event.triggered) && (type.indexOf(".") >= 0 && (namespaces = type.split("."), 
            type = namespaces.shift(), namespaces.sort()), ontype = type.indexOf(":") < 0 && "on" + type, 
            event = event[jQuery.expando] ? event : new jQuery.Event(type, "object" == typeof event && event), 
            event.isTrigger = onlyHandlers ? 2 : 3, event.namespace = namespaces.join("."), 
            event.namespace_re = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null, 
            event.result = undefined, event.target || (event.target = elem), data = null == data ? [ event ] : jQuery.makeArray(data, [ event ]), 
            special = jQuery.event.special[type] || {}, onlyHandlers || !special.trigger || special.trigger.apply(elem, data) !== !1)) {
                if (!onlyHandlers && !special.noBubble && !jQuery.isWindow(elem)) {
                    for (bubbleType = special.delegateType || type, rfocusMorph.test(bubbleType + type) || (cur = cur.parentNode); cur; cur = cur.parentNode) eventPath.push(cur), 
                    tmp = cur;
                    tmp === (elem.ownerDocument || document) && eventPath.push(tmp.defaultView || tmp.parentWindow || window);
                }
                for (i = 0; (cur = eventPath[i++]) && !event.isPropagationStopped(); ) event.type = i > 1 ? bubbleType : special.bindType || type, 
                handle = (data_priv.get(cur, "events") || {})[event.type] && data_priv.get(cur, "handle"), 
                handle && handle.apply(cur, data), handle = ontype && cur[ontype], handle && jQuery.acceptData(cur) && handle.apply && handle.apply(cur, data) === !1 && event.preventDefault();
                return event.type = type, onlyHandlers || event.isDefaultPrevented() || special._default && special._default.apply(eventPath.pop(), data) !== !1 || !jQuery.acceptData(elem) || ontype && jQuery.isFunction(elem[type]) && !jQuery.isWindow(elem) && (tmp = elem[ontype], 
                tmp && (elem[ontype] = null), jQuery.event.triggered = type, elem[type](), jQuery.event.triggered = undefined, 
                tmp && (elem[ontype] = tmp)), event.result;
            }
        },
        dispatch: function(event) {
            event = jQuery.event.fix(event);
            var i, j, ret, matched, handleObj, handlerQueue = [], args = core_slice.call(arguments), handlers = (data_priv.get(this, "events") || {})[event.type] || [], special = jQuery.event.special[event.type] || {};
            if (args[0] = event, event.delegateTarget = this, !special.preDispatch || special.preDispatch.call(this, event) !== !1) {
                for (handlerQueue = jQuery.event.handlers.call(this, event, handlers), i = 0; (matched = handlerQueue[i++]) && !event.isPropagationStopped(); ) for (event.currentTarget = matched.elem, 
                j = 0; (handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped(); ) (!event.namespace_re || event.namespace_re.test(handleObj.namespace)) && (event.handleObj = handleObj, 
                event.data = handleObj.data, ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args), 
                ret !== undefined && (event.result = ret) === !1 && (event.preventDefault(), event.stopPropagation()));
                return special.postDispatch && special.postDispatch.call(this, event), event.result;
            }
        },
        handlers: function(event, handlers) {
            var i, matches, sel, handleObj, handlerQueue = [], delegateCount = handlers.delegateCount, cur = event.target;
            if (delegateCount && cur.nodeType && (!event.button || "click" !== event.type)) for (;cur !== this; cur = cur.parentNode || this) if (cur.disabled !== !0 || "click" !== event.type) {
                for (matches = [], i = 0; delegateCount > i; i++) handleObj = handlers[i], sel = handleObj.selector + " ", 
                matches[sel] === undefined && (matches[sel] = handleObj.needsContext ? jQuery(sel, this).index(cur) >= 0 : jQuery.find(sel, this, null, [ cur ]).length), 
                matches[sel] && matches.push(handleObj);
                matches.length && handlerQueue.push({
                    elem: cur,
                    handlers: matches
                });
            }
            return delegateCount < handlers.length && handlerQueue.push({
                elem: this,
                handlers: handlers.slice(delegateCount)
            }), handlerQueue;
        },
        props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
        fixHooks: {},
        keyHooks: {
            props: "char charCode key keyCode".split(" "),
            filter: function(event, original) {
                return null == event.which && (event.which = null != original.charCode ? original.charCode : original.keyCode), 
                event;
            }
        },
        mouseHooks: {
            props: "button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
            filter: function(event, original) {
                var eventDoc, doc, body, button = original.button;
                return null == event.pageX && null != original.clientX && (eventDoc = event.target.ownerDocument || document, 
                doc = eventDoc.documentElement, body = eventDoc.body, event.pageX = original.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0), 
                event.pageY = original.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0)), 
                event.which || button === undefined || (event.which = 1 & button ? 1 : 2 & button ? 3 : 4 & button ? 2 : 0), 
                event;
            }
        },
        fix: function(event) {
            if (event[jQuery.expando]) return event;
            var i, prop, copy, type = event.type, originalEvent = event, fixHook = this.fixHooks[type];
            for (fixHook || (this.fixHooks[type] = fixHook = rmouseEvent.test(type) ? this.mouseHooks : rkeyEvent.test(type) ? this.keyHooks : {}), 
            copy = fixHook.props ? this.props.concat(fixHook.props) : this.props, event = new jQuery.Event(originalEvent), 
            i = copy.length; i--; ) prop = copy[i], event[prop] = originalEvent[prop];
            return event.target || (event.target = document), 3 === event.target.nodeType && (event.target = event.target.parentNode), 
            fixHook.filter ? fixHook.filter(event, originalEvent) : event;
        },
        special: {
            load: {
                noBubble: !0
            },
            focus: {
                trigger: function() {
                    return this !== safeActiveElement() && this.focus ? (this.focus(), !1) : void 0;
                },
                delegateType: "focusin"
            },
            blur: {
                trigger: function() {
                    return this === safeActiveElement() && this.blur ? (this.blur(), !1) : void 0;
                },
                delegateType: "focusout"
            },
            click: {
                trigger: function() {
                    return "checkbox" === this.type && this.click && jQuery.nodeName(this, "input") ? (this.click(), 
                    !1) : void 0;
                },
                _default: function(event) {
                    return jQuery.nodeName(event.target, "a");
                }
            },
            beforeunload: {
                postDispatch: function(event) {
                    event.result !== undefined && (event.originalEvent.returnValue = event.result);
                }
            }
        },
        simulate: function(type, elem, event, bubble) {
            var e = jQuery.extend(new jQuery.Event(), event, {
                type: type,
                isSimulated: !0,
                originalEvent: {}
            });
            bubble ? jQuery.event.trigger(e, null, elem) : jQuery.event.dispatch.call(elem, e), 
            e.isDefaultPrevented() && event.preventDefault();
        }
    }, jQuery.removeEvent = function(elem, type, handle) {
        elem.removeEventListener && elem.removeEventListener(type, handle, !1);
    }, jQuery.Event = function(src, props) {
        return this instanceof jQuery.Event ? (src && src.type ? (this.originalEvent = src, 
        this.type = src.type, this.isDefaultPrevented = src.defaultPrevented || src.getPreventDefault && src.getPreventDefault() ? returnTrue : returnFalse) : this.type = src, 
        props && jQuery.extend(this, props), this.timeStamp = src && src.timeStamp || jQuery.now(), 
        this[jQuery.expando] = !0, void 0) : new jQuery.Event(src, props);
    }, jQuery.Event.prototype = {
        isDefaultPrevented: returnFalse,
        isPropagationStopped: returnFalse,
        isImmediatePropagationStopped: returnFalse,
        preventDefault: function() {
            var e = this.originalEvent;
            this.isDefaultPrevented = returnTrue, e && e.preventDefault && e.preventDefault();
        },
        stopPropagation: function() {
            var e = this.originalEvent;
            this.isPropagationStopped = returnTrue, e && e.stopPropagation && e.stopPropagation();
        },
        stopImmediatePropagation: function() {
            this.isImmediatePropagationStopped = returnTrue, this.stopPropagation();
        }
    }, jQuery.each({
        mouseenter: "mouseover",
        mouseleave: "mouseout"
    }, function(orig, fix) {
        jQuery.event.special[orig] = {
            delegateType: fix,
            bindType: fix,
            handle: function(event) {
                var ret, target = this, related = event.relatedTarget, handleObj = event.handleObj;
                return (!related || related !== target && !jQuery.contains(target, related)) && (event.type = handleObj.origType, 
                ret = handleObj.handler.apply(this, arguments), event.type = fix), ret;
            }
        };
    }), jQuery.support.focusinBubbles || jQuery.each({
        focus: "focusin",
        blur: "focusout"
    }, function(orig, fix) {
        var attaches = 0, handler = function(event) {
            jQuery.event.simulate(fix, event.target, jQuery.event.fix(event), !0);
        };
        jQuery.event.special[fix] = {
            setup: function() {
                0 === attaches++ && document.addEventListener(orig, handler, !0);
            },
            teardown: function() {
                0 === --attaches && document.removeEventListener(orig, handler, !0);
            }
        };
    }), jQuery.fn.extend({
        on: function(types, selector, data, fn, one) {
            var origFn, type;
            if ("object" == typeof types) {
                "string" != typeof selector && (data = data || selector, selector = undefined);
                for (type in types) this.on(type, selector, data, types[type], one);
                return this;
            }
            if (null == data && null == fn ? (fn = selector, data = selector = undefined) : null == fn && ("string" == typeof selector ? (fn = data, 
            data = undefined) : (fn = data, data = selector, selector = undefined)), fn === !1) fn = returnFalse; else if (!fn) return this;
            return 1 === one && (origFn = fn, fn = function(event) {
                return jQuery().off(event), origFn.apply(this, arguments);
            }, fn.guid = origFn.guid || (origFn.guid = jQuery.guid++)), this.each(function() {
                jQuery.event.add(this, types, fn, data, selector);
            });
        },
        one: function(types, selector, data, fn) {
            return this.on(types, selector, data, fn, 1);
        },
        off: function(types, selector, fn) {
            var handleObj, type;
            if (types && types.preventDefault && types.handleObj) return handleObj = types.handleObj, 
            jQuery(types.delegateTarget).off(handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType, handleObj.selector, handleObj.handler), 
            this;
            if ("object" == typeof types) {
                for (type in types) this.off(type, selector, types[type]);
                return this;
            }
            return (selector === !1 || "function" == typeof selector) && (fn = selector, selector = undefined), 
            fn === !1 && (fn = returnFalse), this.each(function() {
                jQuery.event.remove(this, types, fn, selector);
            });
        },
        trigger: function(type, data) {
            return this.each(function() {
                jQuery.event.trigger(type, data, this);
            });
        },
        triggerHandler: function(type, data) {
            var elem = this[0];
            return elem ? jQuery.event.trigger(type, data, elem, !0) : void 0;
        }
    });
    var isSimple = /^.[^:#\[\.,]*$/, rparentsprev = /^(?:parents|prev(?:Until|All))/, rneedsContext = jQuery.expr.match.needsContext, guaranteedUnique = {
        children: !0,
        contents: !0,
        next: !0,
        prev: !0
    };
    jQuery.fn.extend({
        find: function(selector) {
            var i, ret = [], self = this, len = self.length;
            if ("string" != typeof selector) return this.pushStack(jQuery(selector).filter(function() {
                for (i = 0; len > i; i++) if (jQuery.contains(self[i], this)) return !0;
            }));
            for (i = 0; len > i; i++) jQuery.find(selector, self[i], ret);
            return ret = this.pushStack(len > 1 ? jQuery.unique(ret) : ret), ret.selector = this.selector ? this.selector + " " + selector : selector, 
            ret;
        },
        has: function(target) {
            var targets = jQuery(target, this), l = targets.length;
            return this.filter(function() {
                for (var i = 0; l > i; i++) if (jQuery.contains(this, targets[i])) return !0;
            });
        },
        not: function(selector) {
            return this.pushStack(winnow(this, selector || [], !0));
        },
        filter: function(selector) {
            return this.pushStack(winnow(this, selector || [], !1));
        },
        is: function(selector) {
            return !!winnow(this, "string" == typeof selector && rneedsContext.test(selector) ? jQuery(selector) : selector || [], !1).length;
        },
        closest: function(selectors, context) {
            for (var cur, i = 0, l = this.length, matched = [], pos = rneedsContext.test(selectors) || "string" != typeof selectors ? jQuery(selectors, context || this.context) : 0; l > i; i++) for (cur = this[i]; cur && cur !== context; cur = cur.parentNode) if (cur.nodeType < 11 && (pos ? pos.index(cur) > -1 : 1 === cur.nodeType && jQuery.find.matchesSelector(cur, selectors))) {
                cur = matched.push(cur);
                break;
            }
            return this.pushStack(matched.length > 1 ? jQuery.unique(matched) : matched);
        },
        index: function(elem) {
            return elem ? "string" == typeof elem ? core_indexOf.call(jQuery(elem), this[0]) : core_indexOf.call(this, elem.jquery ? elem[0] : elem) : this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
        },
        add: function(selector, context) {
            var set = "string" == typeof selector ? jQuery(selector, context) : jQuery.makeArray(selector && selector.nodeType ? [ selector ] : selector), all = jQuery.merge(this.get(), set);
            return this.pushStack(jQuery.unique(all));
        },
        addBack: function(selector) {
            return this.add(null == selector ? this.prevObject : this.prevObject.filter(selector));
        }
    }), jQuery.each({
        parent: function(elem) {
            var parent = elem.parentNode;
            return parent && 11 !== parent.nodeType ? parent : null;
        },
        parents: function(elem) {
            return jQuery.dir(elem, "parentNode");
        },
        parentsUntil: function(elem, i, until) {
            return jQuery.dir(elem, "parentNode", until);
        },
        next: function(elem) {
            return sibling(elem, "nextSibling");
        },
        prev: function(elem) {
            return sibling(elem, "previousSibling");
        },
        nextAll: function(elem) {
            return jQuery.dir(elem, "nextSibling");
        },
        prevAll: function(elem) {
            return jQuery.dir(elem, "previousSibling");
        },
        nextUntil: function(elem, i, until) {
            return jQuery.dir(elem, "nextSibling", until);
        },
        prevUntil: function(elem, i, until) {
            return jQuery.dir(elem, "previousSibling", until);
        },
        siblings: function(elem) {
            return jQuery.sibling((elem.parentNode || {}).firstChild, elem);
        },
        children: function(elem) {
            return jQuery.sibling(elem.firstChild);
        },
        contents: function(elem) {
            return elem.contentDocument || jQuery.merge([], elem.childNodes);
        }
    }, function(name, fn) {
        jQuery.fn[name] = function(until, selector) {
            var matched = jQuery.map(this, fn, until);
            return "Until" !== name.slice(-5) && (selector = until), selector && "string" == typeof selector && (matched = jQuery.filter(selector, matched)), 
            this.length > 1 && (guaranteedUnique[name] || jQuery.unique(matched), rparentsprev.test(name) && matched.reverse()), 
            this.pushStack(matched);
        };
    }), jQuery.extend({
        filter: function(expr, elems, not) {
            var elem = elems[0];
            return not && (expr = ":not(" + expr + ")"), 1 === elems.length && 1 === elem.nodeType ? jQuery.find.matchesSelector(elem, expr) ? [ elem ] : [] : jQuery.find.matches(expr, jQuery.grep(elems, function(elem) {
                return 1 === elem.nodeType;
            }));
        },
        dir: function(elem, dir, until) {
            for (var matched = [], truncate = until !== undefined; (elem = elem[dir]) && 9 !== elem.nodeType; ) if (1 === elem.nodeType) {
                if (truncate && jQuery(elem).is(until)) break;
                matched.push(elem);
            }
            return matched;
        },
        sibling: function(n, elem) {
            for (var matched = []; n; n = n.nextSibling) 1 === n.nodeType && n !== elem && matched.push(n);
            return matched;
        }
    });
    var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi, rtagName = /<([\w:]+)/, rhtml = /<|&#?\w+;/, rnoInnerhtml = /<(?:script|style|link)/i, manipulation_rcheckableType = /^(?:checkbox|radio)$/i, rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i, rscriptType = /^$|\/(?:java|ecma)script/i, rscriptTypeMasked = /^true\/(.*)/, rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g, wrapMap = {
        option: [ 1, "<select multiple='multiple'>", "</select>" ],
        thead: [ 1, "<table>", "</table>" ],
        col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
        tr: [ 2, "<table><tbody>", "</tbody></table>" ],
        td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
        _default: [ 0, "", "" ]
    };
    wrapMap.optgroup = wrapMap.option, wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead, 
    wrapMap.th = wrapMap.td, jQuery.fn.extend({
        text: function(value) {
            return jQuery.access(this, function(value) {
                return value === undefined ? jQuery.text(this) : this.empty().append((this[0] && this[0].ownerDocument || document).createTextNode(value));
            }, null, value, arguments.length);
        },
        append: function() {
            return this.domManip(arguments, function(elem) {
                if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
                    var target = manipulationTarget(this, elem);
                    target.appendChild(elem);
                }
            });
        },
        prepend: function() {
            return this.domManip(arguments, function(elem) {
                if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
                    var target = manipulationTarget(this, elem);
                    target.insertBefore(elem, target.firstChild);
                }
            });
        },
        before: function() {
            return this.domManip(arguments, function(elem) {
                this.parentNode && this.parentNode.insertBefore(elem, this);
            });
        },
        after: function() {
            return this.domManip(arguments, function(elem) {
                this.parentNode && this.parentNode.insertBefore(elem, this.nextSibling);
            });
        },
        remove: function(selector, keepData) {
            for (var elem, elems = selector ? jQuery.filter(selector, this) : this, i = 0; null != (elem = elems[i]); i++) keepData || 1 !== elem.nodeType || jQuery.cleanData(getAll(elem)), 
            elem.parentNode && (keepData && jQuery.contains(elem.ownerDocument, elem) && setGlobalEval(getAll(elem, "script")), 
            elem.parentNode.removeChild(elem));
            return this;
        },
        empty: function() {
            for (var elem, i = 0; null != (elem = this[i]); i++) 1 === elem.nodeType && (jQuery.cleanData(getAll(elem, !1)), 
            elem.textContent = "");
            return this;
        },
        clone: function(dataAndEvents, deepDataAndEvents) {
            return dataAndEvents = null == dataAndEvents ? !1 : dataAndEvents, deepDataAndEvents = null == deepDataAndEvents ? dataAndEvents : deepDataAndEvents, 
            this.map(function() {
                return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
            });
        },
        html: function(value) {
            return jQuery.access(this, function(value) {
                var elem = this[0] || {}, i = 0, l = this.length;
                if (value === undefined && 1 === elem.nodeType) return elem.innerHTML;
                if ("string" == typeof value && !rnoInnerhtml.test(value) && !wrapMap[(rtagName.exec(value) || [ "", "" ])[1].toLowerCase()]) {
                    value = value.replace(rxhtmlTag, "<$1></$2>");
                    try {
                        for (;l > i; i++) elem = this[i] || {}, 1 === elem.nodeType && (jQuery.cleanData(getAll(elem, !1)), 
                        elem.innerHTML = value);
                        elem = 0;
                    } catch (e) {}
                }
                elem && this.empty().append(value);
            }, null, value, arguments.length);
        },
        replaceWith: function() {
            var args = jQuery.map(this, function(elem) {
                return [ elem.nextSibling, elem.parentNode ];
            }), i = 0;
            return this.domManip(arguments, function(elem) {
                var next = args[i++], parent = args[i++];
                parent && (next && next.parentNode !== parent && (next = this.nextSibling), jQuery(this).remove(), 
                parent.insertBefore(elem, next));
            }, !0), i ? this : this.remove();
        },
        detach: function(selector) {
            return this.remove(selector, !0);
        },
        domManip: function(args, callback, allowIntersection) {
            args = core_concat.apply([], args);
            var fragment, first, scripts, hasScripts, node, doc, i = 0, l = this.length, set = this, iNoClone = l - 1, value = args[0], isFunction = jQuery.isFunction(value);
            if (isFunction || !(1 >= l || "string" != typeof value || jQuery.support.checkClone) && rchecked.test(value)) return this.each(function(index) {
                var self = set.eq(index);
                isFunction && (args[0] = value.call(this, index, self.html())), self.domManip(args, callback, allowIntersection);
            });
            if (l && (fragment = jQuery.buildFragment(args, this[0].ownerDocument, !1, !allowIntersection && this), 
            first = fragment.firstChild, 1 === fragment.childNodes.length && (fragment = first), 
            first)) {
                for (scripts = jQuery.map(getAll(fragment, "script"), disableScript), hasScripts = scripts.length; l > i; i++) node = fragment, 
                i !== iNoClone && (node = jQuery.clone(node, !0, !0), hasScripts && jQuery.merge(scripts, getAll(node, "script"))), 
                callback.call(this[i], node, i);
                if (hasScripts) for (doc = scripts[scripts.length - 1].ownerDocument, jQuery.map(scripts, restoreScript), 
                i = 0; hasScripts > i; i++) node = scripts[i], rscriptType.test(node.type || "") && !data_priv.access(node, "globalEval") && jQuery.contains(doc, node) && (node.src ? jQuery._evalUrl(node.src) : jQuery.globalEval(node.textContent.replace(rcleanScript, "")));
            }
            return this;
        }
    }), jQuery.each({
        appendTo: "append",
        prependTo: "prepend",
        insertBefore: "before",
        insertAfter: "after",
        replaceAll: "replaceWith"
    }, function(name, original) {
        jQuery.fn[name] = function(selector) {
            for (var elems, ret = [], insert = jQuery(selector), last = insert.length - 1, i = 0; last >= i; i++) elems = i === last ? this : this.clone(!0), 
            jQuery(insert[i])[original](elems), core_push.apply(ret, elems.get());
            return this.pushStack(ret);
        };
    }), jQuery.extend({
        clone: function(elem, dataAndEvents, deepDataAndEvents) {
            var i, l, srcElements, destElements, clone = elem.cloneNode(!0), inPage = jQuery.contains(elem.ownerDocument, elem);
            if (!(jQuery.support.noCloneChecked || 1 !== elem.nodeType && 11 !== elem.nodeType || jQuery.isXMLDoc(elem))) for (destElements = getAll(clone), 
            srcElements = getAll(elem), i = 0, l = srcElements.length; l > i; i++) fixInput(srcElements[i], destElements[i]);
            if (dataAndEvents) if (deepDataAndEvents) for (srcElements = srcElements || getAll(elem), 
            destElements = destElements || getAll(clone), i = 0, l = srcElements.length; l > i; i++) cloneCopyEvent(srcElements[i], destElements[i]); else cloneCopyEvent(elem, clone);
            return destElements = getAll(clone, "script"), destElements.length > 0 && setGlobalEval(destElements, !inPage && getAll(elem, "script")), 
            clone;
        },
        buildFragment: function(elems, context, scripts, selection) {
            for (var elem, tmp, tag, wrap, contains, j, i = 0, l = elems.length, fragment = context.createDocumentFragment(), nodes = []; l > i; i++) if (elem = elems[i], 
            elem || 0 === elem) if ("object" === jQuery.type(elem)) jQuery.merge(nodes, elem.nodeType ? [ elem ] : elem); else if (rhtml.test(elem)) {
                for (tmp = tmp || fragment.appendChild(context.createElement("div")), tag = (rtagName.exec(elem) || [ "", "" ])[1].toLowerCase(), 
                wrap = wrapMap[tag] || wrapMap._default, tmp.innerHTML = wrap[1] + elem.replace(rxhtmlTag, "<$1></$2>") + wrap[2], 
                j = wrap[0]; j--; ) tmp = tmp.lastChild;
                jQuery.merge(nodes, tmp.childNodes), tmp = fragment.firstChild, tmp.textContent = "";
            } else nodes.push(context.createTextNode(elem));
            for (fragment.textContent = "", i = 0; elem = nodes[i++]; ) if ((!selection || -1 === jQuery.inArray(elem, selection)) && (contains = jQuery.contains(elem.ownerDocument, elem), 
            tmp = getAll(fragment.appendChild(elem), "script"), contains && setGlobalEval(tmp), 
            scripts)) for (j = 0; elem = tmp[j++]; ) rscriptType.test(elem.type || "") && scripts.push(elem);
            return fragment;
        },
        cleanData: function(elems) {
            for (var data, elem, events, type, key, j, special = jQuery.event.special, i = 0; (elem = elems[i]) !== undefined; i++) {
                if (Data.accepts(elem) && (key = elem[data_priv.expando], key && (data = data_priv.cache[key]))) {
                    if (events = Object.keys(data.events || {}), events.length) for (j = 0; (type = events[j]) !== undefined; j++) special[type] ? jQuery.event.remove(elem, type) : jQuery.removeEvent(elem, type, data.handle);
                    data_priv.cache[key] && delete data_priv.cache[key];
                }
                delete data_user.cache[elem[data_user.expando]];
            }
        },
        _evalUrl: function(url) {
            return jQuery.ajax({
                url: url,
                type: "GET",
                dataType: "script",
                async: !1,
                global: !1,
                "throws": !0
            });
        }
    }), jQuery.fn.extend({
        wrapAll: function(html) {
            var wrap;
            return jQuery.isFunction(html) ? this.each(function(i) {
                jQuery(this).wrapAll(html.call(this, i));
            }) : (this[0] && (wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(!0), this[0].parentNode && wrap.insertBefore(this[0]), 
            wrap.map(function() {
                for (var elem = this; elem.firstElementChild; ) elem = elem.firstElementChild;
                return elem;
            }).append(this)), this);
        },
        wrapInner: function(html) {
            return jQuery.isFunction(html) ? this.each(function(i) {
                jQuery(this).wrapInner(html.call(this, i));
            }) : this.each(function() {
                var self = jQuery(this), contents = self.contents();
                contents.length ? contents.wrapAll(html) : self.append(html);
            });
        },
        wrap: function(html) {
            var isFunction = jQuery.isFunction(html);
            return this.each(function(i) {
                jQuery(this).wrapAll(isFunction ? html.call(this, i) : html);
            });
        },
        unwrap: function() {
            return this.parent().each(function() {
                jQuery.nodeName(this, "body") || jQuery(this).replaceWith(this.childNodes);
            }).end();
        }
    });
    var curCSS, iframe, rdisplayswap = /^(none|table(?!-c[ea]).+)/, rmargin = /^margin/, rnumsplit = new RegExp("^(" + core_pnum + ")(.*)$", "i"), rnumnonpx = new RegExp("^(" + core_pnum + ")(?!px)[a-z%]+$", "i"), rrelNum = new RegExp("^([+-])=(" + core_pnum + ")", "i"), elemdisplay = {
        BODY: "block"
    }, cssShow = {
        position: "absolute",
        visibility: "hidden",
        display: "block"
    }, cssNormalTransform = {
        letterSpacing: 0,
        fontWeight: 400
    }, cssExpand = [ "Top", "Right", "Bottom", "Left" ], cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];
    jQuery.fn.extend({
        css: function(name, value) {
            return jQuery.access(this, function(elem, name, value) {
                var styles, len, map = {}, i = 0;
                if (jQuery.isArray(name)) {
                    for (styles = getStyles(elem), len = name.length; len > i; i++) map[name[i]] = jQuery.css(elem, name[i], !1, styles);
                    return map;
                }
                return value !== undefined ? jQuery.style(elem, name, value) : jQuery.css(elem, name);
            }, name, value, arguments.length > 1);
        },
        show: function() {
            return showHide(this, !0);
        },
        hide: function() {
            return showHide(this);
        },
        toggle: function(state) {
            return "boolean" == typeof state ? state ? this.show() : this.hide() : this.each(function() {
                isHidden(this) ? jQuery(this).show() : jQuery(this).hide();
            });
        }
    }), jQuery.extend({
        cssHooks: {
            opacity: {
                get: function(elem, computed) {
                    if (computed) {
                        var ret = curCSS(elem, "opacity");
                        return "" === ret ? "1" : ret;
                    }
                }
            }
        },
        cssNumber: {
            columnCount: !0,
            fillOpacity: !0,
            fontWeight: !0,
            lineHeight: !0,
            opacity: !0,
            order: !0,
            orphans: !0,
            widows: !0,
            zIndex: !0,
            zoom: !0
        },
        cssProps: {
            "float": "cssFloat"
        },
        style: function(elem, name, value, extra) {
            if (elem && 3 !== elem.nodeType && 8 !== elem.nodeType && elem.style) {
                var ret, type, hooks, origName = jQuery.camelCase(name), style = elem.style;
                return name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(style, origName)), 
                hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName], value === undefined ? hooks && "get" in hooks && (ret = hooks.get(elem, !1, extra)) !== undefined ? ret : style[name] : (type = typeof value, 
                "string" === type && (ret = rrelNum.exec(value)) && (value = (ret[1] + 1) * ret[2] + parseFloat(jQuery.css(elem, name)), 
                type = "number"), null == value || "number" === type && isNaN(value) || ("number" !== type || jQuery.cssNumber[origName] || (value += "px"), 
                jQuery.support.clearCloneStyle || "" !== value || 0 !== name.indexOf("background") || (style[name] = "inherit"), 
                hooks && "set" in hooks && (value = hooks.set(elem, value, extra)) === undefined || (style[name] = value)), 
                void 0);
            }
        },
        css: function(elem, name, extra, styles) {
            var val, num, hooks, origName = jQuery.camelCase(name);
            return name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(elem.style, origName)), 
            hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName], hooks && "get" in hooks && (val = hooks.get(elem, !0, extra)), 
            val === undefined && (val = curCSS(elem, name, styles)), "normal" === val && name in cssNormalTransform && (val = cssNormalTransform[name]), 
            "" === extra || extra ? (num = parseFloat(val), extra === !0 || jQuery.isNumeric(num) ? num || 0 : val) : val;
        }
    }), curCSS = function(elem, name, _computed) {
        var width, minWidth, maxWidth, computed = _computed || getStyles(elem), ret = computed ? computed.getPropertyValue(name) || computed[name] : undefined, style = elem.style;
        return computed && ("" !== ret || jQuery.contains(elem.ownerDocument, elem) || (ret = jQuery.style(elem, name)), 
        rnumnonpx.test(ret) && rmargin.test(name) && (width = style.width, minWidth = style.minWidth, 
        maxWidth = style.maxWidth, style.minWidth = style.maxWidth = style.width = ret, 
        ret = computed.width, style.width = width, style.minWidth = minWidth, style.maxWidth = maxWidth)), 
        ret;
    }, jQuery.each([ "height", "width" ], function(i, name) {
        jQuery.cssHooks[name] = {
            get: function(elem, computed, extra) {
                return computed ? 0 === elem.offsetWidth && rdisplayswap.test(jQuery.css(elem, "display")) ? jQuery.swap(elem, cssShow, function() {
                    return getWidthOrHeight(elem, name, extra);
                }) : getWidthOrHeight(elem, name, extra) : void 0;
            },
            set: function(elem, value, extra) {
                var styles = extra && getStyles(elem);
                return setPositiveNumber(elem, value, extra ? augmentWidthOrHeight(elem, name, extra, jQuery.support.boxSizing && "border-box" === jQuery.css(elem, "boxSizing", !1, styles), styles) : 0);
            }
        };
    }), jQuery(function() {
        jQuery.support.reliableMarginRight || (jQuery.cssHooks.marginRight = {
            get: function(elem, computed) {
                return computed ? jQuery.swap(elem, {
                    display: "inline-block"
                }, curCSS, [ elem, "marginRight" ]) : void 0;
            }
        }), !jQuery.support.pixelPosition && jQuery.fn.position && jQuery.each([ "top", "left" ], function(i, prop) {
            jQuery.cssHooks[prop] = {
                get: function(elem, computed) {
                    return computed ? (computed = curCSS(elem, prop), rnumnonpx.test(computed) ? jQuery(elem).position()[prop] + "px" : computed) : void 0;
                }
            };
        });
    }), jQuery.expr && jQuery.expr.filters && (jQuery.expr.filters.hidden = function(elem) {
        return elem.offsetWidth <= 0 && elem.offsetHeight <= 0;
    }, jQuery.expr.filters.visible = function(elem) {
        return !jQuery.expr.filters.hidden(elem);
    }), jQuery.each({
        margin: "",
        padding: "",
        border: "Width"
    }, function(prefix, suffix) {
        jQuery.cssHooks[prefix + suffix] = {
            expand: function(value) {
                for (var i = 0, expanded = {}, parts = "string" == typeof value ? value.split(" ") : [ value ]; 4 > i; i++) expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
                return expanded;
            }
        }, rmargin.test(prefix) || (jQuery.cssHooks[prefix + suffix].set = setPositiveNumber);
    });
    var r20 = /%20/g, rbracket = /\[\]$/, rCRLF = /\r?\n/g, rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i, rsubmittable = /^(?:input|select|textarea|keygen)/i;
    jQuery.fn.extend({
        serialize: function() {
            return jQuery.param(this.serializeArray());
        },
        serializeArray: function() {
            return this.map(function() {
                var elements = jQuery.prop(this, "elements");
                return elements ? jQuery.makeArray(elements) : this;
            }).filter(function() {
                var type = this.type;
                return this.name && !jQuery(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !manipulation_rcheckableType.test(type));
            }).map(function(i, elem) {
                var val = jQuery(this).val();
                return null == val ? null : jQuery.isArray(val) ? jQuery.map(val, function(val) {
                    return {
                        name: elem.name,
                        value: val.replace(rCRLF, "\r\n")
                    };
                }) : {
                    name: elem.name,
                    value: val.replace(rCRLF, "\r\n")
                };
            }).get();
        }
    }), jQuery.param = function(a, traditional) {
        var prefix, s = [], add = function(key, value) {
            value = jQuery.isFunction(value) ? value() : null == value ? "" : value, s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
        };
        if (traditional === undefined && (traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional), 
        jQuery.isArray(a) || a.jquery && !jQuery.isPlainObject(a)) jQuery.each(a, function() {
            add(this.name, this.value);
        }); else for (prefix in a) buildParams(prefix, a[prefix], traditional, add);
        return s.join("&").replace(r20, "+");
    }, jQuery.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "), function(i, name) {
        jQuery.fn[name] = function(data, fn) {
            return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name);
        };
    }), jQuery.fn.extend({
        hover: function(fnOver, fnOut) {
            return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);
        },
        bind: function(types, data, fn) {
            return this.on(types, null, data, fn);
        },
        unbind: function(types, fn) {
            return this.off(types, null, fn);
        },
        delegate: function(selector, types, data, fn) {
            return this.on(types, selector, data, fn);
        },
        undelegate: function(selector, types, fn) {
            return 1 === arguments.length ? this.off(selector, "**") : this.off(types, selector || "**", fn);
        }
    });
    var ajaxLocParts, ajaxLocation, ajax_nonce = jQuery.now(), ajax_rquery = /\?/, rhash = /#.*$/, rts = /([?&])_=[^&]*/, rheaders = /^(.*?):[ \t]*([^\r\n]*)$/gm, rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/, rnoContent = /^(?:GET|HEAD)$/, rprotocol = /^\/\//, rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/, _load = jQuery.fn.load, prefilters = {}, transports = {}, allTypes = "*/".concat("*");
    try {
        ajaxLocation = location.href;
    } catch (e) {
        ajaxLocation = document.createElement("a"), ajaxLocation.href = "", ajaxLocation = ajaxLocation.href;
    }
    ajaxLocParts = rurl.exec(ajaxLocation.toLowerCase()) || [], jQuery.fn.load = function(url, params, callback) {
        if ("string" != typeof url && _load) return _load.apply(this, arguments);
        var selector, type, response, self = this, off = url.indexOf(" ");
        return off >= 0 && (selector = url.slice(off), url = url.slice(0, off)), jQuery.isFunction(params) ? (callback = params, 
        params = undefined) : params && "object" == typeof params && (type = "POST"), self.length > 0 && jQuery.ajax({
            url: url,
            type: type,
            dataType: "html",
            data: params
        }).done(function(responseText) {
            response = arguments, self.html(selector ? jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector) : responseText);
        }).complete(callback && function(jqXHR, status) {
            self.each(callback, response || [ jqXHR.responseText, status, jqXHR ]);
        }), this;
    }, jQuery.each([ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function(i, type) {
        jQuery.fn[type] = function(fn) {
            return this.on(type, fn);
        };
    }), jQuery.extend({
        active: 0,
        lastModified: {},
        etag: {},
        ajaxSettings: {
            url: ajaxLocation,
            type: "GET",
            isLocal: rlocalProtocol.test(ajaxLocParts[1]),
            global: !0,
            processData: !0,
            async: !0,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            accepts: {
                "*": allTypes,
                text: "text/plain",
                html: "text/html",
                xml: "application/xml, text/xml",
                json: "application/json, text/javascript"
            },
            contents: {
                xml: /xml/,
                html: /html/,
                json: /json/
            },
            responseFields: {
                xml: "responseXML",
                text: "responseText",
                json: "responseJSON"
            },
            converters: {
                "* text": String,
                "text html": !0,
                "text json": jQuery.parseJSON,
                "text xml": jQuery.parseXML
            },
            flatOptions: {
                url: !0,
                context: !0
            }
        },
        ajaxSetup: function(target, settings) {
            return settings ? ajaxExtend(ajaxExtend(target, jQuery.ajaxSettings), settings) : ajaxExtend(jQuery.ajaxSettings, target);
        },
        ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
        ajaxTransport: addToPrefiltersOrTransports(transports),
        ajax: function(url, options) {
            function done(status, nativeStatusText, responses, headers) {
                var isSuccess, success, error, response, modified, statusText = nativeStatusText;
                2 !== state && (state = 2, timeoutTimer && clearTimeout(timeoutTimer), transport = undefined, 
                responseHeadersString = headers || "", jqXHR.readyState = status > 0 ? 4 : 0, isSuccess = status >= 200 && 300 > status || 304 === status, 
                responses && (response = ajaxHandleResponses(s, jqXHR, responses)), response = ajaxConvert(s, response, jqXHR, isSuccess), 
                isSuccess ? (s.ifModified && (modified = jqXHR.getResponseHeader("Last-Modified"), 
                modified && (jQuery.lastModified[cacheURL] = modified), modified = jqXHR.getResponseHeader("etag"), 
                modified && (jQuery.etag[cacheURL] = modified)), 204 === status || "HEAD" === s.type ? statusText = "nocontent" : 304 === status ? statusText = "notmodified" : (statusText = response.state, 
                success = response.data, error = response.error, isSuccess = !error)) : (error = statusText, 
                (status || !statusText) && (statusText = "error", 0 > status && (status = 0))), 
                jqXHR.status = status, jqXHR.statusText = (nativeStatusText || statusText) + "", 
                isSuccess ? deferred.resolveWith(callbackContext, [ success, statusText, jqXHR ]) : deferred.rejectWith(callbackContext, [ jqXHR, statusText, error ]), 
                jqXHR.statusCode(statusCode), statusCode = undefined, fireGlobals && globalEventContext.trigger(isSuccess ? "ajaxSuccess" : "ajaxError", [ jqXHR, s, isSuccess ? success : error ]), 
                completeDeferred.fireWith(callbackContext, [ jqXHR, statusText ]), fireGlobals && (globalEventContext.trigger("ajaxComplete", [ jqXHR, s ]), 
                --jQuery.active || jQuery.event.trigger("ajaxStop")));
            }
            "object" == typeof url && (options = url, url = undefined), options = options || {};
            var transport, cacheURL, responseHeadersString, responseHeaders, timeoutTimer, parts, fireGlobals, i, s = jQuery.ajaxSetup({}, options), callbackContext = s.context || s, globalEventContext = s.context && (callbackContext.nodeType || callbackContext.jquery) ? jQuery(callbackContext) : jQuery.event, deferred = jQuery.Deferred(), completeDeferred = jQuery.Callbacks("once memory"), statusCode = s.statusCode || {}, requestHeaders = {}, requestHeadersNames = {}, state = 0, strAbort = "canceled", jqXHR = {
                readyState: 0,
                getResponseHeader: function(key) {
                    var match;
                    if (2 === state) {
                        if (!responseHeaders) for (responseHeaders = {}; match = rheaders.exec(responseHeadersString); ) responseHeaders[match[1].toLowerCase()] = match[2];
                        match = responseHeaders[key.toLowerCase()];
                    }
                    return null == match ? null : match;
                },
                getAllResponseHeaders: function() {
                    return 2 === state ? responseHeadersString : null;
                },
                setRequestHeader: function(name, value) {
                    var lname = name.toLowerCase();
                    return state || (name = requestHeadersNames[lname] = requestHeadersNames[lname] || name, 
                    requestHeaders[name] = value), this;
                },
                overrideMimeType: function(type) {
                    return state || (s.mimeType = type), this;
                },
                statusCode: function(map) {
                    var code;
                    if (map) if (2 > state) for (code in map) statusCode[code] = [ statusCode[code], map[code] ]; else jqXHR.always(map[jqXHR.status]);
                    return this;
                },
                abort: function(statusText) {
                    var finalText = statusText || strAbort;
                    return transport && transport.abort(finalText), done(0, finalText), this;
                }
            };
            if (deferred.promise(jqXHR).complete = completeDeferred.add, jqXHR.success = jqXHR.done, 
            jqXHR.error = jqXHR.fail, s.url = ((url || s.url || ajaxLocation) + "").replace(rhash, "").replace(rprotocol, ajaxLocParts[1] + "//"), 
            s.type = options.method || options.type || s.method || s.type, s.dataTypes = jQuery.trim(s.dataType || "*").toLowerCase().match(core_rnotwhite) || [ "" ], 
            null == s.crossDomain && (parts = rurl.exec(s.url.toLowerCase()), s.crossDomain = !(!parts || parts[1] === ajaxLocParts[1] && parts[2] === ajaxLocParts[2] && (parts[3] || ("http:" === parts[1] ? "80" : "443")) === (ajaxLocParts[3] || ("http:" === ajaxLocParts[1] ? "80" : "443")))), 
            s.data && s.processData && "string" != typeof s.data && (s.data = jQuery.param(s.data, s.traditional)), 
            inspectPrefiltersOrTransports(prefilters, s, options, jqXHR), 2 === state) return jqXHR;
            fireGlobals = s.global, fireGlobals && 0 === jQuery.active++ && jQuery.event.trigger("ajaxStart"), 
            s.type = s.type.toUpperCase(), s.hasContent = !rnoContent.test(s.type), cacheURL = s.url, 
            s.hasContent || (s.data && (cacheURL = s.url += (ajax_rquery.test(cacheURL) ? "&" : "?") + s.data, 
            delete s.data), s.cache === !1 && (s.url = rts.test(cacheURL) ? cacheURL.replace(rts, "$1_=" + ajax_nonce++) : cacheURL + (ajax_rquery.test(cacheURL) ? "&" : "?") + "_=" + ajax_nonce++)), 
            s.ifModified && (jQuery.lastModified[cacheURL] && jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[cacheURL]), 
            jQuery.etag[cacheURL] && jqXHR.setRequestHeader("If-None-Match", jQuery.etag[cacheURL])), 
            (s.data && s.hasContent && s.contentType !== !1 || options.contentType) && jqXHR.setRequestHeader("Content-Type", s.contentType), 
            jqXHR.setRequestHeader("Accept", s.dataTypes[0] && s.accepts[s.dataTypes[0]] ? s.accepts[s.dataTypes[0]] + ("*" !== s.dataTypes[0] ? ", " + allTypes + "; q=0.01" : "") : s.accepts["*"]);
            for (i in s.headers) jqXHR.setRequestHeader(i, s.headers[i]);
            if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === !1 || 2 === state)) return jqXHR.abort();
            strAbort = "abort";
            for (i in {
                success: 1,
                error: 1,
                complete: 1
            }) jqXHR[i](s[i]);
            if (transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR)) {
                jqXHR.readyState = 1, fireGlobals && globalEventContext.trigger("ajaxSend", [ jqXHR, s ]), 
                s.async && s.timeout > 0 && (timeoutTimer = setTimeout(function() {
                    jqXHR.abort("timeout");
                }, s.timeout));
                try {
                    state = 1, transport.send(requestHeaders, done);
                } catch (e) {
                    if (!(2 > state)) throw e;
                    done(-1, e);
                }
            } else done(-1, "No Transport");
            return jqXHR;
        },
        getJSON: function(url, data, callback) {
            return jQuery.get(url, data, callback, "json");
        },
        getScript: function(url, callback) {
            return jQuery.get(url, undefined, callback, "script");
        }
    }), jQuery.each([ "get", "post" ], function(i, method) {
        jQuery[method] = function(url, data, callback, type) {
            return jQuery.isFunction(data) && (type = type || callback, callback = data, data = undefined), 
            jQuery.ajax({
                url: url,
                type: method,
                dataType: type,
                data: data,
                success: callback
            });
        };
    }), jQuery.ajaxSetup({
        accepts: {
            script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
        },
        contents: {
            script: /(?:java|ecma)script/
        },
        converters: {
            "text script": function(text) {
                return jQuery.globalEval(text), text;
            }
        }
    }), jQuery.ajaxPrefilter("script", function(s) {
        s.cache === undefined && (s.cache = !1), s.crossDomain && (s.type = "GET");
    }), jQuery.ajaxTransport("script", function(s) {
        if (s.crossDomain) {
            var script, callback;
            return {
                send: function(_, complete) {
                    script = jQuery("<script>").prop({
                        async: !0,
                        charset: s.scriptCharset,
                        src: s.url
                    }).on("load error", callback = function(evt) {
                        script.remove(), callback = null, evt && complete("error" === evt.type ? 404 : 200, evt.type);
                    }), document.head.appendChild(script[0]);
                },
                abort: function() {
                    callback && callback();
                }
            };
        }
    });
    var oldCallbacks = [], rjsonp = /(=)\?(?=&|$)|\?\?/;
    jQuery.ajaxSetup({
        jsonp: "callback",
        jsonpCallback: function() {
            var callback = oldCallbacks.pop() || jQuery.expando + "_" + ajax_nonce++;
            return this[callback] = !0, callback;
        }
    }), jQuery.ajaxPrefilter("json jsonp", function(s, originalSettings, jqXHR) {
        var callbackName, overwritten, responseContainer, jsonProp = s.jsonp !== !1 && (rjsonp.test(s.url) ? "url" : "string" == typeof s.data && !(s.contentType || "").indexOf("application/x-www-form-urlencoded") && rjsonp.test(s.data) && "data");
        return jsonProp || "jsonp" === s.dataTypes[0] ? (callbackName = s.jsonpCallback = jQuery.isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback, 
        jsonProp ? s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName) : s.jsonp !== !1 && (s.url += (ajax_rquery.test(s.url) ? "&" : "?") + s.jsonp + "=" + callbackName), 
        s.converters["script json"] = function() {
            return responseContainer || jQuery.error(callbackName + " was not called"), responseContainer[0];
        }, s.dataTypes[0] = "json", overwritten = window[callbackName], window[callbackName] = function() {
            responseContainer = arguments;
        }, jqXHR.always(function() {
            window[callbackName] = overwritten, s[callbackName] && (s.jsonpCallback = originalSettings.jsonpCallback, 
            oldCallbacks.push(callbackName)), responseContainer && jQuery.isFunction(overwritten) && overwritten(responseContainer[0]), 
            responseContainer = overwritten = undefined;
        }), "script") : void 0;
    }), jQuery.ajaxSettings.xhr = function() {
        try {
            return new XMLHttpRequest();
        } catch (e) {}
    };
    var xhrSupported = jQuery.ajaxSettings.xhr(), xhrSuccessStatus = {
        0: 200,
        1223: 204
    }, xhrId = 0, xhrCallbacks = {};
    window.ActiveXObject && jQuery(window).on("unload", function() {
        for (var key in xhrCallbacks) xhrCallbacks[key]();
        xhrCallbacks = undefined;
    }), jQuery.support.cors = !!xhrSupported && "withCredentials" in xhrSupported, jQuery.support.ajax = xhrSupported = !!xhrSupported, 
    jQuery.ajaxTransport(function(options) {
        var callback;
        return jQuery.support.cors || xhrSupported && !options.crossDomain ? {
            send: function(headers, complete) {
                var i, id, xhr = options.xhr();
                if (xhr.open(options.type, options.url, options.async, options.username, options.password), 
                options.xhrFields) for (i in options.xhrFields) xhr[i] = options.xhrFields[i];
                options.mimeType && xhr.overrideMimeType && xhr.overrideMimeType(options.mimeType), 
                options.crossDomain || headers["X-Requested-With"] || (headers["X-Requested-With"] = "XMLHttpRequest");
                for (i in headers) xhr.setRequestHeader(i, headers[i]);
                callback = function(type) {
                    return function() {
                        callback && (delete xhrCallbacks[id], callback = xhr.onload = xhr.onerror = null, 
                        "abort" === type ? xhr.abort() : "error" === type ? complete(xhr.status || 404, xhr.statusText) : complete(xhrSuccessStatus[xhr.status] || xhr.status, xhr.statusText, "string" == typeof xhr.responseText ? {
                            text: xhr.responseText
                        } : undefined, xhr.getAllResponseHeaders()));
                    };
                }, xhr.onload = callback(), xhr.onerror = callback("error"), callback = xhrCallbacks[id = xhrId++] = callback("abort"), 
                xhr.send(options.hasContent && options.data || null);
            },
            abort: function() {
                callback && callback();
            }
        } : void 0;
    });
    var fxNow, timerId, rfxtypes = /^(?:toggle|show|hide)$/, rfxnum = new RegExp("^(?:([+-])=|)(" + core_pnum + ")([a-z%]*)$", "i"), rrun = /queueHooks$/, animationPrefilters = [ defaultPrefilter ], tweeners = {
        "*": [ function(prop, value) {
            var tween = this.createTween(prop, value), target = tween.cur(), parts = rfxnum.exec(value), unit = parts && parts[3] || (jQuery.cssNumber[prop] ? "" : "px"), start = (jQuery.cssNumber[prop] || "px" !== unit && +target) && rfxnum.exec(jQuery.css(tween.elem, prop)), scale = 1, maxIterations = 20;
            if (start && start[3] !== unit) {
                unit = unit || start[3], parts = parts || [], start = +target || 1;
                do scale = scale || ".5", start /= scale, jQuery.style(tween.elem, prop, start + unit); while (scale !== (scale = tween.cur() / target) && 1 !== scale && --maxIterations);
            }
            return parts && (start = tween.start = +start || +target || 0, tween.unit = unit, 
            tween.end = parts[1] ? start + (parts[1] + 1) * parts[2] : +parts[2]), tween;
        } ]
    };
    jQuery.Animation = jQuery.extend(Animation, {
        tweener: function(props, callback) {
            jQuery.isFunction(props) ? (callback = props, props = [ "*" ]) : props = props.split(" ");
            for (var prop, index = 0, length = props.length; length > index; index++) prop = props[index], 
            tweeners[prop] = tweeners[prop] || [], tweeners[prop].unshift(callback);
        },
        prefilter: function(callback, prepend) {
            prepend ? animationPrefilters.unshift(callback) : animationPrefilters.push(callback);
        }
    }), jQuery.Tween = Tween, Tween.prototype = {
        constructor: Tween,
        init: function(elem, options, prop, end, easing, unit) {
            this.elem = elem, this.prop = prop, this.easing = easing || "swing", this.options = options, 
            this.start = this.now = this.cur(), this.end = end, this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px");
        },
        cur: function() {
            var hooks = Tween.propHooks[this.prop];
            return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this);
        },
        run: function(percent) {
            var eased, hooks = Tween.propHooks[this.prop];
            return this.pos = eased = this.options.duration ? jQuery.easing[this.easing](percent, this.options.duration * percent, 0, 1, this.options.duration) : percent, 
            this.now = (this.end - this.start) * eased + this.start, this.options.step && this.options.step.call(this.elem, this.now, this), 
            hooks && hooks.set ? hooks.set(this) : Tween.propHooks._default.set(this), this;
        }
    }, Tween.prototype.init.prototype = Tween.prototype, Tween.propHooks = {
        _default: {
            get: function(tween) {
                var result;
                return null == tween.elem[tween.prop] || tween.elem.style && null != tween.elem.style[tween.prop] ? (result = jQuery.css(tween.elem, tween.prop, ""), 
                result && "auto" !== result ? result : 0) : tween.elem[tween.prop];
            },
            set: function(tween) {
                jQuery.fx.step[tween.prop] ? jQuery.fx.step[tween.prop](tween) : tween.elem.style && (null != tween.elem.style[jQuery.cssProps[tween.prop]] || jQuery.cssHooks[tween.prop]) ? jQuery.style(tween.elem, tween.prop, tween.now + tween.unit) : tween.elem[tween.prop] = tween.now;
            }
        }
    }, Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
        set: function(tween) {
            tween.elem.nodeType && tween.elem.parentNode && (tween.elem[tween.prop] = tween.now);
        }
    }, jQuery.each([ "toggle", "show", "hide" ], function(i, name) {
        var cssFn = jQuery.fn[name];
        jQuery.fn[name] = function(speed, easing, callback) {
            return null == speed || "boolean" == typeof speed ? cssFn.apply(this, arguments) : this.animate(genFx(name, !0), speed, easing, callback);
        };
    }), jQuery.fn.extend({
        fadeTo: function(speed, to, easing, callback) {
            return this.filter(isHidden).css("opacity", 0).show().end().animate({
                opacity: to
            }, speed, easing, callback);
        },
        animate: function(prop, speed, easing, callback) {
            var empty = jQuery.isEmptyObject(prop), optall = jQuery.speed(speed, easing, callback), doAnimation = function() {
                var anim = Animation(this, jQuery.extend({}, prop), optall);
                (empty || data_priv.get(this, "finish")) && anim.stop(!0);
            };
            return doAnimation.finish = doAnimation, empty || optall.queue === !1 ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
        },
        stop: function(type, clearQueue, gotoEnd) {
            var stopQueue = function(hooks) {
                var stop = hooks.stop;
                delete hooks.stop, stop(gotoEnd);
            };
            return "string" != typeof type && (gotoEnd = clearQueue, clearQueue = type, type = undefined), 
            clearQueue && type !== !1 && this.queue(type || "fx", []), this.each(function() {
                var dequeue = !0, index = null != type && type + "queueHooks", timers = jQuery.timers, data = data_priv.get(this);
                if (index) data[index] && data[index].stop && stopQueue(data[index]); else for (index in data) data[index] && data[index].stop && rrun.test(index) && stopQueue(data[index]);
                for (index = timers.length; index--; ) timers[index].elem !== this || null != type && timers[index].queue !== type || (timers[index].anim.stop(gotoEnd), 
                dequeue = !1, timers.splice(index, 1));
                (dequeue || !gotoEnd) && jQuery.dequeue(this, type);
            });
        },
        finish: function(type) {
            return type !== !1 && (type = type || "fx"), this.each(function() {
                var index, data = data_priv.get(this), queue = data[type + "queue"], hooks = data[type + "queueHooks"], timers = jQuery.timers, length = queue ? queue.length : 0;
                for (data.finish = !0, jQuery.queue(this, type, []), hooks && hooks.stop && hooks.stop.call(this, !0), 
                index = timers.length; index--; ) timers[index].elem === this && timers[index].queue === type && (timers[index].anim.stop(!0), 
                timers.splice(index, 1));
                for (index = 0; length > index; index++) queue[index] && queue[index].finish && queue[index].finish.call(this);
                delete data.finish;
            });
        }
    }), jQuery.each({
        slideDown: genFx("show"),
        slideUp: genFx("hide"),
        slideToggle: genFx("toggle"),
        fadeIn: {
            opacity: "show"
        },
        fadeOut: {
            opacity: "hide"
        },
        fadeToggle: {
            opacity: "toggle"
        }
    }, function(name, props) {
        jQuery.fn[name] = function(speed, easing, callback) {
            return this.animate(props, speed, easing, callback);
        };
    }), jQuery.speed = function(speed, easing, fn) {
        var opt = speed && "object" == typeof speed ? jQuery.extend({}, speed) : {
            complete: fn || !fn && easing || jQuery.isFunction(speed) && speed,
            duration: speed,
            easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
        };
        return opt.duration = jQuery.fx.off ? 0 : "number" == typeof opt.duration ? opt.duration : opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[opt.duration] : jQuery.fx.speeds._default, 
        (null == opt.queue || opt.queue === !0) && (opt.queue = "fx"), opt.old = opt.complete, 
        opt.complete = function() {
            jQuery.isFunction(opt.old) && opt.old.call(this), opt.queue && jQuery.dequeue(this, opt.queue);
        }, opt;
    }, jQuery.easing = {
        linear: function(p) {
            return p;
        },
        swing: function(p) {
            return .5 - Math.cos(p * Math.PI) / 2;
        }
    }, jQuery.timers = [], jQuery.fx = Tween.prototype.init, jQuery.fx.tick = function() {
        var timer, timers = jQuery.timers, i = 0;
        for (fxNow = jQuery.now(); i < timers.length; i++) timer = timers[i], timer() || timers[i] !== timer || timers.splice(i--, 1);
        timers.length || jQuery.fx.stop(), fxNow = undefined;
    }, jQuery.fx.timer = function(timer) {
        timer() && jQuery.timers.push(timer) && jQuery.fx.start();
    }, jQuery.fx.interval = 13, jQuery.fx.start = function() {
        timerId || (timerId = setInterval(jQuery.fx.tick, jQuery.fx.interval));
    }, jQuery.fx.stop = function() {
        clearInterval(timerId), timerId = null;
    }, jQuery.fx.speeds = {
        slow: 600,
        fast: 200,
        _default: 400
    }, jQuery.fx.step = {}, jQuery.expr && jQuery.expr.filters && (jQuery.expr.filters.animated = function(elem) {
        return jQuery.grep(jQuery.timers, function(fn) {
            return elem === fn.elem;
        }).length;
    }), jQuery.fn.offset = function(options) {
        if (arguments.length) return options === undefined ? this : this.each(function(i) {
            jQuery.offset.setOffset(this, options, i);
        });
        var docElem, win, elem = this[0], box = {
            top: 0,
            left: 0
        }, doc = elem && elem.ownerDocument;
        if (doc) return docElem = doc.documentElement, jQuery.contains(docElem, elem) ? (typeof elem.getBoundingClientRect !== core_strundefined && (box = elem.getBoundingClientRect()), 
        win = getWindow(doc), {
            top: box.top + win.pageYOffset - docElem.clientTop,
            left: box.left + win.pageXOffset - docElem.clientLeft
        }) : box;
    }, jQuery.offset = {
        setOffset: function(elem, options, i) {
            var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition, position = jQuery.css(elem, "position"), curElem = jQuery(elem), props = {};
            "static" === position && (elem.style.position = "relative"), curOffset = curElem.offset(), 
            curCSSTop = jQuery.css(elem, "top"), curCSSLeft = jQuery.css(elem, "left"), calculatePosition = ("absolute" === position || "fixed" === position) && (curCSSTop + curCSSLeft).indexOf("auto") > -1, 
            calculatePosition ? (curPosition = curElem.position(), curTop = curPosition.top, 
            curLeft = curPosition.left) : (curTop = parseFloat(curCSSTop) || 0, curLeft = parseFloat(curCSSLeft) || 0), 
            jQuery.isFunction(options) && (options = options.call(elem, i, curOffset)), null != options.top && (props.top = options.top - curOffset.top + curTop), 
            null != options.left && (props.left = options.left - curOffset.left + curLeft), 
            "using" in options ? options.using.call(elem, props) : curElem.css(props);
        }
    }, jQuery.fn.extend({
        position: function() {
            if (this[0]) {
                var offsetParent, offset, elem = this[0], parentOffset = {
                    top: 0,
                    left: 0
                };
                return "fixed" === jQuery.css(elem, "position") ? offset = elem.getBoundingClientRect() : (offsetParent = this.offsetParent(), 
                offset = this.offset(), jQuery.nodeName(offsetParent[0], "html") || (parentOffset = offsetParent.offset()), 
                parentOffset.top += jQuery.css(offsetParent[0], "borderTopWidth", !0), parentOffset.left += jQuery.css(offsetParent[0], "borderLeftWidth", !0)), 
                {
                    top: offset.top - parentOffset.top - jQuery.css(elem, "marginTop", !0),
                    left: offset.left - parentOffset.left - jQuery.css(elem, "marginLeft", !0)
                };
            }
        },
        offsetParent: function() {
            return this.map(function() {
                for (var offsetParent = this.offsetParent || docElem; offsetParent && !jQuery.nodeName(offsetParent, "html") && "static" === jQuery.css(offsetParent, "position"); ) offsetParent = offsetParent.offsetParent;
                return offsetParent || docElem;
            });
        }
    }), jQuery.each({
        scrollLeft: "pageXOffset",
        scrollTop: "pageYOffset"
    }, function(method, prop) {
        var top = "pageYOffset" === prop;
        jQuery.fn[method] = function(val) {
            return jQuery.access(this, function(elem, method, val) {
                var win = getWindow(elem);
                return val === undefined ? win ? win[prop] : elem[method] : (win ? win.scrollTo(top ? window.pageXOffset : val, top ? val : window.pageYOffset) : elem[method] = val, 
                void 0);
            }, method, val, arguments.length, null);
        };
    }), jQuery.each({
        Height: "height",
        Width: "width"
    }, function(name, type) {
        jQuery.each({
            padding: "inner" + name,
            content: type,
            "": "outer" + name
        }, function(defaultExtra, funcName) {
            jQuery.fn[funcName] = function(margin, value) {
                var chainable = arguments.length && (defaultExtra || "boolean" != typeof margin), extra = defaultExtra || (margin === !0 || value === !0 ? "margin" : "border");
                return jQuery.access(this, function(elem, type, value) {
                    var doc;
                    return jQuery.isWindow(elem) ? elem.document.documentElement["client" + name] : 9 === elem.nodeType ? (doc = elem.documentElement, 
                    Math.max(elem.body["scroll" + name], doc["scroll" + name], elem.body["offset" + name], doc["offset" + name], doc["client" + name])) : value === undefined ? jQuery.css(elem, type, extra) : jQuery.style(elem, type, value, extra);
                }, type, chainable ? margin : undefined, chainable, null);
            };
        });
    }), jQuery.fn.size = function() {
        return this.length;
    }, jQuery.fn.andSelf = jQuery.fn.addBack, "object" == typeof module && module && "object" == typeof module.exports ? module.exports = jQuery : "function" == typeof define && define.amd && define("jquery", [], function() {
        return jQuery;
    }), "object" == typeof window && "object" == typeof window.document && (window.jQuery = window.$ = jQuery);
}(window), function(definition) {
    "object" == typeof exports ? module.exports = definition() : "function" == typeof define ? define(definition) : breeze = definition();
}(function() {
    function __objectForEach(obj, kvFn) {
        for (var key in obj) __hasOwnProperty(obj, key) && kvFn(key, obj[key]);
    }
    function __objectFirst(obj, kvPredicate) {
        for (var key in obj) if (__hasOwnProperty(obj, key)) {
            var value = obj[key];
            if (kvPredicate(key, value)) return {
                key: key,
                value: value
            };
        }
        return null;
    }
    function __objectMapToArray(obj, kvFn) {
        var results = [];
        for (var key in obj) if (__hasOwnProperty(obj, key)) {
            var result = kvFn ? kvFn(key, obj[key]) : obj[key];
            void 0 !== result && results.push(result);
        }
        return results;
    }
    function __propEq(propertyName, value) {
        return function(obj) {
            return obj[propertyName] === value;
        };
    }
    function __pluck(propertyName) {
        return function(obj) {
            return obj[propertyName];
        };
    }
    function __getOwnPropertyValues(source) {
        var result = [];
        for (var name in source) __hasOwnProperty(source, name) && result.push(source[name]);
        return result;
    }
    function __extend(target, source) {
        if (!source) return target;
        for (var name in source) __hasOwnProperty(source, name) && (target[name] = source[name]);
        return target;
    }
    function __updateWithDefaults(target, defaults) {
        for (var name in defaults) void 0 === target[name] && (target[name] = defaults[name]);
        return target;
    }
    function __setAsDefault(target, ctor) {
        return ctor.defaultInstance = __updateWithDefaults(new ctor(target), ctor.defaultInstance), 
        target;
    }
    function __toJson(source, template) {
        var target = {};
        for (var propName in template) if (propName in source) {
            var value = source[propName], defaultValue = template[propName];
            value != defaultValue && (Array.isArray(value) && 0 === value.length || ("function" == typeof defaultValue ? value = defaultValue(value) : "object" == typeof value && value && value.parentEnum && (value = value.name), 
            void 0 !== value && (target[propName] = value)));
        }
        return target;
    }
    function __resolveProperties(sources, propertyNames) {
        var r = {}, length = sources.length;
        return propertyNames.forEach(function(pn) {
            for (var i = 0; length > i; i++) {
                var src = sources[i];
                if (src) {
                    var val = src[pn];
                    if (void 0 !== val) {
                        r[pn] = val;
                        break;
                    }
                }
            }
        }), r;
    }
    function __toArray(item) {
        return item ? Array.isArray(item) ? item : [ item ] : [];
    }
    function __arrayFirst(array, predicate) {
        for (var i = 0, j = array.length; j > i; i++) if (predicate(array[i])) return array[i];
        return null;
    }
    function __arrayIndexOf(array, predicate) {
        for (var i = 0, j = array.length; j > i; i++) if (predicate(array[i])) return i;
        return -1;
    }
    function __arrayRemoveItem(array, predicateOrItem, shouldRemoveMultiple) {
        for (var predicate = __isFunction(predicateOrItem) ? predicateOrItem : void 0, lastIx = array.length - 1, removed = !1, i = lastIx; i >= 0; i--) if ((predicate ? predicate(array[i]) : array[i] === predicateOrItem) && (array.splice(i, 1), 
        removed = !0, !shouldRemoveMultiple)) return removed;
        return removed;
    }
    function __arrayZip(a1, a2, callback) {
        for (var result = [], n = Math.min(a1.length, a2.length), i = 0; n > i; ++i) result.push(callback(a1[i], a2[i]));
        return result;
    }
    function __arrayEquals(a1, a2, equalsFn) {
        if (!a1 || !a2) return !1;
        if (a1.length !== a2.length) return !1;
        for (var i = 0; i < a1.length; i++) if (Array.isArray(a1[i])) {
            if (!__arrayEquals(a1[i], a2[i])) return !1;
        } else if (equalsFn) {
            if (!equalsFn(a1[i], a2[i])) return !1;
        } else if (a1[i] !== a2[i]) return !1;
        return !0;
    }
    function __getArray(source, propName) {
        var arr = source[propName];
        return arr || (arr = [], source[propName] = arr), arr;
    }
    function __requireLib(libNames, errMessage) {
        for (var arrNames = libNames.split(";"), i = 0, j = arrNames.length; j > i; i++) {
            var lib = __requireLibCore(arrNames[i]);
            if (lib) return lib;
        }
        if (errMessage) throw new Error("Unable to initialize " + libNames + ".  " + errMessage || "");
    }
    function __requireLibCore(libName) {
        var lib;
        try {
            if (this.window) {
                var window = this.window;
                if (lib = window[libName]) return lib;
                if (window.require && (lib = window.require(libName)), lib) return lib;
            }
            require && (lib = require(libName));
        } catch (e) {}
        return lib;
    }
    function __using(obj, property, tempValue, fn) {
        var originalValue = obj[property];
        if (tempValue === originalValue) return fn();
        obj[property] = tempValue;
        try {
            return fn();
        } finally {
            void 0 === originalValue ? delete obj[property] : obj[property] = originalValue;
        }
    }
    function __wrapExecution(startFn, endFn, fn) {
        var state;
        try {
            return state = startFn(), fn();
        } catch (e) {
            throw "object" == typeof state && (state.error = e), e;
        } finally {
            endFn(state);
        }
    }
    function __memoize(fn) {
        return function() {
            for (var args = __arraySlice(arguments), hash = "", i = args.length, currentArg = null; i--; ) currentArg = args[i], 
            hash += currentArg === Object(currentArg) ? JSON.stringify(currentArg) : currentArg, 
            fn.memoize || (fn.memoize = {});
            return hash in fn.memoize ? fn.memoize[hash] : fn.memoize[hash] = fn.apply(this, args);
        };
    }
    function __getUuid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            var r = 16 * Math.random() | 0, v = "x" == c ? r : 3 & r | 8;
            return v.toString(16);
        });
    }
    function __durationToSeconds(duration) {
        if ("string" != typeof duration) throw new Error("Invalid ISO8601 duration '" + duration + "'");
        var struct = /^P((\d+Y)?(\d+M)?(\d+D)?)?(T(\d+H)?(\d+M)?(\d+S)?)?$/.exec(duration);
        if (!struct) throw new Error("Invalid ISO8601 duration '" + duration + "'");
        for (var ymdhmsIndexes = [ 2, 3, 4, 6, 7, 8 ], factors = [ 31104e3, 2592e3, 86400, 3600, 60, 1 ], seconds = 0, i = 0; 6 > i; i++) {
            var digit = struct[ymdhmsIndexes[i]];
            digit = digit ? +digit.replace(/[A-Za-z]+/g, "") : 0, seconds += digit * factors[i];
        }
        return seconds;
    }
    function __classof(o) {
        return null === o ? "null" : void 0 === o ? "undefined" : Object.prototype.toString.call(o).slice(8, -1).toLowerCase();
    }
    function __isDate(o) {
        return "date" === __classof(o) && !isNaN(o.getTime());
    }
    function __isFunction(o) {
        return "function" === __classof(o);
    }
    function __isGuid(value) {
        return "string" == typeof value && /[a-fA-F\d]{8}-(?:[a-fA-F\d]{4}-){3}[a-fA-F\d]{12}/.test(value);
    }
    function __isDuration(value) {
        return "string" == typeof value && /^(-|)?P[T]?[\d\.,\-]+[YMDTHS]/.test(value);
    }
    function __isEmpty(obj) {
        if (null === obj || void 0 === obj) return !0;
        for (var key in obj) if (__hasOwnProperty(obj, key)) return !1;
        return !0;
    }
    function __isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    function __stringStartsWith(str, prefix) {
        return str && prefix ? 0 === str.indexOf(prefix, 0) : !1;
    }
    function __stringEndsWith(str, suffix) {
        return str && suffix ? -1 !== str.indexOf(suffix, str.length - suffix.length) : !1;
    }
    function __formatString(string) {
        var args = arguments, pattern = RegExp("%([1-" + (arguments.length - 1) + "])", "g");
        return string.replace(pattern, function(match, index) {
            return args[index];
        });
    }
    function uncurry(f) {
        var call = Function.call;
        return function() {
            return call.apply(f, arguments);
        };
    }
    function defaultPropertyInterceptor(property, newValue, rawAccessorFn) {
        void 0 === newValue && (newValue = null);
        var oldValue = rawAccessorFn(), dataType = property.dataType;
        if (dataType && dataType.parse && (newValue = Array.isArray(newValue) && !property.isScalar ? newValue.map(function(nv) {
            return dataType.parse(nv, typeof nv);
        }) : dataType.parse(newValue, typeof newValue)), !(newValue === oldValue || dataType && dataType.isDate && newValue && oldValue && newValue.valueOf() === oldValue.valueOf())) {
            var localAspect, key, relatedEntity, that = this, propName = property.name, entityAspect = this.entityAspect;
            entityAspect ? localAspect = entityAspect : (localAspect = this.complexAspect, entityAspect = localAspect.getEntityAspect());
            var propPath = localAspect.getPropertyPath(propName), inProcess = entityAspect._inProcess;
            if (inProcess) {
                if (inProcess.indexOf(property) >= 0) return;
                inProcess.push(property);
            } else inProcess = [ property ], entityAspect._inProcess = inProcess;
            var entity = entityAspect.entity;
            try {
                var entityManager = entityAspect.entityManager;
                if (entityAspect.entityState.isUnchangedOrModified() && void 0 === localAspect.originalValues[propName] && property.isDataProperty && !property.isComplexProperty && (localAspect.originalValues[propName] = void 0 !== oldValue ? oldValue : property.defaultValue), 
                property.isComplexProperty) {
                    if (!property.isScalar) throw new Error(__formatString("You cannot set the non-scalar complex property: '%1' on the type: '%2'.Instead get the property and use array functions like 'push' or 'splice' to change its contents.", property.name, property.parentType.name));
                    if (!newValue) throw new Error(__formatString("You cannot set the '%1' property to null because it's datatype is the ComplexType: '%2'", property.name, property.dataType.name));
                    if (!oldValue) {
                        var ctor = dataType.getCtor();
                        oldValue = new ctor(), rawAccessorFn(oldValue);
                    }
                    dataType.dataProperties.forEach(function(dp) {
                        var pn = dp.name, nv = newValue.getProperty(pn);
                        oldValue.setProperty(pn, nv);
                    });
                } else if (property.isDataProperty) {
                    if (!property.isScalar) throw new Error("Nonscalar data properties are readonly - items may be added or removed but the collection may not be changed.");
                    if (property.isPartOfKey && !this.complexAspect && entityManager && !entityManager.isLoading) {
                        var keyProps = this.entityType.keyProperties, values = keyProps.map(function(p) {
                            return p === property ? newValue : this.getProperty(p.name);
                        }, this), newKey = new EntityKey(this.entityType, values);
                        if (entityManager.findEntityByKey(newKey)) throw new Error("An entity with this key is already in the cache: " + newKey.toString());
                        var oldKey = this.entityAspect.getKey(), eg = entityManager._findEntityGroup(this.entityType);
                        eg._replaceKey(oldKey, newKey);
                    }
                    var relatedNavProp = property.relatedNavigationProperty;
                    if (relatedNavProp && entityManager) null != newValue ? (key = new EntityKey(relatedNavProp.entityType, [ newValue ]), 
                    relatedEntity = entityManager.findEntityByKey(key), relatedEntity ? this.setProperty(relatedNavProp.name, relatedEntity) : entityManager._unattachedChildrenMap.addChild(key, relatedNavProp, this)) : this.setProperty(relatedNavProp.name, null); else if (property.inverseNavigationProperty && entityManager && !entityManager._inKeyFixup) {
                        var invNavProp = property.inverseNavigationProperty;
                        if (null != oldValue && (key = new EntityKey(invNavProp.parentType, [ oldValue ]), 
                        relatedEntity = entityManager.findEntityByKey(key))) if (invNavProp.isScalar) relatedEntity.setProperty(invNavProp.name, null); else {
                            var relatedArray = relatedEntity.getProperty(invNavProp.name);
                            relatedArray.splice(relatedArray.indexOf(this), 1);
                        }
                        null != newValue && (key = new EntityKey(invNavProp.parentType, [ newValue ]), relatedEntity = entityManager.findEntityByKey(key), 
                        relatedEntity ? invNavProp.isScalar ? relatedEntity.setProperty(invNavProp.name, this) : relatedEntity.getProperty(invNavProp.name).push(this) : entityManager._unattachedChildrenMap.addChild(key, invNavProp, this));
                    }
                    if (rawAccessorFn(newValue), entityManager && !entityManager.isLoading && (entityAspect.entityState.isUnchanged() && !property.isUnmapped && entityAspect.setModified(), 
                    entityManager.validationOptions.validateOnPropertyChange && entityAspect._validateProperty(newValue, {
                        entity: entity,
                        property: property,
                        propertyName: propPath,
                        oldValue: oldValue
                    })), property.isPartOfKey && !this.complexAspect) {
                        var propertyIx = this.entityType.keyProperties.indexOf(property);
                        this.entityType.navigationProperties.forEach(function(np) {
                            var inverseNp = np.inverse, fkNames = inverseNp ? inverseNp.foreignKeyNames : np.invForeignKeyNames;
                            if (0 !== fkNames.length) {
                                var npValue = that.getProperty(np.name), fkName = fkNames[propertyIx];
                                if (np.isScalar) {
                                    if (!npValue) return;
                                    npValue.setProperty(fkName, newValue);
                                } else npValue.forEach(function(iv) {
                                    iv.setProperty(fkName, newValue);
                                });
                            }
                        }), entityAspect.getKey(!0);
                    }
                } else {
                    if (!property.isScalar) throw new Error("Nonscalar navigation properties are readonly - entities can be added or removed but the collection may not be changed.");
                    var inverseProp = property.inverse;
                    if (null != newValue) {
                        var newAspect = newValue.entityAspect;
                        if (entityManager) {
                            if (newAspect.entityState.isDetached()) entityManager.isLoading || entityManager.attachEntity(newValue, EntityState.Added); else if (newAspect.entityManager !== entityManager) throw new Error("An Entity cannot be attached to an entity in another EntityManager. One of the two entities must be detached first.");
                        } else newAspect && newAspect.entityManager && (entityManager = newAspect.entityManager, 
                        entityManager.isLoading || entityManager.attachEntity(entityAspect.entity, EntityState.Added));
                    }
                    if (inverseProp) if (inverseProp.isScalar) null != oldValue && oldValue.setProperty(inverseProp.name, null), 
                    null != newValue && newValue.setProperty(inverseProp.name, this); else {
                        if (null != oldValue) {
                            var oldSiblings = oldValue.getProperty(inverseProp.name), ix = oldSiblings.indexOf(this);
                            -1 !== ix && oldSiblings.splice(ix, 1);
                        }
                        if (null != newValue) {
                            var siblings = newValue.getProperty(inverseProp.name);
                            siblings.push(this);
                        }
                    } else if (property.invForeignKeyNames && entityManager && !entityManager._inKeyFixup) {
                        var invForeignKeyNames = property.invForeignKeyNames;
                        if (null != newValue) {
                            var pkValues = this.entityAspect.getKey().values;
                            invForeignKeyNames.forEach(function(fkName, i) {
                                newValue.setProperty(fkName, pkValues[i]);
                            });
                        } else null != oldValue && invForeignKeyNames.forEach(function(fkName) {
                            var fkProp = oldValue.entityType.getProperty(fkName);
                            fkProp.isPartOfKey || oldValue.setProperty(fkName, null);
                        });
                    }
                    if (rawAccessorFn(newValue), entityManager && !entityManager.isLoading && (entityAspect.entityState.isUnchanged() && !property.isUnmapped && entityAspect.setModified(), 
                    entityManager.validationOptions.validateOnPropertyChange && entityAspect._validateProperty(newValue, {
                        entity: this,
                        property: property,
                        propertyName: propPath,
                        oldValue: oldValue
                    })), property.relatedDataProperties && !entityAspect.entityState.isDeleted()) {
                        var inverseKeyProps = property.entityType.keyProperties;
                        inverseKeyProps.forEach(function(keyProp, i) {
                            var relatedDataProp = property.relatedDataProperties[i];
                            if (newValue || !relatedDataProp.isPartOfKey) {
                                var relatedValue = newValue ? newValue.getProperty(keyProp.name) : relatedDataProp.defaultValue;
                                that.setProperty(relatedDataProp.name, relatedValue);
                            }
                        });
                    }
                }
                var propChangedArgs = {
                    entity: entity,
                    parent: this,
                    property: property,
                    propertyName: propPath,
                    oldValue: oldValue,
                    newValue: newValue
                };
                entityManager ? entityManager.isLoading || entityManager.isRejectingChanges || (entityAspect.propertyChanged.publish(propChangedArgs), 
                entityManager.entityChanged.publish({
                    entityAction: EntityAction.PropertyChange,
                    entity: entity,
                    args: propChangedArgs
                })) : entityAspect.propertyChanged.publish(propChangedArgs);
            } finally {
                inProcess.pop();
            }
        }
    }
    function isQualifiedTypeName(entityTypeName) {
        return entityTypeName.indexOf(":#") >= 0;
    }
    function qualifyTypeName(shortName, namespace) {
        return shortName + ":#" + namespace;
    }
    function addProperties(entityType, propObj, ctor) {
        if (propObj) if (Array.isArray(propObj)) propObj.forEach(entityType.addProperty.bind(entityType)); else {
            if ("object" != typeof propObj) throw new Error("The 'dataProperties' or 'navigationProperties' values must be either an array of data/nav properties or an object where each property defines a data/nav property");
            for (var key in propObj) if (__hasOwnProperty(propObj, key)) {
                var value = propObj[key];
                value.name = key;
                var prop = new ctor(value);
                entityType.addProperty(prop);
            }
        }
    }
    function getPropertyPathValue(obj, propertyPath) {
        var properties;
        if (properties = Array.isArray(propertyPath) ? propertyPath : propertyPath.split("."), 
        1 === properties.length) return obj.getProperty(propertyPath);
        for (var nextValue = obj, i = 0; i < properties.length && (nextValue = nextValue.getProperty(properties[i]), 
        null != nextValue); i++) ;
        return nextValue;
    }
    function getComparableFn(dataType) {
        return dataType && dataType.isDate ? function(value) {
            return value && value.getTime();
        } : dataType === DataType.Time ? function(value) {
            return value && __durationToSeconds(value);
        } : function(value) {
            return value;
        };
    }
    var breeze = {
        version: "1.4.4",
        metadataVersion: "1.0.5"
    }, __hasOwnProperty = uncurry(Object.prototype.hasOwnProperty), __arraySlice = uncurry(Array.prototype.slice);
    Object.create || (Object.create = function(parent) {
        var F = function() {};
        return F.prototype = parent, new F();
    });
    var core = {};
    core.objectForEach = __objectForEach, core.extend = __extend, core.propEq = __propEq, 
    core.pluck = __pluck, core.arrayEquals = __arrayEquals, core.arrayFirst = __arrayFirst, 
    core.arrayIndexOf = __arrayIndexOf, core.arrayRemoveItem = __arrayRemoveItem, core.arrayZip = __arrayZip, 
    core.requireLib = __requireLib, core.using = __using, core.memoize = __memoize, 
    core.getUuid = __getUuid, core.durationToSeconds = __durationToSeconds, core.isDate = __isDate, 
    core.isGuid = __isGuid, core.isDuration = __isDuration, core.isFunction = __isFunction, 
    core.isEmpty = __isEmpty, core.isNumeric = __isNumeric, core.stringStartsWith = __stringStartsWith, 
    core.stringEndsWith = __stringEndsWith, core.formatString = __formatString, core.parent = breeze, 
    breeze.core = core;
    var Param = function() {
        function isNonEmptyString(context, v) {
            return null == v ? !1 : "string" == typeof v && v.length > 0;
        }
        function isTypeOf(context, v) {
            return null == v ? !1 : typeof v === context.typeName ? !0 : !1;
        }
        function isInstanceOf(context, v) {
            return null == v ? !1 : v instanceof context.type;
        }
        function hasProperty(context, v) {
            return null == v ? !1 : void 0 !== v[context.propertyName];
        }
        function isEnumOf(context, v) {
            return null == v ? !1 : context.enumType.contains(v);
        }
        function isRequired(context, v) {
            return context.allowNull ? void 0 !== v : null != v;
        }
        function isOptional(context, v) {
            if (null == v) return !0;
            var prevContext = context.prevContext;
            return prevContext ? prevContext.fn(prevContext, v) : !0;
        }
        function isOptionalMessage(context, v) {
            var prevContext = context.prevContext, element = prevContext ? " or it " + getMessage(prevContext, v) : "";
            return "is optional" + element;
        }
        function isArray(context, v) {
            if (!Array.isArray(v)) return !1;
            if (context.mustNotBeEmpty && 0 === v.length) return !1;
            var prevContext = context.prevContext;
            return prevContext ? v.every(function(v1) {
                return prevContext.fn(prevContext, v1);
            }) : !0;
        }
        function isArrayMessage(context, v) {
            var arrayDescr = context.mustNotBeEmpty ? "a nonEmpty array" : "an array", prevContext = context.prevContext, element = prevContext ? " where each element " + getMessage(prevContext, v) : "";
            return " must be " + arrayDescr + element;
        }
        function getMessage(context, v) {
            var msg = context.msg;
            return "function" == typeof msg && (msg = msg(context, v)), msg;
        }
        function addContext(that, context) {
            if (that._context) {
                for (var curContext = that._context; null != curContext.prevContext; ) curContext = curContext.prevContext;
                if (null === curContext.prevContext) return curContext.prevContext = context, that;
                if (null !== context.prevContext) throw new Error("Illegal construction - use 'or' to combine checks");
                context.prevContext = that._context;
            }
            return setContext(that, context);
        }
        function setContext(that, context) {
            return that._contexts[that._contexts.length - 1] = context, that._context = context, 
            that;
        }
        function exec(self) {
            var contexts = self._contexts;
            return null == contexts[contexts.length - 1] && contexts.pop(), 0 === contexts.length ? void 0 : contexts.some(function(context) {
                return context.fn(context, self.v);
            });
        }
        function throwConfigError(instance, message) {
            throw new Error(__formatString("Error configuring an instance of '%1'. %2", instance && instance._$typeName || "object", message));
        }
        var ctor = function(v, name) {
            this.v = v, this.name = name, this._contexts = [ null ];
        }, proto = ctor.prototype;
        return proto.isObject = function() {
            return this.isTypeOf("object");
        }, proto.isBoolean = function() {
            return this.isTypeOf("boolean");
        }, proto.isString = function() {
            return this.isTypeOf("string");
        }, proto.isNonEmptyString = function() {
            return addContext(this, {
                fn: isNonEmptyString,
                msg: "must be a nonEmpty string"
            });
        }, proto.isNumber = function() {
            return this.isTypeOf("number");
        }, proto.isFunction = function() {
            return this.isTypeOf("function");
        }, proto.isTypeOf = function(typeName) {
            return addContext(this, {
                fn: isTypeOf,
                typeName: typeName,
                msg: __formatString("must be a '%1'", typeName)
            });
        }, proto.isInstanceOf = function(type, typeName) {
            return typeName = typeName || type.prototype._$typeName, addContext(this, {
                fn: isInstanceOf,
                type: type,
                typeName: typeName,
                msg: __formatString("must be an instance of '%1'", typeName)
            });
        }, proto.hasProperty = function(propertyName) {
            return addContext(this, {
                fn: hasProperty,
                propertyName: propertyName,
                msg: __formatString("must have a '%1' property ", propertyName)
            });
        }, proto.isEnumOf = function(enumType) {
            return addContext(this, {
                fn: isEnumOf,
                enumType: enumType,
                msg: __formatString("must be an instance of the '%1' enumeration", enumType.name)
            });
        }, proto.isRequired = function(allowNull) {
            return addContext(this, {
                fn: isRequired,
                allowNull: allowNull,
                msg: "is required"
            });
        }, proto.isOptional = function() {
            var context = {
                fn: isOptional,
                prevContext: null,
                msg: isOptionalMessage
            };
            return addContext(this, context);
        }, proto.isNonEmptyArray = function() {
            return this.isArray(!0);
        }, proto.isArray = function(mustNotBeEmpty) {
            var context = {
                fn: isArray,
                mustNotBeEmpty: mustNotBeEmpty,
                prevContext: null,
                msg: isArrayMessage
            };
            return addContext(this, context);
        }, proto.or = function() {
            return this._contexts.push(null), this._context = null, this;
        }, proto.check = function(defaultValue) {
            var ok = exec(this);
            if (void 0 !== ok) {
                if (!ok) throw new Error(this.getMessage());
                return void 0 !== this.v ? this.v : defaultValue;
            }
        }, proto._addContext = function(context) {
            return addContext(this, context);
        }, proto.getMessage = function() {
            var that = this, message = this._contexts.map(function(context) {
                return getMessage(context, that.v);
            }).join(", or it ");
            return __formatString(this.MESSAGE_PREFIX, this.name) + " " + message;
        }, proto.withDefault = function(defaultValue) {
            return this.defaultValue = defaultValue, this;
        }, proto.whereParam = function(propName) {
            return this.parent.whereParam(propName);
        }, proto.applyAll = function(instance, checkOnly, allowUnknownProperty) {
            var parentTypeName = instance._$typeName;
            allowUnknownProperty = allowUnknownProperty || parentTypeName && this.parent.config._$typeName === parentTypeName;
            var clone = __extend({}, this.parent.config);
            if (this.parent.params.forEach(function(p) {
                allowUnknownProperty || delete clone[p.name];
                try {
                    p.check();
                } catch (e) {
                    throwConfigError(instance, e.message);
                }
                !checkOnly && p._applyOne(instance);
            }), !allowUnknownProperty) for (var key in clone) void 0 !== clone[key] && throwConfigError(instance, __formatString("Unknown property: '%1'.", key));
        }, proto._applyOne = function(instance) {
            void 0 !== this.v ? instance[this.name] = this.v : void 0 !== this.defaultValue && (instance[this.name] = this.defaultValue);
        }, proto.MESSAGE_PREFIX = "The '%1' parameter ", ctor;
    }(), assertParam = function(v, name) {
        return new Param(v, name);
    }, ConfigParam = function() {
        var ctor = function(config) {
            if ("object" != typeof config) throw new Error("Configuration parameter should be an object, instead it is a: " + typeof config);
            this.config = config, this.params = [];
        }, proto = ctor.prototype;
        return proto.whereParam = function(propName) {
            var param = new Param(this.config[propName], propName);
            return param.parent = this, this.params.push(param), param;
        }, ctor;
    }(), assertConfig = function(config) {
        return new ConfigParam(config);
    };
    core.Param = Param, core.assertParam = assertParam, core.assertConfig = assertConfig;
    var Enum = function() {
        function EnumSymbol() {}
        var ctor = function(name, methodObj) {
            this.name = name;
            var prototype = new EnumSymbol(methodObj);
            prototype.parentEnum = this, this._symbolPrototype = prototype, methodObj && Object.keys(methodObj).forEach(function(key) {
                prototype[key] = methodObj[key];
            });
        }, proto = ctor.prototype;
        return ctor.isSymbol = function(obj) {
            return obj instanceof EnumSymbol;
        }, proto.fromName = function(name) {
            return this[name];
        }, proto.addSymbol = function(propertiesObj) {
            var newSymbol = Object.create(this._symbolPrototype);
            return propertiesObj && Object.keys(propertiesObj).forEach(function(key) {
                newSymbol[key] = propertiesObj[key];
            }), setTimeout(function() {
                newSymbol.getName();
            }, 0), newSymbol;
        }, proto.seal = function() {
            this.getSymbols().forEach(function(sym) {
                return sym.getName();
            });
        }, proto.getSymbols = function() {
            return this.getNames().map(function(key) {
                return this[key];
            }, this);
        }, proto.getNames = function() {
            var result = [];
            for (var key in this) this.hasOwnProperty(key) && ("name" === key || "_" === key.substr(0, 1) || __isFunction(this[key]) || result.push(key));
            return result;
        }, proto.contains = function(sym) {
            return sym instanceof EnumSymbol ? this[sym.getName()] === sym : !1;
        }, EnumSymbol.prototype.getName = function() {
            if (!this.name) {
                var that = this;
                this.name = __arrayFirst(this.parentEnum.getNames(), function(name) {
                    return that.parentEnum[name] === that;
                });
            }
            return this.name;
        }, EnumSymbol.prototype.toString = function() {
            return this.getName();
        }, EnumSymbol.prototype.toJSON = function() {
            return {
                _$typeName: this.parentEnum.name,
                name: this.name
            };
        }, ctor;
    }();
    core.Enum = Enum;
    var Event = function() {
        function publishCore(that, data, errorCallback) {
            var subscribers = that._subscribers;
            return subscribers ? (subscribers.forEach(function(s) {
                try {
                    s.callback(data);
                } catch (e) {
                    e.context = "unable to publish on topic: " + that.name, errorCallback ? errorCallback(e) : that._defaultErrorCallback ? that._defaultErrorCallback(e) : fallbackErrorHandler(e);
                }
            }), void 0) : !0;
        }
        function fallbackErrorHandler() {}
        var __eventNameMap = {}, __nextUnsubKey = 1, ctor = function(name, publisher, defaultErrorCallback) {
            assertParam(name, "eventName").isNonEmptyString().check(), assertParam(publisher, "publisher").isObject().check(), 
            this.name = name, __eventNameMap[name] = !0, this.publisher = publisher, defaultErrorCallback && (this._defaultErrorCallback = defaultErrorCallback);
        }, proto = ctor.prototype;
        return proto.publish = function(data, publishAsync, errorCallback) {
            return ctor._isEnabled(this.name, this.publisher) ? (publishAsync === !0 ? setTimeout(publishCore, 0, this, data, errorCallback) : publishCore(this, data, errorCallback), 
            !0) : !1;
        }, proto.publishAsync = function(data, errorCallback) {
            this.publish(data, !0, errorCallback);
        }, proto.subscribe = function(callback) {
            this._subscribers || (this._subscribers = []);
            var unsubKey = __nextUnsubKey;
            return this._subscribers.push({
                unsubKey: unsubKey,
                callback: callback
            }), ++__nextUnsubKey, unsubKey;
        }, proto.unsubscribe = function(unsubKey) {
            if (!this._subscribers) return !1;
            var subs = this._subscribers, ix = __arrayIndexOf(subs, function(s) {
                return s.unsubKey === unsubKey;
            });
            return -1 !== ix ? (subs.splice(ix, 1), 0 === subs.length && (this._subscribers = null), 
            !0) : !1;
        }, proto.clear = function() {
            this._subscribers = null;
        }, ctor.bubbleEvent = function(target, getParentFn) {
            target._getEventParent = getParentFn;
        }, ctor.enable = function(eventName, obj, isEnabled) {
            assertParam(eventName, "eventName").isNonEmptyString().check(), assertParam(obj, "obj").isObject().check(), 
            assertParam(isEnabled, "isEnabled").isBoolean().isOptional().or().isFunction().check(), 
            obj._$eventMap || (obj._$eventMap = {}), obj._$eventMap[eventName] = isEnabled;
        }, ctor.isEnabled = function(eventName, obj) {
            if (assertParam(eventName, "eventName").isNonEmptyString().check(), assertParam(obj, "obj").isObject().check(), 
            !obj._getEventParent) throw new Error("This object does not support event enabling/disabling");
            return ctor._isEnabled(obj, eventName);
        }, ctor._isEnabled = function(eventName, obj) {
            var isEnabled = null, eventMap = obj._$eventMap;
            if (eventMap && (isEnabled = eventMap[eventName]), null != isEnabled) return "function" == typeof isEnabled ? isEnabled(obj) : !!isEnabled;
            var parent = obj._getEventParent && obj._getEventParent();
            return parent ? ctor._isEnabled(eventName, parent) : !0;
        }, ctor;
    }();
    core.Event = Event;
    var __config = function() {
        function initializeAdapterInstanceCore(interfaceDef, impl, isDefault) {
            var instance = impl.defaultInstance;
            return instance || (instance = new impl.ctor(), impl.defaultInstance = instance, 
            instance._$impl = impl), instance.initialize(), isDefault && (interfaceDef.defaultInstance = instance), 
            __config.interfaceInitialized.publish({
                interfaceName: interfaceDef.name,
                instance: instance,
                isDefault: !0
            }), instance.checkForRecomposition && __config.interfaceInitialized.subscribe(function(interfaceInitializedArgs) {
                instance.checkForRecomposition(interfaceInitializedArgs);
            }), instance;
        }
        function getInterfaceDef(interfaceName) {
            var lcName = interfaceName.toLowerCase(), kv = __objectFirst(__config.interfaceRegistry || {}, function(k) {
                return k.toLowerCase() === lcName;
            });
            if (!kv) throw new Error("Unknown interface name: " + interfaceName);
            return kv.value;
        }
        var __config = {};
        __config.functionRegistry = {}, __config.typeRegistry = {}, __config.objectRegistry = {}, 
        __config.interfaceInitialized = new Event("interfaceInitialized", __config);
        var InterfaceDef = function(name) {
            this.name = name, this.defaultInstance = null, this._implMap = {};
        };
        return InterfaceDef.prototype.registerCtor = function(adapterName, ctor) {
            this._implMap[adapterName.toLowerCase()] = {
                ctor: ctor,
                defaultInstance: null
            };
        }, InterfaceDef.prototype.getImpl = function(adapterName) {
            return this._implMap[adapterName.toLowerCase()];
        }, InterfaceDef.prototype.getFirstImpl = function() {
            var kv = __objectFirst(this._implMap, function() {
                return !0;
            });
            return kv ? kv.value : null;
        }, __config.interfaceRegistry = {
            ajax: new InterfaceDef("ajax"),
            modelLibrary: new InterfaceDef("modelLibrary"),
            dataService: new InterfaceDef("dataService")
        }, __config.interfaceRegistry.modelLibrary.getDefaultInstance = function() {
            if (!this.defaultInstance) throw new Error("Unable to locate the default implementation of the '" + this.name + "' interface.  Possible options are 'ko', 'backingStore' or 'backbone'. See the breeze.config.initializeAdapterInstances method.");
            return this.defaultInstance;
        }, __config.setProperties = function(config) {
            assertConfig(config).whereParam("remoteAccessImplementation").isOptional().whereParam("trackingImplementation").isOptional().whereParam("ajaxImplementation").isOptional().applyAll(config), 
            config.remoteAccessImplementation && __config.initializeAdapterInstance("dataService", config.remoteAccessImplementation), 
            config.trackingImplementation && __config.initializeAdapterInstance("modelLibrary", config.trackingImplementation), 
            config.ajaxImplementation && __config.initializeAdapterInstance("ajax", config.ajaxImplementation);
        }, __config.registerAdapter = function(interfaceName, adapterCtor) {
            assertParam(interfaceName, "interfaceName").isNonEmptyString().check(), assertParam(adapterCtor, "adapterCtor").isFunction().check();
            var impl = new adapterCtor(), implName = impl.name;
            if (!implName) throw new Error("Unable to locate a 'name' property on the constructor passed into the 'registerAdapter' call.");
            var idef = getInterfaceDef(interfaceName);
            idef.registerCtor(implName, adapterCtor);
        }, __config.getAdapter = function(interfaceName, adapterName) {
            var idef = getInterfaceDef(interfaceName);
            if (adapterName) {
                var impl = idef.getImpl(adapterName);
                return impl ? impl.ctor : null;
            }
            return idef.defaultInstance ? idef.defaultInstance._$impl.ctor : null;
        }, __config.initializeAdapterInstances = function(config) {
            return assertConfig(config).whereParam("dataService").isOptional().whereParam("modelLibrary").isOptional().whereParam("ajax").isOptional().applyAll(this, !1), 
            __objectMapToArray(config, __config.initializeAdapterInstance);
        }, __config.initializeAdapterInstance = function(interfaceName, adapterName, isDefault) {
            isDefault = void 0 === isDefault ? !0 : isDefault, assertParam(interfaceName, "interfaceName").isNonEmptyString().check(), 
            assertParam(adapterName, "adapterName").isNonEmptyString().check(), assertParam(isDefault, "isDefault").isBoolean().check();
            var idef = getInterfaceDef(interfaceName), impl = idef.getImpl(adapterName);
            if (!impl) throw new Error("Unregistered adapter.  Interface: " + interfaceName + " AdapterName: " + adapterName);
            return initializeAdapterInstanceCore(idef, impl, isDefault);
        }, __config.getAdapterInstance = function(interfaceName, adapterName) {
            var impl, idef = getInterfaceDef(interfaceName);
            return adapterName && "" !== adapterName ? (impl = idef.getImpl(adapterName), impl ? impl.defaultInstance : null) : idef.defaultInstance ? idef.defaultInstance : (impl = idef.getFirstImpl(), 
            impl.defaultInstance ? impl.defaultInstance : initializeAdapterInstanceCore(idef, impl, !0));
        }, __config.registerFunction = function(fn, fnName) {
            assertParam(fn, "fn").isFunction().check(), assertParam(fnName, "fnName").isString().check(), 
            fn.prototype._$fnName = fnName, __config.functionRegistry[fnName] = fn;
        }, __config._storeObject = function(obj, type, name) {
            var key = ("string" == typeof type ? type : type.prototype._$typeName) + "." + name;
            __config.objectRegistry[key] = obj;
        }, __config._fetchObject = function(type, name) {
            if (!name) return void 0;
            var key = ("string" == typeof type ? type : type.prototype._$typeName) + "." + name, result = __config.objectRegistry[key];
            if (!result) throw new Error("Unable to locate a registered object by the name: " + key);
            return result;
        }, __config.registerType = function(ctor, typeName) {
            assertParam(ctor, "ctor").isFunction().check(), assertParam(typeName, "typeName").isString().check(), 
            ctor.prototype._$typeName = typeName, __config.typeRegistry[typeName] = ctor;
        }, __config.stringifyPad = "  ", __config;
    }(), __modelLibraryDef = __config.interfaceRegistry.modelLibrary;
    core.config = __config, breeze.config = __config;
    var observableArray = function() {
        function updateEntityState(obsArray) {
            var entityAspect = obsArray.getEntityAspect();
            entityAspect.entityState.isUnchanged() && entityAspect.setModified(), entityAspect.entityState.isModified() && !obsArray._origValues && (obsArray._origValues = obsArray.slice(0));
        }
        function processAdds(obsArray, adds) {
            obsArray._processAdds(adds), publish(obsArray, "arrayChanged", {
                array: obsArray,
                added: adds
            });
        }
        function processRemoves(obsArray, removes) {
            obsArray._processRemoves(removes), publish(obsArray, "arrayChanged", {
                array: obsArray,
                removed: removes
            });
        }
        function publish(publisher, eventName, eventArgs) {
            var pendingPubs = publisher._getPendingPubs();
            pendingPubs ? publisher._pendingArgs ? combineArgs(publisher._pendingArgs, eventArgs) : (publisher._pendingArgs = eventArgs, 
            pendingPubs.push(function() {
                publisher[eventName].publish(publisher._pendingArgs), publisher._pendingArgs = null;
            })) : publisher[eventName].publish(eventArgs);
        }
        function combineArgs(target, source) {
            for (var key in source) if ("array" !== key && target.hasOwnProperty(key)) {
                var sourceValue = source[key], targetValue = target[key];
                if (targetValue) {
                    if (!Array.isArray(targetValue)) throw new Error("Cannot combine non array args");
                    Array.prototype.push.apply(targetValue, sourceValue);
                } else target[key] = sourceValue;
            }
        }
        function initializeParent(obsArray, parent, parentProperty) {
            obsArray.parent = parent, obsArray.parentProperty = parentProperty;
        }
        var mixin = {};
        return mixin.push = function() {
            if (this._inProgress) return -1;
            var goodAdds = this._getGoodAdds(__arraySlice(arguments));
            if (!goodAdds.length) return this.length;
            this._beforeChange();
            var result = Array.prototype.push.apply(this, goodAdds);
            return processAdds(this, goodAdds), result;
        }, mixin._push = function() {
            if (this._inProgress) return -1;
            var goodAdds = __arraySlice(arguments);
            this._beforeChange();
            var result = Array.prototype.push.apply(this, goodAdds);
            return processAdds(this, goodAdds), result;
        }, mixin.unshift = function() {
            var goodAdds = this._getGoodAdds(__arraySlice(arguments));
            if (!goodAdds.length) return this.length;
            this._beforeChange();
            var result = Array.prototype.unshift.apply(this, goodAdds);
            return processAdds(this, __arraySlice(goodAdds)), result;
        }, mixin.pop = function() {
            this._beforeChange();
            var result = Array.prototype.pop.apply(this);
            return processRemoves(this, [ result ]), result;
        }, mixin.shift = function() {
            this._beforeChange();
            var result = Array.prototype.shift.apply(this);
            return processRemoves(this, [ result ]), result;
        }, mixin.splice = function() {
            var goodAdds = this._getGoodAdds(__arraySlice(arguments, 2)), newArgs = __arraySlice(arguments, 0, 2).concat(goodAdds);
            this._beforeChange();
            var result = Array.prototype.splice.apply(this, newArgs);
            return processRemoves(this, result), goodAdds.length && processAdds(this, goodAdds), 
            result;
        }, mixin.getEntityAspect = function() {
            return this.parent.entityAspect || this.parent.complexAspect.getEntityAspect();
        }, mixin._getEventParent = function() {
            return this.getEntityAspect();
        }, mixin._getPendingPubs = function() {
            var em = this.getEntityAspect().entityManager;
            return em && em._pendingPubs;
        }, mixin._beforeChange = function() {}, {
            mixin: mixin,
            publish: publish,
            updateEntityState: updateEntityState,
            initializeParent: initializeParent
        };
    }(), Validator = function() {
        function luhn(a, b, c, d, e) {
            for (d = +a[b = a.length - 1], e = 0; b--; ) c = +a[b], d += ++e % 2 ? 2 * c % 10 + (c > 4) : c;
            return !(d % 10);
        }
        function makeRegExpValidator(validatorName, expression, defaultMessage, context) {
            defaultMessage && (ctor.messageTemplates[validatorName] = defaultMessage);
            var re = "string" == typeof expression ? new RegExp(expression) : expression, valFn = function(v) {
                return null == v || "" === v ? !0 : "string" != typeof v ? !1 : re.test(v);
            };
            return new ctor(validatorName, valFn, context);
        }
        function formatTemplate(template, vars, ownPropertiesOnly) {
            return vars ? template.replace(/%([^%]+)%/g, function(_, key) {
                var valOrFn;
                return valOrFn = ownPropertiesOnly ? vars.hasOwnProperty(key) ? vars[key] : "" : vars[key], 
                valOrFn ? __isFunction(valOrFn) ? valOrFn(vars) : valOrFn : "";
            }) : template;
        }
        function intRangeValidatorCtor(validatorName, minValue, maxValue, context) {
            return ctor.messageTemplates[validatorName] = __formatString("'%displayName%' must be an integer between the values of %1 and %2", minValue, maxValue), 
            function() {
                var valFn = function(v, ctx) {
                    return null == v ? !0 : ("string" == typeof v && ctx && ctx.allowString && (v = parseInt(v, 0)), 
                    "number" != typeof v || isNaN(v) || Math.floor(v) !== v ? !1 : null != minValue && minValue > v ? !1 : null != maxValue && v > maxValue ? !1 : !0);
                };
                return new ctor(validatorName, valFn, context);
            };
        }
        var INT16_MIN = -32768, INT16_MAX = 32767, INT32_MIN = -2147483648, INT32_MAX = 2147483647, BYTE_MIN = 0, BYTE_MAX = 255, rootContext = {
            displayName: function(context) {
                return context.property ? context.property.displayName || context.propertyName || context.property.name : "Value";
            }
        }, ctor = function(name, valFn, context) {
            this._baseContext = context || {}, this._baseContext.name = name, context = __extend(Object.create(rootContext), this._baseContext), 
            context.messageTemplate = context.messageTemplate || ctor.messageTemplates[name], 
            this.name = name, this.valFn = valFn, this.context = context;
        }, proto = ctor.prototype;
        return proto._$typeName = "Validator", proto.validate = function(value, additionalContext) {
            var currentContext;
            currentContext = additionalContext ? __extend(Object.create(this.context), additionalContext) : this.context, 
            this.currentContext = currentContext;
            try {
                return this.valFn(value, currentContext) ? null : (currentContext.value = value, 
                new ValidationError(this, currentContext, this.getMessage()));
            } catch (e) {
                return new ValidationError(this, currentContext, "Exception occured while executing this validator: " + this.name);
            }
        }, proto.getMessage = function() {
            try {
                var context = this.currentContext, message = context.message;
                return message ? "function" == typeof message ? message(context) : message : context.messageTemplate ? formatTemplate(context.messageTemplate, context) : "invalid value: " + this.name || "{unnamed validator}";
            } catch (e) {
                return "Unable to format error message" + e.toString();
            }
        }, proto.toJSON = function() {
            return this._baseContext;
        }, ctor.fromJSON = function(json) {
            var validatorName = "Validator." + json.name, fn = __config.functionRegistry[validatorName];
            if (!fn) throw new Error("Unable to locate a validator named:" + json.name);
            return fn(json);
        }, ctor.register = function(validator) {
            __config.registerFunction(function() {
                return validator;
            }, "Validator." + validator.name);
        }, ctor.registerFactory = function(validatorFn, name) {
            __config.registerFunction(validatorFn, "Validator." + name);
        }, ctor.messageTemplates = {
            bool: "'%displayName%' must be a 'true' or 'false' value",
            creditCard: "The %displayName% is not a valid credit card number",
            date: "'%displayName%' must be a date",
            duration: "'%displayName%' must be a ISO8601 duration string, such as 'P3H24M60S'",
            emailAddress: "The %displayName% '%value%' is not a valid email address",
            guid: "'%displayName%' must be a GUID",
            integer: "'%displayName%' must be an integer",
            integerRange: "'%displayName%' must be an integer between the values of %minValue% and %maxValue%",
            maxLength: "'%displayName%' must be a string with %maxLength% characters or less",
            number: "'%displayName%' must be a number",
            phone: "The %displayName% '%value%' is not a valid phone number",
            regularExpression: "The %displayName% '%value%' does not match '%expression%'",
            required: "'%displayName%' is required",
            string: "'%displayName%' must be a string",
            stringLength: "'%displayName%' must be a string with between %minLength% and %maxLength% characters",
            url: "The %displayName% '%value%' is not a valid url"
        }, ctor.required = function() {
            var valFn = function(v, ctx) {
                return "string" == typeof v ? ctx && ctx.allowEmptyStrings ? !0 : v.length > 0 : null != v;
            };
            return new ctor("required", valFn);
        }, ctor.maxLength = function(context) {
            var valFn = function(v, ctx) {
                return null == v ? !0 : "string" != typeof v ? !1 : v.length <= ctx.maxLength;
            };
            return new ctor("maxLength", valFn, context);
        }, ctor.stringLength = function(context) {
            var valFn = function(v, ctx) {
                return null == v ? !0 : "string" != typeof v ? !1 : null != ctx.minLength && v.length < ctx.minLength ? !1 : null != ctx.maxLength && v.length > ctx.maxLength ? !1 : !0;
            };
            return new ctor("stringLength", valFn, context);
        }, ctor.string = function() {
            var valFn = function(v) {
                return null == v ? !0 : "string" == typeof v;
            };
            return new ctor("string", valFn);
        }, ctor.guid = function() {
            var valFn = function(v) {
                return null == v ? !0 : __isGuid(v);
            };
            return new ctor("guid", valFn);
        }, ctor.duration = function() {
            var valFn = function(v) {
                return null == v ? !0 : __isDuration(v);
            };
            return new ctor("duration", valFn);
        }, ctor.number = ctor.double = ctor.single = function(context) {
            var valFn = function(v, ctx) {
                return null == v ? !0 : ("string" == typeof v && ctx && ctx.allowString && (v = parseInt(v, 10)), 
                "number" == typeof v && !isNaN(v));
            };
            return new ctor("number", valFn, context);
        }, ctor.integer = ctor.int64 = function(context) {
            var valFn = function(v, ctx) {
                return null == v ? !0 : ("string" == typeof v && ctx && ctx.allowString && (v = parseInt(v, 10)), 
                "number" == typeof v && !isNaN(v) && Math.floor(v) === v);
            };
            return new ctor("integer", valFn, context);
        }, ctor.int32 = function(context) {
            return intRangeValidatorCtor("int32", INT32_MIN, INT32_MAX, context)();
        }, ctor.int16 = function(context) {
            return intRangeValidatorCtor("int16", INT16_MIN, INT16_MAX, context)();
        }, ctor.byte = function(context) {
            return intRangeValidatorCtor("byte", BYTE_MIN, BYTE_MAX, context)();
        }, ctor.bool = function() {
            var valFn = function(v) {
                return null == v ? !0 : v === !0 || v === !1;
            };
            return new ctor("bool", valFn);
        }, ctor.none = function() {
            var valFn = function() {
                return !0;
            };
            return new ctor("none", valFn);
        }, ctor.date = function() {
            var valFn = function(v) {
                if (null == v) return !0;
                if ("string" != typeof v) return __isDate(v);
                try {
                    return !isNaN(Date.parse(v));
                } catch (e) {
                    return !1;
                }
            };
            return new ctor("date", valFn);
        }, ctor.creditCard = function(context) {
            function valFn(v) {
                return null == v || "" === v ? !0 : "string" != typeof v ? !1 : (v = v.replace(/(\-|\s)/g, ""), 
                !v || /\D/.test(v) ? !1 : luhn(v));
            }
            return new ctor("creditCard", valFn, context);
        }, ctor.regularExpression = function(context) {
            function valFn(v, ctx) {
                if (null == v || "" === v) return !0;
                if ("string" != typeof v) return !1;
                try {
                    var re = new RegExp(ctx.expression);
                } catch (e) {
                    throw new Error("Missing or invalid expression parameter to regExp validator");
                }
                return re.test(v);
            }
            return new ctor("regularExpression", valFn, context);
        }, ctor.emailAddress = function(context) {
            var reEmailAddress = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/;
            return makeRegExpValidator("emailAddress", reEmailAddress, null, context);
        }, ctor.phone = function(context) {
            var rePhone = /^((\+|(0(\d+)?[-/.\s]?))[1-9]\d{0,2}[-/.\s]?)?((\(\d{1,6}\)|\d{1,6})[-/.\s]?)?(\d+[-/.\s]?)+\d+$/;
            return makeRegExpValidator("phone", rePhone, null, context);
        }, ctor.url = function(context) {
            var reUrlProtocolRequired = /^(https?|ftp):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-fA-F]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|([a-zA-Z][\-a-zA-Z0-9]*)|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-fA-F]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-fA-F]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-fA-F]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-fA-F]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/;
            return makeRegExpValidator("url", reUrlProtocolRequired, null, context);
        }, ctor.makeRegExpValidator = makeRegExpValidator, __objectForEach(ctor, function(key, value) {
            "function" == typeof value && "fromJSON" !== key && "register" !== key && "registerFactory" !== key && "makeRegExpValidator" !== key && __config.registerFunction(value, "Validator." + key);
        }), ctor;
    }(), ValidationError = function() {
        var ctor = function(validator, context, errorMessage, key) {
            assertParam(validator, "validator").isOptional().isInstanceOf(Validator).check(), 
            assertParam(errorMessage, "errorMessage").isNonEmptyString().check(), assertParam(key, "key").isOptional().isNonEmptyString().check(), 
            this.validator = validator;
            var context = context || {};
            this.context = context, this.errorMessage = errorMessage, this.property = context.property, 
            this.propertyName = context.propertyName || context.property && context.property.name, 
            this.key = key ? key : ValidationError.getKey(validator || errorMessage, this.propertyName), 
            this.isServerError = !1;
        };
        return ctor.getKey = function(validatorOrErrorName, propertyName) {
            return (validatorOrErrorName.name || validatorOrErrorName) + (propertyName ? ":" + propertyName : "");
        }, ctor;
    }();
    breeze.Validator = Validator, breeze.ValidationError = ValidationError;
    var ValidationOptions = function() {
        function updateWithConfig(obj, config) {
            return config && assertConfig(config).whereParam("validateOnAttach").isBoolean().isOptional().whereParam("validateOnSave").isBoolean().isOptional().whereParam("validateOnQuery").isBoolean().isOptional().whereParam("validateOnPropertyChange").isBoolean().isOptional().applyAll(obj), 
            obj;
        }
        var ctor = function(config) {
            updateWithConfig(this, config);
        }, proto = ctor.prototype;
        return proto._$typeName = "ValidationOptions", proto.using = function(config) {
            if (!config) return this;
            var result = new ValidationOptions(this);
            return updateWithConfig(result, config), result;
        }, proto.setAsDefault = function() {
            return __setAsDefault(this, ctor);
        }, ctor.defaultInstance = new ctor({
            validateOnAttach: !0,
            validateOnSave: !0,
            validateOnQuery: !1,
            validateOnPropertyChange: !0
        }), ctor;
    }();
    breeze.ValidationOptions = ValidationOptions, breeze.makeComplexArray = function() {
        function getGoodAdds(complexArray, adds) {
            return adds.filter(function(a) {
                return a.parent !== complexArray.parent;
            });
        }
        function processAdds(complexArray, adds) {
            adds.forEach(function(a) {
                if (null != a.parent) throw new Error("The complexObject is already attached. Either clone it or remove it from its current owner");
                setAspect(a, complexArray);
            });
        }
        function processRemoves(complexArray, removes) {
            removes.forEach(function(a) {
                clearAspect(a, complexArray);
            });
        }
        function clearAspect(co, arr) {
            var coAspect = co.complexAspect;
            return coAspect.parent !== arr.parent ? null : (coAspect.parent = null, coAspect.parentProperty = null, 
            coAspect);
        }
        function setAspect(co, arr) {
            var coAspect = co.complexAspect;
            return coAspect.parent === arr.parent ? null : (coAspect.parent = arr.parent, coAspect.parentProperty = arr.parentProperty, 
            coAspect);
        }
        function makeComplexArray(arr, parent, parentProperty) {
            return observableArray.initializeParent(arr, parent, parentProperty), arr.arrayChanged = new Event("arrayChanged", arr), 
            __extend(arr, observableArray.mixin), __extend(arr, complexArrayMixin);
        }
        var complexArrayMixin = {};
        return complexArrayMixin._getGoodAdds = function(adds) {
            return getGoodAdds(this, adds);
        }, complexArrayMixin._beforeChange = function() {
            observableArray.updateEntityState(this);
        }, complexArrayMixin._processAdds = function(adds) {
            processAdds(this, adds);
        }, complexArrayMixin._processRemoves = function(removes) {
            processRemoves(this, removes);
        }, complexArrayMixin._rejectChanges = function() {
            if (this._origValues) {
                var that = this;
                this.forEach(function(co) {
                    clearAspect(co, that);
                }), this.length = 0, this._origValues.forEach(function(co) {
                    that.push(co);
                }), Array.prototype.push.apply(this, this._origValues);
            }
        }, complexArrayMixin._acceptChanges = function() {
            this._origValues = null;
        }, makeComplexArray;
    }();
    var EntityAction = function() {
        var entityActionMethods = {
            isAttach: function() {
                return !!this.isAttach;
            },
            isDetach: function() {
                return !!this.isDetach;
            },
            isModification: function() {
                return !!this.isModification;
            }
        }, EntityAction = new Enum("EntityAction", entityActionMethods);
        return EntityAction.Attach = EntityAction.addSymbol({
            isAttach: !0
        }), EntityAction.AttachOnQuery = EntityAction.addSymbol({
            isAttach: !0
        }), EntityAction.AttachOnImport = EntityAction.addSymbol({
            isAttach: !0
        }), EntityAction.Detach = EntityAction.addSymbol({
            isDetach: !0
        }), EntityAction.MergeOnQuery = EntityAction.addSymbol({
            isModification: !0
        }), EntityAction.MergeOnImport = EntityAction.addSymbol({
            isModification: !0
        }), EntityAction.MergeOnSave = EntityAction.addSymbol({
            isModification: !0
        }), EntityAction.PropertyChange = EntityAction.addSymbol({
            isModification: !0
        }), EntityAction.EntityStateChange = EntityAction.addSymbol(), EntityAction.AcceptChanges = EntityAction.addSymbol(), 
        EntityAction.RejectChanges = EntityAction.addSymbol({
            isModification: !0
        }), EntityAction.Clear = EntityAction.addSymbol({
            isDetach: !0
        }), EntityAction.seal(), EntityAction;
    }();
    breeze.EntityAction = EntityAction;
    var EntityAspect = function() {
        function rejectChangesCore(target) {
            var aspect = target.entityAspect || target.complexAspect, stype = target.entityType || target.complexType, originalValues = aspect.originalValues;
            for (var propName in originalValues) target.setProperty(propName, originalValues[propName]);
            stype.complexProperties.forEach(function(cp) {
                var cos = target.getProperty(cp.name);
                cp.isScalar ? rejectChangesCore(cos) : (cos._rejectChanges(), cos.forEach(function(co) {
                    rejectChangesCore(co);
                }));
            });
        }
        function clearOriginalValues(target) {
            var aspect = target.entityAspect || target.complexAspect;
            aspect.originalValues = {};
            var stype = target.entityType || target.complexType;
            stype.complexProperties.forEach(function(cp) {
                var cos = target.getProperty(cp.name);
                cp.isScalar ? clearOriginalValues(cos) : (cos._acceptChanges(), cos.forEach(function(co) {
                    clearOriginalValues(co);
                }));
            });
        }
        function validateTarget(target) {
            var ok = !0, stype = target.entityType || target.complexType, aspect = target.entityAspect || target.complexAspect, entityAspect = target.entityAspect || target.complexAspect.getEntityAspect();
            return stype.getProperties().forEach(function(p) {
                var value = target.getProperty(p.name), propName = aspect.getPropertyPath(p.name);
                if (p.validators.length > 0) {
                    var context = {
                        entity: entityAspect.entity,
                        property: p,
                        propertyName: propName
                    };
                    ok = entityAspect._validateProperty(value, context) && ok;
                }
                p.isComplexProperty && p.isScalar && (ok = validateTarget(value) && ok);
            }), stype.validators.forEach(function(validator) {
                ok = validate(entityAspect, validator, aspect.entity) && ok;
            }), ok;
        }
        function removeFromRelations(entity, entityState) {
            var isDeleted = entityState.isDeleted();
            isDeleted ? removeFromRelationsCore(entity, !0) : __using(entity.entityAspect.entityManager, "isLoading", !0, function() {
                removeFromRelationsCore(entity, !1);
            });
        }
        function removeFromRelationsCore(entity, isDeleted) {
            entity.entityType.navigationProperties.forEach(function(np) {
                var inverseNp = np.inverse;
                if (inverseNp) {
                    var npValue = entity.getProperty(np.name);
                    if (np.isScalar) {
                        if (npValue) {
                            if (inverseNp.isScalar) clearNp(npValue, inverseNp, isDeleted); else {
                                var collection = npValue.getProperty(inverseNp.name);
                                collection.length && __arrayRemoveItem(collection, entity);
                            }
                            entity.setProperty(np.name, null);
                        }
                    } else npValue.slice(0).forEach(function(v) {
                        inverseNp.isScalar && clearNp(v, inverseNp, isDeleted);
                    }), npValue.length = 0;
                }
            });
        }
        function clearNp(entity, np, relatedIsDeleted) {
            if (relatedIsDeleted) entity.setProperty(np.name, null); else {
                var fkNames = (entity.entityAspect.entityManager, np.foreignKeyNames);
                if (fkNames) var fkVals = fkNames.map(function(fkName) {
                    return entity.getProperty(fkName);
                });
                entity.setProperty(np.name, null), fkNames && fkNames.forEach(function(fkName, i) {
                    entity.setProperty(fkName, fkVals[i]);
                });
            }
        }
        function validate(aspect, validator, value, context) {
            var ve = validator.validate(value, context);
            if (ve) return aspect._addValidationError(ve), !1;
            var key = ValidationError.getKey(validator, context ? context.propertyName : null);
            return aspect._removeValidationError(key), !0;
        }
        var ctor = function(entity) {
            if (null === entity) {
                var nullInstance = EntityAspect._nullInstance;
                if (nullInstance) return nullInstance;
                EntityAspect._nullInstance = this;
            } else {
                if (void 0 === entity) throw new Error("The EntityAspect ctor requires an entity as its only argument.");
                if (entity.entityAspect) return entity.entityAspect;
            }
            if (!(this instanceof EntityAspect)) return new EntityAspect(entity);
            if (this.entity = entity, this.entityGroup = null, this.entityManager = null, this.entityState = EntityState.Detached, 
            this.isBeingSaved = !1, this.originalValues = {}, this.hasValidationErrors = !1, 
            this._validationErrors = {}, this.validationErrorsChanged = new Event("validationErrorsChanged", this), 
            this.propertyChanged = new Event("propertyChanged", this), null != entity) {
                entity.entityAspect = this;
                var entityType = entity.entityType;
                if (!entityType) {
                    var typeName = entity.prototype._$typeName;
                    throw typeName ? new Error("Metadata for this entityType has not yet been resolved: " + typeName) : new Error("This entity is not registered as a valid EntityType");
                }
                var entityCtor = entityType.getEntityCtor();
                __modelLibraryDef.getDefaultInstance().startTracking(entity, entityCtor.prototype);
            }
        }, proto = ctor.prototype;
        return Event.bubbleEvent(proto, function() {
            return this.entityManager;
        }), proto.getKey = function(forceRefresh) {
            if (forceRefresh = assertParam(forceRefresh, "forceRefresh").isBoolean().isOptional().check(!1), 
            forceRefresh || !this._entityKey) {
                var entityType = this.entity.entityType, keyProps = entityType.keyProperties, values = keyProps.map(function(p) {
                    return this.entity.getProperty(p.name);
                }, this);
                this._entityKey = new EntityKey(entityType, values);
            }
            return this._entityKey;
        }, proto.acceptChanges = function() {
            var em = this.entityManager;
            this.entityState.isDeleted() ? em.detachEntity(this.entity) : this.setUnchanged(), 
            em.entityChanged.publish({
                entityAction: EntityAction.AcceptChanges,
                entity: this.entity
            });
        }, proto.rejectChanges = function() {
            var entity = this.entity, entityManager = this.entityManager;
            __using(entityManager, "isRejectingChanges", !0, function() {
                rejectChangesCore(entity);
            }), this.entityState.isAdded() ? (entityManager.detachEntity(entity), entityManager._notifyStateChange(entity, !1)) : (this.entityState.isDeleted() && this.entityManager._linkRelatedEntities(entity), 
            this.setUnchanged(), this.propertyChanged.publish({
                entity: entity,
                propertyName: null
            }), this.entityManager.entityChanged.publish({
                entityAction: EntityAction.RejectChanges,
                entity: entity
            }));
        }, proto.getPropertyPath = function(propName) {
            return propName;
        }, proto.setUnchanged = function() {
            clearOriginalValues(this.entity), delete this.hasTempKey, this.entityState = EntityState.Unchanged, 
            this.entityManager._notifyStateChange(this.entity, !1);
        }, proto.setModified = function() {
            this.entityState = EntityState.Modified, this.entityManager._notifyStateChange(this.entity, !0);
        }, proto.setDeleted = function() {
            var em = this.entityManager, entity = this.entity;
            this.entityState.isAdded() ? (em.detachEntity(entity), em._notifyStateChange(entity, !1)) : (this.entityState = EntityState.Deleted, 
            removeFromRelations(entity, EntityState.Deleted), em._notifyStateChange(entity, !0));
        }, proto.setDetached = function() {
            var group = this.entityGroup;
            if (!group) return !1;
            var entity = this.entity;
            return group.detachEntity(entity), removeFromRelations(entity, EntityState.Detached), 
            this.entityManager.entityChanged.publish({
                entityAction: EntityAction.Detach,
                entity: entity
            }), this._detach(), !0;
        }, proto.loadNavigationProperty = function(navigationProperty, callback, errorCallback) {
            var entity = this.entity, navProperty = entity.entityType._checkNavProperty(navigationProperty), query = EntityQuery.fromEntityNavigation(entity, navProperty, callback, errorCallback);
            return entity.entityAspect.entityManager.executeQuery(query, callback, errorCallback);
        }, proto.validateEntity = function() {
            var ok = !0;
            return this._processValidationOpAndPublish(function(that) {
                ok = validateTarget(that.entity);
            }), ok;
        }, proto.validateProperty = function(property, context) {
            var value = this.getPropertyValue(property);
            return value && value.complexAspect ? validateTarget(value) : (context = context || {}, 
            context.entity = this.entity, "string" == typeof property ? (context.property = this.entity.entityType.getProperty(property, !0), 
            context.propertyName = property) : (context.property = property, context.propertyName = property.name), 
            this._validateProperty(value, context));
        }, proto.getValidationErrors = function(property) {
            assertParam(property, "property").isOptional().isEntityProperty().or().isString().check();
            var result = __getOwnPropertyValues(this._validationErrors);
            if (property) {
                var propertyName = "string" == typeof property ? property : property.name;
                result = result.filter(function(ve) {
                    return ve.property.name === propertyName;
                });
            }
            return result;
        }, proto.addValidationError = function(validationError) {
            assertParam(validationError, "validationError").isInstanceOf(ValidationError).check(), 
            this._processValidationOpAndPublish(function(that) {
                that._addValidationError(validationError);
            });
        }, proto.removeValidationError = function(validationErrorOrKey) {
            assertParam(validationErrorOrKey, "validationErrorOrKey").isString().or().isInstanceOf(ValidationError).or().isInstanceOf(Validator).check();
            var key = "string" == typeof validationErrorOrKey ? validationErrorOrKey : validationErrorOrKey.key;
            this._processValidationOpAndPublish(function(that) {
                that._removeValidationError(key);
            });
        }, proto.clearValidationErrors = function() {
            this._processValidationOpAndPublish(function(that) {
                __objectForEach(that._validationErrors, function(key, valError) {
                    valError && (delete that._validationErrors[key], that._pendingValidationResult.removed.push(valError));
                }), that.hasValidationErrors = !__isEmpty(this._validationErrors);
            });
        }, proto.getParentKey = function(navigationProperty) {
            var fkNames = navigationProperty.foreignKeyNames;
            if (0 === fkNames.length) return null;
            var that = this, fkValues = fkNames.map(function(fkn) {
                return that.entity.getProperty(fkn);
            });
            return new EntityKey(navigationProperty.entityType, fkValues);
        }, proto.getPropertyValue = function(property) {
            assertParam(property, "property").isString().or().isEntityProperty().check();
            var value;
            if ("string" == typeof property) {
                var propNames = property.trim().split("."), propName = propNames.shift();
                for (value = this.entity, value = value.getProperty(propName); propNames.length > 0; ) propName = propNames.shift(), 
                value = value.getProperty(propName);
            } else {
                if (!(property.parentType instanceof EntityType)) throw new Error("The validateProperty method does not accept a 'property' parameter whose parentType is a ComplexType; Pass a 'property path' string as the 'property' parameter instead ");
                value = this.entity.getProperty(property.name);
            }
            return value;
        }, proto._detach = function() {
            this.entityGroup = null, this.entityManager = null, this.entityState = EntityState.Detached, 
            this.originalValues = {}, this._validationErrors = {}, this.hasValidationErrors = !1, 
            this.validationErrorsChanged.clear(), this.propertyChanged.clear();
        }, proto._validateProperty = function(value, context) {
            var ok = !0;
            return this._processValidationOpAndPublish(function(that) {
                context.property.validators.forEach(function(validator) {
                    ok = validate(that, validator, value, context) && ok;
                });
            }), ok;
        }, proto._processValidationOpAndPublish = function(validationFn) {
            if (this._pendingValidationResult) validationFn(this); else try {
                this._pendingValidationResult = {
                    entity: this.entity,
                    added: [],
                    removed: []
                }, validationFn(this), (this._pendingValidationResult.added.length > 0 || this._pendingValidationResult.removed.length > 0) && (this.validationErrorsChanged.publish(this._pendingValidationResult), 
                this.entityManager && this.entityManager.validationErrorsChanged.publish(this._pendingValidationResult));
            } finally {
                this._pendingValidationResult = void 0;
            }
        }, proto._addValidationError = function(validationError) {
            this._validationErrors[validationError.key] = validationError, this.hasValidationErrors = !0, 
            this._pendingValidationResult.added.push(validationError);
        }, proto._removeValidationError = function(key) {
            var valError = this._validationErrors[key];
            valError && (delete this._validationErrors[key], this.hasValidationErrors = !__isEmpty(this._validationErrors), 
            this._pendingValidationResult.removed.push(valError));
        }, ctor;
    }(), ComplexAspect = function() {
        var ctor = function(complexObject, parent, parentProperty) {
            if (!complexObject) throw new Error("The  ComplexAspect ctor requires an entity as its only argument.");
            if (complexObject.complexAspect) return complexObject.complexAspect;
            if (!(this instanceof ComplexAspect)) return new ComplexAspect(complexObject, parent, parentProperty);
            this.complexObject = complexObject, complexObject.complexAspect = this, this.originalValues = {}, 
            null != parent && (this.parent = parent, this.parentProperty = parentProperty);
            var complexType = complexObject.complexType;
            if (!complexType) {
                var typeName = complexObject.prototype._$typeName;
                throw typeName ? new Error("Metadata for this complexType has not yet been resolved: " + typeName) : new Error("This entity is not registered as a valid ComplexType");
            }
            var complexCtor = complexType.getCtor();
            __modelLibraryDef.getDefaultInstance().startTracking(complexObject, complexCtor.prototype);
        }, proto = ctor.prototype;
        return proto.getEntityAspect = function() {
            var parent = this.parent;
            if (!parent) return new EntityAspect(null);
            for (var entityAspect = parent.entityAspect; parent && !entityAspect; ) parent = parent.complexAspect && parent.complexAspect.parent, 
            entityAspect = parent && parent.entityAspect;
            return entityAspect || new EntityAspect(null);
        }, proto.getPropertyPath = function(propName) {
            var parent = this.parent;
            if (!parent) return null;
            var aspect = parent.complexAspect || parent.entityAspect;
            return aspect.getPropertyPath(this.parentProperty.name + "." + propName);
        }, ctor;
    }();
    breeze.EntityAspect = EntityAspect, breeze.ComplexAspect = ComplexAspect;
    var EntityKey = function() {
        function createKeyString(keyValues) {
            return keyValues.join(ENTITY_KEY_DELIMITER);
        }
        var ENTITY_KEY_DELIMITER = ":::", ctor = function(entityType, keyValues) {
            assertParam(entityType, "entityType").isInstanceOf(EntityType).check();
            var subtypes = entityType.getSelfAndSubtypes();
            subtypes.length > 1 && (this._subtypes = subtypes.filter(function(st) {
                return st.isAbstract === !1;
            })), Array.isArray(keyValues) || (keyValues = __arraySlice(arguments, 1)), this.entityType = entityType, 
            entityType.keyProperties.forEach(function(kp, i) {
                kp.dataType === DataType.Guid && (keyValues[i] = keyValues[i] && keyValues[i].toLowerCase());
            }), this.values = keyValues, this._keyInGroup = createKeyString(keyValues);
        };
        ctor._$typeName = "EntityKey";
        var proto = ctor.prototype;
        return proto.toJSON = function() {
            return {
                entityType: this.entityType.name,
                values: this.values
            };
        }, ctor.fromJSON = function(json, metadataStore) {
            var et = metadataStore._getEntityType(json.entityType, !0);
            return new EntityKey(et, json.values);
        }, proto.equals = function(entityKey) {
            return entityKey instanceof EntityKey ? this.entityType === entityKey.entityType && __arrayEquals(this.values, entityKey.values) : !1;
        }, proto.toString = function() {
            return this.entityType.name + "-" + this._keyInGroup;
        }, ctor.equals = function(k1, k2) {
            return k1 instanceof EntityKey ? k1.equals(k2) : !1;
        }, proto._isEmpty = function() {
            return 0 === this.values.join("").length;
        }, ctor.createKeyString = createKeyString, ctor;
    }();
    breeze.EntityKey = EntityKey;
    var EntityState = function() {
        var entityStateMethods = {
            isUnchanged: function() {
                return this === EntityState.Unchanged;
            },
            isAdded: function() {
                return this === EntityState.Added;
            },
            isModified: function() {
                return this === EntityState.Modified;
            },
            isDeleted: function() {
                return this === EntityState.Deleted;
            },
            isDetached: function() {
                return this === EntityState.Detached;
            },
            isUnchangedOrModified: function() {
                return this === EntityState.Unchanged || this === EntityState.Modified;
            },
            isAddedModifiedOrDeleted: function() {
                return this === EntityState.Added || this === EntityState.Modified || this === EntityState.Deleted;
            }
        }, EntityState = new Enum("EntityState", entityStateMethods);
        return EntityState.Unchanged = EntityState.addSymbol(), EntityState.Added = EntityState.addSymbol(), 
        EntityState.Modified = EntityState.addSymbol(), EntityState.Deleted = EntityState.addSymbol(), 
        EntityState.Detached = EntityState.addSymbol(), EntityState.seal(), EntityState;
    }();
    breeze.EntityState = EntityState, breeze.makePrimitiveArray = function() {
        function makePrimitiveArray(arr, parent, parentProperty) {
            return observableArray.initializeParent(arr, parent, parentProperty), arr.arrayChanged = new Event("arrayChanged", arr), 
            __extend(arr, observableArray.mixin), __extend(arr, primitiveArrayMixin);
        }
        var primitiveArrayMixin = {};
        return primitiveArrayMixin._getGoodAdds = function(adds) {
            return adds;
        }, primitiveArrayMixin._beforeChange = function() {
            var entityAspect = this.getEntityAspect();
            entityAspect.entityState.isUnchanged() && entityAspect.setModified(), entityAspect.entityState.isModified() && !this._origValues && (this._origValues = this.slice(0));
        }, primitiveArrayMixin._processAdds = function() {}, primitiveArrayMixin._processRemoves = function() {}, 
        primitiveArrayMixin._rejectChanges = function() {
            this._origValues && (this.length = 0, Array.prototype.push.apply(this, this._origValues));
        }, primitiveArrayMixin._acceptChanges = function() {
            this._origValues = null;
        }, makePrimitiveArray;
    }(), breeze.makeRelationArray = function() {
        function getGoodAdds(relationArray, adds) {
            var goodAdds = checkForDups(relationArray, adds);
            if (!goodAdds.length) return goodAdds;
            var parentEntity = relationArray.parentEntity, entityManager = parentEntity.entityAspect.entityManager;
            return entityManager && !entityManager.isLoading && goodAdds.forEach(function(add) {
                if (add.entityAspect.entityState.isDetached()) {
                    relationArray._inProgress = !0;
                    try {
                        entityManager.attachEntity(add, EntityState.Added);
                    } finally {
                        relationArray._inProgress = !1;
                    }
                }
            }), goodAdds;
        }
        function processAdds(relationArray, adds) {
            var parentEntity = relationArray.parentEntity, np = relationArray.navigationProperty, addsInProcess = relationArray._addsInProcess, invNp = np.inverse, startIx = addsInProcess.length;
            try {
                adds.forEach(function(childEntity) {
                    if (addsInProcess.push(childEntity), invNp) childEntity.setProperty(invNp.name, parentEntity); else {
                        var pks = parentEntity.entityType.keyProperties;
                        np.invForeignKeyNames.forEach(function(fk, i) {
                            childEntity.setProperty(fk, parentEntity.getProperty(pks[i].name));
                        });
                    }
                });
            } finally {
                addsInProcess.splice(startIx, adds.length);
            }
        }
        function processRemoves(relationArray, removes) {
            var inp = relationArray.navigationProperty.inverse;
            inp && removes.forEach(function(childEntity) {
                childEntity.setProperty(inp.name, null);
            });
        }
        function checkForDups(relationArray, adds) {
            var goodAdds, parentEntity = relationArray.parentEntity, navProp = relationArray.navigationProperty, inverseProp = navProp.inverse;
            if (inverseProp) goodAdds = adds.filter(function(a) {
                if (relationArray._addsInProcess.indexOf(a) >= 0) return !1;
                var inverseValue = a.getProperty(inverseProp.name);
                return inverseValue !== parentEntity;
            }); else {
                var fkPropNames = navProp.invForeignKeyNames, keyProps = parentEntity.entityType.keyProperties;
                goodAdds = adds.filter(function(a) {
                    return relationArray._addsInProcess.indexOf(a) >= 0 ? !1 : fkPropNames.some(function(fk, i) {
                        var keyProp = keyProps[i].name, keyVal = parentEntity.getProperty(keyProp), fkVal = a.getProperty(fk);
                        return keyVal !== fkVal;
                    });
                });
            }
            return goodAdds;
        }
        function makeRelationArray(arr, parentEntity, navigationProperty) {
            return arr.parentEntity = parentEntity, arr.navigationProperty = navigationProperty, 
            arr.arrayChanged = new Event("arrayChanged", arr), arr._addsInProcess = [], __extend(arr, observableArray.mixin), 
            __extend(arr, relationArrayMixin);
        }
        var relationArrayMixin = {};
        return relationArrayMixin.load = function(callback, errorCallback) {
            var parent = this.parentEntity, query = EntityQuery.fromEntityNavigation(this.parentEntity, this.navigationProperty), em = parent.entityAspect.entityManager;
            return em.executeQuery(query, callback, errorCallback);
        }, relationArrayMixin._getEventParent = function() {
            return this.parentEntity.entityAspect;
        }, relationArrayMixin._getPendingPubs = function() {
            var em = this.parentEntity.entityAspect.entityManager;
            return em && em._pendingPubs;
        }, relationArrayMixin._getGoodAdds = function(adds) {
            return getGoodAdds(this, adds);
        }, relationArrayMixin._processAdds = function(adds) {
            processAdds(this, adds);
        }, relationArrayMixin._processRemoves = function(removes) {
            processRemoves(this, removes);
        }, makeRelationArray;
    }();
    var DataService = function() {
        function updateWithConfig(obj, config) {
            return config && (assertConfig(config).whereParam("serviceName").isOptional().whereParam("adapterName").isString().isOptional().whereParam("hasServerMetadata").isBoolean().isOptional().whereParam("jsonResultsAdapter").isInstanceOf(JsonResultsAdapter).isOptional().whereParam("useJsonp").isBoolean().isOptional().applyAll(obj), 
            obj.serviceName = obj.serviceName && DataService._normalizeServiceName(obj.serviceName), 
            obj.adapterInstance = obj.adapterName && __config.getAdapterInstance("dataService", obj.adapterName)), 
            obj;
        }
        var ctor = function(config) {
            updateWithConfig(this, config);
        }, proto = ctor.prototype;
        return proto._$typeName = "DataService", proto.using = function(config) {
            if (!config) return this;
            var result = new DataService(this);
            return updateWithConfig(result, config);
        }, ctor.resolve = function(dataServices) {
            dataServices.push({
                hasServerMetadata: !0,
                useJsonp: !1
            });
            var ds = new DataService(__resolveProperties(dataServices, [ "serviceName", "adapterName", "hasServerMetadata", "jsonResultsAdapter", "useJsonp" ]));
            if (!ds.serviceName) throw new Error("Unable to resolve a 'serviceName' for this dataService");
            return ds.adapterInstance = ds.adapterInstance || __config.getAdapterInstance("dataService", ds.adapterName), 
            ds.jsonResultsAdapter = ds.jsonResultsAdapter || ds.adapterInstance.jsonResultsAdapter, 
            ds;
        }, ctor._normalizeServiceName = function(serviceName) {
            return serviceName = serviceName.trim(), "/" !== serviceName.substr(-1) ? serviceName + "/" : serviceName;
        }, proto.toJSON = function() {
            return __toJson(this, {
                serviceName: null,
                adapterName: null,
                hasServerMetadata: null,
                jsonResultsAdapter: function(v) {
                    return v && v.name;
                },
                useJsonp: null
            });
        }, ctor.fromJSON = function(json) {
            return json.jsonResultsAdapter = __config._fetchObject(JsonResultsAdapter, json.jsonResultsAdapter), 
            new DataService(json);
        }, proto.makeUrl = function(suffix) {
            var url = this.serviceName;
            return core.stringEndsWith(url, "/") && (url = url.substr(0, url.length - 1)), suffix = "/" + suffix, 
            core.stringEndsWith(url, suffix) || (url += suffix), url;
        }, ctor;
    }(), JsonResultsAdapter = function() {
        function extractResultsDefault(data) {
            return data.results;
        }
        var ctor = function(config) {
            if (1 !== arguments.length) throw new Error("The JsonResultsAdapter ctor should be called with a single argument that is a configuration object.");
            assertConfig(config).whereParam("name").isNonEmptyString().whereParam("extractResults").isFunction().isOptional().withDefault(extractResultsDefault).whereParam("visitNode").isFunction().applyAll(this), 
            __config._storeObject(this, proto._$typeName, this.name);
        }, proto = ctor.prototype;
        return proto._$typeName = "JsonResultsAdapter", ctor;
    }();
    breeze.DataService = DataService, breeze.JsonResultsAdapter = JsonResultsAdapter;
    var DataType = function() {
        function throwError(msg, val) {
            throw msg = __formatString(msg, val), new Error(msg);
        }
        function getValidatorCtor(symbol) {
            switch (symbol) {
              case DataType.String:
                return Validator.string;

              case DataType.Int64:
                return Validator.int64;

              case DataType.Int32:
                return Validator.int32;

              case DataType.Int16:
                return Validator.int16;

              case DataType.Decimal:
                return Validator.number;

              case DataType.Double:
                return Validator.number;

              case DataType.Single:
                return Validator.number;

              case DataType.DateTime:
                return Validator.date;

              case DataType.DateTimeOffset:
                return Validator.date;

              case DataType.Boolean:
                return Validator.bool;

              case DataType.Guid:
                return Validator.guid;

              case DataType.Byte:
                return Validator.byte;

              case DataType.Binary:
                return Validator.none;

              case DataType.Time:
                return Validator.duration;

              case DataType.Undefined:
                return Validator.none;
            }
        }
        var dataTypeMethods = {}, constants = {
            stringPrefix: "K_",
            nextNumber: -1,
            nextNumberIncrement: -1
        }, getNextString = function() {
            return constants.stringPrefix + getNextNumber().toString();
        }, getNextNumber = function() {
            var result = constants.nextNumber;
            return constants.nextNumber += constants.nextNumberIncrement, result;
        }, getNextGuid = function() {
            return __getUuid();
        }, getNextDateTime = function() {
            return new Date();
        }, coerceToString = function(source) {
            return null == source ? source : source.toString();
        }, coerceToInt = function(source, sourceTypeName) {
            if ("string" === sourceTypeName) {
                var src = source.trim();
                if ("" === src) return null;
                var val = parseInt(src, 10);
                return isNaN(val) ? source : val;
            }
            return "number" === sourceTypeName ? Math.round(source) : source;
        }, coerceToFloat = function(source, sourceTypeName) {
            if ("string" === sourceTypeName) {
                var src = source.trim();
                if ("" === src) return null;
                var val = parseFloat(src);
                return isNaN(val) ? source : val;
            }
            return source;
        }, coerceToDate = function(source, sourceTypeName) {
            var val;
            if ("string" === sourceTypeName) {
                var src = source.trim();
                return "" === src ? null : (val = new Date(Date.parse(src)), __isDate(val) ? val : source);
            }
            return "number" === sourceTypeName ? (val = new Date(source), __isDate(val) ? val : source) : source;
        }, coerceToBool = function(source, sourceTypeName) {
            if ("string" === sourceTypeName) {
                var src = source.trim().toLowerCase();
                return "false" === src || "" === src ? !1 : "true" === src ? !0 : source;
            }
            return source;
        }, fmtString = function(val) {
            return null == val ? null : "'" + val + "'";
        }, fmtInt = function(val) {
            return null == val ? null : "string" == typeof val ? parseInt(val, 10) : val;
        }, makeFloatFmt = function(fmtSuffix) {
            return function(val) {
                return null == val ? null : ("string" == typeof val && (val = parseFloat(val)), 
                val + fmtSuffix);
            };
        }, fmtDateTime = function(val) {
            if (null == val) return null;
            try {
                return "datetime'" + val.toISOString() + "'";
            } catch (e) {
                throwError("'%1' is not a valid dateTime", val);
            }
        }, fmtDateTimeOffset = function(val) {
            if (null == val) return null;
            try {
                return "datetimeoffset'" + val.toISOString() + "'";
            } catch (e) {
                throwError("'%1' is not a valid dateTime", val);
            }
        }, fmtTime = function(val) {
            return null == val ? null : (__isDuration(val) || throwError("'%1' is not a valid ISO 8601 duration", val), 
            "time'" + val + "'");
        }, fmtGuid = function(val) {
            return null == val ? null : (__isGuid(val) || throwError("'%1' is not a valid guid", val), 
            "guid'" + val + "'");
        }, fmtBoolean = function(val) {
            return null == val ? null : "string" == typeof val ? "true" === val.trim().toLowerCase() : !!val;
        }, fmtBinary = function(val) {
            return null == val ? val : "binary'" + val + "'";
        }, fmtUndefined = function(val) {
            return val;
        }, DataType = new Enum("DataType", dataTypeMethods);
        DataType.String = DataType.addSymbol({
            defaultValue: "",
            parse: coerceToString,
            fmtOData: fmtString,
            getNext: getNextString
        }), DataType.Int64 = DataType.addSymbol({
            defaultValue: 0,
            isNumeric: !0,
            isInteger: !0,
            quoteJsonOData: !0,
            parse: coerceToInt,
            fmtOData: fmtInt,
            getNext: getNextNumber
        }), DataType.Int32 = DataType.addSymbol({
            defaultValue: 0,
            isNumeric: !0,
            isInteger: !0,
            parse: coerceToInt,
            fmtOData: fmtInt,
            getNext: getNextNumber
        }), DataType.Int16 = DataType.addSymbol({
            defaultValue: 0,
            isNumeric: !0,
            isInteger: !0,
            parse: coerceToInt,
            fmtOData: fmtInt,
            getNext: getNextNumber
        }), DataType.Byte = DataType.addSymbol({
            defaultValue: 0,
            isNumeric: !0,
            isInteger: !0,
            parse: coerceToInt,
            fmtOData: fmtInt
        }), DataType.Decimal = DataType.addSymbol({
            defaultValue: 0,
            isNumeric: !0,
            quoteJsonOData: !0,
            parse: coerceToFloat,
            fmtOData: makeFloatFmt("m"),
            getNext: getNextNumber
        }), DataType.Double = DataType.addSymbol({
            defaultValue: 0,
            isNumeric: !0,
            parse: coerceToFloat,
            fmtOData: makeFloatFmt("d"),
            getNext: getNextNumber
        }), DataType.Single = DataType.addSymbol({
            defaultValue: 0,
            isNumeric: !0,
            parse: coerceToFloat,
            fmtOData: makeFloatFmt("f"),
            getNext: getNextNumber
        }), DataType.DateTime = DataType.addSymbol({
            defaultValue: new Date(1900, 0, 1),
            isDate: !0,
            parse: coerceToDate,
            fmtOData: fmtDateTime,
            getNext: getNextDateTime
        }), DataType.DateTimeOffset = DataType.addSymbol({
            defaultValue: new Date(1900, 0, 1),
            isDate: !0,
            parse: coerceToDate,
            fmtOData: fmtDateTimeOffset,
            getNext: getNextDateTime
        }), DataType.Time = DataType.addSymbol({
            defaultValue: "PT0S",
            fmtOData: fmtTime
        }), DataType.Boolean = DataType.addSymbol({
            defaultValue: !1,
            parse: coerceToBool,
            fmtOData: fmtBoolean
        }), DataType.Guid = DataType.addSymbol({
            defaultValue: "00000000-0000-0000-0000-000000000000",
            fmtOData: fmtGuid,
            getNext: getNextGuid
        }), DataType.Binary = DataType.addSymbol({
            defaultValue: null,
            fmtOData: fmtBinary
        }), DataType.Undefined = DataType.addSymbol({
            defaultValue: void 0,
            fmtOData: fmtUndefined
        }), DataType.seal(), DataType.fromEdmDataType = function(typeName) {
            var dt = null, parts = typeName.split(".");
            if (parts.length > 1) {
                var simpleName = parts[1];
                dt = "image" === simpleName ? DataType.Byte : 2 === parts.length ? DataType.fromName(simpleName) || DataType.Undefined : DataType.String;
            }
            return dt;
        }, DataType.fromValue = function(val) {
            if (__isDate(val)) return DataType.DateTime;
            switch (typeof val) {
              case "string":
                return __isGuid(val) ? DataType.Guid : __isDuration(val) && val.length > 3 ? DataType.Time : DataType.String;

              case "boolean":
                return DataType.Boolean;

              case "number":
                return DataType.Int32;
            }
            return DataType.Undefined;
        };
        var _localTimeRegex = /.\d{3}$/;
        return DataType.parseTimeFromServer = function(source) {
            if ("string" == typeof source) return source;
            if (source && "Edm.Time" === source.__edmType) {
                var seconds = Math.floor(source.ms / 1e3);
                return "PT" + seconds + "S";
            }
            return source;
        }, DataType.parseDateAsUTC = function(source) {
            if ("string" == typeof source) {
                var isLocalTime = _localTimeRegex.test(source);
                source = isLocalTime ? source + "Z" : source;
            }
            return source = new Date(Date.parse(source));
        }, DataType.parseDateFromServer = DataType.parseDateAsUTC, DataType.constants = constants, 
        DataType.getSymbols().forEach(function(sym) {
            sym.validatorCtor = getValidatorCtor(sym);
        }), DataType;
    }();
    breeze.DataType = DataType;
    var Q = __requireLib("Q", "See https://github.com/kriskowal/q "), MetadataStore = function() {
        function getTypesFromMap(typeMap) {
            var types = [];
            for (var key in typeMap) {
                var value = typeMap[key];
                key === value.name && types.push(typeMap[key]);
            }
            return types;
        }
        function structuralTypeFromJson(metadataStore, json, allowMerge) {
            var typeName = qualifyTypeName(json.shortName, json.namespace), stype = metadataStore._getEntityType(typeName, !0);
            if (stype) return allowMerge ? mergeStructuralType(stype, json) : stype;
            var config = {
                shortName: json.shortName,
                namespace: json.namespace,
                isAbstract: json.isAbstract,
                autoGeneratedKeyType: AutoGeneratedKeyType.fromName(json.autoGeneratedKeyType),
                defaultResourceName: json.defaultResourceName,
                custom: json.custom
            };
            if (stype = json.isComplexType ? new ComplexType(config) : new EntityType(config), 
            json.baseTypeName) {
                stype.baseTypeName = json.baseTypeName;
                var baseEntityType = metadataStore._getEntityType(json.baseTypeName, !0);
                baseEntityType ? completeStructuralTypeFromJson(metadataStore, json, stype, baseEntityType) : __getArray(metadataStore._deferredTypes, json.baseTypeName).push({
                    json: json,
                    stype: stype
                });
            } else completeStructuralTypeFromJson(metadataStore, json, stype, null);
            return stype;
        }
        function mergeStructuralType(stype, json) {
            return json.custom && (stype.custom = json.custom), mergeProps(stype, json.dataProperties), 
            mergeProps(stype, json.navigationProperties), stype;
        }
        function mergeProps(stype, jsonProps) {
            jsonProps && jsonProps.forEach(function(jsonProp) {
                var propName = jsonProp.name;
                if (!propName) {
                    if (!jsonProp.nameOnServer) throw new Error("Unable to complete 'importMetadata' - cannot locate a 'name' or 'nameOnServer' for one of the imported property nodes");
                    propName = stype.metadataStore.namingConvention.serverPropertyNameToClient(jsonProp.nameOnServer, {});
                }
                if (jsonProp.custom) {
                    var prop = stype.getProperty(propName, !0);
                    prop.custom = jsonProp.custom;
                }
            });
        }
        function completeStructuralTypeFromJson(metadataStore, json, stype, baseEntityType) {
            json.validators && (stype.validators = json.validators.map(Validator.fromJSON)), 
            baseEntityType && (stype.baseEntityType = baseEntityType, baseEntityType.dataProperties.forEach(function(dp) {
                var newDp = new DataProperty(dp);
                newDp.isInherited = !0, stype.addProperty(newDp);
            }), baseEntityType.navigationProperties.forEach(function(np) {
                var newNp = new NavigationProperty(np);
                newNp.isInherited = !0, stype.addProperty(newNp);
            })), json.dataProperties.forEach(function(dp) {
                stype.addProperty(DataProperty.fromJSON(dp));
            });
            var isEntityType = !json.isComplexType;
            isEntityType && json.navigationProperties && json.navigationProperties.forEach(function(np) {
                stype.addProperty(NavigationProperty.fromJSON(np));
            }), metadataStore.addEntityType(stype);
            var deferredTypes = metadataStore._deferredTypes, deferrals = deferredTypes[stype.name];
            deferrals && (deferrals.forEach(function(d) {
                completeStructuralTypeFromJson(metadataStore, d.json, d.stype, stype);
            }), delete deferredTypes[stype.name]);
        }
        function getQualifiedTypeName(metadataStore, structTypeName, throwIfNotFound) {
            if (isQualifiedTypeName(structTypeName)) return structTypeName;
            var result = metadataStore._shortNameMap[structTypeName];
            if (!result && throwIfNotFound) throw new Error("Unable to locate 'entityTypeName' of: " + structTypeName);
            return result;
        }
        var __id = 0, ctor = function(config) {
            config = config || {}, assertConfig(config).whereParam("namingConvention").isOptional().isInstanceOf(NamingConvention).withDefault(NamingConvention.defaultInstance).whereParam("localQueryComparisonOptions").isOptional().isInstanceOf(LocalQueryComparisonOptions).withDefault(LocalQueryComparisonOptions.defaultInstance).applyAll(this), 
            this.dataServices = [], this._resourceEntityTypeMap = {}, this._structuralTypeMap = {}, 
            this._shortNameMap = {}, this._ctorRegistry = {}, this._incompleteTypeMap = {}, 
            this._incompleteComplexTypeMap = {}, this._id = __id++;
        }, proto = ctor.prototype;
        return proto._$typeName = "MetadataStore", ctor.ANONTYPE_PREFIX = "_IB_", proto.addDataService = function(dataService, shouldOverwrite) {
            assertParam(dataService, "dataService").isInstanceOf(DataService).check(), assertParam(shouldOverwrite, "shouldOverwrite").isBoolean().isOptional().check();
            var ix = this._getDataServiceIndex(dataService.serviceName);
            if (ix >= 0) {
                if (!shouldOverwrite) throw new Error("A dataService with this name '" + dataService.serviceName + "' already exists in this MetadataStore");
                this.dataServices[ix] = dataService;
            } else this.dataServices.push(dataService);
        }, proto._getDataServiceIndex = function(serviceName) {
            return __arrayIndexOf(this.dataServices, function(ds) {
                return ds.serviceName === serviceName;
            });
        }, proto.addEntityType = function(structuralType) {
            if (structuralType instanceof EntityType || structuralType instanceof ComplexType || (structuralType = structuralType.isComplexType ? new ComplexType(structuralType) : new EntityType(structuralType)), 
            !structuralType.isComplexType && 0 === structuralType.keyProperties.length && !structuralType.isAbstract) throw new Error("Unable to add " + structuralType.name + " to this MetadataStore.  An EntityType must have at least one property designated as a key property - See the 'DataProperty.isPartOfKey' property.");
            if (structuralType.metadataStore = this, !structuralType.isAnonymous) {
                if (this._structuralTypeMap[structuralType.name]) throw new Error("Type " + structuralType.name + " already exists in this MetadataStore.");
                this._structuralTypeMap[structuralType.name] = structuralType, this._shortNameMap[structuralType.shortName] = structuralType.name;
            }
            if (structuralType.getProperties().forEach(function(property) {
                structuralType._updateNames(property), property.isUnmapped || structuralType._mappedPropertiesCount++;
            }), structuralType._updateCps(), !structuralType.isComplexType) {
                structuralType._updateNps();
                var defResourceName = structuralType.defaultResourceName || structuralType.baseEntityType && structuralType.baseEntityType.defaultResourceName;
                defResourceName && !this.getEntityTypeNameForResourceName(defResourceName) && this.setEntityTypeForResourceName(defResourceName, structuralType.name), 
                structuralType.defaultResourceName = defResourceName, structuralType.getEntityCtor();
            }
            structuralType.baseEntityType && structuralType.baseEntityType.subtypes.push(structuralType);
        }, proto.exportMetadata = function() {
            var result = JSON.stringify({
                metadataVersion: breeze.metadataVersion,
                namingConvention: this.namingConvention.name,
                localQueryComparisonOptions: this.localQueryComparisonOptions.name,
                dataServices: this.dataServices,
                structuralTypes: __objectMapToArray(this._structuralTypeMap),
                resourceEntityTypeMap: this._resourceEntityTypeMap
            }, null, __config.stringifyPad);
            return result;
        }, proto.importMetadata = function(exportedMetadata, allowMerge) {
            assertParam(allowMerge, "allowMerge").isOptional().isBoolean().check(), this._deferredTypes = {};
            var json = "string" == typeof exportedMetadata ? JSON.parse(exportedMetadata) : exportedMetadata;
            if (json.schema) return CsdlMetadataParser.parse(this, json.schema, json.altMetadata);
            if (json.metadataVersion && json.metadataVersion !== breeze.metadataVersion) {
                var msg = __formatString("Cannot import metadata with a different 'metadataVersion' (%1) than the current 'breeze.metadataVersion' (%2) ", json.metadataVersion, breeze.metadataVersion);
                throw new Error(msg);
            }
            var ncName = json.namingConvention, lqcoName = json.localQueryComparisonOptions;
            if (this.isEmpty()) this.namingConvention = __config._fetchObject(NamingConvention, ncName) || this.namingConvention, 
            this.localQueryComparisonOptions = __config._fetchObject(LocalQueryComparisonOptions, lqcoName) || this.localQueryComparisonOptions; else {
                if (ncName && this.namingConvention.name !== ncName) throw new Error("Cannot import metadata with a different 'namingConvention' from the current MetadataStore");
                if (lqcoName && this.localQueryComparisonOptions.name !== lqcoName) throw new Error("Cannot import metadata with different 'localQueryComparisonOptions' from the current MetadataStore");
            }
            var that = this;
            json.dataServices && json.dataServices.forEach(function(ds) {
                ds = DataService.fromJSON(ds), that.addDataService(ds, !0);
            });
            this._structuralTypeMap;
            return json.structuralTypes && json.structuralTypes.forEach(function(stype) {
                structuralTypeFromJson(that, stype, allowMerge);
            }), __extend(this._resourceEntityTypeMap, json.resourceEntityTypeMap), __extend(this._incompleteTypeMap, json.incompleteTypeMap), 
            this;
        }, ctor.importMetadata = function(exportedString) {
            var ms = new MetadataStore();
            return ms.importMetadata(exportedString), ms;
        }, proto.hasMetadataFor = function(serviceName) {
            return !!this.getDataService(serviceName);
        }, proto.getDataService = function(serviceName) {
            return assertParam(serviceName, "serviceName").isString().check(), serviceName = DataService._normalizeServiceName(serviceName), 
            __arrayFirst(this.dataServices, function(ds) {
                return ds.serviceName === serviceName;
            });
        }, proto.fetchMetadata = function(dataService, callback, errorCallback) {
            if (assertParam(dataService, "dataService").isString().or().isInstanceOf(DataService).check(), 
            assertParam(callback, "callback").isFunction().isOptional().check(), assertParam(errorCallback, "errorCallback").isFunction().isOptional().check(), 
            "string" == typeof dataService && (dataService = this.getDataService(dataService) || new DataService({
                serviceName: dataService
            })), dataService = DataService.resolve([ dataService ]), this.hasMetadataFor(dataService.serviceName)) throw new Error("Metadata for a specific serviceName may only be fetched once per MetadataStore. ServiceName: " + dataService.serviceName);
            return dataService.adapterInstance.fetchMetadata(this, dataService).then(function(rawMetadata) {
                return callback && callback(rawMetadata), Q.resolve(rawMetadata);
            }).fail(function(error) {
                return errorCallback && errorCallback(error), Q.reject(error);
            });
        }, proto.trackUnmappedType = function(entityCtor, interceptor) {
            assertParam(entityCtor, "entityCtor").isFunction().check(), assertParam(interceptor, "interceptor").isFunction().isOptional().check();
            var entityType = new EntityType(this);
            entityType._setCtor(entityCtor, interceptor);
        }, proto.registerEntityTypeCtor = function(structuralTypeName, aCtor, initializationFn) {
            assertParam(structuralTypeName, "structuralTypeName").isString().check(), assertParam(aCtor, "aCtor").isFunction().isOptional().check(), 
            assertParam(initializationFn, "initializationFn").isOptional().isFunction().or().isString().check();
            var qualifiedTypeName = getQualifiedTypeName(this, structuralTypeName, !1), typeName = qualifiedTypeName || structuralTypeName;
            if (this._ctorRegistry[typeName] = {
                ctor: aCtor,
                initFn: initializationFn
            }, qualifiedTypeName) {
                var stype = this._structuralTypeMap[qualifiedTypeName];
                stype && stype.getCtor(!0);
            }
        }, proto.toQueryString = function(query) {
            if (!query) throw new Error("query cannot be empty");
            if ("string" == typeof query) return query;
            if (query instanceof EntityQuery) return query._toUri(this);
            throw new Error("unable to recognize query parameter as either a string or an EntityQuery");
        }, proto.isEmpty = function() {
            return __isEmpty(this._structuralTypeMap);
        }, proto.getEntityType = function(structuralTypeName, okIfNotFound) {
            return assertParam(structuralTypeName, "structuralTypeName").isString().check(), 
            assertParam(okIfNotFound, "okIfNotFound").isBoolean().isOptional().check(!1), this._getEntityType(structuralTypeName, okIfNotFound);
        }, proto._getEntityType = function(typeName, okIfNotFound) {
            var qualTypeName = getQualifiedTypeName(this, typeName, !1), type = this._structuralTypeMap[qualTypeName];
            if (!type) {
                if (okIfNotFound) return null;
                var msg = __formatString("Unable to locate a 'Type' by the name: '%1'. Be sure to execute a query or call fetchMetadata first.", typeName);
                throw new Error(msg);
            }
            if (type.length) {
                var typeNames = type.join(",");
                throw new Error("There are multiple types with this 'shortName': " + typeNames);
            }
            return type;
        }, proto.getEntityTypes = function() {
            return getTypesFromMap(this._structuralTypeMap);
        }, proto.getIncompleteNavigationProperties = function() {
            return __objectMapToArray(this._incompleteTypeMap, function(key, value) {
                return value;
            });
        }, proto.getEntityTypeNameForResourceName = function(resourceName) {
            return assertParam(resourceName, "resourceName").isString().check(), this._resourceEntityTypeMap[resourceName];
        }, proto.setEntityTypeForResourceName = function(resourceName, entityTypeOrName) {
            assertParam(resourceName, "resourceName").isString().check(), assertParam(entityTypeOrName, "entityTypeOrName").isInstanceOf(EntityType).or().isString().check();
            var entityTypeName;
            entityTypeName = entityTypeOrName instanceof EntityType ? entityTypeOrName.name : getQualifiedTypeName(this, entityTypeOrName, !0), 
            this._resourceEntityTypeMap[resourceName] = entityTypeName;
            var entityType = this._getEntityType(entityTypeName, !0);
            entityType && !entityType.defaultResourceName && (entityType.defaultResourceName = resourceName);
        }, proto._checkEntityType = function(entity) {
            if (!entity.entityType) {
                var typeName = entity.prototype._$typeName;
                if (!typeName) throw new Error("This entity has not been registered. See the MetadataStore.registerEntityTypeCtor method");
                var entityType = this._getEntityType(typeName);
                entityType && (entity.entityType = entityType);
            }
        }, ctor;
    }(), CsdlMetadataParser = function() {
        function parse(metadataStore, schemas, altMetadata) {
            metadataStore._entityTypeResourceMap = {}, __toArray(schemas).forEach(function(schema) {
                if (schema.cSpaceOSpaceMapping) {
                    var mappings = JSON.parse(schema.cSpaceOSpaceMapping), newMap = {};
                    mappings.forEach(function(mapping) {
                        newMap[mapping[0]] = mapping[1];
                    }), schema.cSpaceOSpaceMapping = newMap;
                }
                schema.entityContainer && __toArray(schema.entityContainer).forEach(function(container) {
                    __toArray(container.entitySet).forEach(function(entitySet) {
                        var entityTypeName = parseTypeName(entitySet.entityType, schema).typeName;
                        metadataStore.setEntityTypeForResourceName(entitySet.name, entityTypeName), metadataStore._entityTypeResourceMap[entityTypeName] = entitySet.name;
                    });
                }), schema.complexType && __toArray(schema.complexType).forEach(function(ct) {
                    parseCsdlComplexType(ct, schema, metadataStore);
                }), schema.entityType && __toArray(schema.entityType).forEach(function(et) {
                    parseCsdlEntityType(et, schema, metadataStore);
                });
            });
            var badNavProps = metadataStore.getIncompleteNavigationProperties();
            if (badNavProps.length > 0) throw new Error("Bad nav properties");
            return altMetadata && metadataStore.importMetadata(altMetadata, !0), metadataStore;
        }
        function parseCsdlEntityType(csdlEntityType, schema, metadataStore) {
            var shortName = csdlEntityType.name, ns = getNamespaceFor(shortName, schema), entityType = new EntityType({
                shortName: shortName,
                namespace: ns,
                isAbstract: csdlEntityType.abstract && "true" === csdlEntityType.abstract
            });
            if (csdlEntityType.baseType) {
                var baseTypeName = parseTypeName(csdlEntityType.baseType, schema).typeName;
                entityType.baseTypeName = baseTypeName;
                var baseEntityType = metadataStore._getEntityType(baseTypeName, !0);
                if (baseEntityType) completeParseCsdlEntityType(entityType, csdlEntityType, schema, metadataStore, baseEntityType); else {
                    var deferrals = metadataStore._deferredTypes[baseTypeName];
                    deferrals || (deferrals = [], metadataStore._deferredTypes[baseTypeName] = deferrals), 
                    deferrals.push({
                        entityType: entityType,
                        csdlEntityType: csdlEntityType
                    });
                }
            } else completeParseCsdlEntityType(entityType, csdlEntityType, schema, metadataStore, null);
            return entityType;
        }
        function completeParseCsdlEntityType(entityType, csdlEntityType, schema, metadataStore, baseEntityType) {
            var baseKeyNamesOnServer = [];
            baseEntityType && (entityType.baseEntityType = baseEntityType, entityType.autoGeneratedKeyType = baseEntityType.autoGeneratedKeyType, 
            baseKeyNamesOnServer = baseEntityType.keyProperties.map(__pluck("name")), baseEntityType.dataProperties.forEach(function(dp) {
                var newDp = new DataProperty(dp);
                newDp.isInherited = !0, entityType.addProperty(newDp);
            }), baseEntityType.navigationProperties.forEach(function(np) {
                var newNp = new NavigationProperty(np);
                newNp.isInherited = !0, entityType.addProperty(newNp);
            }));
            var keyNamesOnServer = csdlEntityType.key ? __toArray(csdlEntityType.key.propertyRef).map(__pluck("name")) : [];
            keyNamesOnServer = baseKeyNamesOnServer.concat(keyNamesOnServer), __toArray(csdlEntityType.property).forEach(function(prop) {
                parseCsdlDataProperty(entityType, prop, schema, keyNamesOnServer);
            }), __toArray(csdlEntityType.navigationProperty).forEach(function(prop) {
                parseCsdlNavProperty(entityType, prop, schema);
            }), metadataStore.addEntityType(entityType), entityType.defaultResourceName = metadataStore._entityTypeResourceMap[entityType.name];
            var deferredTypes = metadataStore._deferredTypes, deferrals = deferredTypes[entityType.name];
            deferrals && (deferrals.forEach(function(d) {
                completeParseCsdlEntityType(d.entityType, d.csdlEntityType, schema, metadataStore, entityType);
            }), delete deferredTypes[entityType.name]);
        }
        function parseCsdlComplexType(csdlComplexType, schema, metadataStore) {
            var shortName = csdlComplexType.name, ns = getNamespaceFor(shortName, schema), complexType = new ComplexType({
                shortName: shortName,
                namespace: ns
            });
            return __toArray(csdlComplexType.property).forEach(function(prop) {
                parseCsdlDataProperty(complexType, prop, schema);
            }), metadataStore.addEntityType(complexType), complexType;
        }
        function parseCsdlDataProperty(parentType, csdlProperty, schema, keyNamesOnServer) {
            var dp, typeParts = csdlProperty.type.split(".");
            return 2 === typeParts.length ? dp = parseCsdlSimpleProperty(parentType, csdlProperty, keyNamesOnServer) : isEnumType(csdlProperty, schema) ? (dp = parseCsdlSimpleProperty(parentType, csdlProperty, keyNamesOnServer), 
            dp && (dp.enumType = csdlProperty.type)) : dp = parseCsdlComplexProperty(parentType, csdlProperty, schema), 
            dp && (parentType.addProperty(dp), addValidators(dp)), dp;
        }
        function parseCsdlSimpleProperty(parentType, csdlProperty, keyNamesOnServer) {
            var dataType = DataType.fromEdmDataType(csdlProperty.type);
            if (null == dataType) return parentType.warnings.push("Unable to recognize DataType for property: " + csdlProperty.name + " DateType: " + csdlProperty.type), 
            null;
            var isNullable = "true" === csdlProperty.nullable || null == csdlProperty.nullable, isPartOfKey = null != keyNamesOnServer && keyNamesOnServer.indexOf(csdlProperty.name) >= 0;
            isPartOfKey && parentType.autoGeneratedKeyType === AutoGeneratedKeyType.None && isIdentityProperty(csdlProperty) && (parentType.autoGeneratedKeyType = AutoGeneratedKeyType.Identity);
            var maxLength = csdlProperty.maxLength;
            maxLength = null == maxLength || "Max" === maxLength ? null : parseInt(maxLength, 10);
            var dp = new DataProperty({
                nameOnServer: csdlProperty.name,
                dataType: dataType,
                isNullable: isNullable,
                isPartOfKey: isPartOfKey,
                maxLength: maxLength,
                concurrencyMode: csdlProperty.concurrencyMode
            });
            return dataType === DataType.Undefined && (dp.rawTypeName = csdlProperty.type), 
            dp;
        }
        function parseCsdlComplexProperty(parentType, csdlProperty, schema) {
            var complexTypeName = parseTypeName(csdlProperty.type, schema).typeName, dp = new DataProperty({
                nameOnServer: csdlProperty.name,
                complexTypeName: complexTypeName,
                isNullable: !1
            });
            return dp;
        }
        function parseCsdlNavProperty(entityType, csdlProperty, schema) {
            var association = getAssociation(csdlProperty, schema), toEnd = __arrayFirst(association.end, function(assocEnd) {
                return assocEnd.role === csdlProperty.toRole;
            }), isScalar = "*" !== toEnd.multiplicity, dataType = parseTypeName(toEnd.type, schema).typeName, constraint = association.referentialConstraint;
            if (constraint) {
                var propRefs, cfg = {
                    nameOnServer: csdlProperty.name,
                    entityTypeName: dataType,
                    isScalar: isScalar,
                    associationName: association.name
                }, principal = constraint.principal, dependent = constraint.dependent;
                csdlProperty.fromRole === principal.role ? (propRefs = __toArray(principal.propertyRef), 
                cfg.invForeignKeyNamesOnServer = propRefs.map(__pluck("name"))) : (propRefs = __toArray(dependent.propertyRef), 
                cfg.foreignKeyNamesOnServer = propRefs.map(__pluck("name")));
                var np = new NavigationProperty(cfg);
                return entityType.addProperty(np), np;
            }
        }
        function isEnumType(csdlProperty, schema) {
            if (!schema.enumType) return !1;
            var enumTypes = __toArray(schema.enumType), typeParts = csdlProperty.type.split("."), baseTypeName = typeParts[typeParts.length - 1];
            return enumTypes.some(function(enumType) {
                return enumType.name === baseTypeName;
            });
        }
        function addValidators(dataProperty) {
            var typeValidator;
            if (dataProperty.isNullable || dataProperty.validators.push(Validator.required()), 
            !dataProperty.isComplexProperty) {
                if (dataProperty.dataType === DataType.String) if (dataProperty.maxLength) {
                    var validatorArgs = {
                        maxLength: dataProperty.maxLength
                    };
                    typeValidator = Validator.maxLength(validatorArgs);
                } else typeValidator = Validator.string(); else typeValidator = dataProperty.dataType.validatorCtor();
                dataProperty.validators.push(typeValidator);
            }
        }
        function isIdentityProperty(csdlProperty) {
            var propName = __arrayFirst(Object.keys(csdlProperty), function(pn) {
                return pn.indexOf("StoreGeneratedPattern") >= 0;
            });
            if (propName) return "Identity" === csdlProperty[propName];
            var extensions = csdlProperty.extensions;
            if (!extensions) return !1;
            var identityExtn = __arrayFirst(extensions, function(extension) {
                return "StoreGeneratedPattern" === extension.name && "Identity" === extension.value;
            });
            return !!identityExtn;
        }
        function getAssociation(csdlNavProperty, schema) {
            var assocName = parseTypeName(csdlNavProperty.relationship, schema).shortTypeName, assocs = schema.association;
            if (!assocs) return null;
            Array.isArray(assocs) || (assocs = [ assocs ]);
            var association = __arrayFirst(assocs, function(assoc) {
                return assoc.name === assocName;
            });
            return association;
        }
        function parseTypeName(entityTypeName, schema) {
            if (!entityTypeName) return null;
            if (__stringStartsWith(entityTypeName, MetadataStore.ANONTYPE_PREFIX)) return {
                shortTypeName: entityTypeName,
                namespace: "",
                typeName: entityTypeName,
                isAnonymous: !0
            };
            var entityTypeNameNoAssembly = entityTypeName.split(",")[0], nameParts = entityTypeNameNoAssembly.split(".");
            if (nameParts.length > 1) {
                var ns, shortName = nameParts[nameParts.length - 1];
                if (schema) ns = getNamespaceFor(shortName, schema); else {
                    var namespaceParts = nameParts.slice(0, nameParts.length - 1);
                    ns = namespaceParts.join(".");
                }
                return {
                    shortTypeName: shortName,
                    namespace: ns,
                    typeName: qualifyTypeName(shortName, ns)
                };
            }
            return {
                shortTypeName: entityTypeName,
                namespace: "",
                typeName: entityTypeName
            };
        }
        function getNamespaceFor(shortName, schema) {
            var ns, mapping = schema.cSpaceOSpaceMapping;
            if (mapping) {
                var fullName = mapping[schema.namespace + "." + shortName];
                ns = fullName && fullName.substr(0, fullName.length - (shortName.length + 1));
            }
            return ns || schema.namespace;
        }
        var normalizeTypeName = __memoize(function(rawTypeName) {
            return rawTypeName && parseTypeName(rawTypeName).typeName;
        });
        return {
            parse: parse,
            normalizeTypeName: normalizeTypeName
        };
    }(), EntityType = function() {
        function createEmptyCtor() {
            return function() {};
        }
        function localPropsOnly(props) {
            return props.filter(function(prop) {
                return !prop.isInherited;
            });
        }
        function updateClientServerNames(nc, parent, clientPropName) {
            var serverPropName = clientPropName + "OnServer", clientName = parent[clientPropName];
            if (clientName && clientName.length) {
                if (parent.isUnmapped) return;
                var serverNames = __toArray(clientName).map(function(cName) {
                    var sName = nc.clientPropertyNameToServer(cName, parent), testName = nc.serverPropertyNameToClient(sName, parent);
                    if (cName !== testName) throw new Error("NamingConvention for this client property name does not roundtrip properly:" + cName + "-->" + testName);
                    return sName;
                });
                parent[serverPropName] = Array.isArray(clientName) ? serverNames : serverNames[0];
            } else {
                var serverName = parent[serverPropName];
                if (!serverName || 0 === serverName.length) return;
                var clientNames = __toArray(serverName).map(function(sName) {
                    var cName = nc.serverPropertyNameToClient(sName, parent), testName = nc.clientPropertyNameToServer(cName, parent);
                    if (sName !== testName) throw new Error("NamingConvention for this server property name does not roundtrip properly:" + sName + "-->" + testName);
                    return cName;
                });
                parent[clientPropName] = Array.isArray(serverName) ? clientNames : clientNames[0];
            }
        }
        function resolveCp(cp, metadataStore) {
            var complexType = metadataStore._getEntityType(cp.complexTypeName, !0);
            if (!complexType) return !1;
            if (!(complexType instanceof ComplexType)) throw new Error("Unable to resolve ComplexType with the name: " + cp.complexTypeName + " for the property: " + property.name);
            return cp.dataType = complexType, cp.defaultValue = null, !0;
        }
        function resolveNp(np, metadataStore) {
            var entityType = metadataStore._getEntityType(np.entityTypeName, !0);
            if (!entityType) return !1;
            np.entityType = entityType;
            var invNp = __arrayFirst(entityType.navigationProperties, function(altNp) {
                return altNp.associationName === np.associationName && (altNp.name !== np.name || altNp.entityTypeName !== np.entityTypeName);
            });
            return np.inverse = invNp, invNp || np.invForeignKeyNames.forEach(function(invFkName) {
                var fkProp = entityType.getDataProperty(invFkName), invEntityType = np.parentType;
                fkProp.inverseNavigationProperty = __arrayFirst(invEntityType.navigationProperties, function(np) {
                    return np.invForeignKeyNames && np.invForeignKeyNames.indexOf(fkProp.name) >= 0;
                }), addUniqueItem(entityType.foreignKeyProperties, fkProp);
            }), resolveRelated(np), !0;
        }
        function addUniqueItem(collection, item) {
            var ix = collection.indexOf(item);
            -1 === ix && collection.push(item);
        }
        function resolveRelated(np) {
            var fkNames = np.foreignKeyNames;
            if (0 !== fkNames.length) {
                var parentEntityType = np.parentType, fkProps = fkNames.map(function(fkName) {
                    return parentEntityType.getDataProperty(fkName);
                }), fkPropCollection = parentEntityType.foreignKeyProperties;
                fkProps.forEach(function(dp) {
                    addUniqueItem(fkPropCollection, dp), dp.relatedNavigationProperty = np, np.relatedDataProperties ? np.relatedDataProperties.push(dp) : np.relatedDataProperties = [ dp ];
                });
            }
        }
        function calcUnmappedProperties(stype, instance) {
            var metadataPropNames = stype.getPropertyNames(), trackablePropNames = __modelLibraryDef.getDefaultInstance().getTrackablePropertyNames(instance);
            trackablePropNames.forEach(function(pn) {
                if (-1 === metadataPropNames.indexOf(pn)) {
                    var newProp = new DataProperty({
                        name: pn,
                        dataType: DataType.Undefined,
                        isNullable: !0,
                        isUnmapped: !0
                    });
                    stype.subtypes ? stype.getSelfAndSubtypes().forEach(function(st) {
                        st.addProperty(new DataProperty(newProp));
                    }) : stype.addProperty(newProp);
                }
            });
        }
        var __nextAnonIx = 0, ctor = function(config) {
            if (arguments.length > 1) throw new Error("The EntityType ctor has a single argument that is either a 'MetadataStore' or a configuration object.");
            "MetadataStore" === config._$typeName ? (this.metadataStore = config, this.shortName = "Anon_" + ++__nextAnonIx, 
            this.namespace = "", this.isAnonymous = !0) : assertConfig(config).whereParam("shortName").isNonEmptyString().whereParam("namespace").isString().isOptional().withDefault("").whereParam("baseTypeName").isString().isOptional().whereParam("isAbstract").isBoolean().isOptional().withDefault(!1).whereParam("autoGeneratedKeyType").isEnumOf(AutoGeneratedKeyType).isOptional().withDefault(AutoGeneratedKeyType.None).whereParam("defaultResourceName").isNonEmptyString().isOptional().withDefault(null).whereParam("dataProperties").isOptional().whereParam("navigationProperties").isOptional().whereParam("custom").isOptional().applyAll(this), 
            this.name = qualifyTypeName(this.shortName, this.namespace), this.dataProperties = [], 
            this.navigationProperties = [], this.complexProperties = [], this.keyProperties = [], 
            this.foreignKeyProperties = [], this.concurrencyProperties = [], this.unmappedProperties = [], 
            this.validators = [], this.warnings = [], this._mappedPropertiesCount = 0, this.subtypes = [], 
            addProperties(this, config.dataProperties, DataProperty), addProperties(this, config.navigationProperties, NavigationProperty);
        }, proto = ctor.prototype;
        return proto._$typeName = "EntityType", proto.setProperties = function(config) {
            assertConfig(config).whereParam("autoGeneratedKeyType").isEnumOf(AutoGeneratedKeyType).isOptional().whereParam("defaultResourceName").isString().isOptional().whereParam("custom").isOptional().applyAll(this), 
            config.defaultResourceName && (this.defaultResourceName = config.defaultResourceName);
        }, proto.isSubtypeOf = function(entityType) {
            assertParam(entityType, "entityType").isInstanceOf(EntityType).check();
            var baseType = this;
            do {
                if (baseType === entityType) return !0;
                baseType = baseType.baseEntityType;
            } while (baseType);
            return !1;
        }, proto.getSelfAndSubtypes = function() {
            var result = [ this ];
            return this.subtypes.forEach(function(st) {
                var subtypes = st.getSelfAndSubtypes();
                result.push.apply(result, subtypes);
            }), result;
        }, proto.addProperty = function(property) {
            if (assertParam(property, "dataProperty").isInstanceOf(DataProperty).or().isInstanceOf(NavigationProperty).check(), 
            this.metadataStore && !property.isUnmapped) throw new Error("The '" + this.name + "' EntityType has already been added to a MetadataStore and therefore no additional properties may be added to it.");
            if (property.parentType) {
                if (property.parentType !== this) throw new Error("This dataProperty has already been added to " + property.parentType.name);
                return this;
            }
            return property.parentType = this, property.isDataProperty ? this._addDataProperty(property) : this._addNavigationProperty(property), 
            this;
        }, proto.createEntity = function(initialValues) {
            var instance = this._createInstanceCore();
            return initialValues && __objectForEach(initialValues, function(key, value) {
                instance.setProperty(key, value);
            }), this._initializeInstance(instance), instance;
        }, proto._createInstanceCore = function() {
            var aCtor = this.getEntityCtor(), instance = new aCtor();
            return new EntityAspect(instance), instance;
        }, proto._initializeInstance = function(instance) {
            this.baseEntityType && this.baseEntityType._initializeInstance(instance);
            var initFn = this.initializationFn;
            initFn && ("string" == typeof initFn && (initFn = instance[initFn]), initFn(instance)), 
            this.complexProperties && this.complexProperties.forEach(function(cp) {
                var ctInstance = instance.getProperty(cp.name);
                cp.dataType._initializeInstance(ctInstance);
            }), instance.entityAspect && (instance.entityAspect._initialized = !0);
        }, proto.getCtor = proto.getEntityCtor = function(forceRefresh) {
            if (this._ctor && !forceRefresh) return this._ctor;
            var ctorRegistry = this.metadataStore._ctorRegistry, r = ctorRegistry[this.name] || ctorRegistry[this.shortName] || {}, aCtor = r.ctor || this._ctor;
            if (aCtor && aCtor.prototype.entityType && aCtor.prototype.entityType.metadataStore !== this.metadataStore) throw new Error("Cannot register the same constructor for " + this.name + " in different metadata stores.  Please define a separate constructor for each metadata store.");
            if (r.ctor && forceRefresh && (this._extra = void 0), !aCtor) {
                var createCtor = __modelLibraryDef.getDefaultInstance().createCtor;
                aCtor = createCtor ? createCtor(this) : createEmptyCtor();
            }
            return this.initializationFn = r.initFn, aCtor.prototype._$typeName = this.name, 
            this._setCtor(aCtor), aCtor;
        }, proto._setCtor = function(aCtor, interceptor) {
            var proto = aCtor.prototype;
            extra = this._extra || {}, this._extra = extra;
            var instance = new aCtor();
            calcUnmappedProperties(this, instance), "EntityType" === this._$typeName ? proto.entityType = this : proto.complexType = this, 
            proto._$interceptor = interceptor || defaultPropertyInterceptor, __modelLibraryDef.getDefaultInstance().initializeEntityPrototype(proto), 
            this._ctor = aCtor;
        }, proto.addValidator = function(validator, property) {
            assertParam(validator, "validator").isInstanceOf(Validator).check(), assertParam(property, "property").isOptional().isString().or().isEntityProperty().check(), 
            property ? ("string" == typeof property && (property = this.getProperty(property, !0)), 
            property.validators.push(validator)) : this.validators.push(validator);
        }, proto.getProperties = function() {
            return this.dataProperties.concat(this.navigationProperties);
        }, proto.getPropertyNames = function() {
            return this.getProperties().map(__pluck("name"));
        }, proto.getDataProperty = function(propertyName, isServerName) {
            var propName = isServerName ? "nameOnServer" : "name";
            return __arrayFirst(this.dataProperties, __propEq(propName, propertyName));
        }, proto.getNavigationProperty = function(propertyName, isServerName) {
            var propName = isServerName ? "nameOnServer" : "name";
            return __arrayFirst(this.navigationProperties, __propEq(propName, propertyName));
        }, proto.getProperty = function(propertyPath, throwIfNotFound) {
            throwIfNotFound = throwIfNotFound || !1;
            var propertyNames = Array.isArray(propertyPath) ? propertyPath : propertyPath.trim().split("."), propertyName = propertyNames[0], prop = __arrayFirst(this.getProperties(), __propEq("name", propertyName));
            if (1 === propertyNames.length) {
                if (prop) return prop;
                if (throwIfNotFound) throw new Error("unable to locate property: " + propertyName + " on entityType: " + this.name);
                return null;
            }
            if (prop) {
                propertyNames.shift();
                var nextParentType = prop.isNavigationProperty ? prop.entityType : prop.dataType;
                if (nextParentType) return nextParentType.getProperty(propertyNames, throwIfNotFound);
                throw new Error("should not get here - unknown property type for: " + prop.name);
            }
            if (throwIfNotFound) throw new Error("unable to locate property: " + propertyName + " on type: " + this.name);
            return null;
        }, proto.toString = function() {
            return this.name;
        }, proto.toJSON = function() {
            return __toJson(this, {
                shortName: null,
                namespace: null,
                baseTypeName: null,
                isAbstract: !1,
                autoGeneratedKeyType: null,
                defaultResourceName: null,
                dataProperties: localPropsOnly,
                navigationProperties: localPropsOnly,
                validators: null,
                custom: null
            });
        }, proto._clientPropertyPathToServer = function(propertyPath) {
            var fn = this.metadataStore.namingConvention.clientPropertyNameToServer, that = this, serverPropPath = propertyPath.split(".").map(function(propName) {
                var prop = that.getProperty(propName);
                return fn(propName, prop);
            }).join("/");
            return serverPropPath;
        }, proto._updateNames = function(property) {
            var nc = this.metadataStore.namingConvention;
            updateClientServerNames(nc, property, "name"), property.isNavigationProperty && (updateClientServerNames(nc, property, "foreignKeyNames"), 
            updateClientServerNames(nc, property, "invForeignKeyNames"));
        }, proto._checkNavProperty = function(navigationProperty) {
            if (navigationProperty.isNavigationProperty) {
                if (navigationProperty.parentType !== this) throw new Error(__formatString("The navigationProperty '%1' is not a property of entity type '%2'", navigationProperty.name, this.name));
                return navigationProperty;
            }
            if ("string" == typeof navigationProperty) {
                var np = this.getProperty(navigationProperty);
                if (np && np.isNavigationProperty) return np;
            }
            throw new Error("The 'navigationProperty' parameter must either be a NavigationProperty or the name of a NavigationProperty");
        }, proto._addDataProperty = function(dp) {
            this.dataProperties.push(dp), dp.isPartOfKey && this.keyProperties.push(dp), dp.isComplexProperty && this.complexProperties.push(dp), 
            dp.concurrencyMode && "None" !== dp.concurrencyMode && this.concurrencyProperties.push(dp), 
            dp.isUnmapped && this.unmappedProperties.push(dp);
        }, proto._addNavigationProperty = function(np) {
            this.navigationProperties.push(np), isQualifiedTypeName(np.entityTypeName) || (np.entityTypeName = qualifyTypeName(np.entityTypeName, this.namespace));
        }, proto._updateCps = function() {
            var metadataStore = this.metadataStore, incompleteMap = metadataStore._incompleteComplexTypeMap;
            this.complexProperties.forEach(function(cp) {
                cp.complexType || resolveCp(cp, metadataStore) || __getArray(incompleteMap, cp.complexTypeName).push(cp);
            }), this.isComplexType && ((incompleteMap[this.name] || []).forEach(function(cp) {
                resolveCp(cp, metadataStore);
            }), delete incompleteMap[this.name]);
        }, proto._updateNps = function() {
            var metadataStore = this.metadataStore, incompleteMap = metadataStore._incompleteTypeMap;
            this.navigationProperties.forEach(function(np) {
                np.entityType || resolveNp(np, metadataStore) || __getArray(incompleteMap, np.entityTypeName).push(np);
            }), (incompleteMap[this.name] || []).forEach(function(np) {
                resolveNp(np, metadataStore);
            }), delete incompleteMap[this.name];
        }, ctor;
    }(), ComplexType = function() {
        var ctor = function(config) {
            if (arguments.length > 1) throw new Error("The ComplexType ctor has a single argument that is a configuration object.");
            assertConfig(config).whereParam("shortName").isNonEmptyString().whereParam("namespace").isString().isOptional().withDefault("").whereParam("dataProperties").isOptional().whereParam("isComplexType").isOptional().isBoolean().whereParam("custom").isOptional().isBoolean().applyAll(this), 
            this.name = qualifyTypeName(this.shortName, this.namespace), this.isComplexType = !0, 
            this.dataProperties = [], this.complexProperties = [], this.validators = [], this.concurrencyProperties = [], 
            this.unmappedProperties = [], this.navigationProperties = [], this.keyProperties = [], 
            addProperties(this, config.dataProperties, DataProperty);
        }, proto = ctor.prototype;
        return proto.setProperties = function(config) {
            assertConfig(config).whereParam("custom").isOptional().applyAll(this);
        }, proto._createInstanceCore = function(parent, parentProperty) {
            var aCtor = this.getCtor(), instance = new aCtor();
            return new ComplexAspect(instance, parent, parentProperty), instance;
        }, proto.addProperty = function(dataProperty) {
            if (assertParam(dataProperty, "dataProperty").isInstanceOf(DataProperty).check(), 
            this.metadataStore && !dataProperty.isUnmapped) throw new Error("The '" + this.name + "' ComplexType has already been added to a MetadataStore and therefore no additional properties may be added to it.");
            if (dataProperty.parentType) {
                if (dataProperty.parentType !== this) throw new Error("This dataProperty has already been added to " + property.parentType.name);
                return this;
            }
            return this._addDataProperty(dataProperty), this;
        }, proto.getProperties = function() {
            return this.dataProperties;
        }, proto.addValidator = EntityType.prototype.addValidator, proto.getProperty = EntityType.prototype.getProperty, 
        proto.getPropertyNames = EntityType.prototype.getPropertyNames, proto.createInstance = EntityType.prototype.createEntity, 
        proto._addDataProperty = EntityType.prototype._addDataProperty, proto._updateNames = EntityType.prototype._updateNames, 
        proto._updateCps = EntityType.prototype._updateCps, proto._initializeInstance = EntityType.prototype._initializeInstance, 
        proto.getCtor = EntityType.prototype.getEntityCtor, proto._setCtor = EntityType.prototype._setCtor, 
        proto.toJSON = function() {
            return __toJson(this, {
                shortName: null,
                namespace: null,
                isComplexType: null,
                dataProperties: null,
                validators: null,
                custom: null
            });
        }, proto._$typeName = "ComplexType", ctor;
    }(), DataProperty = function() {
        var ctor = function(config) {
            assertConfig(config).whereParam("name").isString().isOptional().whereParam("nameOnServer").isString().isOptional().whereParam("dataType").isEnumOf(DataType).isOptional().or().isString().or().isInstanceOf(ComplexType).whereParam("complexTypeName").isOptional().whereParam("isNullable").isBoolean().isOptional().withDefault(!0).whereParam("isScalar").isOptional().withDefault(!0).whereParam("defaultValue").isOptional().whereParam("isPartOfKey").isBoolean().isOptional().whereParam("isUnmapped").isBoolean().isOptional().whereParam("concurrencyMode").isString().isOptional().whereParam("maxLength").isNumber().isOptional().whereParam("validators").isInstanceOf(Validator).isArray().isOptional().withDefault([]).whereParam("enumType").isOptional().whereParam("rawTypeName").isOptional().whereParam("custom").isOptional().applyAll(this);
            var hasName = !(!this.name && !this.nameOnServer);
            if (!hasName) throw new Error("A DataProperty must be instantiated with either a 'name' or a 'nameOnServer' property");
            if (this.complexTypeName) this.isComplexProperty = !0, this.dataType = null; else if ("string" == typeof this.dataType) {
                var dt = DataType.fromName(this.dataType);
                if (!dt) throw new Error("Unable to find a DataType enumeration by the name of: " + this.dataType);
                this.dataType = dt;
            } else this.dataType || (this.dataType = DataType.String);
            if (null == this.defaultValue) if (this.isNullable) this.defaultValue = null; else if (this.isComplexProperty) ; else if (this.dataType === DataType.Binary) this.defaultValue = "AAAAAAAAJ3U="; else if (this.defaultValue = this.dataType.defaultValue, 
            null == this.defaultValue) throw new Error("A nonnullable DataProperty cannot have a null defaultValue. Name: " + this.name);
            this.isComplexProperty && (this.isScalar = null == this.isScalar || this.isScalar === !0);
        }, proto = ctor.prototype;
        return proto._$typeName = "DataProperty", proto.isDataProperty = !0, proto.isNavigationProperty = !1, 
        proto.setProperties = function(config) {
            assertConfig(config).whereParam("custom").isOptional().applyAll(this);
        }, proto.toJSON = function() {
            return __toJson(this, {
                name: null,
                dataType: function(v) {
                    return v && v.parentEnum ? v.name : void 0;
                },
                complexTypeName: null,
                isNullable: !0,
                defaultValue: null,
                isPartOfKey: !1,
                isUnmapped: !1,
                concurrencyMode: null,
                maxLength: null,
                validators: null,
                enumType: null,
                rawTypeName: null,
                isScalar: !0,
                custom: null
            });
        }, ctor.fromJSON = function(json) {
            return json.dataType = DataType.fromName(json.dataType), json.defaultValue && json.dataType && json.dataType.isDate && (json.defaultValue = new Date(Date.parse(json.defaultValue))), 
            json.validators && (json.validators = json.validators.map(Validator.fromJSON)), 
            new DataProperty(json);
        }, ctor;
    }(), NavigationProperty = function() {
        var ctor = function(config) {
            assertConfig(config).whereParam("name").isString().isOptional().whereParam("nameOnServer").isString().isOptional().whereParam("entityTypeName").isString().whereParam("isScalar").isBoolean().whereParam("associationName").isString().isOptional().whereParam("foreignKeyNames").isArray().isString().isOptional().withDefault([]).whereParam("foreignKeyNamesOnServer").isArray().isString().isOptional().withDefault([]).whereParam("invForeignKeyNames").isArray().isString().isOptional().withDefault([]).whereParam("invForeignKeyNamesOnServer").isArray().isString().isOptional().withDefault([]).whereParam("validators").isInstanceOf(Validator).isArray().isOptional().withDefault([]).whereParam("custom").isOptional().applyAll(this);
            var hasName = !(!this.name && !this.nameOnServer);
            if (!hasName) throw new Error("A Navigation property must be instantiated with either a 'name' or a 'nameOnServer' property");
        }, proto = ctor.prototype;
        return proto._$typeName = "NavigationProperty", proto.isDataProperty = !1, proto.isNavigationProperty = !0, 
        proto.setProperties = function(config) {
            assertConfig(config).whereParam("custom").isOptional().applyAll(this);
        }, proto.toJSON = function() {
            return __toJson(this, {
                name: null,
                entityTypeName: null,
                isScalar: null,
                associationName: null,
                validators: null,
                foreignKeyNames: null,
                invForeignKeyNames: null,
                custom: null
            });
        }, ctor.fromJSON = function(json) {
            return json.validators && (json.validators = json.validators.map(Validator.fromJSON)), 
            new NavigationProperty(json);
        }, ctor;
    }(), AutoGeneratedKeyType = function() {
        var ctor = new Enum("AutoGeneratedKeyType");
        return ctor.None = ctor.addSymbol(), ctor.Identity = ctor.addSymbol(), ctor.KeyGenerator = ctor.addSymbol(), 
        ctor.seal(), ctor;
    }();
    !function() {
        function isEntity(context, v) {
            return null == v ? !1 : void 0 !== v.entityType;
        }
        function isEntityProperty(context, v) {
            return null == v ? !1 : v.isDataProperty || v.isNavigationProperty;
        }
        var proto = Param.prototype;
        proto.isEntity = function() {
            return this._addContext({
                fn: isEntity,
                msg: " must be an entity"
            });
        }, proto.isEntityProperty = function() {
            return this._addContext({
                fn: isEntityProperty,
                msg: " must be either a DataProperty or a NavigationProperty"
            });
        };
    }(), breeze.MetadataStore = MetadataStore, breeze.EntityType = EntityType, breeze.ComplexType = ComplexType, 
    breeze.DataProperty = DataProperty, breeze.NavigationProperty = NavigationProperty, 
    breeze.AutoGeneratedKeyType = AutoGeneratedKeyType, MetadataStore.normalizeTypeName = CsdlMetadataParser.normalizeTypeName;
    var KeyGenerator = function() {
        function getPropEntry(that, keyProp, createIfMissing) {
            var key = keyProp.name + ".." + keyProp.parentType.name, propEntry = that._tempIdMap[key];
            return propEntry || createIfMissing && (propEntry = {
                entityType: keyProp.parentType,
                propertyName: keyProp.name,
                keyMap: {}
            }, that._tempIdMap[key] = propEntry), propEntry;
        }
        var ctor = function() {
            this._tempIdMap = {};
        }, proto = ctor.prototype;
        return proto.generateTempKeyValue = function(entityType, valueIfAvail) {
            var keyProps = entityType.keyProperties;
            if (keyProps.length > 1) throw new Error("Ids can not be autogenerated for entities with multipart keys");
            var nextId, keyProp = keyProps[0], propEntry = getPropEntry(this, keyProp, !0);
            if (null != valueIfAvail && (propEntry.keyMap[valueIfAvail.toString()] || (nextId = valueIfAvail)), 
            void 0 === nextId) {
                var dataType = keyProp.dataType;
                if (!dataType.getNext) throw new Error("Cannot use a property with a dataType of: " + dataType.toString() + " for id generation");
                for (nextId = dataType.getNext(this); null != propEntry.keyMap[nextId.toString()]; ) nextId = dataType.getNext(this);
            }
            return propEntry.keyMap[nextId.toString()] = !0, nextId;
        }, proto.getTempKeys = function() {
            var results = [];
            for (var key in this._tempIdMap) {
                var propEntry = this._tempIdMap[key], entityType = propEntry.entityType;
                for (var keyValue in propEntry.keyMap) results.push(new EntityKey(entityType, [ keyValue ]));
            }
            return results;
        }, proto.isTempKey = function(entityKey) {
            var keyProps = entityKey.entityType.keyProperties;
            if (keyProps.length > 1) return !1;
            var keyProp = keyProps[0], propEntry = getPropEntry(this, keyProp);
            return propEntry ? void 0 !== propEntry.keyMap[entityKey.values[0].toString()] : !1;
        }, __config.registerType(ctor, "KeyGenerator"), ctor;
    }();
    breeze.KeyGenerator = KeyGenerator;
    var LocalQueryComparisonOptions = function() {
        var ctor = function(config) {
            assertConfig(config || {}).whereParam("name").isOptional().isString().whereParam("isCaseSensitive").isOptional().isBoolean().whereParam("usesSql92CompliantStringComparison").isBoolean().applyAll(this), 
            this.name || (this.name = __getUuid()), __config._storeObject(this, proto._$typeName, this.name);
        }, proto = ctor.prototype;
        return proto._$typeName = "LocalQueryComparisonOptions", ctor.caseInsensitiveSQL = new ctor({
            name: "caseInsensitiveSQL",
            isCaseSensitive: !1,
            usesSql92CompliantStringComparison: !0
        }), ctor.defaultInstance = new ctor(ctor.caseInsensitiveSQL), proto.setAsDefault = function() {
            return __setAsDefault(this, ctor);
        }, ctor;
    }();
    breeze.LocalQueryComparisonOptions = LocalQueryComparisonOptions;
    var NamingConvention = function() {
        var ctor = function(config) {
            assertConfig(config || {}).whereParam("name").isOptional().isString().whereParam("serverPropertyNameToClient").isFunction().whereParam("clientPropertyNameToServer").isFunction().applyAll(this), 
            this.name || (this.name = __getUuid()), __config._storeObject(this, proto._$typeName, this.name);
        }, proto = ctor.prototype;
        return proto._$typeName = "NamingConvention", ctor.none = new ctor({
            name: "noChange",
            serverPropertyNameToClient: function(serverPropertyName) {
                return serverPropertyName;
            },
            clientPropertyNameToServer: function(clientPropertyName) {
                return clientPropertyName;
            }
        }), ctor.camelCase = new ctor({
            name: "camelCase",
            serverPropertyNameToClient: function(serverPropertyName) {
                return serverPropertyName.substr(0, 1).toLowerCase() + serverPropertyName.substr(1);
            },
            clientPropertyNameToServer: function(clientPropertyName) {
                return clientPropertyName.substr(0, 1).toUpperCase() + clientPropertyName.substr(1);
            }
        }), ctor.defaultInstance = new ctor(ctor.none), proto.setAsDefault = function() {
            return __setAsDefault(this, ctor);
        }, ctor;
    }();
    breeze.NamingConvention = NamingConvention;
    var EntityQuery = function() {
        function processUsing(eq, map, value, propertyName) {
            var typeName = value._$typeName || value.parentEnum && value.parentEnum.name, key = typeName && typeName.substr(0, 1).toLowerCase() + typeName.substr(1);
            if (propertyName && key != propertyName) throw new Error("Invalid value for property: " + propertyName);
            if (key) {
                var fn = map[key];
                if (void 0 === fn) throw new Error("Invalid config property: " + key);
                null === fn ? eq[key] = value : fn(eq, value);
            } else __objectForEach(value, function(propName, val) {
                processUsing(eq, map, val, propName);
            });
        }
        function normalizePropertyPaths(propertyPaths) {
            return assertParam(propertyPaths, "propertyPaths").isOptional().isString().or().isArray().isString().check(), 
            "string" == typeof propertyPaths && (propertyPaths = propertyPaths.split(",")), 
            propertyPaths = propertyPaths.map(function(pp) {
                return pp.trim();
            });
        }
        function buildPredicate(entity) {
            var entityType = entity.entityType, predParts = entityType.keyProperties.map(function(kp) {
                return Predicate.create(kp.name, FilterQueryOp.Equals, entity.getProperty(kp.name));
            }), pred = Predicate.and(predParts);
            return pred;
        }
        function orderByCore(that, propertyPaths, isDesc) {
            var newClause, eq = that._clone();
            return null == propertyPaths ? (eq.orderByClause = null, eq) : (propertyPaths = normalizePropertyPaths(propertyPaths), 
            newClause = OrderByClause.create(propertyPaths, isDesc), eq.orderByClause ? eq.orderByClause.addClause(newClause) : eq.orderByClause = newClause, 
            eq);
        }
        function selectCore(that, propertyPaths) {
            var eq = that._clone();
            return null == propertyPaths ? (eq.selectClause = null, eq) : (propertyPaths = normalizePropertyPaths(propertyPaths), 
            eq.selectClause = new SelectClause(propertyPaths), eq);
        }
        function expandCore(that, propertyPaths) {
            var eq = that._clone();
            return null == propertyPaths ? (eq.expandClause = null, eq) : (propertyPaths = normalizePropertyPaths(propertyPaths), 
            eq.expandClause = new ExpandClause(propertyPaths), eq);
        }
        function withParametersCore(that, parameters) {
            var eq = that._clone();
            return eq.parameters = parameters, eq;
        }
        function buildKeyPredicate(entityKey) {
            var keyProps = entityKey.entityType.keyProperties, preds = __arrayZip(keyProps, entityKey.values, function(kp, v) {
                return Predicate.create(kp.name, FilterQueryOp.Equals, v);
            }), pred = Predicate.and(preds);
            return pred;
        }
        function buildNavigationPredicate(entity, navigationProperty) {
            if (navigationProperty.isScalar) {
                if (0 === navigationProperty.foreignKeyNames.length) return null;
                var relatedKeyValues = navigationProperty.foreignKeyNames.map(function(fkName) {
                    return entity.getProperty(fkName);
                }), entityKey = new EntityKey(navigationProperty.entityType, relatedKeyValues);
                return buildKeyPredicate(entityKey);
            }
            var inverseNp = navigationProperty.inverse, foreignKeyNames = inverseNp ? inverseNp.foreignKeyNames : navigationProperty.invForeignKeyNames;
            if (0 === foreignKeyNames.length) return null;
            var keyValues = entity.entityAspect.getKey().values, predParts = __arrayZip(foreignKeyNames, keyValues, function(fkName, kv) {
                return Predicate.create(fkName, FilterQueryOp.Equals, kv);
            });
            return Predicate.and(predParts);
        }
        var ctor = function(resourceName) {
            assertParam(resourceName, "resourceName").isOptional().isString().check(), this.resourceName = resourceName, 
            this.entityType = null, this.wherePredicate = null, this.orderByClause = null, this.selectClause = null, 
            this.skipCount = null, this.takeCount = null, this.expandClause = null, this.parameters = {}, 
            this.inlineCountEnabled = !1, this.entityManager = null;
        }, proto = ctor.prototype;
        return proto._$typeName = "EntityQuery", proto.from = function(resourceName) {
            assertParam(resourceName, "resourceName").isString().check();
            var currentName = this.resourceName;
            if (currentName && currentName !== resourceName) throw new Error("This query already has an resourceName - the resourceName may only be set once per query");
            var eq = this._clone();
            return eq.resourceName = resourceName, eq;
        }, ctor.from = function(resourceName) {
            return assertParam(resourceName, "resourceName").isString().check(), new EntityQuery(resourceName);
        }, proto.toType = function(entityType) {
            assertParam(entityType, "entityType").isString().or().isInstanceOf(EntityType).check();
            var eq = this._clone();
            return eq.resultEntityType = entityType, eq;
        }, proto.where = function(predicate) {
            var eq = this._clone();
            if (null == predicate) return eq.wherePredicate = null, eq;
            var pred;
            return pred = Predicate.isPredicate(predicate) ? predicate : Predicate.create(__arraySlice(arguments)), 
            eq.entityType && pred.validate(eq.entityType), eq.wherePredicate = eq.wherePredicate ? new CompositePredicate("and", [ eq.wherePredicate, pred ]) : pred, 
            eq;
        }, proto.orderBy = function(propertyPaths) {
            return orderByCore(this, propertyPaths);
        }, proto.orderByDesc = function(propertyPaths) {
            return orderByCore(this, propertyPaths, !0);
        }, proto.select = function(propertyPaths) {
            return selectCore(this, propertyPaths);
        }, proto.skip = function(count) {
            assertParam(count, "count").isOptional().isNumber().check();
            var eq = this._clone();
            return eq.skipCount = null == count ? null : count, eq;
        }, proto.top = function(count) {
            return this.take(count);
        }, proto.take = function(count) {
            assertParam(count, "count").isOptional().isNumber().check();
            var eq = this._clone();
            return eq.takeCount = null == count ? null : count, eq;
        }, proto.expand = function(propertyPaths) {
            return expandCore(this, propertyPaths);
        }, proto.withParameters = function(parameters) {
            return assertParam(parameters, "parameters").isObject().check(), withParametersCore(this, parameters);
        }, proto.inlineCount = function(enabled) {
            void 0 === enabled && (enabled = !0);
            var eq = this._clone();
            return eq.inlineCountEnabled = enabled, eq;
        }, proto.using = function(obj) {
            if (!obj) return this;
            var eq = this._clone();
            return processUsing(eq, {
                entityManager: null,
                dataService: null,
                queryOptions: null,
                fetchStrategy: function(eq, val) {
                    eq.queryOptions = (eq.queryOptions || new QueryOptions()).using(val);
                },
                mergeStrategy: function(eq, val) {
                    eq.queryOptions = (eq.queryOptions || new QueryOptions()).using(val);
                },
                jsonResultsAdapter: function(eq, val) {
                    eq.dataService = (eq.dataService || new DataService()).using({
                        jsonResultsAdapter: val
                    });
                }
            }, obj), eq;
        }, proto.execute = function(callback, errorCallback) {
            if (!this.entityManager) throw new Error("An EntityQuery must have its EntityManager property set before calling 'execute'");
            return this.entityManager.executeQuery(this, callback, errorCallback);
        }, proto.executeLocally = function() {
            if (!this.entityManager) throw new Error("An EntityQuery must have its EntityManager property set before calling 'executeLocally'");
            return this.entityManager.executeQueryLocally(this);
        }, ctor.fromEntities = function(entities) {
            assertParam(entities, "entities").isEntity().or().isNonEmptyArray().isEntity().check(), 
            Array.isArray(entities) || (entities = __arraySlice(arguments));
            var firstEntity = entities[0], q = new EntityQuery(firstEntity.entityType.defaultResourceName), preds = entities.map(function(entity) {
                return buildPredicate(entity);
            }), pred = Predicate.or(preds);
            q = q.where(pred);
            var em = firstEntity.entityAspect.entityManager;
            return em && (q = q.using(em)), q;
        }, ctor.fromEntityKey = function(entityKey) {
            assertParam(entityKey, "entityKey").isInstanceOf(EntityKey).check();
            var q = new EntityQuery(entityKey.entityType.defaultResourceName), pred = buildKeyPredicate(entityKey);
            return q = q.where(pred);
        }, ctor.fromEntityNavigation = function(entity, navigationProperty) {
            assertParam(entity, "entity").isEntity().check(), assertParam(navigationProperty, "navigationProperty").isInstanceOf(NavigationProperty).check();
            var navProperty = entity.entityType._checkNavProperty(navigationProperty), q = new EntityQuery(navProperty.entityType.defaultResourceName), pred = buildNavigationPredicate(entity, navProperty);
            q = q.where(pred);
            var em = entity.entityAspect.entityManager;
            return em && (q = q.using(em)), q;
        }, proto._getFromEntityType = function(metadataStore, throwErrorIfNotFound) {
            var entityType = this.entityType;
            if (entityType) return entityType;
            var resourceName = this.resourceName;
            if (!resourceName) throw new Error("There is no resourceName for this query");
            if (metadataStore.isEmpty()) {
                if (throwErrorIfNotFound) throw new Error("There is no metadata available for this query. Are you querying the local cache before you've fetched metadata?");
                return null;
            }
            var entityTypeName = metadataStore.getEntityTypeNameForResourceName(resourceName);
            if (entityType = entityTypeName ? metadataStore._getEntityType(entityTypeName) : this._getToEntityType(metadataStore, !0), 
            !entityType) {
                if (throwErrorIfNotFound) throw new Error(__formatString("Cannot find an entityType for resourceName: '%1'.  Consider adding an 'EntityQuery.toType' call to your query or calling the MetadataStore.setEntityTypeForResourceName method to register an entityType for this resourceName.", resourceName));
                return null;
            }
            return this.entityType = entityType, entityType;
        }, proto._getToEntityType = function(metadataStore, skipFromCheck) {
            return this.resultEntityType instanceof EntityType ? this.resultEntityType : this.resultEntityType ? (this.resultEntityType = metadataStore._getEntityType(this.resultEntityType, !1), 
            this.resultEntityType) : skipFromCheck ? null : !this.selectClause && this._getFromEntityType(metadataStore, !1);
        }, proto._clone = function() {
            var copy = new EntityQuery();
            return copy.resourceName = this.resourceName, copy.entityType = this.entityType, 
            copy.wherePredicate = this.wherePredicate, copy.orderByClause = this.orderByClause, 
            copy.selectClause = this.selectClause, copy.skipCount = this.skipCount, copy.takeCount = this.takeCount, 
            copy.expandClause = this.expandClause, copy.inlineCountEnabled = this.inlineCountEnabled, 
            copy.parameters = __extend({}, this.parameters), copy.queryOptions = this.queryOptions, 
            copy.entityManager = this.entityManager, copy.dataService = this.dataService, copy.resultEntityType = this.resultEntityType, 
            copy;
        }, proto._toUri = function(metadataStore) {
            function toFilterString() {
                var clause = eq.wherePredicate;
                if (clause) return eq.entityType && clause.validate(eq.entityType), clause.toOdataFragment(entityType);
            }
            function toInlineCountString() {
                return eq.inlineCountEnabled ? eq.inlineCountEnabled ? "allpages" : "none" : void 0;
            }
            function toOrderByString() {
                var clause = eq.orderByClause;
                if (clause) return eq.entityType && clause.validate(eq.entityType), clause.toOdataFragment(entityType);
            }
            function toSelectString() {
                var clause = eq.selectClause;
                if (clause) return eq.entityType && clause.validate(eq.entityType), clause.toOdataFragment(entityType);
            }
            function toExpandString() {
                var clause = eq.expandClause;
                if (clause) return clause.toOdataFragment(entityType);
            }
            function toSkipString() {
                var count = eq.skipCount;
                if (count) return count.toString();
            }
            function toTopString() {
                var count = eq.takeCount;
                if (null != count) return count.toString();
            }
            function toQueryOptionsString(queryOptions) {
                var qoStrings = [];
                for (var qoName in queryOptions) {
                    var qoValue = queryOptions[qoName];
                    void 0 !== qoValue && (qoValue instanceof Array ? qoValue.forEach(function(qov) {
                        qoStrings.push(qoName + "=" + encodeURIComponent(qov));
                    }) : qoStrings.push(qoName + "=" + encodeURIComponent(qoValue)));
                }
                return qoStrings.length > 0 ? "?" + qoStrings.join("&") : "";
            }
            var entityType = this._getFromEntityType(metadataStore, !1);
            entityType || (entityType = new EntityType(metadataStore));
            var eq = this, queryOptions = {};
            queryOptions.$filter = toFilterString(), queryOptions.$orderby = toOrderByString(), 
            queryOptions.$skip = toSkipString(), queryOptions.$top = toTopString(), queryOptions.$expand = toExpandString(), 
            queryOptions.$select = toSelectString(), queryOptions.$inlinecount = toInlineCountString();
            var qoText = toQueryOptionsString(queryOptions);
            return this.resourceName + qoText;
        }, proto._toFilterFunction = function(entityType) {
            var wherePredicate = this.wherePredicate;
            return wherePredicate ? (wherePredicate.validate(entityType), wherePredicate.toFunction(entityType)) : null;
        }, proto._toOrderByComparer = function(entityType) {
            var orderByClause = this.orderByClause;
            return orderByClause ? orderByClause.getComparer(entityType) : null;
        }, ctor;
    }(), QueryFuncs = function() {
        var obj = {
            toupper: {
                fn: function(source) {
                    return source.toUpperCase();
                },
                dataType: DataType.String
            },
            tolower: {
                fn: function(source) {
                    return source.toLowerCase();
                },
                dataType: DataType.String
            },
            substring: {
                fn: function(source, pos, length) {
                    return source.substring(pos, length);
                },
                dataType: DataType.String
            },
            substringof: {
                fn: function(find, source) {
                    return source.indexOf(find) >= 0;
                },
                dataType: DataType.Boolean
            },
            length: {
                fn: function(source) {
                    return source.length;
                },
                dataType: DataType.Int32
            },
            trim: {
                fn: function(source) {
                    return source.trim();
                },
                dataType: DataType.String
            },
            concat: {
                fn: function(s1, s2) {
                    return s1.concat(s2);
                },
                dataType: DataType.String
            },
            replace: {
                fn: function(source, find, replace) {
                    return source.replace(find, replace);
                },
                dataType: DataType.String
            },
            startswith: {
                fn: function(source, find) {
                    return __stringStartsWith(source, find);
                },
                dataType: DataType.Boolean
            },
            endswith: {
                fn: function(source, find) {
                    return __stringEndsWith(source, find);
                },
                dataType: DataType.Boolean
            },
            indexof: {
                fn: function(source, find) {
                    return source.indexOf(find);
                },
                dataType: DataType.Int32
            },
            round: {
                fn: function(source) {
                    return Math.round(source);
                },
                dataType: DataType.Int32
            },
            ceiling: {
                fn: function(source) {
                    return Math.ceil(source);
                },
                dataType: DataType.Int32
            },
            floor: {
                fn: function(source) {
                    return Math.floor(source);
                },
                dataType: DataType.Int32
            },
            second: {
                fn: function(source) {
                    return source.second;
                },
                dataType: DataType.Int32
            },
            minute: {
                fn: function(source) {
                    return source.minute;
                },
                dataType: DataType.Int32
            },
            day: {
                fn: function(source) {
                    return source.day;
                },
                dataType: DataType.Int32
            },
            month: {
                fn: function(source) {
                    return source.month;
                },
                dataType: DataType.Int32
            },
            year: {
                fn: function(source) {
                    return source.year;
                },
                dataType: DataType.Int32
            }
        };
        return obj;
    }(), FnNode = function() {
        function createPropFunction(propertyPath) {
            var properties = propertyPath.split(".");
            return 1 === properties.length ? function(entity) {
                return entity.getProperty(propertyPath);
            } : function(entity) {
                return getPropertyPathValue(entity, properties);
            };
        }
        var RX_IDENTIFIER = /^[a-z_][\w.$]*$/i, RX_COMMA_DELIM1 = /('[^']*'|[^,]+)/g, RX_COMMA_DELIM2 = /("[^"]*"|[^,]+)/g, ctor = function(source, tokens, entityType) {
            var parts = source.split(":");
            if (this.isRealNode = !0, 1 === parts.length) {
                var value = parts[0].trim();
                this.value = value;
                var firstChar = value.substr(0, 1), quoted = "'" === firstChar || '"' === firstChar;
                if (quoted) {
                    var unquoted = value.substr(1, value.length - 2);
                    this.fn = function() {
                        return unquoted;
                    }, this.dataType = DataType.String;
                } else {
                    var mayBeIdentifier = RX_IDENTIFIER.test(value);
                    if (mayBeIdentifier) {
                        if (entityType && null == entityType.getProperty(value, !1)) return this.isRealNode = !1, 
                        void 0;
                        this.propertyPath = value, this.fn = createPropFunction(value);
                    } else {
                        if (entityType) return this.isRealNode = !1, void 0;
                        this.fn = function() {
                            return value;
                        }, this.dataType = DataType.fromValue(value);
                    }
                }
            } else try {
                this.fnName = parts[0].trim().toLowerCase();
                var qf = QueryFuncs[this.fnName];
                this.localFn = qf.fn, this.dataType = qf.dataType;
                var that = this;
                this.fn = function(entity) {
                    var resolvedNodes = that.fnNodes.map(function(fnNode) {
                        var argVal = fnNode.fn(entity);
                        return argVal;
                    }), val = that.localFn.apply(null, resolvedNodes);
                    return val;
                };
                var argSource = tokens[parts[1]].trim();
                "(" === argSource.substr(0, 1) && (argSource = argSource.substr(1, argSource.length - 2));
                var commaMatchStr = source.indexOf("'") >= 0 ? RX_COMMA_DELIM1 : RX_COMMA_DELIM2, args = argSource.match(commaMatchStr);
                this.fnNodes = args.map(function(a) {
                    return new FnNode(a, tokens);
                });
            } catch (e) {
                this.isRealNode = !1;
            }
        }, proto = ctor.prototype;
        return ctor.create = function(source, entityType, operator) {
            if ("string" != typeof source) return null;
            for (var m, regex = /\([^()]*\)/, tokens = [], i = 0; m = regex.exec(source); ) {
                var token = m[0];
                tokens.push(token);
                var repl = ":" + i++;
                source = source.replace(token, repl);
            }
            var node = new FnNode(source, tokens, operator ? null : entityType);
            return node.isRealNode ? (!node.dataType && operator && operator.isStringFn && (node.dataType = DataType.String), 
            node._validate(entityType), node) : null;
        }, proto.toString = function() {
            if (this.fnName) {
                var args = this.fnNodes.map(function(fnNode) {
                    return fnNode.toString();
                }), uri = this.fnName + "(" + args.join(",") + ")";
                return uri;
            }
            return this.value;
        }, proto.toOdataFragment = function(entityType) {
            if (this._validate(entityType), this.fnName) {
                var args = this.fnNodes.map(function(fnNode) {
                    return fnNode.toOdataFragment(entityType);
                }), uri = this.fnName + "(" + args.join(",") + ")";
                return uri;
            }
            var firstChar = this.value.substr(0, 1);
            return "'" === firstChar || '"' === firstChar ? this.value : this.value == this.propertyPath ? entityType._clientPropertyPathToServer(this.propertyPath) : this.value;
        }, proto._validate = function(entityType) {
            if (!this.isValidated) if (this.isValidated = !0, this.propertyPath) {
                if (entityType.isAnonymous) return;
                var prop = entityType.getProperty(this.propertyPath, !0);
                if (!prop) {
                    var msg = __formatString("Unable to resolve propertyPath.  EntityType: '%1'   PropertyPath: '%2'", entityType.name, this.propertyPath);
                    throw new Error(msg);
                }
                this.dataType = prop.isDataProperty ? prop.dataType : prop.entityType;
            } else this.fnNodes && this.fnNodes.forEach(function(node) {
                node._validate(entityType);
            });
        }, ctor;
    }(), FilterQueryOp = function() {
        var aEnum = new Enum("FilterQueryOp");
        return aEnum.Equals = aEnum.addSymbol({
            operator: "eq",
            aliases: [ "==" ]
        }), aEnum.NotEquals = aEnum.addSymbol({
            operator: "ne",
            aliases: [ "!=" ]
        }), aEnum.GreaterThan = aEnum.addSymbol({
            operator: "gt",
            aliases: [ ">" ]
        }), aEnum.LessThan = aEnum.addSymbol({
            operator: "lt",
            aliases: [ "<" ]
        }), aEnum.GreaterThanOrEqual = aEnum.addSymbol({
            operator: "ge",
            aliases: [ ">=" ]
        }), aEnum.LessThanOrEqual = aEnum.addSymbol({
            operator: "le",
            aliases: [ "<=" ]
        }), aEnum.Contains = aEnum.addSymbol({
            operator: "substringof",
            isFunction: !0,
            isStringFn: !0
        }), aEnum.StartsWith = aEnum.addSymbol({
            operator: "startswith",
            isFunction: !0,
            isStringFn: !0
        }), aEnum.EndsWith = aEnum.addSymbol({
            operator: "endswith",
            isFunction: !0,
            isStringFn: !0
        }), aEnum.IsTypeOf = aEnum.addSymbol({
            operator: "isof",
            isFunction: !0,
            aliases: [ "isTypeOf" ]
        }), aEnum.seal(), aEnum._map = function() {
            var map = {};
            return aEnum.getSymbols().forEach(function(s) {
                map[s.name.toLowerCase()] = s, map[s.operator.toLowerCase()] = s, s.aliases && s.aliases.forEach(function(alias) {
                    map[alias.toLowerCase()] = s;
                });
            }), map;
        }(), aEnum.from = function(op) {
            return aEnum.contains(op) ? op : aEnum._map[op.toLowerCase()];
        }, aEnum;
    }(), BooleanQueryOp = function() {
        var aEnum = new Enum("BooleanQueryOp");
        return aEnum.And = aEnum.addSymbol({
            operator: "and",
            aliases: [ "&&" ]
        }), aEnum.Or = aEnum.addSymbol({
            operator: "or",
            aliases: [ "||" ]
        }), aEnum.Not = aEnum.addSymbol({
            operator: "not",
            aliases: [ "~", "!" ]
        }), aEnum.seal(), aEnum._map = function() {
            var map = {};
            return aEnum.getSymbols().forEach(function(s) {
                map[s.name.toLowerCase()] = s, map[s.operator.toLowerCase()] = s, s.aliases && s.aliases.forEach(function(alias) {
                    map[alias.toLowerCase()] = s;
                });
            }), map;
        }(), aEnum.from = function(op) {
            return aEnum.contains(op) ? op : aEnum._map[op.toLowerCase()];
        }, aEnum;
    }(), Predicate = function() {
        function argsToPredicates(argsx) {
            assertParam(argsx, "arguments").hasProperty("length").check();
            var args = argsx;
            return 1 === argsx.length && Array.isArray(argsx[0]) && (args = argsx[0]), args = __arraySlice(args), 
            Array.isArray(args) && (args = args.filter(function(arg) {
                return !!arg;
            }), Predicate.isPredicate(args[0]) || (args = [ Predicate.create(args) ])), args;
        }
        var ctor = function(propertyOrExpr, operator, value) {
            return arguments[0].prototype === !0 ? this : new SimplePredicate(propertyOrExpr, operator, value);
        }, proto = ctor.prototype;
        return ctor.isPredicate = function(o) {
            return o instanceof Predicate;
        }, ctor.create = function(property, operator, value) {
            return Array.isArray(property) ? new SimplePredicate(property[0], property[1], property[2]) : new SimplePredicate(property, operator, value);
        }, ctor.and = function(predicates) {
            return predicates = argsToPredicates(arguments), 0 === predicates.length ? null : 1 === predicates.length ? predicates[0] : new CompositePredicate("and", predicates);
        }, ctor.or = function(predicates) {
            return predicates = argsToPredicates(arguments), 0 === predicates.length ? null : 1 === predicates.length ? predicates[0] : new CompositePredicate("or", predicates);
        }, ctor.not = function(predicate) {
            return new CompositePredicate("not", [ predicate ]);
        }, proto.and = function(predicates) {
            return predicates = argsToPredicates(arguments), predicates.unshift(this), ctor.and(predicates);
        }, proto.or = function(predicates) {
            return predicates = argsToPredicates(arguments), predicates.unshift(this), ctor.or(predicates);
        }, proto.not = function() {
            return new CompositePredicate("not", [ this ]);
        }, ctor;
    }(), SimplePredicate = function() {
        function getPredicateFn(entityType, filterQueryOp, dataType) {
            var predFn, lqco = entityType.metadataStore.localQueryComparisonOptions, mc = getComparableFn(dataType);
            switch (filterQueryOp) {
              case FilterQueryOp.Equals:
                predFn = function(v1, v2) {
                    return v1 && "string" == typeof v1 ? stringEquals(v1, v2, lqco) : mc(v1) == mc(v2);
                };
                break;

              case FilterQueryOp.NotEquals:
                predFn = function(v1, v2) {
                    return v1 && "string" == typeof v1 ? !stringEquals(v1, v2, lqco) : mc(v1) != mc(v2);
                };
                break;

              case FilterQueryOp.GreaterThan:
                predFn = function(v1, v2) {
                    return mc(v1) > mc(v2);
                };
                break;

              case FilterQueryOp.GreaterThanOrEqual:
                predFn = function(v1, v2) {
                    return mc(v1) >= mc(v2);
                };
                break;

              case FilterQueryOp.LessThan:
                predFn = function(v1, v2) {
                    return mc(v1) < mc(v2);
                };
                break;

              case FilterQueryOp.LessThanOrEqual:
                predFn = function(v1, v2) {
                    return mc(v1) <= mc(v2);
                };
                break;

              case FilterQueryOp.StartsWith:
                predFn = function(v1, v2) {
                    return stringStartsWith(v1, v2, lqco);
                };
                break;

              case FilterQueryOp.EndsWith:
                predFn = function(v1, v2) {
                    return stringEndsWith(v1, v2, lqco);
                };
                break;

              case FilterQueryOp.Contains:
                predFn = function(v1, v2) {
                    return stringContains(v1, v2, lqco);
                };
                break;

              default:
                throw new Error("Unknown FilterQueryOp: " + filterQueryOp);
            }
            return predFn;
        }
        function stringEquals(a, b, lqco) {
            return null == b ? !1 : ("string" != typeof b && (b = b.toString()), lqco.usesSql92CompliantStringComparison && (a = (a || "").trim(), 
            b = (b || "").trim()), lqco.isCaseSensitive || (a = (a || "").toLowerCase(), b = (b || "").toLowerCase()), 
            a === b);
        }
        function stringStartsWith(a, b, lqco) {
            return lqco.isCaseSensitive || (a = (a || "").toLowerCase(), b = (b || "").toLowerCase()), 
            __stringStartsWith(a, b);
        }
        function stringEndsWith(a, b, lqco) {
            return lqco.isCaseSensitive || (a = (a || "").toLowerCase(), b = (b || "").toLowerCase()), 
            __stringEndsWith(a, b);
        }
        function stringContains(a, b, lqco) {
            return lqco.isCaseSensitive || (a = (a || "").toLowerCase(), b = (b || "").toLowerCase()), 
            a.indexOf(b) >= 0;
        }
        var ctor = function(propertyOrExpr, operator, value) {
            if (assertParam(propertyOrExpr, "propertyOrExpr").isString().isOptional().check(), 
            3 != arguments.length || null == operator) return this._odataExpr = propertyOrExpr, 
            void 0;
            if (assertParam(operator, "operator").isEnumOf(FilterQueryOp).or().isString().check(), 
            assertParam(value, "value").isRequired(!0).check(), this._filterQueryOp = FilterQueryOp.from(operator), 
            !this._filterQueryOp) throw new Error("Unknown query operation: " + operator);
            if (propertyOrExpr) this._propertyOrExpr = propertyOrExpr; else if (this._filterQueryOp !== FilterQueryOp.IsTypeOf) throw new Error("propertyOrExpr cannot be null except when using the 'IsTypeOf' operator");
            null != value && "object" == typeof value && void 0 !== value.value ? (this._dataType = value.dataType || DataType.fromValue(value.value), 
            this._value = value.value, this._isLiteral = value.isLiteral) : (this._dataType = DataType.fromValue(value), 
            this._value = value, this._isLiteral = void 0);
        }, proto = new Predicate({
            prototype: !0
        });
        return ctor.prototype = proto, proto.toOdataFragment = function(entityType) {
            if (this._odataExpr) return this._odataExpr;
            if (this._filterQueryOp == FilterQueryOp.IsTypeOf) {
                var oftype = entityType.metadataStore.getEntityType(this._value), typeName = oftype.namespace + "." + oftype.shortName;
                return this._filterQueryOp.operator + "(" + DataType.String.fmtOData(typeName) + ")";
            }
            this.validate(entityType);
            var v2Expr, v1Expr = this._fnNode1 && this._fnNode1.toOdataFragment(entityType);
            if (this._fnNode2) v2Expr = this._fnNode2.toOdataFragment(entityType); else {
                var dataType = this._fnNode1.dataType || this._dataType;
                v2Expr = dataType.fmtOData(this._value);
            }
            return this._filterQueryOp.isFunction ? this._filterQueryOp == FilterQueryOp.Contains ? this._filterQueryOp.operator + "(" + v2Expr + "," + v1Expr + ") eq true" : this._filterQueryOp.operator + "(" + v1Expr + "," + v2Expr + ") eq true" : v1Expr + " " + this._filterQueryOp.operator + " " + v2Expr;
        }, proto.toFunction = function(entityType) {
            if (this._odataExpr) throw new Exception("OData predicateexpressions cannot be interpreted locally");
            this.validate(entityType);
            var dataType = this._fnNode1.dataType || this._dataType, predFn = getPredicateFn(entityType, this._filterQueryOp, dataType), v1Fn = this._fnNode1.fn;
            if (this._fnNode2) {
                var v2Fn = this._fnNode2.fn;
                return function(entity) {
                    return predFn(v1Fn(entity), v2Fn(entity));
                };
            }
            var val = this._value;
            return function(entity) {
                return predFn(v1Fn(entity), val);
            };
        }, proto.toString = function() {
            return __formatString("{%1} %2 {%3}", this._propertyOrExpr, this._filterQueryOp.operator, this._value);
        }, proto.validate = function(entityType) {
            void 0 === this._fnNode1 && this._propertyOrExpr && (this._fnNode1 = FnNode.create(this._propertyOrExpr, entityType, this._filterQueryOp), 
            this.dataType = this._fnNode1.dataType), void 0 !== this._fnNode2 || this._isLiteral || (this._fnNode2 = FnNode.create(this._value, entityType));
        }, ctor;
    }(), CompositePredicate = function() {
        function createFunction(entityType, booleanQueryOp, predicates) {
            var func, funcs;
            switch (booleanQueryOp) {
              case BooleanQueryOp.Not:
                return func = predicates[0].toFunction(entityType), function(entity) {
                    return !func(entity);
                };

              case BooleanQueryOp.And:
                return funcs = predicates.map(function(p) {
                    return p.toFunction(entityType);
                }), function(entity) {
                    var result = funcs.reduce(function(prev, cur) {
                        return prev && cur(entity);
                    }, !0);
                    return result;
                };

              case BooleanQueryOp.Or:
                return funcs = predicates.map(function(p) {
                    return p.toFunction(entityType);
                }), function(entity) {
                    var result = funcs.reduce(function(prev, cur) {
                        return prev || cur(entity);
                    }, !1);
                    return result;
                };

              default:
                throw new Error("Invalid boolean operator:" + booleanQueryOp);
            }
        }
        var ctor = function(booleanOperator, predicates) {
            if (!Array.isArray(predicates)) throw new Error("predicates parameter must be an array");
            if (this._booleanQueryOp = BooleanQueryOp.from(booleanOperator), !this._booleanQueryOp) throw new Error("Unknown query operation: " + booleanOperator);
            if (this._booleanQueryOp === BooleanQueryOp.Not && 1 !== predicates.length) throw new Error("Only a single predicate can be passed in with the 'Not' operator");
            this._predicates = predicates;
        }, proto = new Predicate({
            prototype: !0
        });
        return ctor.prototype = proto, proto.toOdataFragment = function(entityType) {
            if (1 == this._predicates.length) return this._booleanQueryOp.operator + " (" + this._predicates[0].toOdataFragment(entityType) + ")";
            var result = this._predicates.map(function(p) {
                return "(" + p.toOdataFragment(entityType) + ")";
            }).join(" " + this._booleanQueryOp.operator + " ");
            return result;
        }, proto.toFunction = function(entityType) {
            return createFunction(entityType, this._booleanQueryOp, this._predicates);
        }, proto.toString = function() {
            if (1 == this._predicates.length) return this._booleanQueryOp.operator + " (" + this._predicates[0] + ")";
            var result = this._predicates.map(function(p) {
                return "(" + p.toString() + ")";
            }).join(" " + this._booleanQueryOp.operator + " ");
            return result;
        }, proto.validate = function(entityType) {
            this._isValidated || (this._predicates.every(function(p) {
                p.validate(entityType);
            }), this._isValidated = !0);
        }, ctor;
    }(), OrderByClause = function() {
        var ctor = function(propertyPaths, isDesc) {
            return propertyPaths.prototype === !0 ? this : ctor.create(propertyPaths, isDesc);
        }, proto = ctor.prototype;
        return ctor.create = function(propertyPaths, isDesc) {
            if (propertyPaths.length > 1) {
                var clauses = propertyPaths.map(function(pp) {
                    return new SimpleOrderByClause(pp, isDesc);
                });
                return new CompositeOrderByClause(clauses);
            }
            return new SimpleOrderByClause(propertyPaths[0], isDesc);
        }, ctor.combine = function(orderByClauses) {
            return new CompositeOrderByClause(orderByClauses);
        }, ctor.isOrderByClause = function(obj) {
            return obj instanceof OrderByClause;
        }, proto.addClause = function(orderByClause) {
            return new CompositeOrderByClause([ this, orderByClause ]);
        }, ctor;
    }(), SimpleOrderByClause = function() {
        var ctor = function(propertyPath, isDesc) {
            if ("string" != typeof propertyPath) throw new Error("propertyPath is not a string");
            propertyPath = propertyPath.trim();
            var parts = propertyPath.split(" ");
            if (parts.length > 1 && isDesc !== !0 && isDesc !== !1 && (isDesc = __stringStartsWith(parts[1].toLowerCase(), "desc"), 
            !isDesc)) {
                var isAsc = __stringStartsWith(parts[1].toLowerCase(), "asc");
                if (!isAsc) throw new Error("the second word in the propertyPath must begin with 'desc' or 'asc'");
            }
            this.propertyPath = parts[0], this.isDesc = isDesc;
        }, proto = new OrderByClause({
            prototype: !0
        });
        return ctor.prototype = proto, proto.validate = function(entityType) {
            entityType && (this.lastProperty = entityType.getProperty(this.propertyPath, !0));
        }, proto.toOdataFragment = function(entityType) {
            return entityType._clientPropertyPathToServer(this.propertyPath) + (this.isDesc ? " desc" : "");
        }, proto.getComparer = function(entityType) {
            if (this.lastProperty || this.validate(entityType), this.lastProperty) var propDataType = this.lastProperty.dataType, isCaseSensitive = this.lastProperty.parentType.metadataStore.localQueryComparisonOptions.isCaseSensitive;
            var propertyPath = this.propertyPath, isDesc = this.isDesc;
            return function(entity1, entity2) {
                var value1 = getPropertyPathValue(entity1, propertyPath), value2 = getPropertyPathValue(entity2, propertyPath), dataType = propDataType || value1 && DataType.fromValue(value1) || DataType.fromValue(value2);
                if (dataType === DataType.String) isCaseSensitive ? (value1 = value1 || "", value2 = value2 || "") : (value1 = (value1 || "").toLowerCase(), 
                value2 = (value2 || "").toLowerCase()); else {
                    var normalize = getComparableFn(dataType);
                    value1 = normalize(value1), value2 = normalize(value2);
                }
                return value1 === value2 ? 0 : value1 > value2 || void 0 === value2 ? isDesc ? -1 : 1 : isDesc ? 1 : -1;
            };
        }, ctor;
    }(), CompositeOrderByClause = function() {
        var ctor = function(orderByClauses) {
            var resultClauses = [];
            orderByClauses.forEach(function(obc) {
                if (obc instanceof CompositeOrderByClause) resultClauses = resultClauses.concat(obc.orderByClauses); else {
                    if (!(obc instanceof SimpleOrderByClause)) throw new Error("Invalid argument to CompositeOrderByClause ctor.");
                    resultClauses.push(obc);
                }
            }), this._orderByClauses = resultClauses;
        }, proto = new OrderByClause({
            prototype: !0
        });
        return ctor.prototype = proto, proto.validate = function(entityType) {
            this._orderByClauses.forEach(function(obc) {
                obc.validate(entityType);
            });
        }, proto.toOdataFragment = function(entityType) {
            var strings = this._orderByClauses.map(function(obc) {
                return obc.toOdataFragment(entityType);
            });
            return strings.join(",");
        }, proto.getComparer = function(entityType) {
            var orderByFuncs = this._orderByClauses.map(function(obc) {
                return obc.getComparer(entityType);
            });
            return function(entity1, entity2) {
                for (var i = 0; i < orderByFuncs.length; i++) {
                    var result = orderByFuncs[i](entity1, entity2);
                    if (0 !== result) return result;
                }
                return 0;
            };
        }, ctor;
    }(), SelectClause = function() {
        var ctor = function(propertyPaths) {
            this.propertyPaths = propertyPaths, this._pathNames = propertyPaths.map(function(pp) {
                return pp.replace(".", "_");
            });
        }, proto = ctor.prototype;
        return proto.validate = function(entityType) {
            entityType && this.propertyPaths.forEach(function(path) {
                entityType.getProperty(path, !0);
            });
        }, proto.toOdataFragment = function(entityType) {
            var frag = this.propertyPaths.map(function(pp) {
                return entityType._clientPropertyPathToServer(pp);
            }).join(",");
            return frag;
        }, proto.toFunction = function() {
            var that = this;
            return function(entity) {
                var result = {};
                return that.propertyPaths.forEach(function(path, i) {
                    result[that._pathNames[i]] = getPropertyPathValue(entity, path);
                }), result;
            };
        }, ctor;
    }(), ExpandClause = function() {
        var ctor = function(propertyPaths) {
            this.propertyPaths = propertyPaths;
        }, proto = ctor.prototype;
        return proto.toOdataFragment = function(entityType) {
            var frag = this.propertyPaths.map(function(pp) {
                return entityType._clientPropertyPathToServer(pp);
            }).join(",");
            return frag;
        }, ctor;
    }();
    breeze.FilterQueryOp = FilterQueryOp, breeze.Predicate = Predicate, breeze.EntityQuery = EntityQuery, 
    breeze.FnNode = FnNode, breeze.OrderByClause = OrderByClause;
    var MergeStrategy = function() {
        var MergeStrategy = new Enum("MergeStrategy");
        return MergeStrategy.PreserveChanges = MergeStrategy.addSymbol(), MergeStrategy.OverwriteChanges = MergeStrategy.addSymbol(), 
        MergeStrategy.seal(), MergeStrategy;
    }(), FetchStrategy = function() {
        var FetchStrategy = new Enum("FetchStrategy");
        return FetchStrategy.FromServer = FetchStrategy.addSymbol(), FetchStrategy.FromLocalCache = FetchStrategy.addSymbol(), 
        FetchStrategy.seal(), FetchStrategy;
    }(), QueryOptions = function() {
        function updateWithConfig(obj, config) {
            return config && assertConfig(config).whereParam("fetchStrategy").isEnumOf(FetchStrategy).isOptional().whereParam("mergeStrategy").isEnumOf(MergeStrategy).isOptional().applyAll(obj), 
            obj;
        }
        var ctor = function(config) {
            updateWithConfig(this, config);
        }, proto = ctor.prototype;
        return proto._$typeName = "QueryOptions", ctor.resolve = function(queryOptionsArray) {
            return new QueryOptions(__resolveProperties(queryOptionsArray, [ "fetchStrategy", "mergeStrategy" ]));
        }, ctor.defaultInstance = new ctor({
            fetchStrategy: FetchStrategy.FromServer,
            mergeStrategy: MergeStrategy.PreserveChanges
        }), proto.using = function(config) {
            if (!config) return this;
            var result = new QueryOptions(this);
            return MergeStrategy.contains(config) ? config = {
                mergeStrategy: config
            } : FetchStrategy.contains(config) && (config = {
                fetchStrategy: config
            }), updateWithConfig(result, config);
        }, proto.setAsDefault = function() {
            return __setAsDefault(this, ctor);
        }, proto.toJSON = function() {
            return __toJson(this, {
                fetchStrategy: null,
                mergeStrategy: null
            });
        }, ctor.fromJSON = function(json) {
            return new QueryOptions({
                fetchStrategy: FetchStrategy.fromName(json.fetchStrategy),
                mergeStrategy: MergeStrategy.fromName(json.mergeStrategy)
            });
        }, ctor;
    }();
    breeze.QueryOptions = QueryOptions, breeze.FetchStrategy = FetchStrategy, breeze.MergeStrategy = MergeStrategy;
    var EntityGroup = function() {
        function getFilter(entityStates) {
            if (entityStates) {
                if (1 === entityStates.length) {
                    var entityState = entityStates[0];
                    return function(e) {
                        return e ? e.entityAspect.entityState === entityState : !1;
                    };
                }
                return function(e) {
                    return e ? entityStates.some(function(es) {
                        return e.entityAspect.entityState === es;
                    }) : !1;
                };
            }
            return function(e) {
                return !!e;
            };
        }
        var __changedFilter = getFilter([ EntityState.Added, EntityState.Modified, EntityState.Deleted ]), ctor = function(entityManager, entityType) {
            this.entityManager = entityManager, this.entityType = entityType, this._indexMap = {}, 
            this._entities = [], this._emptyIndexes = [];
        }, proto = ctor.prototype;
        return proto.attachEntity = function(entity, entityState) {
            var ix, aspect = entity.entityAspect;
            aspect._initialized || this.entityType._initializeInstance(entity), delete aspect._initialized;
            var keyInGroup = aspect.getKey()._keyInGroup;
            if (ix = this._indexMap[keyInGroup], ix >= 0) {
                if (this._entities[ix] === entity) return aspect.entityState = entityState, entity;
                throw new Error("This key is already attached: " + aspect.getKey());
            }
            return 0 === this._emptyIndexes.length ? ix = this._entities.push(entity) - 1 : (ix = this._emptyIndexes.pop(), 
            this._entities[ix] = entity), this._indexMap[keyInGroup] = ix, aspect.entityState = entityState, 
            aspect.entityGroup = this, aspect.entityManager = this.entityManager, entity;
        }, proto.detachEntity = function(entity) {
            var aspect = entity.entityAspect, keyInGroup = aspect.getKey()._keyInGroup, ix = this._indexMap[keyInGroup];
            if (void 0 === ix) throw new Error("internal error - entity cannot be found in group");
            return delete this._indexMap[keyInGroup], this._emptyIndexes.push(ix), this._entities[ix] = null, 
            entity;
        }, proto.findEntityByKey = function(entityKey) {
            var keyInGroup;
            keyInGroup = entityKey instanceof EntityKey ? entityKey._keyInGroup : EntityKey.createKeyString(entityKey);
            var ix = this._indexMap[keyInGroup];
            return void 0 !== ix ? this._entities[ix] : null;
        }, proto.hasChanges = function() {
            return this._entities.some(__changedFilter);
        }, proto.getEntities = function(entityStates) {
            var filter = getFilter(entityStates);
            return this._entities.filter(filter);
        }, proto._clear = function() {
            this._entities.forEach(function(entity) {
                null != entity && entity.entityAspect._detach();
            }), this._entities = null, this._indexMap = null, this._emptyIndexes = null;
        }, proto._fixupKey = function(tempValue, realValue) {
            var ix = this._indexMap[tempValue];
            if (void 0 === ix) throw new Error("Internal Error in key fixup - unable to locate entity");
            var entity = this._entities[ix], keyPropName = entity.entityType.keyProperties[0].name;
            entity.setProperty(keyPropName, realValue), delete entity.entityAspect.hasTempKey, 
            delete this._indexMap[tempValue], this._indexMap[realValue] = ix;
        }, proto._replaceKey = function(oldKey, newKey) {
            var ix = this._indexMap[oldKey._keyInGroup];
            delete this._indexMap[oldKey._keyInGroup], this._indexMap[newKey._keyInGroup] = ix;
        }, ctor;
    }(), EntityManager = function() {
        function updateWithConfig(em, config, isCtor) {
            var defaultQueryOptions = isCtor ? QueryOptions.defaultInstance : em.queryOptions, defaultSaveOptions = isCtor ? SaveOptions.defaultInstance : em.saveOptions, defaultValidationOptions = isCtor ? ValidationOptions.defaultInstance : em.validationOptions, configParam = assertConfig(config).whereParam("serviceName").isOptional().isString().whereParam("dataService").isOptional().isInstanceOf(DataService).whereParam("queryOptions").isInstanceOf(QueryOptions).isOptional().withDefault(defaultQueryOptions).whereParam("saveOptions").isInstanceOf(SaveOptions).isOptional().withDefault(defaultSaveOptions).whereParam("validationOptions").isInstanceOf(ValidationOptions).isOptional().withDefault(defaultValidationOptions).whereParam("keyGeneratorCtor").isFunction().isOptional();
            isCtor && (configParam = configParam.whereParam("metadataStore").isInstanceOf(MetadataStore).isOptional().withDefault(new MetadataStore())), 
            configParam.applyAll(em), __updateWithDefaults(em.queryOptions, defaultQueryOptions), 
            __updateWithDefaults(em.saveOptions, defaultSaveOptions), __updateWithDefaults(em.validationOptions, defaultValidationOptions), 
            config.serviceName && (em.dataService = new DataService({
                serviceName: em.serviceName
            })), em.serviceName = em.dataService && em.dataService.serviceName, em.keyGeneratorCtor = em.keyGeneratorCtor || KeyGenerator, 
            (isCtor || config.keyGeneratorCtor) && (em.keyGenerator = new em.keyGeneratorCtor());
        }
        function clearServerErrors(entities) {
            entities.forEach(function(entity) {
                var serverKeys = [], valErrors = entity.entityAspect._validationErrors;
                __objectForEach(valErrors, function(key, ve) {
                    ve.isServerError && serverKeys.push(key);
                }), 0 !== serverKeys.length && (serverKeys.forEach(function(key) {
                    delete valErrors[key];
                }), entity.hasValidationErrors = !__isEmpty(valErrors));
            });
        }
        function createEntityErrors(entities) {
            var entityErrors = [];
            return entities.forEach(function(entity) {
                __objectForEach(entity.entityAspect._validationErrors, function(key, ve) {
                    entityErrors.push({
                        entity: entity,
                        errorName: ve.validator.name,
                        errorMessage: ve.errorMessage,
                        propertyName: ve.propertyName,
                        isServerError: ve.isServerError
                    });
                });
            }), entityErrors;
        }
        function processServerErrors(saveContext, error) {
            var serverErrors = error.entityErrors;
            if (serverErrors) {
                var entityManager = saveContext.entityManager, metadataStore = entityManager.metadataStore;
                error.entityErrors = serverErrors.map(function(serr) {
                    var entity = null;
                    if (serr.keyValues) {
                        var entityType = metadataStore._getEntityType(serr.entityTypeName), ekey = new EntityKey(entityType, serr.keyValues);
                        entity = entityManager.findEntityByKey(ekey);
                    }
                    if (entity) {
                        var context = serr.propertyName ? {
                            propertyName: serr.propertyName,
                            property: entityType.getProperty(serr.propertyName)
                        } : {}, key = ValidationError.getKey(serr.errorName || serr.errorMessage, serr.propertyName), ve = new ValidationError(null, context, serr.errorMessage, key);
                        ve.isServerError = !0, entity.entityAspect.addValidationError(ve);
                    }
                    var entityError = {
                        entity: entity,
                        errorName: serr.errorName,
                        errorMessage: serr.errorMessage,
                        propertyName: serr.propertyName,
                        isServerError: !0
                    };
                    return entityError;
                });
            }
        }
        function haveSameContents(arr1, arr2) {
            if (arr1.length !== arr2.length) return !1;
            for (var i = 0, c = arr1.length; c > i; i++) if (arr1[i] !== arr2[i]) return !1;
            return !0;
        }
        function checkEntityTypes(em, entityTypes) {
            return assertParam(entityTypes, "entityTypes").isString().isOptional().or().isNonEmptyArray().isString().or().isInstanceOf(EntityType).or().isNonEmptyArray().isInstanceOf(EntityType).check(), 
            "string" == typeof entityTypes ? entityTypes = em.metadataStore._getEntityType(entityTypes, !1) : Array.isArray(entityTypes) && "string" == typeof entityTypes[0] && (entityTypes = entityTypes.map(function(etName) {
                return em.metadataStore._getEntityType(etName, !1);
            })), entityTypes;
        }
        function getEntitiesCore(em, entityTypes, entityStates) {
            var selected, entityGroups = getEntityGroups(em, entityTypes);
            return entityGroups.forEach(function(eg) {
                if (eg) {
                    var entities = eg.getEntities(entityStates);
                    selected ? selected.push.apply(selected, entities) : selected = entities;
                }
            }), selected || [];
        }
        function createEntityKey(em, args) {
            if (args[0] instanceof EntityKey) return {
                entityKey: args[0],
                remainingArgs: __arraySlice(args, 1)
            };
            if ("string" == typeof args[0] && args.length >= 2) {
                var entityType = em.metadataStore._getEntityType(args[0], !1);
                return {
                    entityKey: new EntityKey(entityType, args[1]),
                    remainingArgs: __arraySlice(args, 2)
                };
            }
            throw new Error("This method requires as its initial parameters either an EntityKey or an entityType name followed by a value or an array of values.");
        }
        function markIsBeingSaved(entities, flag) {
            entities.forEach(function(entity) {
                entity.entityAspect.isBeingSaved = flag;
            });
        }
        function exportEntityGroups(em, entities) {
            var entityGroupMap;
            entities ? (entityGroupMap = {}, entities.forEach(function(e) {
                var group = entityGroupMap[e.entityType.name];
                group || (group = {}, group.entityType = e.entityType, group._entities = [], entityGroupMap[e.entityType.name] = group), 
                group._entities.push(e);
            })) : entityGroupMap = em._entityGroupMap;
            var tempKeys = [], newGroupMap = {};
            return __objectForEach(entityGroupMap, function(entityTypeName, entityGroup) {
                newGroupMap[entityTypeName] = exportEntityGroup(entityGroup, tempKeys);
            }), {
                entityGroupMap: newGroupMap,
                tempKeys: tempKeys
            };
        }
        function exportEntityGroup(entityGroup, tempKeys) {
            var resultGroup = {}, entityType = entityGroup.entityType, dps = entityType.dataProperties, rawEntities = [];
            return entityGroup._entities.forEach(function(entity) {
                if (entity) {
                    var rawEntity = structuralObjectToJson(entity, dps, tempKeys);
                    rawEntities.push(rawEntity);
                }
            }), resultGroup.entities = rawEntities, resultGroup;
        }
        function structuralObjectToJson(so, dps, tempKeys) {
            var result = {};
            dps.forEach(function(dp) {
                var dpName = dp.name, value = so.getProperty(dpName);
                if (null != value || null != dp.defaultValue) if (value && value.complexType) {
                    var coDps = dp.dataType.dataProperties;
                    result[dpName] = Array.isArray(value) ? 0 == value.length ? [] : value.map(function(v) {
                        return structuralObjectToJson(v, coDps);
                    }) : structuralObjectToJson(value, coDps);
                } else result[dpName] = value;
            });
            var aspect, newAspect;
            if (so.entityAspect) {
                aspect = so.entityAspect;
                var entityState = aspect.entityState;
                newAspect = {
                    tempNavPropNames: exportTempKeyInfo(aspect, tempKeys),
                    entityState: entityState.name
                }, (entityState.isModified() || entityState.isDeleted()) && (newAspect.originalValuesMap = aspect.originalValues), 
                result.entityAspect = newAspect;
            } else aspect = so.complexAspect, newAspect = {}, aspect.originalValues && !__isEmpty(aspect.originalValues) && (newAspect.originalValuesMap = aspect.originalValues), 
            result.complexAspect = newAspect;
            return result;
        }
        function exportTempKeyInfo(entityAspect, tempKeys) {
            var entity = entityAspect.entity;
            entityAspect.hasTempKey && tempKeys.push(entityAspect.getKey().toJSON());
            var tempNavPropNames;
            return entity.entityType.navigationProperties.forEach(function(np) {
                if (np.relatedDataProperties) {
                    var relatedValue = entity.getProperty(np.name);
                    relatedValue && relatedValue.entityAspect.hasTempKey && (tempNavPropNames = tempNavPropNames || [], 
                    tempNavPropNames.push(np.name));
                }
            }), tempNavPropNames;
        }
        function importEntityGroup(entityGroup, jsonGroup, config) {
            var tempKeyMap = config.tempKeyMap, entityType = entityGroup.entityType, shouldOverwrite = config.mergeStrategy === MergeStrategy.OverwriteChanges, targetEntity = null, dataProps = entityType.dataProperties, em = (entityType.keyProperties, 
            entityGroup.entityManager), entityChanged = em.entityChanged, entitiesToLink = [];
            return jsonGroup.entities.forEach(function(rawEntity) {
                var newTempKey, newAspect = rawEntity.entityAspect, entityKey = getEntityKeyFromRawEntity(rawEntity, entityType, !0), entityState = EntityState.fromName(newAspect.entityState);
                if (entityState.isAdded() ? (newTempKey = tempKeyMap[entityKey.toString()], targetEntity = void 0 === newTempKey ? entityGroup.findEntityByKey(entityKey) : null) : targetEntity = entityGroup.findEntityByKey(entityKey), 
                targetEntity) {
                    var wasUnchanged = targetEntity.entityAspect.entityState.isUnchanged();
                    shouldOverwrite || wasUnchanged ? (updateTargetFromRaw(targetEntity, rawEntity, dataProps, !0), 
                    entityChanged.publish({
                        entityAction: EntityAction.MergeOnImport,
                        entity: targetEntity
                    }), wasUnchanged ? entityState.isUnchanged() || em._notifyStateChange(targetEntity, !0) : entityState.isUnchanged() && em._notifyStateChange(targetEntity, !1)) : (entitiesToLink.push(targetEntity), 
                    targetEntity = null);
                } else targetEntity = entityType._createInstanceCore(), updateTargetFromRaw(targetEntity, rawEntity, dataProps, !0), 
                void 0 !== newTempKey && (targetEntity.setProperty(entityType.keyProperties[0].name, newTempKey.values[0]), 
                newAspect.tempNavPropNames && newAspect.tempNavPropNames.forEach(function(npName) {
                    var np = entityType.getNavigationProperty(npName), fkPropName = np.relatedDataProperties[0].name, oldFkValue = targetEntity.getProperty(fkPropName), fk = new EntityKey(np.entityType, [ oldFkValue ]), newFk = tempKeyMap[fk.toString()];
                    targetEntity.setProperty(fkPropName, newFk.values[0]);
                })), targetEntity = entityGroup.attachEntity(targetEntity, entityState), entityChanged && (entityChanged.publish({
                    entityAction: EntityAction.AttachOnImport,
                    entity: targetEntity
                }), entityState.isUnchanged() || em._notifyStateChange(targetEntity, !0));
                targetEntity && (targetEntity.entityAspect.entityState = entityState, entityState.isModified() && (targetEntity.entityAspect.originalValuesMap = newAspect.originalValues), 
                entitiesToLink.push(targetEntity));
            }), entitiesToLink;
        }
        function promiseWithCallbacks(promise, callback, errorCallback) {
            return promise = promise.then(function(data) {
                return callback && callback(data), Q.resolve(data);
            }).fail(function(error) {
                return errorCallback && errorCallback(error), Q.reject(error);
            });
        }
        function getEntitiesToSave(em, entities) {
            var entitiesToSave;
            return entitiesToSave = entities ? entities.filter(function(e) {
                if (e.entityAspect.entityManager !== em) throw new Error("Only entities in this entityManager may be saved");
                return !e.entityAspect.entityState.isDetached();
            }) : em.getChanges();
        }
        function fixupKeys(em, keyMappings) {
            em._inKeyFixup = !0, keyMappings.forEach(function(km) {
                var group = em._entityGroupMap[km.entityTypeName];
                if (!group) throw new Error("Unable to locate the following fully qualified EntityType name: " + km.entityTypeName);
                group._fixupKey(km.tempValue, km.realValue);
            }), em._inKeyFixup = !1;
        }
        function getEntityGroups(em, entityTypes) {
            function createError() {
                return new Error("The EntityManager.getChanges() 'entityTypes' parameter must be either an entityType or an array of entityTypes or null");
            }
            var groupMap = em._entityGroupMap;
            if (entityTypes) {
                if (entityTypes instanceof EntityType) return [ groupMap[entityTypes.name] ];
                if (Array.isArray(entityTypes)) return entityTypes.map(function(et) {
                    if (et instanceof EntityType) return groupMap[et.name];
                    throw createError();
                });
                throw createError();
            }
            return __getOwnPropertyValues(groupMap);
        }
        function checkEntityKey(em, entity) {
            var ek = entity.entityAspect.getKey(), keyPropsWithDefaultValues = __arrayZip(entity.entityType.keyProperties, ek.values, function(kp, kv) {
                return kp.defaultValue === kv ? kp : null;
            }).filter(function(kp) {
                return null !== kp;
            });
            if (keyPropsWithDefaultValues.length) if (entity.entityType.autoGeneratedKeyType !== AutoGeneratedKeyType.None) em.generateTempKeyValue(entity); else if (keyPropsWithDefaultValues.length === ek.values.length) throw new Error("Cannot attach an object to an EntityManager without first setting its key or setting its entityType 'AutoGeneratedKeyType' property to something other than 'None'");
        }
        function validateEntityStates(em, entityStates) {
            function createError() {
                return new Error("The EntityManager.getChanges() 'entityStates' parameter must either be null, an entityState or an array of entityStates");
            }
            if (!entityStates) return null;
            if (EntityState.contains(entityStates)) entityStates = [ entityStates ]; else {
                if (!Array.isArray(entityStates)) throw createError();
                entityStates.forEach(function(es) {
                    if (!EntityState.contains(es)) throw createError();
                });
            }
            return entityStates;
        }
        function attachEntityCore(em, entity, entityState) {
            var group = findOrCreateEntityGroup(em, entity.entityType);
            group.attachEntity(entity, entityState), em._linkRelatedEntities(entity);
        }
        function attachRelatedEntities(em, entity, entityState) {
            var navProps = entity.entityType.navigationProperties;
            navProps.forEach(function(np) {
                var related = entity.getProperty(np.name);
                if (np.isScalar) {
                    if (!related) return;
                    em.attachEntity(related, entityState);
                } else related.forEach(function(e) {
                    em.attachEntity(e, entityState);
                });
            });
        }
        function executeQueryCore(em, query, queryOptions, dataService) {
            try {
                var metadataStore = em.metadataStore;
                if (metadataStore.isEmpty() && dataService.hasServerMetadata) throw new Error("cannot execute _executeQueryCore until metadataStore is populated.");
                if (queryOptions.fetchStrategy === FetchStrategy.FromLocalCache) return Q.fcall(function() {
                    var results = em.executeQueryLocally(query);
                    return {
                        results: results,
                        query: query
                    };
                });
                var url = dataService.makeUrl(metadataStore.toQueryString(query)), mappingContext = {
                    url: url,
                    query: query,
                    entityManager: em,
                    dataService: dataService,
                    queryOptions: queryOptions,
                    refMap: {},
                    deferredFns: []
                }, validateOnQuery = em.validationOptions.validateOnQuery;
                return dataService.adapterInstance.executeQuery(mappingContext).then(function(data) {
                    var result = __wrapExecution(function() {
                        var state = {
                            isLoading: em.isLoading
                        };
                        return em.isLoading = !0, em._pendingPubs = [], state;
                    }, function(state) {
                        em.isLoading = state.isLoading, em._pendingPubs.forEach(function(fn) {
                            fn();
                        }), em._pendingPubs = null, query = null, mappingContext = null, state.error && Q.reject(state.error);
                    }, function() {
                        var nodes = dataService.jsonResultsAdapter.extractResults(data);
                        Array.isArray(nodes) || (nodes = null == nodes ? [] : [ nodes ]);
                        var results = nodes.map(function(node) {
                            var r = visitAndMerge(node, mappingContext, {
                                nodeType: "root"
                            });
                            return validateOnQuery && r.entityAspect && r.entityAspect.validateEntity(), r;
                        });
                        return mappingContext.deferredFns.length > 0 && mappingContext.deferredFns.forEach(function(fn) {
                            fn();
                        }), {
                            results: results,
                            query: query,
                            entityManager: em,
                            httpResponse: data.httpResponse,
                            inlineCount: data.inlineCount
                        };
                    });
                    return Q.resolve(result);
                }).fail(function(e) {
                    return e && (e.query = query, e.entityManager = em), Q.reject(e);
                });
            } catch (e) {
                return e && (e.query = query), Q.reject(e);
            }
        }
        function visitAndMerge(node, mappingContext, nodeContext) {
            if (null == mappingContext.query && node.entityAspect) return node.entityAspect.entityState.isDeleted() ? mappingContext.entityManager.detachEntity(node) : node.entityAspect.acceptChanges(), 
            node;
            nodeContext = nodeContext || {};
            var meta = mappingContext.dataService.jsonResultsAdapter.visitNode(node, mappingContext, nodeContext) || {};
            return node = meta.node || node, mappingContext.query && "root" === nodeContext.nodeType && !meta.entityType && (meta.entityType = mappingContext.query._getToEntityType && mappingContext.query._getToEntityType(mappingContext.entityManager.metadataStore)), 
            processMeta(node, mappingContext, meta);
        }
        function processMeta(node, mappingContext, meta, assignFn) {
            if (meta.ignore || null == node) return null;
            if (meta.nodeRefId) {
                var refValue = resolveRefEntity(meta.nodeRefId, mappingContext);
                return "function" == typeof refValue && null != assignFn ? (mappingContext.deferredFns.push(function() {
                    assignFn(refValue);
                }), void 0) : refValue;
            }
            return meta.entityType ? meta.entityType.isComplexType ? node : mergeEntity(node, mappingContext, meta) : (meta.nodeId && (mappingContext.refMap[meta.nodeId] = node), 
            "object" != typeof node || __isDate(node) ? node : processAnonType(node, mappingContext));
        }
        function resolveRefEntity(nodeRefId, mappingContext) {
            var entity = mappingContext.refMap[nodeRefId];
            return void 0 === entity ? function() {
                return mappingContext.refMap[nodeRefId];
            } : entity;
        }
        function mergeEntity(node, mappingContext, meta) {
            node._$meta = meta;
            var em = mappingContext.entityManager, entityType = meta.entityType;
            "string" == typeof entityType && (entityType = em.metadataStore._getEntityType(entityType, !1)), 
            node.entityType = entityType;
            var mergeStrategy = mappingContext.queryOptions.mergeStrategy, isSaving = null == mappingContext.query, entityKey = getEntityKeyFromRawEntity(node, entityType, !1), targetEntity = em.findEntityByKey(entityKey);
            if (targetEntity) {
                if (isSaving && targetEntity.entityAspect.entityState.isDeleted()) return em.detachEntity(targetEntity), 
                targetEntity;
                var targetEntityState = targetEntity.entityAspect.entityState;
                if (mergeStrategy === MergeStrategy.OverwriteChanges || targetEntityState.isUnchanged()) {
                    updateEntity(targetEntity, node, mappingContext), targetEntity.entityAspect.wasLoaded = !0, 
                    meta.extra && (targetEntity.entityAspect.extraMetadata = meta.extra), targetEntity.entityAspect.entityState = EntityState.Unchanged, 
                    targetEntity.entityAspect.originalValues = {}, targetEntity.entityAspect.propertyChanged.publish({
                        entity: targetEntity,
                        propertyName: null
                    });
                    var action = isSaving ? EntityAction.MergeOnSave : EntityAction.MergeOnQuery;
                    em.entityChanged.publish({
                        entityAction: action,
                        entity: targetEntity
                    }), targetEntityState.isUnchanged || em._notifyStateChange(targetEntity, !1);
                } else updateEntityRef(mappingContext, targetEntity, node), entityType.navigationProperties.forEach(function(np) {
                    np.isScalar ? mergeRelatedEntityCore(node, np, mappingContext) : mergeRelatedEntitiesCore(node, np, mappingContext);
                });
            } else targetEntity = entityType._createInstanceCore(), targetEntity.initializeFrom && targetEntity.initializeFrom(node), 
            updateEntity(targetEntity, node, mappingContext), meta.extra && (targetEntity.entityAspect.extraMetadata = meta.extra), 
            attachEntityCore(em, targetEntity, EntityState.Unchanged), targetEntity.entityAspect.wasLoaded = !0, 
            em.entityChanged.publish({
                entityAction: EntityAction.AttachOnQuery,
                entity: targetEntity
            });
            return targetEntity;
        }
        function processAnonType(node, mappingContext) {
            var em = mappingContext.entityManager, jsonResultsAdapter = mappingContext.dataService.jsonResultsAdapter, keyFn = em.metadataStore.namingConvention.serverPropertyNameToClient, result = {};
            return __objectForEach(node, function(key, value) {
                var meta = jsonResultsAdapter.visitNode(value, mappingContext, {
                    nodeType: "anonProp",
                    propertyName: key
                }) || {};
                if (value = meta.node || value, !meta.ignore) {
                    var newKey = keyFn(key);
                    result[newKey] = Array.isArray(value) ? value.map(function(v, ix) {
                        return meta = jsonResultsAdapter.visitNode(v, mappingContext, {
                            nodeType: "anonPropItem",
                            propertyName: key
                        }) || {}, processMeta(v, mappingContext, meta, function(refValue) {
                            result[newKey][ix] = refValue();
                        });
                    }) : processMeta(value, mappingContext, meta, function(refValue) {
                        result[newKey] = refValue();
                    });
                }
            }), result;
        }
        function updateEntity(targetEntity, rawEntity, mappingContext) {
            updateEntityRef(mappingContext, targetEntity, rawEntity);
            var entityType = targetEntity.entityType;
            updateTargetFromRaw(targetEntity, rawEntity, entityType.dataProperties, !1), entityType.navigationProperties.forEach(function(np) {
                np.isScalar ? mergeRelatedEntity(np, targetEntity, rawEntity, mappingContext) : mergeRelatedEntities(np, targetEntity, rawEntity, mappingContext);
            });
        }
        function updateTargetFromRaw(target, raw, dataProps, isClient) {
            if (dataProps.forEach(function(dp) {
                updateTargetPropertyFromRaw(target, raw, dp, isClient);
            }), isClient) {
                var aspectName = target.entityAspect ? "entityAspect" : "complexAspect", originalValues = raw[aspectName].originalValuesMap;
                originalValues && (target[aspectName].originalValues = originalValues);
            }
        }
        function updateTargetPropertyFromRaw(target, raw, dp, isClient) {
            var fn = isClient ? getPropertyFromClientRaw : getPropertyFromServerRaw, rawVal = fn(raw, dp);
            if (void 0 !== rawVal) {
                var oldVal;
                if (dp.isComplexProperty) {
                    oldVal = target.getProperty(dp.name);
                    var complexType = dp.dataType, cdataProps = complexType.dataProperties;
                    dp.isScalar ? updateTargetFromRaw(oldVal, rawVal, cdataProps, isClient) : (oldVal.length = 0, 
                    Array.isArray(rawVal) && rawVal.forEach(function(rawCo) {
                        var newCo = complexType._createInstanceCore(target, dp);
                        updateTargetFromRaw(newCo, rawCo, cdataProps, isClient), complexType._initializeInstance(newCo), 
                        oldVal.push(newCo);
                    }));
                } else {
                    var val;
                    dp.isScalar ? (val = parseRawValue(dp, rawVal), target.setProperty(dp.name, val)) : (oldVal = target.getProperty(dp.name), 
                    oldVal.length = 0, Array.isArray(rawVal) && rawVal.forEach(function(rv) {
                        val = parseRawValue(dp, rv), oldVal.push(val);
                    }));
                }
            }
        }
        function getEntityKeyFromRawEntity(rawEntity, entityType, isClient) {
            var fn = isClient ? getPropertyFromClientRaw : getPropertyFromServerRaw, keyValues = entityType.keyProperties.map(function(dp) {
                return parseRawValue(dp, fn(rawEntity, dp));
            });
            return new EntityKey(entityType, keyValues);
        }
        function getPropertyFromClientRaw(rawEntity, dp) {
            var val = rawEntity[dp.name];
            return void 0 !== val ? val : dp.defaultValue;
        }
        function getPropertyFromServerRaw(rawEntity, dp) {
            if (dp.isUnmapped) return rawEntity[dp.nameOnServer || dp.name];
            var val = rawEntity[dp.nameOnServer];
            return void 0 !== val ? val : dp.defaultValue;
        }
        function parseRawValue(dp, val) {
            return void 0 === val ? void 0 : (dp.dataType.isDate && val ? __isDate(val) || (val = DataType.parseDateFromServer(val)) : dp.dataType === DataType.Binary ? val && void 0 !== val.$value && (val = val.$value) : dp.dataType === DataType.Time && (val = DataType.parseTimeFromServer(val)), 
            val);
        }
        function updateEntityRef(mappingContext, targetEntity, rawEntity) {
            var nodeId = rawEntity._$meta.nodeId;
            null != nodeId && (mappingContext.refMap[nodeId] = targetEntity);
        }
        function mergeRelatedEntity(navigationProperty, targetEntity, rawEntity, mappingContext) {
            var relatedEntity = mergeRelatedEntityCore(rawEntity, navigationProperty, mappingContext);
            null != relatedEntity && ("function" == typeof relatedEntity ? mappingContext.deferredFns.push(function() {
                relatedEntity = relatedEntity(), updateRelatedEntity(relatedEntity, targetEntity, navigationProperty);
            }) : updateRelatedEntity(relatedEntity, targetEntity, navigationProperty));
        }
        function mergeRelatedEntityCore(rawEntity, navigationProperty, mappingContext) {
            var relatedRawEntity = rawEntity[navigationProperty.nameOnServer];
            if (!relatedRawEntity) return null;
            var relatedEntity = visitAndMerge(relatedRawEntity, mappingContext, {
                nodeType: "navProp",
                navigationProperty: navigationProperty
            });
            return relatedEntity;
        }
        function updateRelatedEntity(relatedEntity, targetEntity, navigationProperty) {
            if (relatedEntity) {
                var propName = navigationProperty.name, currentRelatedEntity = targetEntity.getProperty(propName);
                if (currentRelatedEntity !== relatedEntity) {
                    targetEntity.setProperty(propName, relatedEntity);
                    var inverseProperty = navigationProperty.inverse;
                    if (!inverseProperty) return;
                    if (inverseProperty.isScalar) relatedEntity.setProperty(inverseProperty.name, targetEntity); else {
                        var collection = relatedEntity.getProperty(inverseProperty.name);
                        collection.push(targetEntity);
                    }
                }
            }
        }
        function mergeRelatedEntities(navigationProperty, targetEntity, rawEntity, mappingContext) {
            var relatedEntities = mergeRelatedEntitiesCore(rawEntity, navigationProperty, mappingContext);
            if (null != relatedEntities) {
                var inverseProperty = navigationProperty.inverse;
                if (inverseProperty) {
                    var originalRelatedEntities = targetEntity.getProperty(navigationProperty.name);
                    originalRelatedEntities.wasLoaded = !0, relatedEntities.forEach(function(relatedEntity) {
                        "function" == typeof relatedEntity ? mappingContext.deferredFns.push(function() {
                            relatedEntity = relatedEntity(), updateRelatedEntityInCollection(relatedEntity, originalRelatedEntities, targetEntity, inverseProperty);
                        }) : updateRelatedEntityInCollection(relatedEntity, originalRelatedEntities, targetEntity, inverseProperty);
                    });
                }
            }
        }
        function mergeRelatedEntitiesCore(rawEntity, navigationProperty, mappingContext) {
            var relatedRawEntities = rawEntity[navigationProperty.nameOnServer];
            if (!relatedRawEntities) return null;
            if (!Array.isArray(relatedRawEntities) && (relatedRawEntities = relatedRawEntities.results, 
            !relatedRawEntities)) return null;
            var relatedEntities = relatedRawEntities.map(function(relatedRawEntity) {
                return visitAndMerge(relatedRawEntity, mappingContext, {
                    nodeType: "navPropItem",
                    navigationProperty: navigationProperty
                });
            });
            return relatedEntities;
        }
        function updateRelatedEntityInCollection(relatedEntity, relatedEntities, targetEntity, inverseProperty) {
            if (relatedEntity) {
                var thisEntity = relatedEntity.getProperty(inverseProperty.name);
                thisEntity !== targetEntity && (relatedEntities.push(relatedEntity), relatedEntity.setProperty(inverseProperty.name, targetEntity));
            }
        }
        function updateConcurrencyProperties(entities) {
            var candidates = entities.filter(function(e) {
                return e.entityAspect.isBeingSaved = !0, e.entityAspect.entityState.isModified() && e.entityType.concurrencyProperties.length > 0;
            });
            0 !== candidates.length && candidates.forEach(function(c) {
                c.entityType.concurrencyProperties.forEach(function(cp) {
                    updateConcurrencyProperty(c, cp);
                });
            });
        }
        function updateConcurrencyProperty(entity, property) {
            if (!entity.entityAspect.originalValues[property.name]) {
                var value = entity.getProperty(property.name);
                if (value || (value = property.dataType.defaultValue), property.dataType.isNumeric) entity.setProperty(property.name, value + 1); else if (property.dataType.isDate) {
                    for (var dt = new Date(), dt2 = new Date(); dt.getTime() === dt2.getTime(); ) dt2 = new Date();
                    entity.setProperty(property.name, dt2);
                } else {
                    if (property.dataType !== DataType.Guid) {
                        if (property.dataType === DataType.Binary) return;
                        throw new Error("Unable to update the value of concurrency property before saving: " + property.name);
                    }
                    entity.setProperty(property.name, __getUuid());
                }
            }
        }
        function findOrCreateEntityGroup(em, entityType) {
            var group = em._entityGroupMap[entityType.name];
            return group || (group = new EntityGroup(em, entityType), em._entityGroupMap[entityType.name] = group), 
            group;
        }
        function findOrCreateEntityGroups(em, entityType) {
            var entityTypes = entityType.getSelfAndSubtypes();
            return entityTypes.map(function(et) {
                return findOrCreateEntityGroup(em, et);
            });
        }
        function unwrapInstance(structObj, isOData) {
            var rawObject = {}, stype = structObj.entityType || structObj.complexType;
            return stype.dataProperties.forEach(function(dp) {
                if (dp.isUnmapped) {
                    if (isOData) return;
                    var val = structObj.getProperty(dp.name);
                    val = transformValue(val, dp, !1), void 0 !== val && (rawObject.__unmapped = rawObject.__unmapped || {}, 
                    rawObject.__unmapped[dp.name] = val);
                } else if (dp.isComplexProperty) if (dp.isScalar) rawObject[dp.nameOnServer] = unwrapInstance(structObj.getProperty(dp.name), isOData); else {
                    var complexObjs = structObj.getProperty(dp.name);
                    rawObject[dp.nameOnServer] = complexObjs.map(function(co) {
                        return unwrapInstance(co, isOData);
                    });
                } else {
                    var val = structObj.getProperty(dp.name);
                    val = transformValue(val, dp, isOData), void 0 !== val && (rawObject[dp.nameOnServer] = val);
                }
            }), rawObject;
        }
        function unwrapOriginalValues(target, metadataStore, isOData) {
            var stype = target.entityType || target.complexType, aspect = target.entityAspect || target.complexAspect, fn = metadataStore.namingConvention.clientPropertyNameToServer, result = {};
            return __objectForEach(aspect.originalValues, function(propName, val) {
                var prop = stype.getProperty(propName);
                val = transformValue(val, prop, isOData), void 0 !== val && (result[fn(propName, prop)] = val);
            }), stype.complexProperties.forEach(function(cp) {
                var nextTarget = target.getProperty(cp.name);
                if (cp.isScalar) {
                    var unwrappedCo = unwrapOriginalValues(nextTarget, metadataStore, isOData);
                    __isEmpty(unwrappedCo) || (result[fn(cp.name, cp)] = unwrappedCo);
                } else {
                    var unwrappedCos = nextTarget.map(function(item) {
                        return unwrapOriginalValues(item, metadataStore, isOData);
                    });
                    result[fn(cp.name, cp)] = unwrappedCos;
                }
            }), result;
        }
        function unwrapChangedValues(target, metadataStore, isOData) {
            var stype = target.entityType || target.complexType, aspect = target.entityAspect || target.complexAspect, fn = metadataStore.namingConvention.clientPropertyNameToServer, result = {};
            return __objectForEach(aspect.originalValues, function(propName) {
                var prop = stype.getProperty(propName), val = target.getProperty(propName);
                val = transformValue(val, prop, isOData), void 0 !== val && (result[fn(propName, prop)] = val);
            }), stype.complexProperties.forEach(function(cp) {
                var nextTarget = target.getProperty(cp.name);
                if (cp.isScalar) {
                    var unwrappedCo = unwrapChangedValues(nextTarget, metadataStore);
                    __isEmpty(unwrappedCo) || (result[fn(cp.name, cp)] = unwrappedCo);
                } else {
                    var unwrappedCos = nextTarget.map(function(item) {
                        return unwrapChangedValues(item, metadataStore);
                    });
                    result[fn(cp.name, cp)] = unwrappedCos;
                }
            }), result;
        }
        function transformValue(val, prop, isOData) {
            if (isOData) {
                if (prop.isUnmapped) return;
                prop.dataType === DataType.DateTimeOffset ? val = val && new Date(val.getTime() - 6e4 * val.getTimezoneOffset()) : prop.dataType.quoteJsonOData && (val = null != val ? val.toString() : val);
            }
            return val;
        }
        function UnattachedChildrenMap() {
            this.map = {};
        }
        var ctor = function(config) {
            if (arguments.length > 1) throw new Error("The EntityManager ctor has a single optional argument that is either a 'serviceName' or a configuration object.");
            0 === arguments.length ? config = {
                serviceName: ""
            } : "string" == typeof config && (config = {
                serviceName: config
            }), updateWithConfig(this, config, !0), this.entityChanged = new Event("entityChanged", this), 
            this.validationErrorsChanged = new Event("validationErrorsChanged", this), this.hasChangesChanged = new Event("hasChangesChanged", this), 
            this.clear();
        }, proto = ctor.prototype;
        return proto._$typeName = "EntityManager", Event.bubbleEvent(proto, null), proto.setProperties = function(config) {
            updateWithConfig(this, config, !1);
        }, proto.createEntity = function(entityType, initialValues, entityState) {
            assertParam(entityType, "entityType").isString().or().isInstanceOf(EntityType).check(), 
            "string" == typeof entityType && (entityType = this.metadataStore._getEntityType(entityType)), 
            entityState = entityState || EntityState.Added;
            var entity;
            return __using(this, "isLoading", !0, function() {
                entity = entityType.createEntity(initialValues);
            }), entityState !== EntityState.Detached && this.attachEntity(entity, entityState), 
            entity;
        }, ctor.importEntities = function(exportedString, config) {
            var em = new EntityManager();
            return em.importEntities(exportedString, config), em;
        }, proto.acceptChanges = function() {
            this.getChanges().forEach(function(entity) {
                entity.entityAspect.acceptChanges();
            });
        }, proto.rejectChanges = function() {
            this.getChanges().forEach(function(entity) {
                entity.entityAspect.rejectChanges();
            });
        }, proto.exportEntities = function(entities) {
            var exportBundle = exportEntityGroups(this, entities), json = {
                metadataStore: this.metadataStore.exportMetadata(),
                dataService: this.dataService,
                saveOptions: this.saveOptions,
                queryOptions: this.queryOptions,
                validationOptions: this.validationOptions,
                tempKeys: exportBundle.tempKeys,
                entityGroupMap: exportBundle.entityGroupMap
            }, result = JSON.stringify(json, null, __config.stringifyPad);
            return result;
        }, proto.importEntities = function(exportedString, config) {
            config = config || {}, assertConfig(config).whereParam("mergeStrategy").isEnumOf(MergeStrategy).isOptional().withDefault(this.queryOptions.mergeStrategy).applyAll(config);
            var that = this, json = "string" == typeof exportedString ? JSON.parse(exportedString) : exportedString;
            this.metadataStore.importMetadata(json.metadataStore), this.dataService = json.dataService && DataService.fromJSON(json.dataService) || new DataService({
                serviceName: json.serviceName
            }), this.saveOptions = new SaveOptions(json.saveOptions), this.queryOptions = QueryOptions.fromJSON(json.queryOptions), 
            this.validationOptions = new ValidationOptions(json.validationOptions);
            var tempKeyMap = {};
            json.tempKeys.forEach(function(k) {
                var oldKey = EntityKey.fromJSON(k, that.metadataStore);
                tempKeyMap[oldKey.toString()] = new EntityKey(oldKey.entityType, that.keyGenerator.generateTempKeyValue(oldKey.entityType, oldKey.values[0]));
            });
            var entitiesToLink = [];
            return config.tempKeyMap = tempKeyMap, __wrapExecution(function() {
                that._pendingPubs = [];
            }, function() {
                that._pendingPubs.forEach(function(fn) {
                    fn();
                }), that._pendingPubs = null;
            }, function() {
                __objectForEach(json.entityGroupMap, function(entityTypeName, jsonGroup) {
                    var entityType = that.metadataStore._getEntityType(entityTypeName, !0), targetEntityGroup = findOrCreateEntityGroup(that, entityType), entities = importEntityGroup(targetEntityGroup, jsonGroup, config);
                    Array.prototype.push.apply(entitiesToLink, entities);
                }), entitiesToLink.forEach(function(entity) {
                    that._linkRelatedEntities(entity);
                });
            }), {
                entities: entitiesToLink,
                tempKeyMapping: tempKeyMap
            };
        }, proto.clear = function() {
            __objectForEach(this._entityGroupMap, function(key, entityGroup) {
                entityGroup._clear();
            }), this._entityGroupMap = {}, this._unattachedChildrenMap = new UnattachedChildrenMap(), 
            this.keyGenerator = new this.keyGeneratorCtor(), this.entityChanged.publish({
                entityAction: EntityAction.Clear
            }), this._hasChanges && (this._hasChanges = !1, this.hasChangesChanged.publish({
                entityManager: this,
                hasChanges: !1
            }));
        }, proto.createEmptyCopy = function() {
            var copy = new ctor({
                dataService: this.dataService,
                metadataStore: this.metadataStore,
                queryOptions: this.queryOptions,
                saveOptions: this.saveOptions,
                validationOptions: this.validationOptions,
                keyGeneratorCtor: this.keyGeneratorCtor
            });
            return copy;
        }, proto.addEntity = function(entity) {
            return this.attachEntity(entity, EntityState.Added);
        }, proto.attachEntity = function(entity, entityState) {
            if (assertParam(entity, "entity").isRequired().check(), this.metadataStore._checkEntityType(entity), 
            entityState = assertParam(entityState, "entityState").isEnumOf(EntityState).isOptional().check(EntityState.Unchanged), 
            entity.entityType.metadataStore !== this.metadataStore) throw new Error("Cannot attach this entity because the EntityType and MetadataStore associated with this entity does not match this EntityManager's MetadataStore.");
            var aspect = entity.entityAspect;
            aspect || (aspect = new EntityAspect(entity));
            var manager = aspect.entityManager;
            if (manager) {
                if (manager === this) return entity;
                throw new Error("This entity already belongs to another EntityManager");
            }
            var that = this;
            return __using(this, "isLoading", !0, function() {
                entityState.isAdded() && checkEntityKey(that, entity), attachEntityCore(that, entity, entityState), 
                attachRelatedEntities(that, entity, entityState);
            }), this.validationOptions.validateOnAttach && entity.entityAspect.validateEntity(), 
            entityState.isUnchanged() || this._notifyStateChange(entity, !0), this.entityChanged.publish({
                entityAction: EntityAction.Attach,
                entity: entity
            }), entity;
        }, proto.detachEntity = function(entity) {
            assertParam(entity, "entity").isEntity().check();
            var aspect = entity.entityAspect;
            if (!aspect) return !1;
            if (aspect.entityManager !== this) throw new Error("This entity does not belong to this EntityManager.");
            return aspect.setDetached();
        }, proto.fetchMetadata = function(dataService, callback, errorCallback) {
            "function" == typeof dataService ? (errorCallback = callback, callback = dataService, 
            dataService = null) : (assertParam(dataService, "dataService").isInstanceOf(DataService).isOptional().check(), 
            assertParam(callback, "callback").isFunction().isOptional().check(), assertParam(errorCallback, "errorCallback").isFunction().isOptional().check());
            var promise = this.metadataStore.fetchMetadata(dataService || this.dataService);
            return promiseWithCallbacks(promise, callback, errorCallback);
        }, proto.executeQuery = function(query, callback, errorCallback) {
            assertParam(query, "query").isInstanceOf(EntityQuery).or().isString().check(), assertParam(callback, "callback").isFunction().isOptional().check(), 
            assertParam(errorCallback, "errorCallback").isFunction().isOptional().check();
            var promise, queryOptions = QueryOptions.resolve([ query.queryOptions, this.queryOptions, QueryOptions.defaultInstance ]), dataService = DataService.resolve([ query.dataService, this.dataService ]);
            if (!dataService.hasServerMetadata || this.metadataStore.hasMetadataFor(dataService.serviceName)) promise = executeQueryCore(this, query, queryOptions, dataService); else {
                var that = this;
                promise = this.fetchMetadata(dataService).then(function() {
                    return executeQueryCore(that, query, queryOptions, dataService);
                });
            }
            return promiseWithCallbacks(promise, callback, errorCallback);
        }, proto.executeQueryLocally = function(query) {
            assertParam(query, "query").isInstanceOf(EntityQuery).check();
            var metadataStore = this.metadataStore, entityType = query._getFromEntityType(metadataStore, !0), groups = findOrCreateEntityGroups(this, entityType), filterFunc = query._toFilterFunction(entityType);
            if (filterFunc) var newFilterFunc = function(entity) {
                return entity && !entity.entityAspect.entityState.isDeleted() && filterFunc(entity);
            }; else var newFilterFunc = function(entity) {
                return entity && !entity.entityAspect.entityState.isDeleted();
            };
            var result = [];
            groups.forEach(function(group) {
                result.push.apply(result, group._entities.filter(newFilterFunc));
            });
            var orderByComparer = query._toOrderByComparer(entityType);
            orderByComparer && result.sort(orderByComparer);
            var skipCount = query.skipCount;
            skipCount && (result = result.slice(skipCount));
            var takeCount = query.takeCount;
            takeCount && (result = result.slice(0, takeCount));
            var selectClause = query.selectClause;
            if (selectClause) {
                var selectFn = selectClause.toFunction();
                result = result.map(function(e) {
                    return selectFn(e);
                });
            }
            return result;
        }, proto.saveChanges = function(entities, saveOptions, callback, errorCallback) {
            assertParam(entities, "entities").isOptional().isArray().isEntity().check(), assertParam(saveOptions, "saveOptions").isInstanceOf(SaveOptions).isOptional().check(), 
            assertParam(callback, "callback").isFunction().isOptional().check(), assertParam(errorCallback, "errorCallback").isFunction().isOptional().check(), 
            saveOptions = saveOptions || this.saveOptions || SaveOptions.defaultInstance;
            var isFullSave = null == entities, entitiesToSave = getEntitiesToSave(this, entities);
            if (0 === entitiesToSave.length) {
                var saveResult = {
                    entities: [],
                    keyMappings: []
                };
                return callback && callback(saveResult), Q.resolve(saveResult);
            }
            if (!saveOptions.allowConcurrentSaves) {
                var anyPendingSaves = entitiesToSave.some(function(entity) {
                    return entity.entityAspect.isBeingSaved;
                });
                if (anyPendingSaves) {
                    var err = new Error("Concurrent saves not allowed - SaveOptions.allowConcurrentSaves is false");
                    return errorCallback && errorCallback(err), Q.reject(err);
                }
            }
            if (clearServerErrors(entitiesToSave), this.validationOptions.validateOnSave) {
                var failedEntities = entitiesToSave.filter(function(entity) {
                    var aspect = entity.entityAspect, isValid = aspect.entityState.isDeleted() || aspect.validateEntity();
                    return !isValid;
                });
                if (failedEntities.length > 0) {
                    var valError = new Error("Client side validation errors encountered - see the entityErrors collection on this object for more detail");
                    return valError.entityErrors = createEntityErrors(failedEntities), errorCallback && errorCallback(valError), 
                    Q.reject(valError);
                }
            }
            updateConcurrencyProperties(entitiesToSave);
            var dataService = DataService.resolve([ saveOptions.dataService, this.dataService ]), saveContext = {
                entityManager: this,
                dataService: dataService,
                resourceName: saveOptions.resourceName || this.saveOptions.resourceName || "SaveChanges"
            }, queryOptions = {
                mergeStrategy: MergeStrategy.OverwriteChanges
            }, saveBundle = {
                entities: entitiesToSave,
                saveOptions: saveOptions
            }, that = this;
            return dataService.adapterInstance.saveChanges(saveContext, saveBundle).then(function(saveResult) {
                fixupKeys(that, saveResult.keyMappings);
                var mappingContext = {
                    query: null,
                    entityManager: that,
                    queryOptions: queryOptions,
                    dataService: dataService,
                    refMap: {},
                    deferredFns: []
                }, savedEntities = saveResult.entities.map(function(rawEntity) {
                    return visitAndMerge(rawEntity, mappingContext, {
                        nodeType: "root"
                    });
                });
                return markIsBeingSaved(entitiesToSave, !1), that._hasChanges = isFullSave && haveSameContents(entitiesToSave, savedEntities) ? !1 : that._hasChangesCore(), 
                that._hasChanges || that.hasChangesChanged.publish({
                    entityManager: that,
                    hasChanges: !1
                }), saveResult.entities = savedEntities, callback && callback(saveResult), Q.resolve(saveResult);
            }, function(error) {
                return processServerErrors(saveContext, error), markIsBeingSaved(entitiesToSave, !1), 
                errorCallback && errorCallback(error), Q.reject(error);
            });
        }, proto._findEntityGroup = function(entityType) {
            return this._entityGroupMap[entityType.name];
        }, proto.getEntityByKey = function() {
            var group, entityKey = createEntityKey(this, arguments).entityKey, subtypes = entityKey._subtypes;
            if (!subtypes) return group = this._findEntityGroup(entityKey.entityType), group && group.findEntityByKey(entityKey);
            for (var i = 0, j = subtypes.length; j > i; i++) {
                group = this._findEntityGroup(subtypes[i]);
                var ek = group && group.findEntityByKey(entityKey);
                if (ek) return ek;
            }
        }, proto.fetchEntityByKey = function() {
            var entity, tpl = createEntityKey(this, arguments), entityKey = tpl.entityKey, checkLocalCacheFirst = 0 === tpl.remainingArgs.length ? !1 : !!tpl.remainingArgs[0], isDeleted = !1;
            return checkLocalCacheFirst && (entity = this.getEntityByKey(entityKey), isDeleted = entity && entity.entityAspect.entityState.isDeleted(), 
            isDeleted && (entity = null, this.queryOptions.mergeStrategy === MergeStrategy.OverwriteChanges && (isDeleted = !1))), 
            entity || isDeleted ? Q.resolve({
                entity: entity,
                entityKey: entityKey,
                fromCache: !0
            }) : EntityQuery.fromEntityKey(entityKey).using(this).execute().then(function(data) {
                return entity = 0 === data.results.length ? null : data.results[0], Q.resolve({
                    entity: entity,
                    entityKey: entityKey,
                    fromCache: !1
                });
            });
        }, proto.findEntityByKey = function(entityKey) {
            return this.getEntityByKey(entityKey);
        }, proto.generateTempKeyValue = function(entity) {
            assertParam(entity, "entity").isEntity().check();
            var entityType = entity.entityType, nextKeyValue = this.keyGenerator.generateTempKeyValue(entityType), keyProp = entityType.keyProperties[0];
            return entity.setProperty(keyProp.name, nextKeyValue), entity.entityAspect.hasTempKey = !0, 
            nextKeyValue;
        }, proto.hasChanges = function(entityTypes) {
            return this._hasChanges ? void 0 === entityTypes ? this._hasChanges : this._hasChangesCore(entityTypes) : !1;
        }, proto._hasChangesCore = function(entityTypes) {
            entityTypes = checkEntityTypes(this, entityTypes);
            var entityGroups = getEntityGroups(this, entityTypes);
            return entityGroups.some(function(eg) {
                return eg.hasChanges();
            });
        }, proto.getChanges = function(entityTypes) {
            entityTypes = checkEntityTypes(this, entityTypes);
            var entityStates = [ EntityState.Added, EntityState.Modified, EntityState.Deleted ];
            return getEntitiesCore(this, entityTypes, entityStates);
        }, proto.rejectChanges = function() {
            if (!this._hasChanges) return [];
            var entityStates = [ EntityState.Added, EntityState.Modified, EntityState.Deleted ], changes = getEntitiesCore(this, null, entityStates);
            return this._hasChanges = !1, changes.forEach(function(e) {
                e.entityAspect.rejectChanges();
            }), this.hasChangesChanged.publish({
                entityManager: this,
                hasChanges: !1
            }), changes;
        }, proto.getEntities = function(entityTypes, entityStates) {
            return entityTypes = checkEntityTypes(this, entityTypes), assertParam(entityStates, "entityStates").isOptional().isEnumOf(EntityState).or().isNonEmptyArray().isEnumOf(EntityState).check(), 
            entityStates && (entityStates = validateEntityStates(this, entityStates)), getEntitiesCore(this, entityTypes, entityStates);
        }, proto._notifyStateChange = function(entity, needsSave) {
            this.entityChanged.publish({
                entityAction: EntityAction.EntityStateChange,
                entity: entity
            }), needsSave ? this._hasChanges || (this._hasChanges = !0, this.hasChangesChanged.publish({
                entityManager: this,
                hasChanges: !0
            })) : this._hasChanges && (this._hasChanges = this._hasChangesCore(), this._hasChanges || this.hasChangesChanged.publish({
                entityManager: this,
                hasChanges: !1
            }));
        }, proto._linkRelatedEntities = function(entity) {
            var em = this, entityAspect = entity.entityAspect;
            __using(em, "isLoading", !0, function() {
                var unattachedMap = em._unattachedChildrenMap, entityKey = entityAspect.getKey(), tuples = unattachedMap.getTuples(entityKey);
                tuples && tuples.forEach(function(tpl) {
                    var childToParentNp, parentToChildNp, unattachedChildren = tpl.children.filter(function(e) {
                        return e.entityAspect.entityState !== EntityState.Detached;
                    }), np = tpl.navigationProperty;
                    if (np.inverse) if (childToParentNp = np, parentToChildNp = np.inverse, parentToChildNp.isScalar) {
                        var onlyChild = unattachedChildren[0];
                        entity.setProperty(parentToChildNp.name, onlyChild), onlyChild.setProperty(childToParentNp.name, entity);
                    } else {
                        var currentChildren = entity.getProperty(parentToChildNp.name);
                        unattachedChildren.forEach(function(child) {
                            currentChildren.push(child), child.setProperty(childToParentNp.name, entity);
                        });
                    } else if (np.parentType === entity.entityType) if (parentToChildNp = np, parentToChildNp.isScalar) entity.setProperty(parentToChildNp.name, unattachedChildren[0]); else {
                        var currentChildren = entity.getProperty(parentToChildNp.name);
                        unattachedChildren.forEach(function(child) {
                            currentChildren._push(child);
                        });
                    } else childToParentNp = np, unattachedChildren.forEach(function(child) {
                        child.setProperty(childToParentNp.name, entity);
                    });
                    unattachedMap.removeChildren(entityKey, childToParentNp);
                }), entity.entityType.navigationProperties.forEach(function(np) {
                    if (np.isScalar) {
                        var value = entity.getProperty(np.name);
                        if (value) return;
                    }
                    var parentKey = entityAspect.getParentKey(np);
                    if (parentKey) {
                        if (parentKey._isEmpty()) return;
                        var parent = em.findEntityByKey(parentKey);
                        parent ? entity.setProperty(np.name, parent) : unattachedMap.addChild(parentKey, np, entity);
                    }
                }), entity.entityType.foreignKeyProperties.forEach(function(fkProp) {
                    var invNp = fkProp.inverseNavigationProperty;
                    if (invNp) {
                        var fkValue = entity.getProperty(fkProp.name), parentKey = new EntityKey(invNp.parentType, [ fkValue ]), parent = em.findEntityByKey(parentKey);
                        parent ? invNp.isScalar ? parent.setProperty(invNp.name, entity) : em.isLoading ? parent.getProperty(invNp.name)._push(entity) : parent.getProperty(invNp.name).push(entity) : unattachedMap.addChild(parentKey, invNp, entity);
                    }
                });
            });
        }, proto.helper = {
            unwrapInstance: unwrapInstance,
            unwrapOriginalValues: unwrapOriginalValues,
            unwrapChangedValues: unwrapChangedValues,
            getEntityKeyFromRawEntity: getEntityKeyFromRawEntity
        }, UnattachedChildrenMap.prototype.addChild = function(parentEntityKey, navigationProperty, child) {
            var tuple = this.getTuple(parentEntityKey, navigationProperty);
            tuple || (tuple = {
                navigationProperty: navigationProperty,
                children: []
            }, __getArray(this.map, parentEntityKey.toString()).push(tuple)), tuple.children.push(child);
        }, UnattachedChildrenMap.prototype.removeChildren = function(parentEntityKey, navigationProperty) {
            var tuples = this.map[parentEntityKey.toString()];
            tuples && (__arrayRemoveItem(tuples, function(t) {
                return t.navigationProperty === navigationProperty;
            }), tuples.length || delete this.map[parentEntityKey.toString()]);
        }, UnattachedChildrenMap.prototype.getChildren = function(parentEntityKey, navigationProperty) {
            var tuple = this.getTuple(parentEntityKey, navigationProperty);
            return tuple ? tuple.children.filter(function(child) {
                return !child.entityAspect.entityState.isDetached();
            }) : null;
        }, UnattachedChildrenMap.prototype.getTuple = function(parentEntityKey, navigationProperty) {
            var tuples = this.map[parentEntityKey.toString()];
            if (!tuples) return null;
            var tuple = __arrayFirst(tuples, function(t) {
                return t.navigationProperty === navigationProperty;
            });
            return tuple;
        }, UnattachedChildrenMap.prototype.getTuples = function(parentEntityKey) {
            return this.map[parentEntityKey.toString()];
        }, ctor;
    }();
    breeze.EntityManager = EntityManager;
    var SaveOptions = function() {
        function updateWithConfig(obj, config) {
            return config && assertConfig(config).whereParam("resourceName").isOptional().isString().whereParam("dataService").isOptional().isInstanceOf(DataService).whereParam("allowConcurrentSaves").isBoolean().isOptional().whereParam("tag").isOptional().applyAll(obj), 
            obj;
        }
        var ctor = function(config) {
            updateWithConfig(this, config);
        }, proto = ctor.prototype;
        return proto._$typeName = "SaveOptions", proto.setAsDefault = function() {
            return __setAsDefault(this, ctor);
        }, proto.using = function(config) {
            return updateWithConfig(this, config);
        }, ctor.defaultInstance = new ctor({
            allowConcurrentSaves: !1
        }), ctor;
    }();
    breeze.SaveOptions = SaveOptions, breeze.AbstractDataServiceAdapter = function() {
        function handleHttpError(deferred, httpResponse, messagePrefix) {
            var err = createHttpError(httpResponse);
            return messagePrefix && (err.message = messagePrefix + "; " + err.message), deferred.reject(err);
        }
        function createHttpError(httpResponse) {
            var err = new Error();
            err.httpResponse = httpResponse, err.status = httpResponse.status;
            var errObj = httpResponse.data;
            if ("string" == typeof errObj) try {
                errObj = JSON.parse(errObj);
            } catch (e) {}
            if (errObj) {
                var entityErrors = errObj.EntityErrors || errObj.entityErrors || errObj.Errors || errObj.errors;
                entityErrors && httpResponse.saveContext ? processEntityErrors(err, entityErrors, httpResponse.saveContext) : (errObj = errObj.InnerException || errObj, 
                err.message = errObj.ExceptionMessage || errObj.Message || errObj.toString());
            } else err.message = httpResponse.error && httpResponse.error.toString();
            return err;
        }
        function processEntityErrors(err, entityErrors, saveContext) {
            err.message = "Server side errors encountered - see the entityErrors collection on this object for more detail";
            var propNameFn = saveContext.entityManager.metadataStore.namingConvention.serverPropertyNameToClient;
            err.entityErrors = entityErrors.map(function(e) {
                return {
                    errorName: e.ErrorName,
                    entityTypeName: MetadataStore.normalizeTypeName(e.EntityTypeName),
                    keyValues: e.KeyValues,
                    propertyName: e.PropertyName && propNameFn(e.PropertyName),
                    errorMessage: e.ErrorMessage
                };
            });
        }
        var ajaxImpl, ctor = function() {};
        return ctor.prototype.checkForRecomposition = function(interfaceInitializedArgs) {
            "ajax" === interfaceInitializedArgs.interfaceName && interfaceInitializedArgs.isDefault && this.initialize();
        }, ctor.prototype.initialize = function() {
            if (ajaxImpl = breeze.config.getAdapterInstance("ajax"), !ajaxImpl) throw new Error("Unable to initialize ajax for WebApi.");
            var ajax = ajaxImpl.ajax;
            if (!ajax) throw new Error("Breeze was unable to find an 'ajax' adapter");
        }, ctor.prototype.fetchMetadata = function(metadataStore, dataService) {
            var serviceName = dataService.serviceName, url = dataService.makeUrl("Metadata"), deferred = Q.defer();
            return ajaxImpl.ajax({
                type: "GET",
                url: url,
                dataType: "json",
                success: function(httpResponse) {
                    if (metadataStore.hasMetadataFor(serviceName)) return deferred.resolve("already fetched");
                    var data = httpResponse.data;
                    try {
                        var metadata = "string" == typeof data ? JSON.parse(data) : data;
                        metadataStore.importMetadata(metadata);
                    } catch (e) {
                        var errMsg = "Unable to either parse or import metadata: " + e.message;
                        return handleHttpError(deferred, httpResponse, "Metadata query failed for: " + url + ". " + errMsg);
                    }
                    metadataStore.hasMetadataFor(serviceName) || metadataStore.addDataService(dataService), 
                    deferred.resolve(metadata);
                },
                error: function(httpResponse) {
                    handleHttpError(deferred, httpResponse, "Metadata query failed for: " + url);
                }
            }), deferred.promise;
        }, ctor.prototype.executeQuery = function(mappingContext) {
            var deferred = Q.defer(), params = {
                type: "GET",
                url: mappingContext.url,
                params: mappingContext.query.parameters,
                dataType: "json",
                success: function(httpResponse) {
                    var data = httpResponse.data;
                    try {
                        var rData;
                        rData = data && data.Results ? {
                            results: data.Results,
                            inlineCount: data.InlineCount,
                            httpResponse: httpResponse
                        } : {
                            results: data,
                            httpResponse: httpResponse
                        }, deferred.resolve(rData);
                    } catch (e) {
                        e instanceof Error ? deferred.reject(e) : handleHttpError(httpResponse);
                    }
                },
                error: function(httpResponse) {
                    handleHttpError(deferred, httpResponse);
                }
            };
            return mappingContext.dataService.useJsonp && (params.dataType = "jsonp", params.crossDomain = !0), 
            ajaxImpl.ajax(params), deferred.promise;
        }, ctor.prototype.saveChanges = function(saveContext, saveBundle) {
            var deferred = Q.defer();
            saveBundle = this._prepareSaveBundle(saveBundle, saveContext);
            var bundle = JSON.stringify(saveBundle), url = saveContext.dataService.makeUrl(saveContext.resourceName), that = this;
            return ajaxImpl.ajax({
                type: "POST",
                url: url,
                dataType: "json",
                contentType: "application/json",
                data: bundle,
                success: function(httpResponse) {
                    var data = httpResponse.data;
                    httpResponse.saveContext = saveContext;
                    var entityErrors = data.Errors || data.errors;
                    if (entityErrors) handleHttpError(deferred, httpResponse); else {
                        var saveResult = that._prepareSaveResult(saveContext, data);
                        deferred.resolve(saveResult);
                    }
                },
                error: function(httpResponse) {
                    httpResponse.saveContext = saveContext, handleHttpError(deferred, httpResponse);
                }
            }), deferred.promise;
        }, ctor.prototype._prepareSaveBundle = function() {
            throw new Error("Need a concrete implementation of _prepareSaveBundle");
        }, ctor.prototype._prepareSaveResult = function() {
            throw new Error("Need a concrete implementation of _prepareSaveResult");
        }, ctor.prototype.jsonResultsAdapter = new JsonResultsAdapter({
            name: "noop",
            visitNode: function() {
                return {};
            }
        }), ctor;
    }(), function(factory) {
        breeze ? factory(breeze) : "function" == typeof require && "object" == typeof exports && "object" == typeof module ? factory(require("breeze")) : "function" == typeof define && define.amd && define([ "breeze" ], factory);
    }(function(breeze) {
        function encodeParams(obj) {
            var subValue, innerObj, query = "";
            for (var name in obj) {
                var value = obj[name];
                if (value instanceof Array) for (var i = 0; i < value.length; ++i) subValue = value[i], 
                fullSubName = name + "[" + i + "]", innerObj = {}, innerObj[fullSubName] = subValue, 
                query += encodeParams(innerObj) + "&"; else if (value instanceof Object) for (var subName in value) subValue = value[subName], 
                fullSubName = name + "[" + subName + "]", innerObj = {}, innerObj[fullSubName] = subValue, 
                query += encodeParams(innerObj) + "&"; else void 0 !== value && (query += encodeURIComponent(name) + "=" + encodeURIComponent(value) + "&");
            }
            return query.length ? query.substr(0, query.length - 1) : query;
        }
        var httpService, rootScope, core = breeze.core, ctor = function() {
            this.name = "angular", this.defaultSettings = {};
        };
        ctor.prototype.initialize = function() {
            var ng = core.requireLib("angular");
            if (ng) {
                var $injector = ng.injector([ "ng" ]);
                $injector.invoke([ "$http", "$rootScope", function(xHttp, xRootScope) {
                    httpService = xHttp, rootScope = xRootScope;
                } ]);
            }
        }, ctor.prototype.setHttp = function(http) {
            httpService = http, rootScope = null;
        }, ctor.prototype.ajax = function(config) {
            if (!httpService) throw new Error("Unable to locate angular for ajax adapter");
            var ngConfig = {
                method: config.type,
                url: config.url,
                dataType: config.dataType,
                contentType: config.contentType,
                crossDomain: config.crossDomain
            };
            if (config.params) {
                var delim = ngConfig.url.indexOf("?") >= 0 ? "&" : "?";
                ngConfig.url = ngConfig.url + delim + encodeParams(config.params);
            }
            if (config.data && (ngConfig.data = config.data), !core.isEmpty(this.defaultSettings)) {
                var compositeConfig = core.extend({}, this.defaultSettings);
                ngConfig = core.extend(compositeConfig, ngConfig);
            }
            httpService(ngConfig).success(function(data, status, headers) {
                "null" === data && (data = null);
                var httpResponse = {
                    data: data,
                    status: status,
                    getHeaders: headers,
                    config: config
                };
                config.success(httpResponse);
            }).error(function(data, status, headers) {
                var httpResponse = {
                    data: data,
                    status: status,
                    getHeaders: headers,
                    config: config
                };
                config.error(httpResponse);
            }), rootScope && rootScope.$digest();
        }, breeze.config.registerAdapter("ajax", ctor);
    }), function(factory) {
        breeze ? factory(breeze) : "function" == typeof require && "object" == typeof exports && "object" == typeof module ? factory(require("breeze")) : "function" == typeof define && define.amd && define([ "breeze" ], factory);
    }(function(breeze) {
        function getHeadersFn(XHR) {
            return function(headerName) {
                return headerName && headerName.length > 0 ? XHR.getResponseHeader(headerName) : XHR.getAllResponseHeaders();
            };
        }
        var jQuery, core = breeze.core, ctor = function() {
            this.name = "jQuery", this.defaultSettings = {};
        };
        ctor.prototype.initialize = function() {
            jQuery = core.requireLib("jQuery");
        }, ctor.prototype.ajax = function(config) {
            if (!jQuery) throw new Error("Unable to locate jQuery");
            var jqConfig = {
                type: config.type,
                url: config.url,
                data: config.params || config.data,
                dataType: config.dataType,
                contentType: config.contentType,
                crossDomain: config.crossDomain
            };
            if (!core.isEmpty(this.defaultSettings)) {
                var compositeConfig = core.extend({}, this.defaultSettings);
                jqConfig = core.extend(compositeConfig, jqConfig);
            }
            jqConfig.success = function(data, textStatus, XHR) {
                var httpResponse = {
                    data: data,
                    status: XHR.status,
                    getHeaders: getHeadersFn(XHR),
                    config: config
                };
                config.success(httpResponse), XHR.onreadystatechange = null, XHR.abort = null;
            }, jqConfig.error = function(XHR, textStatus, errorThrown) {
                var httpResponse = {
                    data: XHR.responseText,
                    status: XHR.status,
                    getHeaders: getHeadersFn(XHR),
                    error: errorThrown,
                    config: config
                };
                config.error(httpResponse), XHR.onreadystatechange = null, XHR.abort = null;
            }, jQuery.ajax(jqConfig);
        }, breeze.config.registerAdapter("ajax", ctor);
    }), function(factory) {
        breeze ? factory(breeze) : "function" == typeof require && "object" == typeof exports && "object" == typeof module ? factory(require("breeze")) : "function" == typeof define && define.amd && !breeze && define([ "breeze" ], factory);
    }(function(breeze) {
        function createChangeRequests(saveContext, saveBundle) {
            var changeRequests = [], tempKeys = [], contentKeys = [], prefix = saveContext.dataService.serviceName, entityManager = saveContext.entityManager, helper = entityManager.helper, id = 0;
            return saveBundle.entities.forEach(function(entity) {
                var aspect = entity.entityAspect;
                id += 1;
                var request = {
                    headers: {
                        "Content-ID": id,
                        DataServiceVersion: "2.0"
                    }
                };
                if (contentKeys[id] = entity, aspect.entityState.isAdded()) request.requestUri = entity.entityType.defaultResourceName, 
                request.method = "POST", request.data = helper.unwrapInstance(entity, !0), tempKeys[id] = aspect.getKey(); else if (aspect.entityState.isModified()) updateDeleteMergeRequest(request, aspect, prefix), 
                request.method = "MERGE", request.data = helper.unwrapChangedValues(entity, entityManager.metadataStore, !0); else {
                    if (!aspect.entityState.isDeleted()) return;
                    updateDeleteMergeRequest(request, aspect, prefix), request.method = "DELETE";
                }
                changeRequests.push(request);
            }), saveContext.contentKeys = contentKeys, saveContext.tempKeys = tempKeys, {
                __batchRequests: [ {
                    __changeRequests: changeRequests
                } ]
            };
        }
        function updateDeleteMergeRequest(request, aspect, prefix) {
            var extraMetadata = aspect.extraMetadata, uri = extraMetadata.uri || extraMetadata.id;
            __stringStartsWith(uri, prefix) && (uri = uri.substring(prefix.length)), request.requestUri = uri, 
            extraMetadata.etag && (request.headers["If-Match"] = extraMetadata.etag);
        }
        function createError(error, url) {
            var result = new Error(), response = error.response;
            if (result.message = response.statusText, result.statusText = response.statusText, 
            result.status = response.statusCode, url && (result.url = url), result.body = response.body, 
            response.body) {
                var nextErr;
                try {
                    var body = JSON.parse(response.body);
                    result.body = body, body["odata.error"] && (body = body["odata.error"]);
                    var msg = "";
                    do nextErr = body.error || body.innererror, nextErr || (msg += getMessage(body)), 
                    nextErr = nextErr || body.internalexception, body = nextErr || body; while (nextErr);
                    msg.length > 0 && (result.message = msg);
                } catch (e) {}
            }
            return result;
        }
        function getMessage(body) {
            var msg = body.message || "";
            return ("string" == typeof msg ? msg : msg.value) + "; ";
        }
        var OData, core = breeze.core, MetadataStore = breeze.MetadataStore, JsonResultsAdapter = breeze.JsonResultsAdapter, ctor = function() {
            this.name = "OData";
        };
        ctor.prototype.initialize = function() {
            OData = core.requireLib("OData", "Needed to support remote OData services"), OData.jsonHandler.recognizeDates = !0;
        }, ctor.prototype.executeQuery = function(mappingContext) {
            var deferred = Q.defer();
            return OData.read({
                requestUri: mappingContext.url,
                headers: {
                    DataServiceVersion: "2.0"
                }
            }, function(data) {
                var inlineCount;
                return data.__count && (inlineCount = parseInt(data.__count, 10)), deferred.resolve({
                    results: data.results,
                    inlineCount: inlineCount
                });
            }, function(error) {
                return deferred.reject(createError(error, mappingContext.url));
            }), deferred.promise;
        }, ctor.prototype.fetchMetadata = function(metadataStore, dataService) {
            var deferred = Q.defer(), serviceName = dataService.serviceName, url = dataService.makeUrl("$metadata");
            return OData.read(url, function(data) {
                if (!data || !data.dataServices) {
                    var error = new Error("Metadata query failed for: " + url);
                    return deferred.reject(error);
                }
                var csdlMetadata = data.dataServices;
                if (!metadataStore.hasMetadataFor(serviceName)) {
                    try {
                        metadataStore.importMetadata(csdlMetadata);
                    } catch (e) {
                        return deferred.reject(new Error("Metadata query failed for " + url + "; Unable to process returned metadata: " + e.message));
                    }
                    metadataStore.addDataService(dataService);
                }
                return deferred.resolve(csdlMetadata);
            }, function(error) {
                var err = createError(error, url);
                return err.message = "Metadata query failed for: " + url + "; " + (err.message || ""), 
                deferred.reject(err);
            }, OData.metadataHandler), deferred.promise;
        }, ctor.prototype.saveChanges = function(saveContext, saveBundle) {
            var deferred = Q.defer(), helper = saveContext.entityManager.helper, url = saveContext.dataService.makeUrl("$batch"), requestData = createChangeRequests(saveContext, saveBundle), tempKeys = saveContext.tempKeys, contentKeys = saveContext.contentKeys;
            return OData.request({
                headers: {
                    DataServiceVersion: "2.0"
                },
                requestUri: url,
                method: "POST",
                data: requestData
            }, function(data) {
                var entities = [], keyMappings = [], saveResult = {
                    entities: entities,
                    keyMappings: keyMappings
                };
                return data.__batchResponses.forEach(function(br) {
                    br.__changeResponses.forEach(function(cr) {
                        var response = cr.response || cr, statusCode = response.statusCode;
                        if (!statusCode || statusCode >= 400) return deferred.reject(createError(cr, url));
                        var contentId = cr.headers["Content-ID"], rawEntity = cr.data;
                        if (rawEntity) {
                            var tempKey = tempKeys[contentId];
                            if (tempKey) {
                                var entityType = tempKey.entityType;
                                if (entityType.autoGeneratedKeyType !== AutoGeneratedKeyType.None) {
                                    var tempValue = tempKey.values[0], realKey = helper.getEntityKeyFromRawEntity(rawEntity, entityType, !1), keyMapping = {
                                        entityTypeName: entityType.name,
                                        tempValue: tempValue,
                                        realValue: realKey.values[0]
                                    };
                                    keyMappings.push(keyMapping);
                                }
                            }
                            entities.push(rawEntity);
                        } else {
                            var origEntity = contentKeys[contentId];
                            entities.push(origEntity);
                        }
                    });
                }), deferred.resolve(saveResult);
            }, function(err) {
                return deferred.reject(createError(err, url));
            }, OData.batchHandler), deferred.promise;
        }, ctor.prototype.jsonResultsAdapter = new JsonResultsAdapter({
            name: "OData_default",
            visitNode: function(node, mappingContext, nodeContext) {
                var result = {};
                if (null == node) return result;
                if (null != node.__metadata) {
                    var entityTypeName = MetadataStore.normalizeTypeName(node.__metadata.type), et = entityTypeName && mappingContext.entityManager.metadataStore.getEntityType(entityTypeName, !0);
                    et && et._mappedPropertiesCount <= Object.keys(node).length - 1 && (result.entityType = et, 
                    result.extra = node.__metadata);
                }
                node.results && (result.node = node.results);
                var propertyName = nodeContext.propertyName;
                return result.ignore = null != node.__deferred || "__metadata" === propertyName || "EntityKey" === propertyName && node.$type && core.stringStartsWith(node.$type, "System.Data"), 
                result;
            }
        }), breeze.config.registerAdapter("dataService", ctor);
    }), function(factory) {
        breeze ? factory(breeze) : "function" == typeof require && "object" == typeof exports && "object" == typeof module ? factory(require("breeze")) : "function" == typeof define && define.amd && !breeze && define([ "breeze" ], factory);
    }(function(breeze) {
        var MetadataStore = (breeze.core, breeze.MetadataStore), JsonResultsAdapter = breeze.JsonResultsAdapter, AbstractDataServiceAdapter = breeze.AbstractDataServiceAdapter, ctor = function() {
            this.name = "webApi";
        };
        ctor.prototype = new AbstractDataServiceAdapter(), ctor.prototype._prepareSaveBundle = function(saveBundle, saveContext) {
            var em = saveContext.entityManager, metadataStore = em.metadataStore, helper = em.helper;
            return saveBundle.entities = saveBundle.entities.map(function(e) {
                var rawEntity = helper.unwrapInstance(e), autoGeneratedKey = null;
                e.entityType.autoGeneratedKeyType !== AutoGeneratedKeyType.None && (autoGeneratedKey = {
                    propertyName: e.entityType.keyProperties[0].nameOnServer,
                    autoGeneratedKeyType: e.entityType.autoGeneratedKeyType.name
                });
                var originalValuesOnServer = helper.unwrapOriginalValues(e, metadataStore);
                return rawEntity.entityAspect = {
                    entityTypeName: e.entityType.name,
                    defaultResourceName: e.entityType.defaultResourceName,
                    entityState: e.entityAspect.entityState.name,
                    originalValuesMap: originalValuesOnServer,
                    autoGeneratedKey: autoGeneratedKey
                }, rawEntity;
            }), saveBundle.saveOptions = {
                tag: saveBundle.saveOptions.tag
            }, saveBundle;
        }, ctor.prototype._prepareSaveResult = function(saveContext, data) {
            var keyMappings = data.KeyMappings.map(function(km) {
                var entityTypeName = MetadataStore.normalizeTypeName(km.EntityTypeName);
                return {
                    entityTypeName: entityTypeName,
                    tempValue: km.TempValue,
                    realValue: km.RealValue
                };
            });
            return {
                entities: data.Entities,
                keyMappings: keyMappings,
                XHR: data.XHR
            };
        }, ctor.prototype.jsonResultsAdapter = new JsonResultsAdapter({
            name: "webApi_default",
            visitNode: function(node, mappingContext, nodeContext) {
                if (null == node) return {};
                var entityTypeName = MetadataStore.normalizeTypeName(node.$type), entityType = entityTypeName && mappingContext.entityManager.metadataStore._getEntityType(entityTypeName, !0), propertyName = nodeContext.propertyName, ignore = propertyName && "$" === propertyName.substr(0, 1);
                return {
                    entityType: entityType,
                    nodeId: node.$id,
                    nodeRefId: node.$ref,
                    ignore: ignore
                };
            }
        }), breeze.config.registerAdapter("dataService", ctor);
    }), function(factory) {
        breeze ? factory(breeze) : "function" == typeof require && "object" == typeof exports && "object" == typeof module ? factory(require("breeze")) : "function" == typeof define && define.amd && !breeze && define([ "breeze" ], factory);
    }(function(breeze) {
        var Backbone, _, bbSet, bbGet, core = breeze.core, hasOwnProperty = (breeze.ComplexAspect, 
        Object.prototype.hasOwnProperty), ctor = function() {
            this.name = "backbone";
        };
        ctor.prototype.initialize = function() {
            Backbone = core.requireLib("Backbone"), _ = core.requireLib("_;underscore"), bbSet = Backbone.Model.prototype.set, 
            bbGet = Backbone.Model.prototype.get;
        }, ctor.prototype.createCtor = function(structuralType) {
            var defaults = {};
            structuralType.dataProperties.forEach(function(dp) {
                defaults[dp.name] = dp.defaultValue;
            });
            var modelCtor = Backbone.Model.extend({
                defaults: defaults,
                initialize: function() {
                    if (structuralType.navigationProperties) {
                        var that = this;
                        structuralType.navigationProperties.forEach(function(np) {
                            if (!np.isScalar) {
                                var val = breeze.makeRelationArray([], that, np);
                                Backbone.Model.prototype.set.call(that, np.name, val);
                            }
                        });
                    }
                }
            });
            return modelCtor;
        }, ctor.prototype.getTrackablePropertyNames = function(entity) {
            var names = [];
            for (var p in entity.attributes) names.push(p);
            return names;
        }, ctor.prototype.initializeEntityPrototype = function(proto) {
            proto.getProperty = function(propertyName) {
                return this.get(propertyName);
            }, proto.setProperty = function(propertyName, value) {
                return this.set(propertyName, value), this;
            }, proto.set = function(key, value, options) {
                var aspect = this.entityAspect || this.complexAspect;
                if (!aspect) return bbSet.call(this, key, value, options);
                var attrs, prop, propName, that = this, stype = this.entityType || this.complexType;
                if (_.isObject(key) || null == key) {
                    if (attrs = key, options = value, !this._validate(attrs, options)) return !1;
                    for (propName in attrs) if (hasOwnProperty.call(attrs, propName)) {
                        if (prop = stype.getProperty(propName), null == prop) throw new Error("Unknown property: " + key);
                        var fn = function(pName) {
                            return function(pValue) {
                                return 0 === arguments.length ? bbGet.call(that, pName) : bbSet.call(that, pName, pValue, options);
                            };
                        }(propName);
                        this._$interceptor(prop, attrs[propName], fn);
                    }
                } else {
                    if (attrs = {}, attrs[key] = value, options || (options = {}), !this._validate(attrs, options)) return !1;
                    if (prop = stype.getProperty(key), null == prop) throw new Error("Unknown property: " + key);
                    propName = key, this._$interceptor(prop, value, function(pvalue) {
                        return 0 === arguments.length ? bbGet.call(that, propName) : bbSet.call(that, propName, pvalue, options);
                    });
                }
                return this;
            };
        }, ctor.prototype.startTracking = function(entity) {
            if (!(entity instanceof Backbone.Model)) throw new Error("This entity is not an Backbone.Model instance");
            var stype = entity.entityType || entity.complexType, attributes = entity.attributes;
            stype.dataProperties.forEach(function(dp) {
                var propName = dp.name, val = attributes[propName];
                dp.isComplexProperty ? val = dp.isScalar ? dp.dataType._createInstanceCore(entity, dp) : breeze.makeComplexArray([], entity, dp) : dp.isScalar ? void 0 === val && (val = dp.defaultValue) : val = breeze.makePrimitiveArray([], entity, dp), 
                bbSet.call(entity, propName, val);
            }), stype.navigationProperties && stype.navigationProperties.forEach(function(np) {
                var msg;
                if (np.name in attributes) {
                    var val = bbGet.call(entity, np.name);
                    if (np.isScalar) {
                        if (val && !val.entityType) throw msg = core.formatString("The value of the '%1' property for entityType: '%2' must be either null or another entity", np.name, entity.entityType.name), 
                        new Error(msg);
                    } else if (val) {
                        if (!val.parentEntity) throw msg = core.formatString("The value of the '%1' property for entityType: '%2' must be either null or a Breeze relation array", np.name, entity.entityType.name), 
                        new Error(msg);
                    } else val = breeze.makeRelationArray([], entity, np), bbSet.call(entity, np.name, val);
                } else np.isScalar ? bbSet.call(entity, np.name, null) : (val = breeze.makeRelationArray([], entity, np), 
                bbSet.call(entity, np.name, val));
            });
        }, breeze.config.registerAdapter("modelLibrary", ctor);
    }), function(factory) {
        breeze ? factory(breeze) : "function" == typeof require && "object" == typeof exports && "object" == typeof module ? factory(require("breeze")) : "function" == typeof define && define.amd && !breeze && define([ "breeze" ], factory);
    }(function(breeze) {
        function movePropDefsToProto(proto) {
            var stype = proto.entityType || proto.complexType, extra = stype._extra, alreadyWrapped = extra.alreadyWrappedProps || {};
            stype.getProperties().forEach(function(prop) {
                var propName = prop.name;
                alreadyWrapped[propName] || (propName in proto ? wrapPropDescription(proto, prop) : makePropDescription(proto, prop), 
                alreadyWrapped[propName] = !0);
            }), extra.alreadyWrappedProps = alreadyWrapped;
        }
        function movePropsToBackingStore(instance) {
            var proto = Object.getPrototypeOf(instance);
            instance._backingStore || (instance._backingStore = {});
            var stype = proto.entityType || proto.complexType;
            return stype.getProperties().forEach(function(prop) {
                var propName = prop.name;
                if (instance.hasOwnProperty(propName)) {
                    var value = instance[propName];
                    delete instance[propName], instance[propName] = value;
                }
            }), instance._backingStore;
        }
        function makePropDescription(proto, property) {
            var propName = property.name, getAccessorFn = function(backingStore) {
                return function() {
                    return 0 == arguments.length ? backingStore[propName] : (backingStore[propName] = arguments[0], 
                    void 0);
                };
            }, descr = {
                get: function() {
                    var bs = this._backingStore;
                    if (bs || (this._pendingSets.process(), bs = this._backingStore)) return bs[propName];
                },
                set: function(value) {
                    var bs = this._backingStore;
                    if (!bs) return this._pendingSets.schedule(this, propName, value), void 0;
                    var accessorFn = getAccessorFn(bs);
                    this._$interceptor(property, value, accessorFn);
                },
                enumerable: !0,
                configurable: !0
            };
            try {
                Object.defineProperty(proto, propName, descr);
            } catch (e) {
                proto[propName] = descr;
            }
        }
        function wrapPropDescription(proto, property) {
            if (!proto.hasOwnProperty(property.name)) {
                var nextProto = Object.getPrototypeOf(proto);
                return wrapPropDescription(nextProto, property), void 0;
            }
            var propDescr = Object.getOwnPropertyDescriptor(proto, property.name);
            if (propDescr.configurable && !propDescr.value && propDescr.set) {
                var getAccessorFn = function(entity) {
                    return function() {
                        return 0 == arguments.length ? propDescr.get.bind(entity)() : (propDescr.set.bind(entity)(arguments[0]), 
                        void 0);
                    };
                }, newDescr = {
                    get: function() {
                        return propDescr.get.bind(this)();
                    },
                    set: function(value) {
                        this._$interceptor(property, value, getAccessorFn(this));
                    },
                    enumerable: propDescr.enumerable,
                    configurable: !0
                };
                try {
                    Object.defineProperty(proto, property.name, newDescr);
                } catch (e) {
                    proto[property.name] = newDescr;
                }
            }
        }
        var core = breeze.core, ctor = function() {
            this.name = "backingStore";
        };
        ctor.prototype.initialize = function() {}, ctor.prototype.getTrackablePropertyNames = function(entity) {
            var names = [];
            for (var p in entity) if ("entityType" !== p && "_$typeName" !== p && "_pendingSets" !== p && "_backingStore" !== p) {
                var val = entity[p];
                core.isFunction(val) || names.push(p);
            }
            return names;
        }, ctor.prototype.initializeEntityPrototype = function(proto) {
            proto.getProperty = function(propertyName) {
                return this[propertyName];
            }, proto.setProperty = function(propertyName, value) {
                if (!this._backingStore.hasOwnProperty(propertyName)) throw new Error("Unknown property name:" + propertyName);
                return this[propertyName] = value, this;
            }, proto.initializeFrom = function(rawEntity) {
                var that = this;
                this.entityType.unmappedProperties.forEach(function(prop) {
                    var propName = prop.name;
                    rawEntity[propName] = that[propName];
                }), this._backingStore || (this._backingStore = {});
            }, proto._pendingSets = [], proto._pendingSets.schedule = function(entity, propName, value) {
                if (this.push({
                    entity: entity,
                    propName: propName,
                    value: value
                }), !this.isPending) {
                    this.isPending = !0;
                    var that = this;
                    setTimeout(function() {
                        that.process();
                    });
                }
            }, proto._pendingSets.process = function() {
                0 !== this.length && (this.forEach(function(ps) {
                    ps.entity._backingStore || (ps.entity._backingStore = {}), ps.entity._backingStore[ps.propName] = ps.value;
                }), this.length = 0, this.isPending = !1);
            }, movePropDefsToProto(proto);
        }, ctor.prototype.startTracking = function(entity, proto) {
            proto._pendingSets.process();
            var bs = movePropsToBackingStore(entity), stype = entity.entityType || entity.complexType;
            stype.getProperties().forEach(function(prop) {
                var propName = prop.name, val = entity[propName];
                if (prop.isDataProperty) prop.isComplexProperty ? val = prop.isScalar ? prop.dataType._createInstanceCore(entity, prop) : breeze.makeComplexArray([], entity, prop) : prop.isScalar ? void 0 === val && (val = prop.defaultValue) : val = breeze.makePrimitiveArray([], entity, prop); else {
                    if (!prop.isNavigationProperty) throw new Error("unknown property: " + propName);
                    if (void 0 !== val) throw new Error("Cannot assign a navigation property in an entity ctor.: " + prop.Name);
                    val = prop.isScalar ? null : breeze.makeRelationArray([], entity, prop);
                }
                bs[propName] = val;
            });
        }, breeze.config.registerAdapter("modelLibrary", ctor);
    }), function(factory) {
        breeze ? factory(breeze) : "function" == typeof require && "object" == typeof exports && "object" == typeof module ? factory(require("breeze")) : "function" == typeof define && define.amd && !breeze && define([ "breeze" ], factory);
    }(function(breeze) {
        function isolateES5Props(proto) {
            var stype = proto.entityType || proto.complexType;
            if (es5Descriptors = {}, stype.getProperties().forEach(function(prop) {
                propDescr = getES5PropDescriptor(proto, prop.name), propDescr && (es5Descriptors[prop.name] = propDescr);
            }), !__isEmpty(es5Descriptors)) {
                var extra = stype._extra;
                extra.es5Descriptors = es5Descriptors, stype._koDummy = ko.observable(null);
            }
        }
        function getES5PropDescriptor(proto, propName) {
            if (proto.hasOwnProperty(propName)) return Object.getOwnPropertyDescriptor && Object.getOwnPropertyDescriptor(proto, propName);
            var nextProto = Object.getPrototypeOf(proto);
            return nextProto ? getES5PropDescriptor(nextProto, propName) : null;
        }
        function initializeValueForProp(entity, prop, val) {
            if (prop.isDataProperty) prop.isComplexProperty ? val = prop.isScalar ? prop.dataType._createInstanceCore(entity, prop) : breeze.makeComplexArray([], entity, prop) : prop.isScalar ? void 0 === val && (val = prop.defaultValue) : val = breeze.makePrimitiveArray([], entity, prop); else {
                if (!prop.isNavigationProperty) throw new Error("unknown property: " + prop.name);
                if (void 0 !== val) throw new Error("Cannot assign a navigation property in an entity ctor.: " + prop.name);
                val = prop.isScalar ? null : breeze.makeRelationArray([], entity, prop);
            }
            return val;
        }
        function onBeforeChange(args) {
            args._koObj._suppressBreeze = !0;
        }
        function onArrayChanged(args) {
            var koObj = args.array._koObj;
            koObj._suppressBreeze ? koObj._suppressBreeze = !1 : koObj.valueHasMutated();
        }
        var ko, core = breeze.core, ctor = function() {
            this.name = "ko";
        };
        ctor.prototype.initialize = function() {
            ko = core.requireLib("ko", "The Knockout library"), ko.extenders.intercept = function(target, interceptorOptions) {
                var result, instance = interceptorOptions.instance, property = interceptorOptions.property;
                return result = target.splice ? ko.computed({
                    read: target
                }) : ko.computed({
                    read: target,
                    write: function(newValue) {
                        return instance._$interceptor(property, newValue, target), instance;
                    }
                });
            };
        }, ctor.prototype.getTrackablePropertyNames = function(entity) {
            var names = [];
            for (var p in entity) if ("entityType" !== p && "_$typeName" !== p) {
                var propDescr = getES5PropDescriptor(entity, p);
                if (propDescr && propDescr.get) names.push(p); else {
                    var val = entity[p];
                    ko.isObservable(val) ? names.push(p) : core.isFunction(val) || names.push(p);
                }
            }
            return names;
        }, ctor.prototype.initializeEntityPrototype = function(proto) {
            proto.getProperty = function(propertyName) {
                return this[propertyName]();
            }, proto.setProperty = function(propertyName, value) {
                return this[propertyName](value), this;
            }, Object.getPrototypeOf && isolateES5Props(proto);
        }, ctor.prototype.startTracking = function(entity) {
            var stype = entity.entityType || entity.complexType, es5Descriptors = stype._extra.es5Descriptors || {};
            stype.getProperties().sort(function(p1, p2) {
                var v1 = p1.isUnmapped ? 1 : 0, v2 = p2.isUnmapped ? 1 : 0;
                return v1 - v2;
            }).forEach(function(prop) {
                var koObj, propName = prop.name, val = entity[propName], propDescr = es5Descriptors[propName];
                if (propDescr) {
                    var getFn = propDescr.get.bind(entity);
                    if (propDescr.set) {
                        var setFn = propDescr.set.bind(entity), rawAccessorFn = function(newValue) {
                            return 0 === arguments.length ? getFn() : (setFn(newValue), void 0);
                        };
                        koObj = ko.computed({
                            read: function() {
                                return stype._koDummy(), getFn();
                            },
                            write: function(newValue) {
                                return entity._$interceptor(prop, newValue, rawAccessorFn), stype._koDummy.valueHasMutated(), 
                                entity;
                            }
                        });
                    } else koObj = ko.computed({
                        read: getFn,
                        write: function() {}
                    });
                } else if (ko.isObservable(val)) {
                    if (prop.isNavigationProperty) throw new Error("Cannot assign a navigation property in an entity ctor.: " + propName);
                    koObj = val;
                } else {
                    var val = initializeValueForProp(entity, prop, val);
                    koObj = prop.isScalar ? ko.observable(val) : ko.observableArray(val);
                }
                if (prop.isScalar) if (propDescr) {
                    var tmpDescr = {
                        enumerable: !0,
                        configurable: !0,
                        writable: !0,
                        value: koObj
                    };
                    try {
                        Object.defineProperty(entity, propName, tmpDescr);
                    } catch (e) {
                        entity[propName] = tmpDescr;
                    }
                } else {
                    var koExt = koObj.extend({
                        intercept: {
                            instance: entity,
                            property: prop
                        }
                    });
                    entity[propName] = koExt;
                } else val._koObj = koObj, koObj.subscribe(onBeforeChange, null, "beforeChange"), 
                val.arrayChanged.subscribe(onArrayChanged), koObj.equalityComparer = function() {
                    throw new Error("Collection navigation properties may NOT be set.");
                }, entity[propName] = koObj;
            });
        }, breeze.config.registerAdapter("modelLibrary", ctor);
    }), breeze.config.initializeAdapterInstances({
        dataService: "webApi",
        ajax: "jQuery"
    });
    var ko = __requireLibCore("ko");
    return ko ? breeze.config.initializeAdapterInstance("modelLibrary", "ko") : breeze.config.initializeAdapterInstance("modelLibrary", "backingStore"), 
    this.window && (this.window.breeze = breeze), breeze;
}), function(window, document, undefined) {
    "use strict";
    function minErr(module) {
        return function() {
            var message, i, code = arguments[0], prefix = "[" + (module ? module + ":" : "") + code + "] ", template = arguments[1], templateArgs = arguments, stringify = function(obj) {
                return isFunction(obj) ? obj.toString().replace(/ \{[\s\S]*$/, "") : isUndefined(obj) ? "undefined" : isString(obj) ? obj : JSON.stringify(obj);
            };
            for (message = prefix + template.replace(/\{\d+\}/g, function(match) {
                var arg, index = +match.slice(1, -1);
                return index + 2 < templateArgs.length ? (arg = templateArgs[index + 2], isFunction(arg) ? arg.toString().replace(/ ?\{[\s\S]*$/, "") : isUndefined(arg) ? "undefined" : isString(arg) ? arg : toJson(arg)) : match;
            }), message = message + "\nhttp://errors.angularjs.org/" + version.full + "/" + (module ? module + "/" : "") + code, 
            i = 2; i < arguments.length; i++) message = message + (2 == i ? "?" : "&") + "p" + (i - 2) + "=" + encodeURIComponent(stringify(arguments[i]));
            return new Error(message);
        };
    }
    function isArrayLike(obj) {
        if (null == obj || isWindow(obj)) return !1;
        var length = obj.length;
        return 1 === obj.nodeType && length ? !0 : isString(obj) || isArray(obj) || 0 === length || "number" == typeof length && length > 0 && length - 1 in obj;
    }
    function forEach(obj, iterator, context) {
        var key;
        if (obj) if (isFunction(obj)) for (key in obj) "prototype" != key && "length" != key && "name" != key && obj.hasOwnProperty(key) && iterator.call(context, obj[key], key); else if (obj.forEach && obj.forEach !== forEach) obj.forEach(iterator, context); else if (isArrayLike(obj)) for (key = 0; key < obj.length; key++) iterator.call(context, obj[key], key); else for (key in obj) obj.hasOwnProperty(key) && iterator.call(context, obj[key], key);
        return obj;
    }
    function sortedKeys(obj) {
        var keys = [];
        for (var key in obj) obj.hasOwnProperty(key) && keys.push(key);
        return keys.sort();
    }
    function forEachSorted(obj, iterator, context) {
        for (var keys = sortedKeys(obj), i = 0; i < keys.length; i++) iterator.call(context, obj[keys[i]], keys[i]);
        return keys;
    }
    function reverseParams(iteratorFn) {
        return function(value, key) {
            iteratorFn(key, value);
        };
    }
    function nextUid() {
        for (var digit, index = uid.length; index; ) {
            if (index--, digit = uid[index].charCodeAt(0), 57 == digit) return uid[index] = "A", 
            uid.join("");
            if (90 != digit) return uid[index] = String.fromCharCode(digit + 1), uid.join("");
            uid[index] = "0";
        }
        return uid.unshift("0"), uid.join("");
    }
    function setHashKey(obj, h) {
        h ? obj.$$hashKey = h : delete obj.$$hashKey;
    }
    function extend(dst) {
        var h = dst.$$hashKey;
        return forEach(arguments, function(obj) {
            obj !== dst && forEach(obj, function(value, key) {
                dst[key] = value;
            });
        }), setHashKey(dst, h), dst;
    }
    function int(str) {
        return parseInt(str, 10);
    }
    function inherit(parent, extra) {
        return extend(new (extend(function() {}, {
            prototype: parent
        }))(), extra);
    }
    function noop() {}
    function identity($) {
        return $;
    }
    function valueFn(value) {
        return function() {
            return value;
        };
    }
    function isUndefined(value) {
        return "undefined" == typeof value;
    }
    function isDefined(value) {
        return "undefined" != typeof value;
    }
    function isObject(value) {
        return null != value && "object" == typeof value;
    }
    function isString(value) {
        return "string" == typeof value;
    }
    function isNumber(value) {
        return "number" == typeof value;
    }
    function isDate(value) {
        return "[object Date]" == toString.apply(value);
    }
    function isArray(value) {
        return "[object Array]" == toString.apply(value);
    }
    function isFunction(value) {
        return "function" == typeof value;
    }
    function isRegExp(value) {
        return "[object RegExp]" == toString.apply(value);
    }
    function isWindow(obj) {
        return obj && obj.document && obj.location && obj.alert && obj.setInterval;
    }
    function isScope(obj) {
        return obj && obj.$evalAsync && obj.$watch;
    }
    function isFile(obj) {
        return "[object File]" === toString.apply(obj);
    }
    function isElement(node) {
        return node && (node.nodeName || node.on && node.find);
    }
    function map(obj, iterator, context) {
        var results = [];
        return forEach(obj, function(value, index, list) {
            results.push(iterator.call(context, value, index, list));
        }), results;
    }
    function includes(array, obj) {
        return -1 != indexOf(array, obj);
    }
    function indexOf(array, obj) {
        if (array.indexOf) return array.indexOf(obj);
        for (var i = 0; i < array.length; i++) if (obj === array[i]) return i;
        return -1;
    }
    function arrayRemove(array, value) {
        var index = indexOf(array, value);
        return index >= 0 && array.splice(index, 1), value;
    }
    function copy(source, destination) {
        if (isWindow(source) || isScope(source)) throw ngMinErr("cpws", "Can't copy! Making copies of Window or Scope instances is not supported.");
        if (destination) {
            if (source === destination) throw ngMinErr("cpi", "Can't copy! Source and destination are identical.");
            if (isArray(source)) {
                destination.length = 0;
                for (var i = 0; i < source.length; i++) destination.push(copy(source[i]));
            } else {
                var h = destination.$$hashKey;
                forEach(destination, function(value, key) {
                    delete destination[key];
                });
                for (var key in source) destination[key] = copy(source[key]);
                setHashKey(destination, h);
            }
        } else destination = source, source && (isArray(source) ? destination = copy(source, []) : isDate(source) ? destination = new Date(source.getTime()) : isRegExp(source) ? destination = new RegExp(source.source) : isObject(source) && (destination = copy(source, {})));
        return destination;
    }
    function shallowCopy(src, dst) {
        dst = dst || {};
        for (var key in src) src.hasOwnProperty(key) && "$$" !== key.substr(0, 2) && (dst[key] = src[key]);
        return dst;
    }
    function equals(o1, o2) {
        if (o1 === o2) return !0;
        if (null === o1 || null === o2) return !1;
        if (o1 !== o1 && o2 !== o2) return !0;
        var length, key, keySet, t1 = typeof o1, t2 = typeof o2;
        if (t1 == t2 && "object" == t1) {
            if (!isArray(o1)) {
                if (isDate(o1)) return isDate(o2) && o1.getTime() == o2.getTime();
                if (isRegExp(o1) && isRegExp(o2)) return o1.toString() == o2.toString();
                if (isScope(o1) || isScope(o2) || isWindow(o1) || isWindow(o2) || isArray(o2)) return !1;
                keySet = {};
                for (key in o1) if ("$" !== key.charAt(0) && !isFunction(o1[key])) {
                    if (!equals(o1[key], o2[key])) return !1;
                    keySet[key] = !0;
                }
                for (key in o2) if (!keySet.hasOwnProperty(key) && "$" !== key.charAt(0) && o2[key] !== undefined && !isFunction(o2[key])) return !1;
                return !0;
            }
            if (!isArray(o2)) return !1;
            if ((length = o1.length) == o2.length) {
                for (key = 0; length > key; key++) if (!equals(o1[key], o2[key])) return !1;
                return !0;
            }
        }
        return !1;
    }
    function csp() {
        return document.securityPolicy && document.securityPolicy.isActive || document.querySelector && !(!document.querySelector("[ng-csp]") && !document.querySelector("[data-ng-csp]"));
    }
    function concat(array1, array2, index) {
        return array1.concat(slice.call(array2, index));
    }
    function sliceArgs(args, startIndex) {
        return slice.call(args, startIndex || 0);
    }
    function bind(self, fn) {
        var curryArgs = arguments.length > 2 ? sliceArgs(arguments, 2) : [];
        return !isFunction(fn) || fn instanceof RegExp ? fn : curryArgs.length ? function() {
            return arguments.length ? fn.apply(self, curryArgs.concat(slice.call(arguments, 0))) : fn.apply(self, curryArgs);
        } : function() {
            return arguments.length ? fn.apply(self, arguments) : fn.call(self);
        };
    }
    function toJsonReplacer(key, value) {
        var val = value;
        return "string" == typeof key && "$" === key.charAt(0) ? val = undefined : isWindow(value) ? val = "$WINDOW" : value && document === value ? val = "$DOCUMENT" : isScope(value) && (val = "$SCOPE"), 
        val;
    }
    function toJson(obj, pretty) {
        return "undefined" == typeof obj ? undefined : JSON.stringify(obj, toJsonReplacer, pretty ? "  " : null);
    }
    function fromJson(json) {
        return isString(json) ? JSON.parse(json) : json;
    }
    function toBoolean(value) {
        if (value && 0 !== value.length) {
            var v = lowercase("" + value);
            value = !("f" == v || "0" == v || "false" == v || "no" == v || "n" == v || "[]" == v);
        } else value = !1;
        return value;
    }
    function startingTag(element) {
        element = jqLite(element).clone();
        try {
            element.html("");
        } catch (e) {}
        var TEXT_NODE = 3, elemHtml = jqLite("<div>").append(element).html();
        try {
            return element[0].nodeType === TEXT_NODE ? lowercase(elemHtml) : elemHtml.match(/^(<[^>]+>)/)[1].replace(/^<([\w\-]+)/, function(match, nodeName) {
                return "<" + lowercase(nodeName);
            });
        } catch (e) {
            return lowercase(elemHtml);
        }
    }
    function tryDecodeURIComponent(value) {
        try {
            return decodeURIComponent(value);
        } catch (e) {}
    }
    function parseKeyValue(keyValue) {
        var key_value, key, obj = {};
        return forEach((keyValue || "").split("&"), function(keyValue) {
            if (keyValue && (key_value = keyValue.split("="), key = tryDecodeURIComponent(key_value[0]), 
            isDefined(key))) {
                var val = isDefined(key_value[1]) ? tryDecodeURIComponent(key_value[1]) : !0;
                obj[key] ? isArray(obj[key]) ? obj[key].push(val) : obj[key] = [ obj[key], val ] : obj[key] = val;
            }
        }), obj;
    }
    function toKeyValue(obj) {
        var parts = [];
        return forEach(obj, function(value, key) {
            isArray(value) ? forEach(value, function(arrayValue) {
                parts.push(encodeUriQuery(key, !0) + (arrayValue === !0 ? "" : "=" + encodeUriQuery(arrayValue, !0)));
            }) : parts.push(encodeUriQuery(key, !0) + (value === !0 ? "" : "=" + encodeUriQuery(value, !0)));
        }), parts.length ? parts.join("&") : "";
    }
    function encodeUriSegment(val) {
        return encodeUriQuery(val, !0).replace(/%26/gi, "&").replace(/%3D/gi, "=").replace(/%2B/gi, "+");
    }
    function encodeUriQuery(val, pctEncodeSpaces) {
        return encodeURIComponent(val).replace(/%40/gi, "@").replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, pctEncodeSpaces ? "%20" : "+");
    }
    function angularInit(element, bootstrap) {
        function append(element) {
            element && elements.push(element);
        }
        var appElement, module, elements = [ element ], names = [ "ng:app", "ng-app", "x-ng-app", "data-ng-app" ], NG_APP_CLASS_REGEXP = /\sng[:\-]app(:\s*([\w\d_]+);?)?\s/;
        forEach(names, function(name) {
            names[name] = !0, append(document.getElementById(name)), name = name.replace(":", "\\:"), 
            element.querySelectorAll && (forEach(element.querySelectorAll("." + name), append), 
            forEach(element.querySelectorAll("." + name + "\\:"), append), forEach(element.querySelectorAll("[" + name + "]"), append));
        }), forEach(elements, function(element) {
            if (!appElement) {
                var className = " " + element.className + " ", match = NG_APP_CLASS_REGEXP.exec(className);
                match ? (appElement = element, module = (match[2] || "").replace(/\s+/g, ",")) : forEach(element.attributes, function(attr) {
                    !appElement && names[attr.name] && (appElement = element, module = attr.value);
                });
            }
        }), appElement && bootstrap(appElement, module ? [ module ] : []);
    }
    function bootstrap(element, modules) {
        var doBootstrap = function() {
            if (element = jqLite(element), element.injector()) {
                var tag = element[0] === document ? "document" : startingTag(element);
                throw ngMinErr("btstrpd", "App Already Bootstrapped with this Element '{0}'", tag);
            }
            modules = modules || [], modules.unshift([ "$provide", function($provide) {
                $provide.value("$rootElement", element);
            } ]), modules.unshift("ng");
            var injector = createInjector(modules);
            return injector.invoke([ "$rootScope", "$rootElement", "$compile", "$injector", "$animate", function(scope, element, compile, injector) {
                scope.$apply(function() {
                    element.data("$injector", injector), compile(element)(scope);
                });
            } ]), injector;
        }, NG_DEFER_BOOTSTRAP = /^NG_DEFER_BOOTSTRAP!/;
        return window && !NG_DEFER_BOOTSTRAP.test(window.name) ? doBootstrap() : (window.name = window.name.replace(NG_DEFER_BOOTSTRAP, ""), 
        angular.resumeBootstrap = function(extraModules) {
            forEach(extraModules, function(module) {
                modules.push(module);
            }), doBootstrap();
        }, void 0);
    }
    function snake_case(name, separator) {
        return separator = separator || "_", name.replace(SNAKE_CASE_REGEXP, function(letter, pos) {
            return (pos ? separator : "") + letter.toLowerCase();
        });
    }
    function bindJQuery() {
        jQuery = window.jQuery, jQuery ? (jqLite = jQuery, extend(jQuery.fn, {
            scope: JQLitePrototype.scope,
            isolateScope: JQLitePrototype.isolateScope,
            controller: JQLitePrototype.controller,
            injector: JQLitePrototype.injector,
            inheritedData: JQLitePrototype.inheritedData
        }), jqLitePatchJQueryRemove("remove", !0, !0, !1), jqLitePatchJQueryRemove("empty", !1, !1, !1), 
        jqLitePatchJQueryRemove("html", !1, !1, !0)) : jqLite = JQLite, angular.element = jqLite;
    }
    function assertArg(arg, name, reason) {
        if (!arg) throw ngMinErr("areq", "Argument '{0}' is {1}", name || "?", reason || "required");
        return arg;
    }
    function assertArgFn(arg, name, acceptArrayAnnotation) {
        return acceptArrayAnnotation && isArray(arg) && (arg = arg[arg.length - 1]), assertArg(isFunction(arg), name, "not a function, got " + (arg && "object" == typeof arg ? arg.constructor.name || "Object" : typeof arg)), 
        arg;
    }
    function assertNotHasOwnProperty(name, context) {
        if ("hasOwnProperty" === name) throw ngMinErr("badname", "hasOwnProperty is not a valid {0} name", context);
    }
    function getter(obj, path, bindFnToScope) {
        if (!path) return obj;
        for (var key, keys = path.split("."), lastInstance = obj, len = keys.length, i = 0; len > i; i++) key = keys[i], 
        obj && (obj = (lastInstance = obj)[key]);
        return !bindFnToScope && isFunction(obj) ? bind(lastInstance, obj) : obj;
    }
    function getBlockElements(block) {
        if (block.startNode === block.endNode) return jqLite(block.startNode);
        var element = block.startNode, elements = [ element ];
        do {
            if (element = element.nextSibling, !element) break;
            elements.push(element);
        } while (element !== block.endNode);
        return jqLite(elements);
    }
    function setupModuleLoader(window) {
        function ensure(obj, name, factory) {
            return obj[name] || (obj[name] = factory());
        }
        var $injectorMinErr = minErr("$injector");
        return ensure(ensure(window, "angular", Object), "module", function() {
            var modules = {};
            return function(name, requires, configFn) {
                return assertNotHasOwnProperty(name, "module"), requires && modules.hasOwnProperty(name) && (modules[name] = null), 
                ensure(modules, name, function() {
                    function invokeLater(provider, method, insertMethod) {
                        return function() {
                            return invokeQueue[insertMethod || "push"]([ provider, method, arguments ]), moduleInstance;
                        };
                    }
                    if (!requires) throw $injectorMinErr("nomod", "Module '{0}' is not available! You either misspelled the module name or forgot to load it. If registering a module ensure that you specify the dependencies as the second argument.", name);
                    var invokeQueue = [], runBlocks = [], config = invokeLater("$injector", "invoke"), moduleInstance = {
                        _invokeQueue: invokeQueue,
                        _runBlocks: runBlocks,
                        requires: requires,
                        name: name,
                        provider: invokeLater("$provide", "provider"),
                        factory: invokeLater("$provide", "factory"),
                        service: invokeLater("$provide", "service"),
                        value: invokeLater("$provide", "value"),
                        constant: invokeLater("$provide", "constant", "unshift"),
                        animation: invokeLater("$animateProvider", "register"),
                        filter: invokeLater("$filterProvider", "register"),
                        controller: invokeLater("$controllerProvider", "register"),
                        directive: invokeLater("$compileProvider", "directive"),
                        config: config,
                        run: function(block) {
                            return runBlocks.push(block), this;
                        }
                    };
                    return configFn && config(configFn), moduleInstance;
                });
            };
        });
    }
    function publishExternalAPI(angular) {
        extend(angular, {
            bootstrap: bootstrap,
            copy: copy,
            extend: extend,
            equals: equals,
            element: jqLite,
            forEach: forEach,
            injector: createInjector,
            noop: noop,
            bind: bind,
            toJson: toJson,
            fromJson: fromJson,
            identity: identity,
            isUndefined: isUndefined,
            isDefined: isDefined,
            isString: isString,
            isFunction: isFunction,
            isObject: isObject,
            isNumber: isNumber,
            isElement: isElement,
            isArray: isArray,
            version: version,
            isDate: isDate,
            lowercase: lowercase,
            uppercase: uppercase,
            callbacks: {
                counter: 0
            },
            $$minErr: minErr,
            $$csp: csp
        }), angularModule = setupModuleLoader(window);
        try {
            angularModule("ngLocale");
        } catch (e) {
            angularModule("ngLocale", []).provider("$locale", $LocaleProvider);
        }
        angularModule("ng", [ "ngLocale" ], [ "$provide", function($provide) {
            $provide.provider("$compile", $CompileProvider).directive({
                a: htmlAnchorDirective,
                input: inputDirective,
                textarea: inputDirective,
                form: formDirective,
                script: scriptDirective,
                select: selectDirective,
                style: styleDirective,
                option: optionDirective,
                ngBind: ngBindDirective,
                ngBindHtml: ngBindHtmlDirective,
                ngBindTemplate: ngBindTemplateDirective,
                ngClass: ngClassDirective,
                ngClassEven: ngClassEvenDirective,
                ngClassOdd: ngClassOddDirective,
                ngCloak: ngCloakDirective,
                ngController: ngControllerDirective,
                ngForm: ngFormDirective,
                ngHide: ngHideDirective,
                ngIf: ngIfDirective,
                ngInclude: ngIncludeDirective,
                ngInit: ngInitDirective,
                ngNonBindable: ngNonBindableDirective,
                ngPluralize: ngPluralizeDirective,
                ngRepeat: ngRepeatDirective,
                ngShow: ngShowDirective,
                ngStyle: ngStyleDirective,
                ngSwitch: ngSwitchDirective,
                ngSwitchWhen: ngSwitchWhenDirective,
                ngSwitchDefault: ngSwitchDefaultDirective,
                ngOptions: ngOptionsDirective,
                ngTransclude: ngTranscludeDirective,
                ngModel: ngModelDirective,
                ngList: ngListDirective,
                ngChange: ngChangeDirective,
                required: requiredDirective,
                ngRequired: requiredDirective,
                ngValue: ngValueDirective
            }).directive(ngAttributeAliasDirectives).directive(ngEventDirectives), $provide.provider({
                $anchorScroll: $AnchorScrollProvider,
                $animate: $AnimateProvider,
                $browser: $BrowserProvider,
                $cacheFactory: $CacheFactoryProvider,
                $controller: $ControllerProvider,
                $document: $DocumentProvider,
                $exceptionHandler: $ExceptionHandlerProvider,
                $filter: $FilterProvider,
                $interpolate: $InterpolateProvider,
                $interval: $IntervalProvider,
                $http: $HttpProvider,
                $httpBackend: $HttpBackendProvider,
                $location: $LocationProvider,
                $log: $LogProvider,
                $parse: $ParseProvider,
                $rootScope: $RootScopeProvider,
                $q: $QProvider,
                $sce: $SceProvider,
                $sceDelegate: $SceDelegateProvider,
                $sniffer: $SnifferProvider,
                $templateCache: $TemplateCacheProvider,
                $timeout: $TimeoutProvider,
                $window: $WindowProvider
            });
        } ]);
    }
    function jqNextId() {
        return ++jqId;
    }
    function camelCase(name) {
        return name.replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
            return offset ? letter.toUpperCase() : letter;
        }).replace(MOZ_HACK_REGEXP, "Moz$1");
    }
    function jqLitePatchJQueryRemove(name, dispatchThis, filterElems, getterIfNoArguments) {
        function removePatch(param) {
            var set, setIndex, setLength, element, childIndex, childLength, children, list = filterElems && param ? [ this.filter(param) ] : [ this ], fireEvent = dispatchThis;
            if (!getterIfNoArguments || null != param) for (;list.length; ) for (set = list.shift(), 
            setIndex = 0, setLength = set.length; setLength > setIndex; setIndex++) for (element = jqLite(set[setIndex]), 
            fireEvent ? element.triggerHandler("$destroy") : fireEvent = !fireEvent, childIndex = 0, 
            childLength = (children = element.children()).length; childLength > childIndex; childIndex++) list.push(jQuery(children[childIndex]));
            return originalJqFn.apply(this, arguments);
        }
        var originalJqFn = jQuery.fn[name];
        originalJqFn = originalJqFn.$original || originalJqFn, removePatch.$original = originalJqFn, 
        jQuery.fn[name] = removePatch;
    }
    function JQLite(element) {
        if (element instanceof JQLite) return element;
        if (!(this instanceof JQLite)) {
            if (isString(element) && "<" != element.charAt(0)) throw jqLiteMinErr("nosel", "Looking up elements via selectors is not supported by jqLite! See: http://docs.angularjs.org/api/angular.element");
            return new JQLite(element);
        }
        if (isString(element)) {
            var div = document.createElement("div");
            div.innerHTML = "<div>&#160;</div>" + element, div.removeChild(div.firstChild), 
            jqLiteAddNodes(this, div.childNodes);
            var fragment = jqLite(document.createDocumentFragment());
            fragment.append(this);
        } else jqLiteAddNodes(this, element);
    }
    function jqLiteClone(element) {
        return element.cloneNode(!0);
    }
    function jqLiteDealoc(element) {
        jqLiteRemoveData(element);
        for (var i = 0, children = element.childNodes || []; i < children.length; i++) jqLiteDealoc(children[i]);
    }
    function jqLiteOff(element, type, fn, unsupported) {
        if (isDefined(unsupported)) throw jqLiteMinErr("offargs", "jqLite#off() does not support the `selector` argument");
        var events = jqLiteExpandoStore(element, "events"), handle = jqLiteExpandoStore(element, "handle");
        handle && (isUndefined(type) ? forEach(events, function(eventHandler, type) {
            removeEventListenerFn(element, type, eventHandler), delete events[type];
        }) : forEach(type.split(" "), function(type) {
            isUndefined(fn) ? (removeEventListenerFn(element, type, events[type]), delete events[type]) : arrayRemove(events[type] || [], fn);
        }));
    }
    function jqLiteRemoveData(element, name) {
        var expandoId = element[jqName], expandoStore = jqCache[expandoId];
        if (expandoStore) {
            if (name) return delete jqCache[expandoId].data[name], void 0;
            expandoStore.handle && (expandoStore.events.$destroy && expandoStore.handle({}, "$destroy"), 
            jqLiteOff(element)), delete jqCache[expandoId], element[jqName] = undefined;
        }
    }
    function jqLiteExpandoStore(element, key, value) {
        var expandoId = element[jqName], expandoStore = jqCache[expandoId || -1];
        return isDefined(value) ? (expandoStore || (element[jqName] = expandoId = jqNextId(), 
        expandoStore = jqCache[expandoId] = {}), expandoStore[key] = value, void 0) : expandoStore && expandoStore[key];
    }
    function jqLiteData(element, key, value) {
        var data = jqLiteExpandoStore(element, "data"), isSetter = isDefined(value), keyDefined = !isSetter && isDefined(key), isSimpleGetter = keyDefined && !isObject(key);
        if (data || isSimpleGetter || jqLiteExpandoStore(element, "data", data = {}), isSetter) data[key] = value; else {
            if (!keyDefined) return data;
            if (isSimpleGetter) return data && data[key];
            extend(data, key);
        }
    }
    function jqLiteHasClass(element, selector) {
        return element.getAttribute ? (" " + (element.getAttribute("class") || "") + " ").replace(/[\n\t]/g, " ").indexOf(" " + selector + " ") > -1 : !1;
    }
    function jqLiteRemoveClass(element, cssClasses) {
        cssClasses && element.setAttribute && forEach(cssClasses.split(" "), function(cssClass) {
            element.setAttribute("class", trim((" " + (element.getAttribute("class") || "") + " ").replace(/[\n\t]/g, " ").replace(" " + trim(cssClass) + " ", " ")));
        });
    }
    function jqLiteAddClass(element, cssClasses) {
        if (cssClasses && element.setAttribute) {
            var existingClasses = (" " + (element.getAttribute("class") || "") + " ").replace(/[\n\t]/g, " ");
            forEach(cssClasses.split(" "), function(cssClass) {
                cssClass = trim(cssClass), -1 === existingClasses.indexOf(" " + cssClass + " ") && (existingClasses += cssClass + " ");
            }), element.setAttribute("class", trim(existingClasses));
        }
    }
    function jqLiteAddNodes(root, elements) {
        if (elements) {
            elements = elements.nodeName || !isDefined(elements.length) || isWindow(elements) ? [ elements ] : elements;
            for (var i = 0; i < elements.length; i++) root.push(elements[i]);
        }
    }
    function jqLiteController(element, name) {
        return jqLiteInheritedData(element, "$" + (name || "ngController") + "Controller");
    }
    function jqLiteInheritedData(element, name, value) {
        element = jqLite(element), 9 == element[0].nodeType && (element = element.find("html"));
        for (var names = isArray(name) ? name : [ name ]; element.length; ) {
            for (var i = 0, ii = names.length; ii > i; i++) if ((value = element.data(names[i])) !== undefined) return value;
            element = element.parent();
        }
    }
    function getBooleanAttrName(element, name) {
        var booleanAttr = BOOLEAN_ATTR[name.toLowerCase()];
        return booleanAttr && BOOLEAN_ELEMENTS[element.nodeName] && booleanAttr;
    }
    function createEventHandler(element, events) {
        var eventHandler = function(event, type) {
            if (event.preventDefault || (event.preventDefault = function() {
                event.returnValue = !1;
            }), event.stopPropagation || (event.stopPropagation = function() {
                event.cancelBubble = !0;
            }), event.target || (event.target = event.srcElement || document), isUndefined(event.defaultPrevented)) {
                var prevent = event.preventDefault;
                event.preventDefault = function() {
                    event.defaultPrevented = !0, prevent.call(event);
                }, event.defaultPrevented = !1;
            }
            event.isDefaultPrevented = function() {
                return event.defaultPrevented || event.returnValue === !1;
            }, forEach(events[type || event.type], function(fn) {
                fn.call(element, event);
            }), 8 >= msie ? (event.preventDefault = null, event.stopPropagation = null, event.isDefaultPrevented = null) : (delete event.preventDefault, 
            delete event.stopPropagation, delete event.isDefaultPrevented);
        };
        return eventHandler.elem = element, eventHandler;
    }
    function hashKey(obj) {
        var key, objType = typeof obj;
        return "object" == objType && null !== obj ? "function" == typeof (key = obj.$$hashKey) ? key = obj.$$hashKey() : key === undefined && (key = obj.$$hashKey = nextUid()) : key = obj, 
        objType + ":" + key;
    }
    function HashMap(array) {
        forEach(array, this.put, this);
    }
    function annotate(fn) {
        var $inject, fnText, argDecl, last;
        return "function" == typeof fn ? ($inject = fn.$inject) || ($inject = [], fn.length && (fnText = fn.toString().replace(STRIP_COMMENTS, ""), 
        argDecl = fnText.match(FN_ARGS), forEach(argDecl[1].split(FN_ARG_SPLIT), function(arg) {
            arg.replace(FN_ARG, function(all, underscore, name) {
                $inject.push(name);
            });
        })), fn.$inject = $inject) : isArray(fn) ? (last = fn.length - 1, assertArgFn(fn[last], "fn"), 
        $inject = fn.slice(0, last)) : assertArgFn(fn, "fn", !0), $inject;
    }
    function createInjector(modulesToLoad) {
        function supportObject(delegate) {
            return function(key, value) {
                return isObject(key) ? (forEach(key, reverseParams(delegate)), void 0) : delegate(key, value);
            };
        }
        function provider(name, provider_) {
            if (assertNotHasOwnProperty(name, "service"), (isFunction(provider_) || isArray(provider_)) && (provider_ = providerInjector.instantiate(provider_)), 
            !provider_.$get) throw $injectorMinErr("pget", "Provider '{0}' must define $get factory method.", name);
            return providerCache[name + providerSuffix] = provider_;
        }
        function factory(name, factoryFn) {
            return provider(name, {
                $get: factoryFn
            });
        }
        function service(name, constructor) {
            return factory(name, [ "$injector", function($injector) {
                return $injector.instantiate(constructor);
            } ]);
        }
        function value(name, val) {
            return factory(name, valueFn(val));
        }
        function constant(name, value) {
            assertNotHasOwnProperty(name, "constant"), providerCache[name] = value, instanceCache[name] = value;
        }
        function decorator(serviceName, decorFn) {
            var origProvider = providerInjector.get(serviceName + providerSuffix), orig$get = origProvider.$get;
            origProvider.$get = function() {
                var origInstance = instanceInjector.invoke(orig$get, origProvider);
                return instanceInjector.invoke(decorFn, null, {
                    $delegate: origInstance
                });
            };
        }
        function loadModules(modulesToLoad) {
            var moduleFn, invokeQueue, i, ii, runBlocks = [];
            return forEach(modulesToLoad, function(module) {
                if (!loadedModules.get(module)) {
                    loadedModules.put(module, !0);
                    try {
                        if (isString(module)) for (moduleFn = angularModule(module), runBlocks = runBlocks.concat(loadModules(moduleFn.requires)).concat(moduleFn._runBlocks), 
                        invokeQueue = moduleFn._invokeQueue, i = 0, ii = invokeQueue.length; ii > i; i++) {
                            var invokeArgs = invokeQueue[i], provider = providerInjector.get(invokeArgs[0]);
                            provider[invokeArgs[1]].apply(provider, invokeArgs[2]);
                        } else isFunction(module) ? runBlocks.push(providerInjector.invoke(module)) : isArray(module) ? runBlocks.push(providerInjector.invoke(module)) : assertArgFn(module, "module");
                    } catch (e) {
                        throw isArray(module) && (module = module[module.length - 1]), e.message && e.stack && -1 == e.stack.indexOf(e.message) && (e = e.message + "\n" + e.stack), 
                        $injectorMinErr("modulerr", "Failed to instantiate module {0} due to:\n{1}", module, e.stack || e.message || e);
                    }
                }
            }), runBlocks;
        }
        function createInternalInjector(cache, factory) {
            function getService(serviceName) {
                if (cache.hasOwnProperty(serviceName)) {
                    if (cache[serviceName] === INSTANTIATING) throw $injectorMinErr("cdep", "Circular dependency found: {0}", path.join(" <- "));
                    return cache[serviceName];
                }
                try {
                    return path.unshift(serviceName), cache[serviceName] = INSTANTIATING, cache[serviceName] = factory(serviceName);
                } finally {
                    path.shift();
                }
            }
            function invoke(fn, self, locals) {
                var length, i, key, args = [], $inject = annotate(fn);
                for (i = 0, length = $inject.length; length > i; i++) {
                    if (key = $inject[i], "string" != typeof key) throw $injectorMinErr("itkn", "Incorrect injection token! Expected service name as string, got {0}", key);
                    args.push(locals && locals.hasOwnProperty(key) ? locals[key] : getService(key));
                }
                switch (fn.$inject || (fn = fn[length]), self ? -1 : args.length) {
                  case 0:
                    return fn();

                  case 1:
                    return fn(args[0]);

                  case 2:
                    return fn(args[0], args[1]);

                  case 3:
                    return fn(args[0], args[1], args[2]);

                  case 4:
                    return fn(args[0], args[1], args[2], args[3]);

                  case 5:
                    return fn(args[0], args[1], args[2], args[3], args[4]);

                  case 6:
                    return fn(args[0], args[1], args[2], args[3], args[4], args[5]);

                  case 7:
                    return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);

                  case 8:
                    return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);

                  case 9:
                    return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);

                  case 10:
                    return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);

                  default:
                    return fn.apply(self, args);
                }
            }
            function instantiate(Type, locals) {
                var instance, returnedValue, Constructor = function() {};
                return Constructor.prototype = (isArray(Type) ? Type[Type.length - 1] : Type).prototype, 
                instance = new Constructor(), returnedValue = invoke(Type, instance, locals), isObject(returnedValue) || isFunction(returnedValue) ? returnedValue : instance;
            }
            return {
                invoke: invoke,
                instantiate: instantiate,
                get: getService,
                annotate: annotate,
                has: function(name) {
                    return providerCache.hasOwnProperty(name + providerSuffix) || cache.hasOwnProperty(name);
                }
            };
        }
        var INSTANTIATING = {}, providerSuffix = "Provider", path = [], loadedModules = new HashMap(), providerCache = {
            $provide: {
                provider: supportObject(provider),
                factory: supportObject(factory),
                service: supportObject(service),
                value: supportObject(value),
                constant: supportObject(constant),
                decorator: decorator
            }
        }, providerInjector = providerCache.$injector = createInternalInjector(providerCache, function() {
            throw $injectorMinErr("unpr", "Unknown provider: {0}", path.join(" <- "));
        }), instanceCache = {}, instanceInjector = instanceCache.$injector = createInternalInjector(instanceCache, function(servicename) {
            var provider = providerInjector.get(servicename + providerSuffix);
            return instanceInjector.invoke(provider.$get, provider);
        });
        return forEach(loadModules(modulesToLoad), function(fn) {
            instanceInjector.invoke(fn || noop);
        }), instanceInjector;
    }
    function $AnchorScrollProvider() {
        var autoScrollingEnabled = !0;
        this.disableAutoScrolling = function() {
            autoScrollingEnabled = !1;
        }, this.$get = [ "$window", "$location", "$rootScope", function($window, $location, $rootScope) {
            function getFirstAnchor(list) {
                var result = null;
                return forEach(list, function(element) {
                    result || "a" !== lowercase(element.nodeName) || (result = element);
                }), result;
            }
            function scroll() {
                var elm, hash = $location.hash();
                hash ? (elm = document.getElementById(hash)) ? elm.scrollIntoView() : (elm = getFirstAnchor(document.getElementsByName(hash))) ? elm.scrollIntoView() : "top" === hash && $window.scrollTo(0, 0) : $window.scrollTo(0, 0);
            }
            var document = $window.document;
            return autoScrollingEnabled && $rootScope.$watch(function() {
                return $location.hash();
            }, function() {
                $rootScope.$evalAsync(scroll);
            }), scroll;
        } ];
    }
    function Browser(window, document, $log, $sniffer) {
        function completeOutstandingRequest(fn) {
            try {
                fn.apply(null, sliceArgs(arguments, 1));
            } finally {
                if (outstandingRequestCount--, 0 === outstandingRequestCount) for (;outstandingRequestCallbacks.length; ) try {
                    outstandingRequestCallbacks.pop()();
                } catch (e) {
                    $log.error(e);
                }
            }
        }
        function startPoller(interval, setTimeout) {
            !function check() {
                forEach(pollFns, function(pollFn) {
                    pollFn();
                }), pollTimeout = setTimeout(check, interval);
            }();
        }
        function fireUrlChange() {
            newLocation = null, lastBrowserUrl != self.url() && (lastBrowserUrl = self.url(), 
            forEach(urlChangeListeners, function(listener) {
                listener(self.url());
            }));
        }
        var self = this, rawDocument = document[0], location = window.location, history = window.history, setTimeout = window.setTimeout, clearTimeout = window.clearTimeout, pendingDeferIds = {};
        self.isMock = !1;
        var outstandingRequestCount = 0, outstandingRequestCallbacks = [];
        self.$$completeOutstandingRequest = completeOutstandingRequest, self.$$incOutstandingRequestCount = function() {
            outstandingRequestCount++;
        }, self.notifyWhenNoOutstandingRequests = function(callback) {
            forEach(pollFns, function(pollFn) {
                pollFn();
            }), 0 === outstandingRequestCount ? callback() : outstandingRequestCallbacks.push(callback);
        };
        var pollTimeout, pollFns = [];
        self.addPollFn = function(fn) {
            return isUndefined(pollTimeout) && startPoller(100, setTimeout), pollFns.push(fn), 
            fn;
        };
        var lastBrowserUrl = location.href, baseElement = document.find("base"), newLocation = null;
        self.url = function(url, replace) {
            if (location !== window.location && (location = window.location), url) {
                if (lastBrowserUrl == url) return;
                return lastBrowserUrl = url, $sniffer.history ? replace ? history.replaceState(null, "", url) : (history.pushState(null, "", url), 
                baseElement.attr("href", baseElement.attr("href"))) : (newLocation = url, replace ? location.replace(url) : location.href = url), 
                self;
            }
            return newLocation || location.href.replace(/%27/g, "'");
        };
        var urlChangeListeners = [], urlChangeInit = !1;
        self.onUrlChange = function(callback) {
            return urlChangeInit || ($sniffer.history && jqLite(window).on("popstate", fireUrlChange), 
            $sniffer.hashchange ? jqLite(window).on("hashchange", fireUrlChange) : self.addPollFn(fireUrlChange), 
            urlChangeInit = !0), urlChangeListeners.push(callback), callback;
        }, self.baseHref = function() {
            var href = baseElement.attr("href");
            return href ? href.replace(/^https?\:\/\/[^\/]*/, "") : "";
        };
        var lastCookies = {}, lastCookieString = "", cookiePath = self.baseHref();
        self.cookies = function(name, value) {
            var cookieLength, cookieArray, cookie, i, index;
            if (!name) {
                if (rawDocument.cookie !== lastCookieString) for (lastCookieString = rawDocument.cookie, 
                cookieArray = lastCookieString.split("; "), lastCookies = {}, i = 0; i < cookieArray.length; i++) cookie = cookieArray[i], 
                index = cookie.indexOf("="), index > 0 && (name = unescape(cookie.substring(0, index)), 
                lastCookies[name] === undefined && (lastCookies[name] = unescape(cookie.substring(index + 1))));
                return lastCookies;
            }
            value === undefined ? rawDocument.cookie = escape(name) + "=;path=" + cookiePath + ";expires=Thu, 01 Jan 1970 00:00:00 GMT" : isString(value) && (cookieLength = (rawDocument.cookie = escape(name) + "=" + escape(value) + ";path=" + cookiePath).length + 1, 
            cookieLength > 4096 && $log.warn("Cookie '" + name + "' possibly not set or overflowed because it was too large (" + cookieLength + " > 4096 bytes)!"));
        }, self.defer = function(fn, delay) {
            var timeoutId;
            return outstandingRequestCount++, timeoutId = setTimeout(function() {
                delete pendingDeferIds[timeoutId], completeOutstandingRequest(fn);
            }, delay || 0), pendingDeferIds[timeoutId] = !0, timeoutId;
        }, self.defer.cancel = function(deferId) {
            return pendingDeferIds[deferId] ? (delete pendingDeferIds[deferId], clearTimeout(deferId), 
            completeOutstandingRequest(noop), !0) : !1;
        };
    }
    function $BrowserProvider() {
        this.$get = [ "$window", "$log", "$sniffer", "$document", function($window, $log, $sniffer, $document) {
            return new Browser($window, $document, $log, $sniffer);
        } ];
    }
    function $CacheFactoryProvider() {
        this.$get = function() {
            function cacheFactory(cacheId, options) {
                function refresh(entry) {
                    entry != freshEnd && (staleEnd ? staleEnd == entry && (staleEnd = entry.n) : staleEnd = entry, 
                    link(entry.n, entry.p), link(entry, freshEnd), freshEnd = entry, freshEnd.n = null);
                }
                function link(nextEntry, prevEntry) {
                    nextEntry != prevEntry && (nextEntry && (nextEntry.p = prevEntry), prevEntry && (prevEntry.n = nextEntry));
                }
                if (cacheId in caches) throw minErr("$cacheFactory")("iid", "CacheId '{0}' is already taken!", cacheId);
                var size = 0, stats = extend({}, options, {
                    id: cacheId
                }), data = {}, capacity = options && options.capacity || Number.MAX_VALUE, lruHash = {}, freshEnd = null, staleEnd = null;
                return caches[cacheId] = {
                    put: function(key, value) {
                        var lruEntry = lruHash[key] || (lruHash[key] = {
                            key: key
                        });
                        return refresh(lruEntry), isUndefined(value) ? void 0 : (key in data || size++, 
                        data[key] = value, size > capacity && this.remove(staleEnd.key), value);
                    },
                    get: function(key) {
                        var lruEntry = lruHash[key];
                        if (lruEntry) return refresh(lruEntry), data[key];
                    },
                    remove: function(key) {
                        var lruEntry = lruHash[key];
                        lruEntry && (lruEntry == freshEnd && (freshEnd = lruEntry.p), lruEntry == staleEnd && (staleEnd = lruEntry.n), 
                        link(lruEntry.n, lruEntry.p), delete lruHash[key], delete data[key], size--);
                    },
                    removeAll: function() {
                        data = {}, size = 0, lruHash = {}, freshEnd = staleEnd = null;
                    },
                    destroy: function() {
                        data = null, stats = null, lruHash = null, delete caches[cacheId];
                    },
                    info: function() {
                        return extend({}, stats, {
                            size: size
                        });
                    }
                };
            }
            var caches = {};
            return cacheFactory.info = function() {
                var info = {};
                return forEach(caches, function(cache, cacheId) {
                    info[cacheId] = cache.info();
                }), info;
            }, cacheFactory.get = function(cacheId) {
                return caches[cacheId];
            }, cacheFactory;
        };
    }
    function $TemplateCacheProvider() {
        this.$get = [ "$cacheFactory", function($cacheFactory) {
            return $cacheFactory("templates");
        } ];
    }
    function $CompileProvider($provide) {
        var hasDirectives = {}, Suffix = "Directive", COMMENT_DIRECTIVE_REGEXP = /^\s*directive\:\s*([\d\w\-_]+)\s+(.*)$/, CLASS_DIRECTIVE_REGEXP = /(([\d\w\-_]+)(?:\:([^;]+))?;?)/, aHrefSanitizationWhitelist = /^\s*(https?|ftp|mailto|tel|file):/, imgSrcSanitizationWhitelist = /^\s*(https?|ftp|file):|data:image\//, EVENT_HANDLER_ATTR_REGEXP = /^(on[a-z]+|formaction)$/;
        this.directive = function registerDirective(name, directiveFactory) {
            return assertNotHasOwnProperty(name, "directive"), isString(name) ? (assertArg(directiveFactory, "directiveFactory"), 
            hasDirectives.hasOwnProperty(name) || (hasDirectives[name] = [], $provide.factory(name + Suffix, [ "$injector", "$exceptionHandler", function($injector, $exceptionHandler) {
                var directives = [];
                return forEach(hasDirectives[name], function(directiveFactory, index) {
                    try {
                        var directive = $injector.invoke(directiveFactory);
                        isFunction(directive) ? directive = {
                            compile: valueFn(directive)
                        } : !directive.compile && directive.link && (directive.compile = valueFn(directive.link)), 
                        directive.priority = directive.priority || 0, directive.index = index, directive.name = directive.name || name, 
                        directive.require = directive.require || directive.controller && directive.name, 
                        directive.restrict = directive.restrict || "A", directives.push(directive);
                    } catch (e) {
                        $exceptionHandler(e);
                    }
                }), directives;
            } ])), hasDirectives[name].push(directiveFactory)) : forEach(name, reverseParams(registerDirective)), 
            this;
        }, this.aHrefSanitizationWhitelist = function(regexp) {
            return isDefined(regexp) ? (aHrefSanitizationWhitelist = regexp, this) : aHrefSanitizationWhitelist;
        }, this.imgSrcSanitizationWhitelist = function(regexp) {
            return isDefined(regexp) ? (imgSrcSanitizationWhitelist = regexp, this) : imgSrcSanitizationWhitelist;
        }, this.$get = [ "$injector", "$interpolate", "$exceptionHandler", "$http", "$templateCache", "$parse", "$controller", "$rootScope", "$document", "$sce", "$animate", function($injector, $interpolate, $exceptionHandler, $http, $templateCache, $parse, $controller, $rootScope, $document, $sce, $animate) {
            function compile($compileNodes, transcludeFn, maxPriority, ignoreDirective, previousCompileContext) {
                $compileNodes instanceof jqLite || ($compileNodes = jqLite($compileNodes)), forEach($compileNodes, function(node, index) {
                    3 == node.nodeType && node.nodeValue.match(/\S+/) && ($compileNodes[index] = node = jqLite(node).wrap("<span></span>").parent()[0]);
                });
                var compositeLinkFn = compileNodes($compileNodes, transcludeFn, $compileNodes, maxPriority, ignoreDirective, previousCompileContext);
                return function(scope, cloneConnectFn) {
                    assertArg(scope, "scope");
                    for (var $linkNode = cloneConnectFn ? JQLitePrototype.clone.call($compileNodes) : $compileNodes, i = 0, ii = $linkNode.length; ii > i; i++) {
                        var node = $linkNode[i];
                        (1 == node.nodeType || 9 == node.nodeType) && $linkNode.eq(i).data("$scope", scope);
                    }
                    return safeAddClass($linkNode, "ng-scope"), cloneConnectFn && cloneConnectFn($linkNode, scope), 
                    compositeLinkFn && compositeLinkFn(scope, $linkNode, $linkNode), $linkNode;
                };
            }
            function safeAddClass($element, className) {
                try {
                    $element.addClass(className);
                } catch (e) {}
            }
            function compileNodes(nodeList, transcludeFn, $rootElement, maxPriority, ignoreDirective, previousCompileContext) {
                function compositeLinkFn(scope, nodeList, $rootElement, boundTranscludeFn) {
                    var nodeLinkFn, childLinkFn, node, $node, childScope, childTranscludeFn, i, ii, n, stableNodeList = [];
                    for (i = 0, ii = nodeList.length; ii > i; i++) stableNodeList.push(nodeList[i]);
                    for (i = 0, n = 0, ii = linkFns.length; ii > i; n++) node = stableNodeList[n], nodeLinkFn = linkFns[i++], 
                    childLinkFn = linkFns[i++], $node = jqLite(node), nodeLinkFn ? (nodeLinkFn.scope ? (childScope = scope.$new(), 
                    $node.data("$scope", childScope), safeAddClass($node, "ng-scope")) : childScope = scope, 
                    childTranscludeFn = nodeLinkFn.transclude, childTranscludeFn || !boundTranscludeFn && transcludeFn ? nodeLinkFn(childLinkFn, childScope, node, $rootElement, function(transcludeFn) {
                        return function(cloneFn) {
                            var transcludeScope = scope.$new();
                            return transcludeScope.$$transcluded = !0, transcludeFn(transcludeScope, cloneFn).on("$destroy", bind(transcludeScope, transcludeScope.$destroy));
                        };
                    }(childTranscludeFn || transcludeFn)) : nodeLinkFn(childLinkFn, childScope, node, undefined, boundTranscludeFn)) : childLinkFn && childLinkFn(scope, node.childNodes, undefined, boundTranscludeFn);
                }
                for (var nodeLinkFn, childLinkFn, directives, attrs, linkFnFound, linkFns = [], i = 0; i < nodeList.length; i++) attrs = new Attributes(), 
                directives = collectDirectives(nodeList[i], [], attrs, 0 === i ? maxPriority : undefined, ignoreDirective), 
                nodeLinkFn = directives.length ? applyDirectivesToNode(directives, nodeList[i], attrs, transcludeFn, $rootElement, null, [], [], previousCompileContext) : null, 
                childLinkFn = nodeLinkFn && nodeLinkFn.terminal || !nodeList[i].childNodes || !nodeList[i].childNodes.length ? null : compileNodes(nodeList[i].childNodes, nodeLinkFn ? nodeLinkFn.transclude : transcludeFn), 
                linkFns.push(nodeLinkFn), linkFns.push(childLinkFn), linkFnFound = linkFnFound || nodeLinkFn || childLinkFn, 
                previousCompileContext = null;
                return linkFnFound ? compositeLinkFn : null;
            }
            function collectDirectives(node, directives, attrs, maxPriority, ignoreDirective) {
                var match, className, nodeType = node.nodeType, attrsMap = attrs.$attr;
                switch (nodeType) {
                  case 1:
                    addDirective(directives, directiveNormalize(nodeName_(node).toLowerCase()), "E", maxPriority, ignoreDirective);
                    for (var attr, name, nName, ngAttrName, value, nAttrs = node.attributes, j = 0, jj = nAttrs && nAttrs.length; jj > j; j++) {
                        var attrStartName = !1, attrEndName = !1;
                        if (attr = nAttrs[j], !msie || msie >= 8 || attr.specified) {
                            name = attr.name, ngAttrName = directiveNormalize(name), NG_ATTR_BINDING.test(ngAttrName) && (name = snake_case(ngAttrName.substr(6), "-"));
                            var directiveNName = ngAttrName.replace(/(Start|End)$/, "");
                            ngAttrName === directiveNName + "Start" && (attrStartName = name, attrEndName = name.substr(0, name.length - 5) + "end", 
                            name = name.substr(0, name.length - 6)), nName = directiveNormalize(name.toLowerCase()), 
                            attrsMap[nName] = name, attrs[nName] = value = trim(msie && "href" == name ? decodeURIComponent(node.getAttribute(name, 2)) : attr.value), 
                            getBooleanAttrName(node, nName) && (attrs[nName] = !0), addAttrInterpolateDirective(node, directives, value, nName), 
                            addDirective(directives, nName, "A", maxPriority, ignoreDirective, attrStartName, attrEndName);
                        }
                    }
                    if (className = node.className, isString(className) && "" !== className) for (;match = CLASS_DIRECTIVE_REGEXP.exec(className); ) nName = directiveNormalize(match[2]), 
                    addDirective(directives, nName, "C", maxPriority, ignoreDirective) && (attrs[nName] = trim(match[3])), 
                    className = className.substr(match.index + match[0].length);
                    break;

                  case 3:
                    addTextInterpolateDirective(directives, node.nodeValue);
                    break;

                  case 8:
                    try {
                        match = COMMENT_DIRECTIVE_REGEXP.exec(node.nodeValue), match && (nName = directiveNormalize(match[1]), 
                        addDirective(directives, nName, "M", maxPriority, ignoreDirective) && (attrs[nName] = trim(match[2])));
                    } catch (e) {}
                }
                return directives.sort(byPriority), directives;
            }
            function groupScan(node, attrStart, attrEnd) {
                var nodes = [], depth = 0;
                if (attrStart && node.hasAttribute && node.hasAttribute(attrStart)) {
                    do {
                        if (!node) throw $compileMinErr("uterdir", "Unterminated attribute, found '{0}' but no matching '{1}' found.", attrStart, attrEnd);
                        1 == node.nodeType && (node.hasAttribute(attrStart) && depth++, node.hasAttribute(attrEnd) && depth--), 
                        nodes.push(node), node = node.nextSibling;
                    } while (depth > 0);
                } else nodes.push(node);
                return jqLite(nodes);
            }
            function groupElementsLinkFnWrapper(linkFn, attrStart, attrEnd) {
                return function(scope, element, attrs, controllers) {
                    return element = groupScan(element[0], attrStart, attrEnd), linkFn(scope, element, attrs, controllers);
                };
            }
            function applyDirectivesToNode(directives, compileNode, templateAttrs, transcludeFn, jqCollection, originalReplaceDirective, preLinkFns, postLinkFns, previousCompileContext) {
                function addLinkFns(pre, post, attrStart, attrEnd) {
                    pre && (attrStart && (pre = groupElementsLinkFnWrapper(pre, attrStart, attrEnd)), 
                    pre.require = directive.require, (newIsolateScopeDirective === directive || directive.$$isolateScope) && (pre = cloneAndAnnotateFn(pre, {
                        isolateScope: !0
                    })), preLinkFns.push(pre)), post && (attrStart && (post = groupElementsLinkFnWrapper(post, attrStart, attrEnd)), 
                    post.require = directive.require, (newIsolateScopeDirective === directive || directive.$$isolateScope) && (post = cloneAndAnnotateFn(post, {
                        isolateScope: !0
                    })), postLinkFns.push(post));
                }
                function getControllers(require, $element) {
                    var value, retrievalMethod = "data", optional = !1;
                    if (isString(require)) {
                        for (;"^" == (value = require.charAt(0)) || "?" == value; ) require = require.substr(1), 
                        "^" == value && (retrievalMethod = "inheritedData"), optional = optional || "?" == value;
                        if (value = $element[retrievalMethod]("$" + require + "Controller"), 8 == $element[0].nodeType && $element[0].$$controller && (value = value || $element[0].$$controller, 
                        $element[0].$$controller = null), !value && !optional) throw $compileMinErr("ctreq", "Controller '{0}', required by directive '{1}', can't be found!", require, directiveName);
                        return value;
                    }
                    return isArray(require) && (value = [], forEach(require, function(require) {
                        value.push(getControllers(require, $element));
                    })), value;
                }
                function nodeLinkFn(childLinkFn, scope, linkNode, $rootElement, boundTranscludeFn) {
                    var attrs, $element, i, ii, linkFn, controller, isolateScope;
                    if (attrs = compileNode === linkNode ? templateAttrs : shallowCopy(templateAttrs, new Attributes(jqLite(linkNode), templateAttrs.$attr)), 
                    $element = attrs.$$element, newIsolateScopeDirective) {
                        var LOCAL_REGEXP = /^\s*([@=&])(\??)\s*(\w*)\s*$/, $linkNode = jqLite(linkNode);
                        isolateScope = scope.$new(!0), templateDirective && templateDirective === newIsolateScopeDirective.$$originalDirective ? $linkNode.data("$isolateScope", isolateScope) : $linkNode.data("$isolateScopeNoTemplate", isolateScope), 
                        safeAddClass($linkNode, "ng-isolate-scope"), forEach(newIsolateScopeDirective.scope, function(definition, scopeName) {
                            var lastValue, parentGet, parentSet, match = definition.match(LOCAL_REGEXP) || [], attrName = match[3] || scopeName, optional = "?" == match[2], mode = match[1];
                            switch (isolateScope.$$isolateBindings[scopeName] = mode + attrName, mode) {
                              case "@":
                                attrs.$observe(attrName, function(value) {
                                    isolateScope[scopeName] = value;
                                }), attrs.$$observers[attrName].$$scope = scope, attrs[attrName] && (isolateScope[scopeName] = $interpolate(attrs[attrName])(scope));
                                break;

                              case "=":
                                if (optional && !attrs[attrName]) return;
                                parentGet = $parse(attrs[attrName]), parentSet = parentGet.assign || function() {
                                    throw lastValue = isolateScope[scopeName] = parentGet(scope), $compileMinErr("nonassign", "Expression '{0}' used with directive '{1}' is non-assignable!", attrs[attrName], newIsolateScopeDirective.name);
                                }, lastValue = isolateScope[scopeName] = parentGet(scope), isolateScope.$watch(function() {
                                    var parentValue = parentGet(scope);
                                    return parentValue !== isolateScope[scopeName] && (parentValue !== lastValue ? lastValue = isolateScope[scopeName] = parentValue : parentSet(scope, parentValue = lastValue = isolateScope[scopeName])), 
                                    parentValue;
                                });
                                break;

                              case "&":
                                parentGet = $parse(attrs[attrName]), isolateScope[scopeName] = function(locals) {
                                    return parentGet(scope, locals);
                                };
                                break;

                              default:
                                throw $compileMinErr("iscp", "Invalid isolate scope definition for directive '{0}'. Definition: {... {1}: '{2}' ...}", newIsolateScopeDirective.name, scopeName, definition);
                            }
                        });
                    }
                    for (controllerDirectives && forEach(controllerDirectives, function(directive) {
                        var controllerInstance, locals = {
                            $scope: directive === newIsolateScopeDirective || directive.$$isolateScope ? isolateScope : scope,
                            $element: $element,
                            $attrs: attrs,
                            $transclude: boundTranscludeFn
                        };
                        controller = directive.controller, "@" == controller && (controller = attrs[directive.name]), 
                        controllerInstance = $controller(controller, locals), 8 == $element[0].nodeType ? $element[0].$$controller = controllerInstance : $element.data("$" + directive.name + "Controller", controllerInstance), 
                        directive.controllerAs && (locals.$scope[directive.controllerAs] = controllerInstance);
                    }), i = 0, ii = preLinkFns.length; ii > i; i++) try {
                        linkFn = preLinkFns[i], linkFn(linkFn.isolateScope ? isolateScope : scope, $element, attrs, linkFn.require && getControllers(linkFn.require, $element));
                    } catch (e) {
                        $exceptionHandler(e, startingTag($element));
                    }
                    var scopeToChild = scope;
                    for (newIsolateScopeDirective && (newIsolateScopeDirective.template || null === newIsolateScopeDirective.templateUrl) && (scopeToChild = isolateScope), 
                    childLinkFn && childLinkFn(scopeToChild, linkNode.childNodes, undefined, boundTranscludeFn), 
                    i = postLinkFns.length - 1; i >= 0; i--) try {
                        linkFn = postLinkFns[i], linkFn(linkFn.isolateScope ? isolateScope : scope, $element, attrs, linkFn.require && getControllers(linkFn.require, $element));
                    } catch (e) {
                        $exceptionHandler(e, startingTag($element));
                    }
                }
                previousCompileContext = previousCompileContext || {};
                for (var newScopeDirective, directive, directiveName, $template, linkFn, directiveValue, terminalPriority = -Number.MAX_VALUE, controllerDirectives = previousCompileContext.controllerDirectives, newIsolateScopeDirective = previousCompileContext.newIsolateScopeDirective, templateDirective = previousCompileContext.templateDirective, transcludeDirective = previousCompileContext.transcludeDirective, $compileNode = templateAttrs.$$element = jqLite(compileNode), replaceDirective = originalReplaceDirective, childTranscludeFn = transcludeFn, i = 0, ii = directives.length; ii > i; i++) {
                    directive = directives[i];
                    var attrStart = directive.$$start, attrEnd = directive.$$end;
                    if (attrStart && ($compileNode = groupScan(compileNode, attrStart, attrEnd)), $template = undefined, 
                    terminalPriority > directive.priority) break;
                    if ((directiveValue = directive.scope) && (newScopeDirective = newScopeDirective || directive, 
                    directive.templateUrl || (assertNoDuplicate("new/isolated scope", newIsolateScopeDirective, directive, $compileNode), 
                    isObject(directiveValue) && (newIsolateScopeDirective = directive))), directiveName = directive.name, 
                    !directive.templateUrl && directive.controller && (directiveValue = directive.controller, 
                    controllerDirectives = controllerDirectives || {}, assertNoDuplicate("'" + directiveName + "' controller", controllerDirectives[directiveName], directive, $compileNode), 
                    controllerDirectives[directiveName] = directive), (directiveValue = directive.transclude) && (directive.$$tlb || (assertNoDuplicate("transclusion", transcludeDirective, directive, $compileNode), 
                    transcludeDirective = directive), "element" == directiveValue ? (terminalPriority = directive.priority, 
                    $template = groupScan(compileNode, attrStart, attrEnd), $compileNode = templateAttrs.$$element = jqLite(document.createComment(" " + directiveName + ": " + templateAttrs[directiveName] + " ")), 
                    compileNode = $compileNode[0], replaceWith(jqCollection, jqLite(sliceArgs($template)), compileNode), 
                    childTranscludeFn = compile($template, transcludeFn, terminalPriority, replaceDirective && replaceDirective.name, {
                        transcludeDirective: transcludeDirective
                    })) : ($template = jqLite(jqLiteClone(compileNode)).contents(), $compileNode.html(""), 
                    childTranscludeFn = compile($template, transcludeFn))), directive.template) if (assertNoDuplicate("template", templateDirective, directive, $compileNode), 
                    templateDirective = directive, directiveValue = isFunction(directive.template) ? directive.template($compileNode, templateAttrs) : directive.template, 
                    directiveValue = denormalizeTemplate(directiveValue), directive.replace) {
                        if (replaceDirective = directive, $template = jqLite("<div>" + trim(directiveValue) + "</div>").contents(), 
                        compileNode = $template[0], 1 != $template.length || 1 !== compileNode.nodeType) throw $compileMinErr("tplrt", "Template for directive '{0}' must have exactly one root element. {1}", directiveName, "");
                        replaceWith(jqCollection, $compileNode, compileNode);
                        var newTemplateAttrs = {
                            $attr: {}
                        }, templateDirectives = collectDirectives(compileNode, [], newTemplateAttrs), unprocessedDirectives = directives.splice(i + 1, directives.length - (i + 1));
                        newIsolateScopeDirective && markDirectivesAsIsolate(templateDirectives), directives = directives.concat(templateDirectives).concat(unprocessedDirectives), 
                        mergeTemplateAttributes(templateAttrs, newTemplateAttrs), ii = directives.length;
                    } else $compileNode.html(directiveValue);
                    if (directive.templateUrl) assertNoDuplicate("template", templateDirective, directive, $compileNode), 
                    templateDirective = directive, directive.replace && (replaceDirective = directive), 
                    nodeLinkFn = compileTemplateUrl(directives.splice(i, directives.length - i), $compileNode, templateAttrs, jqCollection, childTranscludeFn, preLinkFns, postLinkFns, {
                        controllerDirectives: controllerDirectives,
                        newIsolateScopeDirective: newIsolateScopeDirective,
                        templateDirective: templateDirective,
                        transcludeDirective: transcludeDirective
                    }), ii = directives.length; else if (directive.compile) try {
                        linkFn = directive.compile($compileNode, templateAttrs, childTranscludeFn), isFunction(linkFn) ? addLinkFns(null, linkFn, attrStart, attrEnd) : linkFn && addLinkFns(linkFn.pre, linkFn.post, attrStart, attrEnd);
                    } catch (e) {
                        $exceptionHandler(e, startingTag($compileNode));
                    }
                    directive.terminal && (nodeLinkFn.terminal = !0, terminalPriority = Math.max(terminalPriority, directive.priority));
                }
                return nodeLinkFn.scope = newScopeDirective && newScopeDirective.scope === !0, nodeLinkFn.transclude = transcludeDirective && childTranscludeFn, 
                nodeLinkFn;
            }
            function markDirectivesAsIsolate(directives) {
                for (var j = 0, jj = directives.length; jj > j; j++) directives[j] = inherit(directives[j], {
                    $$isolateScope: !0
                });
            }
            function addDirective(tDirectives, name, location, maxPriority, ignoreDirective, startAttrName, endAttrName) {
                if (name === ignoreDirective) return null;
                var match = null;
                if (hasDirectives.hasOwnProperty(name)) for (var directive, directives = $injector.get(name + Suffix), i = 0, ii = directives.length; ii > i; i++) try {
                    directive = directives[i], (maxPriority === undefined || maxPriority > directive.priority) && -1 != directive.restrict.indexOf(location) && (startAttrName && (directive = inherit(directive, {
                        $$start: startAttrName,
                        $$end: endAttrName
                    })), tDirectives.push(directive), match = directive);
                } catch (e) {
                    $exceptionHandler(e);
                }
                return match;
            }
            function mergeTemplateAttributes(dst, src) {
                var srcAttr = src.$attr, dstAttr = dst.$attr, $element = dst.$$element;
                forEach(dst, function(value, key) {
                    "$" != key.charAt(0) && (src[key] && (value += ("style" === key ? ";" : " ") + src[key]), 
                    dst.$set(key, value, !0, srcAttr[key]));
                }), forEach(src, function(value, key) {
                    "class" == key ? (safeAddClass($element, value), dst["class"] = (dst["class"] ? dst["class"] + " " : "") + value) : "style" == key ? $element.attr("style", $element.attr("style") + ";" + value) : "$" == key.charAt(0) || dst.hasOwnProperty(key) || (dst[key] = value, 
                    dstAttr[key] = srcAttr[key]);
                });
            }
            function compileTemplateUrl(directives, $compileNode, tAttrs, $rootElement, childTranscludeFn, preLinkFns, postLinkFns, previousCompileContext) {
                var afterTemplateNodeLinkFn, afterTemplateChildLinkFn, linkQueue = [], beforeTemplateCompileNode = $compileNode[0], origAsyncDirective = directives.shift(), derivedSyncDirective = extend({}, origAsyncDirective, {
                    templateUrl: null,
                    transclude: null,
                    replace: null,
                    $$originalDirective: origAsyncDirective
                }), templateUrl = isFunction(origAsyncDirective.templateUrl) ? origAsyncDirective.templateUrl($compileNode, tAttrs) : origAsyncDirective.templateUrl;
                return $compileNode.html(""), $http.get($sce.getTrustedResourceUrl(templateUrl), {
                    cache: $templateCache
                }).success(function(content) {
                    var compileNode, tempTemplateAttrs, $template;
                    if (content = denormalizeTemplate(content), origAsyncDirective.replace) {
                        if ($template = jqLite("<div>" + trim(content) + "</div>").contents(), compileNode = $template[0], 
                        1 != $template.length || 1 !== compileNode.nodeType) throw $compileMinErr("tplrt", "Template for directive '{0}' must have exactly one root element. {1}", origAsyncDirective.name, templateUrl);
                        tempTemplateAttrs = {
                            $attr: {}
                        }, replaceWith($rootElement, $compileNode, compileNode);
                        var templateDirectives = collectDirectives(compileNode, [], tempTemplateAttrs);
                        isObject(origAsyncDirective.scope) && markDirectivesAsIsolate(templateDirectives), 
                        directives = templateDirectives.concat(directives), mergeTemplateAttributes(tAttrs, tempTemplateAttrs);
                    } else compileNode = beforeTemplateCompileNode, $compileNode.html(content);
                    for (directives.unshift(derivedSyncDirective), afterTemplateNodeLinkFn = applyDirectivesToNode(directives, compileNode, tAttrs, childTranscludeFn, $compileNode, origAsyncDirective, preLinkFns, postLinkFns, previousCompileContext), 
                    forEach($rootElement, function(node, i) {
                        node == compileNode && ($rootElement[i] = $compileNode[0]);
                    }), afterTemplateChildLinkFn = compileNodes($compileNode[0].childNodes, childTranscludeFn); linkQueue.length; ) {
                        var scope = linkQueue.shift(), beforeTemplateLinkNode = linkQueue.shift(), linkRootElement = linkQueue.shift(), controller = linkQueue.shift(), linkNode = $compileNode[0];
                        beforeTemplateLinkNode !== beforeTemplateCompileNode && (linkNode = jqLiteClone(compileNode), 
                        replaceWith(linkRootElement, jqLite(beforeTemplateLinkNode), linkNode)), afterTemplateNodeLinkFn(afterTemplateChildLinkFn, scope, linkNode, $rootElement, controller);
                    }
                    linkQueue = null;
                }).error(function(response, code, headers, config) {
                    throw $compileMinErr("tpload", "Failed to load template: {0}", config.url);
                }), function(ignoreChildLinkFn, scope, node, rootElement, controller) {
                    linkQueue ? (linkQueue.push(scope), linkQueue.push(node), linkQueue.push(rootElement), 
                    linkQueue.push(controller)) : afterTemplateNodeLinkFn(afterTemplateChildLinkFn, scope, node, rootElement, controller);
                };
            }
            function byPriority(a, b) {
                var diff = b.priority - a.priority;
                return 0 !== diff ? diff : a.name !== b.name ? a.name < b.name ? -1 : 1 : a.index - b.index;
            }
            function assertNoDuplicate(what, previousDirective, directive, element) {
                if (previousDirective) throw $compileMinErr("multidir", "Multiple directives [{0}, {1}] asking for {2} on: {3}", previousDirective.name, directive.name, what, startingTag(element));
            }
            function addTextInterpolateDirective(directives, text) {
                var interpolateFn = $interpolate(text, !0);
                interpolateFn && directives.push({
                    priority: 0,
                    compile: valueFn(function(scope, node) {
                        var parent = node.parent(), bindings = parent.data("$binding") || [];
                        bindings.push(interpolateFn), safeAddClass(parent.data("$binding", bindings), "ng-binding"), 
                        scope.$watch(interpolateFn, function(value) {
                            node[0].nodeValue = value;
                        });
                    })
                });
            }
            function getTrustedContext(node, attrNormalizedName) {
                return "xlinkHref" == attrNormalizedName || "IMG" != nodeName_(node) && ("src" == attrNormalizedName || "ngSrc" == attrNormalizedName) ? $sce.RESOURCE_URL : void 0;
            }
            function addAttrInterpolateDirective(node, directives, value, name) {
                var interpolateFn = $interpolate(value, !0);
                if (interpolateFn) {
                    if ("multiple" === name && "SELECT" === nodeName_(node)) throw $compileMinErr("selmulti", "Binding to the 'multiple' attribute is not supported. Element: {0}", startingTag(node));
                    directives.push({
                        priority: 100,
                        compile: function() {
                            return {
                                pre: function(scope, element, attr) {
                                    var $$observers = attr.$$observers || (attr.$$observers = {});
                                    if (EVENT_HANDLER_ATTR_REGEXP.test(name)) throw $compileMinErr("nodomevents", "Interpolations for HTML DOM event attributes are disallowed.  Please use the ng- versions (such as ng-click instead of onclick) instead.");
                                    interpolateFn = $interpolate(attr[name], !0, getTrustedContext(node, name)), interpolateFn && (attr[name] = interpolateFn(scope), 
                                    ($$observers[name] || ($$observers[name] = [])).$$inter = !0, (attr.$$observers && attr.$$observers[name].$$scope || scope).$watch(interpolateFn, function(value) {
                                        attr.$set(name, value);
                                    }));
                                }
                            };
                        }
                    });
                }
            }
            function replaceWith($rootElement, elementsToRemove, newNode) {
                var i, ii, firstElementToRemove = elementsToRemove[0], removeCount = elementsToRemove.length, parent = firstElementToRemove.parentNode;
                if ($rootElement) for (i = 0, ii = $rootElement.length; ii > i; i++) if ($rootElement[i] == firstElementToRemove) {
                    $rootElement[i++] = newNode;
                    for (var j = i, j2 = j + removeCount - 1, jj = $rootElement.length; jj > j; j++, 
                    j2++) jj > j2 ? $rootElement[j] = $rootElement[j2] : delete $rootElement[j];
                    $rootElement.length -= removeCount - 1;
                    break;
                }
                parent && parent.replaceChild(newNode, firstElementToRemove);
                var fragment = document.createDocumentFragment();
                fragment.appendChild(firstElementToRemove), newNode[jqLite.expando] = firstElementToRemove[jqLite.expando];
                for (var k = 1, kk = elementsToRemove.length; kk > k; k++) {
                    var element = elementsToRemove[k];
                    jqLite(element).remove(), fragment.appendChild(element), delete elementsToRemove[k];
                }
                elementsToRemove[0] = newNode, elementsToRemove.length = 1;
            }
            function cloneAndAnnotateFn(fn, annotation) {
                return extend(function() {
                    return fn.apply(null, arguments);
                }, fn, annotation);
            }
            var Attributes = function(element, attr) {
                this.$$element = element, this.$attr = attr || {};
            };
            Attributes.prototype = {
                $normalize: directiveNormalize,
                $addClass: function(classVal) {
                    classVal && classVal.length > 0 && $animate.addClass(this.$$element, classVal);
                },
                $removeClass: function(classVal) {
                    classVal && classVal.length > 0 && $animate.removeClass(this.$$element, classVal);
                },
                $set: function(key, value, writeAttr, attrName) {
                    function tokenDifference(str1, str2) {
                        var values = [], tokens1 = str1.split(/\s+/), tokens2 = str2.split(/\s+/);
                        outer: for (var i = 0; i < tokens1.length; i++) {
                            for (var token = tokens1[i], j = 0; j < tokens2.length; j++) if (token == tokens2[j]) continue outer;
                            values.push(token);
                        }
                        return values;
                    }
                    if ("class" == key) {
                        value = value || "";
                        var current = this.$$element.attr("class") || "";
                        this.$removeClass(tokenDifference(current, value).join(" ")), this.$addClass(tokenDifference(value, current).join(" "));
                    } else {
                        var normalizedVal, nodeName, booleanKey = getBooleanAttrName(this.$$element[0], key);
                        booleanKey && (this.$$element.prop(key, value), attrName = booleanKey), this[key] = value, 
                        attrName ? this.$attr[key] = attrName : (attrName = this.$attr[key], attrName || (this.$attr[key] = attrName = snake_case(key, "-"))), 
                        nodeName = nodeName_(this.$$element), ("A" === nodeName && "href" === key || "IMG" === nodeName && "src" === key) && (!msie || msie >= 8) && (normalizedVal = urlResolve(value).href, 
                        "" !== normalizedVal && ("href" === key && !normalizedVal.match(aHrefSanitizationWhitelist) || "src" === key && !normalizedVal.match(imgSrcSanitizationWhitelist)) && (this[key] = value = "unsafe:" + normalizedVal)), 
                        writeAttr !== !1 && (null === value || value === undefined ? this.$$element.removeAttr(attrName) : this.$$element.attr(attrName, value));
                    }
                    var $$observers = this.$$observers;
                    $$observers && forEach($$observers[key], function(fn) {
                        try {
                            fn(value);
                        } catch (e) {
                            $exceptionHandler(e);
                        }
                    });
                },
                $observe: function(key, fn) {
                    var attrs = this, $$observers = attrs.$$observers || (attrs.$$observers = {}), listeners = $$observers[key] || ($$observers[key] = []);
                    return listeners.push(fn), $rootScope.$evalAsync(function() {
                        listeners.$$inter || fn(attrs[key]);
                    }), fn;
                }
            };
            var startSymbol = $interpolate.startSymbol(), endSymbol = $interpolate.endSymbol(), denormalizeTemplate = "{{" == startSymbol || "}}" == endSymbol ? identity : function(template) {
                return template.replace(/\{\{/g, startSymbol).replace(/}}/g, endSymbol);
            }, NG_ATTR_BINDING = /^ngAttr[A-Z]/;
            return compile;
        } ];
    }
    function directiveNormalize(name) {
        return camelCase(name.replace(PREFIX_REGEXP, ""));
    }
    function $ControllerProvider() {
        var controllers = {}, CNTRL_REG = /^(\S+)(\s+as\s+(\w+))?$/;
        this.register = function(name, constructor) {
            assertNotHasOwnProperty(name, "controller"), isObject(name) ? extend(controllers, name) : controllers[name] = constructor;
        }, this.$get = [ "$injector", "$window", function($injector, $window) {
            return function(expression, locals) {
                var instance, match, constructor, identifier;
                if (isString(expression) && (match = expression.match(CNTRL_REG), constructor = match[1], 
                identifier = match[3], expression = controllers.hasOwnProperty(constructor) ? controllers[constructor] : getter(locals.$scope, constructor, !0) || getter($window, constructor, !0), 
                assertArgFn(expression, constructor, !0)), instance = $injector.instantiate(expression, locals), 
                identifier) {
                    if (!locals || "object" != typeof locals.$scope) throw minErr("$controller")("noscp", "Cannot export controller '{0}' as '{1}'! No $scope object provided via `locals`.", constructor || expression.name, identifier);
                    locals.$scope[identifier] = instance;
                }
                return instance;
            };
        } ];
    }
    function $DocumentProvider() {
        this.$get = [ "$window", function(window) {
            return jqLite(window.document);
        } ];
    }
    function $ExceptionHandlerProvider() {
        this.$get = [ "$log", function($log) {
            return function() {
                $log.error.apply($log, arguments);
            };
        } ];
    }
    function parseHeaders(headers) {
        var key, val, i, parsed = {};
        return headers ? (forEach(headers.split("\n"), function(line) {
            i = line.indexOf(":"), key = lowercase(trim(line.substr(0, i))), val = trim(line.substr(i + 1)), 
            key && (parsed[key] ? parsed[key] += ", " + val : parsed[key] = val);
        }), parsed) : parsed;
    }
    function headersGetter(headers) {
        var headersObj = isObject(headers) ? headers : undefined;
        return function(name) {
            return headersObj || (headersObj = parseHeaders(headers)), name ? headersObj[lowercase(name)] || null : headersObj;
        };
    }
    function transformData(data, headers, fns) {
        return isFunction(fns) ? fns(data, headers) : (forEach(fns, function(fn) {
            data = fn(data, headers);
        }), data);
    }
    function isSuccess(status) {
        return status >= 200 && 300 > status;
    }
    function $HttpProvider() {
        var JSON_START = /^\s*(\[|\{[^\{])/, JSON_END = /[\}\]]\s*$/, PROTECTION_PREFIX = /^\)\]\}',?\n/, CONTENT_TYPE_APPLICATION_JSON = {
            "Content-Type": "application/json;charset=utf-8"
        }, defaults = this.defaults = {
            transformResponse: [ function(data) {
                return isString(data) && (data = data.replace(PROTECTION_PREFIX, ""), JSON_START.test(data) && JSON_END.test(data) && (data = fromJson(data))), 
                data;
            } ],
            transformRequest: [ function(d) {
                return isObject(d) && !isFile(d) ? toJson(d) : d;
            } ],
            headers: {
                common: {
                    Accept: "application/json, text/plain, */*"
                },
                post: CONTENT_TYPE_APPLICATION_JSON,
                put: CONTENT_TYPE_APPLICATION_JSON,
                patch: CONTENT_TYPE_APPLICATION_JSON
            },
            xsrfCookieName: "XSRF-TOKEN",
            xsrfHeaderName: "X-XSRF-TOKEN"
        }, interceptorFactories = this.interceptors = [], responseInterceptorFactories = this.responseInterceptors = [];
        this.$get = [ "$httpBackend", "$browser", "$cacheFactory", "$rootScope", "$q", "$injector", function($httpBackend, $browser, $cacheFactory, $rootScope, $q, $injector) {
            function $http(requestConfig) {
                function transformResponse(response) {
                    var resp = extend({}, response, {
                        data: transformData(response.data, response.headers, config.transformResponse)
                    });
                    return isSuccess(response.status) ? resp : $q.reject(resp);
                }
                function mergeHeaders(config) {
                    function execHeaders(headers) {
                        var headerContent;
                        forEach(headers, function(headerFn, header) {
                            isFunction(headerFn) && (headerContent = headerFn(), null != headerContent ? headers[header] = headerContent : delete headers[header]);
                        });
                    }
                    var defHeaderName, lowercaseDefHeaderName, reqHeaderName, defHeaders = defaults.headers, reqHeaders = extend({}, config.headers);
                    defHeaders = extend({}, defHeaders.common, defHeaders[lowercase(config.method)]), 
                    execHeaders(defHeaders), execHeaders(reqHeaders);
                    defaultHeadersIteration: for (defHeaderName in defHeaders) {
                        lowercaseDefHeaderName = lowercase(defHeaderName);
                        for (reqHeaderName in reqHeaders) if (lowercase(reqHeaderName) === lowercaseDefHeaderName) continue defaultHeadersIteration;
                        reqHeaders[defHeaderName] = defHeaders[defHeaderName];
                    }
                    return reqHeaders;
                }
                var config = {
                    transformRequest: defaults.transformRequest,
                    transformResponse: defaults.transformResponse
                }, headers = mergeHeaders(requestConfig);
                extend(config, requestConfig), config.headers = headers, config.method = uppercase(config.method);
                var xsrfValue = urlIsSameOrigin(config.url) ? $browser.cookies()[config.xsrfCookieName || defaults.xsrfCookieName] : undefined;
                xsrfValue && (headers[config.xsrfHeaderName || defaults.xsrfHeaderName] = xsrfValue);
                var serverRequest = function(config) {
                    headers = config.headers;
                    var reqData = transformData(config.data, headersGetter(headers), config.transformRequest);
                    return isUndefined(config.data) && forEach(headers, function(value, header) {
                        "content-type" === lowercase(header) && delete headers[header];
                    }), isUndefined(config.withCredentials) && !isUndefined(defaults.withCredentials) && (config.withCredentials = defaults.withCredentials), 
                    sendReq(config, reqData, headers).then(transformResponse, transformResponse);
                }, chain = [ serverRequest, undefined ], promise = $q.when(config);
                for (forEach(reversedInterceptors, function(interceptor) {
                    (interceptor.request || interceptor.requestError) && chain.unshift(interceptor.request, interceptor.requestError), 
                    (interceptor.response || interceptor.responseError) && chain.push(interceptor.response, interceptor.responseError);
                }); chain.length; ) {
                    var thenFn = chain.shift(), rejectFn = chain.shift();
                    promise = promise.then(thenFn, rejectFn);
                }
                return promise.success = function(fn) {
                    return promise.then(function(response) {
                        fn(response.data, response.status, response.headers, config);
                    }), promise;
                }, promise.error = function(fn) {
                    return promise.then(null, function(response) {
                        fn(response.data, response.status, response.headers, config);
                    }), promise;
                }, promise;
            }
            function createShortMethods() {
                forEach(arguments, function(name) {
                    $http[name] = function(url, config) {
                        return $http(extend(config || {}, {
                            method: name,
                            url: url
                        }));
                    };
                });
            }
            function createShortMethodsWithData() {
                forEach(arguments, function(name) {
                    $http[name] = function(url, data, config) {
                        return $http(extend(config || {}, {
                            method: name,
                            url: url,
                            data: data
                        }));
                    };
                });
            }
            function sendReq(config, reqData, reqHeaders) {
                function done(status, response, headersString) {
                    cache && (isSuccess(status) ? cache.put(url, [ status, response, parseHeaders(headersString) ]) : cache.remove(url)), 
                    resolvePromise(response, status, headersString), $rootScope.$$phase || $rootScope.$apply();
                }
                function resolvePromise(response, status, headers) {
                    status = Math.max(status, 0), (isSuccess(status) ? deferred.resolve : deferred.reject)({
                        data: response,
                        status: status,
                        headers: headersGetter(headers),
                        config: config
                    });
                }
                function removePendingReq() {
                    var idx = indexOf($http.pendingRequests, config);
                    -1 !== idx && $http.pendingRequests.splice(idx, 1);
                }
                var cache, cachedResp, deferred = $q.defer(), promise = deferred.promise, url = buildUrl(config.url, config.params);
                if ($http.pendingRequests.push(config), promise.then(removePendingReq, removePendingReq), 
                (config.cache || defaults.cache) && config.cache !== !1 && "GET" == config.method && (cache = isObject(config.cache) ? config.cache : isObject(defaults.cache) ? defaults.cache : defaultCache), 
                cache) if (cachedResp = cache.get(url), isDefined(cachedResp)) {
                    if (cachedResp.then) return cachedResp.then(removePendingReq, removePendingReq), 
                    cachedResp;
                    isArray(cachedResp) ? resolvePromise(cachedResp[1], cachedResp[0], copy(cachedResp[2])) : resolvePromise(cachedResp, 200, {});
                } else cache.put(url, promise);
                return isUndefined(cachedResp) && $httpBackend(config.method, url, reqData, done, reqHeaders, config.timeout, config.withCredentials, config.responseType), 
                promise;
            }
            function buildUrl(url, params) {
                if (!params) return url;
                var parts = [];
                return forEachSorted(params, function(value, key) {
                    null === value || isUndefined(value) || (isArray(value) || (value = [ value ]), 
                    forEach(value, function(v) {
                        isObject(v) && (v = toJson(v)), parts.push(encodeUriQuery(key) + "=" + encodeUriQuery(v));
                    }));
                }), url + (-1 == url.indexOf("?") ? "?" : "&") + parts.join("&");
            }
            var defaultCache = $cacheFactory("$http"), reversedInterceptors = [];
            return forEach(interceptorFactories, function(interceptorFactory) {
                reversedInterceptors.unshift(isString(interceptorFactory) ? $injector.get(interceptorFactory) : $injector.invoke(interceptorFactory));
            }), forEach(responseInterceptorFactories, function(interceptorFactory, index) {
                var responseFn = isString(interceptorFactory) ? $injector.get(interceptorFactory) : $injector.invoke(interceptorFactory);
                reversedInterceptors.splice(index, 0, {
                    response: function(response) {
                        return responseFn($q.when(response));
                    },
                    responseError: function(response) {
                        return responseFn($q.reject(response));
                    }
                });
            }), $http.pendingRequests = [], createShortMethods("get", "delete", "head", "jsonp"), 
            createShortMethodsWithData("post", "put"), $http.defaults = defaults, $http;
        } ];
    }
    function $HttpBackendProvider() {
        this.$get = [ "$browser", "$window", "$document", function($browser, $window, $document) {
            return createHttpBackend($browser, XHR, $browser.defer, $window.angular.callbacks, $document[0], $window.location.protocol.replace(":", ""));
        } ];
    }
    function createHttpBackend($browser, XHR, $browserDefer, callbacks, rawDocument, locationProtocol) {
        function jsonpReq(url, done) {
            var script = rawDocument.createElement("script"), doneWrapper = function() {
                rawDocument.body.removeChild(script), done && done();
            };
            return script.type = "text/javascript", script.src = url, msie ? script.onreadystatechange = function() {
                /loaded|complete/.test(script.readyState) && doneWrapper();
            } : script.onload = script.onerror = doneWrapper, rawDocument.body.appendChild(script), 
            doneWrapper;
        }
        return function(method, url, post, callback, headers, timeout, withCredentials, responseType) {
            function timeoutRequest() {
                status = -1, jsonpDone && jsonpDone(), xhr && xhr.abort();
            }
            function completeRequest(callback, status, response, headersString) {
                var protocol = locationProtocol || urlResolve(url).protocol;
                timeoutId && $browserDefer.cancel(timeoutId), jsonpDone = xhr = null, status = "file" == protocol ? response ? 200 : 404 : status, 
                status = 1223 == status ? 204 : status, callback(status, response, headersString), 
                $browser.$$completeOutstandingRequest(noop);
            }
            var status;
            if ($browser.$$incOutstandingRequestCount(), url = url || $browser.url(), "jsonp" == lowercase(method)) {
                var callbackId = "_" + (callbacks.counter++).toString(36);
                callbacks[callbackId] = function(data) {
                    callbacks[callbackId].data = data;
                };
                var jsonpDone = jsonpReq(url.replace("JSON_CALLBACK", "angular.callbacks." + callbackId), function() {
                    callbacks[callbackId].data ? completeRequest(callback, 200, callbacks[callbackId].data) : completeRequest(callback, status || -2), 
                    delete callbacks[callbackId];
                });
            } else {
                var xhr = new XHR();
                xhr.open(method, url, !0), forEach(headers, function(value, key) {
                    isDefined(value) && xhr.setRequestHeader(key, value);
                }), xhr.onreadystatechange = function() {
                    if (4 == xhr.readyState) {
                        var responseHeaders = xhr.getAllResponseHeaders();
                        completeRequest(callback, status || xhr.status, xhr.responseType ? xhr.response : xhr.responseText, responseHeaders);
                    }
                }, withCredentials && (xhr.withCredentials = !0), responseType && (xhr.responseType = responseType), 
                xhr.send(post || null);
            }
            if (timeout > 0) var timeoutId = $browserDefer(timeoutRequest, timeout); else timeout && timeout.then && timeout.then(timeoutRequest);
        };
    }
    function $InterpolateProvider() {
        var startSymbol = "{{", endSymbol = "}}";
        this.startSymbol = function(value) {
            return value ? (startSymbol = value, this) : startSymbol;
        }, this.endSymbol = function(value) {
            return value ? (endSymbol = value, this) : endSymbol;
        }, this.$get = [ "$parse", "$exceptionHandler", "$sce", function($parse, $exceptionHandler, $sce) {
            function $interpolate(text, mustHaveExpression, trustedContext) {
                for (var startIndex, endIndex, fn, exp, index = 0, parts = [], length = text.length, hasInterpolation = !1, concat = []; length > index; ) -1 != (startIndex = text.indexOf(startSymbol, index)) && -1 != (endIndex = text.indexOf(endSymbol, startIndex + startSymbolLength)) ? (index != startIndex && parts.push(text.substring(index, startIndex)), 
                parts.push(fn = $parse(exp = text.substring(startIndex + startSymbolLength, endIndex))), 
                fn.exp = exp, index = endIndex + endSymbolLength, hasInterpolation = !0) : (index != length && parts.push(text.substring(index)), 
                index = length);
                if ((length = parts.length) || (parts.push(""), length = 1), trustedContext && parts.length > 1) throw $interpolateMinErr("noconcat", "Error while interpolating: {0}\nStrict Contextual Escaping disallows interpolations that concatenate multiple expressions when a trusted value is required.  See http://docs.angularjs.org/api/ng.$sce", text);
                return !mustHaveExpression || hasInterpolation ? (concat.length = length, fn = function(context) {
                    try {
                        for (var part, i = 0, ii = length; ii > i; i++) "function" == typeof (part = parts[i]) && (part = part(context), 
                        part = trustedContext ? $sce.getTrusted(trustedContext, part) : $sce.valueOf(part), 
                        null === part || isUndefined(part) ? part = "" : "string" != typeof part && (part = toJson(part))), 
                        concat[i] = part;
                        return concat.join("");
                    } catch (err) {
                        var newErr = $interpolateMinErr("interr", "Can't interpolate: {0}\n{1}", text, err.toString());
                        $exceptionHandler(newErr);
                    }
                }, fn.exp = text, fn.parts = parts, fn) : void 0;
            }
            var startSymbolLength = startSymbol.length, endSymbolLength = endSymbol.length;
            return $interpolate.startSymbol = function() {
                return startSymbol;
            }, $interpolate.endSymbol = function() {
                return endSymbol;
            }, $interpolate;
        } ];
    }
    function $IntervalProvider() {
        this.$get = [ "$rootScope", "$window", "$q", function($rootScope, $window, $q) {
            function interval(fn, delay, count, invokeApply) {
                var setInterval = $window.setInterval, clearInterval = $window.clearInterval, deferred = $q.defer(), promise = deferred.promise, iteration = 0, skipApply = isDefined(invokeApply) && !invokeApply;
                return count = isDefined(count) ? count : 0, promise.then(null, null, fn), promise.$$intervalId = setInterval(function() {
                    deferred.notify(iteration++), count > 0 && iteration >= count && (deferred.resolve(iteration), 
                    clearInterval(promise.$$intervalId), delete intervals[promise.$$intervalId]), skipApply || $rootScope.$apply();
                }, delay), intervals[promise.$$intervalId] = deferred, promise;
            }
            var intervals = {};
            return interval.cancel = function(promise) {
                return promise && promise.$$intervalId in intervals ? (intervals[promise.$$intervalId].reject("canceled"), 
                clearInterval(promise.$$intervalId), delete intervals[promise.$$intervalId], !0) : !1;
            }, interval;
        } ];
    }
    function $LocaleProvider() {
        this.$get = function() {
            return {
                id: "en-us",
                NUMBER_FORMATS: {
                    DECIMAL_SEP: ".",
                    GROUP_SEP: ",",
                    PATTERNS: [ {
                        minInt: 1,
                        minFrac: 0,
                        maxFrac: 3,
                        posPre: "",
                        posSuf: "",
                        negPre: "-",
                        negSuf: "",
                        gSize: 3,
                        lgSize: 3
                    }, {
                        minInt: 1,
                        minFrac: 2,
                        maxFrac: 2,
                        posPre: "¤",
                        posSuf: "",
                        negPre: "(¤",
                        negSuf: ")",
                        gSize: 3,
                        lgSize: 3
                    } ],
                    CURRENCY_SYM: "$"
                },
                DATETIME_FORMATS: {
                    MONTH: "January,February,March,April,May,June,July,August,September,October,November,December".split(","),
                    SHORTMONTH: "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(","),
                    DAY: "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),
                    SHORTDAY: "Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(","),
                    AMPMS: [ "AM", "PM" ],
                    medium: "MMM d, y h:mm:ss a",
                    "short": "M/d/yy h:mm a",
                    fullDate: "EEEE, MMMM d, y",
                    longDate: "MMMM d, y",
                    mediumDate: "MMM d, y",
                    shortDate: "M/d/yy",
                    mediumTime: "h:mm:ss a",
                    shortTime: "h:mm a"
                },
                pluralCat: function(num) {
                    return 1 === num ? "one" : "other";
                }
            };
        };
    }
    function encodePath(path) {
        for (var segments = path.split("/"), i = segments.length; i--; ) segments[i] = encodeUriSegment(segments[i]);
        return segments.join("/");
    }
    function parseAbsoluteUrl(absoluteUrl, locationObj) {
        var parsedUrl = urlResolve(absoluteUrl);
        locationObj.$$protocol = parsedUrl.protocol, locationObj.$$host = parsedUrl.hostname, 
        locationObj.$$port = int(parsedUrl.port) || DEFAULT_PORTS[parsedUrl.protocol] || null;
    }
    function parseAppUrl(relativeUrl, locationObj) {
        var prefixed = "/" !== relativeUrl.charAt(0);
        prefixed && (relativeUrl = "/" + relativeUrl);
        var match = urlResolve(relativeUrl);
        locationObj.$$path = decodeURIComponent(prefixed && "/" === match.pathname.charAt(0) ? match.pathname.substring(1) : match.pathname), 
        locationObj.$$search = parseKeyValue(match.search), locationObj.$$hash = decodeURIComponent(match.hash), 
        locationObj.$$path && "/" != locationObj.$$path.charAt(0) && (locationObj.$$path = "/" + locationObj.$$path);
    }
    function beginsWith(begin, whole) {
        return 0 === whole.indexOf(begin) ? whole.substr(begin.length) : void 0;
    }
    function stripHash(url) {
        var index = url.indexOf("#");
        return -1 == index ? url : url.substr(0, index);
    }
    function stripFile(url) {
        return url.substr(0, stripHash(url).lastIndexOf("/") + 1);
    }
    function serverBase(url) {
        return url.substring(0, url.indexOf("/", url.indexOf("//") + 2));
    }
    function LocationHtml5Url(appBase, basePrefix) {
        this.$$html5 = !0, basePrefix = basePrefix || "";
        var appBaseNoFile = stripFile(appBase);
        parseAbsoluteUrl(appBase, this), this.$$parse = function(url) {
            var pathUrl = beginsWith(appBaseNoFile, url);
            if (!isString(pathUrl)) throw $locationMinErr("ipthprfx", 'Invalid url "{0}", missing path prefix "{1}".', url, appBaseNoFile);
            parseAppUrl(pathUrl, this), this.$$path || (this.$$path = "/"), this.$$compose();
        }, this.$$compose = function() {
            var search = toKeyValue(this.$$search), hash = this.$$hash ? "#" + encodeUriSegment(this.$$hash) : "";
            this.$$url = encodePath(this.$$path) + (search ? "?" + search : "") + hash, this.$$absUrl = appBaseNoFile + this.$$url.substr(1);
        }, this.$$rewrite = function(url) {
            var appUrl, prevAppUrl;
            return (appUrl = beginsWith(appBase, url)) !== undefined ? (prevAppUrl = appUrl, 
            (appUrl = beginsWith(basePrefix, appUrl)) !== undefined ? appBaseNoFile + (beginsWith("/", appUrl) || appUrl) : appBase + prevAppUrl) : (appUrl = beginsWith(appBaseNoFile, url)) !== undefined ? appBaseNoFile + appUrl : appBaseNoFile == url + "/" ? appBaseNoFile : void 0;
        };
    }
    function LocationHashbangUrl(appBase, hashPrefix) {
        var appBaseNoFile = stripFile(appBase);
        parseAbsoluteUrl(appBase, this), this.$$parse = function(url) {
            var withoutBaseUrl = beginsWith(appBase, url) || beginsWith(appBaseNoFile, url), withoutHashUrl = "#" == withoutBaseUrl.charAt(0) ? beginsWith(hashPrefix, withoutBaseUrl) : this.$$html5 ? withoutBaseUrl : "";
            if (!isString(withoutHashUrl)) throw $locationMinErr("ihshprfx", 'Invalid url "{0}", missing hash prefix "{1}".', url, hashPrefix);
            parseAppUrl(withoutHashUrl, this), this.$$compose();
        }, this.$$compose = function() {
            var search = toKeyValue(this.$$search), hash = this.$$hash ? "#" + encodeUriSegment(this.$$hash) : "";
            this.$$url = encodePath(this.$$path) + (search ? "?" + search : "") + hash, this.$$absUrl = appBase + (this.$$url ? hashPrefix + this.$$url : "");
        }, this.$$rewrite = function(url) {
            return stripHash(appBase) == stripHash(url) ? url : void 0;
        };
    }
    function LocationHashbangInHtml5Url(appBase, hashPrefix) {
        this.$$html5 = !0, LocationHashbangUrl.apply(this, arguments);
        var appBaseNoFile = stripFile(appBase);
        this.$$rewrite = function(url) {
            var appUrl;
            return appBase == stripHash(url) ? url : (appUrl = beginsWith(appBaseNoFile, url)) ? appBase + hashPrefix + appUrl : appBaseNoFile === url + "/" ? appBaseNoFile : void 0;
        };
    }
    function locationGetter(property) {
        return function() {
            return this[property];
        };
    }
    function locationGetterSetter(property, preprocess) {
        return function(value) {
            return isUndefined(value) ? this[property] : (this[property] = preprocess(value), 
            this.$$compose(), this);
        };
    }
    function $LocationProvider() {
        var hashPrefix = "", html5Mode = !1;
        this.hashPrefix = function(prefix) {
            return isDefined(prefix) ? (hashPrefix = prefix, this) : hashPrefix;
        }, this.html5Mode = function(mode) {
            return isDefined(mode) ? (html5Mode = mode, this) : html5Mode;
        }, this.$get = [ "$rootScope", "$browser", "$sniffer", "$rootElement", function($rootScope, $browser, $sniffer, $rootElement) {
            function afterLocationChange(oldUrl) {
                $rootScope.$broadcast("$locationChangeSuccess", $location.absUrl(), oldUrl);
            }
            var $location, LocationMode, appBase, baseHref = $browser.baseHref(), initialUrl = $browser.url();
            html5Mode ? (appBase = serverBase(initialUrl) + (baseHref || "/"), LocationMode = $sniffer.history ? LocationHtml5Url : LocationHashbangInHtml5Url) : (appBase = stripHash(initialUrl), 
            LocationMode = LocationHashbangUrl), $location = new LocationMode(appBase, "#" + hashPrefix), 
            $location.$$parse($location.$$rewrite(initialUrl)), $rootElement.on("click", function(event) {
                if (!event.ctrlKey && !event.metaKey && 2 != event.which) {
                    for (var elm = jqLite(event.target); "a" !== lowercase(elm[0].nodeName); ) if (elm[0] === $rootElement[0] || !(elm = elm.parent())[0]) return;
                    var absHref = elm.prop("href"), rewrittenUrl = $location.$$rewrite(absHref);
                    absHref && !elm.attr("target") && rewrittenUrl && !event.isDefaultPrevented() && (event.preventDefault(), 
                    rewrittenUrl != $browser.url() && ($location.$$parse(rewrittenUrl), $rootScope.$apply(), 
                    window.angular["ff-684208-preventDefault"] = !0));
                }
            }), $location.absUrl() != initialUrl && $browser.url($location.absUrl(), !0), $browser.onUrlChange(function(newUrl) {
                if ($location.absUrl() != newUrl) {
                    if ($rootScope.$broadcast("$locationChangeStart", newUrl, $location.absUrl()).defaultPrevented) return $browser.url($location.absUrl()), 
                    void 0;
                    $rootScope.$evalAsync(function() {
                        var oldUrl = $location.absUrl();
                        $location.$$parse(newUrl), afterLocationChange(oldUrl);
                    }), $rootScope.$$phase || $rootScope.$digest();
                }
            });
            var changeCounter = 0;
            return $rootScope.$watch(function() {
                var oldUrl = $browser.url(), currentReplace = $location.$$replace;
                return changeCounter && oldUrl == $location.absUrl() || (changeCounter++, $rootScope.$evalAsync(function() {
                    $rootScope.$broadcast("$locationChangeStart", $location.absUrl(), oldUrl).defaultPrevented ? $location.$$parse(oldUrl) : ($browser.url($location.absUrl(), currentReplace), 
                    afterLocationChange(oldUrl));
                })), $location.$$replace = !1, changeCounter;
            }), $location;
        } ];
    }
    function $LogProvider() {
        var debug = !0, self = this;
        this.debugEnabled = function(flag) {
            return isDefined(flag) ? (debug = flag, this) : debug;
        }, this.$get = [ "$window", function($window) {
            function formatError(arg) {
                return arg instanceof Error && (arg.stack ? arg = arg.message && -1 === arg.stack.indexOf(arg.message) ? "Error: " + arg.message + "\n" + arg.stack : arg.stack : arg.sourceURL && (arg = arg.message + "\n" + arg.sourceURL + ":" + arg.line)), 
                arg;
            }
            function consoleLog(type) {
                var console = $window.console || {}, logFn = console[type] || console.log || noop;
                return logFn.apply ? function() {
                    var args = [];
                    return forEach(arguments, function(arg) {
                        args.push(formatError(arg));
                    }), logFn.apply(console, args);
                } : function(arg1, arg2) {
                    logFn(arg1, null == arg2 ? "" : arg2);
                };
            }
            return {
                log: consoleLog("log"),
                info: consoleLog("info"),
                warn: consoleLog("warn"),
                error: consoleLog("error"),
                debug: function() {
                    var fn = consoleLog("debug");
                    return function() {
                        debug && fn.apply(self, arguments);
                    };
                }()
            };
        } ];
    }
    function ensureSafeMemberName(name, fullExpression, allowConstructor) {
        if ("string" != typeof name && "[object String]" !== toString.apply(name)) return name;
        if ("constructor" === name && !allowConstructor) throw $parseMinErr("isecfld", 'Referencing "constructor" field in Angular expressions is disallowed! Expression: {0}', fullExpression);
        if ("_" === name.charAt(0) || "_" === name.charAt(name.length - 1)) throw $parseMinErr("isecprv", "Referencing private fields in Angular expressions is disallowed! Expression: {0}", fullExpression);
        return name;
    }
    function ensureSafeObject(obj, fullExpression) {
        if (obj && obj.constructor === obj) throw $parseMinErr("isecfn", "Referencing Function in Angular expressions is disallowed! Expression: {0}", fullExpression);
        if (obj && obj.document && obj.location && obj.alert && obj.setInterval) throw $parseMinErr("isecwindow", "Referencing the Window in Angular expressions is disallowed! Expression: {0}", fullExpression);
        if (obj && (obj.nodeName || obj.on && obj.find)) throw $parseMinErr("isecdom", "Referencing DOM nodes in Angular expressions is disallowed! Expression: {0}", fullExpression);
        return obj;
    }
    function setter(obj, path, setValue, fullExp, options) {
        options = options || {};
        for (var key, element = path.split("."), i = 0; element.length > 1; i++) {
            key = ensureSafeMemberName(element.shift(), fullExp);
            var propertyObj = obj[key];
            propertyObj || (propertyObj = {}, obj[key] = propertyObj), obj = propertyObj, obj.then && options.unwrapPromises && (promiseWarning(fullExp), 
            "$$v" in obj || !function(promise) {
                promise.then(function(val) {
                    promise.$$v = val;
                });
            }(obj), obj.$$v === undefined && (obj.$$v = {}), obj = obj.$$v);
        }
        return key = ensureSafeMemberName(element.shift(), fullExp), obj[key] = setValue, 
        setValue;
    }
    function cspSafeGetterFn(key0, key1, key2, key3, key4, fullExp, options) {
        return ensureSafeMemberName(key0, fullExp), ensureSafeMemberName(key1, fullExp), 
        ensureSafeMemberName(key2, fullExp), ensureSafeMemberName(key3, fullExp), ensureSafeMemberName(key4, fullExp), 
        options.unwrapPromises ? function(scope, locals) {
            var promise, pathVal = locals && locals.hasOwnProperty(key0) ? locals : scope;
            return null === pathVal || pathVal === undefined ? pathVal : (pathVal = pathVal[key0], 
            pathVal && pathVal.then && (promiseWarning(fullExp), "$$v" in pathVal || (promise = pathVal, 
            promise.$$v = undefined, promise.then(function(val) {
                promise.$$v = val;
            })), pathVal = pathVal.$$v), key1 && null !== pathVal && pathVal !== undefined ? (pathVal = pathVal[key1], 
            pathVal && pathVal.then && (promiseWarning(fullExp), "$$v" in pathVal || (promise = pathVal, 
            promise.$$v = undefined, promise.then(function(val) {
                promise.$$v = val;
            })), pathVal = pathVal.$$v), key2 && null !== pathVal && pathVal !== undefined ? (pathVal = pathVal[key2], 
            pathVal && pathVal.then && (promiseWarning(fullExp), "$$v" in pathVal || (promise = pathVal, 
            promise.$$v = undefined, promise.then(function(val) {
                promise.$$v = val;
            })), pathVal = pathVal.$$v), key3 && null !== pathVal && pathVal !== undefined ? (pathVal = pathVal[key3], 
            pathVal && pathVal.then && (promiseWarning(fullExp), "$$v" in pathVal || (promise = pathVal, 
            promise.$$v = undefined, promise.then(function(val) {
                promise.$$v = val;
            })), pathVal = pathVal.$$v), key4 && null !== pathVal && pathVal !== undefined ? (pathVal = pathVal[key4], 
            pathVal && pathVal.then && (promiseWarning(fullExp), "$$v" in pathVal || (promise = pathVal, 
            promise.$$v = undefined, promise.then(function(val) {
                promise.$$v = val;
            })), pathVal = pathVal.$$v), pathVal) : pathVal) : pathVal) : pathVal) : pathVal);
        } : function(scope, locals) {
            var pathVal = locals && locals.hasOwnProperty(key0) ? locals : scope;
            return null === pathVal || pathVal === undefined ? pathVal : (pathVal = pathVal[key0], 
            key1 && null !== pathVal && pathVal !== undefined ? (pathVal = pathVal[key1], key2 && null !== pathVal && pathVal !== undefined ? (pathVal = pathVal[key2], 
            key3 && null !== pathVal && pathVal !== undefined ? (pathVal = pathVal[key3], key4 && null !== pathVal && pathVal !== undefined ? pathVal = pathVal[key4] : pathVal) : pathVal) : pathVal) : pathVal);
        };
    }
    function getterFn(path, options, fullExp) {
        if (getterFnCache.hasOwnProperty(path)) return getterFnCache[path];
        var fn, pathKeys = path.split("."), pathKeysLength = pathKeys.length;
        if (options.csp) fn = 6 > pathKeysLength ? cspSafeGetterFn(pathKeys[0], pathKeys[1], pathKeys[2], pathKeys[3], pathKeys[4], fullExp, options) : function(scope, locals) {
            var val, i = 0;
            do val = cspSafeGetterFn(pathKeys[i++], pathKeys[i++], pathKeys[i++], pathKeys[i++], pathKeys[i++], fullExp, options)(scope, locals), 
            locals = undefined, scope = val; while (pathKeysLength > i);
            return val;
        }; else {
            var code = "var l, fn, p;\n";
            forEach(pathKeys, function(key, index) {
                ensureSafeMemberName(key, fullExp), code += "if(s === null || s === undefined) return s;\nl=s;\ns=" + (index ? "s" : '((k&&k.hasOwnProperty("' + key + '"))?k:s)') + '["' + key + '"];\n' + (options.unwrapPromises ? 'if (s && s.then) {\n pw("' + fullExp.replace(/\"/g, '\\"') + '");\n if (!("$$v" in s)) {\n p=s;\n p.$$v = undefined;\n p.then(function(v) {p.$$v=v;});\n}\n s=s.$$v\n}\n' : "");
            }), code += "return s;";
            var evaledFnGetter = new Function("s", "k", "pw", code);
            evaledFnGetter.toString = function() {
                return code;
            }, fn = function(scope, locals) {
                return evaledFnGetter(scope, locals, promiseWarning);
            };
        }
        return "hasOwnProperty" !== path && (getterFnCache[path] = fn), fn;
    }
    function $ParseProvider() {
        var cache = {}, $parseOptions = {
            csp: !1,
            unwrapPromises: !1,
            logPromiseWarnings: !0
        };
        this.unwrapPromises = function(value) {
            return isDefined(value) ? ($parseOptions.unwrapPromises = !!value, this) : $parseOptions.unwrapPromises;
        }, this.logPromiseWarnings = function(value) {
            return isDefined(value) ? ($parseOptions.logPromiseWarnings = value, this) : $parseOptions.logPromiseWarnings;
        }, this.$get = [ "$filter", "$sniffer", "$log", function($filter, $sniffer, $log) {
            return $parseOptions.csp = $sniffer.csp, promiseWarning = function(fullExp) {
                $parseOptions.logPromiseWarnings && !promiseWarningCache.hasOwnProperty(fullExp) && (promiseWarningCache[fullExp] = !0, 
                $log.warn("[$parse] Promise found in the expression `" + fullExp + "`. Automatic unwrapping of promises in Angular expressions is deprecated."));
            }, function(exp) {
                var parsedExpression;
                switch (typeof exp) {
                  case "string":
                    if (cache.hasOwnProperty(exp)) return cache[exp];
                    var lexer = new Lexer($parseOptions), parser = new Parser(lexer, $filter, $parseOptions);
                    return parsedExpression = parser.parse(exp, !1), "hasOwnProperty" !== exp && (cache[exp] = parsedExpression), 
                    parsedExpression;

                  case "function":
                    return exp;

                  default:
                    return noop;
                }
            };
        } ];
    }
    function $QProvider() {
        this.$get = [ "$rootScope", "$exceptionHandler", function($rootScope, $exceptionHandler) {
            return qFactory(function(callback) {
                $rootScope.$evalAsync(callback);
            }, $exceptionHandler);
        } ];
    }
    function qFactory(nextTick, exceptionHandler) {
        function defaultCallback(value) {
            return value;
        }
        function defaultErrback(reason) {
            return reject(reason);
        }
        function all(promises) {
            var deferred = defer(), counter = 0, results = isArray(promises) ? [] : {};
            return forEach(promises, function(promise, key) {
                counter++, ref(promise).then(function(value) {
                    results.hasOwnProperty(key) || (results[key] = value, --counter || deferred.resolve(results));
                }, function(reason) {
                    results.hasOwnProperty(key) || deferred.reject(reason);
                });
            }), 0 === counter && deferred.resolve(results), deferred.promise;
        }
        var defer = function() {
            var value, deferred, pending = [];
            return deferred = {
                resolve: function(val) {
                    if (pending) {
                        var callbacks = pending;
                        pending = undefined, value = ref(val), callbacks.length && nextTick(function() {
                            for (var callback, i = 0, ii = callbacks.length; ii > i; i++) callback = callbacks[i], 
                            value.then(callback[0], callback[1], callback[2]);
                        });
                    }
                },
                reject: function(reason) {
                    deferred.resolve(reject(reason));
                },
                notify: function(progress) {
                    if (pending) {
                        var callbacks = pending;
                        pending.length && nextTick(function() {
                            for (var callback, i = 0, ii = callbacks.length; ii > i; i++) callback = callbacks[i], 
                            callback[2](progress);
                        });
                    }
                },
                promise: {
                    then: function(callback, errback, progressback) {
                        var result = defer(), wrappedCallback = function(value) {
                            try {
                                result.resolve((isFunction(callback) ? callback : defaultCallback)(value));
                            } catch (e) {
                                result.reject(e), exceptionHandler(e);
                            }
                        }, wrappedErrback = function(reason) {
                            try {
                                result.resolve((isFunction(errback) ? errback : defaultErrback)(reason));
                            } catch (e) {
                                result.reject(e), exceptionHandler(e);
                            }
                        }, wrappedProgressback = function(progress) {
                            try {
                                result.notify((isFunction(progressback) ? progressback : defaultCallback)(progress));
                            } catch (e) {
                                exceptionHandler(e);
                            }
                        };
                        return pending ? pending.push([ wrappedCallback, wrappedErrback, wrappedProgressback ]) : value.then(wrappedCallback, wrappedErrback, wrappedProgressback), 
                        result.promise;
                    },
                    "catch": function(callback) {
                        return this.then(null, callback);
                    },
                    "finally": function(callback) {
                        function makePromise(value, resolved) {
                            var result = defer();
                            return resolved ? result.resolve(value) : result.reject(value), result.promise;
                        }
                        function handleCallback(value, isResolved) {
                            var callbackOutput = null;
                            try {
                                callbackOutput = (callback || defaultCallback)();
                            } catch (e) {
                                return makePromise(e, !1);
                            }
                            return callbackOutput && isFunction(callbackOutput.then) ? callbackOutput.then(function() {
                                return makePromise(value, isResolved);
                            }, function(error) {
                                return makePromise(error, !1);
                            }) : makePromise(value, isResolved);
                        }
                        return this.then(function(value) {
                            return handleCallback(value, !0);
                        }, function(error) {
                            return handleCallback(error, !1);
                        });
                    }
                }
            };
        }, ref = function(value) {
            return value && isFunction(value.then) ? value : {
                then: function(callback) {
                    var result = defer();
                    return nextTick(function() {
                        result.resolve(callback(value));
                    }), result.promise;
                }
            };
        }, reject = function(reason) {
            return {
                then: function(callback, errback) {
                    var result = defer();
                    return nextTick(function() {
                        try {
                            result.resolve((isFunction(errback) ? errback : defaultErrback)(reason));
                        } catch (e) {
                            result.reject(e), exceptionHandler(e);
                        }
                    }), result.promise;
                }
            };
        }, when = function(value, callback, errback, progressback) {
            var done, result = defer(), wrappedCallback = function(value) {
                try {
                    return (isFunction(callback) ? callback : defaultCallback)(value);
                } catch (e) {
                    return exceptionHandler(e), reject(e);
                }
            }, wrappedErrback = function(reason) {
                try {
                    return (isFunction(errback) ? errback : defaultErrback)(reason);
                } catch (e) {
                    return exceptionHandler(e), reject(e);
                }
            }, wrappedProgressback = function(progress) {
                try {
                    return (isFunction(progressback) ? progressback : defaultCallback)(progress);
                } catch (e) {
                    exceptionHandler(e);
                }
            };
            return nextTick(function() {
                ref(value).then(function(value) {
                    done || (done = !0, result.resolve(ref(value).then(wrappedCallback, wrappedErrback, wrappedProgressback)));
                }, function(reason) {
                    done || (done = !0, result.resolve(wrappedErrback(reason)));
                }, function(progress) {
                    done || result.notify(wrappedProgressback(progress));
                });
            }), result.promise;
        };
        return {
            defer: defer,
            reject: reject,
            when: when,
            all: all
        };
    }
    function $RootScopeProvider() {
        var TTL = 10, $rootScopeMinErr = minErr("$rootScope");
        this.digestTtl = function(value) {
            return arguments.length && (TTL = value), TTL;
        }, this.$get = [ "$injector", "$exceptionHandler", "$parse", "$browser", function($injector, $exceptionHandler, $parse, $browser) {
            function Scope() {
                this.$id = nextUid(), this.$$phase = this.$parent = this.$$watchers = this.$$nextSibling = this.$$prevSibling = this.$$childHead = this.$$childTail = null, 
                this["this"] = this.$root = this, this.$$destroyed = !1, this.$$asyncQueue = [], 
                this.$$postDigestQueue = [], this.$$listeners = {}, this.$$isolateBindings = {};
            }
            function beginPhase(phase) {
                if ($rootScope.$$phase) throw $rootScopeMinErr("inprog", "{0} already in progress", $rootScope.$$phase);
                $rootScope.$$phase = phase;
            }
            function clearPhase() {
                $rootScope.$$phase = null;
            }
            function compileToFn(exp, name) {
                var fn = $parse(exp);
                return assertArgFn(fn, name), fn;
            }
            function initWatchVal() {}
            Scope.prototype = {
                constructor: Scope,
                $new: function(isolate) {
                    var Child, child;
                    return isolate ? (child = new Scope(), child.$root = this.$root, child.$$asyncQueue = this.$$asyncQueue, 
                    child.$$postDigestQueue = this.$$postDigestQueue) : (Child = function() {}, Child.prototype = this, 
                    child = new Child(), child.$id = nextUid()), child["this"] = child, child.$$listeners = {}, 
                    child.$parent = this, child.$$watchers = child.$$nextSibling = child.$$childHead = child.$$childTail = null, 
                    child.$$prevSibling = this.$$childTail, this.$$childHead ? (this.$$childTail.$$nextSibling = child, 
                    this.$$childTail = child) : this.$$childHead = this.$$childTail = child, child;
                },
                $watch: function(watchExp, listener, objectEquality) {
                    var scope = this, get = compileToFn(watchExp, "watch"), array = scope.$$watchers, watcher = {
                        fn: listener,
                        last: initWatchVal,
                        get: get,
                        exp: watchExp,
                        eq: !!objectEquality
                    };
                    if (!isFunction(listener)) {
                        var listenFn = compileToFn(listener || noop, "listener");
                        watcher.fn = function(newVal, oldVal, scope) {
                            listenFn(scope);
                        };
                    }
                    if ("string" == typeof watchExp && get.constant) {
                        var originalFn = watcher.fn;
                        watcher.fn = function(newVal, oldVal, scope) {
                            originalFn.call(this, newVal, oldVal, scope), arrayRemove(array, watcher);
                        };
                    }
                    return array || (array = scope.$$watchers = []), array.unshift(watcher), function() {
                        arrayRemove(array, watcher);
                    };
                },
                $watchCollection: function(obj, listener) {
                    function $watchCollectionWatch() {
                        newValue = objGetter(self);
                        var newLength, key;
                        if (isObject(newValue)) if (isArrayLike(newValue)) {
                            oldValue !== internalArray && (oldValue = internalArray, oldLength = oldValue.length = 0, 
                            changeDetected++), newLength = newValue.length, oldLength !== newLength && (changeDetected++, 
                            oldValue.length = oldLength = newLength);
                            for (var i = 0; newLength > i; i++) oldValue[i] !== newValue[i] && (changeDetected++, 
                            oldValue[i] = newValue[i]);
                        } else {
                            oldValue !== internalObject && (oldValue = internalObject = {}, oldLength = 0, changeDetected++), 
                            newLength = 0;
                            for (key in newValue) newValue.hasOwnProperty(key) && (newLength++, oldValue.hasOwnProperty(key) ? oldValue[key] !== newValue[key] && (changeDetected++, 
                            oldValue[key] = newValue[key]) : (oldLength++, oldValue[key] = newValue[key], changeDetected++));
                            if (oldLength > newLength) {
                                changeDetected++;
                                for (key in oldValue) oldValue.hasOwnProperty(key) && !newValue.hasOwnProperty(key) && (oldLength--, 
                                delete oldValue[key]);
                            }
                        } else oldValue !== newValue && (oldValue = newValue, changeDetected++);
                        return changeDetected;
                    }
                    function $watchCollectionAction() {
                        listener(newValue, oldValue, self);
                    }
                    var oldValue, newValue, self = this, changeDetected = 0, objGetter = $parse(obj), internalArray = [], internalObject = {}, oldLength = 0;
                    return this.$watch($watchCollectionWatch, $watchCollectionAction);
                },
                $digest: function() {
                    var watch, value, last, watchers, length, dirty, next, current, logIdx, logMsg, asyncTask, asyncQueue = this.$$asyncQueue, postDigestQueue = this.$$postDigestQueue, ttl = TTL, target = this, watchLog = [];
                    beginPhase("$digest");
                    do {
                        for (dirty = !1, current = target; asyncQueue.length; ) try {
                            asyncTask = asyncQueue.shift(), asyncTask.scope.$eval(asyncTask.expression);
                        } catch (e) {
                            $exceptionHandler(e);
                        }
                        do {
                            if (watchers = current.$$watchers) for (length = watchers.length; length--; ) try {
                                watch = watchers[length], watch && (value = watch.get(current)) !== (last = watch.last) && !(watch.eq ? equals(value, last) : "number" == typeof value && "number" == typeof last && isNaN(value) && isNaN(last)) && (dirty = !0, 
                                watch.last = watch.eq ? copy(value) : value, watch.fn(value, last === initWatchVal ? value : last, current), 
                                5 > ttl && (logIdx = 4 - ttl, watchLog[logIdx] || (watchLog[logIdx] = []), logMsg = isFunction(watch.exp) ? "fn: " + (watch.exp.name || watch.exp.toString()) : watch.exp, 
                                logMsg += "; newVal: " + toJson(value) + "; oldVal: " + toJson(last), watchLog[logIdx].push(logMsg)));
                            } catch (e) {
                                $exceptionHandler(e);
                            }
                            if (!(next = current.$$childHead || current !== target && current.$$nextSibling)) for (;current !== target && !(next = current.$$nextSibling); ) current = current.$parent;
                        } while (current = next);
                        if (dirty && !ttl--) throw clearPhase(), $rootScopeMinErr("infdig", "{0} $digest() iterations reached. Aborting!\nWatchers fired in the last 5 iterations: {1}", TTL, toJson(watchLog));
                    } while (dirty || asyncQueue.length);
                    for (clearPhase(); postDigestQueue.length; ) try {
                        postDigestQueue.shift()();
                    } catch (e) {
                        $exceptionHandler(e);
                    }
                },
                $destroy: function() {
                    if ($rootScope != this && !this.$$destroyed) {
                        var parent = this.$parent;
                        this.$broadcast("$destroy"), this.$$destroyed = !0, parent.$$childHead == this && (parent.$$childHead = this.$$nextSibling), 
                        parent.$$childTail == this && (parent.$$childTail = this.$$prevSibling), this.$$prevSibling && (this.$$prevSibling.$$nextSibling = this.$$nextSibling), 
                        this.$$nextSibling && (this.$$nextSibling.$$prevSibling = this.$$prevSibling), this.$parent = this.$$nextSibling = this.$$prevSibling = this.$$childHead = this.$$childTail = null;
                    }
                },
                $eval: function(expr, locals) {
                    return $parse(expr)(this, locals);
                },
                $evalAsync: function(expr) {
                    $rootScope.$$phase || $rootScope.$$asyncQueue.length || $browser.defer(function() {
                        $rootScope.$$asyncQueue.length && $rootScope.$digest();
                    }), this.$$asyncQueue.push({
                        scope: this,
                        expression: expr
                    });
                },
                $$postDigest: function(fn) {
                    this.$$postDigestQueue.push(fn);
                },
                $apply: function(expr) {
                    try {
                        return beginPhase("$apply"), this.$eval(expr);
                    } catch (e) {
                        $exceptionHandler(e);
                    } finally {
                        clearPhase();
                        try {
                            $rootScope.$digest();
                        } catch (e) {
                            throw $exceptionHandler(e), e;
                        }
                    }
                },
                $on: function(name, listener) {
                    var namedListeners = this.$$listeners[name];
                    return namedListeners || (this.$$listeners[name] = namedListeners = []), namedListeners.push(listener), 
                    function() {
                        namedListeners[indexOf(namedListeners, listener)] = null;
                    };
                },
                $emit: function(name) {
                    var namedListeners, i, length, empty = [], scope = this, stopPropagation = !1, event = {
                        name: name,
                        targetScope: scope,
                        stopPropagation: function() {
                            stopPropagation = !0;
                        },
                        preventDefault: function() {
                            event.defaultPrevented = !0;
                        },
                        defaultPrevented: !1
                    }, listenerArgs = concat([ event ], arguments, 1);
                    do {
                        for (namedListeners = scope.$$listeners[name] || empty, event.currentScope = scope, 
                        i = 0, length = namedListeners.length; length > i; i++) if (namedListeners[i]) try {
                            namedListeners[i].apply(null, listenerArgs);
                        } catch (e) {
                            $exceptionHandler(e);
                        } else namedListeners.splice(i, 1), i--, length--;
                        if (stopPropagation) return event;
                        scope = scope.$parent;
                    } while (scope);
                    return event;
                },
                $broadcast: function(name) {
                    var listeners, i, length, target = this, current = target, next = target, event = {
                        name: name,
                        targetScope: target,
                        preventDefault: function() {
                            event.defaultPrevented = !0;
                        },
                        defaultPrevented: !1
                    }, listenerArgs = concat([ event ], arguments, 1);
                    do {
                        for (current = next, event.currentScope = current, listeners = current.$$listeners[name] || [], 
                        i = 0, length = listeners.length; length > i; i++) if (listeners[i]) try {
                            listeners[i].apply(null, listenerArgs);
                        } catch (e) {
                            $exceptionHandler(e);
                        } else listeners.splice(i, 1), i--, length--;
                        if (!(next = current.$$childHead || current !== target && current.$$nextSibling)) for (;current !== target && !(next = current.$$nextSibling); ) current = current.$parent;
                    } while (current = next);
                    return event;
                }
            };
            var $rootScope = new Scope();
            return $rootScope;
        } ];
    }
    function escapeForRegexp(s) {
        return s.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08");
    }
    function adjustMatcher(matcher) {
        if ("self" === matcher) return matcher;
        if (isString(matcher)) {
            if (matcher.indexOf("***") > -1) throw $sceMinErr("iwcard", "Illegal sequence *** in string matcher.  String: {0}", matcher);
            return matcher = escapeForRegexp(matcher).replace("\\*\\*", ".*").replace("\\*", "[^:/.?&;]*"), 
            new RegExp("^" + matcher + "$");
        }
        if (isRegExp(matcher)) return new RegExp("^" + matcher.source + "$");
        throw $sceMinErr("imatcher", 'Matchers may only be "self", string patterns or RegExp objects');
    }
    function adjustMatchers(matchers) {
        var adjustedMatchers = [];
        return isDefined(matchers) && forEach(matchers, function(matcher) {
            adjustedMatchers.push(adjustMatcher(matcher));
        }), adjustedMatchers;
    }
    function $SceDelegateProvider() {
        this.SCE_CONTEXTS = SCE_CONTEXTS;
        var resourceUrlWhitelist = [ "self" ], resourceUrlBlacklist = [];
        this.resourceUrlWhitelist = function(value) {
            return arguments.length && (resourceUrlWhitelist = adjustMatchers(value)), resourceUrlWhitelist;
        }, this.resourceUrlBlacklist = function(value) {
            return arguments.length && (resourceUrlBlacklist = adjustMatchers(value)), resourceUrlBlacklist;
        }, this.$get = [ "$log", "$document", "$injector", function($log, $document, $injector) {
            function matchUrl(matcher, parsedUrl) {
                return "self" === matcher ? urlIsSameOrigin(parsedUrl) : !!matcher.exec(parsedUrl.href);
            }
            function isResourceUrlAllowedByPolicy(url) {
                var i, n, parsedUrl = urlResolve(url.toString()), allowed = !1;
                for (i = 0, n = resourceUrlWhitelist.length; n > i; i++) if (matchUrl(resourceUrlWhitelist[i], parsedUrl)) {
                    allowed = !0;
                    break;
                }
                if (allowed) for (i = 0, n = resourceUrlBlacklist.length; n > i; i++) if (matchUrl(resourceUrlBlacklist[i], parsedUrl)) {
                    allowed = !1;
                    break;
                }
                return allowed;
            }
            function generateHolderType(Base) {
                var holderType = function(trustedValue) {
                    this.$$unwrapTrustedValue = function() {
                        return trustedValue;
                    };
                };
                return Base && (holderType.prototype = new Base()), holderType.prototype.valueOf = function() {
                    return this.$$unwrapTrustedValue();
                }, holderType.prototype.toString = function() {
                    return this.$$unwrapTrustedValue().toString();
                }, holderType;
            }
            function trustAs(type, trustedValue) {
                var Constructor = byType.hasOwnProperty(type) ? byType[type] : null;
                if (!Constructor) throw $sceMinErr("icontext", "Attempted to trust a value in invalid context. Context: {0}; Value: {1}", type, trustedValue);
                if (null === trustedValue || trustedValue === undefined || "" === trustedValue) return trustedValue;
                if ("string" != typeof trustedValue) throw $sceMinErr("itype", "Attempted to trust a non-string value in a content requiring a string: Context: {0}", type);
                return new Constructor(trustedValue);
            }
            function valueOf(maybeTrusted) {
                return maybeTrusted instanceof trustedValueHolderBase ? maybeTrusted.$$unwrapTrustedValue() : maybeTrusted;
            }
            function getTrusted(type, maybeTrusted) {
                if (null === maybeTrusted || maybeTrusted === undefined || "" === maybeTrusted) return maybeTrusted;
                var constructor = byType.hasOwnProperty(type) ? byType[type] : null;
                if (constructor && maybeTrusted instanceof constructor) return maybeTrusted.$$unwrapTrustedValue();
                if (type === SCE_CONTEXTS.RESOURCE_URL) {
                    if (isResourceUrlAllowedByPolicy(maybeTrusted)) return maybeTrusted;
                    throw $sceMinErr("insecurl", "Blocked loading resource from url not allowed by $sceDelegate policy.  URL: {0}", maybeTrusted.toString());
                }
                if (type === SCE_CONTEXTS.HTML) return htmlSanitizer(maybeTrusted);
                throw $sceMinErr("unsafe", "Attempting to use an unsafe value in a safe context.");
            }
            var htmlSanitizer = function() {
                throw $sceMinErr("unsafe", "Attempting to use an unsafe value in a safe context.");
            };
            $injector.has("$sanitize") && (htmlSanitizer = $injector.get("$sanitize"));
            var trustedValueHolderBase = generateHolderType(), byType = {};
            return byType[SCE_CONTEXTS.HTML] = generateHolderType(trustedValueHolderBase), byType[SCE_CONTEXTS.CSS] = generateHolderType(trustedValueHolderBase), 
            byType[SCE_CONTEXTS.URL] = generateHolderType(trustedValueHolderBase), byType[SCE_CONTEXTS.JS] = generateHolderType(trustedValueHolderBase), 
            byType[SCE_CONTEXTS.RESOURCE_URL] = generateHolderType(byType[SCE_CONTEXTS.URL]), 
            {
                trustAs: trustAs,
                getTrusted: getTrusted,
                valueOf: valueOf
            };
        } ];
    }
    function $SceProvider() {
        var enabled = !0;
        this.enabled = function(value) {
            return arguments.length && (enabled = !!value), enabled;
        }, this.$get = [ "$parse", "$document", "$sceDelegate", function($parse, $document, $sceDelegate) {
            if (enabled && msie) {
                var documentMode = $document[0].documentMode;
                if (documentMode !== undefined && 8 > documentMode) throw $sceMinErr("iequirks", "Strict Contextual Escaping does not support Internet Explorer version < 9 in quirks mode.  You can fix this by adding the text <!doctype html> to the top of your HTML document.  See http://docs.angularjs.org/api/ng.$sce for more information.");
            }
            var sce = copy(SCE_CONTEXTS);
            sce.isEnabled = function() {
                return enabled;
            }, sce.trustAs = $sceDelegate.trustAs, sce.getTrusted = $sceDelegate.getTrusted, 
            sce.valueOf = $sceDelegate.valueOf, enabled || (sce.trustAs = sce.getTrusted = function(type, value) {
                return value;
            }, sce.valueOf = identity), sce.parseAs = function(type, expr) {
                var parsed = $parse(expr);
                return parsed.literal && parsed.constant ? parsed : function(self, locals) {
                    return sce.getTrusted(type, parsed(self, locals));
                };
            };
            var parse = sce.parseAs, getTrusted = sce.getTrusted, trustAs = sce.trustAs;
            return forEach(SCE_CONTEXTS, function(enumValue, name) {
                var lName = lowercase(name);
                sce[camelCase("parse_as_" + lName)] = function(expr) {
                    return parse(enumValue, expr);
                }, sce[camelCase("get_trusted_" + lName)] = function(value) {
                    return getTrusted(enumValue, value);
                }, sce[camelCase("trust_as_" + lName)] = function(value) {
                    return trustAs(enumValue, value);
                };
            }), sce;
        } ];
    }
    function $SnifferProvider() {
        this.$get = [ "$window", "$document", function($window, $document) {
            var vendorPrefix, match, eventSupport = {}, android = int((/android (\d+)/.exec(lowercase(($window.navigator || {}).userAgent)) || [])[1]), boxee = /Boxee/i.test(($window.navigator || {}).userAgent), document = $document[0] || {}, vendorRegex = /^(Moz|webkit|O|ms)(?=[A-Z])/, bodyStyle = document.body && document.body.style, transitions = !1, animations = !1;
            if (bodyStyle) {
                for (var prop in bodyStyle) if (match = vendorRegex.exec(prop)) {
                    vendorPrefix = match[0], vendorPrefix = vendorPrefix.substr(0, 1).toUpperCase() + vendorPrefix.substr(1);
                    break;
                }
                vendorPrefix || (vendorPrefix = "WebkitOpacity" in bodyStyle && "webkit"), transitions = !!("transition" in bodyStyle || vendorPrefix + "Transition" in bodyStyle), 
                animations = !!("animation" in bodyStyle || vendorPrefix + "Animation" in bodyStyle), 
                !android || transitions && animations || (transitions = isString(document.body.style.webkitTransition), 
                animations = isString(document.body.style.webkitAnimation));
            }
            return {
                history: !(!$window.history || !$window.history.pushState || 4 > android || boxee),
                hashchange: "onhashchange" in $window && (!document.documentMode || document.documentMode > 7),
                hasEvent: function(event) {
                    if ("input" == event && 9 == msie) return !1;
                    if (isUndefined(eventSupport[event])) {
                        var divElm = document.createElement("div");
                        eventSupport[event] = "on" + event in divElm;
                    }
                    return eventSupport[event];
                },
                csp: csp(),
                vendorPrefix: vendorPrefix,
                transitions: transitions,
                animations: animations,
                msie: msie
            };
        } ];
    }
    function $TimeoutProvider() {
        this.$get = [ "$rootScope", "$browser", "$q", "$exceptionHandler", function($rootScope, $browser, $q, $exceptionHandler) {
            function timeout(fn, delay, invokeApply) {
                var timeoutId, deferred = $q.defer(), promise = deferred.promise, skipApply = isDefined(invokeApply) && !invokeApply;
                return timeoutId = $browser.defer(function() {
                    try {
                        deferred.resolve(fn());
                    } catch (e) {
                        deferred.reject(e), $exceptionHandler(e);
                    } finally {
                        delete deferreds[promise.$$timeoutId];
                    }
                    skipApply || $rootScope.$apply();
                }, delay), promise.$$timeoutId = timeoutId, deferreds[timeoutId] = deferred, promise;
            }
            var deferreds = {};
            return timeout.cancel = function(promise) {
                return promise && promise.$$timeoutId in deferreds ? (deferreds[promise.$$timeoutId].reject("canceled"), 
                delete deferreds[promise.$$timeoutId], $browser.defer.cancel(promise.$$timeoutId)) : !1;
            }, timeout;
        } ];
    }
    function urlResolve(url) {
        var href = url;
        return msie && (urlParsingNode.setAttribute("href", href), href = urlParsingNode.href), 
        urlParsingNode.setAttribute("href", href), {
            href: urlParsingNode.href,
            protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, "") : "",
            host: urlParsingNode.host,
            search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, "") : "",
            hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, "") : "",
            hostname: urlParsingNode.hostname,
            port: urlParsingNode.port,
            pathname: urlParsingNode.pathname && "/" === urlParsingNode.pathname.charAt(0) ? urlParsingNode.pathname : "/" + urlParsingNode.pathname
        };
    }
    function urlIsSameOrigin(requestUrl) {
        var parsed = isString(requestUrl) ? urlResolve(requestUrl) : requestUrl;
        return parsed.protocol === originUrl.protocol && parsed.host === originUrl.host;
    }
    function $WindowProvider() {
        this.$get = valueFn(window);
    }
    function $FilterProvider($provide) {
        function register(name, factory) {
            if (isObject(name)) {
                var filters = {};
                return forEach(name, function(filter, key) {
                    filters[key] = register(key, filter);
                }), filters;
            }
            return $provide.factory(name + suffix, factory);
        }
        var suffix = "Filter";
        this.register = register, this.$get = [ "$injector", function($injector) {
            return function(name) {
                return $injector.get(name + suffix);
            };
        } ], register("currency", currencyFilter), register("date", dateFilter), register("filter", filterFilter), 
        register("json", jsonFilter), register("limitTo", limitToFilter), register("lowercase", lowercaseFilter), 
        register("number", numberFilter), register("orderBy", orderByFilter), register("uppercase", uppercaseFilter);
    }
    function filterFilter() {
        return function(array, expression, comparator) {
            if (!isArray(array)) return array;
            var comparatorType = typeof comparator, predicates = [];
            predicates.check = function(value) {
                for (var j = 0; j < predicates.length; j++) if (!predicates[j](value)) return !1;
                return !0;
            }, "function" !== comparatorType && (comparator = "boolean" === comparatorType && comparator ? function(obj, text) {
                return angular.equals(obj, text);
            } : function(obj, text) {
                return text = ("" + text).toLowerCase(), ("" + obj).toLowerCase().indexOf(text) > -1;
            });
            var search = function(obj, text) {
                if ("string" == typeof text && "!" === text.charAt(0)) return !search(obj, text.substr(1));
                switch (typeof obj) {
                  case "boolean":
                  case "number":
                  case "string":
                    return comparator(obj, text);

                  case "object":
                    switch (typeof text) {
                      case "object":
                        return comparator(obj, text);

                      default:
                        for (var objKey in obj) if ("$" !== objKey.charAt(0) && search(obj[objKey], text)) return !0;
                    }
                    return !1;

                  case "array":
                    for (var i = 0; i < obj.length; i++) if (search(obj[i], text)) return !0;
                    return !1;

                  default:
                    return !1;
                }
            };
            switch (typeof expression) {
              case "boolean":
              case "number":
              case "string":
                expression = {
                    $: expression
                };

              case "object":
                for (var key in expression) "$" == key ? !function() {
                    if (expression[key]) {
                        var path = key;
                        predicates.push(function(value) {
                            return search(value, expression[path]);
                        });
                    }
                }() : !function() {
                    if ("undefined" != typeof expression[key]) {
                        var path = key;
                        predicates.push(function(value) {
                            return search(getter(value, path), expression[path]);
                        });
                    }
                }();
                break;

              case "function":
                predicates.push(expression);
                break;

              default:
                return array;
            }
            for (var filtered = [], j = 0; j < array.length; j++) {
                var value = array[j];
                predicates.check(value) && filtered.push(value);
            }
            return filtered;
        };
    }
    function currencyFilter($locale) {
        var formats = $locale.NUMBER_FORMATS;
        return function(amount, currencySymbol) {
            return isUndefined(currencySymbol) && (currencySymbol = formats.CURRENCY_SYM), formatNumber(amount, formats.PATTERNS[1], formats.GROUP_SEP, formats.DECIMAL_SEP, 2).replace(/\u00A4/g, currencySymbol);
        };
    }
    function numberFilter($locale) {
        var formats = $locale.NUMBER_FORMATS;
        return function(number, fractionSize) {
            return formatNumber(number, formats.PATTERNS[0], formats.GROUP_SEP, formats.DECIMAL_SEP, fractionSize);
        };
    }
    function formatNumber(number, pattern, groupSep, decimalSep, fractionSize) {
        if (isNaN(number) || !isFinite(number)) return "";
        var isNegative = 0 > number;
        number = Math.abs(number);
        var numStr = number + "", formatedText = "", parts = [], hasExponent = !1;
        if (-1 !== numStr.indexOf("e")) {
            var match = numStr.match(/([\d\.]+)e(-?)(\d+)/);
            match && "-" == match[2] && match[3] > fractionSize + 1 ? numStr = "0" : (formatedText = numStr, 
            hasExponent = !0);
        }
        if (hasExponent) fractionSize > 0 && number > -1 && 1 > number && (formatedText = number.toFixed(fractionSize)); else {
            var fractionLen = (numStr.split(DECIMAL_SEP)[1] || "").length;
            isUndefined(fractionSize) && (fractionSize = Math.min(Math.max(pattern.minFrac, fractionLen), pattern.maxFrac));
            var pow = Math.pow(10, fractionSize);
            number = Math.round(number * pow) / pow;
            var fraction = ("" + number).split(DECIMAL_SEP), whole = fraction[0];
            fraction = fraction[1] || "";
            var i, pos = 0, lgroup = pattern.lgSize, group = pattern.gSize;
            if (whole.length >= lgroup + group) for (pos = whole.length - lgroup, i = 0; pos > i; i++) (pos - i) % group === 0 && 0 !== i && (formatedText += groupSep), 
            formatedText += whole.charAt(i);
            for (i = pos; i < whole.length; i++) (whole.length - i) % lgroup === 0 && 0 !== i && (formatedText += groupSep), 
            formatedText += whole.charAt(i);
            for (;fraction.length < fractionSize; ) fraction += "0";
            fractionSize && "0" !== fractionSize && (formatedText += decimalSep + fraction.substr(0, fractionSize));
        }
        return parts.push(isNegative ? pattern.negPre : pattern.posPre), parts.push(formatedText), 
        parts.push(isNegative ? pattern.negSuf : pattern.posSuf), parts.join("");
    }
    function padNumber(num, digits, trim) {
        var neg = "";
        for (0 > num && (neg = "-", num = -num), num = "" + num; num.length < digits; ) num = "0" + num;
        return trim && (num = num.substr(num.length - digits)), neg + num;
    }
    function dateGetter(name, size, offset, trim) {
        return offset = offset || 0, function(date) {
            var value = date["get" + name]();
            return (offset > 0 || value > -offset) && (value += offset), 0 === value && -12 == offset && (value = 12), 
            padNumber(value, size, trim);
        };
    }
    function dateStrGetter(name, shortForm) {
        return function(date, formats) {
            var value = date["get" + name](), get = uppercase(shortForm ? "SHORT" + name : name);
            return formats[get][value];
        };
    }
    function timeZoneGetter(date) {
        var zone = -1 * date.getTimezoneOffset(), paddedZone = zone >= 0 ? "+" : "";
        return paddedZone += padNumber(Math[zone > 0 ? "floor" : "ceil"](zone / 60), 2) + padNumber(Math.abs(zone % 60), 2);
    }
    function ampmGetter(date, formats) {
        return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1];
    }
    function dateFilter($locale) {
        function jsonStringToDate(string) {
            var match;
            if (match = string.match(R_ISO8601_STR)) {
                var date = new Date(0), tzHour = 0, tzMin = 0, dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear, timeSetter = match[8] ? date.setUTCHours : date.setHours;
                match[9] && (tzHour = int(match[9] + match[10]), tzMin = int(match[9] + match[11])), 
                dateSetter.call(date, int(match[1]), int(match[2]) - 1, int(match[3]));
                var h = int(match[4] || 0) - tzHour, m = int(match[5] || 0) - tzMin, s = int(match[6] || 0), ms = Math.round(1e3 * parseFloat("0." + (match[7] || 0)));
                return timeSetter.call(date, h, m, s, ms), date;
            }
            return string;
        }
        var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
        return function(date, format) {
            var fn, match, text = "", parts = [];
            if (format = format || "mediumDate", format = $locale.DATETIME_FORMATS[format] || format, 
            isString(date) && (date = NUMBER_STRING.test(date) ? int(date) : jsonStringToDate(date)), 
            isNumber(date) && (date = new Date(date)), !isDate(date)) return date;
            for (;format; ) match = DATE_FORMATS_SPLIT.exec(format), match ? (parts = concat(parts, match, 1), 
            format = parts.pop()) : (parts.push(format), format = null);
            return forEach(parts, function(value) {
                fn = DATE_FORMATS[value], text += fn ? fn(date, $locale.DATETIME_FORMATS) : value.replace(/(^'|'$)/g, "").replace(/''/g, "'");
            }), text;
        };
    }
    function jsonFilter() {
        return function(object) {
            return toJson(object, !0);
        };
    }
    function limitToFilter() {
        return function(input, limit) {
            if (!isArray(input) && !isString(input)) return input;
            if (limit = int(limit), isString(input)) return limit ? limit >= 0 ? input.slice(0, limit) : input.slice(limit, input.length) : "";
            var i, n, out = [];
            for (limit > input.length ? limit = input.length : limit < -input.length && (limit = -input.length), 
            limit > 0 ? (i = 0, n = limit) : (i = input.length + limit, n = input.length); n > i; i++) out.push(input[i]);
            return out;
        };
    }
    function orderByFilter($parse) {
        return function(array, sortPredicate, reverseOrder) {
            function comparator(o1, o2) {
                for (var i = 0; i < sortPredicate.length; i++) {
                    var comp = sortPredicate[i](o1, o2);
                    if (0 !== comp) return comp;
                }
                return 0;
            }
            function reverseComparator(comp, descending) {
                return toBoolean(descending) ? function(a, b) {
                    return comp(b, a);
                } : comp;
            }
            function compare(v1, v2) {
                var t1 = typeof v1, t2 = typeof v2;
                return t1 == t2 ? ("string" == t1 && (v1 = v1.toLowerCase(), v2 = v2.toLowerCase()), 
                v1 === v2 ? 0 : v2 > v1 ? -1 : 1) : t2 > t1 ? -1 : 1;
            }
            if (!isArray(array)) return array;
            if (!sortPredicate) return array;
            sortPredicate = isArray(sortPredicate) ? sortPredicate : [ sortPredicate ], sortPredicate = map(sortPredicate, function(predicate) {
                var descending = !1, get = predicate || identity;
                return isString(predicate) && (("+" == predicate.charAt(0) || "-" == predicate.charAt(0)) && (descending = "-" == predicate.charAt(0), 
                predicate = predicate.substring(1)), get = $parse(predicate)), reverseComparator(function(a, b) {
                    return compare(get(a), get(b));
                }, descending);
            });
            for (var arrayCopy = [], i = 0; i < array.length; i++) arrayCopy.push(array[i]);
            return arrayCopy.sort(reverseComparator(comparator, reverseOrder));
        };
    }
    function ngDirective(directive) {
        return isFunction(directive) && (directive = {
            link: directive
        }), directive.restrict = directive.restrict || "AC", valueFn(directive);
    }
    function FormController(element, attrs) {
        function toggleValidCss(isValid, validationErrorKey) {
            validationErrorKey = validationErrorKey ? "-" + snake_case(validationErrorKey, "-") : "", 
            element.removeClass((isValid ? INVALID_CLASS : VALID_CLASS) + validationErrorKey).addClass((isValid ? VALID_CLASS : INVALID_CLASS) + validationErrorKey);
        }
        var form = this, parentForm = element.parent().controller("form") || nullFormCtrl, invalidCount = 0, errors = form.$error = {}, controls = [];
        form.$name = attrs.name || attrs.ngForm, form.$dirty = !1, form.$pristine = !0, 
        form.$valid = !0, form.$invalid = !1, parentForm.$addControl(form), element.addClass(PRISTINE_CLASS), 
        toggleValidCss(!0), form.$addControl = function(control) {
            assertNotHasOwnProperty(control.$name, "input"), controls.push(control), control.$name && (form[control.$name] = control);
        }, form.$removeControl = function(control) {
            control.$name && form[control.$name] === control && delete form[control.$name], 
            forEach(errors, function(queue, validationToken) {
                form.$setValidity(validationToken, !0, control);
            }), arrayRemove(controls, control);
        }, form.$setValidity = function(validationToken, isValid, control) {
            var queue = errors[validationToken];
            if (isValid) queue && (arrayRemove(queue, control), queue.length || (invalidCount--, 
            invalidCount || (toggleValidCss(isValid), form.$valid = !0, form.$invalid = !1), 
            errors[validationToken] = !1, toggleValidCss(!0, validationToken), parentForm.$setValidity(validationToken, !0, form))); else {
                if (invalidCount || toggleValidCss(isValid), queue) {
                    if (includes(queue, control)) return;
                } else errors[validationToken] = queue = [], invalidCount++, toggleValidCss(!1, validationToken), 
                parentForm.$setValidity(validationToken, !1, form);
                queue.push(control), form.$valid = !1, form.$invalid = !0;
            }
        }, form.$setDirty = function() {
            element.removeClass(PRISTINE_CLASS).addClass(DIRTY_CLASS), form.$dirty = !0, form.$pristine = !1, 
            parentForm.$setDirty();
        }, form.$setPristine = function() {
            element.removeClass(DIRTY_CLASS).addClass(PRISTINE_CLASS), form.$dirty = !1, form.$pristine = !0, 
            forEach(controls, function(control) {
                control.$setPristine();
            });
        };
    }
    function textInputType(scope, element, attr, ctrl, $sniffer, $browser) {
        var listener = function() {
            var value = element.val();
            toBoolean(attr.ngTrim || "T") && (value = trim(value)), ctrl.$viewValue !== value && scope.$apply(function() {
                ctrl.$setViewValue(value);
            });
        };
        if ($sniffer.hasEvent("input")) element.on("input", listener); else {
            var timeout, deferListener = function() {
                timeout || (timeout = $browser.defer(function() {
                    listener(), timeout = null;
                }));
            };
            element.on("keydown", function(event) {
                var key = event.keyCode;
                91 === key || key > 15 && 19 > key || key >= 37 && 40 >= key || deferListener();
            }), element.on("change", listener), $sniffer.hasEvent("paste") && element.on("paste cut", deferListener);
        }
        ctrl.$render = function() {
            element.val(ctrl.$isEmpty(ctrl.$viewValue) ? "" : ctrl.$viewValue);
        };
        var patternValidator, match, pattern = attr.ngPattern, validate = function(regexp, value) {
            return ctrl.$isEmpty(value) || regexp.test(value) ? (ctrl.$setValidity("pattern", !0), 
            value) : (ctrl.$setValidity("pattern", !1), undefined);
        };
        if (pattern && (match = pattern.match(/^\/(.*)\/([gim]*)$/), match ? (pattern = new RegExp(match[1], match[2]), 
        patternValidator = function(value) {
            return validate(pattern, value);
        }) : patternValidator = function(value) {
            var patternObj = scope.$eval(pattern);
            if (!patternObj || !patternObj.test) throw minErr("ngPattern")("noregexp", "Expected {0} to be a RegExp but was {1}. Element: {2}", pattern, patternObj, startingTag(element));
            return validate(patternObj, value);
        }, ctrl.$formatters.push(patternValidator), ctrl.$parsers.push(patternValidator)), 
        attr.ngMinlength) {
            var minlength = int(attr.ngMinlength), minLengthValidator = function(value) {
                return !ctrl.$isEmpty(value) && value.length < minlength ? (ctrl.$setValidity("minlength", !1), 
                undefined) : (ctrl.$setValidity("minlength", !0), value);
            };
            ctrl.$parsers.push(minLengthValidator), ctrl.$formatters.push(minLengthValidator);
        }
        if (attr.ngMaxlength) {
            var maxlength = int(attr.ngMaxlength), maxLengthValidator = function(value) {
                return !ctrl.$isEmpty(value) && value.length > maxlength ? (ctrl.$setValidity("maxlength", !1), 
                undefined) : (ctrl.$setValidity("maxlength", !0), value);
            };
            ctrl.$parsers.push(maxLengthValidator), ctrl.$formatters.push(maxLengthValidator);
        }
    }
    function numberInputType(scope, element, attr, ctrl, $sniffer, $browser) {
        if (textInputType(scope, element, attr, ctrl, $sniffer, $browser), ctrl.$parsers.push(function(value) {
            var empty = ctrl.$isEmpty(value);
            return empty || NUMBER_REGEXP.test(value) ? (ctrl.$setValidity("number", !0), "" === value ? null : empty ? value : parseFloat(value)) : (ctrl.$setValidity("number", !1), 
            undefined);
        }), ctrl.$formatters.push(function(value) {
            return ctrl.$isEmpty(value) ? "" : "" + value;
        }), attr.min) {
            var minValidator = function(value) {
                var min = parseFloat(attr.min);
                return !ctrl.$isEmpty(value) && min > value ? (ctrl.$setValidity("min", !1), undefined) : (ctrl.$setValidity("min", !0), 
                value);
            };
            ctrl.$parsers.push(minValidator), ctrl.$formatters.push(minValidator);
        }
        if (attr.max) {
            var maxValidator = function(value) {
                var max = parseFloat(attr.max);
                return !ctrl.$isEmpty(value) && value > max ? (ctrl.$setValidity("max", !1), undefined) : (ctrl.$setValidity("max", !0), 
                value);
            };
            ctrl.$parsers.push(maxValidator), ctrl.$formatters.push(maxValidator);
        }
        ctrl.$formatters.push(function(value) {
            return ctrl.$isEmpty(value) || isNumber(value) ? (ctrl.$setValidity("number", !0), 
            value) : (ctrl.$setValidity("number", !1), undefined);
        });
    }
    function urlInputType(scope, element, attr, ctrl, $sniffer, $browser) {
        textInputType(scope, element, attr, ctrl, $sniffer, $browser);
        var urlValidator = function(value) {
            return ctrl.$isEmpty(value) || URL_REGEXP.test(value) ? (ctrl.$setValidity("url", !0), 
            value) : (ctrl.$setValidity("url", !1), undefined);
        };
        ctrl.$formatters.push(urlValidator), ctrl.$parsers.push(urlValidator);
    }
    function emailInputType(scope, element, attr, ctrl, $sniffer, $browser) {
        textInputType(scope, element, attr, ctrl, $sniffer, $browser);
        var emailValidator = function(value) {
            return ctrl.$isEmpty(value) || EMAIL_REGEXP.test(value) ? (ctrl.$setValidity("email", !0), 
            value) : (ctrl.$setValidity("email", !1), undefined);
        };
        ctrl.$formatters.push(emailValidator), ctrl.$parsers.push(emailValidator);
    }
    function radioInputType(scope, element, attr, ctrl) {
        isUndefined(attr.name) && element.attr("name", nextUid()), element.on("click", function() {
            element[0].checked && scope.$apply(function() {
                ctrl.$setViewValue(attr.value);
            });
        }), ctrl.$render = function() {
            var value = attr.value;
            element[0].checked = value == ctrl.$viewValue;
        }, attr.$observe("value", ctrl.$render);
    }
    function checkboxInputType(scope, element, attr, ctrl) {
        var trueValue = attr.ngTrueValue, falseValue = attr.ngFalseValue;
        isString(trueValue) || (trueValue = !0), isString(falseValue) || (falseValue = !1), 
        element.on("click", function() {
            scope.$apply(function() {
                ctrl.$setViewValue(element[0].checked);
            });
        }), ctrl.$render = function() {
            element[0].checked = ctrl.$viewValue;
        }, ctrl.$isEmpty = function(value) {
            return value !== trueValue;
        }, ctrl.$formatters.push(function(value) {
            return value === trueValue;
        }), ctrl.$parsers.push(function(value) {
            return value ? trueValue : falseValue;
        });
    }
    function classDirective(name, selector) {
        return name = "ngClass" + name, function() {
            return {
                restrict: "AC",
                link: function(scope, element, attr) {
                    function ngClassWatchAction(newVal) {
                        (selector === !0 || scope.$index % 2 === selector) && (oldVal && !equals(newVal, oldVal) && removeClass(oldVal), 
                        addClass(newVal)), oldVal = copy(newVal);
                    }
                    function removeClass(classVal) {
                        attr.$removeClass(flattenClasses(classVal));
                    }
                    function addClass(classVal) {
                        attr.$addClass(flattenClasses(classVal));
                    }
                    function flattenClasses(classVal) {
                        if (isArray(classVal)) return classVal.join(" ");
                        if (isObject(classVal)) {
                            var classes = [];
                            return forEach(classVal, function(v, k) {
                                v && classes.push(k);
                            }), classes.join(" ");
                        }
                        return classVal;
                    }
                    var oldVal;
                    scope.$watch(attr[name], ngClassWatchAction, !0), attr.$observe("class", function() {
                        ngClassWatchAction(scope.$eval(attr[name]));
                    }), "ngClass" !== name && scope.$watch("$index", function($index, old$index) {
                        var mod = 1 & $index;
                        mod !== old$index & 1 && (mod === selector ? addClass(scope.$eval(attr[name])) : removeClass(scope.$eval(attr[name])));
                    });
                }
            };
        };
    }
    var lowercase = function(string) {
        return isString(string) ? string.toLowerCase() : string;
    }, uppercase = function(string) {
        return isString(string) ? string.toUpperCase() : string;
    }, manualLowercase = function(s) {
        return isString(s) ? s.replace(/[A-Z]/g, function(ch) {
            return String.fromCharCode(32 | ch.charCodeAt(0));
        }) : s;
    }, manualUppercase = function(s) {
        return isString(s) ? s.replace(/[a-z]/g, function(ch) {
            return String.fromCharCode(-33 & ch.charCodeAt(0));
        }) : s;
    };
    "i" !== "I".toLowerCase() && (lowercase = manualLowercase, uppercase = manualUppercase);
    var msie, jqLite, jQuery, angularModule, nodeName_, slice = [].slice, push = [].push, toString = Object.prototype.toString, ngMinErr = minErr("ng"), angular = (window.angular, 
    window.angular || (window.angular = {})), uid = [ "0", "0", "0" ];
    msie = int((/msie (\d+)/.exec(lowercase(navigator.userAgent)) || [])[1]), isNaN(msie) && (msie = int((/trident\/.*; rv:(\d+)/.exec(lowercase(navigator.userAgent)) || [])[1])), 
    noop.$inject = [], identity.$inject = [];
    var trim = function() {
        return String.prototype.trim ? function(value) {
            return isString(value) ? value.trim() : value;
        } : function(value) {
            return isString(value) ? value.replace(/^\s*/, "").replace(/\s*$/, "") : value;
        };
    }();
    nodeName_ = 9 > msie ? function(element) {
        return element = element.nodeName ? element : element[0], element.scopeName && "HTML" != element.scopeName ? uppercase(element.scopeName + ":" + element.nodeName) : element.nodeName;
    } : function(element) {
        return element.nodeName ? element.nodeName : element[0].nodeName;
    };
    var SNAKE_CASE_REGEXP = /[A-Z]/g, version = {
        full: "1.2.0",
        major: 1,
        minor: "NG_VERSION_MINOR",
        dot: 0,
        codeName: "timely-delivery"
    }, jqCache = JQLite.cache = {}, jqName = JQLite.expando = "ng-" + new Date().getTime(), jqId = 1, addEventListenerFn = window.document.addEventListener ? function(element, type, fn) {
        element.addEventListener(type, fn, !1);
    } : function(element, type, fn) {
        element.attachEvent("on" + type, fn);
    }, removeEventListenerFn = window.document.removeEventListener ? function(element, type, fn) {
        element.removeEventListener(type, fn, !1);
    } : function(element, type, fn) {
        element.detachEvent("on" + type, fn);
    }, SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g, MOZ_HACK_REGEXP = /^moz([A-Z])/, jqLiteMinErr = minErr("jqLite"), JQLitePrototype = JQLite.prototype = {
        ready: function(fn) {
            function trigger() {
                fired || (fired = !0, fn());
            }
            var fired = !1;
            "complete" === document.readyState ? setTimeout(trigger) : (this.on("DOMContentLoaded", trigger), 
            JQLite(window).on("load", trigger));
        },
        toString: function() {
            var value = [];
            return forEach(this, function(e) {
                value.push("" + e);
            }), "[" + value.join(", ") + "]";
        },
        eq: function(index) {
            return index >= 0 ? jqLite(this[index]) : jqLite(this[this.length + index]);
        },
        length: 0,
        push: push,
        sort: [].sort,
        splice: [].splice
    }, BOOLEAN_ATTR = {};
    forEach("multiple,selected,checked,disabled,readOnly,required,open".split(","), function(value) {
        BOOLEAN_ATTR[lowercase(value)] = value;
    });
    var BOOLEAN_ELEMENTS = {};
    forEach("input,select,option,textarea,button,form,details".split(","), function(value) {
        BOOLEAN_ELEMENTS[uppercase(value)] = !0;
    }), forEach({
        data: jqLiteData,
        inheritedData: jqLiteInheritedData,
        scope: function(element) {
            return jqLite(element).data("$scope") || jqLiteInheritedData(element.parentNode || element, [ "$isolateScope", "$scope" ]);
        },
        isolateScope: function(element) {
            return jqLite(element).data("$isolateScope") || jqLite(element).data("$isolateScopeNoTemplate");
        },
        controller: jqLiteController,
        injector: function(element) {
            return jqLiteInheritedData(element, "$injector");
        },
        removeAttr: function(element, name) {
            element.removeAttribute(name);
        },
        hasClass: jqLiteHasClass,
        css: function(element, name, value) {
            if (name = camelCase(name), !isDefined(value)) {
                var val;
                return 8 >= msie && (val = element.currentStyle && element.currentStyle[name], "" === val && (val = "auto")), 
                val = val || element.style[name], 8 >= msie && (val = "" === val ? undefined : val), 
                val;
            }
            element.style[name] = value;
        },
        attr: function(element, name, value) {
            var lowercasedName = lowercase(name);
            if (BOOLEAN_ATTR[lowercasedName]) {
                if (!isDefined(value)) return element[name] || (element.attributes.getNamedItem(name) || noop).specified ? lowercasedName : undefined;
                value ? (element[name] = !0, element.setAttribute(name, lowercasedName)) : (element[name] = !1, 
                element.removeAttribute(lowercasedName));
            } else if (isDefined(value)) element.setAttribute(name, value); else if (element.getAttribute) {
                var ret = element.getAttribute(name, 2);
                return null === ret ? undefined : ret;
            }
        },
        prop: function(element, name, value) {
            return isDefined(value) ? (element[name] = value, void 0) : element[name];
        },
        text: function() {
            function getText(element, value) {
                var textProp = NODE_TYPE_TEXT_PROPERTY[element.nodeType];
                return isUndefined(value) ? textProp ? element[textProp] : "" : (element[textProp] = value, 
                void 0);
            }
            var NODE_TYPE_TEXT_PROPERTY = [];
            return 9 > msie ? (NODE_TYPE_TEXT_PROPERTY[1] = "innerText", NODE_TYPE_TEXT_PROPERTY[3] = "nodeValue") : NODE_TYPE_TEXT_PROPERTY[1] = NODE_TYPE_TEXT_PROPERTY[3] = "textContent", 
            getText.$dv = "", getText;
        }(),
        val: function(element, value) {
            if (isUndefined(value)) {
                if ("SELECT" === nodeName_(element) && element.multiple) {
                    var result = [];
                    return forEach(element.options, function(option) {
                        option.selected && result.push(option.value || option.text);
                    }), 0 === result.length ? null : result;
                }
                return element.value;
            }
            element.value = value;
        },
        html: function(element, value) {
            if (isUndefined(value)) return element.innerHTML;
            for (var i = 0, childNodes = element.childNodes; i < childNodes.length; i++) jqLiteDealoc(childNodes[i]);
            element.innerHTML = value;
        }
    }, function(fn, name) {
        JQLite.prototype[name] = function(arg1, arg2) {
            var i, key;
            if ((2 == fn.length && fn !== jqLiteHasClass && fn !== jqLiteController ? arg1 : arg2) === undefined) {
                if (isObject(arg1)) {
                    for (i = 0; i < this.length; i++) if (fn === jqLiteData) fn(this[i], arg1); else for (key in arg1) fn(this[i], key, arg1[key]);
                    return this;
                }
                for (var value = fn.$dv, jj = value === undefined ? Math.min(this.length, 1) : this.length, j = 0; jj > j; j++) {
                    var nodeValue = fn(this[j], arg1, arg2);
                    value = value ? value + nodeValue : nodeValue;
                }
                return value;
            }
            for (i = 0; i < this.length; i++) fn(this[i], arg1, arg2);
            return this;
        };
    }), forEach({
        removeData: jqLiteRemoveData,
        dealoc: jqLiteDealoc,
        on: function onFn(element, type, fn, unsupported) {
            if (isDefined(unsupported)) throw jqLiteMinErr("onargs", "jqLite#on() does not support the `selector` or `eventData` parameters");
            var events = jqLiteExpandoStore(element, "events"), handle = jqLiteExpandoStore(element, "handle");
            events || jqLiteExpandoStore(element, "events", events = {}), handle || jqLiteExpandoStore(element, "handle", handle = createEventHandler(element, events)), 
            forEach(type.split(" "), function(type) {
                var eventFns = events[type];
                if (!eventFns) {
                    if ("mouseenter" == type || "mouseleave" == type) {
                        var contains = document.body.contains || document.body.compareDocumentPosition ? function(a, b) {
                            var adown = 9 === a.nodeType ? a.documentElement : a, bup = b && b.parentNode;
                            return a === bup || !(!bup || 1 !== bup.nodeType || !(adown.contains ? adown.contains(bup) : a.compareDocumentPosition && 16 & a.compareDocumentPosition(bup)));
                        } : function(a, b) {
                            if (b) for (;b = b.parentNode; ) if (b === a) return !0;
                            return !1;
                        };
                        events[type] = [];
                        var eventmap = {
                            mouseleave: "mouseout",
                            mouseenter: "mouseover"
                        };
                        onFn(element, eventmap[type], function(event) {
                            var target = this, related = event.relatedTarget;
                            (!related || related !== target && !contains(target, related)) && handle(event, type);
                        });
                    } else addEventListenerFn(element, type, handle), events[type] = [];
                    eventFns = events[type];
                }
                eventFns.push(fn);
            });
        },
        off: jqLiteOff,
        replaceWith: function(element, replaceNode) {
            var index, parent = element.parentNode;
            jqLiteDealoc(element), forEach(new JQLite(replaceNode), function(node) {
                index ? parent.insertBefore(node, index.nextSibling) : parent.replaceChild(node, element), 
                index = node;
            });
        },
        children: function(element) {
            var children = [];
            return forEach(element.childNodes, function(element) {
                1 === element.nodeType && children.push(element);
            }), children;
        },
        contents: function(element) {
            return element.childNodes || [];
        },
        append: function(element, node) {
            forEach(new JQLite(node), function(child) {
                (1 === element.nodeType || 11 === element.nodeType) && element.appendChild(child);
            });
        },
        prepend: function(element, node) {
            if (1 === element.nodeType) {
                var index = element.firstChild;
                forEach(new JQLite(node), function(child) {
                    element.insertBefore(child, index);
                });
            }
        },
        wrap: function(element, wrapNode) {
            wrapNode = jqLite(wrapNode)[0];
            var parent = element.parentNode;
            parent && parent.replaceChild(wrapNode, element), wrapNode.appendChild(element);
        },
        remove: function(element) {
            jqLiteDealoc(element);
            var parent = element.parentNode;
            parent && parent.removeChild(element);
        },
        after: function(element, newElement) {
            var index = element, parent = element.parentNode;
            forEach(new JQLite(newElement), function(node) {
                parent.insertBefore(node, index.nextSibling), index = node;
            });
        },
        addClass: jqLiteAddClass,
        removeClass: jqLiteRemoveClass,
        toggleClass: function(element, selector, condition) {
            isUndefined(condition) && (condition = !jqLiteHasClass(element, selector)), (condition ? jqLiteAddClass : jqLiteRemoveClass)(element, selector);
        },
        parent: function(element) {
            var parent = element.parentNode;
            return parent && 11 !== parent.nodeType ? parent : null;
        },
        next: function(element) {
            if (element.nextElementSibling) return element.nextElementSibling;
            for (var elm = element.nextSibling; null != elm && 1 !== elm.nodeType; ) elm = elm.nextSibling;
            return elm;
        },
        find: function(element, selector) {
            return element.getElementsByTagName(selector);
        },
        clone: jqLiteClone,
        triggerHandler: function(element, eventName, eventData) {
            var eventFns = (jqLiteExpandoStore(element, "events") || {})[eventName];
            eventData = eventData || [];
            var event = [ {
                preventDefault: noop,
                stopPropagation: noop
            } ];
            forEach(eventFns, function(fn) {
                fn.apply(element, event.concat(eventData));
            });
        }
    }, function(fn, name) {
        JQLite.prototype[name] = function(arg1, arg2, arg3) {
            for (var value, i = 0; i < this.length; i++) isUndefined(value) ? (value = fn(this[i], arg1, arg2, arg3), 
            isDefined(value) && (value = jqLite(value))) : jqLiteAddNodes(value, fn(this[i], arg1, arg2, arg3));
            return isDefined(value) ? value : this;
        }, JQLite.prototype.bind = JQLite.prototype.on, JQLite.prototype.unbind = JQLite.prototype.off;
    }), HashMap.prototype = {
        put: function(key, value) {
            this[hashKey(key)] = value;
        },
        get: function(key) {
            return this[hashKey(key)];
        },
        remove: function(key) {
            var value = this[key = hashKey(key)];
            return delete this[key], value;
        }
    };
    var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m, FN_ARG_SPLIT = /,/, FN_ARG = /^\s*(_?)(\S+?)\1\s*$/, STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm, $injectorMinErr = minErr("$injector"), $animateMinErr = minErr("$animate"), $AnimateProvider = [ "$provide", function($provide) {
        this.$$selectors = {}, this.register = function(name, factory) {
            var key = name + "-animation";
            if (name && "." != name.charAt(0)) throw $animateMinErr("notcsel", "Expecting class selector starting with '.' got '{0}'.", name);
            this.$$selectors[name.substr(1)] = key, $provide.factory(key, factory);
        }, this.$get = [ "$timeout", function($timeout) {
            return {
                enter: function(element, parent, after, done) {
                    var afterNode = after && after[after.length - 1], parentNode = parent && parent[0] || afterNode && afterNode.parentNode, afterNextSibling = afterNode && afterNode.nextSibling || null;
                    forEach(element, function(node) {
                        parentNode.insertBefore(node, afterNextSibling);
                    }), done && $timeout(done, 0, !1);
                },
                leave: function(element, done) {
                    element.remove(), done && $timeout(done, 0, !1);
                },
                move: function(element, parent, after, done) {
                    this.enter(element, parent, after, done);
                },
                addClass: function(element, className, done) {
                    className = isString(className) ? className : isArray(className) ? className.join(" ") : "", 
                    forEach(element, function(element) {
                        jqLiteAddClass(element, className);
                    }), done && $timeout(done, 0, !1);
                },
                removeClass: function(element, className, done) {
                    className = isString(className) ? className : isArray(className) ? className.join(" ") : "", 
                    forEach(element, function(element) {
                        jqLiteRemoveClass(element, className);
                    }), done && $timeout(done, 0, !1);
                },
                enabled: noop
            };
        } ];
    } ], $compileMinErr = minErr("$compile");
    $CompileProvider.$inject = [ "$provide" ];
    var PREFIX_REGEXP = /^(x[\:\-_]|data[\:\-_])/i, XHR = window.XMLHttpRequest || function() {
        try {
            return new ActiveXObject("Msxml2.XMLHTTP.6.0");
        } catch (e1) {}
        try {
            return new ActiveXObject("Msxml2.XMLHTTP.3.0");
        } catch (e2) {}
        try {
            return new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e3) {}
        throw minErr("$httpBackend")("noxhr", "This browser does not support XMLHttpRequest.");
    }, $interpolateMinErr = minErr("$interpolate"), PATH_MATCH = /^([^\?#]*)(\?([^#]*))?(#(.*))?$/, DEFAULT_PORTS = {
        http: 80,
        https: 443,
        ftp: 21
    }, $locationMinErr = minErr("$location");
    LocationHashbangInHtml5Url.prototype = LocationHashbangUrl.prototype = LocationHtml5Url.prototype = {
        $$html5: !1,
        $$replace: !1,
        absUrl: locationGetter("$$absUrl"),
        url: function(url, replace) {
            if (isUndefined(url)) return this.$$url;
            var match = PATH_MATCH.exec(url);
            return match[1] && this.path(decodeURIComponent(match[1])), (match[2] || match[1]) && this.search(match[3] || ""), 
            this.hash(match[5] || "", replace), this;
        },
        protocol: locationGetter("$$protocol"),
        host: locationGetter("$$host"),
        port: locationGetter("$$port"),
        path: locationGetterSetter("$$path", function(path) {
            return "/" == path.charAt(0) ? path : "/" + path;
        }),
        search: function(search, paramValue) {
            switch (arguments.length) {
              case 0:
                return this.$$search;

              case 1:
                if (isString(search)) this.$$search = parseKeyValue(search); else {
                    if (!isObject(search)) throw $locationMinErr("isrcharg", "The first argument of the `$location#search()` call must be a string or an object.");
                    this.$$search = search;
                }
                break;

              default:
                isUndefined(paramValue) || null === paramValue ? delete this.$$search[search] : this.$$search[search] = paramValue;
            }
            return this.$$compose(), this;
        },
        hash: locationGetterSetter("$$hash", identity),
        replace: function() {
            return this.$$replace = !0, this;
        }
    };
    var promiseWarning, $parseMinErr = minErr("$parse"), promiseWarningCache = {}, OPERATORS = {
        "null": function() {
            return null;
        },
        "true": function() {
            return !0;
        },
        "false": function() {
            return !1;
        },
        undefined: noop,
        "+": function(self, locals, a, b) {
            return a = a(self, locals), b = b(self, locals), isDefined(a) ? isDefined(b) ? a + b : a : isDefined(b) ? b : undefined;
        },
        "-": function(self, locals, a, b) {
            return a = a(self, locals), b = b(self, locals), (isDefined(a) ? a : 0) - (isDefined(b) ? b : 0);
        },
        "*": function(self, locals, a, b) {
            return a(self, locals) * b(self, locals);
        },
        "/": function(self, locals, a, b) {
            return a(self, locals) / b(self, locals);
        },
        "%": function(self, locals, a, b) {
            return a(self, locals) % b(self, locals);
        },
        "^": function(self, locals, a, b) {
            return a(self, locals) ^ b(self, locals);
        },
        "=": noop,
        "===": function(self, locals, a, b) {
            return a(self, locals) === b(self, locals);
        },
        "!==": function(self, locals, a, b) {
            return a(self, locals) !== b(self, locals);
        },
        "==": function(self, locals, a, b) {
            return a(self, locals) == b(self, locals);
        },
        "!=": function(self, locals, a, b) {
            return a(self, locals) != b(self, locals);
        },
        "<": function(self, locals, a, b) {
            return a(self, locals) < b(self, locals);
        },
        ">": function(self, locals, a, b) {
            return a(self, locals) > b(self, locals);
        },
        "<=": function(self, locals, a, b) {
            return a(self, locals) <= b(self, locals);
        },
        ">=": function(self, locals, a, b) {
            return a(self, locals) >= b(self, locals);
        },
        "&&": function(self, locals, a, b) {
            return a(self, locals) && b(self, locals);
        },
        "||": function(self, locals, a, b) {
            return a(self, locals) || b(self, locals);
        },
        "&": function(self, locals, a, b) {
            return a(self, locals) & b(self, locals);
        },
        "|": function(self, locals, a, b) {
            return b(self, locals)(self, locals, a(self, locals));
        },
        "!": function(self, locals, a) {
            return !a(self, locals);
        }
    }, ESCAPE = {
        n: "\n",
        f: "\f",
        r: "\r",
        t: "	",
        v: "",
        "'": "'",
        '"': '"'
    }, Lexer = function(options) {
        this.options = options;
    };
    Lexer.prototype = {
        constructor: Lexer,
        lex: function(text) {
            this.text = text, this.index = 0, this.ch = undefined, this.lastCh = ":", this.tokens = [];
            for (var token, json = []; this.index < this.text.length; ) {
                if (this.ch = this.text.charAt(this.index), this.is("\"'")) this.readString(this.ch); else if (this.isNumber(this.ch) || this.is(".") && this.isNumber(this.peek())) this.readNumber(); else if (this.isIdent(this.ch)) this.readIdent(), 
                this.was("{,") && "{" === json[0] && (token = this.tokens[this.tokens.length - 1]) && (token.json = -1 === token.text.indexOf(".")); else if (this.is("(){}[].,;:?")) this.tokens.push({
                    index: this.index,
                    text: this.ch,
                    json: this.was(":[,") && this.is("{[") || this.is("}]:,")
                }), this.is("{[") && json.unshift(this.ch), this.is("}]") && json.shift(), this.index++; else {
                    if (this.isWhitespace(this.ch)) {
                        this.index++;
                        continue;
                    }
                    var ch2 = this.ch + this.peek(), ch3 = ch2 + this.peek(2), fn = OPERATORS[this.ch], fn2 = OPERATORS[ch2], fn3 = OPERATORS[ch3];
                    fn3 ? (this.tokens.push({
                        index: this.index,
                        text: ch3,
                        fn: fn3
                    }), this.index += 3) : fn2 ? (this.tokens.push({
                        index: this.index,
                        text: ch2,
                        fn: fn2
                    }), this.index += 2) : fn ? (this.tokens.push({
                        index: this.index,
                        text: this.ch,
                        fn: fn,
                        json: this.was("[,:") && this.is("+-")
                    }), this.index += 1) : this.throwError("Unexpected next character ", this.index, this.index + 1);
                }
                this.lastCh = this.ch;
            }
            return this.tokens;
        },
        is: function(chars) {
            return -1 !== chars.indexOf(this.ch);
        },
        was: function(chars) {
            return -1 !== chars.indexOf(this.lastCh);
        },
        peek: function(i) {
            var num = i || 1;
            return this.index + num < this.text.length ? this.text.charAt(this.index + num) : !1;
        },
        isNumber: function(ch) {
            return ch >= "0" && "9" >= ch;
        },
        isWhitespace: function(ch) {
            return " " === ch || "\r" === ch || "	" === ch || "\n" === ch || "" === ch || " " === ch;
        },
        isIdent: function(ch) {
            return ch >= "a" && "z" >= ch || ch >= "A" && "Z" >= ch || "_" === ch || "$" === ch;
        },
        isExpOperator: function(ch) {
            return "-" === ch || "+" === ch || this.isNumber(ch);
        },
        throwError: function(error, start, end) {
            end = end || this.index;
            var colStr = isDefined(start) ? "s " + start + "-" + this.index + " [" + this.text.substring(start, end) + "]" : " " + end;
            throw $parseMinErr("lexerr", "Lexer Error: {0} at column{1} in expression [{2}].", error, colStr, this.text);
        },
        readNumber: function() {
            for (var number = "", start = this.index; this.index < this.text.length; ) {
                var ch = lowercase(this.text.charAt(this.index));
                if ("." == ch || this.isNumber(ch)) number += ch; else {
                    var peekCh = this.peek();
                    if ("e" == ch && this.isExpOperator(peekCh)) number += ch; else if (this.isExpOperator(ch) && peekCh && this.isNumber(peekCh) && "e" == number.charAt(number.length - 1)) number += ch; else {
                        if (!this.isExpOperator(ch) || peekCh && this.isNumber(peekCh) || "e" != number.charAt(number.length - 1)) break;
                        this.throwError("Invalid exponent");
                    }
                }
                this.index++;
            }
            number = 1 * number, this.tokens.push({
                index: start,
                text: number,
                json: !0,
                fn: function() {
                    return number;
                }
            });
        },
        readIdent: function() {
            for (var lastDot, peekIndex, methodName, ch, parser = this, ident = "", start = this.index; this.index < this.text.length && (ch = this.text.charAt(this.index), 
            "." === ch || this.isIdent(ch) || this.isNumber(ch)); ) "." === ch && (lastDot = this.index), 
            ident += ch, this.index++;
            if (lastDot) for (peekIndex = this.index; peekIndex < this.text.length; ) {
                if (ch = this.text.charAt(peekIndex), "(" === ch) {
                    methodName = ident.substr(lastDot - start + 1), ident = ident.substr(0, lastDot - start), 
                    this.index = peekIndex;
                    break;
                }
                if (!this.isWhitespace(ch)) break;
                peekIndex++;
            }
            var token = {
                index: start,
                text: ident
            };
            if (OPERATORS.hasOwnProperty(ident)) token.fn = OPERATORS[ident], token.json = OPERATORS[ident]; else {
                var getter = getterFn(ident, this.options, this.text);
                token.fn = extend(function(self, locals) {
                    return getter(self, locals);
                }, {
                    assign: function(self, value) {
                        return setter(self, ident, value, parser.text, parser.options);
                    }
                });
            }
            this.tokens.push(token), methodName && (this.tokens.push({
                index: lastDot,
                text: ".",
                json: !1
            }), this.tokens.push({
                index: lastDot + 1,
                text: methodName,
                json: !1
            }));
        },
        readString: function(quote) {
            var start = this.index;
            this.index++;
            for (var string = "", rawString = quote, escape = !1; this.index < this.text.length; ) {
                var ch = this.text.charAt(this.index);
                if (rawString += ch, escape) {
                    if ("u" === ch) {
                        var hex = this.text.substring(this.index + 1, this.index + 5);
                        hex.match(/[\da-f]{4}/i) || this.throwError("Invalid unicode escape [\\u" + hex + "]"), 
                        this.index += 4, string += String.fromCharCode(parseInt(hex, 16));
                    } else {
                        var rep = ESCAPE[ch];
                        string += rep ? rep : ch;
                    }
                    escape = !1;
                } else if ("\\" === ch) escape = !0; else {
                    if (ch === quote) return this.index++, this.tokens.push({
                        index: start,
                        text: rawString,
                        string: string,
                        json: !0,
                        fn: function() {
                            return string;
                        }
                    }), void 0;
                    string += ch;
                }
                this.index++;
            }
            this.throwError("Unterminated quote", start);
        }
    };
    var Parser = function(lexer, $filter, options) {
        this.lexer = lexer, this.$filter = $filter, this.options = options;
    };
    Parser.ZERO = function() {
        return 0;
    }, Parser.prototype = {
        constructor: Parser,
        parse: function(text, json) {
            this.text = text, this.json = json, this.tokens = this.lexer.lex(text), json && (this.assignment = this.logicalOR, 
            this.functionCall = this.fieldAccess = this.objectIndex = this.filterChain = function() {
                this.throwError("is not valid json", {
                    text: text,
                    index: 0
                });
            });
            var value = json ? this.primary() : this.statements();
            return 0 !== this.tokens.length && this.throwError("is an unexpected token", this.tokens[0]), 
            value.literal = !!value.literal, value.constant = !!value.constant, value;
        },
        primary: function() {
            var primary;
            if (this.expect("(")) primary = this.filterChain(), this.consume(")"); else if (this.expect("[")) primary = this.arrayDeclaration(); else if (this.expect("{")) primary = this.object(); else {
                var token = this.expect();
                primary = token.fn, primary || this.throwError("not a primary expression", token), 
                token.json && (primary.constant = !0, primary.literal = !0);
            }
            for (var next, context; next = this.expect("(", "[", "."); ) "(" === next.text ? (primary = this.functionCall(primary, context), 
            context = null) : "[" === next.text ? (context = primary, primary = this.objectIndex(primary)) : "." === next.text ? (context = primary, 
            primary = this.fieldAccess(primary)) : this.throwError("IMPOSSIBLE");
            return primary;
        },
        throwError: function(msg, token) {
            throw $parseMinErr("syntax", "Syntax Error: Token '{0}' {1} at column {2} of the expression [{3}] starting at [{4}].", token.text, msg, token.index + 1, this.text, this.text.substring(token.index));
        },
        peekToken: function() {
            if (0 === this.tokens.length) throw $parseMinErr("ueoe", "Unexpected end of expression: {0}", this.text);
            return this.tokens[0];
        },
        peek: function(e1, e2, e3, e4) {
            if (this.tokens.length > 0) {
                var token = this.tokens[0], t = token.text;
                if (t === e1 || t === e2 || t === e3 || t === e4 || !e1 && !e2 && !e3 && !e4) return token;
            }
            return !1;
        },
        expect: function(e1, e2, e3, e4) {
            var token = this.peek(e1, e2, e3, e4);
            return token ? (this.json && !token.json && this.throwError("is not valid json", token), 
            this.tokens.shift(), token) : !1;
        },
        consume: function(e1) {
            this.expect(e1) || this.throwError("is unexpected, expecting [" + e1 + "]", this.peek());
        },
        unaryFn: function(fn, right) {
            return extend(function(self, locals) {
                return fn(self, locals, right);
            }, {
                constant: right.constant
            });
        },
        ternaryFn: function(left, middle, right) {
            return extend(function(self, locals) {
                return left(self, locals) ? middle(self, locals) : right(self, locals);
            }, {
                constant: left.constant && middle.constant && right.constant
            });
        },
        binaryFn: function(left, fn, right) {
            return extend(function(self, locals) {
                return fn(self, locals, left, right);
            }, {
                constant: left.constant && right.constant
            });
        },
        statements: function() {
            for (var statements = []; ;) if (this.tokens.length > 0 && !this.peek("}", ")", ";", "]") && statements.push(this.filterChain()), 
            !this.expect(";")) return 1 === statements.length ? statements[0] : function(self, locals) {
                for (var value, i = 0; i < statements.length; i++) {
                    var statement = statements[i];
                    statement && (value = statement(self, locals));
                }
                return value;
            };
        },
        filterChain: function() {
            for (var token, left = this.expression(); ;) {
                if (!(token = this.expect("|"))) return left;
                left = this.binaryFn(left, token.fn, this.filter());
            }
        },
        filter: function() {
            for (var token = this.expect(), fn = this.$filter(token.text), argsFn = []; ;) {
                if (!(token = this.expect(":"))) {
                    var fnInvoke = function(self, locals, input) {
                        for (var args = [ input ], i = 0; i < argsFn.length; i++) args.push(argsFn[i](self, locals));
                        return fn.apply(self, args);
                    };
                    return function() {
                        return fnInvoke;
                    };
                }
                argsFn.push(this.expression());
            }
        },
        expression: function() {
            return this.assignment();
        },
        assignment: function() {
            var right, token, left = this.ternary();
            return (token = this.expect("=")) ? (left.assign || this.throwError("implies assignment but [" + this.text.substring(0, token.index) + "] can not be assigned to", token), 
            right = this.ternary(), function(scope, locals) {
                return left.assign(scope, right(scope, locals), locals);
            }) : left;
        },
        ternary: function() {
            var middle, token, left = this.logicalOR();
            return (token = this.expect("?")) ? (middle = this.ternary(), (token = this.expect(":")) ? this.ternaryFn(left, middle, this.ternary()) : (this.throwError("expected :", token), 
            void 0)) : left;
        },
        logicalOR: function() {
            for (var token, left = this.logicalAND(); ;) {
                if (!(token = this.expect("||"))) return left;
                left = this.binaryFn(left, token.fn, this.logicalAND());
            }
        },
        logicalAND: function() {
            var token, left = this.equality();
            return (token = this.expect("&&")) && (left = this.binaryFn(left, token.fn, this.logicalAND())), 
            left;
        },
        equality: function() {
            var token, left = this.relational();
            return (token = this.expect("==", "!=", "===", "!==")) && (left = this.binaryFn(left, token.fn, this.equality())), 
            left;
        },
        relational: function() {
            var token, left = this.additive();
            return (token = this.expect("<", ">", "<=", ">=")) && (left = this.binaryFn(left, token.fn, this.relational())), 
            left;
        },
        additive: function() {
            for (var token, left = this.multiplicative(); token = this.expect("+", "-"); ) left = this.binaryFn(left, token.fn, this.multiplicative());
            return left;
        },
        multiplicative: function() {
            for (var token, left = this.unary(); token = this.expect("*", "/", "%"); ) left = this.binaryFn(left, token.fn, this.unary());
            return left;
        },
        unary: function() {
            var token;
            return this.expect("+") ? this.primary() : (token = this.expect("-")) ? this.binaryFn(Parser.ZERO, token.fn, this.unary()) : (token = this.expect("!")) ? this.unaryFn(token.fn, this.unary()) : this.primary();
        },
        fieldAccess: function(object) {
            var parser = this, field = this.expect().text, getter = getterFn(field, this.options, this.text);
            return extend(function(scope, locals, self) {
                return getter(self || object(scope, locals), locals);
            }, {
                assign: function(scope, value, locals) {
                    return setter(object(scope, locals), field, value, parser.text, parser.options);
                }
            });
        },
        objectIndex: function(obj) {
            var parser = this, indexFn = this.expression();
            return this.consume("]"), extend(function(self, locals) {
                var v, p, o = obj(self, locals), i = ensureSafeMemberName(indexFn(self, locals), parser.text, !0);
                return o ? (v = ensureSafeObject(o[i], parser.text), v && v.then && parser.options.unwrapPromises && (p = v, 
                "$$v" in v || (p.$$v = undefined, p.then(function(val) {
                    p.$$v = val;
                })), v = v.$$v), v) : undefined;
            }, {
                assign: function(self, value, locals) {
                    var key = ensureSafeMemberName(indexFn(self, locals), parser.text), safe = ensureSafeObject(obj(self, locals), parser.text);
                    return safe[key] = value;
                }
            });
        },
        functionCall: function(fn, contextGetter) {
            var argsFn = [];
            if (")" !== this.peekToken().text) do argsFn.push(this.expression()); while (this.expect(","));
            this.consume(")");
            var parser = this;
            return function(scope, locals) {
                for (var args = [], context = contextGetter ? contextGetter(scope, locals) : scope, i = 0; i < argsFn.length; i++) args.push(argsFn[i](scope, locals));
                var fnPtr = fn(scope, locals, context) || noop;
                ensureSafeObject(context, parser.text), ensureSafeObject(fnPtr, parser.text);
                var v = fnPtr.apply ? fnPtr.apply(context, args) : fnPtr(args[0], args[1], args[2], args[3], args[4]);
                return ensureSafeObject(v, parser.text);
            };
        },
        arrayDeclaration: function() {
            var elementFns = [], allConstant = !0;
            if ("]" !== this.peekToken().text) do {
                var elementFn = this.expression();
                elementFns.push(elementFn), elementFn.constant || (allConstant = !1);
            } while (this.expect(","));
            return this.consume("]"), extend(function(self, locals) {
                for (var array = [], i = 0; i < elementFns.length; i++) array.push(elementFns[i](self, locals));
                return array;
            }, {
                literal: !0,
                constant: allConstant
            });
        },
        object: function() {
            var keyValues = [], allConstant = !0;
            if ("}" !== this.peekToken().text) do {
                var token = this.expect(), key = token.string || token.text;
                this.consume(":");
                var value = this.expression();
                keyValues.push({
                    key: key,
                    value: value
                }), value.constant || (allConstant = !1);
            } while (this.expect(","));
            return this.consume("}"), extend(function(self, locals) {
                for (var object = {}, i = 0; i < keyValues.length; i++) {
                    var keyValue = keyValues[i];
                    object[keyValue.key] = keyValue.value(self, locals);
                }
                return object;
            }, {
                literal: !0,
                constant: allConstant
            });
        }
    };
    var getterFnCache = {}, $sceMinErr = minErr("$sce"), SCE_CONTEXTS = {
        HTML: "html",
        CSS: "css",
        URL: "url",
        RESOURCE_URL: "resourceUrl",
        JS: "js"
    }, urlParsingNode = document.createElement("a"), originUrl = urlResolve(window.location.href, !0);
    $FilterProvider.$inject = [ "$provide" ], currencyFilter.$inject = [ "$locale" ], 
    numberFilter.$inject = [ "$locale" ];
    var DECIMAL_SEP = ".", DATE_FORMATS = {
        yyyy: dateGetter("FullYear", 4),
        yy: dateGetter("FullYear", 2, 0, !0),
        y: dateGetter("FullYear", 1),
        MMMM: dateStrGetter("Month"),
        MMM: dateStrGetter("Month", !0),
        MM: dateGetter("Month", 2, 1),
        M: dateGetter("Month", 1, 1),
        dd: dateGetter("Date", 2),
        d: dateGetter("Date", 1),
        HH: dateGetter("Hours", 2),
        H: dateGetter("Hours", 1),
        hh: dateGetter("Hours", 2, -12),
        h: dateGetter("Hours", 1, -12),
        mm: dateGetter("Minutes", 2),
        m: dateGetter("Minutes", 1),
        ss: dateGetter("Seconds", 2),
        s: dateGetter("Seconds", 1),
        sss: dateGetter("Milliseconds", 3),
        EEEE: dateStrGetter("Day"),
        EEE: dateStrGetter("Day", !0),
        a: ampmGetter,
        Z: timeZoneGetter
    }, DATE_FORMATS_SPLIT = /((?:[^yMdHhmsaZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z))(.*)/, NUMBER_STRING = /^\-?\d+$/;
    dateFilter.$inject = [ "$locale" ];
    var lowercaseFilter = valueFn(lowercase), uppercaseFilter = valueFn(uppercase);
    orderByFilter.$inject = [ "$parse" ];
    var htmlAnchorDirective = valueFn({
        restrict: "E",
        compile: function(element, attr) {
            return 8 >= msie && (attr.href || attr.name || attr.$set("href", ""), element.append(document.createComment("IE fix"))), 
            function(scope, element) {
                element.on("click", function(event) {
                    element.attr("href") || event.preventDefault();
                });
            };
        }
    }), ngAttributeAliasDirectives = {};
    forEach(BOOLEAN_ATTR, function(propName, attrName) {
        if ("multiple" != propName) {
            var normalized = directiveNormalize("ng-" + attrName);
            ngAttributeAliasDirectives[normalized] = function() {
                return {
                    priority: 100,
                    compile: function() {
                        return function(scope, element, attr) {
                            scope.$watch(attr[normalized], function(value) {
                                attr.$set(attrName, !!value);
                            });
                        };
                    }
                };
            };
        }
    }), forEach([ "src", "srcset", "href" ], function(attrName) {
        var normalized = directiveNormalize("ng-" + attrName);
        ngAttributeAliasDirectives[normalized] = function() {
            return {
                priority: 99,
                link: function(scope, element, attr) {
                    attr.$observe(normalized, function(value) {
                        value && (attr.$set(attrName, value), msie && element.prop(attrName, attr[attrName]));
                    });
                }
            };
        };
    });
    var nullFormCtrl = {
        $addControl: noop,
        $removeControl: noop,
        $setValidity: noop,
        $setDirty: noop,
        $setPristine: noop
    };
    FormController.$inject = [ "$element", "$attrs", "$scope" ];
    var formDirectiveFactory = function(isNgForm) {
        return [ "$timeout", function($timeout) {
            var formDirective = {
                name: "form",
                restrict: isNgForm ? "EAC" : "E",
                controller: FormController,
                compile: function() {
                    return {
                        pre: function(scope, formElement, attr, controller) {
                            if (!attr.action) {
                                var preventDefaultListener = function(event) {
                                    event.preventDefault ? event.preventDefault() : event.returnValue = !1;
                                };
                                addEventListenerFn(formElement[0], "submit", preventDefaultListener), formElement.on("$destroy", function() {
                                    $timeout(function() {
                                        removeEventListenerFn(formElement[0], "submit", preventDefaultListener);
                                    }, 0, !1);
                                });
                            }
                            var parentFormCtrl = formElement.parent().controller("form"), alias = attr.name || attr.ngForm;
                            alias && setter(scope, alias, controller, alias), parentFormCtrl && formElement.on("$destroy", function() {
                                parentFormCtrl.$removeControl(controller), alias && setter(scope, alias, undefined, alias), 
                                extend(controller, nullFormCtrl);
                            });
                        }
                    };
                }
            };
            return formDirective;
        } ];
    }, formDirective = formDirectiveFactory(), ngFormDirective = formDirectiveFactory(!0), URL_REGEXP = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/, EMAIL_REGEXP = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/, NUMBER_REGEXP = /^\s*(\-|\+)?(\d+|(\d*(\.\d*)))\s*$/, inputType = {
        text: textInputType,
        number: numberInputType,
        url: urlInputType,
        email: emailInputType,
        radio: radioInputType,
        checkbox: checkboxInputType,
        hidden: noop,
        button: noop,
        submit: noop,
        reset: noop
    }, inputDirective = [ "$browser", "$sniffer", function($browser, $sniffer) {
        return {
            restrict: "E",
            require: "?ngModel",
            link: function(scope, element, attr, ctrl) {
                ctrl && (inputType[lowercase(attr.type)] || inputType.text)(scope, element, attr, ctrl, $sniffer, $browser);
            }
        };
    } ], VALID_CLASS = "ng-valid", INVALID_CLASS = "ng-invalid", PRISTINE_CLASS = "ng-pristine", DIRTY_CLASS = "ng-dirty", NgModelController = [ "$scope", "$exceptionHandler", "$attrs", "$element", "$parse", function($scope, $exceptionHandler, $attr, $element, $parse) {
        function toggleValidCss(isValid, validationErrorKey) {
            validationErrorKey = validationErrorKey ? "-" + snake_case(validationErrorKey, "-") : "", 
            $element.removeClass((isValid ? INVALID_CLASS : VALID_CLASS) + validationErrorKey).addClass((isValid ? VALID_CLASS : INVALID_CLASS) + validationErrorKey);
        }
        this.$viewValue = Number.NaN, this.$modelValue = Number.NaN, this.$parsers = [], 
        this.$formatters = [], this.$viewChangeListeners = [], this.$pristine = !0, this.$dirty = !1, 
        this.$valid = !0, this.$invalid = !1, this.$name = $attr.name;
        var ngModelGet = $parse($attr.ngModel), ngModelSet = ngModelGet.assign;
        if (!ngModelSet) throw minErr("ngModel")("nonassign", "Expression '{0}' is non-assignable. Element: {1}", $attr.ngModel, startingTag($element));
        this.$render = noop, this.$isEmpty = function(value) {
            return isUndefined(value) || "" === value || null === value || value !== value;
        };
        var parentForm = $element.inheritedData("$formController") || nullFormCtrl, invalidCount = 0, $error = this.$error = {};
        $element.addClass(PRISTINE_CLASS), toggleValidCss(!0), this.$setValidity = function(validationErrorKey, isValid) {
            $error[validationErrorKey] !== !isValid && (isValid ? ($error[validationErrorKey] && invalidCount--, 
            invalidCount || (toggleValidCss(!0), this.$valid = !0, this.$invalid = !1)) : (toggleValidCss(!1), 
            this.$invalid = !0, this.$valid = !1, invalidCount++), $error[validationErrorKey] = !isValid, 
            toggleValidCss(isValid, validationErrorKey), parentForm.$setValidity(validationErrorKey, isValid, this));
        }, this.$setPristine = function() {
            this.$dirty = !1, this.$pristine = !0, $element.removeClass(DIRTY_CLASS).addClass(PRISTINE_CLASS);
        }, this.$setViewValue = function(value) {
            this.$viewValue = value, this.$pristine && (this.$dirty = !0, this.$pristine = !1, 
            $element.removeClass(PRISTINE_CLASS).addClass(DIRTY_CLASS), parentForm.$setDirty()), 
            forEach(this.$parsers, function(fn) {
                value = fn(value);
            }), this.$modelValue !== value && (this.$modelValue = value, ngModelSet($scope, value), 
            forEach(this.$viewChangeListeners, function(listener) {
                try {
                    listener();
                } catch (e) {
                    $exceptionHandler(e);
                }
            }));
        };
        var ctrl = this;
        $scope.$watch(function() {
            var value = ngModelGet($scope);
            if (ctrl.$modelValue !== value) {
                var formatters = ctrl.$formatters, idx = formatters.length;
                for (ctrl.$modelValue = value; idx--; ) value = formatters[idx](value);
                ctrl.$viewValue !== value && (ctrl.$viewValue = value, ctrl.$render());
            }
        });
    } ], ngModelDirective = function() {
        return {
            require: [ "ngModel", "^?form" ],
            controller: NgModelController,
            link: function(scope, element, attr, ctrls) {
                var modelCtrl = ctrls[0], formCtrl = ctrls[1] || nullFormCtrl;
                formCtrl.$addControl(modelCtrl), scope.$on("$destroy", function() {
                    formCtrl.$removeControl(modelCtrl);
                });
            }
        };
    }, ngChangeDirective = valueFn({
        require: "ngModel",
        link: function(scope, element, attr, ctrl) {
            ctrl.$viewChangeListeners.push(function() {
                scope.$eval(attr.ngChange);
            });
        }
    }), requiredDirective = function() {
        return {
            require: "?ngModel",
            link: function(scope, elm, attr, ctrl) {
                if (ctrl) {
                    attr.required = !0;
                    var validator = function(value) {
                        return attr.required && ctrl.$isEmpty(value) ? (ctrl.$setValidity("required", !1), 
                        void 0) : (ctrl.$setValidity("required", !0), value);
                    };
                    ctrl.$formatters.push(validator), ctrl.$parsers.unshift(validator), attr.$observe("required", function() {
                        validator(ctrl.$viewValue);
                    });
                }
            }
        };
    }, ngListDirective = function() {
        return {
            require: "ngModel",
            link: function(scope, element, attr, ctrl) {
                var match = /\/(.*)\//.exec(attr.ngList), separator = match && new RegExp(match[1]) || attr.ngList || ",", parse = function(viewValue) {
                    if (!isUndefined(viewValue)) {
                        var list = [];
                        return viewValue && forEach(viewValue.split(separator), function(value) {
                            value && list.push(trim(value));
                        }), list;
                    }
                };
                ctrl.$parsers.push(parse), ctrl.$formatters.push(function(value) {
                    return isArray(value) ? value.join(", ") : undefined;
                }), ctrl.$isEmpty = function(value) {
                    return !value || !value.length;
                };
            }
        };
    }, CONSTANT_VALUE_REGEXP = /^(true|false|\d+)$/, ngValueDirective = function() {
        return {
            priority: 100,
            compile: function(tpl, tplAttr) {
                return CONSTANT_VALUE_REGEXP.test(tplAttr.ngValue) ? function(scope, elm, attr) {
                    attr.$set("value", scope.$eval(attr.ngValue));
                } : function(scope, elm, attr) {
                    scope.$watch(attr.ngValue, function(value) {
                        attr.$set("value", value);
                    });
                };
            }
        };
    }, ngBindDirective = ngDirective(function(scope, element, attr) {
        element.addClass("ng-binding").data("$binding", attr.ngBind), scope.$watch(attr.ngBind, function(value) {
            element.text(value == undefined ? "" : value);
        });
    }), ngBindTemplateDirective = [ "$interpolate", function($interpolate) {
        return function(scope, element, attr) {
            var interpolateFn = $interpolate(element.attr(attr.$attr.ngBindTemplate));
            element.addClass("ng-binding").data("$binding", interpolateFn), attr.$observe("ngBindTemplate", function(value) {
                element.text(value);
            });
        };
    } ], ngBindHtmlDirective = [ "$sce", "$parse", function($sce, $parse) {
        return function(scope, element, attr) {
            function getStringValue() {
                return (parsed(scope) || "").toString();
            }
            element.addClass("ng-binding").data("$binding", attr.ngBindHtml);
            var parsed = $parse(attr.ngBindHtml);
            scope.$watch(getStringValue, function() {
                element.html($sce.getTrustedHtml(parsed(scope)) || "");
            });
        };
    } ], ngClassDirective = classDirective("", !0), ngClassOddDirective = classDirective("Odd", 0), ngClassEvenDirective = classDirective("Even", 1), ngCloakDirective = ngDirective({
        compile: function(element, attr) {
            attr.$set("ngCloak", undefined), element.removeClass("ng-cloak");
        }
    }), ngControllerDirective = [ function() {
        return {
            scope: !0,
            controller: "@"
        };
    } ], ngEventDirectives = {};
    forEach("click dblclick mousedown mouseup mouseover mouseout mousemove mouseenter mouseleave keydown keyup keypress submit focus blur copy cut paste".split(" "), function(name) {
        var directiveName = directiveNormalize("ng-" + name);
        ngEventDirectives[directiveName] = [ "$parse", function($parse) {
            return {
                compile: function($element, attr) {
                    var fn = $parse(attr[directiveName]);
                    return function(scope, element) {
                        element.on(lowercase(name), function(event) {
                            scope.$apply(function() {
                                fn(scope, {
                                    $event: event
                                });
                            });
                        });
                    };
                }
            };
        } ];
    });
    var ngIfDirective = [ "$animate", function($animate) {
        return {
            transclude: "element",
            priority: 600,
            terminal: !0,
            restrict: "A",
            $$tlb: !0,
            compile: function(element, attr, transclude) {
                return function($scope, $element, $attr) {
                    var block, childScope;
                    $scope.$watch($attr.ngIf, function(value) {
                        toBoolean(value) ? (childScope = $scope.$new(), transclude(childScope, function(clone) {
                            block = {
                                startNode: clone[0],
                                endNode: clone[clone.length++] = document.createComment(" end ngIf: " + $attr.ngIf + " ")
                            }, $animate.enter(clone, $element.parent(), $element);
                        })) : (childScope && (childScope.$destroy(), childScope = null), block && ($animate.leave(getBlockElements(block)), 
                        block = null));
                    });
                };
            }
        };
    } ], ngIncludeDirective = [ "$http", "$templateCache", "$anchorScroll", "$compile", "$animate", "$sce", function($http, $templateCache, $anchorScroll, $compile, $animate, $sce) {
        return {
            restrict: "ECA",
            priority: 400,
            terminal: !0,
            transclude: "element",
            compile: function(element, attr, transclusion) {
                var srcExp = attr.ngInclude || attr.src, onloadExp = attr.onload || "", autoScrollExp = attr.autoscroll;
                return function(scope, $element) {
                    var currentScope, currentElement, changeCounter = 0, cleanupLastIncludeContent = function() {
                        currentScope && (currentScope.$destroy(), currentScope = null), currentElement && ($animate.leave(currentElement), 
                        currentElement = null);
                    };
                    scope.$watch($sce.parseAsResourceUrl(srcExp), function(src) {
                        var afterAnimation = function() {
                            !isDefined(autoScrollExp) || autoScrollExp && !scope.$eval(autoScrollExp) || $anchorScroll();
                        }, thisChangeId = ++changeCounter;
                        src ? ($http.get(src, {
                            cache: $templateCache
                        }).success(function(response) {
                            if (thisChangeId === changeCounter) {
                                var newScope = scope.$new();
                                transclusion(newScope, function(clone) {
                                    cleanupLastIncludeContent(), currentScope = newScope, currentElement = clone, currentElement.html(response), 
                                    $animate.enter(currentElement, null, $element, afterAnimation), $compile(currentElement.contents())(currentScope), 
                                    currentScope.$emit("$includeContentLoaded"), scope.$eval(onloadExp);
                                });
                            }
                        }).error(function() {
                            thisChangeId === changeCounter && cleanupLastIncludeContent();
                        }), scope.$emit("$includeContentRequested")) : cleanupLastIncludeContent();
                    });
                };
            }
        };
    } ], ngInitDirective = ngDirective({
        compile: function() {
            return {
                pre: function(scope, element, attrs) {
                    scope.$eval(attrs.ngInit);
                }
            };
        }
    }), ngNonBindableDirective = ngDirective({
        terminal: !0,
        priority: 1e3
    }), ngPluralizeDirective = [ "$locale", "$interpolate", function($locale, $interpolate) {
        var BRACE = /{}/g;
        return {
            restrict: "EA",
            link: function(scope, element, attr) {
                var numberExp = attr.count, whenExp = attr.$attr.when && element.attr(attr.$attr.when), offset = attr.offset || 0, whens = scope.$eval(whenExp) || {}, whensExpFns = {}, startSymbol = $interpolate.startSymbol(), endSymbol = $interpolate.endSymbol(), isWhen = /^when(Minus)?(.+)$/;
                forEach(attr, function(expression, attributeName) {
                    isWhen.test(attributeName) && (whens[lowercase(attributeName.replace("when", "").replace("Minus", "-"))] = element.attr(attr.$attr[attributeName]));
                }), forEach(whens, function(expression, key) {
                    whensExpFns[key] = $interpolate(expression.replace(BRACE, startSymbol + numberExp + "-" + offset + endSymbol));
                }), scope.$watch(function() {
                    var value = parseFloat(scope.$eval(numberExp));
                    return isNaN(value) ? "" : (value in whens || (value = $locale.pluralCat(value - offset)), 
                    whensExpFns[value](scope, element, !0));
                }, function(newVal) {
                    element.text(newVal);
                });
            }
        };
    } ], ngRepeatDirective = [ "$parse", "$animate", function($parse, $animate) {
        var NG_REMOVED = "$$NG_REMOVED", ngRepeatMinErr = minErr("ngRepeat");
        return {
            transclude: "element",
            priority: 1e3,
            terminal: !0,
            $$tlb: !0,
            compile: function(element, attr, linker) {
                return function($scope, $element, $attr) {
                    var trackByExp, trackByExpGetter, trackByIdExpFn, trackByIdArrayFn, trackByIdObjFn, lhs, rhs, valueIdentifier, keyIdentifier, expression = $attr.ngRepeat, match = expression.match(/^\s*(.+)\s+in\s+(.*?)\s*(\s+track\s+by\s+(.+)\s*)?$/), hashFnLocals = {
                        $id: hashKey
                    };
                    if (!match) throw ngRepeatMinErr("iexp", "Expected expression in form of '_item_ in _collection_[ track by _id_]' but got '{0}'.", expression);
                    if (lhs = match[1], rhs = match[2], trackByExp = match[4], trackByExp ? (trackByExpGetter = $parse(trackByExp), 
                    trackByIdExpFn = function(key, value, index) {
                        return keyIdentifier && (hashFnLocals[keyIdentifier] = key), hashFnLocals[valueIdentifier] = value, 
                        hashFnLocals.$index = index, trackByExpGetter($scope, hashFnLocals);
                    }) : (trackByIdArrayFn = function(key, value) {
                        return hashKey(value);
                    }, trackByIdObjFn = function(key) {
                        return key;
                    }), match = lhs.match(/^(?:([\$\w]+)|\(([\$\w]+)\s*,\s*([\$\w]+)\))$/), !match) throw ngRepeatMinErr("iidexp", "'_item_' in '_item_ in _collection_' should be an identifier or '(_key_, _value_)' expression, but got '{0}'.", lhs);
                    valueIdentifier = match[3] || match[1], keyIdentifier = match[2];
                    var lastBlockMap = {};
                    $scope.$watchCollection(rhs, function(collection) {
                        var index, length, nextNode, arrayLength, childScope, key, value, trackById, trackByIdFn, collectionKeys, block, elementsToRemove, previousNode = $element[0], nextBlockMap = {}, nextBlockOrder = [];
                        if (isArrayLike(collection)) collectionKeys = collection, trackByIdFn = trackByIdExpFn || trackByIdArrayFn; else {
                            trackByIdFn = trackByIdExpFn || trackByIdObjFn, collectionKeys = [];
                            for (key in collection) collection.hasOwnProperty(key) && "$" != key.charAt(0) && collectionKeys.push(key);
                            collectionKeys.sort();
                        }
                        for (arrayLength = collectionKeys.length, length = nextBlockOrder.length = collectionKeys.length, 
                        index = 0; length > index; index++) if (key = collection === collectionKeys ? index : collectionKeys[index], 
                        value = collection[key], trackById = trackByIdFn(key, value, index), assertNotHasOwnProperty(trackById, "`track by` id"), 
                        lastBlockMap.hasOwnProperty(trackById)) block = lastBlockMap[trackById], delete lastBlockMap[trackById], 
                        nextBlockMap[trackById] = block, nextBlockOrder[index] = block; else {
                            if (nextBlockMap.hasOwnProperty(trackById)) throw forEach(nextBlockOrder, function(block) {
                                block && block.startNode && (lastBlockMap[block.id] = block);
                            }), ngRepeatMinErr("dupes", "Duplicates in a repeater are not allowed. Use 'track by' expression to specify unique keys. Repeater: {0}, Duplicate key: {1}", expression, trackById);
                            nextBlockOrder[index] = {
                                id: trackById
                            }, nextBlockMap[trackById] = !1;
                        }
                        for (key in lastBlockMap) lastBlockMap.hasOwnProperty(key) && (block = lastBlockMap[key], 
                        elementsToRemove = getBlockElements(block), $animate.leave(elementsToRemove), forEach(elementsToRemove, function(element) {
                            element[NG_REMOVED] = !0;
                        }), block.scope.$destroy());
                        for (index = 0, length = collectionKeys.length; length > index; index++) {
                            if (key = collection === collectionKeys ? index : collectionKeys[index], value = collection[key], 
                            block = nextBlockOrder[index], nextBlockOrder[index - 1] && (previousNode = nextBlockOrder[index - 1].endNode), 
                            block.startNode) {
                                childScope = block.scope, nextNode = previousNode;
                                do nextNode = nextNode.nextSibling; while (nextNode && nextNode[NG_REMOVED]);
                                block.startNode != nextNode && $animate.move(getBlockElements(block), null, jqLite(previousNode)), 
                                previousNode = block.endNode;
                            } else childScope = $scope.$new();
                            childScope[valueIdentifier] = value, keyIdentifier && (childScope[keyIdentifier] = key), 
                            childScope.$index = index, childScope.$first = 0 === index, childScope.$last = index === arrayLength - 1, 
                            childScope.$middle = !(childScope.$first || childScope.$last), childScope.$odd = !(childScope.$even = 0 === (1 & index)), 
                            block.startNode || linker(childScope, function(clone) {
                                clone[clone.length++] = document.createComment(" end ngRepeat: " + expression + " "), 
                                $animate.enter(clone, null, jqLite(previousNode)), previousNode = clone, block.scope = childScope, 
                                block.startNode = previousNode && previousNode.endNode ? previousNode.endNode : clone[0], 
                                block.endNode = clone[clone.length - 1], nextBlockMap[block.id] = block;
                            });
                        }
                        lastBlockMap = nextBlockMap;
                    });
                };
            }
        };
    } ], ngShowDirective = [ "$animate", function($animate) {
        return function(scope, element, attr) {
            scope.$watch(attr.ngShow, function(value) {
                $animate[toBoolean(value) ? "removeClass" : "addClass"](element, "ng-hide");
            });
        };
    } ], ngHideDirective = [ "$animate", function($animate) {
        return function(scope, element, attr) {
            scope.$watch(attr.ngHide, function(value) {
                $animate[toBoolean(value) ? "addClass" : "removeClass"](element, "ng-hide");
            });
        };
    } ], ngStyleDirective = ngDirective(function(scope, element, attr) {
        scope.$watch(attr.ngStyle, function(newStyles, oldStyles) {
            oldStyles && newStyles !== oldStyles && forEach(oldStyles, function(val, style) {
                element.css(style, "");
            }), newStyles && element.css(newStyles);
        }, !0);
    }), ngSwitchDirective = [ "$animate", function($animate) {
        return {
            restrict: "EA",
            require: "ngSwitch",
            controller: [ "$scope", function() {
                this.cases = {};
            } ],
            link: function(scope, element, attr, ngSwitchController) {
                var selectedTranscludes, selectedElements, watchExpr = attr.ngSwitch || attr.on, selectedScopes = [];
                scope.$watch(watchExpr, function(value) {
                    for (var i = 0, ii = selectedScopes.length; ii > i; i++) selectedScopes[i].$destroy(), 
                    $animate.leave(selectedElements[i]);
                    selectedElements = [], selectedScopes = [], (selectedTranscludes = ngSwitchController.cases["!" + value] || ngSwitchController.cases["?"]) && (scope.$eval(attr.change), 
                    forEach(selectedTranscludes, function(selectedTransclude) {
                        var selectedScope = scope.$new();
                        selectedScopes.push(selectedScope), selectedTransclude.transclude(selectedScope, function(caseElement) {
                            var anchor = selectedTransclude.element;
                            selectedElements.push(caseElement), $animate.enter(caseElement, anchor.parent(), anchor);
                        });
                    }));
                });
            }
        };
    } ], ngSwitchWhenDirective = ngDirective({
        transclude: "element",
        priority: 800,
        require: "^ngSwitch",
        compile: function(element, attrs, transclude) {
            return function(scope, element, attr, ctrl) {
                ctrl.cases["!" + attrs.ngSwitchWhen] = ctrl.cases["!" + attrs.ngSwitchWhen] || [], 
                ctrl.cases["!" + attrs.ngSwitchWhen].push({
                    transclude: transclude,
                    element: element
                });
            };
        }
    }), ngSwitchDefaultDirective = ngDirective({
        transclude: "element",
        priority: 800,
        require: "^ngSwitch",
        compile: function(element, attrs, transclude) {
            return function(scope, element, attr, ctrl) {
                ctrl.cases["?"] = ctrl.cases["?"] || [], ctrl.cases["?"].push({
                    transclude: transclude,
                    element: element
                });
            };
        }
    }), ngTranscludeDirective = ngDirective({
        controller: [ "$element", "$transclude", function($element, $transclude) {
            if (!$transclude) throw minErr("ngTransclude")("orphan", "Illegal use of ngTransclude directive in the template! No parent directive that requires a transclusion found. Element: {0}", startingTag($element));
            this.$transclude = $transclude;
        } ],
        link: function($scope, $element, $attrs, controller) {
            controller.$transclude(function(clone) {
                $element.html(""), $element.append(clone);
            });
        }
    }), scriptDirective = [ "$templateCache", function($templateCache) {
        return {
            restrict: "E",
            terminal: !0,
            compile: function(element, attr) {
                if ("text/ng-template" == attr.type) {
                    var templateUrl = attr.id, text = element[0].text;
                    $templateCache.put(templateUrl, text);
                }
            }
        };
    } ], ngOptionsMinErr = minErr("ngOptions"), ngOptionsDirective = valueFn({
        terminal: !0
    }), selectDirective = [ "$compile", "$parse", function($compile, $parse) {
        var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+(.*?)(?:\s+track\s+by\s+(.*?))?$/, nullModelCtrl = {
            $setViewValue: noop
        };
        return {
            restrict: "E",
            require: [ "select", "?ngModel" ],
            controller: [ "$element", "$scope", "$attrs", function($element, $scope, $attrs) {
                var nullOption, unknownOption, self = this, optionsMap = {}, ngModelCtrl = nullModelCtrl;
                self.databound = $attrs.ngModel, self.init = function(ngModelCtrl_, nullOption_, unknownOption_) {
                    ngModelCtrl = ngModelCtrl_, nullOption = nullOption_, unknownOption = unknownOption_;
                }, self.addOption = function(value) {
                    assertNotHasOwnProperty(value, '"option value"'), optionsMap[value] = !0, ngModelCtrl.$viewValue == value && ($element.val(value), 
                    unknownOption.parent() && unknownOption.remove());
                }, self.removeOption = function(value) {
                    this.hasOption(value) && (delete optionsMap[value], ngModelCtrl.$viewValue == value && this.renderUnknownOption(value));
                }, self.renderUnknownOption = function(val) {
                    var unknownVal = "? " + hashKey(val) + " ?";
                    unknownOption.val(unknownVal), $element.prepend(unknownOption), $element.val(unknownVal), 
                    unknownOption.prop("selected", !0);
                }, self.hasOption = function(value) {
                    return optionsMap.hasOwnProperty(value);
                }, $scope.$on("$destroy", function() {
                    self.renderUnknownOption = noop;
                });
            } ],
            link: function(scope, element, attr, ctrls) {
                function setupAsSingle(scope, selectElement, ngModelCtrl, selectCtrl) {
                    ngModelCtrl.$render = function() {
                        var viewValue = ngModelCtrl.$viewValue;
                        selectCtrl.hasOption(viewValue) ? (unknownOption.parent() && unknownOption.remove(), 
                        selectElement.val(viewValue), "" === viewValue && emptyOption.prop("selected", !0)) : isUndefined(viewValue) && emptyOption ? selectElement.val("") : selectCtrl.renderUnknownOption(viewValue);
                    }, selectElement.on("change", function() {
                        scope.$apply(function() {
                            unknownOption.parent() && unknownOption.remove(), ngModelCtrl.$setViewValue(selectElement.val());
                        });
                    });
                }
                function setupAsMultiple(scope, selectElement, ctrl) {
                    var lastView;
                    ctrl.$render = function() {
                        var items = new HashMap(ctrl.$viewValue);
                        forEach(selectElement.find("option"), function(option) {
                            option.selected = isDefined(items.get(option.value));
                        });
                    }, scope.$watch(function() {
                        equals(lastView, ctrl.$viewValue) || (lastView = copy(ctrl.$viewValue), ctrl.$render());
                    }), selectElement.on("change", function() {
                        scope.$apply(function() {
                            var array = [];
                            forEach(selectElement.find("option"), function(option) {
                                option.selected && array.push(option.value);
                            }), ctrl.$setViewValue(array);
                        });
                    });
                }
                function setupAsOptions(scope, selectElement, ctrl) {
                    function render() {
                        var optionGroupName, optionGroup, option, existingParent, existingOptions, existingOption, key, groupLength, length, groupIndex, index, selected, lastElement, element, label, optionGroups = {
                            "": []
                        }, optionGroupNames = [ "" ], modelValue = ctrl.$modelValue, values = valuesFn(scope) || [], keys = keyName ? sortedKeys(values) : values, locals = {}, selectedSet = !1;
                        if (multiple) if (trackFn && isArray(modelValue)) {
                            selectedSet = new HashMap([]);
                            for (var trackIndex = 0; trackIndex < modelValue.length; trackIndex++) locals[valueName] = modelValue[trackIndex], 
                            selectedSet.put(trackFn(scope, locals), modelValue[trackIndex]);
                        } else selectedSet = new HashMap(modelValue);
                        for (index = 0; length = keys.length, length > index; index++) {
                            if (key = index, keyName) {
                                if (key = keys[index], "$" === key.charAt(0)) continue;
                                locals[keyName] = key;
                            }
                            if (locals[valueName] = values[key], optionGroupName = groupByFn(scope, locals) || "", 
                            (optionGroup = optionGroups[optionGroupName]) || (optionGroup = optionGroups[optionGroupName] = [], 
                            optionGroupNames.push(optionGroupName)), multiple) selected = isDefined(selectedSet.remove(trackFn ? trackFn(scope, locals) : valueFn(scope, locals))); else {
                                if (trackFn) {
                                    var modelCast = {};
                                    modelCast[valueName] = modelValue, selected = trackFn(scope, modelCast) === trackFn(scope, locals);
                                } else selected = modelValue === valueFn(scope, locals);
                                selectedSet = selectedSet || selected;
                            }
                            label = displayFn(scope, locals), label = isDefined(label) ? label : "", optionGroup.push({
                                id: trackFn ? trackFn(scope, locals) : keyName ? keys[index] : index,
                                label: label,
                                selected: selected
                            });
                        }
                        for (multiple || (nullOption || null === modelValue ? optionGroups[""].unshift({
                            id: "",
                            label: "",
                            selected: !selectedSet
                        }) : selectedSet || optionGroups[""].unshift({
                            id: "?",
                            label: "",
                            selected: !0
                        })), groupIndex = 0, groupLength = optionGroupNames.length; groupLength > groupIndex; groupIndex++) {
                            for (optionGroupName = optionGroupNames[groupIndex], optionGroup = optionGroups[optionGroupName], 
                            optionGroupsCache.length <= groupIndex ? (existingParent = {
                                element: optGroupTemplate.clone().attr("label", optionGroupName),
                                label: optionGroup.label
                            }, existingOptions = [ existingParent ], optionGroupsCache.push(existingOptions), 
                            selectElement.append(existingParent.element)) : (existingOptions = optionGroupsCache[groupIndex], 
                            existingParent = existingOptions[0], existingParent.label != optionGroupName && existingParent.element.attr("label", existingParent.label = optionGroupName)), 
                            lastElement = null, index = 0, length = optionGroup.length; length > index; index++) option = optionGroup[index], 
                            (existingOption = existingOptions[index + 1]) ? (lastElement = existingOption.element, 
                            existingOption.label !== option.label && lastElement.text(existingOption.label = option.label), 
                            existingOption.id !== option.id && lastElement.val(existingOption.id = option.id), 
                            lastElement[0].selected !== option.selected && lastElement.prop("selected", existingOption.selected = option.selected)) : ("" === option.id && nullOption ? element = nullOption : (element = optionTemplate.clone()).val(option.id).attr("selected", option.selected).text(option.label), 
                            existingOptions.push(existingOption = {
                                element: element,
                                label: option.label,
                                id: option.id,
                                selected: option.selected
                            }), lastElement ? lastElement.after(element) : existingParent.element.append(element), 
                            lastElement = element);
                            for (index++; existingOptions.length > index; ) existingOptions.pop().element.remove();
                        }
                        for (;optionGroupsCache.length > groupIndex; ) optionGroupsCache.pop()[0].element.remove();
                    }
                    var match;
                    if (!(match = optionsExp.match(NG_OPTIONS_REGEXP))) throw ngOptionsMinErr("iexp", "Expected expression in form of '_select_ (as _label_)? for (_key_,)?_value_ in _collection_' but got '{0}'. Element: {1}", optionsExp, startingTag(selectElement));
                    var displayFn = $parse(match[2] || match[1]), valueName = match[4] || match[6], keyName = match[5], groupByFn = $parse(match[3] || ""), valueFn = $parse(match[2] ? match[1] : valueName), valuesFn = $parse(match[7]), track = match[8], trackFn = track ? $parse(match[8]) : null, optionGroupsCache = [ [ {
                        element: selectElement,
                        label: ""
                    } ] ];
                    nullOption && ($compile(nullOption)(scope), nullOption.removeClass("ng-scope"), 
                    nullOption.remove()), selectElement.html(""), selectElement.on("change", function() {
                        scope.$apply(function() {
                            var optionGroup, key, value, optionElement, index, groupIndex, length, groupLength, trackIndex, collection = valuesFn(scope) || [], locals = {};
                            if (multiple) {
                                for (value = [], groupIndex = 0, groupLength = optionGroupsCache.length; groupLength > groupIndex; groupIndex++) for (optionGroup = optionGroupsCache[groupIndex], 
                                index = 1, length = optionGroup.length; length > index; index++) if ((optionElement = optionGroup[index].element)[0].selected) {
                                    if (key = optionElement.val(), keyName && (locals[keyName] = key), trackFn) for (trackIndex = 0; trackIndex < collection.length && (locals[valueName] = collection[trackIndex], 
                                    trackFn(scope, locals) != key); trackIndex++) ; else locals[valueName] = collection[key];
                                    value.push(valueFn(scope, locals));
                                }
                            } else if (key = selectElement.val(), "?" == key) value = undefined; else if ("" === key) value = null; else if (trackFn) {
                                for (trackIndex = 0; trackIndex < collection.length; trackIndex++) if (locals[valueName] = collection[trackIndex], 
                                trackFn(scope, locals) == key) {
                                    value = valueFn(scope, locals);
                                    break;
                                }
                            } else locals[valueName] = collection[key], keyName && (locals[keyName] = key), 
                            value = valueFn(scope, locals);
                            ctrl.$setViewValue(value);
                        });
                    }), ctrl.$render = render, scope.$watch(render);
                }
                if (ctrls[1]) {
                    for (var emptyOption, selectCtrl = ctrls[0], ngModelCtrl = ctrls[1], multiple = attr.multiple, optionsExp = attr.ngOptions, nullOption = !1, optionTemplate = jqLite(document.createElement("option")), optGroupTemplate = jqLite(document.createElement("optgroup")), unknownOption = optionTemplate.clone(), i = 0, children = element.children(), ii = children.length; ii > i; i++) if ("" === children[i].value) {
                        emptyOption = nullOption = children.eq(i);
                        break;
                    }
                    if (selectCtrl.init(ngModelCtrl, nullOption, unknownOption), multiple && (attr.required || attr.ngRequired)) {
                        var requiredValidator = function(value) {
                            return ngModelCtrl.$setValidity("required", !attr.required || value && value.length), 
                            value;
                        };
                        ngModelCtrl.$parsers.push(requiredValidator), ngModelCtrl.$formatters.unshift(requiredValidator), 
                        attr.$observe("required", function() {
                            requiredValidator(ngModelCtrl.$viewValue);
                        });
                    }
                    optionsExp ? setupAsOptions(scope, element, ngModelCtrl) : multiple ? setupAsMultiple(scope, element, ngModelCtrl) : setupAsSingle(scope, element, ngModelCtrl, selectCtrl);
                }
            }
        };
    } ], optionDirective = [ "$interpolate", function($interpolate) {
        var nullSelectCtrl = {
            addOption: noop,
            removeOption: noop
        };
        return {
            restrict: "E",
            priority: 100,
            compile: function(element, attr) {
                if (isUndefined(attr.value)) {
                    var interpolateFn = $interpolate(element.text(), !0);
                    interpolateFn || attr.$set("value", element.text());
                }
                return function(scope, element, attr) {
                    var selectCtrlName = "$selectController", parent = element.parent(), selectCtrl = parent.data(selectCtrlName) || parent.parent().data(selectCtrlName);
                    selectCtrl && selectCtrl.databound ? element.prop("selected", !1) : selectCtrl = nullSelectCtrl, 
                    interpolateFn ? scope.$watch(interpolateFn, function(newVal, oldVal) {
                        attr.$set("value", newVal), newVal !== oldVal && selectCtrl.removeOption(oldVal), 
                        selectCtrl.addOption(newVal);
                    }) : selectCtrl.addOption(attr.value), element.on("$destroy", function() {
                        selectCtrl.removeOption(attr.value);
                    });
                };
            }
        };
    } ], styleDirective = valueFn({
        restrict: "E",
        terminal: !0
    });
    bindJQuery(), publishExternalAPI(angular), jqLite(document).ready(function() {
        angularInit(document, bootstrap);
    });
}(window, document), !angular.$$csp() && angular.element(document).find("head").prepend('<style type="text/css">@charset "UTF-8";[ng\\:cloak],[ng-cloak],[data-ng-cloak],[x-ng-cloak],.ng-cloak,.x-ng-cloak,.ng-hide{display:none !important;}ng\\:form{display:block;}.ng-animate-start{clip:rect(0,auto,auto,0);-ms-zoom:1.0001;}.ng-animate-active{clip:rect(-1px,auto,auto,0);-ms-zoom:1;}</style>'), 
function(root, factory) {
    "object" == typeof exports ? module.exports = factory() : "function" == typeof define && define.amd ? define(factory) : root.Spinner = factory();
}(this, function() {
    "use strict";
    function createEl(tag, prop) {
        var n, el = document.createElement(tag || "div");
        for (n in prop) el[n] = prop[n];
        return el;
    }
    function ins(parent) {
        for (var i = 1, n = arguments.length; n > i; i++) parent.appendChild(arguments[i]);
        return parent;
    }
    function addAnimation(alpha, trail, i, lines) {
        var name = [ "opacity", trail, ~~(100 * alpha), i, lines ].join("-"), start = .01 + i / lines * 100, z = Math.max(1 - (1 - alpha) / trail * (100 - start), alpha), prefix = useCssAnimations.substring(0, useCssAnimations.indexOf("Animation")).toLowerCase(), pre = prefix && "-" + prefix + "-" || "";
        return animations[name] || (sheet.insertRule("@" + pre + "keyframes " + name + "{0%{opacity:" + z + "}" + start + "%{opacity:" + alpha + "}" + (start + .01) + "%{opacity:1}" + (start + trail) % 100 + "%{opacity:" + alpha + "}100%{opacity:" + z + "}}", sheet.cssRules.length), 
        animations[name] = 1), name;
    }
    function vendor(el, prop) {
        var pp, i, s = el.style;
        if (void 0 !== s[prop]) return prop;
        for (prop = prop.charAt(0).toUpperCase() + prop.slice(1), i = 0; i < prefixes.length; i++) if (pp = prefixes[i] + prop, 
        void 0 !== s[pp]) return pp;
    }
    function css(el, prop) {
        for (var n in prop) el.style[vendor(el, n) || n] = prop[n];
        return el;
    }
    function merge(obj) {
        for (var i = 1; i < arguments.length; i++) {
            var def = arguments[i];
            for (var n in def) void 0 === obj[n] && (obj[n] = def[n]);
        }
        return obj;
    }
    function pos(el) {
        for (var o = {
            x: el.offsetLeft,
            y: el.offsetTop
        }; el = el.offsetParent; ) o.x += el.offsetLeft, o.y += el.offsetTop;
        return o;
    }
    function Spinner(o) {
        return "undefined" == typeof this ? new Spinner(o) : (this.opts = merge(o || {}, Spinner.defaults, defaults), 
        void 0);
    }
    function initVML() {
        function vml(tag, attr) {
            return createEl("<" + tag + ' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">', attr);
        }
        sheet.addRule(".spin-vml", "behavior:url(#default#VML)"), Spinner.prototype.lines = function(el, o) {
            function grp() {
                return css(vml("group", {
                    coordsize: s + " " + s,
                    coordorigin: -r + " " + -r
                }), {
                    width: s,
                    height: s
                });
            }
            function seg(i, dx, filter) {
                ins(g, ins(css(grp(), {
                    rotation: 360 / o.lines * i + "deg",
                    left: ~~dx
                }), ins(css(vml("roundrect", {
                    arcsize: o.corners
                }), {
                    width: r,
                    height: o.width,
                    left: o.radius,
                    top: -o.width >> 1,
                    filter: filter
                }), vml("fill", {
                    color: o.color,
                    opacity: o.opacity
                }), vml("stroke", {
                    opacity: 0
                }))));
            }
            var i, r = o.length + o.width, s = 2 * r, margin = 2 * -(o.width + o.length) + "px", g = css(grp(), {
                position: "absolute",
                top: margin,
                left: margin
            });
            if (o.shadow) for (i = 1; i <= o.lines; i++) seg(i, -2, "progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)");
            for (i = 1; i <= o.lines; i++) seg(i);
            return ins(el, g);
        }, Spinner.prototype.opacity = function(el, i, val, o) {
            var c = el.firstChild;
            o = o.shadow && o.lines || 0, c && i + o < c.childNodes.length && (c = c.childNodes[i + o], 
            c = c && c.firstChild, c = c && c.firstChild, c && (c.opacity = val));
        };
    }
    var useCssAnimations, prefixes = [ "webkit", "Moz", "ms", "O" ], animations = {}, sheet = function() {
        var el = createEl("style", {
            type: "text/css"
        });
        return ins(document.getElementsByTagName("head")[0], el), el.sheet || el.styleSheet;
    }(), defaults = {
        lines: 12,
        length: 7,
        width: 5,
        radius: 10,
        rotate: 0,
        corners: 1,
        color: "#000",
        direction: 1,
        speed: 1,
        trail: 100,
        opacity: .25,
        fps: 20,
        zIndex: 2e9,
        className: "spinner",
        top: "auto",
        left: "auto",
        position: "relative"
    };
    Spinner.defaults = {}, merge(Spinner.prototype, {
        spin: function(target) {
            this.stop();
            var ep, tp, self = this, o = self.opts, el = self.el = css(createEl(0, {
                className: o.className
            }), {
                position: o.position,
                width: 0,
                zIndex: o.zIndex
            }), mid = o.radius + o.length + o.width;
            if (target && (target.insertBefore(el, target.firstChild || null), tp = pos(target), 
            ep = pos(el), css(el, {
                left: ("auto" == o.left ? tp.x - ep.x + (target.offsetWidth >> 1) : parseInt(o.left, 10) + mid) + "px",
                top: ("auto" == o.top ? tp.y - ep.y + (target.offsetHeight >> 1) : parseInt(o.top, 10) + mid) + "px"
            })), el.setAttribute("role", "progressbar"), self.lines(el, self.opts), !useCssAnimations) {
                var alpha, i = 0, start = (o.lines - 1) * (1 - o.direction) / 2, fps = o.fps, f = fps / o.speed, ostep = (1 - o.opacity) / (f * o.trail / 100), astep = f / o.lines;
                !function anim() {
                    i++;
                    for (var j = 0; j < o.lines; j++) alpha = Math.max(1 - (i + (o.lines - j) * astep) % f * ostep, o.opacity), 
                    self.opacity(el, j * o.direction + start, alpha, o);
                    self.timeout = self.el && setTimeout(anim, ~~(1e3 / fps));
                }();
            }
            return self;
        },
        stop: function() {
            var el = this.el;
            return el && (clearTimeout(this.timeout), el.parentNode && el.parentNode.removeChild(el), 
            this.el = void 0), this;
        },
        lines: function(el, o) {
            function fill(color, shadow) {
                return css(createEl(), {
                    position: "absolute",
                    width: o.length + o.width + "px",
                    height: o.width + "px",
                    background: color,
                    boxShadow: shadow,
                    transformOrigin: "left",
                    transform: "rotate(" + ~~(360 / o.lines * i + o.rotate) + "deg) translate(" + o.radius + "px,0)",
                    borderRadius: (o.corners * o.width >> 1) + "px"
                });
            }
            for (var seg, i = 0, start = (o.lines - 1) * (1 - o.direction) / 2; i < o.lines; i++) seg = css(createEl(), {
                position: "absolute",
                top: 1 + ~(o.width / 2) + "px",
                transform: o.hwaccel ? "translate3d(0,0,0)" : "",
                opacity: o.opacity,
                animation: useCssAnimations && addAnimation(o.opacity, o.trail, start + i * o.direction, o.lines) + " " + 1 / o.speed + "s linear infinite"
            }), o.shadow && ins(seg, css(fill("#000", "0 0 4px #000"), {
                top: "2px"
            })), ins(el, ins(seg, fill(o.color, "0 0 1px rgba(0,0,0,.1)")));
            return el;
        },
        opacity: function(el, i, val) {
            i < el.childNodes.length && (el.childNodes[i].style.opacity = val);
        }
    });
    var probe = css(createEl("group"), {
        behavior: "url(#default#VML)"
    });
    return !vendor(probe, "transform") && probe.adj ? initVML() : useCssAnimations = vendor(probe, "animation"), 
    Spinner;
}), function(root, factory) {
    "object" == typeof exports ? module.exports = factory() : "function" == typeof define && define.amd ? define([ "spin" ], factory) : root.Ladda = factory(root.Spinner);
}(this, function(Spinner) {
    "use strict";
    function create(button) {
        if ("undefined" == typeof button) return console.warn("Ladda button target must be defined."), 
        void 0;
        button.querySelector(".ladda-label") || (button.innerHTML = '<span class="ladda-label">' + button.innerHTML + "</span>");
        var spinner = createSpinner(button), spinnerWrapper = document.createElement("span");
        spinnerWrapper.className = "ladda-spinner", button.appendChild(spinnerWrapper);
        var timer, instance = {
            start: function() {
                return button.setAttribute("disabled", ""), button.setAttribute("data-loading", ""), 
                clearTimeout(timer), spinner.spin(spinnerWrapper), this.setProgress(0), this;
            },
            startAfter: function(delay) {
                return clearTimeout(timer), timer = setTimeout(function() {
                    instance.start();
                }, delay), this;
            },
            stop: function() {
                return button.removeAttribute("disabled"), button.removeAttribute("data-loading"), 
                clearTimeout(timer), timer = setTimeout(function() {
                    spinner.stop();
                }, 1e3), this;
            },
            toggle: function() {
                return this.isLoading() ? this.stop() : this.start(), this;
            },
            setProgress: function(progress) {
                progress = Math.max(Math.min(progress, 1), 0);
                var progressElement = button.querySelector(".ladda-progress");
                0 === progress && progressElement && progressElement.parentNode ? progressElement.parentNode.removeChild(progressElement) : (progressElement || (progressElement = document.createElement("div"), 
                progressElement.className = "ladda-progress", button.appendChild(progressElement)), 
                progressElement.style.width = (progress || 0) * button.offsetWidth + "px");
            },
            enable: function() {
                return this.stop(), this;
            },
            disable: function() {
                return this.stop(), button.setAttribute("disabled", ""), this;
            },
            isLoading: function() {
                return button.hasAttribute("data-loading");
            }
        };
        return ALL_INSTANCES.push(instance), instance;
    }
    function getAncestorOfTagType(elem, type) {
        for (;elem.parentNode && elem.tagName !== type; ) elem = elem.parentNode;
        return elem;
    }
    function getRequiredFields(elem) {
        for (var requirables = [ "input", "textarea" ], inputs = [], i = 0; i < requirables.length; i++) for (var name_els = elem.getElementsByTagName(requirables[i]), j = 0; j < name_els.length; j++) name_els[j].hasAttribute("required") && inputs.push(name_els[j]);
        return inputs;
    }
    function bind(target, options) {
        options = options || {};
        var targets = [];
        "string" == typeof target ? targets = toArray(document.querySelectorAll(target)) : "object" == typeof target && "string" == typeof target.nodeName && (targets = [ target ]);
        for (var i = 0, len = targets.length; len > i; i++) !function() {
            var element = targets[i];
            if ("function" == typeof element.addEventListener) {
                var instance = create(element), timeout = -1;
                element.addEventListener("click", function() {
                    for (var valid = !0, form = getAncestorOfTagType(element, "FORM"), requireds = getRequiredFields(form), i = 0; i < requireds.length; i++) "" === requireds[i].value.replace(/^\s+|\s+$/g, "") && (valid = !1);
                    valid && (instance.startAfter(1), "number" == typeof options.timeout && (clearTimeout(timeout), 
                    timeout = setTimeout(instance.stop, options.timeout)), "function" == typeof options.callback && options.callback.apply(null, [ instance ]));
                }, !1);
            }
        }();
    }
    function stopAll() {
        for (var i = 0, len = ALL_INSTANCES.length; len > i; i++) ALL_INSTANCES[i].stop();
    }
    function createSpinner(button) {
        var spinnerColor, height = button.offsetHeight;
        height > 32 && (height *= .8), button.hasAttribute("data-spinner-size") && (height = parseInt(button.getAttribute("data-spinner-size"), 10)), 
        button.hasAttribute("data-spinner-color") && (spinnerColor = button.getAttribute("data-spinner-color"));
        var lines = 12, radius = .2 * height, length = .6 * radius, width = 7 > radius ? 2 : 3;
        return new Spinner({
            color: spinnerColor || "#fff",
            lines: lines,
            radius: radius,
            length: length,
            width: width,
            zIndex: "auto",
            top: "auto",
            left: "auto",
            className: ""
        });
    }
    function toArray(nodes) {
        for (var a = [], i = 0; i < nodes.length; i++) a.push(nodes[i]);
        return a;
    }
    var ALL_INSTANCES = [];
    return {
        bind: bind,
        create: create,
        stopAll: stopAll
    };
}), function() {
    "use strict";
    var module = angular.module("App", [ "App.controllers", "App.EntityModel", "App.DataContext", "App.DataProvider", "App.Utils", "App.filters", "App.services", "App.BreezeStorage", "App.WebService", "App.MockServiceBreeze", "App.directives", "breeze.directives", "App.LaddaButton" ]).config(function(zDirectivesConfigProvider) {
        zDirectivesConfigProvider.zValidateTemplate = '<span class="invalid error-msg"><i class="glyphicon glyphicon-warning-sign"></i>%error%</span>';
    });
    module.value("gLadda", function() {
        if ("Ladda" in window && "Spinner" in window) return Ladda;
        throw new Error("The Globals Ladda || Spinner are missing");
    }()), module.value("gBreeze", function() {
        if ("breeze" in window) return breeze;
        throw new Error("The Globals breeze is missing");
    }()), module.value("gQ", function() {
        if ("Q" in window) return Q;
        throw new Error("The Globals Q is missing");
    }());
}(), function() {
    "use strict";
    var module = angular.module("breeze.directives", []);
    module.directive("zValidate", function(zDirectivesConfig, $parse) {
        function link(scope, element, attrs) {
            function valErrsChanged(newValue) {
                var el = element[0];
                newValue ? scope.$parent.form.$setValidity(scope.formField.key, !1) : scope.$parent.form.$setValidity(scope.formField.key, !0), 
                el.setCustomValidity && el.setCustomValidity(newValue);
                var errEl = element.nextAll(".invalid").first();
                if (newValue) {
                    var html = zDirectivesConfig.zValidateTemplate.replace(/%error%/, newValue);
                    errEl.length ? errEl.replaceWith(html) : (errEl = angular.element(html), element.after(errEl));
                } else errEl.remove();
            }
            var info = getInfo(scope, attrs);
            setDisabled(scope, info), setRequired(element, info), scope.$watch(info.getValErrs, valErrsChanged);
        }
        function getInfo(scope, attrs) {
            function aspectFromPath() {
                try {
                    return scope.$eval(entityPath).entityAspect;
                } catch (_) {
                    return void 0;
                }
            }
            function aspectFromEntity() {
                return scope.entityAspect;
            }
            function createGetValErrs() {
                return function() {
                    var aspect = getAspect();
                    if (aspect) {
                        var errs = aspect.getValidationErrors(propertyPath);
                        return errs.length ? errs.map(function(e) {
                            return e.errorMessage;
                        }).join("; ") : "";
                    }
                    return null;
                };
            }
            function getType() {
                var aspect = getAspect();
                return aspect ? aspect.entity.entityType : null;
            }
            function getEntityAndPropertyPaths() {
                var paths;
                if (ngModel) if (ngModel.indexOf("[")) {
                    var str = ngModel.replace("]", "");
                    paths = str.split("[");
                    var fn = $parse(paths[1]);
                    propertyPath = fn(scope), entityPath = paths[0];
                } else paths = ngModel.split("."), propertyPath = paths.pop(), entityPath = paths.join(".");
                if (valPath) {
                    paths = valPath.split(",");
                    var pPath = paths.pop(), ePath = paths.pop();
                    pPath && (propertyPath = pPath.trim()), ePath && (entityPath = ePath.trim());
                }
            }
            var entityPath = null, propertyPath = null, ngModel = attrs.ngModel, valPath = attrs.zValidate;
            if (!ngModel && !valPath) return {
                getValErrs: function() {
                    return "";
                }
            };
            getEntityAndPropertyPaths();
            var getAspect = entityPath ? aspectFromPath : aspectFromEntity, result = {
                entityPath: entityPath,
                propertyPath: propertyPath,
                getAspect: getAspect,
                getType: getType,
                getValErrs: createGetValErrs()
            };
            return result;
        }
        function setRequired(element, info) {
            var el = element[0];
            if (!el.hasSetRequired) {
                var entityType = info.getType();
                if (entityType) {
                    var requiredProperties = entityType.required;
                    if (requiredProperties && requiredProperties[info.propertyPath]) {
                        var reqHtml = zDirectivesConfig.zRequiredTemplate, reqEl = angular.element(reqHtml);
                        element.after(reqEl);
                    }
                    el.hasSetRequired = !0;
                }
            }
        }
        function setDisabled(scope, info) {
            var entityType = info.getType();
            if (entityType) for (var props = info.getType().getProperties(), i = 0; i < props.length; i++) {
                var obj = props[i];
                obj.name === scope.formField.key && obj.isPartOfKey && (scope.isReadOnly = !0);
            }
        }
        return {
            link: link,
            restrict: "A"
        };
    }), module.provider("zDirectivesConfig", function() {
        this.zValidateTemplate = '<span class="invalid">%error%</span>', this.zRequiredTemplate = '<span class="error-required glyphicon glyphicon-asterisk" title="Required"></span>', 
        this.$get = function() {
            return {
                zValidateTemplate: this.zValidateTemplate,
                zRequiredTemplate: this.zRequiredTemplate
            };
        };
    });
}(), function() {
    "use strict";
    var module = angular.module("App.BreezeStorage", []);
    module.factory("BreezeStorage", function() {
        var stashName = "entityGraph", getEntityGraph = function() {
            return window.localStorage.getItem(stashName);
        }, setEntityGraph = function(exportData) {
            return window.localStorage.setItem(stashName, exportData);
        };
        return {
            setEntityGraph: setEntityGraph,
            getEntityGraph: getEntityGraph
        };
    });
}(), function() {
    "use strict";
    var module = angular.module("App.controllers", []);
    module.controller("AppCtrl", function($scope, $rootScope, $timeout, $log, $http, DataModel, BreezeStorage, DataProvider, DataContext, gBreeze) {
        function resetForm() {
            $scope.formData = null, $scope.activeItem = null;
        }
        function exportChanges() {
            var entities = DataContext.manager.getEntities();
            angular.forEach(entities, function(entity) {
                entity.id < 0 && (entity.entityAspect.hasTempKey = !0);
            }), doIt();
            var exportData = DataContext.manager.exportEntities(), data = JSON.parse(exportData);
            data.dataService.serviceName = "http://localhost:3000", exportData = JSON.stringify(data), 
            BreezeStorage.setEntityGraph(exportData);
        }
        function doIt() {
            var entities = DataContext.manager.getEntities();
            angular.forEach(entities, function(entity) {
                console.log("id:", entity.id, "State:", entity.entityAspect.entityState.name, "hasTempId:", entity.entityAspect.hasTempKey);
            }), console.log("");
        }
        function updateUI() {
            var query = new gBreeze.EntityQuery("Employee");
            $scope.employees = DataContext.manager.executeQueryLocally(query);
            var query = new gBreeze.EntityQuery("Departement");
            $scope.departements = DataContext.manager.executeQueryLocally(query);
            var query = new gBreeze.EntityQuery("Fonction");
            $scope.fonctions = DataContext.manager.executeQueryLocally(query);
        }
        $scope.employees = null, $scope.departements = null, $scope.fonctions = null, $scope.isActive = function(item) {
            return this.activeItem === item;
        }, $scope.onSelect = function(item) {
            $scope.activeItem && "Detached" !== $scope.activeItem.entityAspect.entityState.name && $scope.activeItem.entityAspect.rejectChanges(), 
            $scope.activeItem = item;
            for (var props = DataContext.manager.metadataStore.getEntityType(item.entityType.shortName).dataProperties, formData = [], i = 0; i < props.length; i++) {
                var prop = props[i];
                formData.push({
                    label: prop.name,
                    type: "text",
                    key: prop.name
                });
            }
            $scope.formData = formData;
        }, $scope.onAddEmployee = function() {
            var newEntity = DataContext.manager.createEntity("Employee", {});
            $scope.onSelect(newEntity);
        }, $scope.isAddEmployeeComplete = function() {
            return "test";
        }, $scope.onAddFonction = function() {
            var newEntity = DataContext.manager.createEntity("Fonction", {});
            $scope.onSelect(newEntity);
        }, $scope.onAddDepartement = function() {
            var newEntity = DataContext.manager.createEntity("Departement", {});
            $scope.onSelect(newEntity);
        }, $scope.onGetEmployees = function() {
            DataContext.getAllEntity("Employee").then(function(res) {
                console.log(res), $scope.employees = res, $scope.$digest();
            });
        }, $scope.onGetFonctions = function() {
            DataContext.getAllEntity("Fonction").then(function(res) {
                console.log(res), $scope.fonctions = res, $scope.$digest();
            });
        }, $scope.onGetDepartements = function() {
            DataContext.getAllEntity("Departement").then(function(res) {
                console.log(res), $scope.departements = res, $scope.$digest();
            });
        }, $scope.isUnchanged = function(activeItem) {
            if (activeItem) {
                var state = activeItem.entityAspect.entityState;
                return state.isUnchanged() ? !0 : !1;
            }
        }, $scope.onSave = function(activeItem) {
            activeItem.entityAspect.setUnchanged(), exportChanges(), resetForm(), $scope.onGetEntityGraph();
        }, $scope.onCancel = function(activeItem) {
            activeItem.entityAspect.rejectChanges();
        }, $scope.onDelete = function(activeItem) {
            activeItem.id < 0 ? (console.log("setDetached"), activeItem.entityAspect.setDetached()) : (console.log("setDeleted"), 
            activeItem.entityAspect.setDeleted()), exportChanges(), resetForm(), $scope.onGetEntityGraph();
        }, $scope.onGetEntityGraph = function() {
            var importData = BreezeStorage.getEntityGraph();
            DataContext.manager.importEntities(importData, {
                mergeStrategy: gBreeze.MergeStrategy.OverwriteChanges
            });
            DataContext.manager.getEntities();
            doIt(), updateUI();
        }, $scope.onSetEntityGraph = function() {
            exportChanges();
        }, $scope.onSaveEntityGraph = function() {
            var deferred = Q.defer();
            doIt();
            var entities = DataContext.manager.getEntities();
            return angular.forEach(entities, function(entity) {
                entity.id < 0 && (entity.entityAspect.hasTempKey = !0, entity.entityAspect.setModified());
            }), DataContext.manager.saveChanges().then(function() {
                angular.forEach(entities, function(entity) {
                    entity.entityAspect.entityState.isDeleted() ? DataContext.manager.detachEntity(entity) : entity.entityAspect.acceptChanges();
                }), exportChanges(), $scope.$digest(), deferred.resolve();
            }).fail(function(err) {
                console.log("err:", err), deferred.reject();
            }), deferred.promise;
        };
    });
}(), function() {
    "use strict";
    var services = angular.module("App.DataProvider", []);
    services.factory("DataProvider", function(WebService, GLOBALS, MockServiceBreeze) {
        var dataProvider = null;
        switch (GLOBALS.MODE) {
          case GLOBALS.WS:
            dataProvider = WebService;
            break;

          case GLOBALS.DB:
            break;

          case GLOBALS.MOCK_BREEZE:
            dataProvider = MockServiceBreeze;
        }
        return dataProvider;
    });
}(), function() {
    "use strict";
    var services = angular.module("App.DataContext", []);
    services.factory("DataContext", function(EntityModel, jsonResultsAdapter, DataProvider, $log, gBreeze) {
        function exportEmployees(employees) {
            return manager.exportEntities(employees);
        }
        function createEntity(entityType, rows) {
            var entities = [];
            angular.forEach(rows, function(row) {
                var newEntity = manager.createEntity(entityType, row);
                newEntity.entityAspect.acceptChanges(), entities.push(newEntity);
            });
            var query = new gBreeze.EntityQuery(entityType).toType(entityType), results = manager.executeQueryLocally(query);
            return results;
        }
        function getAllEntity(entityType) {
            var deferred = Q.defer();
            return DataProvider.getAllEntity(entityType, manager).catch(function(err) {
                $log.error("Error getAllEntity", err), deferred.reject(new Error(err));
            }).done(function(res) {
                deferred.resolve(res);
            }), deferred.promise;
        }
        function saveEntity(entity) {
            var deferred = Q.defer();
            return StorageProvider.saveEntity(entity).catch(function(err) {
                $log.error("Error saveEntity", err), deferred.reject(new Error(err));
            }).done(function(res) {
                var entities = createEntity(entityType, res);
                deferred.resolve(entities);
            }), deferred.promise;
        }
        function deleteEntity(entity) {
            var deferred = Q.defer();
            return StorageProvider.deleteEntity(entity).catch(function(err) {
                $log.error("Error deleteEntity", err), deferred.reject(new Error(err));
            }).done(function(res) {
                deferred.resolve(res);
            }), deferred.promise;
        }
        gBreeze.config.initializeAdapterInstance("modelLibrary", "backingStore", !0);
        var serviceName = "http://localhost/~Separ8/local-storage", ds = new gBreeze.DataService({
            serviceName: serviceName,
            hasServerMetadata: !1,
            useJsonp: !1,
            jsonResultsAdapter: jsonResultsAdapter
        }), manager = new gBreeze.EntityManager({
            dataService: ds
        });
        return EntityModel.initialize(manager.metadataStore), {
            exportEmployees: exportEmployees,
            getAllEntity: getAllEntity,
            saveEntity: saveEntity,
            deleteEntity: deleteEntity,
            manager: manager
        };
    });
}(), function() {
    "use strict";
    var directives = angular.module("App.directives", []);
    directives.directive("nodeMaster", function() {
        function link() {
            console.log("test");
        }
        return {
            restrict: "A",
            link: link,
            templateUrl: "partials/node-master.html",
            scope: {
                nodes: "="
            }
        };
    }), directives.directive("nodeList", function() {
        function link(scope) {
            console.log("test"), scope.newNode = function(data) {
                var d = data || [ {
                    key: "key",
                    value: "value"
                } ];
                scope.nodes.push(d);
            };
        }
        return {
            scope: !0,
            restrict: "A",
            link: link,
            templateUrl: "partials/node-list.html",
            controller: function($scope) {
                this.newNode = function(data) {
                    var d = data || {};
                    $scope.nodes.push(d);
                }, this.deleteNode = function(data) {
                    var i = $scope.node.indexOf(data);
                    i > 0 && $scope.node.splice(i, 1);
                };
            }
        };
    }), directives.directive("nodeItem", function() {
        function link() {}
        return {
            restrict: "A",
            link: link,
            templateUrl: "partials/node-item.html",
            controller: function($scope) {
                this.newData = function(data) {
                    var d = data || {};
                    $scope.node.push(d);
                }, this.newChild = function() {
                    var d = data || {};
                    $scope.node.push(d);
                }, this.deleteData = function(data) {
                    var i = $scope.node.indexOf(data);
                    i > 0 && $scope.node.splice(i, 1);
                };
            }
        };
    }), directives.directive("nodeData", function($log, $compile) {
        function link(scope, element, attrs, ctrl) {
            function newChild() {
                newElement = angular.element("<div node-list nodes='nodes'></div>"), newScope = scope.$new();
                var nodesData = [ [ {
                    key: "key",
                    value: "value"
                } ] ];
                angular.isArray(scope.data.value) && (nodesData = scope.data.value), newScope.nodes = nodesData, 
                scope.data.value = newScope.nodes, $compile(newElement)(newScope, function(clonedElement) {
                    element.find(".value").replaceWith(clonedElement);
                });
            }
            var data = scope.data(), newScope = null, newElement = null, oldElement = '<input ng-model="data.value" type="text" class="value" ng-enter="newData(data.value)">';
            scope.data = data, scope.newData = function() {
                ctrl.newData();
            }, scope.deleteData = function() {
                ctrl.deleteData(scope.data);
            }, scope.$watch(function() {
                return scope.data.key;
            }, function() {
                "children" === scope.data.key ? (console.log("new Children"), newChild()) : angular.isArray(scope.data.value) && (console.log("test"), 
                scope.data.value = "value", $compile(oldElement)(scope, function() {
                    ctrl.deleteData(scope.data), ctrl.newData();
                }));
            });
        }
        return {
            require: "^nodeItem",
            restrict: "A",
            scope: {
                data: "&"
            },
            templateUrl: "partials/node-data.html",
            link: link
        };
    }), directives.directive("ngEnter", function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                13 === event.which && (scope.$apply(function() {
                    scope.$eval(attrs.ngEnter);
                }), event.preventDefault());
            });
        };
    }), directives.directive("ngDelete", function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                8 === event.which && (void 0 === scope.data.key || 0 === scope.data.key.length) && (scope.$apply(function() {
                    scope.$eval(attrs.ngDelete);
                }), event.preventDefault());
            });
        };
    }), directives.directive("autoFocus", function($timeout) {
        return {
            link: function(scope, element, attrs) {
                scope.$watch(attrs.autoFocus, function() {
                    $timeout(function() {
                        element[0].focus(), scope.$digest();
                    }, 0);
                }, !0);
            }
        };
    }), directives.directive("formField", function() {
        function link() {}
        return {
            restrict: "A",
            link: link,
            templateUrl: "partials/form-field.html",
            controller: function() {}
        };
    });
}(), function() {
    "use strict";
    var services = angular.module("App.EntityModel", []);
    services.factory("EntityModel", function($http, $log, $rootScope, gBreeze) {
        function initialize(metadataStore) {
            function Employee() {}
            metadataStore.addEntityType({
                shortName: "Employee",
                namespace: "Context",
                autoGeneratedKeyType: gBreeze.AutoGeneratedKeyType.Identity,
                dataProperties: {
                    id: {
                        dataType: DT.Int64,
                        isPartOfKey: !0
                    },
                    nom: {
                        dataType: DT.String,
                        validators: [ Validator.required(), Validator.maxLength({
                            maxLength: 20
                        }) ]
                    },
                    prenom: {
                        dataType: DT.String
                    },
                    email: {
                        dataType: DT.String
                    },
                    adresse: {
                        dataType: DT.String
                    },
                    departement_id: {
                        dataType: DT.Int64
                    },
                    fonction_id: {
                        dataType: DT.Int64
                    }
                },
                navigationProperties: {
                    departement: {
                        isScalar: !0,
                        entityTypeName: "Departement:#Context",
                        associationName: "Employee_Departement",
                        foreignKeyNames: [ "departement_id" ]
                    },
                    fonction: {
                        isScalar: !0,
                        entityTypeName: "Fonction:#Context",
                        associationName: "Employee_Fonction",
                        foreignKeyNames: [ "fonction_id" ]
                    }
                }
            }), metadataStore.setEntityTypeForResourceName("Employee", "Employee");
            var employeeInitializer = function() {};
            metadataStore.registerEntityTypeCtor("Employee", Employee, employeeInitializer), 
            metadataStore.addEntityType({
                shortName: "Departement",
                namespace: "Context",
                autoGeneratedKeyType: gBreeze.AutoGeneratedKeyType.Identity,
                dataProperties: {
                    id: {
                        dataType: DT.Int64,
                        isPartOfKey: !0,
                        validators: [ Validator.required(), Validator.integer() ]
                    },
                    nom: {
                        dataType: "String",
                        validators: [ Validator.required(), Validator.maxLength({
                            maxLength: 20
                        }) ]
                    }
                },
                navigationProperties: {
                    employee: {
                        isScalar: !1,
                        entityTypeName: "Employee:#Context",
                        associationName: "Employee_Departement"
                    }
                }
            }), metadataStore.setEntityTypeForResourceName("Departement", "Departement"), metadataStore.addEntityType({
                shortName: "Fonction",
                namespace: "Context",
                autoGeneratedKeyType: gBreeze.AutoGeneratedKeyType.Identity,
                dataProperties: {
                    id: {
                        dataType: DT.Int64,
                        isPartOfKey: !0
                    },
                    nom: {
                        dataType: "String",
                        validators: [ Validator.required(), Validator.maxLength({
                            maxLength: 20
                        }) ]
                    }
                },
                navigationProperties: {
                    employee: {
                        isScalar: !1,
                        entityTypeName: "Employee:#Context",
                        associationName: "Employee_Fonction"
                    }
                }
            }), metadataStore.setEntityTypeForResourceName("Fonction", "Fonction"), detectRequired(metadataStore);
        }
        function detectRequired(metadataStore) {
            var types = metadataStore.getEntityTypes();
            types.forEach(function(type) {
                var entityRequired = {};
                type.required = entityRequired;
                var props = type.getProperties();
                props.forEach(function(prop) {
                    for (var vals = prop.validators, i = 0, len = vals.length; len > i; i++) if ("required" === vals[i].name) {
                        entityRequired[prop.name] = !0;
                        break;
                    }
                });
            });
        }
        var DT = gBreeze.DataType, Validator = gBreeze.Validator;
        return {
            initialize: initialize
        };
    });
}(), function() {
    "use strict";
    var filters = angular.module("App.filters", []);
    filters.filter("age", function() {
        return function(text) {
            var age = moment(text, "DD-MM-YYYY").fromNow();
            return age;
        };
    });
}(), function() {
    "use strict";
    var module = angular.module("App.LaddaButton", []);
    module.directive("laddaButton", function($log, $parse, gLadda) {
        function link(scope, element, attrs) {
            element.bind("click", function() {
                var btn = gLadda.create(this);
                btn.start();
                var fn = $parse(attrs.laddaButton);
                scope.$apply(function() {
                    var promise = fn(scope, {});
                    promise.finally(function() {
                        btn.stop();
                    });
                });
            });
        }
        return {
            restrict: "A",
            link: link
        };
    });
}(), function() {
    "use strict";
    var services = angular.module("App.MockServiceBreeze", []);
    services.factory("jsonResultsAdapter", function(gBreeze) {
        return new gBreeze.JsonResultsAdapter({
            name: "context",
            extractResults: function(data) {
                var results = data.results;
                if (!results) throw new Error("Unable to resolve 'results' property");
                return results && (results.employes || results.departements || results.fonctions);
            },
            visitNode: function(node, parseContext) {
                var index = parseContext.url.lastIndexOf("/"), str = parseContext.url.substr(index);
                return "/employes.json" === str ? {
                    entityType: "Employee"
                } : "/departements.json" === str ? {
                    entityType: "Departement"
                } : "/fonctions.json" === str ? {
                    entityType: "Fonction"
                } : void 0;
            }
        });
    }), services.factory("MockServiceBreeze", function(Utils, $log, gBreeze) {
        function getAllEmployee() {
            var query = gBreeze.EntityQuery.from("assets/employes.json");
            return manager.executeQuery(query).then(returnResults);
        }
        function getAllDepartement() {
            var query = gBreeze.EntityQuery.from("assets/departements.json");
            return manager.executeQuery(query).then(returnResults);
        }
        function getAllFonction() {
            var query = gBreeze.EntityQuery.from("/assets/fonctions.json");
            return manager.executeQuery(query).then(returnResults);
        }
        function returnResults(data) {
            return data.results;
        }
        var manager = null, getAllEntity = function(entityType, _manager) {
            var fn = null;
            switch (manager = _manager, entityType) {
              case "Employee":
                fn = getAllEmployee();
                break;

              case "Departement":
                fn = getAllDepartement();
                break;

              case "Fonction":
                fn = getAllFonction();
            }
            return fn;
        };
        return {
            getAllEntity: getAllEntity
        };
    });
}(), function() {
    "use strict";
    var services = angular.module("App.services", []);
    services.value("GLOBALS", {
        MODE: "MOCK_BREEZE",
        DB: "DB",
        WS: "WS",
        MOCK_BREEZE: "MOCK_BREEZE",
        MOCK: "MOCK"
    }), services.factory("DataModel", function() {
        var dataModel = {};
        return dataModel.toggleViewOpen = !0, dataModel.sideNav = [], dataModel.currentPage = {}, 
        dataModel.isOnline = function() {
            return STATES.online;
        }, dataModel.isLockUI = function() {
            return STATES.lockUI;
        }, dataModel.isPriNavActive = function(value) {
            return value === $stateParams.navId ? "active" : "";
        }, dataModel;
    });
}(), function() {
    "use strict";
    var utils = {};
    utils.closeSingleQuotes = function(value) {
        return angular.isString(value) && angular.isDefined(value) && value && (value = value.replace(/'/g, "''")), 
        value;
    }, utils.entityToJson = function(entity) {
        var json = {}, props = entity.entityType.getProperties(), keys = [];
        return angular.forEach(props, function(obj) {
            obj.associationName || keys.push(obj.name);
        }), angular.forEach(keys, function(key) {
            json[key] = entity[key];
        }), json;
    };
    var services = angular.module("App.Utils", []);
    services.constant("Utils", utils);
}(), function() {
    "use strict";
    var services = angular.module("App.WebService", []);
    services.factory("WebService", function($http, $log) {
        function addSingleQuotes(str) {
            return str && (str = str.replace(/'/g, "''")), str;
        }
        var getEmployees = function() {
            $log.log("getEmployees");
            var deferred = Q.defer();
            return $.getJSON("assets/employes.json").success(function(res) {
                $log.log("getEmployees SUCCESS");
                var employees = [];
                angular.forEach(res.employes, function(employe) {
                    var e = {
                        id: employe.id,
                        nom: addSingleQuotes(employe.nom),
                        prenom: addSingleQuotes(employe.prenom),
                        email: employe.email,
                        adresse: addSingleQuotes(employe.adresse),
                        fonction_id: employe.fonction_id,
                        departement_id: employe.departement_id
                    };
                    employees.push(e);
                }), deferred.resolve(employees);
            }).error(function(err) {
                $log.log("getEmployees ERROR"), deferred.reject(new Error(err));
            }), deferred.promise;
        }, getDepartements = function() {
            $log.log("getDepartements");
            var deferred = Q.defer();
            return $.getJSON("assets/departements.json").success(function(res) {
                $log.log("getDepartements SUCCESS");
                var employees = [];
                angular.forEach(res.departements, function(departement) {
                    var obj = {
                        id: departement.id,
                        nom: addSingleQuotes(departement.nom)
                    };
                    employees.push(obj);
                }), deferred.resolve(employees);
            }).error(function(err) {
                $log.log("getDepartements ERROR"), deferred.reject(new Error(err));
            }), deferred.promise;
        }, getFonctions = function() {
            $log.log("getFonctions");
            var deferred = Q.defer();
            return $.getJSON("assets/fonctions.json").success(function(res) {
                $log.log("getFonctions SUCCESS");
                var fonctions = [];
                angular.forEach(res.fonctions, function(fonction) {
                    var obj = {
                        id: fonction.id,
                        nom: addSingleQuotes(fonction.nom)
                    };
                    fonctions.push(obj);
                }), deferred.resolve(fonctions);
            }).error(function(err) {
                $log.log("getFonctions ERROR"), deferred.reject(new Error(err));
            }), deferred.promise;
        }, getAllEmployee = function() {
            $log.log("getAllEmployee");
            var deferred = Q.defer();
            return $.getJSON("assets/employes.json").success(function(res) {
                $log.log("getAllEmployee SUCCESS");
                var employees = [];
                angular.forEach(res.employes, function(employe) {
                    var e = {
                        id: employe.id,
                        nom: addSingleQuotes(employe.nom),
                        prenom: addSingleQuotes(employe.prenom),
                        email: employe.email,
                        adresse: addSingleQuotes(employe.adresse),
                        fonction_id: employe.fonction_id,
                        departement_id: employe.departement_id
                    };
                    employees.push(e);
                }), deferred.resolve(employees);
            }).error(function(err) {
                $log.log("getAllEmployee ERROR"), deferred.reject(new Error(err));
            }), deferred.promise;
        };
        return {
            getAllEmployee: getAllEmployee,
            getEmployees: getEmployees,
            getDepartements: getDepartements,
            getFonctions: getFonctions
        };
    });
}();
//# sourceMappingURL=./bundle-map.js