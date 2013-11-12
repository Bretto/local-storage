(function () {
    "use strict";

var services = angular.module('App.EntityModel', []);

services.factory('EntityModel', function ($http, $log, $rootScope) {

    // alias
    var DT = breeze.DataType;
    var Validator = breeze.Validator;



    function initialize(metadataStore) {


        metadataStore.addEntityType({
            shortName: "Employee",
            namespace: "Context",
            autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
            dataProperties: {
                id:             { dataType: DT.Int64, isPartOfKey: true },
                nom:            {
                    dataType: DT.String,
                    validators:[
                        Validator.required(),
                        Validator.maxLength({maxLength: 20})
                    ]
                },
                prenom:         {
                    dataType: DT.String,
//                    validators:[
//                        Validator.required(),
//                        Validator.maxLength({maxLength: 20})
//                    ]
                },
                email:          {
                    dataType: DT.String,
//                    validators:[
//                        Validator.required()
//                        Validator.emailAddress()
//                    ]
                },
                adresse:        {
                    dataType: DT.String,
//                    validators:[
//                        Validator.required(),
//                        Validator.maxLength({maxLength: 50})
//                    ]
                },
                departement_id: { dataType: DT.Int64 },
                fonction_id:    { dataType: DT.Int64 }
            },
            navigationProperties: {
                departement: {
                    isScalar: true,
                    entityTypeName:  "Departement:#Context",
                    associationName: "Employee_Departement",
                    foreignKeyNames: ["departement_id"]
                },
                fonction: {
                    isScalar: true,
                    entityTypeName:  "Fonction:#Context",
                    associationName: "Employee_Fonction",
                    foreignKeyNames: ["fonction_id"]
                }
            }
        });

        metadataStore.setEntityTypeForResourceName('Employee', 'Employee');

        function Employee() {


        }

//        Employee.entityAspect.prototype.hasTempKey = function() {
//            return (this.id < 0)? true:false;
//        };

        var employeeInitializer = function(employee){

//            employee.entityAspect.hasTempKey = function(){
//                return (employee.id < 0)? true:false;
//            }

//            Object.defineProperty(employee.entityAspect, "hasTempKey", {get : function(){ (employee.id < 0)? true:false; }});


//            employee.entityAspect.hasTempKey = function() {
//                return (this.id < 0)? true:false;
//            };


//            $rootScope.$watch(function(){return employee.entityAspect.entityState.name}, function(value){
//                if(employee.id < 0){
//                    employee.entityAspect.hasTempKey = true;
//                }
//            })
        }

        metadataStore.registerEntityTypeCtor("Employee", Employee, employeeInitializer);

        metadataStore.addEntityType({
            shortName: "Departement",
            namespace: "Context",
            autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
            dataProperties: {
                id:             {
                    dataType: DT.Int64,
                    isPartOfKey: true,
                    validators:[
                        Validator.required(),
                        Validator.integer()
                    ]
                },
                nom:            {
                    dataType: "String",
                    validators:[
                        Validator.required(),
                        Validator.maxLength({maxLength: 20})
                    ]
                }
            },
            navigationProperties: {
                employee: {
                    isScalar: false,
                    entityTypeName:  "Employee:#Context",
                    associationName: "Employee_Departement"
                }
            }
        });

        metadataStore.setEntityTypeForResourceName('Departement', 'Departement');

        metadataStore.addEntityType({
            shortName: "Fonction",
            namespace: "Context",
            autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
            dataProperties: {
                id:             { dataType: DT.Int64, isPartOfKey: true },
                nom:            {
                    dataType: "String",
                    validators:[
                        Validator.required(),
                        Validator.maxLength({maxLength: 20})
                    ]
                }
            },
            navigationProperties: {
                employee: {
                    isScalar: false,
                    entityTypeName:  "Employee:#Context",
                    associationName: "Employee_Fonction"
                }
            }
        });

        metadataStore.setEntityTypeForResourceName('Fonction', 'Fonction');

        detectRequired(metadataStore);

    }

    // Builds the `required` hash for each type (monkey patching entityType).
    function detectRequired(metadataStore) {
        var types = metadataStore.getEntityTypes();
        types.forEach(function(type) {
            var entityRequired = {};
            type.required = entityRequired;
            var props = type.getProperties();
            props.forEach(function(prop) {
                var vals = prop.validators;
                for (var i = 0, len = vals.length; i < len; i++) {
                    if ('required' === vals[i].name) {
                        entityRequired[prop.name] = true;
                        break;
                    }
                }
            });
        });
    }

    return {
        initialize: initialize
    }

});

})();


