var app = angular.module('validator.service', ['ngResource', 'ui.codemirror', 'validator.model']);

app.factory('MealService', ['$resource', 'Meal', 'Textline', 'Course', function($resource, Meal, Textline, Course) {
    return $resource('/insamiam/api/meal', {}, {
        query: {
            method:            'GET',
            responseType:      'json',
            headers:           {
                'Accept':         'application/json; charset=utf-8',
                'Accept-Charset': 'charset=utf-8'
            },
            isArray:           true,
            params:            {validated: 0},
            transformResponse: function(mealsData) {
                var meals = [];
                mealsData.forEach(function(mealData) {
                    var meal = new Meal();
                    meal.setId(mealData.id);
                    meal.setDate(mealData.date);
                    meal.setType(mealData.type);
                    meal.setClosed(mealData.closed);
                    var textlines = meal.getTextlines();
                    mealData.textlines.forEach(function(textlineData) {
                        var textline = new Textline();
                        textline.setContent(textlineData.content);
                        textline.setCourse(Course.filterCourse(textlineData));
                        textlines.push(textline);
                    });
                    meals.push(meal);
                });
                return meals;
            }
        },
        save:  {
            method:           'POST',
            responseType:     'json',
            headers:          {
                'Accept':         'application/json; charset=utf-8',
                'Accept-Charset': 'charset=utf-8',
                'Content-Type':   'application/json; charset=utf-8'
            },
            transformRequest: function(meal) {
                return JSON.stringify(meal.toJSON());
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
                    'Accept':         'application/json; charset=utf-8',
                    'Accept-Charset': 'charset=utf-8'
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

app.factory('WidgetManager', ['$timeout', 'Meal', 'Textline', 'Course', 'Widget', function($timeout, Meal, Textline, Course, Widget) {
    function WidgetManager(_cm, editor, cb) {
        var _widgets = [];
        var textlines;

        function init() {
            // set the editor's content
            var content = [];
            editor.meal.getTextlines().forEach(function(textline) {
                content.push(textline.getContent());
            });
            editor.cmModel = content.join('\n');

            // set the widgets
            $timeout(function() {
                _cm.operation(function() {
                    textlines = editor.meal.getTextlines();
                    editor.meal.getTextlines().forEach(function(textline, index) {
                        if(textline.getContent()) {
                            if(!textline.getCourse()) {
                                var course = new Course();
                                course.setName(textline.getContent());
                                course.setType(getCourseTypeAt(_cm, {
                                    line: index,
                                    ch:   0
                                }));
                                textline.setCourse(course);
                            }
                            addWidget(_cm, index, textline.getCourse());
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

                    var textline = new Textline();
                    textline.setCourse(course);

                    textlines.push(textline);
                    addWidget(_cm, lineIndex, course);
                }
                else if(widget) {
                    widget.updateText(lineContent);
                    delete orphelinWidgets[orphelinWidgets.indexOf(widget)];
                }
            });
            orphelinWidgets.forEach(function(widget) {
                delete _widgets[_widgets.indexOf(widget)];
                textlines.some(function(texline, index) {
                    if(texline.getCourse() == widget.getCourse()) {
                        textlines.splice(index, 1);
                        return true;
                    }
                });
            });
        }

        // expose the WidgetManager's API
        this.getWidgetAtLine = getWidgetAtLine;
        this.updateWidgets = updateWidgets;

        init();
    }

    return WidgetManager;
}]);