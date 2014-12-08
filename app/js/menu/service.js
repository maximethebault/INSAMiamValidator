var app = angular.module('validator.service', ['ngResource', 'ui.codemirror', 'validator.model']);

app.factory('MealService', ['$resource', 'Menus', 'Menu', 'Meal', 'MealEntry', 'Course', function($resource, Menus, Menu, Meal, MealEntry, Course) {
    return $resource('/insamiam/api/meal', {}, {
        query: {
            method:            'GET',
            responseType:      'json',
            headers:           {
                "Accept":         "application/json; charset=utf-8",
                "Accept-Charset": "charset=utf-8"
            },
            params:            {validated: 0},
            transformResponse: function(menusData) {
                var menus = new Menus();
                menusData.forEach(function(menuData) {
                    var menu = new Menu();
                    menu.setId(menuData.id);
                    menu.setDate(menuData.date);
                    menu.setType(menuData.type);
                    menu.setClosed(menuData.closed);
                    var meal = new Meal();
                    menuData.textlines.forEach(function(mealData) {
                        var mealEntry = new MealEntry();
                        mealEntry.setContent(mealData.content);
                        mealEntry.setCourse(Course.filterCourse(mealData));
                        meal.addMealEntry(mealEntry);
                    });
                    menu.setMeal(meal);
                    menus.addMenu(menu);
                });
                return menus;
            }
        },
        save:  {
            method:           'POST',
            responseType:     'json',
            headers:          {
                "Accept":         "application/json; charset=utf-8",
                "Accept-Charset": "charset=utf-8"
            },
            transformRequest: function(menu) {
                return JSON.stringify(menu.toJSON());
            }
        }
    });
}]);

app.factory('CourseService', ['$resource', 'Course', function($resource, Course) {
    return $resource(
        '/insamiam/api/:courseType',
        {
            courseType: '@courseType',
            similar:    '@similar'
        },
        {
            query: {
                method:            'GET',
                responseType:      'json',
                headers:           {
                    "Accept":         "application/json; charset=utf-8",
                    "Accept-Charset": "charset=utf-8"
                },
                isArray:           true,
                transformResponse: function(coursesData) {
                    var courses = [];
                    coursesData.forEach(function(courseData) {
                        var course = new Course();
                        course.setId(courseData.id);
                        course.setName(courseData.name);
                        courses.push(course);
                    });
                    return courses;
                }
            }
        });
}]);

app.factory('WidgetManager', ['$timeout', 'Menu', 'Course', 'Widget', function($timeout, Menu, Course, Widget) {
    function WidgetManager(_cm, editor, cb) {
        var _widgets = [];
        var meal;

        function init() {
            // set the editor's content
            var content = [];
            editor.menu.getMeal().getMealEntries().forEach(function(mealEntry) {
                content.push(mealEntry.getContent());
            });
            editor.cmModel = content.join('\n');

            // set the widgets
            $timeout(function() {
                _cm.operation(function() {
                    meal = editor.menu.getMeal();
                    editor.menu.getMeal().getMealEntries().forEach(function(mealEntry, index) {
                        if(mealEntry.getContent()) {
                            if(!mealEntry.getCourse()) {
                                var course = new Course();
                                course.setName(mealEntry.getContent());
                                course.setType(getCourseTypeAt(_cm, {
                                    line: index,
                                    ch:   0
                                }));
                                mealEntry.setCourse(course);
                            }
                            //console.log(mealEntry.getCourse().toJSON());
                            addWidget(_cm, index, mealEntry.getCourse());
                        }
                    });
                });
                $timeout(function() {
                    cb();
                });
            });
        }

        function addWidget(_cm, line, course) {
            var widget = new Widget(course);
            widget.setCmWidget(_cm.addLineWidget(line, widget.getHtml()));
            _widgets.push(widget);
        }

        function getWidgetAtLine(line) {
            var widgetFound = null;
            // we use Array.some as a breakable forEach
            _widgets.some(function(widget) {
                if(widget.getLine() == line) {
                    widgetFound = widget;
                    // break
                    return true;
                }
            });
            return widgetFound;
        }

        function getCourseTypeAt(_cm, cursor) {
            var token = _cm.getTokenAt(cursor);
            var inner = CodeMirror.innerMode(_cm.getMode(), token.state);
            if(inner.state.starter) {
                return 'starter';
            }
            else if(inner.state.main) {
                return 'main';
            }
            else if(inner.state.dessert) {
                return 'dessert';
            }
        }

        function updateWidgets(_cm, editorContent) {
            var orphelinWidgets = [];
            // we copy the _widgets array into a new one
            angular.extend(orphelinWidgets, _widgets);
            var lines = editorContent.split('\n');
            lines.forEach(function(lineContent, lineIndex) {
                var widget = getWidgetAtLine(lineIndex);
                if(lineContent.length && !widget) {
                    var course = new Course();
                    course.setName(lineContent);
                    course.setType(getCourseTypeAt(_cm, _cm.getCursor()));
                    meal.addMealEntry(course);
                    addWidget(_cm, lineIndex, course);
                }
                else if(widget) {
                    widget.updateText(lineContent);
                    delete orphelinWidgets[orphelinWidgets.indexOf(widget)];
                }
            });
            orphelinWidgets.forEach(function(widget) {
                delete _widgets[orphelinWidgets.indexOf(widget)];
                meal.removeMealEntry(widget.getCourse());
            });
        }

        // expose the WidgetManager's API
        this.getWidgetAtLine = getWidgetAtLine;
        this.updateWidgets = updateWidgets;

        init();
    }

    return WidgetManager;
}]);