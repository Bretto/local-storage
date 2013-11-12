"use strict";

!function() {
    module = angular.module("App.AppCtrl", []), module.controller("AppCtrl", function($scope, $log, $timeout) {
        $log.info("AppCtrl"), $scope.onSaveEntityGraph = function() {
            var deferred = Q.defer();
            return $timeout(function() {
                deferred.resolve();
            }, 5e3), deferred.promise;
        };
    });
}(), function() {
    module = angular.module("App.AppCtrl", []), module.controller("AppCtrl", function($scope, $log, $timeout) {
        $log.info("AppCtrl"), $scope.onSaveEntityGraph = function() {
            var deferred = Q.defer();
            return $timeout(function() {
                deferred.resolve();
            }, 5e3), deferred.promise;
        };
    });
}(), function() {
    require("./bower_components/jquery/jquery"), require("./bower_components/angular/angular"), 
    require("Q"), require("breeze"), require("./controllers"), require("./entity-model"), 
    require("./datacontext"), require("./data-provider"), require("./utils"), require("./filters"), 
    require("./services"), require("./web-sql"), require("./breeze-storage"), require("./storage-provider"), 
    require("./web-service"), require("./mock-service"), require("./mock-service-breeze"), 
    require("./directives"), require("./breeze-directives.js"), require("./log-decorator"), 
    require("./ladda-button"), angular.module("App", [ "App.controllers", "App.EntityModel", "App.DataContext", "App.DataProvider", "App.Utils", "App.filters", "App.services", "App.WebSql", "App.BreezeStorage", "App.StorageProvider", "App.WebService", "App.MockService", "App.MockServiceBreeze", "App.directives", "breeze.directives", "App.LogDecorator", "App.LaddaButton" ]).config(function(zDirectivesConfigProvider) {
        zDirectivesConfigProvider.zValidateTemplate = '<span class="invalid error-msg"><i class="glyphicon glyphicon-warning-sign"></i>%error%</span>';
    });
}(), function() {
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
}();

var services = angular.module("App.BreezeStorage", []);

services.factory("BreezeStorage", function() {
    var stashName = "entityGraph", getEntityGraph = function() {
        return window.localStorage.getItem(stashName);
    }, setEntityGraph = function(exportData) {
        return window.localStorage.setItem(stashName, exportData);
    };
    return {
        setEntityGraph: setEntityGraph,
        getEntityGraph: getEntityGraph
    };
}), function() {
    var module = angular.module("App.controllers", []);
    module.controller("AppCtrl", function($scope, $rootScope, $timeout, $log, $http, DataModel, BreezeStorage, StorageProvider, DataProvider, DataContext) {
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
            var query = new breeze.EntityQuery("Employee");
            $scope.employees = DataContext.manager.executeQueryLocally(query);
            var query = new breeze.EntityQuery("Departement");
            $scope.departements = DataContext.manager.executeQueryLocally(query);
            var query = new breeze.EntityQuery("Fonction");
            $scope.fonctions = DataContext.manager.executeQueryLocally(query);
        }
        StorageProvider.initDB(), $scope.employees = null, $scope.departements = null, $scope.fonctions = null, 
        $scope.isActive = function(item) {
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
            $scope.onSelect(newEntity), deferred.resolve();
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
                mergeStrategy: breeze.MergeStrategy.OverwriteChanges
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
}();

var services = angular.module("App.DataProvider", []);

services.factory("DataProvider", function(WebService, StorageProvider, MockService, GLOBALS, MockServiceBreeze) {
    var dataProvider = null;
    switch (GLOBALS.MODE) {
      case GLOBALS.WS:
        dataProvider = WebService;
        break;

      case GLOBALS.DB:
        dataProvider = StorageProvider;
        break;

      case GLOBALS.MOCK_BREEZE:
        dataProvider = MockServiceBreeze;
        break;

      default:
        dataProvider = MockService;
    }
    return dataProvider;
});

var services = angular.module("App.DataContext", []);

services.factory("DataContext", function(EntityModel, jsonResultsAdapter, DataProvider, StorageProvider, $log) {
    function exportEmployees(employees) {
        return manager.exportEntities(employees);
    }
    function createEntity(entityType, rows) {
        var entities = [];
        angular.forEach(rows, function(row) {
            var newEntity = manager.createEntity(entityType, row);
            newEntity.entityAspect.acceptChanges(), entities.push(newEntity);
        });
        var query = new breeze.EntityQuery(entityType).toType(entityType), results = manager.executeQueryLocally(query);
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
    breeze.config.initializeAdapterInstance("modelLibrary", "backingStore", !0);
    var serviceName = "http://localhost/~Separ8/local-storage", ds = new breeze.DataService({
        serviceName: serviceName,
        hasServerMetadata: !1,
        useJsonp: !1,
        jsonResultsAdapter: jsonResultsAdapter
    }), manager = new breeze.EntityManager({
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

var services = angular.module("App.EntityModel", []);

services.factory("EntityModel", function() {
    function initialize(metadataStore) {
        function Employee() {}
        metadataStore.addEntityType({
            shortName: "Employee",
            namespace: "Context",
            autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
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
            autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
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
            autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
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
    var DT = breeze.DataType, Validator = breeze.Validator;
    return {
        initialize: initialize
    };
});

var filters = angular.module("App.filters", []);

filters.filter("age", function() {
    return function(text) {
        var age = moment(text, "DD-MM-YYYY").fromNow();
        return age;
    };
}), function() {
    var ladda = require("./bower_components/Ladda/js/ladda"), module = angular.module("App.LaddaButton", []);
    module.directive("laddaButton", function($log, $parse) {
        function link(scope, element, attrs) {
            element.bind("click", function() {
                var btn = ladda.create(this);
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
}();

var services = angular.module("App.LocalStorage", []);

services.factory("LocalStorage", function($http, $log) {
    function populateTabe(tx, tableName, rows) {
        angular.forEach(rows, function(row) {
            var keys = Object.keys(row).toString(), values = [];
            for (var key in row) values.push(row[key]);
            values = "'" + values.join("','") + "'", tx.executeSql("INSERT INTO " + tableName + " (" + keys + ") VALUES (" + values + ")");
        });
    }
    function createT_EMPLOYEE() {
        function errorCB(err) {
            console.log("Error processing SQL: " + err.message), deferred.reject(new Error(err));
        }
        function successCB() {
            console.log("success!"), deferred.resolve();
        }
        function T_EMPLOYEE(tx) {
            tx.executeSql("DROP TABLE IF EXISTS T_EMPLOYEE"), tx.executeSql("create table T_EMPLOYEE (id                        INTEGER PRIMARY KEY AUTOINCREMENT,nom                       varchar2(50) not null,prenom                    varchar2(50) not null,email                     varchar2(150) not null,adresse                   varchar2(300),fonction_id               bigint,departement_id            bigint)");
        }
        var deferred = Q.defer();
        return db.transaction(T_EMPLOYEE, errorCB, successCB), deferred.promise;
    }
    function createT_DEPARTEMENT() {
        function errorCB(err) {
            console.log("Error processing SQL: " + err.message), deferred.reject(new Error(err));
        }
        function successCB() {
            console.log("success!"), deferred.resolve();
        }
        function T_DEPARTEMENT(tx) {
            tx.executeSql("DROP TABLE IF EXISTS T_DEPARTEMENT"), tx.executeSql("create table T_DEPARTEMENT ( id                       INTEGER PRIMARY KEY AUTOINCREMENT,nom                      varchar2(50) not null,constraint uq_T_DEPARTEMENT_nom unique (nom))");
        }
        var deferred = Q.defer();
        return db.transaction(T_DEPARTEMENT, errorCB, successCB), deferred.promise;
    }
    function createT_FONCTION() {
        function errorCB(err) {
            console.log("Error processing SQL: " + err.message), deferred.reject(new Error(err));
        }
        function successCB() {
            console.log("success!"), deferred.resolve();
        }
        function T_FONCTION(tx) {
            tx.executeSql("DROP TABLE IF EXISTS T_FONCTION"), tx.executeSql("create table T_FONCTION (id                       INTEGER PRIMARY KEY AUTOINCREMENT,nom                      varchar2(50) not null,constraint uq_T_FONCTION_nom unique (nom))");
        }
        var deferred = Q.defer();
        return db.transaction(T_FONCTION, errorCB, successCB), deferred.promise;
    }
    function getAllEmployees() {
        function errorCB(err) {
            console.log("Error processing SQL: " + err.message), deferred.reject(new Error(err));
        }
        function successCB() {
            console.log("success!"), deferred.resolve(result);
        }
        function allEmployees(tx) {
            function successCB(tx, res) {
                for (var i = 0; i < res.rows.length; i++) result.push(res.rows.item(i));
            }
            function errorCB(err) {
                console.log("Error processing SQL: " + err.message);
            }
            tx.executeSql("SELECT * FROM T_EMPLOYEE", [], successCB, errorCB);
        }
        var deferred = Q.defer(), result = [];
        return db.transaction(allEmployees, errorCB, successCB), deferred.promise;
    }
    var db = null, initDB = function() {
        $log.log("initDB");
        var deferred = Q.defer();
        return db = window.openDatabase("Database", "1.0", "Demo", 26214400), createT_EMPLOYEE().then(function() {
            return createT_DEPARTEMENT();
        }).then(function() {
            return createT_FONCTION();
        }).catch(function(err) {
            $log.error("Error initDB", err), deferred.reject(new Error(err));
        }).done(function(data) {
            $log.log("initDB SUCCESS"), deferred.resolve(data);
        }), deferred.promise;
    }, setT_EMPLOYEE = function(rows) {
        function errorCB(err) {
            console.log("Error processing SQL: " + err.message), deferred.reject(new Error(err));
        }
        function successCB() {
            console.log("success!"), deferred.resolve();
        }
        var deferred = Q.defer(), tableName = "T_EMPLOYEE";
        return db.transaction(function(tx) {
            populateTabe(tx, tableName, rows);
        }, errorCB, successCB), deferred.promise;
    }, setT_DEPARTEMENT = function(rows) {
        function errorCB(err) {
            console.log("Error processing SQL: " + err.message), deferred.reject(new Error(err));
        }
        function successCB() {
            console.log("success!"), deferred.resolve();
        }
        var deferred = Q.defer(), tableName = "T_DEPARTEMENT";
        return db.transaction(function(tx) {
            populateTabe(tx, tableName, rows);
        }, errorCB, successCB), deferred.promise;
    }, setT_FONCTION = function(rows) {
        function errorCB(err) {
            console.log("Error processing SQL: " + err.message), deferred.reject(new Error(err));
        }
        function successCB() {
            console.log("success!"), deferred.resolve();
        }
        var deferred = Q.defer(), tableName = "T_FONCTION";
        return db.transaction(function(tx) {
            populateTabe(tx, tableName, rows);
        }, errorCB, successCB), deferred.promise;
    }, saveEntity = function(entity, rows) {
        function errorCB(err) {
            console.log("Error processing SQL: " + err.message), deferred.reject(new Error(err));
        }
        function successCB() {
            console.log("success!"), deferred.resolve();
        }
        var deferred = Q.defer(), tableName = "T_" + entity.toUpperCase();
        return db.transaction(function(tx) {
            populateTabe(tx, tableName, rows);
        }, errorCB, successCB), deferred.promise;
    };
    return {
        initDB: initDB,
        setT_EMPLOYEE: setT_EMPLOYEE,
        setT_DEPARTEMENT: setT_DEPARTEMENT,
        setT_FONCTION: setT_FONCTION,
        getAllEmployees: getAllEmployees,
        saveEntity: saveEntity
    };
}), function(navigator) {
    var module = angular.module("App.LogDecorator", []);
    module.constant("LogDecorator", function(logDelegate) {
        var enchanceLogger = function($log) {
            var separator = "::", _$log = function($log) {
                return {
                    log: $log.log,
                    info: $log.info,
                    warn: $log.warn,
                    debug: $log.debug,
                    error: $log.error
                };
            }($log), colorify = function(message, colorCSS) {
                var isChrome = navigator.userAgent.indexOf("Chrome"), canColorize = isChrome && void 0 !== colorCSS;
                return canColorize ? [ "%c" + message, colorCSS ] : [ message ];
            }, prepareLogFn = function(logFn, className, colorCSS) {
                var enhancedLogFn = function() {
                    var args = Array.prototype.slice.call(arguments), now = buildTimeString(new Date());
                    args[0] = supplant("{0} - {1}{2}", [ now, className, args[0] ]), args = colorify(supplant.apply(null, args), colorCSS), 
                    logFn.apply(null, args);
                };
                return enhancedLogFn.logs = [], enhancedLogFn;
            }, getInstance = function(className, colorCSS, customSeparator) {
                return className = void 0 !== className ? className + (customSeparator || separator) : "", 
                {
                    log: prepareLogFn(_$log.log, className, colorCSS),
                    info: prepareLogFn(_$log.info, className, colorCSS),
                    warn: prepareLogFn(_$log.warn, className, colorCSS),
                    debug: prepareLogFn(_$log.debug, className, colorCSS),
                    error: prepareLogFn(_$log.error, className)
                };
            };
            return $log.log = prepareLogFn($log.log), $log.info = prepareLogFn($log.info), $log.warn = prepareLogFn($log.warn), 
            $log.debug = prepareLogFn($log.debug), $log.error = prepareLogFn($log.error), $log.getInstance = getInstance, 
            $log;
        };
        return enchanceLogger(logDelegate);
    });
    var buildTimeString = function(date, format) {
        function pad(value) {
            return value.toString().length < 2 ? "0" + value : value;
        }
        return format = format || "%h:%m:%s:%z", format.replace(/%([a-zA-Z])/g, function(_, fmtCode) {
            switch (fmtCode) {
              case "Y":
                return date.getFullYear();

              case "M":
                return pad(date.getMonth() + 1);

              case "d":
                return pad(date.getDate());

              case "h":
                return pad(date.getHours());

              case "m":
                return pad(date.getMinutes());

              case "s":
                return pad(date.getSeconds());

              case "z":
                return pad(date.getMilliseconds());

              default:
                throw new Error("Unsupported format code: " + fmtCode);
            }
        });
    }, supplant = function(template, values, pattern) {
        return pattern = pattern || /\{([^\{\}]*)\}/g, template.replace(pattern, function(a, b) {
            var p = b.split("."), r = values;
            try {
                for (var s in p) r = r[p[s]];
            } catch (e) {
                r = a;
            }
            return "string" == typeof r || "number" == typeof r ? r : a;
        });
    };
}(window.navigator);

var services = angular.module("App.MockServiceBreeze", []);

services.value("jsonResultsAdapter", new breeze.JsonResultsAdapter({
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
})), services.factory("MockServiceBreeze", function() {
    function getAllEmployee() {
        var query = breeze.EntityQuery.from("assets/employes.json");
        return manager.executeQuery(query).then(returnResults);
    }
    function getAllDepartement() {
        var query = breeze.EntityQuery.from("assets/departements.json");
        return manager.executeQuery(query).then(returnResults);
    }
    function getAllFonction() {
        var query = breeze.EntityQuery.from("/assets/fonctions.json");
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

var services = angular.module("App.MockService", []);

services.factory("MockService", function(Utils, $log, StorageProvider) {
    var getAllEmployee = function() {
        $log.log("getAllEmployee");
        var deferred = Q.defer();
        return $.getJSON("assets/employes.json").success(function(res) {
            $log.log("getAllEmployee SUCCESS"), StorageProvider.saveEntityBatch("Employee", res.employes).then(function(entities) {
                deferred.resolve(entities);
            });
        }).error(function(err) {
            $log.log("getAllEmployee ERROR"), deferred.reject(new Error(err));
        }), deferred.promise;
    }, getAllDepartement = function() {
        $log.log("getAllDepartement");
        var deferred = Q.defer();
        return $.getJSON("assets/departements.json").success(function(res) {
            $log.log("getDepartements SUCCESS"), StorageProvider.saveEntityBatch("Departement", res.departements).then(function(entities) {
                deferred.resolve(entities);
            });
        }).error(function(err) {
            $log.log("getAllDepartement ERROR"), deferred.reject(new Error(err));
        }), deferred.promise;
    }, getAllFonction = function() {
        $log.log("getAllFonction");
        var deferred = Q.defer();
        return $.getJSON("assets/fonctions.json").success(function(res) {
            $log.log("getAllFonction SUCCESS"), StorageProvider.saveEntityBatch("Fonction", res.fonctions).then(function(entities) {
                deferred.resolve(entities);
            });
        }).error(function(err) {
            $log.log("getAllFonction ERROR"), deferred.reject(new Error(err));
        }), deferred.promise;
    }, getAllEntity = function(entityType) {
        var fn = null;
        switch (entityType) {
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

var services = angular.module("App.services", []);

services.value("GLOBALS", {
    MODE: "MOCK_BREEZE",
    DB: "DB",
    WS: "WS",
    MOCK_BREEZE: "MOCK_BREEZE",
    MOCK: "MOCK"
}), services.value("jsonResultsAdapter", new breeze.JsonResultsAdapter({
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
})), services.factory("DataModel", function() {
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

var services = angular.module("App.StorageProvider", []);

services.factory("StorageProvider", function(WebSql, GLOBALS) {
    var storageProvider = null;
    switch (GLOBALS.STORAGE) {
      default:
        storageProvider = WebSql;
    }
    return storageProvider;
}), function() {
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
}();

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

var services = angular.module("App.WebSql", []);

services.factory("WebSql", function($log, Utils) {
    function populateTabe(tx, tableName, rows) {
        angular.forEach(rows, function(row) {
            var keys = Object.keys(row).toString(), values = [];
            for (var key in row) values.push(row[key]);
            values = "'" + values.join("','") + "'", tx.executeSql("REPLACE INTO " + tableName + " (" + keys + ") VALUES (" + values + ")");
        });
    }
    function createT_EMPLOYEE() {
        function errorCB(err) {
            console.log("Error processing SQL: " + err.message), deferred.reject(new Error(err));
        }
        function successCB() {
            console.log("success!"), deferred.resolve();
        }
        function T_EMPLOYEE(tx) {
            tx.executeSql("CREATE TABLE IF NOT EXISTS T_EMPLOYEE (id                        INTEGER PRIMARY KEY AUTOINCREMENT,nom                       varchar2(50) not null,prenom                    varchar2(50) not null,email                     varchar2(150) not null,adresse                   varchar2(300),fonction_id               bigint,departement_id            bigint)");
        }
        var deferred = Q.defer();
        return db.transaction(T_EMPLOYEE, errorCB, successCB), deferred.promise;
    }
    function createT_DEPARTEMENT() {
        function errorCB(err) {
            console.log("Error processing SQL: " + err.message), deferred.reject(new Error(err));
        }
        function successCB() {
            console.log("success!"), deferred.resolve();
        }
        function T_DEPARTEMENT(tx) {
            tx.executeSql("CREATE TABLE IF NOT EXISTS T_DEPARTEMENT ( id                       INTEGER PRIMARY KEY AUTOINCREMENT,nom                      varchar2(50) not null,constraint uq_T_DEPARTEMENT_nom unique (nom))");
        }
        var deferred = Q.defer();
        return db.transaction(T_DEPARTEMENT, errorCB, successCB), deferred.promise;
    }
    function createT_FONCTION() {
        function errorCB(err) {
            console.log("Error processing SQL: " + err.message), deferred.reject(new Error(err));
        }
        function successCB() {
            console.log("success!"), deferred.resolve();
        }
        function T_FONCTION(tx) {
            tx.executeSql("CREATE TABLE IF NOT EXISTS T_FONCTION (id                       INTEGER PRIMARY KEY AUTOINCREMENT,nom                      varchar2(50) not null,constraint uq_T_FONCTION_nom unique (nom))");
        }
        var deferred = Q.defer();
        return db.transaction(T_FONCTION, errorCB, successCB), deferred.promise;
    }
    function getAllEntity(entityType) {
        function errorCB(err) {
            console.log("Error processing SQL: " + err.message), deferred.reject(new Error(err));
        }
        function successCB() {
            console.log("success!"), deferred.resolve(result);
        }
        function selectAllFromTable(tx) {
            function successCB(tx, res) {
                for (var i = 0; i < res.rows.length; i++) result.push(res.rows.item(i));
            }
            function errorCB(err) {
                console.log("Error processing SQL: " + err.message);
            }
            tx.executeSql("SELECT * FROM " + tableName, [], successCB, errorCB);
        }
        var deferred = Q.defer(), result = [], tableName = "T_" + entityType.toUpperCase();
        return db.transaction(selectAllFromTable, errorCB, successCB), deferred.promise;
    }
    var db = null, initDB = function() {
        $log.log("initDB");
        var deferred = Q.defer();
        return db = window.openDatabase("Database", "1.0", "Demo", 26214400), createT_EMPLOYEE().then(function() {
            return createT_DEPARTEMENT();
        }).then(function() {
            return createT_FONCTION();
        }).catch(function(err) {
            $log.error("Error initDB", err), deferred.reject(new Error(err));
        }).done(function(data) {
            $log.log("initDB SUCCESS"), deferred.resolve(data);
        }), deferred.promise;
    }, saveEntityBatch = function(entity, rows) {
        function errorCB(err) {
            console.log("Error processing SQL: " + err.message), deferred.reject(new Error(err));
        }
        function successCB() {
            console.log("success!"), getAllEntity(entity).then(function(entities) {
                deferred.resolve(entities);
            });
        }
        var deferred = Q.defer(), tableName = "T_" + entity.toUpperCase();
        return angular.forEach(rows, function(obj) {
            for (var key in obj) {
                var value = obj[key];
                obj[key] = Utils.closeSingleQuotes(value);
            }
        }), db.transaction(function(tx) {
            populateTabe(tx, tableName, rows);
        }, errorCB, successCB), deferred.promise;
    }, saveEntity = function(entity) {
        function errorCB(err) {
            console.log("Error processing SQL: " + err.message), deferred.reject(new Error(err));
        }
        function successCB() {
            console.log("success!"), deferred.resolve(result);
        }
        function replaceIntoTable(tx) {
            function successCB(tx, res) {
                for (var i = 0; i < res.rows.length; i++) result.push(res.rows.item(i));
            }
            function errorCB(err) {
                console.log("Error processing SQL: " + err.message);
            }
            var keys = Object.keys(data).toString(), values = [];
            for (var key in data) values.push(data[key]);
            values = "'" + values.join("','") + "'", tx.executeSql("REPLACE INTO " + tableName + " (" + keys + ") VALUES (" + values + ")", [], successCB, errorCB);
        }
        var entityType = entity.entityType.shortName, data = Utils.entityToJson(entity), deferred = Q.defer(), result = [], tableName = "T_" + entityType.toUpperCase();
        for (var key in data) {
            var value = data[key];
            data[key] = Utils.closeSingleQuotes(value);
        }
        return db.transaction(replaceIntoTable, errorCB, successCB), deferred.promise;
    }, deleteEntity = function(entity) {
        function errorCB(err) {
            console.log("Error processing SQL: " + err.message), deferred.reject(new Error(err));
        }
        function successCB() {
            console.log("success!"), deferred.resolve(result);
        }
        function deleteFromTable(tx) {
            function successCB() {
                console.log("success!");
            }
            function errorCB(err) {
                console.log("Error processing SQL: " + err.message);
            }
            tx.executeSql("DELETE FROM " + tableName + " WHERE id = ?", [ entityId ], successCB, errorCB);
        }
        var entityType = entity.entityType.shortName, tableName = "T_" + entityType.toUpperCase(), entityId = entity.id, deferred = Q.defer();
        return db.transaction(deleteFromTable, errorCB, successCB), deferred.promise;
    };
    return {
        initDB: initDB,
        saveEntity: saveEntity,
        deleteEntity: deleteEntity,
        saveEntityBatch: saveEntityBatch,
        getAllEntity: getAllEntity
    };
});