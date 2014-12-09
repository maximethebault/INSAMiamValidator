var app = angular.module('validator.autocomplete', ['ngResource', 'ui.codemirror', 'validator.persistence']);

app.service('Hinter', ['CourseResource', function(CourseResource) {
    return function() {
        CodeMirror.registerHelper("hint", "miamu", function(cm, cb, options) {
            var cur = cm.getCursor(), token = cm.getTokenAt(cur);
            var inner = CodeMirror.innerMode(cm.getMode(), token.state);
            if(inner.mode.name != "miamu") return;

            var word = token.string;
            var start = token.start;
            var end = token.end;
            var line = cur.line;
            if(inner.state.error) {
                return;
            }

            var courseType = null;
            if(inner.state.starter) {
                courseType = 'starter';
            }
            else if(inner.state.main) {
                courseType = 'main';
            }
            else if(inner.state.dessert) {
                courseType = 'dessert';
            }
            else {
                return;
            }
            CourseResource.query({
                courseType: courseType,
                similar:    word
            }, function(courses) {
                var suggestionList = [];
                courses.forEach(function(course) {
                    course.setType(courseType);
                    suggestionList.push({
                        course: course,
                        text:   course.getName(),
                        hint:   function() {
                            options.onCompletion(line, course);
                        }
                    });
                });
                cb({
                    list: suggestionList,
                    from: CodeMirror.Pos(cur.line, start),
                    to:   CodeMirror.Pos(cur.line, end)
                });
            });
        });
    };
}]);