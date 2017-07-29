module.exports={
	port:8080,     //程序要监听的端口号
	//express-session的配置信息
	session:{
		secret:'blog',   
		key:'blog',
		maxAge:2592000000
	},
	//mongodb的地址
	mongodb:'mongodb://localhost:27017/blog'
};