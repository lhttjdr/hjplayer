/* Project: hjplayer
 * Description: a simple player for hujiang class version 3.
 * Author: lhttjdr
 * Date: 2016
 * Lisence: MIT
 */

var $ = require("jquery");
require("jquery-mousewheel")($);
require('malihu-custom-scrollbar-plugin')($);
require("jplayer");
var xml2js = require("xml2js");


/* jPlqyerAdapter
 * audio player based on jplayer
 *
 */
var jPlayerAdapter = function(jplayerPath) {
    this.state = "";
    this.jplayer = null;
    this.jplayer = $("#jquery_jplayer_1")
        .jPlayer({
            cssSelectorAncestor: "#jp_container_1",
            swfPath: jplayerPath,
            supplied: "mp3",
            wmode: "window",
            useStateClassSkin: true,
            autoBlur: false,
            smoothPlayBar: true,
            keyEnabled: true,
            remainingDuration: false,
            toggleDuration: false
        });
}
jPlayerAdapter.prototype = {
    play: function() {
        this.jplayer.jPlayer("play");
    },
    pause: function() {
        this.jplayer.jPlayer("pause");
    },
    stop: function() {
        this.jplayer.jPlayer("stop");
    },
    seek: function(t) {
        if (this.jplayer.data()
            .jPlayer.status.paused) {
            this.jplayer.jPlayer("pause", t);
        } else {
            this.jplayer.jPlayer("play", t);
        }
    },
    setDataSource: function(path) {
        this.jplayer.jPlayer("setMedia", {
            mp3: path
        });
    },
    setTitle: function(title) {
        $("#title")
            .html(title);
    },
    isPaused: function() {
        return this.jplayer.data()
            .jPlayer.status.paused;
    },
    destroy: function() {
        this.jplayer.jPlayer("destroy");
    },
    bind: function(event, callback, callback1) {
        switch (event) {
            case "timeupdate":
                this.jplayer.bind($.jPlayer.event.timeupdate, function(event) {
                    callback(Math.floor(event.jPlayer.status.currentTime)); // callback takes 1 parameter: time
                });
                break;
            default:
                ;
        }
    }
};

/* Tools Package
 * 1. time format conversion
 * 2. pixel unit conversion
 * 3. fix flash tag
 */
var Util = {
    Time: {
        parse: function(s) {
            var ms = s.split(":");
            return parseInt(ms[0]) * 60 + parseInt(ms[1]);
        },
        format: function(t) {
            var m = Math.floor(t / 60);
            var s = t - m * 60;
            m = (m < 10 ? "0" : "") + m;
            s = (s < 10 ? "0" : "") + s;
            return m + ":" + s;
        }
    },
    Unit: {
        pt2px: function(pt, dpi) {
            return Math.floor(pt * dpi / 72);
        },
        px2pt: function(px, dpi) {
            return Math.floor(px * 72 / dpi);
        },
        dp2px: function(dp, dpi) {
            /*
            Google Standard
                          density
            ldpi	120dpi	0.75
            mdpi	160dpi	1
            hdpi	240dpi	1.5
            xhdpi	320dpi	2

            1 px = 1dp * density
            */
            return dp * dpi / 160;
        }
    },
    fixFlashTag: function() {
        var $ = require("jquery");
        // fix flash tags
        while ($('P[ALIGN]')
            .length > 0) {
            $('P[ALIGN]')
                .replaceWith(function() {
                    var tag = $(this);
                    return $("<p/>")
                        .html(tag.html())
                        .css({
                            "text-align": tag.attr("ALIGN")
                                .toLowerCase(),
                            "margin": "0px",
                            "padding": "0px",
                            "border-width": "0px"
                        });
                });
        }
        while ($("FONT")
            .length > 0) {
            $(".StaticText FONT")
                .replaceWith(function() {
                    var tag = $(this);
                    var txtfmt = tag.parent("TEXTFORMAT");
                    return $("<span/>") //create new span
                        .html(tag.html()) //set html of the new span with what was in font tag
                        .css({
                            "color": tag.attr("COLOR"),
                            "font-size": tag.attr("SIZE") + "pt", // pt?
                            "letter-spacing": tag.attr("LETTERSPACING"),
                            "font-family": tag.attr("FACE"),
                            "line-height": parseInt(tag.attr("SIZE")) + parseInt(
                                txtfmt ?
                                txtfmt : "0") + "pt", // line-height = font-size + leading
                            "word-break:": "normal",
                            "white-space": "nowrap",
                            "word-wrap": "normal",
                            "overflow-wrap": "normal"
                        });
                });
            $(".ScrollText FONT")
                .replaceWith(function() {
                    var tag = $(this);
                    var txtfmt = tag.parent("TEXTFORMAT");
                    return $("<span/>") //create new span
                        .html(tag.html()) //set html of the new span with what was in font tag
                        .css({
                            "color": tag.attr("COLOR"),
                            "font-size": tag.attr("SIZE") + "pt", // pt?
                            "letter-spacing": tag.attr("LETTERSPACING"),
                            "font-family": tag.attr("FACE"),
                            "line-height": parseInt(tag.attr("SIZE")) + parseInt(
                                txtfmt ?
                                txtfmt : "0") + "pt", // line-height = font-size + leading
                            "word-break:": "break-word",
                            "white-space": "nomaal",
                            "word-wrap": "break-word",
                            "overflow-wrap": "break-word"
                        });
                });
        }
        while ($('TEXTFORMAT')
            .length > 0) {
            $('TEXTFORMAT')
                .contents()
                .unwrap();
        }
        $(".ScrollText")
            .parent()
            .mCustomScrollbar({
                theme: "rounded-dots-dark",
                axis: "y"
            });
    }
};

/* Entity for Page(Slide)
 * Note: dom is a jquery object wrapping DOM node.
 */
var Page = function(idx, type, time, dom) {
    this.index = idx;
    this.type = type;
    this.time = time;
    this.dom = dom;
    this.autoPause = false;
    this.children = new Array();
}
Page.prototype = {
    addElement: function(ele) {
        this.children.push(ele);
        ele.parent = this;
    },
    hide: function() {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].hide();
        }
        this.dom.hide();
    },
    show: function(t, action) {
        var t = t || this.time;
        for (var i = 0; i < this.children.length; i++) {
            var ele = this.children[i];
            if (ele.start_t <= t && t <= ele.end_t && !ele.isVisible()) {
                ele.show(action);
            } else if ((ele.start_t > t || ele.end_t < t) && ele.isVisible()) {
                ele.hide();
            }
        }
        this.dom.show();
    }
};

/* Elements Entity on Page(Slide)
 * TODO: implement effects (twinkle, etc.)
 */
var Element = function(start_t, end_t, type, dom) {
    this.start_t = start_t;
    this.end_t = end_t;
    this.type = type;
    this.dom = dom;
    this.parent = null;
}
Element.prototype = {
    show: function(action) {
        if (this.type == "timer") {
            action("pause");
        } else {
            if (this.dom) {
                this.dom.show();
            }
        }
    },
    hide: function() {
        if (this.type != "timer") {
            if (this.dom) {
                this.dom.hide();
            }
            if (this.type == "audio") {
                var sound = this.dom.find('audio')[0];
                sound.pause();
                sound.currentTime = 0;
            }
        }
    },
    isVisible: function() {
        if (this.type == "timer") {
            return false;
        } else {
            if (this.dom) {
                return this.dom.is(":visible");
            }
        }
    }
}


/* Convert page node in XML data to Page entity
 */
var ParsePage = function() {
    var lastPageTime = 0;
    var general = function(page, dom, start_t, end_t, p) {
        if (!$.isArray(page.ele)) { // change into only one form
            var e = page.ele;
            page.ele = new Array();
            page.ele.push(e);
        }
        for (var j = 0, len2 = page.ele.length; j < len2; j++) {
            var e = page.ele[j];
            if (e.$.type == "timer") {
                start_tt = end_tt = Util.Time.parse(e.$.stop) + parseInt(e.$.delay);
                p.addElement(new Element(start_tt, end_tt, e._type, null));
                continue;
            }
            var d = Dom.createElement(e, dom);
            var start_tt = start_t,
                end_tt = end_t;
            if (e.$.effFlag == "true") {
                if (e.$.startEffTime != "" && Util.Time.parse(e.$.startEffTime) !=
                    0) {
                    start_tt = Util.Time.parse(e.$.startEffTime);
                }
                if (e.$.endEffTime != "" && Util.Time.parse(e.$.endEffTime) != 0) {
                    end_tt = Util.Time.parse(e.$.endEffTime);
                }
            }
            var Ele = new Element(start_tt, end_tt, e._type, d);
            p.addElement(Ele);
        }
    };
    var choicePage = function(page, dom, start_t, end_t, p) {

    };
    var answerPage = function(page, dom) {

    };
    return function(page, slideFrame, zoom) {
        var dom = Dom.createPage(page, slideFrame);
        var start_t = lastPageTime;
        var end_t = Util.Time.parse(page.$.timeStamp);
        lastPageTime = end_t;
        var p = new Page(parseInt(page.$.pageIndex), page.$.pageType,
            start_t, dom);
        switch (page.$.pageType) {
            case "0":
                general(page, dom, start_t, end_t, p);
                break;
            case "100":
                lastPageTime = end_t = start_t;
                choicePage(page, dom, start_t, end_t, p);
                break;
            default:
        }
        return p;
    };
}();

/* create dom node for page or element
 *
 */
var Dom = {
    settings: {
        imagePath: "",
        dataPath: "",
    },
    getScrollBarWidth: function() {
        var $outer = $('<div>')
            .css({
                visibility: 'hidden',
                width: 100,
                overflow: 'scroll'
            })
            .appendTo('body'),
            widthWithScroll = $('<div>')
            .css({
                width: '100%'
            })
            .appendTo($outer)
            .outerWidth();
        $outer.remove();
        return 100 - widthWithScroll;
    },
    createPage: function(page, parent) {
        return $("<div />")
            .attr("id", "page-" + page.$.pageIndex)
            .css({
                margin: "0px",
                padding: "0px",
                border: "0px",
                position: "absolute",
                backgroundColor: "#fff"
            })
            .appendTo(parent)
            .hide();
    },
    createElement: function(ele, parent) {
        var elebox = $("<div />")
            .css({
                "margin": "0px",
                "padding": "0px",
                "border-width": "0px",
                "position": "absolute",
                "top": Util.Unit.dp2px(parseFloat(ele.$.y), 240) + "px",
                "left": Util.Unit.dp2px(parseFloat(ele.$.x), 240) + "px",
                "width": Util.Unit.dp2px(parseFloat(ele.$.width), 240) + "px",
                "height": Util.Unit.dp2px(parseFloat(ele.$.height), 240) +
                    "px"
            })
            .appendTo(parent);
        var createPicture = function(ele, parent) {
            $("<img />")
                .attr("src", Dom.settings.dataPath + ele.url)
                .attr("width", Util.Unit.dp2px(parseFloat(ele.$.width), 240))
                .attr("height", Util.Unit.dp2px(parseFloat(ele.$.height), 240))
                .appendTo(parent.attr("id", ele.url));
        };
        var createWordArt = function(ele, parent) {
            $("<img />")
                .attr("src", Dom.settings.dataPath + ele.releaseUrl)
                .attr("width", Util.Unit.dp2px(parseFloat(ele.$.width), 240))
                .attr("height", Util.Unit.dp2px(parseFloat(ele.$.height), 240))
                .appendTo(parent.attr("id", ele.releaseUrl));
        };
        var createText = function(ele, parent) {
            $("<div />")
                .html(ele.content.replace("{user}", localStorage.user || ""))
                .addClass("StaticText")
                .css({
                    "margin": "0px",
                    "padding": "0px",
                    "border-width": "0px"
                })
                .appendTo(parent);
        };
        var createTextArea = function(ele, parent) {
            $("<div />")
                .html(ele.content)
                .css({
                    "margin": "0px",
                    "padding": "0px",
                    "border-width": "0px"
                })
                .addClass("ScrollText")
                .appendTo(parent.css({
                    "overflow-wrap": "break-word",
                    "word-wrap": "break-word",
                    /*"overflow-y":(ele._scroll=="on"?"scroll":"visible")*/
                    /* replace with custom scrollbar */
                }));
        };
        var createVideo = function(ele, parent) {
            $("<video />")
                .attr("controls", "controls")
                .attr("preload", "preload")
                .html("Your browser does not support the video tag.")
                .append(
                    $("<source />")
                    .attr("src", Dom.settings.dataPath + ele.url)
                    .attr("type", "video/mp4")
                )
                .appendTo(parent);
        };
        var createAudio = function(ele, parent) {
            $("<audio />")
                .attr("controls", "controls")
                .attr("preload", "preload")
                .css("margin-left", "20px")
                .html("Your browser does not support the audio tag.")
                .append(
                    $("<source />")
                    .attr("src", Dom.settings.dataPath + ele.url)
                    .attr("type", "audio/mpeg")
                )
                .bind("stalled", function() {
                    var audio = this;
                    audio.load();
                    // Threw in these two lines for good measure.
                    audio.play();
                    audio.pause();
                })
                .appendTo(parent);
        };
        var createTimer = function(ele, parent) {
            // return null;
        };
        var createQuerstionSummary = function(ele, parent) {

        }
        switch (ele.$.type) {
            case "pic":
                createPicture(ele, elebox);
                break;
            case "wordart":
                createWordArt(ele, elebox);
                break;
            case "video":
                createVideo(ele, elebox);
                break;
            case "txt":
                createText(ele, elebox);
                break;
            case "textarea":
                createTextArea(ele, elebox);
                break;
            case "audio":
                createAudio(ele, elebox);
                break;
            case "timer":
                createTimer(ele, elebox);
                break;
            case "questionSummary":
                createQuerstionSummary(ele, elebox);
                break;
            default:
        }
        return elebox.hide();
    }
};

HJPlayer = function(settings) {
    this.settings = {
        zoom: 0.5,
        dataPath: "data/145922/291750/",
        audioFileName: "index.mp3",
        slidesData: "index.xml",
        //jplayerPath: "lib/jplayer",
        slideSize: {
            width: Util.Unit.dp2px(985, 240),
            height: Util.Unit.dp2px(625, 240)
        },
        isLocal: false,
        draggable: false,
        resizable: false
    };

    $.extend(true, this.settings, settings);

    this.questions = new Array();
    this.pages = new Array();
    this.timeline = new Array();

    this.currentPage = null;
    this.pageCount = 0;
    this.currentTime = 0;
    this.duration = 0;

    this.slideFrame = null;
    this.audioPlayer = null;

    this.layout = {
        rect: {
            position: "relative",
            left: 0,
            top: 0,
            width: 0,
            height: 0
        },
        top: {
            position: "absolute",
            left: 0,
            top: 0,
            width: 0,
            height: 0
        },
        center: {
            position: "absolute",
            left: 0,
            top: 0,
            width: 0,
            height: 0
        },
        slide: {
            position: "absolute",
            left: 0,
            top: 0,
            width: 0,
            height: 0
        },
        bottom: {
            position: "absolute",
            left: 0,
            top: 0,
            width: 0,
            height: 0
        }
    }
    this.backup = null;
    this.cache = null;
    this.init();
}

HJPlayer.prototype = {
    init: function() {
        this.audioPlayer = new jPlayerAdapter(this.settings.jplayerPath);
        this.slideFrame = $("#jquery_jplayer_1");
        this.setLayout("default");
        this.render();
        this.bindUIAction();
        if (!this.settings.isLocal) {
            this.toggleControls("openfile", "hide");
        }
        this.toggleControls("current-duration", "fit");
    },
    prepare: function() {
        Dom.settings.imagePath = "image/";
        Dom.settings.dataPath = this.settings.dataPath;
    },
    setLayout: function(type, backup) {
        switch (type) {
            case "default":
                this.setDefalutLayout();
                break;
            case "fullscreen":
                this.setFullScreenLayout(backup);
                break;
            default:
                ;
        }
    },
    restoreLayout: function() {
        this.layout = $.extend(true, {}, this.backup);
        this.backup = null;
    },
    setDefalutLayout: function() {
        var slide_w = this.settings.slideSize.width * this.settings.zoom;
        var slide_h = this.settings.slideSize.height * this.settings.zoom;
        var top_h = $("#jp_container_1 .top-gui")
            .height();
        var bottom_h = $("#jp_container_1 .bottom-gui")
            .height();
        var screen_w = $("#player")
            .width();
        var screen_h = $(window)
            .height();
        $.extend(true, this.layout, {
            rect: {
                left: (screen_w - slide_w) * 0.5,
                top: (screen_h - (top_h + slide_h + bottom_h)) * 0.5,
                width: slide_w,
                height: top_h + slide_h + bottom_h
            },
            top: {
                width: slide_w,
                height: top_h
            },
            center: {
                top: top_h,
                width: slide_w,
                height: slide_h
            },
            slide: {
                width: slide_w,
                height: slide_h
            },
            bottom: {
                top: top_h + slide_h,
                width: slide_w,
                height: bottom_h
            }
        });
    },
    setFullScreenLayout: function(backup) {
        if (backup) {
            this.backup = $.extend(true, {}, this.layout);
        }
        var screen_w = $(window)
            .width();
        var screen_h = $(window)
            .height();
        var scaleX = screen_w / this.settings.slideSize.width;
        var scaleY = screen_h / this.settings.slideSize.height;
        var scale = Math.min(scaleX, scaleY);

        var slide_w = this.settings.slideSize.width * scale;
        var slide_h = this.settings.slideSize.height * scale;

        var top_h = this.layout.top.height;
        var bottom_h = this.layout.bottom.height;

        $.extend(true, this.layout, {
            rect: {
                position: "fixed",
                left: 0,
                top: 0,
                width: screen_w,
                height: slide_h
            },
            top: {
                position: "fixed",
                left: 0,
                top: 0,
                width: screen_w,
                height: top_h
            },
            center: {
                position: "fixed",
                left: 0,
                top: 0,
                width: screen_w,
                height: screen_h
            },
            slide: {
                position: "fixed",
                left: (screen_w - slide_w) * 0.5,
                top: (screen_h - slide_h) * 0.5,
                width: slide_w,
                height: slide_h
            },
            bottom: {
                position: "fixed",
                left: 0,
                top: screen_h - bottom_h,
                width: screen_w,
                height: bottom_h
            }
        });
    },
    scaleLayout: function(scale, origin, s_layout) {
        var layout = s_layout || this.layout;

        var rect_w = layout.rect.width * scale.x;
        var rect_h = layout.rect.height * scale.y;

        var top_h = layout.top.height;
        var bottom_h = layout.bottom.height;

        var center_w = rect_w;
        var center_h = rect_h - top_h - bottom_h;

        var zoom = Math.min(center_w / layout.slide.width, center_h / layout.slide
            .height);

        var slide_w = layout.slide.width * zoom;
        var slide_h = layout.slide.height * zoom;

        $.extend(true, this.layout, {
            rect: {
                left: layout.rect.left + (layout.rect.width - rect_w) * (
                    origin.x / 100),
                top: layout.rect.top + (layout.rect.height - rect_h) * (
                    origin.y / 100),
                width: rect_w,
                height: rect_h
            },
            top: {
                width: rect_w
            },
            center: {
                width: center_w,
                height: center_h
            },
            slide: {
                top: (center_h - slide_h) * 0.5,
                left: (center_w - slide_w) * 0.5,
                width: slide_w,
                height: slide_h
            },
            bottom: {
                top: rect_h - bottom_h,
                width: rect_w
            }
        });
    },
    render: function() {
        var _this = this;
        var positionChange = function(a, b) {
            return a.left != b.left || a.top != b.top || a.position != b.position;
        }
        var sizeChange = function(a, b) {
            return a.width != b.width || a.height != b.height;
        }
        var change = function(a, b) {
            return positionChange(a, b) || sizeChange(a, b);
        }
        // if no change, avoid DOM opreations
        if (!this.cache || change(this.layout.slide, this.cache.slide)) {
            $(".reset-this")
                .css({
                    "position": this.layout.slide.position,
                    "width": this.layout.slide.width + "px",
                    "height": this.layout.slide.height + "px",
                    "left": this.layout.slide.left + "px",
                    "top": this.layout.slide.top + "px",
                    "border-width": "0px"
                });
            var scale = this.layout.slide.width / this.settings.slideSize.width;
            this.zoom(scale);
        }
        if (!this.cache || change(this.layout.rect, this.cache.rect)) {
            $("#container")
                .css({
                    "position": this.layout.rect.position,
                    "width": this.layout.rect.width + "px",
                    "height": this.layout.rect.height + "px",
                    "left": this.layout.rect.left + "px",
                    "top": this.layout.rect.top + "px"
                });
            if (!this.cache || sizeChange(this.layout.rect, this.cache.rect)) {
                $("#jp_container_1")
                    .css({
                        "position": "relative",
                        "width": this.layout.rect.width + "px",
                        "height": this.layout.rect.height + "px",
                        "left": "0px",
                        "top": "0px",
                        "background-color": "#F0FFF0",
                        "border-width": "0px"
                    });
                $("#jp_container_1 .jp-type-playlist")
                    .css({
                        "position": "relative",
                        "width": this.layout.rect.width + "px",
                        "height": this.layout.rect.height + "px",
                        "left": "0px",
                        "top": "0px",
                        "border-width": "0px",
                        "padding": "0px",
                        "margin": "0px"
                    });
                $('#container #r')
                    .height(this.layout.rect.height);
                $('#container #l')
                    .height(this.layout.rect.height);
                $('#container #t')
                    .width(this.layout.rect.width);
                $('#container #b')
                    .width(this.layout.rect.width);
            }
        }
        if (!this.cache || change(this.layout.top, this.cache.top)) {
            $(".top-gui")
                .css({
                    "position": this.layout.top.position,
                    "width": this.layout.top.width + "px",
                    "height": this.layout.top.height + "px",
                    "left": this.layout.top.left + "px",
                    "top": this.layout.top.top + "px",
                    "display": "block"
                });
        }
        if (!this.cache || change(this.layout.center, this.cache.center)) {
            $(".center-gui")
                .css({
                    "position": this.layout.center.position,
                    "width": this.layout.center.width + "px",
                    "height": this.layout.center.height + "px",
                    "left": this.layout.center.left + "px",
                    "top": this.layout.center.top + "px",
                    "border-width": "0px",
                    "padding": "0px",
                    "margin": "0px"
                });
        }
        if (!this.cache || change(this.layout.bottom, this.cache.bottom)) {
            $(".bottom-gui")
                .css({
                    "position": this.layout.bottom.position,
                    "width": this.layout.bottom.width + "px",
                    "height": this.layout.bottom.height + "px",
                    "left": this.layout.bottom.left + "px",
                    "top": this.layout.bottom.top + "px"
                });
        }
        // Firefox BUG: under fullscreen mode, position will be overrided as fixed by us.css
        if ($("#container")
            .css("position") == "fixed") {
            $("#jp_container_1")
                .css({
                    "position": "fixed",
                    "left": this.layout.rect.left + "px",
                    "top": this.layout.rect.top + "px"
                });
            $("#jp_container_1 .jp-type-playlist")
                .css({
                    "position": "fixed",
                    "left": this.layout.rect.left + "px",
                    "top": this.layout.rect.top + "px"
                });
        }
        this.cache = $.extend(true, {}, this.layout);
    },
    zoom: function(z) {
        var value = 'scale(' + z + ')';
        var pos = '0% 0%';
        this.slideFrame.css({
            'transform-origin': pos,
            '-ms-transform-origin': pos,
            /* IE 9 */
            '-moz-transform-origin': pos,
            /* Firefox */
            '-webkit-transform-origin': pos,
            /* Safari 和 Chrome */
            '-o-transform-origin': pos,

            'transform': value,
            '-ms-transform': value,
            /* IE 9 */
            '-moz-transform': value,
            /* Firefox */
            '-webkit-transform': value,
            /* Safari 和 Chrome */
            '-o-transform': value
        });
    },
    remoteLoad: function() {
        var _this = this;
        var parser = new xml2js.Parser({
            explicitArray: false
        }); // compatable with xml2json
        $.ajax({
            type: "GET",
            url: _this.settings.dataPath + _this.settings.slidesData + "?=t" +
                $.now(),
            dataType: "xml",
            success: function(xmlDoc) {
                parser.parseString(xmlDoc, function(err, result) {
                    if (!err && result) {
                        console.log(result);
                        //_this.settings.dataPath="data/"+result.pageSet.lessonInfo.classID+"/"+result.pageSet.lessonInfo.lessonID+"/";
                        _this.prepare();
                        _this.parseData(result);
                    } else {
                        console.log(err);
                    }
                });
            }
        });
    },
    localLoad: function(file) {
        var _this = this;
        var reader = new FileReader();
        reader.onload = function(event) {
            var xmlDoc = event.target.result;
            var parser = new xml2js.Parser();
            parser.parseString(xmlDoc, function(err, result) {
                result.pageSet.lessonInfo = result.pageSet.lessonInfo[0]; //fix
                _this.settings.dataPath = "data/" + result.pageSet.lessonInfo
                    .classID + "/" + result.pageSet.lessonInfo.lessonID +
                    "/";
                _this.prepare();
                _this.parseData(result);
            });
        };
        reader.readAsText(file, "UTF-8");
    },
    parseData: function(xml) {
        var _this = this;

        this.duration = parseInt(xml.pageSet.lessonInfo.totalTime);
        var pageSet = xml.pageSet.page;
        this.pageCount = pageSet.length;
        for (var i = 0; i < this.pageCount; i++) {
            var page = pageSet[i];
            this.pages.push(ParsePage(page, this.slideFrame, this.settings.zoom));
            /*
	if (page._pageType == "0") {

    } else if (page._pageType == "100") {
      if (page.ele._type == "1") { // 选择题
        var answer = parseInt(page.ele._answer);
        var option = 1;
        if (!$.isArray(page.ele.ele)) { // change into only one form
          var e = page.ele.ele;
          page.ele.ele = new Array();
          page.ele.ele.push(e);
        }
        for (var j = 0, len2 = page.ele.ele.length; j < len2; j++) {
          var e = page.ele.ele[j];
          var d = Dom.createElement(e, dom);
          var Ele = new Element(start_t, end_t, e._type, d);
          p.addElement(Ele);

          switch (e._type) {
            case "pic":
              $("<img />")
                .attr("src", "image/hjplayer_" + e.url)
                .attr("width", HJPlayer.Util.Unit.dp2px(parseFloat(e._width),
                  240))
                .attr("height", HJPlayer.Util.Unit.dp2px(parseFloat(e._height),
                  240))
                .appendTo(d.attr("id", e.url));
              break;
            case "questionTxt":
              $("<div />")
                .append($(e.content).unwrap().unwrap())
                .appendTo(d);
              break;
            case "questionTxtOption":
              var opt = $("<div />")
                .append($(e.content).unwrap().unwrap())
                .css({
                  "margin": "0px",
                  "padding": "0px",
                  "border-width": "0px",
                  "background-image": "url(image/hjplayer_ele_choice_item.9.png)"
                });
              if (answer == option) {
                opt.bind("click", function() {
                  $(this).css("background-image",
                    "url(image/hjplayer_ele_choice_item_click.9.png)").unbind();
                });
              } else {
                opt.bind("click", function() {
                  $(this).css("background-image",
                    "url(image/hjplayer_ele_choice_item_click.9.png)").unbind();
                });
              }
              opt.appendTo(d);
              option++;
              break;
            default:
          }
          d.hide();
        }
      }
    }
		*/
        }
        Util.fixFlashTag();
        $(".background")
            .removeClass("defaultscreen");
        this.audioPlayer.setDataSource(_this.settings.dataPath + _this.settings
            .audioFileName);
        this.audioPlayer.setTitle(xml.pageSet.lessonInfo.lessonName);
        this.bindUpdate();
        this.updateBySec(0);
        this.play();
    },
    // get visible Elements by page & second
    getElementSetBySec: function(page, t) {
        if (t < 0 || t > this.duration) {
            return null;
        }
        // get the page
        var pageIdx = 0;
        for (var i = 0; i < this.pageCount; i++) {
            if (t < this.pages[i].time) {
                pageIdx = i - 1;
                break;
            }
        }
        var result = new Array();
        var page = this.pages[pageIdx];
        result.push(page);
        // get Elements on Page
        for (var i = 0; i < page.children.length; i++) {
            if (page.children[i].time <= t) {
                result.push(page.children[i]);
            }
        }
        return result;
    },
    // get visible Elements by second
    getPageBySec: function(t) {
        if (t < 0 || t > this.duration) {
            return null;
        }
        var pageIdx = 0;
        for (var i = 0; i < this.pageCount; i++) {
            if (t < this.pages[i].time) {
                pageIdx = i - 1;
                break;
            }
        }
        return this.pages[pageIdx];
    },
    updateBySec: function(t) {
        var op = this.currentPage;
        var np = this.getPageBySec(t);
        if (op != null && op != np) {
            //console.log("hide page " + op.index);
            op.hide();
        }
        var _this = this;
        np.show(t, function() {
            _this.pause();
        });
        //console.log("show page " + np.index);
        this.currentPage = np;
        this.currentTime = t;
        this.updatePageNumnber(np.index);
        this.updateTimeDuration(t);
    },
    updatePageNumnber: function(index) {
        $('#jp_container_1 .jp-page-number')
            .html(index + "/" + this.pageCount);
    },
    updateTimeDuration: function(t) {
        $('#jp_container_1 .jp-current-duration')
            .html(Util.Time.format(t) + "/" + Util.Time.format(this.duration));
    },
    gotoPage: function(pIdx) {
        if (this.pageCount == 0) return; // no loaded data
        var cur_pidx = this.currentPage.index;
        var _this = this;
        if (pIdx < 0 || pIdx >= this.pageCount) {
            return null;
        }
        if (pIdx == cur_pidx) {
            this.currentPage.show(null, function() {
                _this.pause();
            });
            this.currentTime = this.currentTime.time;
            this.seekTo(this.currentTime.time);
        } else {
            var page = this.pages[pIdx - 1];
            this.currentPage.hide();
            this.currentTime = page.time;
            this.currentPage = page;
            this.seekTo(page.time);
            page.show(null, function() {
                _this.pause();
            });
        }
        this.updatePageNumnber(pIdx);
        this.updateTimeDuration(this.currentTime);
    },
    gotoNextPage: function() {
        this.gotoPage(this.currentPage.index + 1);
    },
    gotoPrevPage: function() {
        this.gotoPage(this.currentPage.index - 1);
    },
    play: function() {
        this.audioPlayer.play();
    },
    pause: function() {
        this.audioPlayer.pause();
    },
    seekTo: function(t) {
        this.audioPlayer.seek(t);
    },
    stop: function() {
        this.audioPlayer.stop();
    },
    fullscreen: function() {
        $(".jp-full-screen")
            .click(); // depends on jplayer, how to make independent ?
    },
    restore: function() {
        $(".jp-restore-screen")
            .click();
    },
    isFullScreen: function() {
        // return $(".jp-state-full-screen").length > 0;
        //if(this.settings.isLocal) return $(".jp-state-full-screen").length > 0;
        return document.webkitIsFullScreen || document.mozFullScreen ||
            document.fullscreenElement || document.msFullscreenElement;
    },
    bindUpdate: function() {
        var _this = this;
        this.audioPlayer.bind("timeupdate", function(t) { // 4Hz
            if (t == _this.currentTime) {
                return;
            } else {
                _this.updateBySec(t);
            }
        });
    },
    bindKey: function() {
        var _this = this;
        $(document.documentElement)
            .unbind("keydown")
            .keydown(function(event) {
                if (event.which === 32) {
                    if (_this.audioPlayer.isPaused()) {
                        _this.audioPlayer.play();
                    } else {
                        _this.audioPlayer.pause();
                    }
                    event.preventDefault();
                }
                if (event.which === 27) {
                    _this.fullscreen();
                    event.preventDefault();
                }
            });
    },
    bindClick: function() {
        var _this = this;
        $(".trim-space")
            .off("mousedown click")
            .on('mousedown', function(e) {
                $(this)
                    .data("initcoords", {
                        x: e.x,
                        y: e.y
                    });
            })
            .on("click", function(e) {
                var initCoords = $(this)
                    .data("initcoords") || {
                        x: 0,
                        y: 0
                    };
                if (e.x === initCoords.x && e.y === initCoords.y) {
                    if (getSelection()
                        .toString()
                        .length === 0) {
                        $this = $(this);
                        if ($this.hasClass('clicked')) {
                            $this.removeClass('clicked');
                            // double click: fullscreen/restore
                            if (_this.isFullScreen()) {
                                _this.restore();
                            } else {
                                _this.fullscreen();
                            }
                        } else {
                            $this.addClass('clicked');
                            setTimeout(function() {
                                if ($this.hasClass('clicked')) {
                                    $this.removeClass('clicked');
                                    if (!$(e.target)
                                        .is($("audio"))) {
                                        // single click: paly/pause
                                        var isPaused = _this.audioPlayer.isPaused();
                                        if (isPaused) {
                                            _this.audioPlayer.play();
                                        } else {
                                            _this.audioPlayer.pause();
                                        }
                                        return false;
                                    }
                                }
                            }, 300);
                        }
                    }
                    $(this)
                        .data('initcoords', {
                            x: -1,
                            y: -1
                        });
                }
            });
    },
    bindFullScreen: function() {
        var _this = this;
        $(document)
            .off(
                "webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange"
            )
            .on(
                "webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange",
                function(e) {
                    if (_this.isFullScreen()) {
                        _this.setLayout("fullscreen", true);
                        _this.render();
                        $(window)
                            .unbind("resize")
                            .resize(function() {
                                if (_this.isFullScreen()) {
                                    _this.setLayout("fullscreen", false);
                                    _this.render();
                                }
                            });
                    } else {
                        $(window)
                            .unbind("resize");
                        _this.restoreLayout();
                        _this.render();
                    }
                });
    },
    bindCustomButton: function() {
        var _this = this;
        $("#jp_container_1 .jp-next")
            .unbind("click")
            .bind("click", function() {
                _this.gotoNextPage();
            });
        $("#jp_container_1 .jp-previous")
            .unbind("click")
            .bind("click", function() {
                _this.gotoPrevPage();
            });
    },
    bindDrag: function() {
        var _this = this;
        var target = $('#container');
        $("#container")
            .off("mousedown", "#title")
            .on('mousedown', '#title', function(e) {
                var offset = target.offset();
                var posix = {
                    'x': e.pageX,
                    'y': e.pageY
                };
                $.extend(document, {
                    'move': true,
                    'move_target': target,
                    "call_down": function(e) {
                        var target = document.move_target;
                        _this.layout.rect.left = offset.left + e.pageX - posix.x;
                        _this.layout.rect.top = offset.top + e.pageY - posix.y;
                        target.css({
                            left: _this.layout.rect.left + "px",
                            top: _this.layout.rect.top + "px"
                        });
                    }
                });
            });
    },
    bindReszie: function() {
        var _this = this;
        $("#container")
            .off("mousedown", '#l, #r, #t, #b, #lt, #rt, #lb, #rb')
            .on('mousedown', '#l, #r, #t, #b, #lt, #rt, #lb, #rb', function(e) {
                var ele = $(this);
                if (ele.setCapture) {
                    ele.setCapture();
                } else if (window.captureEvents) {
                    window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
                }
                var posix = {
                    'x': e.pageX,
                    'y': e.pageY
                };
                var layout = $.extend(true, {}, _this.layout);
                var opt = (function() {
                    var data = {
                        "#l": [-1, 0, 100, 50],
                        "#r": [1, 0, 0, 50],
                        "#t": [0, -1, 50, 100],
                        "#b": [0, 1, 50, 0],
                        "#lt": [-1, -1, 100, 100],
                        "#rt": [1, -1, 0, 100],
                        "#lb": [-1, 0, 100, 0],
                        "#rb": [1, 1, 0, 0]
                    };
                    for (var p in data) {
                        if (ele.is($(p))) {
                            return data[p];
                        }
                    }
                    return [];
                })();
                var transform = function(e) {
                    var scale = {
                        x: (opt[0] * (e.pageX - posix.x) + layout.rect.width) /
                            layout.rect.width,
                        y: (opt[1] * (e.pageY - posix.y) + layout.rect.height) /
                            layout.rect.height
                    };
                    var origin = {
                        x: opt[2],
                        y: opt[3]
                    };
                    _this.scaleLayout(scale, origin, layout);
                    _this.render();
                }
                $.extend(document, {
                    'move': true,
                    'call_down': function(e) {
                        transform(e);
                    },
                    "call_up": function(e) {
                        transform(e);
                        if (ele.releaseCapture) {
                            ele.releaseCapture();
                        } else if (window.captureEvents) {
                            window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
                        }
                        e.cancelBubble = true;
                    }
                });
                return false;
            });
    },
    bindUIAction: function() {
        this.bindUpdate();
        this.bindKey();
        this.bindClick();
        this.bindFullScreen();
        this.bindCustomButton();
        if (this.settings.draggable || this.settings.resizable) {
            this.prepareMouseListener();
            if (this.settings.draggable) {
                this.bindDrag();
            }
            if (this.settings.resizable) {
                this.bindReszie();
            }
        } else {
            if (!this.settings.draggable) {
                $("#title")
                    .css({
                        'cursor': 'default'
                    });
            }
            if (!this.settings.resizable) {
                $('#l, #r, #t, #b, #lt, #rt, #lb, #rb')
                    .css({
                        'cursor': 'default'
                    });
            }
        }
    },
    toggleControls: function(controls, opt) {
        if (opt == "hide") {
            switch (controls) {
                case "openfile":
                    $("#file")
                        .attr("disabled", "disabled");
                    $(".file")
                        .parent()
                        .hide();
                    $(".jp-previous")
                        .css("left", "10px");
                    $(".jp-play")
                        .css("left", "50px");
                    $(".jp-pause")
                        .css("left", "50px");
                    $(".jp-next")
                        .css("left", "100px");
                    $(".jp-page-number")
                        .css("left", "155px");
                    break;
                default:
                    ;
            }
        } else if (opt == "fit") {
            switch (controls) {
                case "current-duration":
                    var full = $(".jp-full-screen")
                        .is(":visible");
                    var volume = $(".jp-volume-bar")
                        .is(":visible");
                    if (!full && !volume) {
                        $(".jp-current-duration")
                            .css({
                                "right": "12px"
                            });
                    } else if (!volume) {
                        $(".jp-current-duration")
                            .css({
                                "right": "42px"
                            });
                    }
                    break;
                default:
                    ;
            }
        }
    },
    prepareResize: function() {

    },
    prepareMouseListener: function() {
        $(document)
            .unbind("mousemove, mouseup")
            .mousemove(function(e) {
                if (!!this.move) {
                    var posix = !document.move_target ? {
                            'x': 0,
                            'y': 0
                        } : document.move_target.posix,
                        callback = document.call_down || function() {};
                    callback.call(this, e, posix);
                }
            })
            .mouseup(function(e) {
                if (!!this.move) {
                    var callback = document.call_up || function() {};
                    callback.call(this, e);
                    $.extend(this, {
                        'move': false,
                        'move_target': null,
                        'call_down': false,
                        'call_up': false
                    });
                }
            });
    },
    reset: function() {
        this.audioPlayer.destroy();
        this.questions = new Array();
        this.pages = new Array();
        this.timeline = new Array();

        this.currentPage = null;
        this.pageCount = 0;
        this.currentTime = 0;
        this.duration = 0;

        this.backup == null;
        this.settings.dataPath = "";
        this.audioPlayer = new jPlayerAdapter(this.settings.jplayerPath);
        this.slideFrame = $("#jquery_jplayer_1");
        this.bindUIAction();
    }
};
