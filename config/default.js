module.exports = {
    port: 3000,  //项目端口
    mongodb: 'mongodb://blogUser:123456@localhost:27017/myblog',
    session: {
        secret: 'myblog',
        key: 'myblog',
        maxAge:2592000000
    }
}
