module.exports={
	checkLogin:function checkLogin(req,res,next){
		if(!req.session.user){
			req.flash('error','not logined');
			return res.redirect('/signin');
		}
		next();
	},
	
	checkNotLogin:function checkNotLogin(req,res,next){
		if(req.session.user){
			req.flash('error','logged in');
			return res.redirect('back');    //返回之前的页面
		}
		next();
	}
};