(function($) {
    "use strict";
    var years = {
        leap: [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        ordinary: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    }

    var calendarSwitch = (function() {
        function calendarSwitch(element, options) {
            var me = this
            me.settings = $.extend(true, $.fn.calendarSwitch.defaults, options || {})
            me.element = element
            me.selectors = me.settings.selectors
            me.sections = me.selectors.sections
            me.index = Math.ceil(me.settings.index) || 1 // 展示的月份个数
            me.animateFunction = me.settings.animateFunction // 动画效果
            me.controlDay = me.settings.controlDay // 知否控制在daysNumber天之内，这个数值的设置前提是总显示天数大于90天
            me.daysNumber = Math.ceil(me.settings.daysNumber) || 1 // 控制显示有效天数
            me.startDay = me.settings.startDay // 初始化开始时间
            me.endDay = me.settings.endDay // 初始化结束时间
            me.lockStartDay = me.settings.lockStartDay // 初始化结束时间
            me.comeColor = me.settings.comeColor // 入住颜色
            me.outColor = me.settings.outColor // 离店颜色
            me.comeOutColor = me.settings.comeOutColor // 入住和离店之间的颜色
            me.callback = me.settings.callback // 回调函数
            me.confirm = me.settings.confirmBtn // 确定按钮的class或者id
            me.calendarStartDate = '' // 日历中开始时间
            me.calendarStartIndex = '' // 日历中开始时间在td中的索引
            me.calendarEndDate = '' // 日历中结束时间
            me.calendarEndIndex = '' // 日历中结束时间在td中的索引
            me.calendarDays = '' // 日历中所属天数
            me.init()
        }
        calendarSwitch.prototype = {
            /**
             * 插件初始化
             */
            init: function() {
                var me = this
                // 创建日历头部
                var html = "<table class='dateZone'><tr><td class='colo'>日</td><td>一</td><td>二</td><td>三</td><td>四</td><td>五</td><td class='colo'>六</td></tr></table>" + "<div class='tbody'></div>"
                $(me.sections).append(html)
                // 绘制显示月份数量
                for (var q = 0; q < me.index; q++) {
                    $(me.sections).find(".tbody").append("<p class='ny1'></p><table class='dateTable'></table>")
                    // 获取当前时间，如果存在开始时间，取开始时间
                    var currentDate = !me.startDay ? new Date() : new Date(me.startDay)
                    // 将月份设置到每月1号，防止当前为31号而下月无31号bug
                    currentDate.setMonth(currentDate.getMonth() + q, 1)
                    // 获取当前时间的年份
                    var currentYear = currentDate.getFullYear(),
                        // 获取当前时间的月份
                        currentMonth = currentDate.getMonth(),
                        // 重组当前时间（年-月-日）至当月1号
                        setCurrentDate = new Date(currentYear, currentMonth, 1),
                        // 获取每月1号为星期几
                        firstDay = setCurrentDate.getDay(),
                        // 获取每月天数
                        DaysInMonth = me._isLeapYear(currentYear) ? years.leap : years.ordinary,
                        // 获取td数量
                        Ntd = firstDay + DaysInMonth[currentMonth],
                        // 计算tr数量
                        Ntr = Math.ceil(Ntd / 7),
                        // 当前月份
                        nowMonth = me._complement(currentMonth + 1)
                    $(me.sections).find('.ny1').eq(q).text(currentYear + '年' + nowMonth + '月')
                    // 循环创建tr, td
                    for (var i = 0; i < Ntr; i++) {
                        $(me.sections).find('.dateTable').eq(q).append('<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>')
                    }

                    var arrTd = $(me.sections).find('.dateTable').eq(q).find('td')
                    // 动态给td赋值日期
                    for (var m = 0; m < DaysInMonth[currentMonth]; m++) {
                        arrTd.eq(firstDay++).text(me._complement(m + 1))
                    }
                }
                me._initSelected()
            },
            /**
             * 初始化选中
             * @private
             */
            _initSelected: function() {
                var me = this,
                    // 设置开始时间，如果不存在开始时间，则取当前时间
                    currentDate = !me.startDay ? new Date() : new Date(me.startDay),
                    // 设置结束时间，如果不存在设置时间，则取开始时间的后一天
                    endDate = !me.endDay ? new Date(currentDate.getTime() + 24 * 3600 * 1000) : new Date(me.endDay),
                    // 获取已渲染日期的td
                    tdDays = $(me.sections).find('.dateTable').find('td'),
                    // 存放日历中所以天数的td
                    hasDaysArr = [],
                    // 存放日历中有效天数的td
                    effectiveDaysArr = []
                // 如果当前时间大于用户设置的开始时间，则以当前时间为准
                if((new Date(me._formatTime(new Date(),'{y}/{m}/{d}'))).getTime() > (new Date(me._formatTime(currentDate,'{y}/{m}/{d}'))).getTime()) {
                    currentDate = new Date()
                    endDate = !me.endDay ? new Date(currentDate.getTime() + 24 * 3600 * 1000) : new Date(me.endDay)
                }
                me.calendarStartDate = me._formatTime(currentDate, "{y}-{m}-{d}")
                me.calendarEndDate = me._formatTime(endDate, "{y}-{m}-{d}")
                me.calendarDays = me._getOffsetDays(me.calendarEndDate, me.calendarStartDate)
                // 如果用户开启了设置有效时间，并且有效时间小于计算出的入住天数，重置离店时间
                if(me.controlDay && me.calendarDays > me.daysNumber) {
                    endDate = new Date(currentDate.getTime() + 24 * 3600 * 1000 * me.daysNumber)
                    me.calendarEndDate = me._formatTime(endDate, "{y}-{m}-{d}")
                    me.calendarDays = me._getOffsetDays(me.calendarEndDate, me.calendarStartDate)
                }
                tdDays.each(function (i, item) {
                    // 日期有效存入
                    if($(item).text() !== '') {
                        hasDaysArr.push(item)
                    }
                    var yearMonthText = $(item).parent('tr').parent('tbody').parent('table.dateTable').prev('p.ny1').text()
                    // 在日历上显示入住
                    if(yearMonthText === me._formatTime(currentDate, "{y}年{m}月")
                    && me._formatTime(currentDate, "{d}") === $(item).text()) {
                        me.calendarStartIndex = i
                        $(item).append('</br><p class="rz">入住</p>')
                    }
                    // 在日历上显示离店
                    if(yearMonthText === me._formatTime(endDate, "{y}年{m}月")
                        && me._formatTime(endDate, "{d}") === $(item).text()) {
                        me.calendarEndIndex = i
                        $(item).append('</br><p class="rz">离店</p>')
                        $(item).append('<span class="hover lidian_hover">共' + me.calendarDays + '晚</span>')
                    }

                })
                // 给回调函数传值
                me._callback({
                    start: me.calendarStartDate,
                    end: me.calendarEndDate,
                    day: me.calendarDays
                })

                me._checkColor()
                // 如果未开启锁定开始日期，将可选择开始时间设为今天
                if(!me.lockStartDay) {
                    currentDate = new Date()
                }
                // 设置当前日期之前的日期无效
                for (var i = 0; i < Number(me._formatTime(currentDate, "{d}")) - 1; i++) {
                    $(hasDaysArr[i]).css('color', '#ccc')
                }
                // 控制是否根据天数显示
                if (me.controlDay) {
                    //可以在这里添加限制天数的条件
                    for (var i = Number(me._formatTime(currentDate, "{d}")) - 1; i < (Number(me._formatTime(currentDate, "{d}")) + me.daysNumber); i++) {
                        // 校验有效日期
                        if(hasDaysArr[i] !== '' && hasDaysArr[i] !== null && hasDaysArr[i] !== undefined) {
                            effectiveDaysArr.push(hasDaysArr[i])
                        }
                    }
                    // 日历中超出限制天数标记灰色
                    for (var i = (Number(me._formatTime(currentDate, "{d}")) + me.daysNumber); i < hasDaysArr.length; i++) {
                        if(hasDaysArr[i] !== '' && hasDaysArr[i] !== null && hasDaysArr[i] !== undefined) {
                            $(hasDaysArr[i]).css('color', '#ccc')
                        }
                    }
                }else {
                    for (var i = Number(me._formatTime(currentDate, "{d}")) - 1; i < hasDaysArr.length; i++) {
                        if(hasDaysArr[i] !== '' && hasDaysArr[i] !== null && hasDaysArr[i] !== undefined) {
                            effectiveDaysArr.push(hasDaysArr[i])
                        }
                    }
                }
                me._selectDate(effectiveDaysArr)
            },
            /**
             * 日历点击事件
             * @param effectiveDaysArr 有效天数
             * @return {boolean}
             * @private
             */
            _selectDate: function( effectiveDaysArr ) {
                var me = this,
                    arr = effectiveDaysArr || [],
                    tdDays = $(me.sections).find('.dateTable').find('td'),
                    start = '', // 开始时间
                    startIndex = '', // 开始时间在数组中的索引
                    end = '', // 结束时间
                    endIndex = '', // 结束数据在数组中索引
                    flag = 1

                // 如果有效日期长度不足1，则不往下走
                if(arr.length < 0) return false

                $(arr).on('click', function ( event ) {
                    event = event || window.event
                    event.stopPropagation()
                    // 如果锁定开始时间
                    if(me.lockStartDay) {
                        flag = 2
                        start = me.calendarStartDate
                        startIndex = me.calendarStartIndex
                    }
                    // 当前点击日期
                    var clickDate = $(this).parent('tr').parent('tbody').parent('table.dateTable').prev('p.ny1').text() +
                        $(this).clone().children().remove().end().text() + '日',
                        // 当前点击在数组中的索引
                        index = tdDays.index($(this))
                    clickDate = me._formatTime(clickDate,"{y}-{m}-{d}")
                    // 第一次点击
                    if(flag === 1) {
                        start = clickDate
                        startIndex = index
                        flag = 2
                    }else if(flag === 2) {
                        // 第二次点击
                        end = clickDate
                        endIndex = index
                        flag = 1
                    }
                    // 如果开始时间大于结束数据，重置开始时间选择
                    if(startIndex >= endIndex) {
                        // 入住点击
                        start = clickDate
                        startIndex = index
                        end = ''
                        endIndex = ''
                        // 多次点击时清空上一轮数据
                        me._setCommonVal({
                            start: start,
                            startIndex: startIndex,
                            end: end,
                            endIndex: endIndex
                        })
                        me._calendarClick(this, 1)
                        flag = 2
                    }else {
                        // 离店点击
                        me._setCommonVal({
                            start: start,
                            startIndex: startIndex,
                            end: end,
                            endIndex: endIndex
                        })
                        me._calendarClick(this, 2)
                        // 完成一轮操作后重置数据
                        start = ''
                        startIndex = ''
                        end = ''
                        endIndex = ''
                        flag = 1
                        me._callback({
                            start: me.calendarStartDate,
                            end: me.calendarEndDate,
                            day: me.calendarDays
                        })
                    }
                    me._checkColor()
                })
            },
            /**
             * 设置日历中选中样式
             * @private
             */
            _checkColor: function() {
                var me = this,
                    start = me.calendarStartIndex,
                    end = me.calendarEndIndex,
                    tdDays = $(me.sections).find('.dateTable').find('td')
                // 设置入店样式，离店样式，以及中间显示的样式
                tdDays.each(function (i ,item) {
                    var setBgColor = '#fff',
                        setFontColor = '#fff'
                    // 设置入住背景色
                    if($(item).find('.rz').text() === "入住") {
                        setBgColor = me.comeColor
                    // 设置离店背景色
                    }else if($(item).find('.rz').text() === "离店") {
                        setBgColor = me.outColor
                    // 设置入住与离店之间颜色
                    }else if(i > start && i < end) {
                        setBgColor = me.comeOutColor
                        setFontColor = '#333'
                    }else {
                        setFontColor = '#333'
                    }
                    // 重置有效日期颜色
                    if($(item).css('color') !== 'rgb(51, 51, 51)') {
                        $(item).css({
                            'background': '#fff',
                        })
                    }
                    // 设置有效日期背景色与文字颜色
                    if($(item).text() !== '' && $(item).css('color') !== 'rgb(204, 204, 204)') {
                        $(item).css({
                            'background': setBgColor,
                            'color': setFontColor
                        })
                    }
                })
            },
            /**
             * 回调函数
             * @param param
             * @private
             */
            _callback: function(param) {
                var me = this
                if (me.settings.callback && $.type(me.settings.callback) === "function") {
                    me.settings.callback(param)
                }
            },
            /**
             * 设置公告变量
             * @param param
             * @private
             */
            _setCommonVal: function ( param ) {
                var me = this
                me.calendarStartDate = param.start
                me.calendarStartIndex = param.startIndex
                me.calendarEndDate = param.end
                me.calendarEndIndex = param.endIndex
                // 判断日期是否有效
                if(me.calendarEndDate !== '' && me.calendarStartDate !== '') {
                    me.calendarDays = me._getOffsetDays(me.calendarEndDate, me.calendarStartDate)
                }else {
                    me.calendarDays = ''
                }
            },
            /**
             * 日历中单个td点击事件
             * @param obj 当前点击的td
             * @param type 点击次数，1->第一次，2->第二次
             * @return {boolean}
             * @private
             */
            _calendarClick: function ( obj, type ) {
                var me = this
                if(!obj) return false
                type = type || 1
                var text = ''
                if(type === 1) {
                    me._clearClass()
                    text = '入住'
                    $(obj).append('<span class="hover ruzhu_hover">选择离店日期</span>')
                }else {
                    if(me.lockStartDay) {
                        var tdDays = $(me.sections).find('.dateTable').find('td')
                        tdDays.each(function (i, item) {
                            if($(item).find('.rz').text() === "离店") {
                                $(item).find('.hover').remove()
                                $(item).find('p').remove('.rz')
                                $(item).find('br').remove()
                            }
                        })
                    }
                    text = '离店'
                    $(me.sections).find('span.ruzhu_hover').remove()
                    $(obj).append('<span class="hover lidian_hover">共'+ me.calendarDays +'晚</p></span>')
                }
                $(obj).append('<p class="rz">'+ text +'</p>')

            },
            /**
             * 清除页面无效显示
             * @private
             */
            _clearClass: function () {
                var me = this
                $(me.sections).find('.hover').remove()
                $(me.sections).find('.dateTable').find('p').remove('.rz')
                $(me.sections).find('.dateTable').find('br').remove()
            },
            /**
             * 根据开始时间与结束时间获取天数
             * @param start
             * @param end
             * @return {number}
             * @private
             */
            _getOffsetDays: function (start, end) {
                start = this._formatTime(start, "{y}/{m}/{d}")
                end = this._formatTime(end, "{y}/{m}/{d}")
                var offsetTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
                return Math.floor(offsetTime / (3600 * 24 * 1e3)) === 0 ? 1 : Math.floor(offsetTime / (3600 * 24 * 1e3));
            },
            /**
             * 补0
             * @param num
             * @return {*}
             * @private
             */
            _complement: function (num) {
                num = Number(num)
                return num < 10 ? '0' + num : num;
            },
            /**
             * 判断是否闰年
             * @param year
             * @return {boolean}
             * @private
             */
            _isLeapYear: function(year) {
                return (year % 4 === 0) && (year % 100 !== 0 || year % 400 === 0)
            },
            /**
             * 格式化时间
             * @param time 时间
             * @param cFormat 格式
             * @return {*}
             * @private
             */
            _formatTime: function (time, cFormat) {
                if (arguments.length === 0 || !time) {
                    return null
                }
                if ( /^[0-9]*$/.test(time) && (time + '').length === 10) {
                    time = +time * 1000
                }
                var format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}',
                    date
                if (typeof time === 'object') {
                    date = time
                } else {
                    time = time.replace(/\-/g, "/")
                        .replace(/\年/g, "/")
                        .replace(/\月/g, "/")
                        .replace(/\日/g, "")
                    date = new Date(time)
                }
                var formatObj = {
                    y: date.getFullYear(),
                    m: date.getMonth() + 1,
                    d: date.getDate(),
                    h: date.getHours(),
                    i: date.getMinutes(),
                    s: date.getSeconds(),
                    a: date.getDay()
                }
                var time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, function(result, key) {
                    var value = formatObj[key]
                    if (key === 'a') return ['一', '二', '三', '四', '五', '六', '日'][value - 1]
                    if (result.length > 0 && value < 10) {
                        value = '0' + value
                    }
                    return value || 0
                })
                return time_str
            }

        }
        return calendarSwitch
    })()

    $.fn.calendarSwitch = function(options) {
        return this.each(function() {
            var me = $(this),
                instance = me.data("calendarSwitch")
            if (!instance) {
                me.data("calendarSwitch", (instance = new calendarSwitch(me, options)))
            }
            if ($.type(options) === "string") return instance[options]()
        })
    }
    // 设置默认参数
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
})(jQuery)