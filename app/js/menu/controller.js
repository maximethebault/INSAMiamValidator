var app = angular.module('validator.controller', ['ngResource', 'ui.codemirror', 'validator.service', 'validator.autocomplete']);

app.controller('EditorCtrl', ['$scope', 'MealService', 'WidgetManager', function($scope, MealService, WidgetManager) {
    var editor = this;
    editor.menu = $scope.menu;
    editor.parentMarkClosed = $scope.markClosed;
    editor.parentValidate = $scope.validate;
    editor.loading = false;
    var widgetManager;

    // ugly hack all the way - a codemirror instance inside a ng-show|ng-hide is buggy as hell
    $scope.$watch('validator.menuSelection[menu.getId()]', function() {
        if($scope.validator.menuSelection[$scope.menu.getId()]) {
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

    editor.markClosed = function(pos, menuId) {
        editor.loading = true;
        editor.menu.setClosed(true);
        MealService.save(editor.menu, function() {
            editor.parentMarkClosed(pos, menuId);
        });
    };

    editor.validate = function(pos, menuId) {
        editor.loading = true;
        editor.menu.setClosed(false);
        MealService.save(editor.menu, function() {
            editor.parentValidate(pos, menuId);
        });
    };

    // The ui-codemirror option
    editor.cmOption = {
        lineNumbers:    true,
        lineWrapping:   true,
        indentWithTabs: true,
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

app.controller('MenuValidationCtrl', ['$scope', 'MealService', 'Hinter', function($scope, MealService, Hinter) {
    var validator = this;
    validator.loading = true;
    validator.menus = MealService.query(function() {
        validator.loading = false;
        if(validator.menus && validator.menus.getMenus().length) {
            validator.toggleMenuSelect(validator.menus.getMenus()[0].getId());
        }
    });
    validator.menuSelection = {};

    function ensureOpen(pos) {
        if(pos + 1 <= validator.menus.getMenus().length) {
            validator.menuSelection[validator.menus.getMenus()[pos].getId()] = true;
        }
    }

    function removePanel(menuId) {
        $('#panel-menu-' + menuId).remove();
    }

    validator.toggleMenuSelect = function(menuId) {
        if(!validator.menuSelection.hasOwnProperty(menuId)) {
            validator.menuSelection[menuId] = false;
        }
        validator.menuSelection[menuId] = !validator.menuSelection[menuId];
        return validator.menuSelection[menuId];
    };

    $scope.markClosed = function(pos, menuId) {
        ensureOpen(pos + 1);
        removePanel(menuId);
    };

    $scope.validate = function(pos, menuId) {
        ensureOpen(pos + 1);
        removePanel(menuId);
    };

    // let's init the Hinter
    Hinter();
}]);