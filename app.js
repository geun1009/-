var express = require('express'),
    http = require('http'),
    path = require('path');

var bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    static = require('serve-static'),
    errorHandler = require('errorhandler');

var expressErrorHandler = require('express-error-handler');
var expressSession = require('express-session');

var mongoose = require('mongoose');

var app = express();

app.set('port', process.env.PORT || 3000);

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());

app.use('/public', static(path.join(__dirname, 'public')));
app.use('/uploads', static(path.join(__dirname, 'uploads')));

app.use(cookieParser());

app.use(expressSession({
    secret: 'my key',
    resave: true,
    saveUninitialized: true
}));

var database; // 데이터베이스 객체를 위한 변수 선언
var UserSchema; // 데이터베이스 스키마 객체를 위한 변수 선언
var UserModel; // 데이터베이스 모델 객체를 위한 변수 선언

function connectDB() {
    var databaseUrl = 'mongodb://localhost:27017/local';
    console.log('데이터베이스 연결을 시도합니다.');
    mongoose.Promise = global.Promise; // mongoose의 Promise 객체는 global의 Promise 객체 사용하도록 함
    mongoose.connect(databaseUrl);


    database = mongoose.connection;

    database.on('error', console.error.bind(console, 'mongoose connection error.'));
    database.on('open', function () {
        console.log('데이터베이스에 연결되었습니다. : ' + databaseUrl);

        UserSchema = mongoose.Schema({
            id: {
                type: String,
                required: true,
                unique: true
            },
            password: {
                type: String,
                required: true
            },
            gender: {
                type: String,
                index: 'hashed'
            },
            position: {
                type: String,
                index: 'hashed'
            },
            quantity: {
                type: Number,
                index: 'hashed'
            },
            local: {
                type: String,
                index: 'hashed'
            },
            level: {
                type: String,
                index: 'hashed'
            }

        });

        console.log('UserSchema 정의함.');

        UserModel = mongoose.model("users", UserSchema);
        console.log('UserModel 정의함.');


    });

    database.on('disconnected', function () {
        console.log('연결이 끊어졌습니다. 5초 후 재연결합니다.');
        setInterval(connectDB, 5000);
    });
}



// -----------------------------------------------------------------------------

var router = express.Router();
router.route('/process/adduser').post(function (req, res) {

    var id = req.body.id;
    var password = req.body.password;
    var password_check = req.body.password_check;
    var gender = req.body.gender;
    var position = req.body.position;
    var quantity = req.body.quantity;
    var local = req.body.local;
    var level = req.body.level;

    console.log(req.body.photo);

    if (database) {
        addUser(database, id, password, gender, position, quantity, local, level, function (err, addedUser) {

            if (err) {
                console.error('사용자 추가 중 에러 발생 : ' + err.stack);
                res.writeHead('200', {
                    'Content-Type': 'text/html;charset=utf8'
                });
                res.write('<h2>사용자 추가 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
                res.end();

                return;

            }

            if (addedUser) {
                console.dir(addedUser);

                res.writeHead('200', {
                    'Content-Type': 'text/html;charset=utf8'
                });
                res.write('<h2>사용자 추가 성공</h2>');
                res.end();
            } else { // 결과 객체가 없으면 실패 응답 전송
                res.writeHead('200', {
                    'Content-Type': 'text/html;charset=utf8'
                });
                res.write('<h2>사용자 추가  실패</h2>');
                res.end();
            }


        });
    } else {
        res.writeHead('200', {
            'Content-Type': 'text/html;charset=utf8'
        });
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.end();
    }



});

app.use('/', router);
// -----------------------------------------------------------------------------


var addUser = function (database, id, password, gender, position, quantity, local, level, callback) {

    console.log('addUser 추가');

    var user = new UserModel({
        "id": id,
        "password": password,
        "gender": gender,
        "position": position,
        "quantity": quantity,
        "local": local,
        "level": level,
    });


    user.save(function (err, addedUser) {
        if (err) {
            callback(err, null);
            return;
        }
        console.log("사용자 데이터 추가함");
        callback(null, addedUser);

    });

}


// -----------------------------------------------------------------------------

var errorHandler = expressErrorHandler({
    static: {
        '404': './public/404.html'
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);



http.createServer(app).listen(app.get('port'), function () {
    console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));
    connectDB();

});
