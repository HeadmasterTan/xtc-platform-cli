const Metalsmith = require('metalsmith') // 静态网站生成器
const Handlebars = require('handlebars') // 知名的模板引擎
const rm = require('rimraf').sync // 相当于UNIX的“rm -rf”命令

module.exports = function (metadata = {}, src, dest = '.') {
    if (!src) {
        return Promise.reject(new Error(`无效的source：${src}`))
    }

    return new Promise((resolve, reject) => {
        Metalsmith(process.cwd())
            .metadata(metadata)
            .clean(false)
            .source(src)
            .destination(dest)
            .use((files, metalsmith, done) => { // 从临时目录复制到项目目录
                const meta = metalsmith.metadata()
                Object.keys(files).forEach(fileName => {
                    const t = files[fileName].contents.toString()
                    files[fileName].contents = new Buffer(Handlebars.compile(t)(meta))
                })
                done()
            }).build(err => {
                rm(src) // 删除临时目录
                err ? reject(err) : resolve()
            })
    })
}