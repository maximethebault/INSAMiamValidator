var app = angular.module('validator.controller', ['ngResource', 'ui.codemirror', 'validator.service', 'validator.autocomplete']);

app.controller('EditorCtrl', ['$scope', 'MealService', 'WidgetManager', function($scope, MealService, WidgetManager) {
    var editor = this;
    editor.meal = $scope.meal;
    editor.parentMarkClosed = $scope.markClosed;
    editor.parentValidate = $scope.validate;
    editor.loading = false;
    var widgetManager;

    // ugly hack all the way - a codemirror instance inside a ng-show|ng-hide is buggy as hell
    $scope.$watch('validator.mealSelection[meal.getId()]', function(newValue) {
        if(newValue) {
            if(editor._cm) {
                setTimeout(function() {
                    editor._cm.refresh();
                }, 0);
            }
        }
    });

    function contentChanged(_cm) {
        widgetManager.updateWidgets(_cm, editor.cmModel);
    }

    function inputRead(_cm, changes) {
        if(changes.origin == '+input' && changes.text.length) {
            showHint(_cm);
        }
    }

    function showHint(_cm) {
        CodeMirror.showHint(_cm, CodeMirror.hint.miamu, {
            async:          true,
            completeSingle: false,
            onCompletion:   function(line, course) {
                widgetManager.getWidgetAtLine(line).setCourse(course);
            }
        });
    }

    editor.markClosed = function(pos, mealId) {
        editor.loading = true;
        editor.meal.setClosed(true);
        editor.meal.$save(function() {
            editor.parentMarkClosed(pos, mealId);
        });
    };

    editor.validate = function(pos, mealId) {
        editor.loading = true;
        editor.meal.setClosed(false);
        editor.meal.$save(function() {
            editor.parentValidate(pos, mealId);
        });
    };

    // The ui-codemirror option
    editor.cmOption = {
        lineNumbers:    true,
        lineWrapping:   true,
        indentWithTabs: true,
        viewportMargin: Infinity,
        mode:           "miamu",
        onLoad:         function(_cm) {
            editor._cm = _cm;
            widgetManager = new WidgetManager(_cm, editor, function() {
                _cm.on('changes', contentChanged);
                _cm.on('inputRead', inputRead);
            });
        },
        extraKeys:      {
            "Ctrl-Space": function(_cm) {
                showHint(_cm);
            }
        }
    };

    // editor init
    editor.cmModel = 'Loading...';
}]);

app.controller('MealValidationCtrl', ['$scope', 'MealService', 'Hinter', function($scope, MealService, Hinter) {
    var validator = this;
    validator.loading = true;
    validator.meals = MealService.query(function() {
        validator.loading = false;
        if(validator.meals.length) {
            validator.toggleMealSelect(validator.meals[0].getId());
        }
    });
    validator.mealSelection = {};

    function ensureOpen(pos) {
        if(pos + 1 <= validator.meals.length) {
            validator.mealSelection[validator.meals[pos].getId()] = true;
        }
    }

    function removePanel(mealId) {
        $('#panel-meal-' + mealId).remove();
    }

    validator.toggleMealSelect = function(mealId) {
        if(!validator.mealSelection.hasOwnProperty(mealId)) {
            validator.mealSelection[mealId] = false;
        }
        validator.mealSelection[mealId] = !validator.mealSelection[mealId];
        return validator.mealSelection[mealId];
    };

    $scope.markClosed = function(pos, mealId) {
        ensureOpen(pos + 1);
        removePanel(mealId);
    };

    $scope.validate = function(pos, mealId) {
        ensureOpen(pos + 1);
        removePanel(mealId);
    };

    // let's init the Hinter
    Hinter();
}]);