// 导入模块
const express = require('express');
const path = require('path');
const config = require('config-lite')(__dirname);   // 配置文件
const pkg = require('./package.json');
const routers = require('./routes/index');      // 路由
const winston = require('winston');
const expressWinston = require('express-winston');  // 记录日志
const formidable = require('express-formidable');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session); // 将session信息存入mongodb
const flash = require('connect-flash')  // 提示信息 将消息通知放入session中

// 创建 express 应用
const app = express();

// 静态资源托管
app.use(express.static(path.join(__dirname, 'public')));

// 设置 session 中间件
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

// flash中间价,显示通知
app.use(flash());

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

// 设置 处理 post 请求和文件上传的中间件
app.use(formidable({
    uploadDir: path.join(__dirname, '/public/img'),
    keepExtensions: true
}));

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

// 路由
routers(app);

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

// 定制错误页面
app.use((err, req, res, next) => {
    console.log(err)
    res.status(500).render('error', { error: err })
});

// 监听端口
app.listen(config.port, () => {
    console.log(`${pkg.name} was running.. listening on port ${config.port}`)
});
