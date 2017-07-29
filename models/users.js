var User=require('../lib/mongo').User;

module.exports={
	create:function create(user){
		return User.create(user).exec();
	},


//通过用户名获取用户信息
	getUserByName:function getUserByName(name){
		return User
			.findOne({name:name})      //返沪符合条件的第一条记录
			.addCreatedAt()
			.exec();
	}
};