var app = angular.module('validator.controller', ['ngResource', 'ui.codemirror', 'validator.service', 'validator.persistence', 'validator.autocomplete']);

app.controller('EditorCtrl', ['$scope', '$timeout', 'MealResource', 'WidgetManager', function($scope, $timeout, MealResource, WidgetManager) {
    var editor = this;
    editor.meal = $scope.meal;
    editor.parentMarkClosed = $scope.markClosed;
    editor.parentValidate = $scope.validate;
    editor.loading = false;
    var widgetManager;

    // ugly hack all the way - a codemirror instance inside a ng-show|ng-hide is buggy as hell
    $scope.$watch('validator.openedMeal[meal.getId()]', function(newValue) {
        if(newValue) {
            if(editor._cm) {
                $timeout(function() {
                    editor._cm.refresh();
                });
            }
        }
    });

    /**
     * When the textarea's content are changed, update the application state
     *
     * @param _cm CodeMirror the CodeMirror instance
     */
    function contentChanged(_cm) {
        widgetManager.updateWidgets(_cm, editor.cmModel);
    }

    /**
     * Whenever the user is adding text, show autocompletion dialog
     *
     * @param _cm CodeMirror the CodeMirror instance
     * @param changes Object the changes the user has made
     */
    function inputRead(_cm, changes) {
        if(changes.origin == '+input' && changes.text.length) {
            showHint(_cm);
        }
    }

    /**
     * Configure the autocompletion dialog before showing it
     *
     * @param _cm CodeMirror the CodeMirror instance
     */
    function showHint(_cm) {
        CodeMirror.showHint(_cm, CodeMirror.hint.miamu, {
            async:          true,
            completeSingle: false,
            onCompletion:   function(line, course) {
                widgetManager.getWidgetAtLine(line).setCourse(course);
            }
        });
    }

    /**
     * Set restaurant as closed for this meal
     *
     * @param pos int the meal position amongst the other meals
     * @param mealId int
     */
    editor.markClosed = function(pos, mealId) {
        editor.loading = true;
        editor.meal.setClosed(true);
        editor.meal.$save(function() {
            editor.parentMarkClosed(pos, mealId);
        });
    };

    /**
     * Validate the meal
     *
     * @param pos int the meal position amongst the other meals
     * @param mealId int
     */
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

app.controller('MealValidationCtrl', ['$scope', 'MealResource', 'Hinter', function($scope, MealResource, Hinter) {
    var validator = this;
    validator.loading = true;
    validator.meals = MealResource.query(function() {
        validator.loading = false;
        if(validator.meals.length) {
            validator.toggleMealOpen(validator.meals[0].getId());
        }
    });
    validator.openedMeal = {};

    /**
     * Makes sure that a meal panel is opened
     *
     * @param pos int the position of the panel to check
     */
    function ensureMealOpen(pos) {
        if(pos + 1 <= validator.meals.length) {
            validator.openedMeal[validator.meals[pos].getId()] = true;
        }
    }

    /**
     * Removes a meal panel
     *
     * @param mealId int id of the meal to remove
     */
    function removeMeal(mealId) {
        $('#panel-meal-' + mealId).remove();
    }

    /**
     * Toggle meal's panel opening
     *
     * @param mealId int
     */
    validator.toggleMealOpen = function(mealId) {
        if(!validator.openedMeal.hasOwnProperty(mealId)) {
            validator.openedMeal[mealId] = false;
        }
        validator.openedMeal[mealId] = !validator.openedMeal[mealId];
    };

    $scope.markClosed = function(pos, mealId) {
        ensureMealOpen(pos + 1);
        removeMeal(mealId);
    };

    $scope.validate = function(pos, mealId) {
        ensureMealOpen(pos + 1);
        removeMeal(mealId);
    };

    // let's init the Hinter
    Hinter();
}]);