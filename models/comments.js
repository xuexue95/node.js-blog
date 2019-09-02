//  数据库留言模型

const mongoose = require('mongoose');
const objectIdToTimestamp = require('objectid-to-timestamp')    // 从id中提取时间
const moment = require('moment');   // 处理时间日期

// 创建 Schema
const CommentsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    postId: { type: mongoose.Schema.Types.ObjectId },
    content: { type: String, required: [true, '留言内容不能为空'] }
}, {
    collection:'comments'
    });

// 插件
// 添加评论时间
CommentsSchema.plugin(function (Schema) {
    Schema.post('find', function (result) {
        result.forEach(function (item) {
            item.created_at = moment(objectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm');;
        });
    })
})

// 创建模型
const CommentsModel = mongoose.model('comments', CommentsSchema);

// 导出方法
module.exports = {

    // 添加留言
    create(commentData) {
        const comment = new CommentsModel(commentData);
        return comment.save();
    },

    // 根据文章 id 显示留言
    getComments(postId) {
        return CommentsModel
            .find({ postId: postId })
            .populate('userId')
            .sort({ _id: -1 })
            .exec()
    },

    // 根据文章id 返回留言的数量
    getcommentCount(postId) {
        return CommentsModel.count({ postId: postId }).exec();
    },

    // 根据留言id 删除留言
    deleteCommentById(commentId) {
        return CommentsModel.deleteOne({ _id: commentId }).exec();
    },

    // 根据文章id 删除所有id
    deleteCommentByPostId(postId) {
        return CommentsModel.deleteMany({ postId: postId }).exec();
    }
}