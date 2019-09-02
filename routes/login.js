const express = require('express');
const router = express.Router();
const usersModel = require('../models/users');
const sha1 = require('sha1');
const checkNotLogin = require('../middlewares/check').checkNotLogin;

// GET /login 登录页面
router.get('/',checkNotLogin, (req, res) => {
    res.render('login')
})

// POST /login 执行登录
router.post('/',checkNotLogin, (req, res) => {
    console.log(req.session);

    // 获取登录页面表单的数据
    let username = req.fields.username;
    let password = req.fields.password;

    // console.log(username, password);
    // 从集合中获取数据
    usersModel.findOneByName(username)
        .then((result) => {
            // console.log(result) //用户数据
            // 判断用户是否存在
            if (!result) {
                // 用户不存在
                req.flash('error', '用户名不存在');
                return res.redirect('back');
            }

            // 判断密码是否匹配
            if (sha1(password) !== result.password) {
                // 密码错误
                req.flash('error', '密码错误');
                return res.redirect('back');
            }

            // 登录成功,将用户信息写入 session
            delete result.password;     // 存入前删除密码
            req.session.user = result;

            // 跳转到首页
            req.flash('success', '登录成功');
            res.redirect('/')
        })
        .catch((err) => {
            next(err);
        })
});

module.exports = router;