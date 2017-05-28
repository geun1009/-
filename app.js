var express = require('express'),
    http = require('http'),
    path = require('path');

var bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    static = require('serve-static'),
    errorHandler = require('errorhandler');

var expressErrorHandler = require('express-error-handler');
var expressSession = require('express-session');

var multer = require('multer');
var mysql = require('mysql');



var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views',__dirname + '/views');
app.set('view engine','ejs');

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

var conn = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'a1s2d3',
  database : 'o2'
});


var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'uploads')
    },
    filename: function (req, file, callback) {
        var extension = path.extname(file.originalname);
        var basename = path.basename(file.originalname, extension);

        callback(null, basename + extension);
    }
});


var upload = multer({
    storage: storage,
    limits: {
        files: 50,
        fileSize: 1024 * 1024 * 1024
    }
});




// -----------------------------------------------------------------------------

app.get(['/process/adduser','/process/adduser/:name'],function(req,res){
   var name = req.params.name;
   var sql ='select * from users where name = ?'

   console.log(name);
   if(name){
   conn.query(sql,[name],function(err,result,fields){

     if(result.length === 0){
      res.render('adduser',{status:'아이디 사용가능'})
   }else{
     res.render('adduser',{status:'아이디 사용불가'})
   }
});

}else{
  res.render('adduser',{status:''})
}
});

app.post('/process/adduser',upload.array('photo', 1), function (req, res) {

    var name = req.body.name;
    var password = req.body.password;
    var password_check = req.body.password_check;
    var gender = req.body.gender;
    var position = req.body.position;
    var quantity = req.body.quantity;
    var local = req.body.local;
    var level = req.body.level;
    var file;





    if (req.files.length === 0) {
        file = './uploads/user.png'
    } else {
        file = './uploads/' + req.files[0].originalname;
    }

     var sql ='select * from users where name = ?'

     conn.query(sql,[name],function(err,result,fields){

       if(result.length ===0){

         var sql = 'INSERT INTO  users (name,password,gender,position,quantity,local,level,file) VALUES(?,?,?,?,?,?,?,?);'
         conn.query(sql,[name,password,gender,position,quantity,local,level,file],function(err,result,fields){
           if(err){
             console.log(err);
             res.status(500).send('Internal Server Error');
           } else {

             console.dir(result);
             res.send('create success');
           }
         });



       }else{

            console.log(err);
           res.status(500).send('아이디가 중복되었습니다.');

       }

});


});







var errorHandler = expressErrorHandler({
    static: {
        '404': './public/404.html'
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);



http.createServer(app).listen(app.get('port'), function () {
    console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));


});
