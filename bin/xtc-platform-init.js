#!/usr/bin/env node

const fs = require('fs')
const glob = require('glob')
const path = require('path')
const chalk = require('chalk')
const program = require('commander')
const logSymbols = require('log-symbols')

const download = require('../lib/download')
const generator = require('../lib/generator')

program.usage('<project-name>')
program.parse(process.argv) // 解析

// 根据输入，获取项目名称
let projectName = program.args[0]

if (!projectName) { // project-name 必填
    // 相当于执行命令的--help选项，显示help信息，这是commander内置的一个命令选项
    program.help()
    return
}

const inquirer = require('inquirer')
const list = glob.sync('*')

let next = undefined
if (list.length) {
    if (list.filter(name => {
            const fileName = path.resolve(process.cwd(), path.join('.', name))
            const isDir = fs.statSync(fileName).isDirectory() // 使用同步函数 statSync，不使用异步函数stat
            return name.indexOf(projectName) !== -1 && isDir
        }).length !== 0) {
        console.log(`项目${projectName}已经存在`)
        return
    }
    next = Promise.resolve(projectName)
} else if (rootName === projectName) {
    next = inquirer.prompt([{
        name: 'buildInCurrent',
        message: '当前目录为空，且目录名称和项目名称相同，是否直接在当前目录下创建新项目？',
        type: 'confirm',
        default: true
    }]).then(answer => {
        return Promise.resolve(answer.buildInCurrent ? '.' : projectName)
    })
} else {
    next = Promise.resolve(projectName)
}

next && go()

function go() {
    next.then(projectRoot => {
        if (projectRoot !== '.') {
            fs.mkdirSync(projectRoot)
        }
        return download(projectRoot).then(target => {
            return {
                name: projectRoot,
                root: projectRoot,
                downloadTemp: target.downloadTemp
            }
        })
    }).then(context => {
        return inquirer.prompt([{
            name: 'projectName',
            message: '项目名称',
            default: context.name
        }, {
            name: 'projectVersion',
            message: '项目版本号',
            default: '1.0.0'
        }, {
            name: 'projectDescription',
            message: '项目简介',
            default: `A project named ${context.name}`
        }]).then(answers => {
            return {
                ...context,
                metadata: {
                    ...answers
                }
            }
        })
    }).then(context => {
        return generator(context.metadata, context.downloadTemp)
    }).then(context => {
        // 成功用绿色显示，给出积极的反馈
        console.log(logSymbols.success, chalk.green('项目模板构建完成。'))
        console.log()
    }).catch(err => {
        // 失败了用红色，增强提示
        console.error(logSymbols.error, chalk.red(`构建失败：${err.message}`))
    })
}