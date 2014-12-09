var app = angular.module('validator.persistence', ['ngResource', 'ui.codemirror', 'validator.model']);

app.factory('MealResource', ['$resource', 'Meal', 'Textline', 'Course', function($resource, Meal, Textline, Course) {
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
                'Accept-Charset': 'charset=utf-8'
            },
            transformRequest: function(meal) {
                return JSON.stringify(meal.toJSON());
            }
        }
    });
}]);

app.factory('CourseResource', ['$resource', 'Course', function($resource, Course) {
    return $resource(
        '/insamiam/api/:courseType',
        {
            courseType: '@courseType',
            similar:    '@similar'
        },
        {
            query: {
                method:            'GET',
                headers:           {
                    'Accept':         'application/json; charset=utf-8',
                    'Accept-Charset': 'charset=utf-8'
                },
                responseType:      'json',
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