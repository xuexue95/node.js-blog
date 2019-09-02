const express = require('express');
const router = express.Router();
const checkLogin = require('../middlewares/check').checkLogin;
const postsModel = require('../models/posts');
const commentsModel = require('../models/comments');

// GET /posts 或者 /posts?author=xxx 文章列表或者指定作者的文章
router.get('/', (req, res, next) => {
    let author = req.query.author;
    postsModel.getPosts(author)
        .then((result) => {
            // console.log(result);
            res.render('posts',{posts:result})
        })
        .catch(next);
});

//GET /posts/create 发表文章的页面
router.get('/create',checkLogin,(req, res) => {
    res.render('create');
});

// GET .posts/:postId 文章详情页
router.get('/:postId', (req, res,next) => {
    const postId = req.params.postId;
    Promise.all([
        postsModel.getPostById(postId),
        commentsModel.getComments(postId),
        postsModel.incPv(postId)
    ]).then((result) => {
        const post = result[0];
        const comments = result[1];
        // console.log(comments)
        if (!post) {
            return res.redirect('/')
        }
        res.render('post', {
            post: post,
            comments:comments
        });
    })
    .catch(next);
});

// POST /posts 执行文章的发表
router.post('/', checkLogin, (req, res) => {
    const postData = {
        author: req.session.user._id,
        title: req.fields.title,
        content : req.fields.content,
        pv:0
    };
    postsModel.create(postData)
        .then((result) => {
            let postId = result._id
            req.flash('success', '文章添加成功')
            res.redirect('/posts/'+postId)
        })
        .catch((err) => {
            let errMessage = err.toString().split(':').pop();
            req.flash('error', errMessage);
            res.redirect('back');
        })
});

// GET /post/:postId/edit 修改文章页面
router.get('/:postId/edit', (req, res, next) => {
    let postId = req.params.postId;
    postsModel.getEditPostById(postId)
        .then((result) => {
            res.render('edit', { post: result })
        })
        .catch(next);
});

// POST /post/:postId/edit 执行修改文章
router.post('/:postId/edit', checkLogin, (req, res) => {
    let postId = req.params.postId;
    let postData = {
        title : req.fields.title,
        content : req.fields.content
    }
    postsModel.updatePostById(postId, postData)
        .then((result) => {
            req.flash('success', '修改成功');
            res.redirect('/posts/'+postId)
        })
        .catch((err) => {
            req.flash('error','修改失败')
            res.redirect('back');
        })
});

// GET /posts/:postId/remove 删除文章
router.get('/:postId/remove', checkLogin, (req, res) => {
    let postId = req.params.postId;
    Promise.all([
        postsModel.removePostById(postId),
        commentsModel.deleteCommentByPostId(postId)
    ])
        .then((result) => {
            req.flash('success', '文章删除成功');
            res.redirect('/posts');
        })
        .catch((err) => {
            req.flash('error', '文章删除失败')
            res.redirect('back')
        })

});

// POST /posts/:postId/comment 创建一条留言
router.post('/:postId/comment', checkLogin, (req, res) => {
    // 创建数据
    let postId = req.params.postId;
    let commentData = {
        userId: req.session.user._id,
        postId: postId,
        content: req.fields.content
    };

    // 执行添加留言
    commentsModel.create(commentData)
        .then((result) => {
            req.flash('success', '留言添加成功');
            res.redirect('/posts/' + postId);
        })
        .catch((err) => {
            let errMessage = err.toString().split(':').pop();
            req.flash('error', errMessage);
            res.redirect('back');
        })

});

// GET /posts/:postsId/comment/:commentId/remove 删除留言
router.get('/:postId/comment/:commentId/remove',checkLogin, (req, res) => {
    let commentId = req.params.commentId;
    commentsModel.deleteCommentById(commentId)
        .then((result) => {
            req.flash('success', '留言删除成功');
            res.redirect('back');
        })
        .catch((err) => {
            req.flash('error', '留言删除失败')
            res.redirect('back')
        })
});

module.exports = router;