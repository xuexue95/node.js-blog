module.exports = {
    // 只有登录才能往下进行
    checkLogin: function (req,res,next) {
        if (!req.session.user) {
            req.flash('error', '请登录');
            return res.redirect('/login');
        }
        next();
    },

    // 未登录才能进行
    checkNotLogin: function (req,res,next) {
        if (req.session.user) {
            req.flash('error', '您已经登录,请先退出登录');
            return res.redirect('back');
        }
        next();
    }
}