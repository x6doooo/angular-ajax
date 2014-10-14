(function(window, angular) {

angular.module('ngAjax', ['chieffancypants.loadingBar', 'ngAnimate'])
    .config(function(cfpLoadingBarProvider) {
      //true is the default, but I left this here as an example:
      cfpLoadingBarProvider.includeSpinner = false;
    })
    .service('$ajax', 
    ['$q', '$http', 'cfpLoadingBar',
    function($q, $http, cfpLoadingBar) {
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
            var c = angular.extend({}, self.defaultConfig, cfg);
            self.config = c;
        };
        
        self.request = function(config) {
            // 未添加设置，采用默认设置
            if (!self.config) {
                self.setConfig({});
            }
            var cfg = self.config;
            var deferred = $q.defer();
            $http(config).then(function(res) {
                if (res.data[cfg.codeField] === cfg.successCode) {
                    deferred.resolve(res.data[cfg.contentField])
                } else {
                    deferred.reject(res[cfg.errorField]);
                } 
            }, function(res) {
                deferred.reject(res.status + ' : ' + res.statusText); 
            });
            deferred.promise.done = function(fn) {
                deferred.promise.then(function(resData) {
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
            return deferred.promise;
        }; 
        this.get = function(url, data) {
            // 参数格式化追加到url上
            if (data) {
                var p = [];
                angular.forEach(data, function(v, k) {
                    p.push(k + '=' + v); 
                });
                p = '?' + p.join('&');
                url += p;
            }
            return this.request({
                method: 'GET',
                url: url
            });
        };
        // todo: put delete post
    }]);

})(window, window.angular)
