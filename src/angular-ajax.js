(function(window, angular) {

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
            var c = angular.extend({},
            self.defaultConfig, cfg);
            self.config = c;
        };

        self.request = function(config) {

            cfpLoadingBar.start();

            // 未添加设置，采用默认设置
            if (!self.config) {
                self.setConfig({});
            }
            var cfg = self.config;
            var deferred = $q.defer();
            config.timeout = deferred;

            $http(config).then(function(res) {
                // 正常返回结果
                if (res.data[cfg.codeField] === cfg.successCode) {
                    deferred.resolve(res.data[cfg.contentField])
                    return;
                }
                // 后端报错
                deferred.reject(res.data[cfg.errorField]);
            },
            function(res) {
                // http错误
                deferred.reject(res.status + ' : ' + res.statusText);
            });

            deferred.promise.done = function(fn) {
                deferred.promise.then(function(resData) {
                    if (resData = 'angular-ajax-abort') {
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
                deferred.resolve('angular-ajax-abort');
            };
            return deferred.promise;
        };

        var methods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH'];
        angular.forEach(methods, function(m, i) {
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

})(window, window.angular)

