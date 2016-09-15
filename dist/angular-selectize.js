/**
 * Angular Selectize2
 * https://github.com/machineboy2045/angular-selectize
 **/

angular.module('selectize', []).value('selectizeConfig', {}).directive("selectize", ['selectizeConfig',
    function(selectizeConfig) {
        return {
            restrict: 'EA',
            require: '^ngModel',
            scope: {
                ngModel: '=',
                config: '=?',
                options: '=?',
                ngDisabled: '=',
                ngRequired: '&'
            },
            link: function(scope, element, attrs, modelCtrl) {

                var selectize,
                    settings = angular.extend({}, Selectize.defaults, selectizeConfig, scope.config);

                scope.options = scope.options || [];
                scope.config = scope.config || {};

                var isEmpty = function(val) {
                    return val === undefined || val === null || !val.length; //support checking empty arrays
                };

                var toggle = function(disabled) {
                    disabled ? selectize.disable() : selectize.enable();
                }

                var validate = function() {
                    var isRequired = (scope.ngRequired() || attrs.required || settings.required);
                    var isInvalid = false;
                    
                    if(scope.config.maxItems > 1) {
                        isInvalid = isEmpty(scope.ngModel);
                    }
                    else {
                        isInvalid = !scope.ngModel;
                    }
                    
                    modelCtrl.$setValidity('required', !isInvalid);
                };

                var setSelectizeOptions = function(curr, prev) {
                    angular.forEach(prev, function(opt) {
                        if (curr.indexOf(opt) === -1) {
                            var value = opt[settings.valueField];
                            selectize.removeOption(value, true);
                        }
                    });

                    selectize.addOption(curr, true);

                    setSelectizeValue();
                }

                var setSelectizeValue = function() {
                    if(typeof scope.ngModel !== 'object') {
                        return ;
                    }
                    
                    validate();
                    
                    selectize.$control.toggleClass('ng-valid', modelCtrl.$valid);
                    selectize.$control.toggleClass('ng-invalid', modelCtrl.$invalid);
                    selectize.$control.toggleClass('ng-dirty', modelCtrl.$dirty);
                    selectize.$control.toggleClass('ng-pristine', modelCtrl.$pristine);

                    if (!angular.equals(selectize.items, scope.ngModel) && scope.ngModel) {
                        var value = null;

                        if(scope.ngModel && scope.config.maxItems > 1) { 
                            value = scope.ngModel.map(function(item) {
                                return item[scope.config.valueField];
                            });
                        }
                        else {
                            value = scope.ngModel[scope.config.valueField];// [(typeof scope.ngModel === 'object' ? scope.ngModel[scope.config.valueField] : scope.ngModel)]
                        }

                        //change: iterate over ngModel to collect values in order to set the right items
                        selectize.setValue(value, true);
                    }
                }

                settings.onChange = function(value) {
                    var value = angular.copy(selectize.items);
                    if (settings.maxItems == 1) {
                        value = selectize.options[value[0]];
                    } else {
                        value = value.map(function(v) {
                            return selectize.options[v];
                        });
                    }

                    modelCtrl.$setViewValue(value);

                    if (scope.config.onChange) {
                        scope.config.onChange.apply(this, arguments);
                    }
                };

                settings.onOptionAdd = function(value, data) {
                    if (scope.options.indexOf(data) === -1) {
                        scope.options.push(data);

                        if (scope.config.onOptionAdd) {
                            scope.config.onOptionAdd.apply(this, arguments);
                        }
                    }
                };

                settings.onInitialize = function() {
                    selectize = element[0].selectize;

                    setSelectizeOptions(scope.options);

                    //provides a way to access the selectize element from an
                    //angular controller
                    if (scope.config.onInitialize) {
                        scope.config.onInitialize(selectize);
                    }

                    scope.$watchCollection('options', setSelectizeOptions);
                    scope.$watch('ngModel', setSelectizeValue);
                    scope.$watch('ngDisabled', toggle);

                    if(scope.config.maxItems === 1) {
                        element.off('change');
                    }
                };

                element.selectize(settings);

                element.on('$destroy', function() {
                    if (selectize) {
                        selectize.destroy();
                        element = null;
                    }
                });
            }
        };
    }
]);

