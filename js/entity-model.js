'use strict';

var services = angular.module('App.EntityModel', []);

services.factory('EntityModel', function ($http, $log, $rootScope) {

    // alias
    var DT = breeze.DataType;
    var Validator = breeze.Validator;



    function initialize(metadataStore) {

        metadataStore.addEntityType({
            shortName: "Employee",
            namespace: "Context",
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
                    validators:[
                        Validator.required(),
                        Validator.maxLength({maxLength: 20})
                    ]
                },
                email:          {
                    dataType: DT.String,
                    validators:[
                        Validator.required(),
                        Validator.emailAddress(),
                        Validator.maxLength({maxLength: 20})
                    ]
                },
                adresse:        {
                    dataType: DT.String,
                    validators:[
                        Validator.required(),
                        Validator.maxLength({maxLength: 20})
                    ]
                },
                departement_id: { dataType: DT.Int64 },
                fonction_id:    { dataType: DT.Int64 }
            },
            navigationProperties: {
                departement: {
                    entityTypeName:  "Departement:#Context", isScalar: true,
                    associationName: "Employee_Departement", foreignKeyNames: ["departement_id"]
                },
                fonction: {
                    entityTypeName:  "Fonction:#Context", isScalar: true,
                    associationName: "Employee_Fonction", foreignKeyNames: ["fonction_id"]
                }
            }
        });

        metadataStore.addEntityType({
            shortName: "Departement",
            namespace: "Context",
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
            }
        });

        metadataStore.addEntityType({
            shortName: "Fonction",
            namespace: "Context",
            dataProperties: {
                id:             { dataType: DT.Int64, isPartOfKey: true },
                nom:            {
                    dataType: "String",
                    validators:[
                        Validator.required(),
                        Validator.maxLength({maxLength: 20})
                    ]
                }
            }
        });

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


