var EM = EM || {};

EM.links = (function () {

    var isSameSlide = false;//Indicating if target is on same slide or not

    function scrollToTarget($link) {
        var selector = '#scene [data-element-link-id="' + $link.attr('href').substring(1) + '"]';
        var $target = $(selector).first();

        if ($target && $target.length) {
            if ($target.closest('.slide').length) {
                scrollIntoView($target, $target.closest('.slide'));
            } else if ($target.closest('.slide_g').length) {
                scrollIntoView($target, $target.closest('.slide_g'));
            } else {
                scrollIntoView($target, $target.closest('.slide'));
            }
        }
        
    }


    function scrollIntoView($target, $slide) {
        var $parent = $slide,
            top = parseInt($target.css('top')),
            left = parseInt($target.css('left')),
            height = $target.height(),
            width = $target.width(),
            pWidth = $parent.width(),
            pHeight = $parent.height(),
            destLeft, destTop; // the destination values for scroll left and top of the parent

        // if element does not overfow on an axis, scroll to zero for that axis;
        destTop = top + height / 2 - pHeight / 2;
        destLeft = left + width / 2 - pWidth / 2;

        // Using jQuery.animate on scroll doesn't get to finish animation
        // for some odd reason, simple solution is now set instead.
        // Animating Top and left seperatly since calculations
        // will be different considering destenation
        scrollToTop($('.current-active-slide')[0], destTop, 1000);
        scrollToLeft($('.current-active-slide')[0], destLeft, 1000);

        // Add zoomOutIn effect on same slide
        if ( isSameSlide ){
            // Adding zoom effect to any template which defined zoomOnTarget class
            $('.current-active-slide').children().addClass('zoomOnTarget');
            setTimeout(function () {
                $('.current-active-slide').children().removeClass('zoomOnTarget');
            }, 1000);
        }

    }

    function goToElementInSlide(e) {
        var $this = $(this);
        var slideNum = parseInt($this.attr('data-element-link-slide-num'));
        if (slideNum) {
            if (slideNum != scene.currentSlideNum()) { //go to slide, then go to link one slide is ready
                
                isSameSlide = false;

                $('#scene').one('transitionDone', function () {
                    scrollToTarget($this);
                });
                EM.player.goToSlide(parseInt(slideNum));

            } else { //link and element and in same slide, so need for goslide
                isSameSlide = true;
                scrollToTarget($this);
            }
        } else {
            //todo: handle erorr
        }
        e.preventDefault();
    }

    $(document).ready(function () {
        $(document.body).on('click', '.sd-element-link', goToElementInSlide);

        $(document.body).on('click', '.sd-slide-link', function () {
            var href = $(this).attr('href');
            var hash = window.location.hash;

            if (href.indexOf(hash) !== -1) { //if they are the same, bypass haschange (since it wont happen) and call statecalled directly, after giving the hash a chance to change.
                window.setTimeout(EM.player.stateCalled(), 50);
            }
        });
    });


    /*** Utilities ***/

    // Scrolling to left using vanilla js
    function scrollToLeft(element, to, duration) {
        var start = element.scrollLeft,
            change = to - start,
            currentTime = 0,
            increment = 20;
            
        var animateScroll = function(){        
            currentTime += increment;
            var val = Math.easeInOutQuad(currentTime, start, change, duration);
            element.scrollLeft = val;
            if(currentTime < duration) {
                setTimeout(animateScroll, increment);
            }
        };
        animateScroll();
    }

    // Scrolling to top using vanilla js
    function scrollToTop(element, to, duration) {
        var start = element.scrollTop,
            change = to - start,
            currentTime = 0,
            increment = 20;
            
        var animateScroll = function(){        
            currentTime += increment;
            var val = Math.easeInOutQuad(currentTime, start, change, duration);
            element.scrollTop = val;
            if(currentTime < duration) {
                setTimeout(animateScroll, increment);
            }
        };
        animateScroll();
    }

    //t = current time
    //b = start value
    //c = change in value
    //d = duration
    Math.easeInOutQuad = function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t + b;
        t--;
        return -c/2 * (t*(t-2) - 1) + b;
    };

    return {
        scrollToTarget: scrollToTarget
    }

})();


EM.Widget = (function () {

    var scrollThreshold = 2000; // load more when scrollThreshHold px left to scroll to page bottom
    var scrollSelector = '.embed-wrapper iframe[data-src*="wrapperscroll=yes"]';

    function init() {

        $(window).on("sceneReady", function () {
            $('.slide').has(scrollSelector).on('scroll', onScroll);
        });
        // get the new height of the widget from the widget after it added some content

        window.addEventListener("message", receiveMessage, false);
    }


    onScroll = function (event) {

        // notify we are reaching end of scroll
        // first client of this:
        // verticalList widget uses this to load 
        // more data
        if (this.scrollHeight <=  // height of all the scroll 
                this.scrollTop +  // this one is rising when scrolling down, how much we scrolled
                $(this).height() + // bounding client rectangle height
                scrollThreshold)   // 
        {
            notifyWidgetsScrollToBottom(this);
        }
    };


    function notifyWidgetsScrollToBottom(slide) {
        $slide = $(slide);

        if ($slide.data("loadingMore") == "true")
            return;

        $iframes = $slide.find(scrollSelector);
        var data = {
            type: 'slide-scrolled-to-bottom',
            slideIndex: $slide.index()
        }
        $iframes.each(function () { this.contentWindow.postMessage(JSON.stringify(data), "*") });
        $slide.data("loadingMore", "true");
    }

    receiveMessage = function (event) {

        var data;
        var $iframeWrapper;
        try {
            data = JSON.parse(event.data);
        } catch (e) {
            return;
        }

        if (data == null)
            return;

        // slide Index is problematic with zoomers, not using it for now
        if (data.type == "request-more-scroll") {
            var setHeight = data.setHeight;
            var slideIndex = null; // data.slideIndex;
            var iframeSrc = data.iframeSrc;
            if (slideIndex != null) {
                var $slide = $($('slide')[slideIndex]);
                $slide.data("loadingMore", "false");
                //$slide.height($slide.height() + toAdd);
                $iframeWrapper = $slide.find('iframe[src*="' + iframeSrc + '"]').closest('.edit-wrapper.embed-wrapper');
                $iframeWrapper.height(setHeight);
            }
            else {
                $iframeWrapper = $('iframe[src*="' + iframeSrc + '"]').closest('.edit-wrapper.embed-wrapper');
                $iframeWrapper.height(setHeight);
                var $slide = $iframeWrapper.closest('.slide');
                $slide.data("loadingMore", "false");
            }
        }
    }

    init();

})();