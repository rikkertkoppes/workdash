angular.module('socketio',[]).factory('$socket',['$rootScope',function($rootScope) {
    var socket = io.connect();

    return {
        on: function(event,cb) {
            socket.on(event,function(data) {
                $rootScope.$apply(function() {
                    cb(data);
                });
            });
        }
    };
}]);