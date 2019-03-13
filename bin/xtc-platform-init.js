#!/usr/bin/env node

const fs = require('fs') // node自带的fs模块下的existsSync方法，用于检测路径是否存在。（会阻塞）
const glob = require('glob') // node的glob模块允许你使用 *等符号， 来写一个glob规则，像在shell里一样，获取匹配对应规则的文件
const path = require('path') // node自带的path模块，用于拼接路径
const chalk = require('chalk') // 用于高亮终端打印出的信息
const program = require('commander') // 命令行处理工具
const logSymbols = require('log-symbols') // 在终端上显示 × 和 √

const download = require('../lib/download') // 自定义工具-用于下载模板
const generator = require('../lib/generator') // 自定义工具-用于渲染模板

program.usage('<project-name>') // project-name必填
program.parse(process.argv) // 解析

// 根据输入，获取项目名称
let projectName = program.args[0]

if (!projectName) {
    // 相当于执行命令的--help选项，显示help信息，这是commander内置的一个命令选项
    program.help()
    return
}

const inquirer = require('inquirer') // 用于命令行与开发者交互
const list = glob.sync('*') // 遍历当前目录

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
} else {
    next = Promise.resolve(projectName)
}

next && go()

function go() {
    next.then(projectRoot => {
        if (projectRoot !== '.') {
            fs.mkdirSync(projectRoot)
        }
        return download(projectRoot).then(target => { // 下载项目模板
            return {
                name: projectRoot,
                root: projectRoot,
                downloadTemp: target.downloadTemp
            }
        })
    }).then(context => { // 交互问答，配置项目信息
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
        return generator(context.metadata, context.downloadTemp) // 渲染项目模板
    }).then(context => {
        // 成功用绿色显示，给出积极的反馈
        console.log(logSymbols.success, chalk.green('项目模板构建完成。'))
        console.log()
    }).catch(err => {
        // 失败了用红色，增强提示
        console.error(logSymbols.error, chalk.red(`构建失败：${err.message}`))
    })
}