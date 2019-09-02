# Node.js+Express+MongoDB 博客项目



## 1 项目介绍

### 未登录

* 浏览文章

* 浏览评论

* 登陆

* 注册

### 登陆后

* 发表文章
* 修改文章
* 评论文章
* 删除文章
* 个人主页
* 退出登陆




## 2 项目配置

### 2.1 目录结构

>|— config    配置文件目录
>
>|— lib   存放底层设置文件
>
>|— logs    存放日志
>
>|— middlewares  存放自定义的中间件
>
>|— models   存放操作数据库的文件
>
>|— node_modules   第三方npm模块
>
>|— public  存放静态文件，样式、图片等
>
>|—|— css
>
>|—|— javascripts
>
>|—|— images
>
>|— routes  存放路由文件
>
>|— test  相关命令文件
>
>|— views    模板文件
>
>|— index.js  项目入口文件
>
>|— pageage.json  存储项目名、描述、作者、依赖等等信息



### 2.2 MVC

MVC的全名是Model View Controller，是模型(model)－视图(view)－控制器(controller)的缩写，是一种软件设计典范。



### 2.3 所依赖模块

* express    web框架

* express-session  session中间件

* connect-mongo  将session存储于mongodb,结合express-session使用

* connect-flash   页面通知提示的中间间，基于session实现

* ejs 模板引擎

* express-formidable  接收表单及文件上传中间件

* config-lite  读取配置文件

* marked: markdown解析

* moment 时间格式化

* mongoose  MongoDB驱动

* objectid-to-timestamp 根据ObjectId 生成时间戳

* sha1 sha1加密，用于密码加密

* winston 日志

* express-winston  基于winston的express中间件

  

### 2.4 配置

#### config-lite 模块

config-lite 是一个轻量的读取配置文件的模块。config-lite 会根据环境变量（NODE_ENV）的不同从当前执行进程目录下的 config 目录加载不同的配置文件。如果不设置 NODE_ENV，则读取默认的 default 配置文件，如果设置了 NODE_ENV，则会合并指定的配置文件和 default 配置文件作为配置，config-lite 支持 .js、.json、.node、.yml、.yaml 后缀的文件。

如果程序以 NODE_ENV=test node app 启动，则通过 require('config-lite') 会依次降级查找 config/test.js、config/test.json、config/test.node、config/test.yml、config/test.yaml 并合并 default 配置; 如果程序以 NODE_ENV=production node app 启动，则通过 require('config-lite') 会依次降级查找 config/production.js、config/production.json、config/production.node、config/production.yml、config/production.yaml 并合并 default 配置。

#### 在 config目录下 配置文件default.js

```javascript
module.exports = {
    port: 3000,  //项目端口
    mongodb: 'mongodb://blogUser:123456@localhost:27017/myblog',
    session: {
        secret: 'myblog',
        key: 'myblog',
        maxAge:2592000000
    }
}
```



## 3 路由设计

### ① 注册

* 注册页  GET /register
* 注册  POST  /register

**register.js:**

```js
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
```



### ② 登陆

* 登陆页  GET  /login
* 登陆   POST / login

**login.js:**

```javascript
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
```



### ③ 退出登陆

* 登出  GET  /logout

**logout.js:**

```javascript
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
```



### ④ 查看文章 

* 主页 GET/posts
* 个人主页 GET /posts?author=xxx
* 查看一篇文章(包括留言)  GET /posts/:postId

**posts.js**

```javascript
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
```



### ⑤ 发表文章

* 发表文章页 GET /posts/create
* 发表文章 POST  /posts/

**posts.js:**

```javascript
//GET /posts/create 发表文章的页面
router.get('/create',checkLogin,(req, res) => {
    res.render('create');
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
```



### ⑥ 修改文章

* 修改文章页 GET  /posts/:postId/edit
* 修改文章 POST /posts/:postId/eidt

**posts.js:**

```javascript
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
```



### ⑦ 删除文章

* GET /posts/:postId/remove

**posts.js:**

```javascript
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
```



### ⑧ 留言

* 创建留言 POST /posts/:postId/comment
* 删除留言 GET /posts/:postId/comment/:commentId/remove

**posts.js:**

```javascript
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
```



## 4  项目通用操作

### 4.1 代码热更新

* node-dev

  

### 4.2 数据库连接

* lib/mongos.js

  ```js
  const mongoose = require('mongoose');
  const config = require('config-lite')(__dirname);
  
  // 连接mongodb的连接
  mongoose.connect(config.mongodb);
  const conn = mongoose.connection;
  
  conn.on('error', (err) => {
      console.log('数据库连接失败');
      throw err;
  });
  
  conn.on('open', () => {
      console.log('数据库连接成功');
  });
  ```

  

### 4.3 模板全局变量

* index.js

  ```javascript
  // 模板引擎的使用
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  
  // 设置模板全局变量
  app.locals.blog = {
      title: 'NDSC',
      description: pkg.description
  };
  
  // 中间件 向模板中添加全局变量
  app.use((req, res, next) => {
      res.locals.user = req.session.user;
      res.locals.success = req.flash('success').toString();
      res.locals.error = req.flash('error').toString();
      next();
  })
  ```

  

### 4.4 错误页面定制

* index.js

  ```javascript
  // 定制错误页面
  app.use((err, req, res, next) => {
      console.log(err)
      res.status(500).render('error', { error: err })
  });
  ```

* views/404.js

  ```html
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="utf-8">
      <title><%= blog.title %></title>
      <script type="text/javascript" src="http://www.qq.com/404/search_children.js" charset="utf-8"></script>
  </head>
  <body></body>
  </html>
  ```

  

### 4.5 静态资源托管

* index.js

  ```javascript
  // 静态资源托管
  app.use(express.static(path.join(__dirname, 'public')));
  ```

  

### 4.6 日志

* index.js

  ```javascript
  const winston = require('winston');
  const expressWinston = require('express-winston');  // 记录日志
  
  // 记录用户正常请求
  app.use(expressWinston.logger({
      transports: [
          new (winston.transports.Console)({
              json: true,
              colorize: true
          }),
          new winston.transports.File({
              filename: 'logs/success.log'
          })
      ]
  }));
  
  // 记录用户错误请求
  app.use(expressWinston.errorLogger({
      transports: [
          new (winston.transports.Console)({
              json: true,
              colorize: true
          }),
          new (winston.transports.File)({
              filename: 'logs/error.log'
          })
      ]
  }));
  ```

  

## 5 注册

### 5.1 用户模型设计 （数据库）

* model/users.js

  ```javascript
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
  ```

  

### 5.2 注册页

* routes/register.js

  ```javascript
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
  ```

  

### 5.3 执行注册(包括文件上传)

* index.js

  ```javascript
  // 设置 处理 post 请求和文件上传的中间件
  app.use(formidable({
      uploadDir: path.join(__dirname, '/public/img'),
      keepExtensions: true
  }));
  ```

### 5.4 页面组件化



## 6 登陆

### 6.1 登陆页

* routes/login.js

### 6.2 执行登陆

* routes/login.js

  ```javascript
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
  ```

  

### 6.3 session中间件 

default.js

```javascript
 session: {
 	secret: 'xdlblog',
 	key: 'xdlblog',
 	maxAge:2592000000
 },
```

index.js

```javascript
const session = require('express-session');
const MongoStore = require('connect-mongo')(session); // 将session信息存入mongodb

//session中间件
app.use(session({
    name: config.session.key,  //设置cookie保存session_id的字段名称
    secret: config.session.secret, //通过设置 secret来计算hash值并放在cookie中，使产生signedCookie 防篡改
    cookie: {
        maxAge: config.session.maxAge //过期时间 session_id存储到cookie上的过期时间
    },
    store: new MongoStore({   //session存储到mongodb中
        url: config.mongodb
    }),
    resave:false,
    saveUninitialized:true
}));
```

### 6.4 nofitication （通知）

**设置通知中间件:**

```javascript
const flash = require('connect-flash')  // 提示信息 将消息通知放入session中

// 中间件 向模板中添加全局变量
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    res.locals.success = req.flash('success').toString();
    res.locals.error = req.flash('error').toString();
    next();
})
```

**调用通知:**

```
req.flash('error', '用户名不存在');
 
req.flash('success', '登录成功');
```



### 6.5 退出登陆

```javascript
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
```



## 7 cookie&session

### 7.1 会话控制

* HTTP协议是无状态的
* 所谓的无状态就是指服务器不能区分出多次请求是否发送自同一个用户
* 服务器更无法确定 用户是否已经登陆



### 7.2 cookie

#### Express中设置cookie

* res.cookie(name, value [, options])

  > domain：cookie在什么域名下有效，类型为String,。默认为网站域名
  >
  > expires:    cookie过期时间，类型为Date。如果没有设置或者设置为0，那么该cookie只在这个这个	 session有效，即关闭浏览器后，这个cookie会被浏览器删除。
  >
  > httpOnly:   只能被web server访问，类型Boolean。
  >
  > maxAge:   实现expires的功能，设置cookie过期的时间，类型为String，指明从现在开始，多少毫秒以后，cookie到期。
  >
  > path: cookie在什么路径下有效，默认为'/'，类型为String
  >
  > secure：只能被HTTPS使用，类型Boolean，默认为false

#### Express删除cookie

* res.clearCookie(name [, options])

#### Express中读取cookie

* req.headers.cookies

#### 所需中间件

* cookie-parser 

  ```
  npm install  cookie- parser
  ------------------------------------
  req.cookies // 一对象的形式输出cookie信息
  ```

  

### 7.3 session

#### express-session中间件

```javascript
const session = require('express-session');
const app = express();

app.use(session({
    cookie: { path: '/', httpOnly: true, secure: false, maxAge: null },
    name : '', // cookie中字段的名字 默认值为connect.sid
    secret: '', //设置cookie的secure值，默认是不设置任何值 通过设置 secret来计算hash值并放在cookie中，使产生signedCookie 防篡改
    domain:'/',  //设置cookie可以设置的域名，如果没有设置则cookie默认在当前域可以使用
    genid: '',//设置创建session id的自定义函数，默认使用 uid-safe扩展来生成id, 自定义genid创建函数时一定要保证创建的id不要重复，
    resave: true, //是否允许session重新设置，要保证session有操作的时候必须设置这个属性为true，
    saveUninitialized: true， //是否设置session在存储容器中可以给修改，
    store: //session存储的实例子，一般可以用redis和mangodb来实现，
    unset: '' //设置req.session在什么时候可以设置  值:destory:请求结束时候session摧毁，值:keep session在存储中的值不变，在请求之间的修改将会忽略，而不保存
    
}))；


//使用sessino
app.get('/', function(req, res) {
    req.session; //对象
   
})
```



#### connect-mongo

```javascript
app.use(session({
    store: new MongoStore({ url: 'mongodb://localhost/test-app' })
}));
 
```



#### session-file-store

```javascript
var session = require('express-session');
var FileStore = require('session-file-store')(session);
 
app.use(session({
    store: new FileStore(options),
    secret: 'keyboard cat'
}));
```



### 7.4 cookie和session的区别

1.  最大的区别应该在于存储的地方不一样，cookie存储在客户端，session存储在服务器；
2. 从安全性方面来说，cookie存储在客户端，很容易被窃取，暴露用户信息，而session存储在服务器，被窃取的机会小很多，故session的安全性比cookie高；
3. 从性能方面来说，cookie存储在浏览器端消耗的是用户的资源，相对比较分散，而session消耗的服务器的内存，会造成服务器端的压力；
4. cookie可以长期的存储在客户端，但是数量和大小都是有限制的；session存在服务器的时间较短，但是没有大小的限制。





## 8 登陆权限验证

### 8.1 自定义中间件

```javascript
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
```

* 验证是否登陆



## 9 发表文章

### 9.1 文章模型设计

```javascript
//  数据库文章集合的模型

const mongoose = require('mongoose');
const moment = require('moment');   // 处理时间日期
const marked = require('marked');   // 处理 markdown

// 创建 Schema
const postsSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId,ref:'users'},
    title: { type: String, required: [true, '文章标题不能为空'] },
    content: { type: String, required: [true, '文章内容不能为空'] },
    pv: { type: Number }    // 文章访问量
}, {
        timestamps: {
            createdAt: 'createdDate',
            updatedAt:false
        },
        collection: 'posts'
    })

// 插件
postsSchema.plugin(function (schema) {
    schema.post('find', function (result) {
        return result.map(function (item) {
            item.created_at = moment(item.createdDate).format('YYYY-MM-DD HH:mm');
            item.content = marked(item.content)
            return item
        })
    }),

    schema.post('findOne', function (item) {
        if (item) {
            item.created_at = moment(item.createdDate).format('YYYY-MM-DD HH:mm');
            item.content = marked(item.content)
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

    // 查询所有文章
    getPosts(author) {
        let query = {};
        if (author) {
            query.author = author;
        }
        return PostsModel
            .find(query)
            .populate('author')
            .sort({createdDate:-1})
            .exec();
    },

    // 查询具体的文章
    getPostById(postId) {
        return PostsModel
            .findOne({ _id: postId })
            .populate('author')
            .exec();
    }
}
```



### 9.2 发表文章页

```javascript
//GET /posts/create 发表文章的页面
router.get('/create',checkLogin,(req, res) => {
    res.render('create');
});
```

```html
<%- include('header') %>

<div class="ui grid">
    <div class="two wide column">
        <a class="avatar"
           href="/posts?author=<%= user._id %>"
           data-title="<%= user.name %> | <%= ({m: '男', f: '女', x: '保密'})[user.gender] %>"
           data-content="<%= user.bio %>">
            <img class="avatar" src="/img/<%= user.avatar %>">
        </a>
    </div>

    <div class="fourteen wide column">
        <form class="ui form segment" method="post" action="/posts">
            <div class="field required">
                <label>标题</label>
                <input type="text" name="title">
            </div>
            <div class="field required">
                <label>内容</label>
                <textarea name="content" rows="15"></textarea>
            </div>
            <input type="submit" class="ui button" value="发布">
    </div>
    </form>
</div>

<%- include('footer') %>
```



### 9.3 执行文章发表

```javascript
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
```



## 10. 查看文章

### 10.1 文章列表

```javascript
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
```



### 10.2 文章详情

```javascript
// GET .posts/:postId 文章详情页
router.get('/:postId', (req, res,next) => {
    const postId = req.params.postId;
    postsModel.getPostById(postId)
        .then((result) => {
            if (!result) {
                return res.redirect('/')
            }
            res.render('post', {
                post:result
            });
        })
        .catch(next);
});
```



### 10.3 文章浏览次数

```javascript
    // 创建模型
const PostsModel = mongoose.model('posts', postsSchema);

// 导出方法
module.exports = {
    // 文章浏览次数 +1
    incPv(postId) {
        return PostsModel
            .update({ _id: postId }, { $inc: { pv: 1 } })
            .exec();
    }
}
```



## 11 修改与删除文章

### 11.1 进入编辑文章页面

* routes/posts.js

  ```javascript
  // GET /post/:postId/edit 修改文章页面
  router.get('/:postId/edit', (req, res, next) => {
      let postId = req.params.postId;
      postsModel.getEditPostById(postId)
          .then((result) => {
              res.render('edit', { post: result })
          })
          .catch(next);
  });
  ```

  

### 11.2 文章编辑页面

### 11.3 执行文章编辑

* routes/posts.js

  ```javascript
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
  ```

  

### 11.4 删除文章

* routes/posts.js

  ```javascript
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
  ```

  

## 12 留言

### 12.1 留言模型设计

* models/comments.js

  ```javascript
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
  ```

  

### 12.2 发表留言

* routes/posts.js

  ```javascript
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
  ```

  

### 12.3 显示留言

* 模型方法

  ```javascript
  // 根据文章 id 显示留言
      getComments(postId) {
          return CommentsModel
              .find({ postId: postId })
              .populate('userId')
              .sort({ _id: -1 })
              .exec()
      },
  ```

* 显示文章详情时调用

### 12.4 统计每篇文章的留言数

* 模型方法

  ```javascript
      // 根据文章id 返回留言的数量
      getcommentCount(postId) {
          return CommentsModel.count({ postId: postId }).exec();
      },
  ```

* 在posts模型中封装插件

  ```javascript
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
  ```

* 在获取文章的同时获取文章的评论数

### 12.5 删除留言

* models/comments.js

  ```javascript
      // 根据留言id 删除留言
      deleteCommentById(commentId) {
          return CommentsModel.deleteOne({ _id: commentId }).exec();
      },
  ```

* routes/posts.js

  ```javascript
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
  ```

  

### 12.6 删除文章的同时 删除改文章的留言

* models/comments.js

  ```javascript
      // 根据文章id 删除所有id
      deleteCommentByPostId(postId) {
          return CommentsModel.deleteMany({ postId: postId }).exec();
      }
  ```

* /routes/posts.js

  ```javascript
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
  ```

* 执行删除文章的同时执行方法



## 13 部署

### 13.1 守护进程

* pm2
* forever



### 13.2 pm2

#### 全局安装

```
npm install pm2 -g
```

#### 常用命令

```
pm2 start app.js
pm2 stop appName
pm2 restart appName
pm2 list
```
