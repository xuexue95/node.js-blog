// 数据库用户集合的模型

const mongoose = require('mongoose');
const sha1 = require('sha1')
require('../lib/mongo')

// 定义 Schema
const UsersSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, '用户名不能为空'],
        minlength: [2, '用户名最少为两个字符'],
        maxlength: [12, '用户名不能超过12个字符'],
        unique: [true, '用户名已经被占用'],
        index: [true, '用户名已经被占用']
    },
    password: {
        type: String,
        required:[true,'密码不能为空'],
    },
    // 头像
    avatar: {
        type: String
    },
    sex: {
        type: String,
        enum:{values:['m', 'w', 'e'],message:'请正确输入性别'} 
    },
    // 个人简介
    bio: {
        type: String
    },
}, { autoIndex: true });

// 创建模型
const UsersModel = mongoose.model('users', UsersSchema);


// 导出方法
module.exports = {
    // 用户注册,存入数据库
    create(user) {
        // 验证 密码字符数至少6位
        if (user.password.length < 6) {
            return new Promise((resolve, reject) => {
                reject('自定义错误: password: 密码长度至少六位')
            })
        };

        // 验证 两次密码一致性
        if (user.password !== user.repassword) {
            return new Promise((resolve, reject) => {
                reject('自定义错误: repassword: 两次密码不一致')
            })
        };

        // 密码加密
        user.password = sha1(user.password);
        delete user.repassword;     // 删除确认密码

        let userInstance = new UsersModel(user);
        return userInstance.save();
    },

    // 查找用户,根据用户名,返回详细信息
    findOneByName(username) {
        return UsersModel.findOne({ username: username }).exec();
    }
}