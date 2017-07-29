var path=require('path');
var express=require('express');
var session=require('express-session');
var MongoStore=require('connect-mongo')(session);
var flash=require('connect-flash');
var config=require('config-lite')(__dirname);
var routes=require('./routes');
var pkg=require('./package');
var winston=require('winston');
var expressWinston=require('express-winston');
var cookieParser=require('cookie-parser');
var app=express();

//设置模板目录
app.set('views',path.join(__dirname,'views'));   //__dirname 当前文件所在目录的完整绝对地址,path.join拼接路径
//设置模板引擎
app.set('view engine','ejs'); 


//设置静态文件目录
app.use(cookieParser(config.session.secret));
app.use(express.static(path.join(__dirname,'public')));  
//session中间件
app.use(session({
	name:config.session.key, //cookie中保存session id的字段名称
	secret:config.session.secret,  //通过设置secret来计算hash值并放在cookie中，使产生的signedCookie防篡改
	resave:true,                       //强制更新session
	saveUninitialized:false,          //强制创建一个session，即使用户未登录
	cookie:{
		maxAge:config.session.maxAge   //过期时间，过期后cookie中的session id自动删除
	},
	store:new MongoStore({
		url:config.mongodb   //将session存储到mongodb地址
	})
}));


app.use(flash());   //flash中间件，用来显示通知
app.use(require('express-formidable')({
	uploadDir:path.join(__dirname,'public/img'),
	keepExtensions:true  //保留后辍
}));


app.locals.blog={
	title:pkg.name,
	description:pkg.description
};


app.use(function(req,res,next){
	res.locals.user=req.session.user;
	res.locals.success=req.flash('success').toString();
	res.locals.error=req.flash('error').toString();
	next();
});

//日志
app.use(expressWinston.logger({
	transports:[
		new(winston.transports.Console)({
			json:true,
			colorize:true
		}),
		new winston.transports.File({
			filename:'logs/success.log'
		})
	]
}));


routes(app);

//错误日志
app.use(expressWinston.errorLogger({
	transports:[
		new winston.transports.Console({
			json:true,
			colorize:true
		}),
		new winston.transports.File({
			filename:'logs/error.log'
		})
	]
}));

//error message
app.use(function(err,req,res,next){
	res.render('error',{
		error:err
	});
});



if(module.parent){
	module.exports=app;
}else{
	//监听端口，启动程序
	app.listen(config.port,function(req,res){
		console.log(`${pkg.name} listening on port ${config.port}`);
	});	
}

