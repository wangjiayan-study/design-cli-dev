'use strict';
const axios = require('axios')
const semver = require('semver')
const logs = require('@design-cli-dev/logs')

const NPM_Register = 'https://registry.npmjs.org'
const CNPM_Register = 'https://registry.npm.taobao.org'

function getDefaultRegister (isOrigin = true){
    return isOrigin ? NPM_Register : CNPM_Register
}
async function getNpmInfo (pakgName, registry) {
    const registryUrl = registry || getDefaultRegister()
    const url = `${registryUrl}/${pakgName}`
    logs.info('获取npm信息:', url)
    try{
        const {status,data } = await axios.get(url)
        return status === 200 ? data : null
    }catch(err){
        return Promise.reject(err)
    }
}

async function getNpmSemverVersion (pakgName,registry) {
    const data = await getNpmInfo(pakgName, registry)
    return Object.keys(data?.versions) || []
}

// 提取所有版本号，比对哪些版本号是大于当前版本号
async function getNpmNewVersions (npmName, curVersion, registry){
    try{
        const versionList = await getNpmSemverVersion(npmName, registry)
        return versionList
        .filter((version)=> semver.gt(version, curVersion))
        .sort((a, b)=> semver.gt(a, b))
    } catch(err){
        throw new Error(err)
    }
}

/**
 * 获取最新的版本号
 * @param {*} npmName 
 * @returns 
 */
async function getNpmLatestVersion (npmName) {
    try{
    const versionList = await getNpmSemverVersion(npmName)
    return versionList
    .sort((a, b)=> semver.gt(a, b))?.[0]
    } catch(err){
        throw new Error(err)
    }
}

module.exports = {
    getNpmInfo,
    getNpmLatestVersion,
    getNpmSemverVersion,
    getNpmNewVersions
}