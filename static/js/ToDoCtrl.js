function ToDoCtrl($scope,$http,color) {
    $scope.todos = [];
    $scope.projectPickMode = false;

    socket.on('todo',function(data) {
        $scope.todos = data;
        $scope.$apply();
    });
    socket.on('todoproject',function(data) {
        $scope.project = data;
        $scope.$apply();
    });

    $scope.load = function() {
        $http.get('/todos').success(function(projects) {
            $scope.projects = projects;
            $scope.project = projects[0].name;
        });
    };

    $scope.$watch('project',function(newValue) {
        if (newValue) {
            socket.emit('todoproject',newValue);
            $scope.loadProject(newValue);
        }
    });

    $scope.pickProject = function(project) {
        $scope.project = project.name;
        $scope.projectPickMode = false;
    };

    $scope.togglePickMode = function() {
        $scope.projectPickMode = !$scope.projectPickMode;
    };

    $scope.loadProject = function(projectName) {
        return $http.get('/todos/'+projectName).success(function(todos) {
            $scope.todos = todos;
        });
    };

    $scope.save = function() {
        $http.post('/todos/'+$scope.project,$scope.todos);
    };

    $scope.toggle = function(todo) {
        todo.done = !todo.done;
        $scope.save();
    };

    $scope.toggleDeleteMode = function() {
        $scope.deleteMode = !$scope.deleteMode;
    };

    $scope.remove = function(index) {
        $scope.todos.splice(index,1);
        $scope.save();
    };

    $scope.promote = function(todo) {
        console.log('promote',todo);
    };

    $scope.demote = function(todo) {
        console.log('demote',todo);
    };

    $scope.add = function() {
        $scope.todos.push({
            text: $scope.newTodo,
            done: false
        });
        $scope.newTodo = '';
        $scope.save();
    };

    $scope.getColor = color.getColor;

    $scope.load();
}