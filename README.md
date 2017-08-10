## 说明

沪江课件的专用播放器。目前是未完成版。比如，练习环节等尚未实现。

本程序不提供课件数据的解密提取办法。

注：上一版代码（已移到broswer分支）基于浏览器开发，因此设计上基于标准的DOM事件。而且界面布局是嵌入HTML页面的，布局是相对于页面内容计算的。现改为Electron框架，界面布局要与桌面窗口关联，某些设计窗体的事件需要通过remote交互。目前，代码勉强移植过来了，但还略混乱，留待以后重构。

![img](./screenshot/1.png)

## 编译
直接从源码运行

    npm install
    npm start

编译打包程序

    npm run build

可以在`./dist`下生成适合各操作系统的不同版本程序，参见下节。

## 版本说明

-  Mac OS X/IOS系统（均基于Darwin操作系统，一种Unix-like操作系统）下请使用hjplayer-darwin-x64。

-  Mac App Store（hjplayer-mas-x64）版，可以忽略。（如果一个软件想要发布到App Store，那么苹果公司要求软件必须通过App Store更新，而不能自己具备更新功能。否则审核不过。因此搞出一个特殊版本。）

-  32位Linux操作系统下请使用hjplayer-linux-ia32。

-  64位Linux操作系统下请使用hjplayer-linux-x64。

-  ARM v7 处理器的（little endian）Linux系统请使用hjplayer-linux-armv7l。课件目录位于hjplayer-linux-armv7l/resources/app/data

（ARMv7是32位处理器，常见于手机等手持设备。从armv8起是64位处理器。）

-  32位Windows操作系统，请使用hjplayer-win32-ia32。

-  64位Windows操作系统，请使用hjplayer-win32-x64。

其它处理器或操作系统，暂时没有相应版本。
