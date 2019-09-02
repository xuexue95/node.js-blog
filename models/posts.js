//  数据库文章集合的模型

const mongoose = require('mongoose');
const moment = require('moment');   // 处理时间日期
const marked = require('marked');   // 处理 markdown
const objectIdToTimestamp = require('objectid-to-timestamp')    // 从id中提取时间
const commentsModel = require('./comments');


// 创建 Schema
const postsSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId,ref:'users'},
    title: { type: String, required: [true, '文章标题不能为空'] },
    content: { type: String, required: [true, '文章内容不能为空'] },
    pv: { type: Number }    // 文章访问量
}, {
    collection: 'posts'
    })

// 插件
postsSchema.plugin(function (schema) {
    schema.post('find', function (result) {
        return Promise.all(
            result.map(function (item) {
                // 添加文章时间
                item.created_at = moment(objectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm');
                // markdown转html
                item.contentHtml = marked(item.content)
    
                return commentsModel.getcommentCount(item._id)
                    .then((result) => {
                        item.commentsCount = result;
                    })
            })
        )
    }),

    schema.post('findOne', function (item) {
        if (item) {
            item.created_at = moment(item.createdDate).format('YYYY-MM-DD HH:mm');
            item.contentHtml = marked(item.content)
            return commentsModel.getcommentCount(item._id)
                .then((result) => {
                    item.commentsCount = result;
                })
        }
        return item;
    })
})


// 创建模型
const PostsModel = mongoose.model('posts', postsSchema);

// 导出方法
module.exports = {

    // 添加文章
    create(data) {
        let post = new PostsModel(data);
        return post.save();
    },

    // 根据用户id查询所有文章
    getPosts(author) {
        let query = {};
        if (author) {
            query.author = author;
        }
        return PostsModel
            .find(query)
            .populate('author')
            .sort({_id:-1})
            .exec();
    },

    // 根据 id 查询具体的文章
    getPostById(postId) {
        return PostsModel
            .findOne({ _id: postId })
            .populate('author')
            .exec();
    },

    // 文章浏览次数 +1
    incPv(postId) {
        return PostsModel
            .update({ _id: postId }, { $inc: { pv: 1 } })
            .exec();
    },

    // 根据id查询文章(编辑页面使用)
    getEditPostById(postId) {
        return PostsModel
            .findById(postId)
            .exec()
    },

    // 根据文章 id 修改文章
    updatePostById(postId, data) {
        return PostsModel
            .update({ _id: postId }, { $set: data })
            .exec()
    },

    // 根据文章 id 删除文章
    removePostById(postId) {
        return PostsModel.deleteOne({ _id: postId }).exec();
    }
}