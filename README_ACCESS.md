# 手机访问指南

## 方案 1：同一 WiFi 网络（推荐，最简单）

如果您的手机和电脑连接在同一个 WiFi 网络下，可以直接使用局域网 IP 访问：

**访问地址：**
- 基础 Demo：`http://10.0.32.168:8080/index.html`
- 福利中心：`http://10.0.32.168:8080/welfare-center.html`

**示例 URL（带参数）：**
- `http://10.0.32.168:8080/index.html?activityId=act_202512&code=abc123&channelTag=weibo`
- `http://10.0.32.168:8080/welfare-center.html?activityId=welfare_center_202512&code=abc123&channelTag=app`

## 方案 2：内网穿透（跨网络访问）

如果需要从外网访问，可以使用内网穿透工具。

### 使用 ngrok（需要注册）

1. 访问 https://dashboard.ngrok.com/get-started/your-authtoken 获取 authtoken
2. 运行：`ngrok config add-authtoken YOUR_TOKEN`
3. 运行：`ngrok http 8080`

### 使用 serveo（无需安装，使用 SSH）

在终端运行：
```bash
ssh -R 80:localhost:8080 serveo.net
```

然后会显示一个公网地址，在手机上访问该地址即可。
