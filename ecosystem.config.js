module.exports = {
  apps: [{
    name: 'ynnai-image',  // 确保这里的名称与启动命令中使用的一致
    script: 'npm',
    args: 'start',
    cwd: '/path/to/your/project',  // 确保这是正确的项目路径
    env: {
      NODE_ENV: 'production',
      PORT: 3008
    }
  }]
}; 