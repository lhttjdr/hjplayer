## 使用说明

该程序是基于本地浏览器的。本地浏览器并不能任意操作文件（例如：解压到目录），因此课件是以文件夹的形式存在，并未压缩合并。
课件分为两部分：一部分是资源文件夹，主要包含了图片、声音等媒体资源；另一部分是一个XML文件，主要描述时间轴以及布局信息（例如：一个图片应在何时显示在什么位置，其大小是多少），以及课件的文字内容。

手动将资源文件夹（data）放到当前目录（index所在的目录），然后用浏览器打开index.html。可以发现在播放器上有打开文件的图标，点击打开XML文件即可播放。

dist/test文件夹中有一个测试课件。

## How to use it

This program is based on local browser. Almost all file operations, for example, extracting to directory, are forbidden. Therefore, the courseware is a directory without merging or compression. A courseware contains two parts: one is a resource directory, including pictures, audios; and the other is an XML file to describle the timeline and layout(i.e. When and where should a picture be shown, and what about its size?), and record all text contents of the courseware.

Put the resource directory(named "data") to current directory(where the "index.html" is), and open "index.html" in your browser. You will see a button to open courseware on the controls panel. Click it to open our XML file, and enjoy it.

There is a courseware for test under dist/test.
