var express=require('express');
var router=express.Router();
var PostModel=require('../models/posts');
var checkLogin=require('../middlewares/check').checkLogin;
var CommentModel=require('../models/comments');
var moment=require('moment');
var objectIdToTimestamp=require('objectid-to-timestamp');

//GET /posts?author=xxx
router.get('/',function(req,res,next){
	var author=req.query.author;
	
	PostModel.getPostsByPageId(1,author)
		.then(function(posts){
			return res.render('posts',{
				posts:posts
			});
		})
		.catch(next);
});		

//GET /posts/create发表文章页
router.get('/create',checkLogin,function(req,res,next){
	return res.render('create');
});


//POST /posts发表一篇文章
router.post('/',checkLogin,function(req,res,next){
	var author=req.session.user._id;
	var title=req.fields.title;
	var content=req.fields.content;
	var itemId=req.fields.sort;
	
	try{
		if(!title.length){
			throw new Error('请填写标题');
		}
		if(!content.length){
			throw new Error('请填写内容');
		}
	}catch(e){
		req.flash('error',e.message);
		return res.redirect('back');
	}
	
	var post={
		author:author,
		title:title,
		content:content,
		pv:0,
		itemId:itemId
	};
	
	PostModel.create(post)
		.then(function(result){
			//此post是插入mongodb后的值，包含_id
			console.log(result);
			post=result.ops[0];
			req.flash('success','发表成功');
			res.redirect(`/posts/personal/${post._id}`);
		}).catch(next);

});



//GET /posts/personal/:postId 单独一篇的文章
router.get('/personal/:postId',function(req,res,next){
	var postId=req.params.postId;
	
	Promise.all([
		PostModel.getPostById(postId),
		CommentModel.getComments(postId),
		PostModel.incPv(postId)
	])
	.then(function(result){
		var post=result[0];
		var comments=result[1];
		if(!post){
			throw new Error('文章不存在');
		}
		console.log(typeof(post.created_at));
		res.render('post',{
			post:post,
			comments:comments
		});
	})
	.catch(next);
});

//GET /posts/:postId/edit 更新文章页
router.get('/:postId/edit',checkLogin,function(req,res,next){
	var postId=req.params.postId;
	var author=req.session.user._id;
	
	PostModel.getRawPostById(postId)
		.then(function(post){
			if(!post){
				throw new Error('文章不存在');
			}
			if(author.toString()!==post.author._id.toString()){
				throw new Error('权限不足');
			}
			res.render('edit',{
				post:post
			});
		})
		.catch(next);
});

//POST /posts/:postId/edit 更新一篇文章
router.post('/:postId/edit',checkLogin,function(req,res,next){
	var postId=req.params.postId;
	var author=req.session.user._id;
	var title=req.fields.title;
	var content=req.fields.content;
	
	PostModel.updatePostById(postId,author,{title:title,content:content})
		.then(function(){
			req.flash('success','更新文章成功');
			res.redirect(`/posts/personal/${postId}`);
		})
		.catch(next);
});

//GET /posts/:postId/remove 删除一篇文章
router.get('/:postId/remove',checkLogin,function(req,res,next){
	var postId=req.params.postId;
	var author=req.session.user._id;
	
	PostModel.delPostById(postId,author)
		.then(function(){
			req.flash('success','删除文章成功');
			res.redirect('/posts');
		})
		.catch(next);
});

//POST /posts/:postId/comment 创建一条留言
router.post('/:postId/comment',checkLogin,function(req,res,next){
	var postId=req.params.postId;
	var author=req.session.user._id;
	var content=req.fields.content;
	var comment={
		postId:postId,
		author:author,
		content:content
	};
	
	CommentModel.create(comment)
		.then(function(){
			req.flash('success','留言发表成功');
			res.redirect('back');
		})
		.catch(next);
}); 

//GET /posts/:postId/comment/:commentId/remove 删除一条留言
router.get('/:postId/comment/:commentId/remove',checkLogin,function(req,res,next){
	var commentId=req.params.commentId;
	var author=req.session.user._id;
	
	CommentModel.delCommentById(commentId,author)
		.then(function(){
			req.flash('success','删除留言成功');
			res.redirect('back');
		})
		.catch(next);
});


/*-----------------文章搜索结果页面------------------------*/
//POST  /posts/search?keyword=xxx 搜索结果页面
router.post('/search',function(req,res,next){
	var keyword=req.fields.keyword;
	var author=req.session.author;
	console.log(keyword);

	PostModel.getPostsByKeyword(keyword)
		.then(function(posts){
			return res.render('posts',{
				posts:posts
			});
		})
		.catch(next);
});


/*----------文章分类---------------------------------------*/
//GET /posts/sort/:itemId 分类页面
router.get('/sort/:itemId',checkLogin,function(req,res,next){
	var author=req.session.user._id;
	var itemId=req.params.itemId;
	
	PostModel.getPostsByItem(itemId,author)
		.then(function(posts){
			return res.render('posts',{
				posts:posts
			});
		})
		.catch(next);
});

/*-----------------归档-------------------------------------*/
//GET /posts/archive/ 按发表时间归档
router.get('/archive',function(req,res,next){
	var author=req.query.author;
	var month=[];
	var posts=[];
	for (var i=1;i<=12;i++){
		posts.push({
			month:i,
			articles:[]
		});
	}
	console.log(posts);
	
	PostModel.getPosts(author)
		.then(function(results){
			results.forEach(function(item){
				console.log(item.created_month);
				if(month.indexOf(item.created_month)===-1){
					month.push(item.created_month);
				}
				posts[month].articles.push(item);
			});
			
			console.log('month:'+month);
			return res.render('archive',{
				month:month,
				posts:posts
			});
		})
		.catch(next);
});

module.exports=router;