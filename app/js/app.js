var app = angular.module('validator', ['ngResource', 'ui.codemirror', 'validator.controller', 'angularSpinner']);

app.filter('menuType', function() {
    return function(input) {
        return input == 'L' ? 'Déjeuner' : 'Dîner';
    };
});