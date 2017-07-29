var Post=require('../lib/mongo').Post;
var marked=require('marked');    //使用markdown解析文章内容
var CommentModel=require('./comments');

Post.plugin('addCommentsCount',{
	afterFind:function(posts){
		return Promise.all(posts.map(function(post){
			return CommentModel.getCommentsCount(post._id).then(function(commentsCount){
				post.commentsCount=commentsCount;
				return post;
			});
		}));
	},
	
	afterFindOne:function(post){
		if(post){
			return CommentModel.getCommentsCount(post._id).then(function(count){
				post.commentsCount=count;
				return post;
			});
		}
		return post;
	}
});
Post.plugin('contentToHtml',{
	afterFind:function(posts){
		return posts.map(function(post){
			post.content=marked(post.content);
			return post;
		});
	},
	afterFindOne:function(post){
		if(post){
			post.content=marked(post.content);
		}
		return post;
	}
});

Post.index({title:"text",content:"text"});

module.exports={
	create:function create(post){
		return Post.create(post).exec();
	},
	
	getPostById:function getPostById(postId){
		return Post	
			.findOne({_id:postId})
			.populate({path:'author',model:'User'})
			.addCreatedAt()
			.addCommentsCount()
			.contentToHtml()
			.exec();
	},
	
	//按创建时间降序获取所有用户文章或某个特定用户的所有文章
	getPosts:function getPosts(author){
		var query={};
		if(author){
			query.author=author;
		}
		return Post	
			.find(query)
			.populate({path:'author',model:'User'})
			.sort({_id:-1})
			.addCreatedAt()
			.addCommentsCount()
			.contentToHtml()
			.exec();
	},
	
	//通过分类获取该作者的所有文章
	getPostsByItem:function(itemId,author){
		var query={};
		if(author){
			query.author=author;
			query.itemId=itemId;
		}
		return Post
			.find(query)
			.populate({path:'author',model:'User'})
			.sort({_id:-1})
			.addCreatedAt()
			.addCommentsCount()
			.contentToHtml()
			.exec();
	},
	
	//通过文章id给pv加1
	incPv:function incPv(postId){
		return Post
			.update({_id:postId},{$inc:{pv:1}})
			.exec();
	},
	
	
	//通过文章id获取一篇原生文章（编辑文章）
	getRawPostById: function getRawPostById(postId){
		return Post
			.findOne({_id:postId})
			.populate({path:'author',model:'User'})
			.exec();
	},
	
	updatePostById: function updatePostById(postId,author,data){
		return Post.update({author:author,_id:postId},{$set:data}).exec();
	},
	
	delPostById: function delPostById(postId,author){
		return Post.remove({author:author,_id:postId})
			.exec()
			.then(function(res){
				if(res.result.ok && res.result.n>0){
					return CommentModel.delCommentsByPostId(postId);
				}
			});
	},
	
	//获取文章总数
	getPostsCount:function getPostsCount(author){
		return Post.count({author:author}).exec();
	},
	//根据页码获取一页数据
	getPostsByPageId: function getPostsByPageId(pageId,author){
		var pageSize=10;
		var postsCount=Post.count({author:author}).exec();
		var startIndex=0;
		var pageCount=Math.ceil((postsCount-startIndex)/pageSize);
		var query={};
		if(author){
			query.author=author;
		}
		console.log("postsCount:"+postsCount);
		console.log("pageCount:"+pageCount);
		
		return Post
			 .find(query,
				 {limit:pageSize,skip:(startIndex+(pageId-1)*pageSize)}
			  )
			 .populate({path:'author',model:'User'})
			 .sort({_id:-1})
			 .addCreatedAt()
			 .addCommentsCount()
			 .contentToHtml()
			 .exec();
	},
	
	getPostsByKeyword:function getPostsByKeyword(keyword){
		var query={};
		
		
		return Post
			.find({$text:{$search:"html"}})
			.populate({path:'author',model:'User'})
			.sort({_id:-1})
			.addCreatedAt()
			.addCommentsCount()
			.contentToHtml()
			.exec();
	},
	
	getDistinctMonth: function getDistinctMonth(author){
		 var query={};
		 if(author){
			 query.author=author;
		 }
		 return Post.distinct('created_month',query,{sort:-1});
			
	/*
		Post.aggregate([{$match:{author:{$in:[author]}}},
			{$group:{_id:"$created_month"
				
			}},
			{sort:-1}
		],function(err,results){
			console.log(results);
			return results;
		});
	*/
	}
	
};