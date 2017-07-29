var config=require('config-lite')(__dirname);
var Mongolass=require('mongolass');
var mongolass= new Mongolass();
var moment=require('moment');
var objectIdToTimestamp=require('objectid-to-timestamp');
mongolass.connect(config.mongodb);

mongolass.plugin('addCreatedAt',{
	afterFind:function(results){
		results.forEach(function(item){
			item.created_at=moment(objectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm');
			item.created_time=moment(objectIdToTimestamp(item._id));
			item.created_month=new Date(item.created_time).getMonth()+1;
			item.created_date=new Date(item.created_time).getDate();
		});
		return results;
	},
	afterFindOne:function(result){
		if(result){
			result.created_at=moment(objectIdToTimestamp(result._id)).format('YYYY-MM-DD HH:mm');
			result.created_time=moment(objectIdToTimestamp(result._id));
			result.created_month=new Date(result.created_time).getMonth()+1;
			result.created_date=new Date(result.created_time).getDate();
		}
		return result;
	}
});


exports.User=mongolass.model('User',{
	name:{type:'string'},
	password:{type:'string'},
	avatar:{type:'string'},
	gender:{type:'string',enum:['m','f','x']},
	bio:{type:'string'}
});
exports.User.index({name:1},{unique:true}).exec();  //根据用户名找到用户，用户名全局唯一


exports.Post=mongolass.model('Post',{
	author:{type:Mongolass.Types.ObjectId},
	title:{type:'string'},
	content:{type:'string'},
	pv:{type:'number'},
	itemId:{type:'string'}
});
exports.Post.index({author:1,_id:-1}).exec(); //按创建时间降序查看用户的文章列表


exports.Comment=mongolass.model('Comment',{
	author:{type:Mongolass.Types.ObjectId},
	content:{type:'string'},
	postId:{type:Mongolass.Types.ObjectId}
});

exports.Comment.index({postId:1,_id:1}).exec();
exports.Comment.index({author:1,_id:1}).exec();