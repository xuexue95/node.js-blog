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