var app = angular.module('validator.service', ['ngResource', 'ui.codemirror', 'validator.model']);

app.factory('Widget', ['Course', function(Course) {
    function Widget(textline) {
        var _textline = textline;
        var _cmWidget = null;
        var $el = $('<div style="cursor: pointer; padding: 2px 25px 8px;">Loading...</div>');
        $el.on('click', function() {
            resetCourse();
        });

        function init() {
            // if the textline hasn't got a course object, let's add it!
            if(!_textline.getCourse()) {
                var course = new Course();
                _textline.setCourse(course);
            }
        }

        function resetCourse() {
            _textline.getCourse().setId(null);
            update();
        }

        function setCmWidget(cmWidget) {
            _cmWidget = cmWidget;
            update();
        }

        function getTextline() {
            return _textline;
        }

        function getLine() {
            return _cmWidget.line.lineNo();
        }

        function setCourse(course) {
            _textline.getCourse().setId(course.getId());
            _textline.getCourse().setName(course.getName());
            _textline.getCourse().setType(course.getType());
            update();
        }

        function getHtml() {
            return $el[0];
        }

        function update() {
            if(!_textline.getCourse().getId()) {
                _textline.getCourse().setName(computeText());
                _textline.getCourse().setType(computeCourseType());
            }
            else {
                //TODO: handle courses in the wrong section
            }
            updateHtml();
        }

        function updateHtml() {
            if(_textline.getCourse().getId()) {
                $el.html('<div>Existing ' + _textline.getCourse().getType() + ': ' + _textline.getCourse().getName() + '</div>');
            }
            else {
                $el.html('<div>New ' + _textline.getCourse().getType() + ': ' + _textline.getCourse().getName() + '</div>');
            }
        }

        function computeText() {
            return _cmWidget.line.text;
        }

        function computeCourseType() {
            return getCourseTypeAtCursor({
                line: getLine(),
                ch:   0
            });
        }

        function getCourseTypeAtCursor(cursor) {
            var _cm = _cmWidget.cm;
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

        // expose the Widget's API
        this.setCmWidget = setCmWidget;
        this.getTextline = getTextline;
        this.getLine = getLine;
        this.setCourse = setCourse;
        this.getHtml = getHtml;
        this.update = update;

        init();
    }

    return Widget;
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
                    textlines.forEach(function(textline, lineNo) {
                        if(textline.getContent()) {
                            addWidget(_cm, lineNo, textline);
                        }
                    });
                });
                $timeout(function() {
                    cb();
                });
            });
        }

        function addWidget(_cm, lineNo, textline) {
            var widget = new Widget(textline);
            widget.setCmWidget(_cm.addLineWidget(lineNo, widget.getHtml()));
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

        /**
         * Scans the content for changes :
         * -> adds new widgets if brand new lines are detected
         * -> updates existing widgets
         * -> removes widgets whose associated lines were deleted
         *
         * @param _cm CodeMirror the CodeMirror instance
         * @param editorContent String the raw editor content
         */
        function updateWidgets(_cm, editorContent) {
            var orphelinWidgets = [];
            // we copy the _widgets array into a new one
            angular.extend(orphelinWidgets, _widgets);
            var lines = editorContent.split('\n');
            lines.forEach(function(lineContent, lineIndex) {
                var widget = getWidgetAtLine(lineIndex);
                if(lineContent.length && !widget) {
                    var textline = new Textline();
                    textlines.push(textline);

                    addWidget(_cm, lineIndex, textline);
                }
                else if(widget) {
                    widget.update();
                    delete orphelinWidgets[orphelinWidgets.indexOf(widget)];
                }
            });
            orphelinWidgets.forEach(function(widget) {
                delete _widgets[_widgets.indexOf(widget)];
                delete textlines.splice(textlines.indexOf(widget.getTextline()), 1);
            });
        }

        // expose the WidgetManager's API
        this.getWidgetAtLine = getWidgetAtLine;
        this.updateWidgets = updateWidgets;

        init();
    }

    return WidgetManager;
}]);