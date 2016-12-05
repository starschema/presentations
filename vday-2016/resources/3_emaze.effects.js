/*******************************************/
/*****                                 *****/
/*****       Effects For EMAZE         *****/
/*****         www.emaze.com           *****/
/*****                                 *****/
/*******************************************/

/*******************************************/
/*****                                 *****/
/*****      Parallax Effect            *****/
/*****                                 *****/
/*******************************************/

(function ($, window, document, underfined) {


    (function () {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
              || window[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function (callback) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function () { callback(currTime + timeToCall); },
                  timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
    }());


    function Parallax(element, options) {

        var self = this;

        if (typeof options == 'object') {
            delete options.refresh;
            delete options.render;
            $.extend(this, options);
        }

        this.$element = $(element);

        if (!this.imageSrc && this.$element.is('img')) {
            this.imageSrc = this.$element.attr('src');
        }

        /*     Currently this doesn't use    */

        //var positions = (this.position + '').toLowerCase().match(/\S+/g) || [];

        //if (positions.length < 1) {
        //    positions.push('center');
        //}
        //if (positions.length == 1) {
        //    positions.push(positions[0]);
        //}

        //if (positions[0] == 'top' || positions[0] == 'bottom' || positions[1] == 'left' || positions[1] == 'right') {
        //    positions = [positions[1], positions[0]];
        //}

        //if (this.positionX != undefined) positions[0] = this.positionX.toLowerCase();
        //if (this.positionY != undefined) positions[1] = this.positionY.toLowerCase();

        //self.positionX = positions[0];
        //self.positionY = positions[1];

        //if (this.positionX != 'left' && this.positionX != 'right') {
        //    if (isNaN(parseInt(this.positionX))) {
        //        this.positionX = 'center';
        //    } else {
        //        this.positionX = parseInt(this.positionX);
        //    }
        //}

        //if (this.positionY != 'top' && this.positionY != 'bottom') {
        //    if (isNaN(parseInt(this.positionY))) {
        //        this.positionY = 'center';
        //    } else {
        //        this.positionY = parseInt(this.positionY);
        //    }
        //}

        //this.position =
        //  this.positionX + (isNaN(this.positionX) ? '' : 'px') + ' ' +
        //  this.positionY + (isNaN(this.positionY) ? '' : 'px');
        /*  ======= END ========    */

        this.$mirror = $('<div />').prependTo($('.current-active-slide'));

        this.baseElementOuterWidth = this.$element.outerWidth();
        this.baseElementOuterHeight = this.$element.outerHeight();

        var slider = this.$element.find('>.parallax-slider');
        var sliderExisted = false;
        if (slider.length == 0)
            this.$slider = $('<img />').prependTo(this.$mirror);
        else {
            if (slider.is('video')) {
                slider.attr("muted", "true");
            }
            this.$slider = slider.prependTo(this.$mirror);
            sliderExisted = true;
        }

        this.$mirror.addClass('parallax-mirror').css({
            visibility: 'hidden',
            zIndex: parseInt(this.$element.css("z-index")) || this.zIndex,
            position: 'fixed',
            top: 0,
            left: 0,
            overflow: 'hidden'
        });


        function onLoadImage(img) {
            if (!self.naturalHeight || !self.naturalWidth) {
                self.naturalHeight = img.naturalHeight || img.videoHeight || img.height || 1;
                self.naturalWidth = img.naturalWidth || img.videoWidth || img.width || 1;
            }
            // wait when image or video gets natural width and hight
            // because we need a correct aspect ratio if  media
            if (img.tagName.toLowerCase() != "video" && (img.naturalHeight < 20 || img.naturalWidth < 20)) {
                self.naturalHeight = self.naturalWidth = 0;
                setTimeout(function () { onLoadImage(img); }, 30);
                return;
            } else if (img.tagName.toLowerCase() == "video" && (img.videoHeight < 20 || img.videoWidth < 20)) {
                self.naturalHeight = self.naturalWidth = 0;
                setTimeout(function () { onLoadImage(img); }, 30);
                return;
            }
            self.aspectRatio = self.naturalWidth / self.naturalHeight;
            if (options.emParallax == "fixed") {
                self.speed = 0;
            }
            Parallax.isSetup || Parallax.setup();
            Parallax.sliders.push(self);
            Parallax.isFresh = false;
            Parallax.requestRender();
        }

        this.$slider.addClass('parallax-slider').one('load', function () { onLoadImage(this); });

        if (!sliderExisted)
            this.$slider[0].src = this.imageSrc;
        //When change slide and image loaded, loading image event doesn't run and we need to run it with force
        if (this.naturalHeight && this.naturalWidth || this.$slider[0].complete || slider.length > 0) {
            this.$slider.trigger('load');
        }
        return this;
    };

    // Parallax Instance Methods

    $.extend(Parallax.prototype, {
        speed: 0.2,
        bleed: 0,
        zIndex: -100,
        iosFix: true,
        androidFix: true,
        position: 'center',
        overScrollFix: false,

        refresh: function () {
            this.boxWidth = this.$element.width() != 0 ? this.$element.outerWidth() : this.baseElementOuterWidth;
            this.boxHeight = (this.$element.height() != 0 ? this.$element.outerHeight() : this.baseElementOuterHeight) + this.bleed * 2;
            this.boxOffsetTop = (this.$element.offset().top - Parallax.winOffsetTop + Parallax.winTop * Parallax.scaleFactor) / Parallax.scaleFactor - this.bleed;
            this.boxOffsetLeft = (this.$element.offset().left - Parallax.winOffsetLeft) / Parallax.scaleFactor;
            this.boxOffsetBottom = this.boxOffsetTop + this.boxHeight;

            var winHeight = Parallax.winHeight;
            var docHeight = Parallax.docHeight;
            var maxOffset = Math.min(this.boxOffsetTop, docHeight - winHeight);
            var minOffset = Math.max(this.boxOffsetTop + this.boxHeight - winHeight, 0);
            var imageHeightMin = this.boxHeight + (maxOffset - minOffset) * (1 - this.speed) | 0;
            var imageOffsetMin = (this.boxOffsetTop - maxOffset) * (1 - this.speed) | 0;

            if (imageHeightMin * this.aspectRatio >= this.boxWidth) {
                this.imageWidth = imageHeightMin * this.aspectRatio | 0;
                this.imageHeight = imageHeightMin;
                this.offsetBaseTop = imageOffsetMin;

                var margin = this.imageWidth - this.boxWidth;

                if (this.positionX == 'left') {
                    this.offsetLeft = 0;
                } else if (this.positionX == 'right') {
                    this.offsetLeft = -margin;
                } else if (!isNaN(this.positionX)) {
                    this.offsetLeft = Math.max(this.positionX, -margin);
                } else {
                    this.offsetLeft = -margin / 2 | 0;
                }
            } else {
                this.imageWidth = this.boxWidth;
                this.imageHeight = this.boxWidth / this.aspectRatio | 0;
                this.offsetLeft = 0;

                var margin = this.imageHeight - imageHeightMin;

                if (this.positionY == 'top') {
                    this.offsetBaseTop = imageOffsetMin;
                } else if (this.positionY == 'bottom') {
                    this.offsetBaseTop = imageOffsetMin - margin;
                } else if (!isNaN(this.positionY)) {
                    this.offsetBaseTop = imageOffsetMin + Math.max(this.positionY, -margin);
                } else {
                    this.offsetBaseTop = imageOffsetMin - margin / 2 | 0;
                }
            }
        },

        render: function () {
            var scrollTop = Parallax.scrollTop;
            var scrollLeft = Parallax.scrollLeft;
            var overScroll = this.overScrollFix ? Parallax.overScroll : 0;
            var scrollBottom = scrollTop + Parallax.winHeight;

            if (this.boxOffsetBottom - Parallax.winTop > scrollTop && this.boxOffsetTop <= scrollBottom + Parallax.winTop) {
                this.visibility = 'visible';
                this.mirrorTop = Parallax.is3d || Parallax.isSpecificView ? this.boxOffsetTop - scrollTop : this.boxOffsetTop - Parallax.winTop; //this.boxOffsetTop - scrollTop;
                this.mirrorLeft = this.boxOffsetLeft - scrollLeft;
                //this.offsetTop = this.offsetBaseTop + Parallax.winTop - this.mirrorTop * (1 - this.speed);
                this.offsetTop = this.offsetBaseTop + Parallax.winTop - (this.boxOffsetTop - scrollTop) * (1 - this.speed);
                this.scale = (scrollBottom - this.boxOffsetTop) * 0.02 + 1;
            } else {
                this.visibility = 'hidden';
            }

            this.$mirror.css({
                transform: 'translate3d(0px, 0px, 0px)',
                visibility: this.visibility,
                top: this.mirrorTop - overScroll,
                left: this.mirrorLeft,
                height: this.boxHeight,
                width: this.boxWidth
            });

            this.$slider.css({
                transform: 'translate3d(0px, 0px, 0px)',
                position: 'absolute',
                top: this.offsetTop,
                left: this.offsetLeft,
                height: this.imageHeight,
                width: this.imageWidth,
                maxWidth: 'none'
            });

            if (this.emParallax == "zoom") {
                this.$mirror.css({
                    webkitPerspective: "100px",
                    perspective: "100px",
                    webkitTransformStyle: "preserve-3d",
                    transformStyle: "preserve-3d"
                });

                this.$slider.css({
                    transform: 'translate3d(0px, 0px, ' + this.scale + 'px)'
                });
            }


        }
    });

    // Parallax Static Methods

    $.extend(Parallax, {
        scrollTop: 0,
        scrollLeft: 0,
        winHeight: 0,
        winWidth: 0,
        winTop: 0, // added from my self
        docHeight: 1 << 30,
        docWidth: 1 << 30,
        sliders: [],
        isReady: false,
        isFresh: false,
        isBusy: false,
        winOffsetTop: 0,
        winOffsetLeft: 0,
        scaleFactor: 1,
        is3d: false,
        //this flag say if it is Mobile view or FireFox  browser
        // when call func "render" needs special calculating position of mirror
        isSpecificView: false,
        

        setup: function () {
            if (this.isReady) return;

            var $doc = $('.current-active-slide');
            var scaleFactor = 0;
            function getCurrentSlideScaleFactor() {
                var $slide = $('.current-active-slide');
                Parallax.isSpecificView = EM.compatibility.getBrowser().indexOf("firefox") != -1
                    || EM.compatibility.getDevice() == "mobile";
                if ($slide.parent().attr('scale-factor') === underfined) {
                    Parallax.is3d = true;
                    scaleFactor = $slide[0].getBoundingClientRect().width / $slide.width();
                } else {
                    Parallax.is3d = false;
                    scaleFactor = parseFloat($slide.parent().attr('scale-factor'));
                }
                if (scaleFactor == 0)
                    console.error("Error in the Parallax, $slide does not have width or height");
                return scaleFactor;
            }

            var loadDimensions = function () {
                Parallax.scaleFactor = getCurrentSlideScaleFactor();
                Parallax.winHeight = $doc.height();
                Parallax.winWidth = $doc.width();
                Parallax.winTop = $doc.css("top") == "auto" ? 0 : parseInt($doc.css("top"));
                Parallax.docHeight = $doc[0].scrollHeight;
                Parallax.docWidth = $doc[0].scrollWidth;
                Parallax.winOffsetTop = $doc.offset().top;
                Parallax.winOffsetLeft = $doc.offset().left;
            };

            var loadScrollPosition = function () {
                var winScrollTop = $doc.scrollTop();
                var scrollTopMax = Parallax.docHeight - Parallax.winHeight;
                var scrollLeftMax = Parallax.docWidth - Parallax.winWidth;
                Parallax.scrollTop = Math.max(0, Math.min(scrollTopMax, winScrollTop));
                Parallax.scrollLeft = Math.max(0, Math.min(scrollLeftMax, $doc.scrollLeft()));
                Parallax.overScroll = Math.max(winScrollTop - scrollTopMax, Math.min(winScrollTop, 0));
            };

            $doc.on('resize.px.parallax load.px.parallax', function () {
                loadDimensions();
                Parallax.isFresh = false;
                Parallax.requestRender();
            })
              .on('scroll.px.parallax load.px.parallax', function () {
                  loadScrollPosition();
                  Parallax.requestRender();
              });

            loadDimensions();
            loadScrollPosition();

            this.isReady = true;
        },

        configure: function (options) {
            if (typeof options == 'object') {
                delete options.refresh;
                delete options.render;
                $.extend(this.prototype, options);
            }
        },

        refresh: function () {
            $.each(this.sliders, function () { this.refresh(); });
            this.isFresh = true;
        },

        render: function () {
            this.isFresh || this.refresh();
            $.each(this.sliders, function () { this.render(); });
        },

        requestRender: function () {
            var self = this;

            if (!this.isBusy) {
                this.isBusy = true;
                window.requestAnimationFrame(function () {
                    self.render();
                    self.isBusy = false;
                });
            }
        },
        destroy: function (el) {
            var i,
                parallaxElement = $(el).data('px.parallax');
            if (parallaxElement.$mirror !== undefined) {
                parallaxElement.$mirror.remove();
            }
            for (i = 0; i < this.sliders.length; i += 1) {
                if (this.sliders[i] == parallaxElement) {
                    parallaxElement.$mirror.find('>.parallax-slider').prependTo($(el));
                    this.sliders.splice(i, 1);
                }
            }
            $(el).data('px.parallax', false);
            if (this.sliders.length === 0) {
                $('.current-active-slide').off('scroll.px.parallax resize.px.parallax load.px.parallax');
                this.isReady = false;
                Parallax.isSetup = false;
            }
        },
        hasSlides: function() {
            return this.sliders.length;
        },
        destroyAll: function() {
            if (this.sliders.length > 0) {
                this.sliders = [];
                var $allSlides = EM.compatibility.isCompatible() ? $('.slide') : $('.slide_g');
                $allSlides.off('scroll.px.parallax resize.px.parallax load.px.parallax');
                this.isReady = false;
                Parallax.isSetup = false;
                return true;
            } else {
                return false;
            }
        }
    });

    function Plugin(option) {
        if (typeof option == 'string' && (option == 'hasSlides' || option == 'destroyAll')) {
            return Parallax[option]();
        } else {
            return this.each(function () {
                var $this = $(this);
                var options = typeof option == 'object' && option;

                if (this == window || this == document || $this.is('body')) {
                    Parallax.configure(options);
                } else if (!$this.data('px.parallax')) {
                    options = $.extend({}, $this.data(), options);
                    $this.data('px.parallax', new Parallax(this, options));
                } else if (typeof option == 'object') {
                    $.extend($this.data('px.parallax'), options);
                }
                if (typeof option == 'string') {
                    if (option == 'destroy') {
                        Parallax['destroy'](this);
                    } else {
                        Parallax[option]();
                    }
                }
            });
        }
        
    }

    var old = $.fn.parallax;

    $.fn.parallax = Plugin;
    $.fn.parallax.Constructor = Parallax;


    // Parallax No Conflict

    $.fn.parallax.noConflict = function () {
        $.fn.parallax = old;
        return this;
    };


}(jQuery, window, document));