// 路由的基础文件
module.exports = function (app) {

    // 首页 文章列表
    app.get('/', (req, res) => {
        res.redirect('/posts');
    });

    app.use('/register', require('./register'));
    app.use('/login', require('./login'));
    app.use('/logout', require('./logout'));
    app.use('/posts', require('./posts'));

    // 404 页面
    app.use((req,res) => {
        if (!res.headersSent) {
            res.render('404')
        }
    })
}