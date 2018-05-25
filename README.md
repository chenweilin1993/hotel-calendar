# hotel-calendar
仿美团酒店日历选择插件
> 匆忙中写的插件，还有许多不足之处，还请各位大神多多指正。

可以自定义设置开始时间与结束时间

参数说明
```javascript
$.fn.calendarSwitch.defaults = {
        selectors: {
            sections: "#calendar"
        },
        index: 3, //展示的月份个数
        animateFunction: "toggle",//动画效果
        controlDay: false, //知否控制在daysNumber天之内，这个数值的设置前提是总显示天数大于90天
        daysNumber: "90", //控制天数
        startDay: "", // 初始化开始时间
        endDay: "", // 初始化结束时间
        comeColor: "#e4a766", //入住颜色
        outColor: "#e4a766", //离店颜色
        comeOutColor: "rgba(228,167,102,.5)", //入住和离店之间的颜色
        lockStartDay: false, // 锁定开始时间
        callback: "", //回调函数
        confirmBtn: '.confirm' //确定按钮的class或者id
    }
```
