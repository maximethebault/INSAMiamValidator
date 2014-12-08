var app = angular.module('validator', ['ngResource', 'ui.codemirror', 'validator.controller', 'angularSpinner']);

app.filter('mealType', function() {
    return function(input) {
        return input == 'L' ? 'Déjeuner' : 'Dîner';
    };
});