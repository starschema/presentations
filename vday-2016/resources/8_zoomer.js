

var scene = new function () {
    // Graphic designers could set this to true to let all navigation buttons work in 3D scenes
    // They should NOT COMMIT this change, as it slows the computer down
    var self = this;
    var WORK_IN_BACKGROUND = false;
    var debug,
        stage,
        container,
        lastTime,
        targets;

    var manX = 0, manY = 0, manZ = 0, manRX = 0, manRY = 0, manRZ = 0;

    // VARS
    var boundRectTimer;
    var boundRect = null;

    var currentSlide = 1;       // The current slide    
    var slides = [];   // Contains the info on the slides
    var targetTimes = [];
    var targetEasing = [];
    var $currentSlide = $(); //the currently selected slide jquery object. 
    var DURATION = 1000; // default transition time   
    var EASING = "Linear.None";
    var MANUAL_DURATION = 0;
    var initialTarget = null;
    var initialDuration = -1;
    var initialEase = null;
    // STATIC MOTION PARAMS
    var inMotion = true; // true, otherwise first slide won't appear
    var prevGlide = null;
    var nextScale = 1; // Used for the scaling transition    
    var prevRotX = 0, prevRotY = 0, prevRotZ = 0;
    var glides = []; // Holds all the glides between slides
    var moveParams = { initial: false, manual: false }; // Used to pass parameters between glides. It seems the call command in Tween does not do it correctly
    var sceneObj, sceneDivId;
    var doNotAnimate = false;
    var settings = { resourcesURL: null, themeUrl: null }; // configurable settings passed in init function;
    var self = this;
    var $scene = $();
    var $decoder = $(); //used to decode images;
    // var $decodeContainer = $('<div id="decoder">');
    function toggleInactiveSlides(toggle) {

        var $activeSlide = self.getCurrentSlide(); //check syntax
        var $inactiveSlides = $('#scene .slide').not($activeSlide);

        $inactiveSlides.css('visibility', toggle ? 'visible' : 'hidden');
        $activeSlide.css('visibility', 'visible');

    }


    this.init = function (sceneDiv, options) {

        settings = options || {};

        clearParams(); // in case of a reset when editor calls player
        sceneDivId = sceneDiv;
        sceneObj = document.getElementById(sceneDivId);
        $scene = $(sceneObj);

        //  debug = document.getElementById("debug");

        // create a centered 3D stage
        stage = Sprite3D.createCenteredContainer(sceneObj);

        container = stage.addChild(new Sprite3D().setRotateFirst(true).setScale(1, 1, 1).setId("transformer")); // todo: note the rotate first

        // Due to indexing starting from 1
        targets = ['dummy'];
        targetTimes = [DURATION];
        targetEasing = [EASING];
        var target;

        zoomerInit.set(this);

        // keep track of the time to tick the tween engine
        lastTime = new Date().getTime();

        //document.addEventListener("touchstart", onTouchStart);

        target = new Sprite3D().setId("scenery");
        container.addChild(target);
        //$('#scenery').load('scenery.html', function () {

        var worldUrl;
        worldUrl = settings.resourcesURL + '/' + settings.themeURL + '_world.html';

        var $extraHtml = $('#extra-html');
        if ($extraHtml.length == 0 || $extraHtml.html() == '') { // Presentation in server
            $('#scenery').load(worldUrl, function () {
                $('#transformer').append($('#scenery').html());
                $("#scenery").remove();
                //alert('Load was performed.');
            });
        } else { // Presentation offline
            $('#transformer').append($extraHtml.html());
            $extraHtml.html('');
        }
        if (initialTarget == null)
            moveToSlide(1, false);
        else {
            prevRotX = -(initialTarget.rotationX % 360);
            prevRotY = -(initialTarget.rotationY % 360);
            prevRotZ = -(initialTarget.rotationZ % 360);

            moveToSlide(1, true);
        }

        animate();

        // trigger transitionStart since we are doing a transition above during init
        triggetTransitionStart(getCurrentTargetNum());
        toggleInactiveSlides(true);

        // Adjust step size according to container size
        var TO = false;
        $(window).resize(function (event) {
            if (this != event.target)
                return;
            if (TO !== false)
                clearTimeout(TO);
            TO = setTimeout(self.resizeWinner, 600); //200 is time in miliseconds
        });

        self.resizeWinner();

        if (document.readyState == 'complete') {
            loadFinished();
        } else {
            setTimeout(loadFinished(), 3000);
        }

        $decoder = $('<div id="decoder">').appendTo($scene);
        $decoder.data('urls', []);

        // this is required to center the scene during initial->first slide in some presentations
        $scene.hide().show(0);
    };

    //TODO make more intelligent
    function loadFinished() {
        $('body').triggerHandler('loadfinished');
    }

    this.resizeWinner = function () {
        var wW = sceneObj.parentNode.offsetWidth;
        var wH = sceneObj.parentNode.offsetHeight;
        var scaler = Math.min(wW / 1280, wH / 632); // original screen was designed in full HD Chrome, zoom 150%
        var w = wW / scaler;
        var h = wH / scaler;
        var left = (w - scaler * w) / 2;
        var top = (h - scaler * h) / 2;
        //var scaleFactor = settings.isMaximized ? Math.min(wW / 1920, wH / 1080) : scaler;

        var style = "width:" + w + "px; height:" + h + "px;" + allStyles("-webkit-transform:  translate(" + (-left) + "px," + (-top) + "px) scale(" + scaler + ");");

        sceneObj.setAttribute("style", style);
        //redrawScene();
        //            stepToSlide(currentSlide);
    };

    // should get a line with a single webkit command, and will multiply it and add other extensions
    function allStyles(style) {
        var styles = style;
        styles += " " + style.replace(/webkit/g, "moz"); // mozilla
        styles += " " + style.replace(/webkit/g, "ms"); // Microsoft Explorer
        styles += " " + style.replace(/webkit/g, "o"); // Opera
        styles += " " + style.replace(/-webkit-/g, ""); // generic

        return styles;
    }

    // When moving to a slide which is not the next, skip glide
    this.addGlide = function (x, y, z, rx, ry, rz, w, t, ease) {
        if (t == undefined)
            t = DURATION;
        if (ease == undefined)
            ease = EASING;
        var glider = { pos: targets.length - 1, x: x, y: y, z: z, rotationX: rx, rotationY: ry, rotationZ: rz, scaleX: w / 1920, duration: t, easing: ease };

        glides.push(glider);
    };

    this.setLocation = function (x, y, z, rx, ry, rz, w, dur, ease) {
        var scaler = w / 1920;
        var registrationX = 1920 / 2;
        var registrationY = 1080 / 2;
        var fixScalingX = -(1 - scaler) / 2 * 1920;
        var fixScalingY = -(1 - scaler) / 2 * 1080;

        // adjust coordinates
        x += registrationX + fixScalingX;
        y += registrationY + fixScalingY;

        initialTarget = new Sprite3D()
                .setClassName("target")
                .setInnerHTML('<span class="slideBoxes slideBox' + targets.length + '">' + targets.length + '</span>')
                .setRegistrationPoint(registrationX, registrationY, 0)
                .setScale(scaler, scaler, 1)
                .setPosition(x, y, z)
                .setRotation(rx, ry, rz)
                .setRotateFirst(false)
                .update();
        initialDuration = dur;
        if (ease)
            initialEase = ease;
    };

    // location: x,y,z
    // rotation: rx,ry,rz
    // width: w (height is calculated as 16*9)    
    // t: transition time
    // ease: string representing easing function
    this.addTarget = function (x, y, z, rx, ry, rz, w, t, ease) {
        var scaler = w / 1920;
        if (t == undefined)
            t = DURATION;
        if (ease == undefined)
            ease = EASING;

        var registrationX = 1920 / 2;
        var registrationY = 1080 / 2;
        var fixScalingX = -(1 - scaler) / 2 * 1920;
        var fixScalingY = -(1 - scaler) / 2 * 1080;

        // adjust coordinates
        x += registrationX + fixScalingX;
        y += registrationY + fixScalingY;

        var target = new Sprite3D()
                .setClassName("target")
                .setInnerHTML('<span class="slideBoxes slideBox' + targets.length + '">' + targets.length + '</span>')
                .setRegistrationPoint(registrationX, registrationY, 0)
                .setScale(scaler, scaler, 1)
                .setPosition(x, y, z)
                .setRotation(rx, ry, rz)
                .setRotateFirst(false)
                .update();

        container.addChild(target);
        targets.push(target);
        targetTimes.push(t);
        targetEasing.push(ease);
        var num = getNumTargets() - 1;
        var targetName = getTargetName(num);
        target.setId(targetName); // important to set the ID after the target was added, otherwise getTargetName will return wrong value due to modulus
        unfocusTarget(num);

        $("#" + targetName).addClass("targetNoSlide");
    };

    function unfocusTarget(slideNum) {
        switchfocusTarget(slideNum, false);
    }

    function focusTarget(slideNum) {
        switchfocusTarget(slideNum, true);
    }

    function switchfocusTarget(numSlide, focused) {
        var targetNum = getTargetNum(numSlide);
        var targetName = getTargetName(numSlide);
        if (!focused) {
            $("#" + targetName).removeClass("focusTarget" + targetNum);
            $("#" + targetName).addClass("unfocusTarget" + targetNum);
        }
        else {
            $("#" + targetName).removeClass("unfocusTarget" + targetNum);
            $("#" + targetName).addClass("focusTarget" + targetNum);
        }
    };

    function onTouchStart(event) {
        // prevent user from scrolling the page
        event.preventDefault();
    }
    // Returns the ID of the current slide
    this.currentSlideID = function () {
        return slides[currentSlide].id;
    };

    function getTargetNum(slideNum) {
        return ((slideNum - 1) % (getNumTargets() - 1)) + 1;
    }

    function getCurrentTargetNum() {
        return getTargetNum(currentSlide);
    }

    function getCurrentTarget() {
        return targets[getCurrentTargetNum()];
    }

    function getTargetName(slideNum) {
        return "target" + getTargetNum(slideNum);
    }

    function getNumTargets() {
        return targets.length;
    }

    function moveToSlide(toSlide, initial) {
        var currentTarget = getTargetNum(toSlide);

        moveParams.fromSlide = currentSlide; // important as we have race conditions when glides are present
        moveParams.toSlide = toSlide;
        moveParams.initial = initial;

        unfocusTarget(currentSlide);

        if (slides.length > toSlide) {
            updateSlideInTarget(targets[currentTarget], toSlide);
        }
        focusTarget(currentTarget);

        moveParams.doGlides = (Math.abs(currentSlide - toSlide) === 1) ? getGlides(toSlide) : undefined;

        moveParams.currentTarget = currentTarget;
        // todo: no need for passing params, this is for debugging

        performMoves();
        /*if (toSlide == 2)
            performMoves("kobik");
        else {
            performMoves();    
        }*/

        $currentSlide = $(targets[currentTarget].domElement).children('.slide');
    }

    function performMoves() { // todo: no need for params
        var initial = false,
            manual = false,
            transitionParams,
            transitionEndFunction,
            easing,
            nextTarget,
            transitionTime,
            easeFunc,
            easeType,
            currentTarget,
            easingVals,
            target,
            doGlides,
            glide = false,
            toScale = 1,  // todo: glides should scale as well, so the following is not correct
            curRotX,
            curRotY,
            curRotZ,
            rotX,
            rotY,
            rotZ,
            isReverse;


        if (moveParams.initial == true) {
            initial = true;
            moveParams.initial = false;
        }
        if (moveParams.manual == true) {
            manual = true;
        }
        currentTarget = moveParams.currentTarget;
        doGlides = moveParams.doGlides;

        if (doGlides == undefined || doGlides.length == 0) {
            target = targets[currentTarget];
        } else {
            target = doGlides.shift();
            glide = true;
        }

        curRotX = -(target.rotationX % 360);
        curRotY = -(target.rotationY % 360);
        curRotZ = -(target.rotationZ % 360);
        rotX = curRotX;
        rotY = curRotY;
        rotZ = curRotZ;

        while (prevRotX - rotX > 180) // don't do wide turns
            rotX += 360;
        while (rotX - prevRotX > 180) // don't do wide turns
            rotX -= 360;
        while (prevRotY - rotY > 180) // don't do wide turns
            rotY += 360;
        while (rotY - prevRotY > 180) // don't do wide turns
            rotY -= 360;
        while (prevRotZ - rotZ > 180) // don't do wide turns
            rotZ += 360;
        while (rotZ - prevRotZ > 180) // don't do wide turns
            rotZ -= 360;
        prevRotX = rotX;
        prevRotY = rotY;
        prevRotZ = rotZ;

        nextScale = target.scaleX;
        toScale = (1 / nextScale) / 2;
        isReverse = moveParams.toSlide < moveParams.fromSlide;

        if (Math.abs(moveParams.toSlide - moveParams.fromSlide) !== 1) {
            transitionTime = DURATION; // if jumping between slides, do it in constant time
            easingVals = EASING.split('.');
            easeFunc = easingVals[0];
            easeType = easingVals[1];
        } else {
            if (glide) {
                if (isReverse) {
                    if (!prevGlide) {
                        nextTarget = getTargetNum(currentTarget + 1);
                        transitionTime = targetTimes[nextTarget]; // this is last glide time    
                        easingVals = targetEasing[nextTarget].split('.');
                    } else {
                        transitionTime = prevGlide.duration;
                        easingVals = prevGlide.easing.split('.');
                    }

                } else {
                    transitionTime = target.duration;
                    easingVals = target.easing.split('.');
                }

                prevGlide = target;
            } else {
                if (prevGlide && isReverse) {
                    transitionTime = prevGlide.duration;
                    easingVals = prevGlide.easing.split('.');
                } else {
                    if (!isReverse) {
                        transitionTime = targetTimes[currentTarget];
                        easingVals = targetEasing[currentTarget].split('.');
                    } else {
                        nextTarget = getTargetNum(currentTarget + 1);
                        transitionTime = targetTimes[nextTarget];
                        easingVals = targetEasing[nextTarget].split('.');
                    }
                }
                prevGlide = null;
            }
            easeFunc = easingVals[0];
            easeType = easingVals[1];
            if (isReverse) {
                easeType = reverseEasing(easeType);
            }
        }
        if (!initial) {
            if (initialDuration != -1) {
                transitionTime = initialDuration;
                initialDuration = -1;
            }
            if (initialEase != null) {
                try { // This is required in case the graphic designer defined wrong parameters for the initial ease
                    easeFunc = initialEase.split('.')[0];
                    easeType = initialEase.split('.')[1];
                } catch (e) {
                }
                initialEase = null;
            }
        }

        if (manual) {
            transitionTime = MANUAL_DURATION;
        }
        // If we use the same easing function below while scaling up and down, it should better be symmetric, 
        // otherwise there will be a significant jump (especially while scaling up).
        if (glide) {
            moveParams.currentTarget = currentTarget;
            moveParams.doGlides = doGlides;
            transitionParams = {
                x: -(target.x),
                y: -(target.y),
                z: -(target.z),
                scaleX: toScale,
                scaleY: toScale,
                scaleZ: toScale,
                rotationX: rotX,
                rotationY: rotY,
                rotationZ: rotZ
            };
            transitionEndFunction = performMoves;
        } else {
            if (initial != undefined && initial == true) {
                transitionParams = {
                    x: -(initialTarget.x),
                    y: -(initialTarget.y),
                    z: -(initialTarget.z),
                    scaleX: toScale,
                    scaleY: toScale,
                    scaleZ: toScale,
                    rotationX: -(initialTarget.rotationX),
                    rotationY: -(initialTarget.rotationY),
                    rotationZ: -(initialTarget.rotationZ)
                }
                transitionEndFunction = performMoves;

            } else {
                transitionParams = {
                    x: -(target.x + (manual != undefined ? manX : 0)),
                    y: -(target.y + (manual != undefined ? manY : 0)),
                    z: -(target.z + (manual != undefined ? manZ : 0)),
                    scaleX: toScale,
                    scaleY: toScale,
                    scaleZ: toScale,
                    rotationX: rotX + (manual != undefined ? manRX : 0),
                    rotationY: rotY + (manual != undefined ? manRY : 0),//-(targets[currentTarget].rotationY),
                    rotationZ: rotZ + (manual != undefined ? manRZ : 0)
                }
                transitionEndFunction = endMove;
            }
        }
        easing = window["Easing"][easeFunc]["Ease" + easeType];
        //ASAF DEBUG

        if (window.greener) {
            transitionParams.onUpdate = container.update;
            transitionParams.onUpdateScope = container;
            TweenLite.to(container, transitionTime / 1000, transitionParams);
        }
            //END ASAF DEBUG
        else {
            Tween.get(container, false).to(transitionParams, transitionTime, easing).call(transitionEndFunction);
        }
    }

    function reverseEasing(func) {
        if (func == 'Out')
            return 'In';
        if (func == 'In')
            return 'Out';
        return func;
    }

    this.getCurrentSlide = function () {
        // Return first slide in case currentSlide is yet to be set
        return ($currentSlide.length > 0) ? $currentSlide : $('#target1').children('.slide');
    }

    this.getSLideBoundingClientRect = function () {
        var currentTarget = getTargetName(currentSlide);
        return $("#" + currentTarget).get(0).getBoundingClientRect();
    };

    // Called when a slide transition is complete
    function endMove() {
        //  var iterationCount = 0;
        console.log('endMove');
        if (boundRect != null) { // in progress
            return;
        }

        boundRect = self.getSLideBoundingClientRect();
        boundRectTimer = setInterval(function () {
            //  console.log('boundrect iterations: ', ++iterationCount);
            var b = self.getSLideBoundingClientRect();
            if (b.width == boundRect.width && b.height == boundRect.height) {
                window.clearInterval(boundRectTimer);

                triggerTransitionDone();
                prepNextTarget(currentSlide);
                toggleInactiveSlides(false);
                // Chrome version 43 has an issue with freeze of painting, we need to trigger repaint
                // Consider removing in future version to fix.
              //  $scene.hide().show(0); //commented out because it causes effects on elements to fire twice and seems to not be needed.

                //   console.log("TRIGGERED TRANSITION");
                boundRect = null;
                inMotion = false;
            } else {
                boundRect = b;
            }
        }, 500);


        // Should also send event
    }

    function animate() {
        //ASAF DEBUG
        // return;
        //END ASAF DEBUG
        if (!WORK_IN_BACKGROUND) {
            if (!inMotion)
                return;
        }
        // Firefox has a serious problem with 3d animation, things blink like crazy
        // One of the methods to get over this is to tell firefox everything needs to be updated by changing the Top
        // property of things, even by 0.05, back and forth. How we're going to do this is mystery for now.
        // Remember to add check that we're in firefox.
        // Find scenery once, don't do it so many times
        /*
        var top = $("#scenery").css("top");
        if (!top || top=='0px')
            $("#scenery").css("top", "1px");
        else {
            $("#scenery").css("top", "0px");
        }*/

        requestAnimationFrame(animate);
        update();
    }

    function getGlides(toSlide) {
        var retGlides = [];
        if (Math.abs(toSlide - currentSlide) != 1 && (toSlide != 1 && currentSlide != slides.length) &&
            (toSlide != slides.length && currentSlide != 1))
            return undefined;
        // if back, need to reverse path
        var searchSlide = toSlide;
        if (toSlide > currentSlide || (toSlide == 1 && currentSlide == slides.length))
            searchSlide = currentSlide;

        for (var i = 0; i < glides.length; i++) {
            if (glides[i].pos == getTargetNum(searchSlide)) {
                retGlides.push(glides[i]);
            }
        }

        if (searchSlide != currentSlide)
            return retGlides.reverse();
        return retGlides;
    }

    function update() {
        //ASAF DEBUG
        //  return;
        //END ASAF DEBUG

        // manually compute the elapsed time since last screen refresh,
        // achieving time-based rather than frame-based animation 
        var newTime = new Date().getTime();
        Tween.tick(newTime - lastTime);
        lastTime = newTime;

        if (!WORK_IN_BACKGROUND) {
            if (doNotAnimate/* || !inMotion*/)
                return;
        }


        // update container's position
        container.update();

        //stats.update();
    }

    function msg(t) {
        debug.innerHTML = t;
    }

    // Add new slide. Optional - provide HTML for that slide.
    this.addSlide = function (slideHTML) // Add a new slide
    {
        var numSlide = numSlides() + 1;

     

        slides[numSlide] = { id: "slideNo" + numSlide, html: slideHTML, newSubject: null };

        if (numSlide < targets.length) {
            $("#" + getTargetName(numSlide)).removeClass("targetNoSlide");
            updateSlideInTarget(targets[numSlide], numSlide);
        }

        return numSlide;
    };

    this.insertSlide = function (slideNum, html) {
        if (slideNum < 1)
            return;
        if (slideNum > numSlides())
            slideNum = numSlides() + 1;

        if (!html.match(/<div.*?class.*?slide/)) { //ensure that the html is wrapped in a slide.
            html = '<div class="slide slide sd-slide-background-image_1 sd-slide-background-color_1">' + html + '</div>';
        }
        self.addSlide(html);

        var i;
        for (i = slides.length - 1; i > slideNum; i--) {
            self.setSlideHTML(i, slides[i - 1].html);
        }
        self.setSlideHTML(slideNum, html == null ? "" : html);
        //  if (slideNum == currentSlide)
        //      self.goSlide(slideNum, true);
    };

    this.moveSlide = function (fromIdx, toIdx) {
        var h, i;
        if (toIdx > fromIdx) {
            h = slides[fromIdx].html;
            for (i = fromIdx; i < toIdx; i++) {
                slides[i].html = slides[i + 1].html;
            }
            slides[toIdx].html = h;
        } else {
            h = slides[fromIdx].html;
            for (i = fromIdx; i > toIdx; i--) {
                slides[i].html = slides[i - 1].html;
            }
            slides[toIdx].html = h;
        }
    };

    this.deleteSlide = function (slideNum) {
        if (slideNum > numSlides() || slideNum < 1)
            return;

        var i;
        for (i = slideNum; i < slides.length - 1; i++) {
            self.setSlideHTML(i, slides[i + 1].html);
        }

        for (i = currentSlide; i < (slides.length - 1) && i < currentSlide + targets.length - 1; i++) {
            updateSlideInTarget(targets[getTargetNum(i)], i);
        }

        if (slides.length - 1 <= targets.length) // Is that correct?
        {
            if (slides.length - 1 < targets.length)
                $("#" + getTargetName(slides.length - 1)).addClass("targetNoSlide");

            // is the current target (I assume this is the target of the deleted slide) the same target as the last slide ? 
            if (getCurrentTargetNum() == getTargetNum(slides.length - 1)) {
                if (slides.length > targets.length) { //TODO: this logic is not 100% clear so if there is an issue with wrong slide showing in zoomer after deletion in editor, this may be the culprit.
                    updateSlideInTarget(getCurrentTarget(), slides.length - targets.length);
                }
                // AMIR: consider remove next line  - the editor already calls the goSlide when deleting
                self.goSlide(currentSlide - 1); // if its the only slide, then it just disappears
            }
        }
        slides.pop();
        // Reset the current slide due to slides change in DOM
        $currentSlide = $();

        //if (slideNum > numSlides() && slideNum>1)

        // TODO: what exactly happens when staying with zero slides?
        /*if (slideNum == currentSlide)
            self.goSlide(slideNum, true);*/
        // Maybe goSlide, so it'll redraw? Naa...        
    };
    function updateSlideInTarget(target, slideNum) {
        if (settings.forceSlideUpdate || !target.slideNum || target.slideNum !== slideNum) { //only update if needed settings.forceSlideUpdate is used by th editor to allways set the slide html since it changes in the editor.
            target.setInnerHTML(slides[slideNum].html);
            target.slideNum = slideNum;
        }
    }


    this.setSlideHTML = function (slideNum, slideHTML) // set slide HTML
    {
        if (slideHTML == null || slideNum < 1 || slideNum > numSlides()) // slide must already exist
            return;

        slides[slideNum].html = slideHTML;
        if (slideNum === currentSlide) { // Do not redraw slide automatically, due to circular sliding. GotoSlide/next/prev is required for update.
            updateSlideInTarget(getCurrentTarget(), slideNum, true);
        }

    };

    this.currentSlideNum = function () {
        return currentSlide;
    };

    this.rewind = function () {
        self.goSlide(1);
    };


    //this.removeHTML = function (slideNum) {
    //    doNotAnimate = false;
    //    $("#" + getTargetName(slideNum)).children('.slide').empty();
    //};


    //this.restoreHTML = function (slideNum) {
    //    try {
    //        targets[getTargetNum(slideNum)].setInnerHTML(slides[slideNum].html);
    //    } catch (e) {
    //        console.warn(e);
    //    }
    //};

    //asaf: changed to hide/show because setting/deleting the html is problematic for clouds theme. only editor uses these functions. its probaqbly more efficient to just hide/show.
    this.removeHTML = function (slideNum) {
        doNotAnimate = false;
        $("#" + getTargetName(slideNum)).addClass('hide-elements');
    };

    this.restoreHTML = function (slideNum) {
        $("#" + getTargetName(slideNum)).removeClass('hide-elements');
    };



    function numSlides() {
        return (slides.length == 0) ? 0 : slides.length - 1; // because I index from 1, the length will be 1+number of items
    }
    //set the slide html of the next target ahead of time, so that the corresponding overhead won't happen during the animation.
    function prepNextTarget(slideNum) {
        var target;
        if (scene.dontPrep) { //this is just for debug can delete this IF block any time
            return;
        }
        var nextslideNum = slideNum + 1;
        if (nextslideNum < slides.length) {
            target = targets[getTargetNum(nextslideNum)];
            updateSlideInTarget(target, nextslideNum);

        //  decodeImages($(target.domElement)); AMIR: removed the decoder, need to add image removal stratagy 

        }
    }

    function decodeImages($element) {
        // $decoder.empty();
        $element.find('img').each(function () {
            var src = this.src;
            var urls = $decoder.data().urls;
            if (urls.indexOf(src) === -1) {
                urls.push(src);
                $decoder.data('urls', urls);
                $('<img class="img-decode">').attr('src', src).appendTo($decoder);
            }
        });
    }

    function triggetTransitionStart(slideNum) {
        $scene.attr('data-target-to', getTargetNum(slideNum)); //used for optional css selectors
        $scene.trigger('beforeTransitionStart', [$($currentSlide), currentSlide]);
        $scene.trigger('transitionStart', [slideNum]);
    }

    function triggerTransitionDone() {
        $scene.attr('data-target-to', ''); //clear the 'target to' css hook as we are no longer in transition
        $scene.attr('data-target', getCurrentTargetNum());
        $scene.trigger("transitionDone",[currentSlide]);
    }

    this.goSlide = function (slideNum) {

        if (inMotion) {
            Tween.stop(); //force end of exsting animation to clear the way for the new animation.
        }
        // AMIR: removed becasue it caused the editor to show its surface in middle of goto first slide
        // if (slideNum == currentSlide) {
        //    triggetTransitionStart(slideNum);
        //    triggerTransitionDone();
        //    prepNextTarget(slideNum);
        //}

        if (slideNum == null || slideNum > numSlides() || slideNum < 1) {
            endMove();
            //console.log("slideNum bad - returning");
            return;
        }

        doNotAnimate = false;
        inMotion = true;
        animate(); // start animation frames process

        moveToSlide(slideNum);
        triggetTransitionStart(slideNum);
        toggleInactiveSlides(true);
        currentSlide = slideNum;

    }

    this.prevSlide = function () {
        this.goSlide(currentSlide - 1);
    };

    // Go to next slide
    this.nextSlide = function () {
        this.goSlide(currentSlide + 1);
    };


    function sin(num) { return Math.sin(num / 180 * Math.PI); };
    function cos(num) { return Math.cos(num / 180 * Math.PI); };

    function clearParams() {
        manX = 0, manY = 0, manZ = 0, manRX = 0, manRY = 0, manRZ = 0;

        // VARS
        boundRectTimer = null;
        boundRect = null;

        currentSlide = 1;       // The current slide    
        slides = [];   // Contains the info on the slides
        targetTimes = [];
        targetEasing = [];

        DURATION = 1000; // default transition time   
        EASING = "Linear.None";
        MANUAL_DURATION = 0;
        initialTarget = null;
        initialDuration = -1;
        // STATIC MOTION PARAMS
        inMotion = true; // true, otherwise first slide won't appear
        prevGlide = null;
        nextScale = 1; // Used for the scaling transition    
        prevRotX = 0, prevRotY = 0, prevRotZ = 0;
        glides = []; // Holds all the glides between slides
        moveParams = { initial: false, manual: false }; // Used to pass parameters between glides. It seems the call command in Tween does not do it correctly
        sceneObj = null;
        sceneDivId = null;
        doNotAnimate = false;
    }

    // Used to be required
    this.manualMove = function (keynum) // for testing - moving around the maze
    {
        if (!WORK_IN_BACKGROUND)
            return;

        var MOVE = 10; // how much to move
        var TURN = 5; // how much to rotate
        var transformer, origMat, translationMatrix, result;
        transformer = document.getElementById("transformer");

        if ($.browser.webkit)
            origMat = new WebKitCSSMatrix(window.getComputedStyle(transformer).webkitTransform);

        switch (keynum) {
            //case 48 + 0: // 0
            //    setBirdView();
            //    break;
            case 65: // A - Turn Left
            case 97:
                if (!$.browser.webkit) {
                    doNotAnimate = true;
                    break;
                }
                translationMatrix = new WebKitCSSMatrix("matrix3d(" + cos(TURN).toFixed(10) + ",0," + sin(TURN).toFixed(10) + ",0, 0,1,0,0, " + sin(-TURN).toFixed(10) + ",0," + cos(TURN).toFixed(10) + ",0, 0,0,0,1)");
                transformer.style.webkitTransform = translationMatrix.multiply(origMat).toString();
                doNotAnimate = true;
                return;
            case 68: // D - Turn Right
            case 100:
                if (!$.browser.webkit) {
                    doNotAnimate = true;
                    break;
                }
                translationMatrix = new WebKitCSSMatrix("matrix3d(" + cos(-TURN).toFixed(10) + ",0," + sin(-TURN).toFixed(10) + ",0, 0,1,0,0, " + sin(TURN).toFixed(10) + ",0," + cos(-TURN).toFixed(10) + ",0, 0,0,0,1)");
                transformer.style.webkitTransform = translationMatrix.multiply(origMat).toString();
                doNotAnimate = true;
                return;
            case 67: // C - Turn Down
            case 99:
                if (!$.browser.webkit) {
                    doNotAnimate = true;
                    break;
                }
                /*rotationXMatrix = $M([
  [1,0,0,0],
  [0,Math.cos(a), Math.sin(-a), 0],
  [0,Math.sin(a), Math.cos( a), 0],
  [0,0,0,1]
])*/
                translationMatrix = new WebKitCSSMatrix("matrix3d(1,0,0,0" +
                    ",0," + cos(TURN).toFixed(10) + "," + sin(-TURN).toFixed(10) + ",0" +
                    ",0," + sin(TURN).toFixed(10) + "," + cos(TURN) + ",0" +
                    ",0,0,0,1)");
                transformer.style.webkitTransform = translationMatrix.multiply(origMat).toString();
                doNotAnimate = true;
                return;
            case 69: // E - Turn Up
            case 101:
                if (!$.browser.webkit) {
                    doNotAnimate = true;
                    break;
                }

                translationMatrix = new WebKitCSSMatrix("matrix3d(1,0,0,0" +
                    ",0," + cos(-TURN).toFixed(10) + "," + sin(TURN).toFixed(10) + ",0" +
                    ",0," + sin(-TURN).toFixed(10) + "," + cos(-TURN) + ",0" +
                    ",0,0,0,1)");
                transformer.style.webkitTransform = translationMatrix.multiply(origMat).toString();
                doNotAnimate = true;
                return;
            case 87: // W - Move Forward
            case 119:
                if (!$.browser.webkit) {
                    doNotAnimate = true;
                    break;
                }
                translationMatrix = new WebKitCSSMatrix("matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0," + MOVE + ",1)");
                transformer.style.webkitTransform = translationMatrix.multiply(origMat).toString();
                doNotAnimate = true;
                return;
            case 88: // X - Move Back
            case 120:
                if (!$.browser.webkit) {
                    doNotAnimate = true;
                    break;
                }
                translationMatrix = new WebKitCSSMatrix("matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0," + (-MOVE) + ",1)");
                transformer.style.webkitTransform = translationMatrix.multiply(origMat).toString();
                doNotAnimate = true;
                return;
            case 74: // J - Move Left
            case 106:
                if (!$.browser.webkit) {
                    doNotAnimate = true;
                    break;
                }
                translationMatrix = new WebKitCSSMatrix("matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, " + MOVE + ",0,0,1)");
                transformer.style.webkitTransform = translationMatrix.multiply(origMat).toString();
                doNotAnimate = true;
                return;
            case 75: // K - Move Right
            case 107:
                if (!$.browser.webkit) {
                    doNotAnimate = true;
                    break;
                }
                translationMatrix = new WebKitCSSMatrix("matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, " + (-MOVE) + ",0,0,1)");
                transformer.style.webkitTransform = translationMatrix.multiply(origMat).toString();
                doNotAnimate = true;
                return;
            case 77: // M - Move Up
            case 109:
                if (!$.browser.webkit) {
                    doNotAnimate = true;
                    break;
                }
                translationMatrix = new WebKitCSSMatrix("matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0," + (-MOVE) + ",0,1)");
                transformer.style.webkitTransform = translationMatrix.multiply(origMat).toString();
                doNotAnimate = true;
                return;
            case 73: // I - Move Down
            case 105:
                if (!$.browser.webkit) {
                    doNotAnimate = true;
                    break;
                }
                translationMatrix = new WebKitCSSMatrix("matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0," + MOVE + ",0,1)");
                transformer.style.webkitTransform = translationMatrix.multiply(origMat).toString();
                doNotAnimate = true;
                return;

            case 81: // Q - Rotate left
            case 113:
                if (!$.browser.webkit) {
                    doNotAnimate = true;
                    break;
                }
                /*rotationZMatrix = $M([
  [Math.cos(c), Math.sin(-c), 0, 0],
  [Math.sin(c), Math.cos( c), 0, 0],
  [0,0,1,0],
  [0,0,0,1]
])*/
                translationMatrix = new WebKitCSSMatrix("matrix3d(" + cos(TURN).toFixed(10) + "," + sin(-TURN).toFixed(10) + ",0,0," +
                    +sin(TURN).toFixed(10) + "," + cos(TURN).toFixed(10) + ",0,0" +
                    ",0,0,1,0" +
                    ",0,0,0,1)");
                transformer.style.webkitTransform = translationMatrix.multiply(origMat).toString();
                doNotAnimate = true;
                return;
            case 90: // Z - Rotate right
            case 122:
                if (!$.browser.webkit) {
                    doNotAnimate = true;
                    break;
                }
                translationMatrix = new WebKitCSSMatrix("matrix3d(" + cos(-TURN).toFixed(10) + "," + sin(TURN).toFixed(10) + ",0,0," +
                    +sin(-TURN).toFixed(10) + "," + cos(-TURN).toFixed(10) + ",0,0" +
                    ",0,0,1,0" +
                    ",0,0,0,1)");
                transformer.style.webkitTransform = translationMatrix.multiply(origMat).toString();
                doNotAnimate = true;
                return;
            case 192: // `
            case 223:
                /* // MATRIX DECOMPOSITION - DOESN'T WORK WELL FOR SOME REASON
                transformer = document.getElementById("transformer");
                origMat = new WebKitCSSMatrix(window.getComputedStyle(transformer).webkitTransform);
                translationMatrix = new WebKitCSSMatrix(origMat);
                var decompose = translationMatrix.decompose();
                alert("translate3d(" + decompose.translate.x + "px," + decompose.translate.y + "px," + decompose.translate.z + "px) \nrotateX(" + decompose.rotate.x + "rad) rotateY(" + decompose.rotate.y + "rad) rotateZ(" + decompose.rotate.z + "rad)\nscale3d(" + decompose.scale.x + "," + decompose.scale.y + "," + decompose.scale.z + ")");
                //alert("translate3d(" + parseFloat(decompose.translate.x.toFixed(2)) + "px," + parseFloat(decompose.translate.y.toFixed(2)) + "px," + parseFloat(decompose.translate.z.toFixed(2)) + "px) \nrotateX(" + parseFloat(decompose.rotate.x.toFixed(4)) + "rad) rotateY(" + parseFloat(decompose.rotate.y.toFixed(4)) + "rad) rotateZ(" + parseFloat(decompose.rotate.z.toFixed(4)) + "rad)\nscale3d(" + parseFloat(decompose.scale.x.toFixed(3)) + "," + parseFloat(decompose.scale.y.toFixed(3)) + "," + parseFloat(decompose.scale.z.toFixed(3)) + ")");
                */
                var currentTarget = getCurrentTarget();
                var x = (currentTarget.x - currentTarget.regX * currentTarget.scaleX + manX);
                var y = (currentTarget.y - currentTarget.regY * currentTarget.scaleY + manY);
                var z = (currentTarget.z - currentTarget.regZ * currentTarget.scaleZ + manZ);

                var rx = currentTarget.rotationX - manRX;
                var ry = currentTarget.rotationY - manRY;
                var rz = currentTarget.rotationZ - manRZ;

                var size = currentTarget.scaleX * 1920;

                alert("s.addTarget(" + x + "," + y + "," + z + "," + rx + "," + ry + "," + rz + "," + size + ",3000);");
                break;
                // numlock=144, /=111, *=106, -=109
                // 7=
                // 
            case 48 + 1:
                manX += MOVE;
                break;
            case 48 + 2:
                manX -= MOVE;
                break;
            case 48 + 3:
                manZ += MOVE;
                break;
            case 48 + 4:
                manZ -= MOVE;
                break;
            case 48 + 5:
                manY += MOVE;
                break;
            case 48 + 6:
                manY -= MOVE;
                break;
            case 48 + 7:
                manRX += TURN;
                break;
            case 48 + 8:
                manRX -= TURN;
                break;
            case 48 + 9:
                manRZ += TURN;
                break;
            case 48 + 0:
                manRZ -= TURN;
                break;
            case 189: // -
                manRY += TURN;
                break;
            case 187: // =
                manRY -= TURN;
                break;
        }
        if ((keynum > 47 && keynum < 58) || keynum == 189 || keynum == 187) {
            moveParams.manual = true;
            performMoves(true);
            return;
        }
    };
}


//this.insertSlide = function (slideNum, html) {
//    if (slideNum < 1){
//    return;
//    }
//    slideNum = slideNum > numSlides() ? numSlides() : slideNum - 1;


//    targets.splice(slideNum-1)

//};


