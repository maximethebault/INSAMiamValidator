var app = angular.module('validator.model', ['ngResource', 'ui.codemirror']);

app.factory('Menus', function() {
    function Menus() {
        var _menus = [];

        function addMenu(menu) {
            _menus.push(menu);
        }

        function getMenus() {
            return _menus;
        }

        this.addMenu = addMenu;
        this.getMenus = getMenus;
    }

    return Menus;
});

app.factory('Menu', function() {
    function Menu() {
        var _id;
        var _date;
        var _type;
        var _closed;
        var _meal;

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

        function setMeal(meal) {
            _meal = meal;
        }

        function getMeal() {
            return _meal;
        }

        function toJSON() {
            var obj = {
                id:     _id,
                closed: _closed
            };
            if(!_closed) {
                obj.meal = _meal.toJSON();
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
        this.setMeal = setMeal;
        this.getMeal = getMeal;
        this.toJSON = toJSON;
    }

    return Menu;
});

app.factory('Meal', function() {
    function Meal() {
        var _mealEntries = [];

        function addMealEntry(mealEntry) {
            _mealEntries.push(mealEntry);
        }

        function removeMealEntry(mealEntry) {
            var index = _mealEntries.indexOf(mealEntry);
            if(index > -1) {
                _mealEntries.splice(index, 1);
            }
        }

        function getMealEntries() {
            return _mealEntries;
        }

        function toJSON() {
            var exportArray = [];
            _mealEntries.forEach(function(_mealEntry) {
                var json = _mealEntry.toJSON();
                if(json) {
                    exportArray.push(json);
                }
            });
            return exportArray;
        }

        this.addMealEntry = addMealEntry;
        this.removeMealEntry = removeMealEntry;
        this.getMealEntries = getMealEntries;
        this.toJSON = toJSON;
    }

    return Meal;
});

app.factory('MealEntry', function() {
    function MealEntry() {
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

    return MealEntry;
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

app.factory('Widget', function() {
    function Widget(course) {
        var _course = course;
        var _cmWidget = null;
        var $el = $('<div style="cursor: pointer; padding: 2px 25px 8px;">Loading...</div>');
        $el.on('click', function() {
            resetWidget();
        });

        function init() {
            updateHtml();
        }

        function resetWidget() {
            _course.setId(null);
            _course.setName(_cmWidget.line.text);
            updateHtml();
        }

        function updateHtml() {
            if(_course.getId()) {
                $el.html('<div>Existing ' + _course.getType() + ': ' + _course.getName() + '</div>');
            }
            else {
                $el.html('<div>New ' + _course.getType() + ': ' + _course.getName() + '</div>');
            }
        }

        function setCmWidget(cmWidget) {
            _cmWidget = cmWidget;
        }

        function getLine() {
            return _cmWidget.line.lineNo();
        }

        function getCourse() {
            return _course;
        }

        function setCourse(course) {
            if(!_course) {
                _course = course;
                return;
            }
            _course.setId(course.getId());
            _course.setName(course.getName());
            _course.setType(course.getType());
            updateHtml();
        }

        function getHtml() {
            return $el[0];
        }

        function updateText(text) {
            if(!_course.getId()) {
                _course.setName(text);
                updateHtml();
            }
        }

        // expose the Widget's API
        this.setCmWidget = setCmWidget;
        this.getLine = getLine;
        this.getCourse = getCourse;
        this.setCourse = setCourse;
        this.getHtml = getHtml;
        this.updateText = updateText;

        init();
    }

    return Widget;
});