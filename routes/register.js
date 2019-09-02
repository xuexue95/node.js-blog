const express = require('express');
// const sha1 = require('sha1');       // 密码加密
const router = express.Router();
const path = require('path');
const userModel = require('../models/users');
const checkNotLogin = require('../middlewares/check').checkNotLogin;

// GET /register 注册页面
router.get('/',checkNotLogin, (req, res) => {

    // 加载注册页
    res.render('register');
    // res.send(req.originalUrl);
});

// POST /register 执行注册
router.post('/',checkNotLogin, (req, res) => {

    // 获取表单中的数据
    let user = {
        username: req.fields.username,
        password: req.fields.password,
        repassword:req.fields.repassword,
        sex: req.fields.sex,
        bio: req.fields.bio,
        avatar: req.files.avatar.path.split(path.sep).pop()
    };

    // 向集合中添加文档
    userModel.create(user)
        .then((result) => {
            
            // 注册成功 添加通知信息
            req.flash('success','注册成功')
            // 跳转到登录页面
            res.redirect('/login');
        })
        .catch((err) => {
            let errMessage = err.toString().split(':').pop();

            // 添加失败通知信息
            req.flash('error',errMessage)
            console.log(errMessage);

            // 跳转到注册页
            res.redirect('/register');
        })
});

module.exports = router;