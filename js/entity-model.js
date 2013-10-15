'use strict';

var services = angular.module('App.EntityModel', []);

services.factory('EntityModel', function ($http, $log, $rootScope) {

    var DT = breeze.DataType; // alias
    return {
        initialize: initialize
    }

    function initialize(metadataStore) {

        metadataStore.addEntityType({
            shortName: "Employee",
            namespace: "Context",
            dataProperties: {
                id:             { dataType: DT.Int64, isPartOfKey: true },
                nom:            { dataType: DT.String },
                prenom:         { dataType: DT.String },
                email:          { dataType: DT.String },
                adresse:        { dataType: DT.String },
                departement_id: { dataType: "Int64" },
                fonction_id:    { dataType: "Int64" }
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
                id:             { dataType: "String", isPartOfKey: true },
                nom:            { dataType: "String" }
            }
        });

        metadataStore.addEntityType({
            shortName: "Fonction",
            namespace: "Context",
            dataProperties: {
                id:             { dataType: "String", isPartOfKey: true },
                nom:            { dataType: "String" }
            }
        });
    }

});


