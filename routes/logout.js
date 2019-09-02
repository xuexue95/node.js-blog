const express = require('express');
const router = express.Router();

// GET /logout 退出登录
router.get('/', (req, res) => {
    // 清空 session
    req.session.user = null;
    // 退出通知信息
    req.flash('success','成功退出登录')
    // 跳转首页
    res.redirect('/')
})

module.exports = router;