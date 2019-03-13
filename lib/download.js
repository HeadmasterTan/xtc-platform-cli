const download = require('download-git-repo')
const ora = require('ora')
const path = require('path')

const TEMP_NAME = '.temp';

module.exports = function (target) {
    target = path.join(TEMP_NAME, target || '')
    return new Promise((resolve, reject) => {
        const url = 'direct:https://github.com/HeadmasterTan/xtc-platform-template.git'
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