var app = angular.module('validator.model', ['ngResource', 'ui.codemirror']);

app.factory('Meal', function() {
    function Meal() {
        var _id;
        var _date;
        var _type;
        var _closed;
        var _textlines = [];

        function setId(id) {
            _id = id;
        }

        function getId() {
            return _id;
        }

        function setDate(date) {
            _date = date;
        }

        function getDate() {
            return _date;
        }

        function setType(type) {
            _type = type;
        }

        function getType() {
            return _type;
        }

        function setClosed(closed) {
            _closed = closed;
        }

        function isClosed() {
            return _closed;
        }

        function setTextlines(textlines) {
            _textlines = textlines;
        }

        function getTextlines() {
            return _textlines;
        }

        function toJSON() {
            var obj = {
                id:     _id,
                closed: _closed
            };
            if(!_closed) {
                var exportArray = [];
                _textlines.forEach(function(_textline) {
                    var json = _textline.toJSON();
                    if(json) {
                        exportArray.push(json);
                    }
                });
                // when we export a meal, the 'textlines' concept disappears
                // instead, we're giving the list of courses directly
                obj.courses = exportArray;
            }
            return obj;
        }

        this.setId = setId;
        this.getId = getId;
        this.setDate = setDate;
        this.getDate = getDate;
        this.setType = setType;
        this.getType = getType;
        this.setClosed = setClosed;
        this.isClosed = isClosed;
        this.setTextlines = setTextlines;
        this.getTextlines = getTextlines;
        this.toJSON = toJSON;
    }

    return Meal;
});

app.factory('Textline', function() {
    function Textline() {
        var _content;
        var _course;

        function setContent(content) {
            _content = content;
        }

        function getContent() {
            return _content;
        }

        function setCourse(course) {
            _course = course;
        }

        function getCourse() {
            return _course;
        }

        function toJSON() {
            if(_course) {
                return _course.toJSON();
            }
            else {
                return null;
            }
        }

        this.setContent = setContent;
        this.getContent = getContent;
        this.setCourse = setCourse;
        this.getCourse = getCourse;
        this.toJSON = toJSON;
    }

    return Textline;
});

app.factory('Course', function() {
    function Course() {
        var _id, _name, _type;

        function setId(id) {
            _id = id;
        }

        function getId() {
            return _id;
        }

        function setName(name) {
            _name = name;
        }

        function getName() {
            return _name;
        }

        function setType(type) {
            _type = type;
        }

        function getType() {
            return _type;
        }

        function toJSON() {
            return {
                id:   _id,
                name: _name,
                type: _type
            };
        }

        this.setId = setId;
        this.getId = getId;
        this.setName = setName;
        this.getName = getName;
        this.setType = setType;
        this.getType = getType;
        this.toJSON = toJSON;
    }

    Course.filterCourse = function(unfilteredCourse) {
        var courseType = null;
        if(unfilteredCourse.hasOwnProperty('starter')) {
            courseType = 'starter';
        }
        else if(unfilteredCourse.hasOwnProperty('main')) {
            courseType = 'main';
        }
        else if(unfilteredCourse.hasOwnProperty('dessert')) {
            courseType = 'dessert';
        }
        if(!courseType) {
            return null;
        }
        var course = new Course();
        course.setId(unfilteredCourse[courseType].id);
        course.setName(unfilteredCourse[courseType].name);
        course.setType(courseType);
        return course;
    };

    return Course;
});