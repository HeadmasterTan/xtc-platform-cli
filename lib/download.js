const download = require('download-git-repo') // 用于下载远程仓库至本地 支持GitHub、GitLab、Bitbucket
const ora = require('ora') // 用于命令行上的加载效果
const path = require('path')

const TEMP_NAME = '.temp'; // 模板的临时存储目录

module.exports = function (target) {
    target = path.join(TEMP_NAME, target || '')
    return new Promise((resolve, reject) => {
        const url = 'direct:https://github.com/HeadmasterTan/xtc-platform-template.git' // 远程仓库模板项目地址
        const spinner = ora('正在下载项目模板...')
        spinner.start()
        download(url, target, {
            clone: true
        }, (err) => {
            if (err) {
                spinner.fail() // wrong :(
                reject(err)
            } else {
                spinner.succeed() // ok :)
                resolve({
                    downloadTemp: TEMP_NAME,
                    target
                })
            }
        })
    })
}