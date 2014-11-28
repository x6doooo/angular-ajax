(function(window, angular) {

    var limit = 65535;
    function createBaseArray() {
        return [0, 0];
    }
    var cacheNums = {};
    var guid = function(key) {
        var nums = cacheNums[key];
        if (!nums) {
            nums = cacheNums[key] = createBaseArray();
        }
        var idx = 0;
        var len = nums.length;
        while(idx < len) {
            if (++nums[idx] > limit) {
                nums[idx] = 0;
                idx++;
            } else {
                break;
            }
        }
        var id = nums.join('-');
        if (key) {
            id = key + '-' + id;
        }
        return id;
    };

    angular.module('ngAjax', [
        'chieffancypants.loadingBar', 
        'ngAnimate'
    ]).config(function(cfpLoadingBarProvider) {
        //true is the default, but I left this here as an example:
        cfpLoadingBarProvider.includeSpinner = true;
    }).service('$ajax', ['$q', '$http', 'cfpLoadingBar', function($q, $http, cfpLoadingBar) {
        var self = this;
        // 默认设置
        self.defaultConfig = {
            // 状态描述字段
            codeField: 'code',
            // 成功
            successCode: 0,
            // 内容字段
            contentField: 'data',
            // 错误描述字段
            errorField: 'error'
        };
        // 设置
        self.setConfig = function(cfg) {
            self.confg = angular.extend({}, self.defaultConfig, cfg);
        };

        var abortMsgStr = 'angular-ajax-abort-1234567890';

        var allRequest = {};

        // todo: some defer snyc
        self.when = function(/*defer, defer, ...*/) {
            var args = Array.prototype.slice.call(arguments, 0);

        };

        self.clearAll = function() {
            angular.forEach(allRequest, function(v, k) {
                v.abort();
                //在abort里完成delete
                //delete allRequest[k];
            });
        };

        self.request = function(ajaxConfig) {
            
            var uid = guid('$ajax');

            cfpLoadingBar.start();

            // 未添加设置，采用默认设置
            if (!self.config) {
                self.setConfig({});
            }
            var cfg = self.config;
            var deferred = $q.defer();
            ajaxConfig.timeout = deferred;
            allRequest[uid] = deferred;

            if (ajaxConfig.beforeSend) {
                ajaxConfig.beforeSend();
            }

            $http(ajaxConfig).then(function(res) {
                delete allRequest[uid];
                // 正常返回结果
                if (res.data[cfg.codeField] === cfg.successCode) {
                    deferred.resolve(res.data[cfg.contentField]);
                    return;
                }
                // 后端报错
                deferred.reject(res.data[cfg.errorField]);
            },
            function(res) {
                delete allRequest[uid];
                // http错误
                deferred.reject(res.status + ' : ' + res.statusText);
            });

            deferred.promise.done = function(fn) {
                deferred.promise.then(function(resData) {
                    console.log(resData);
                    if (resData === abortMsgStr) {
                        return;
                    }
                    fn(resData);
                });
                return deferred.promise;
            };
            deferred.promise.fail = function(fn) {
                deferred.promise.then(null, function(resData) {
                    fn(resData);
                });
                return deferred.promise;
            };
            //取消
            deferred.promise.abort = function() {
                delete allRequest[uid];
                deferred.resolve();
            };
            return deferred.promise;
        };

        var methods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH'];
        angular.forEach(methods, function(m) {
            self[m.toLowerCase()] = function(url, data, config) {
                switch (m) {
                    case 'GET':
                        if (data) {
                            var p = [];
                            angular.forEach(data, function(v, k) {
                                p.push(k + '=' + v);
                            });
                            p = '?' + p.join('&');
                            url += p;
                            data = null;
                        }
                        break;
                    case 'HEAD':
                    case 'DELETE':
                        if (data) {
                            config = data;
                            data = null;
                        }
                        break;
                    default:
                        break;
                }
                var obj = {
                    method: m,
                    url: url
                };
                if (data) obj.data = data;
                if (config) obj.config = config;
                return this.request(obj);
            };
        });

        /* TODO:
         *
         *  jsonp
         *  abort
         *  when(xhr, xhr, ...)
         *
         * */

    }]);

})(window, window.angular);

