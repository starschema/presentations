// custom theme classes
(function(){

   function AnimationLayer(idSelector, animate){
        this.elm = document.getElementById(idSelector);
        this.animate = animate;
   }

    var TO_nextSlide = false,
        c1, //represent cloud dom elements
        c3,
        tweenHasStarted = false,
        tweenHasStartedc1 = false,
        tlDelays = [1.25,1.6,2.2,1.1,1.1,1.1,1.9,1.5,1.7], //used to sync slide fade in with zoomer movement, per each of 9 positions(targets)
        tlDuration = [1.25, 1.6,1.8,1.6,1.6,1.2,1.55,1.55,1.4],
        numberOfTargets = 9,
        isEditor = window.EM_Editor;

    window.targetSlideNum = 0;

    $(document).ready(function(){
        var  $targetsTheme = $('.target'),
             $scene = $('#scene');
             $competabilityModeFlag = $('html').hasClass('explorer');

        // set the ground for begining
        $('.sd-element-chart.google-visualization-table-table').addClass('overflow-hidden'); // 
        if ($competabilityModeFlag && isEditor) { $('#slide-box').addClass('fallback_1'); }
        $scene.addClass('sd-slide-background-color_1 sd-world-background-image_1');

        $('.current-active-slide').css({'opacity':'1'});

        $scene.on('beforeTransitionStart', function (event, $currentSlideTheme, currentSlideNumTheme) {
            var slidePositionTheme = (currentSlideNumTheme % numberOfTargets == 0) ? numberOfTargets : currentSlideNumTheme % numberOfTargets,
                $targetsTheme = $('.target'),
                $currentTargetTheme = document.getElementById('target' + slidePositionTheme); // is the target you exit

            if (!$competabilityModeFlag && $currentTargetTheme){
                // for ( i=1; i < numberOfTargets + 1; i++ ){
                //     tlElement = document.getElementById('target' + i);
                //     if (typeof tlElement != undefined) { TweenLite.set(document.getElementById('target' + i), { alpha:0 }); }
                // }

                // $($currentTargetTheme).addClass('cloudFadeOutMark');
                TweenLite.set($currentTargetTheme, { alpha:1 });
                TweenLite.to($currentTargetTheme, tlDuration[slidePositionTheme - 1], { alpha:0 });
            }
        });

        $scene.on('transitionStart', function (event, slideNumTheme) {
            var slideNumberTheme = slideNumTheme,
                    slidePositionTheme = (slideNumberTheme % numberOfTargets == 0) ? numberOfTargets : slideNumberTheme % numberOfTargets,
                    $targetsTheme = $('.target'),
                    $currentTargetTheme = document.getElementById('target' + slidePositionTheme); // is the target you are headed fore

                window.targetSlideNum = slideNumTheme;

                $($currentTargetTheme).find('.sd-element-chart.google-visualization-table-table').addClass('overflow-hidden');

                if (!$competabilityModeFlag && $currentTargetTheme){

                    TweenLite.set($currentTargetTheme, { alpha:0 });
                    TweenLite.to($currentTargetTheme, tlDuration[slidePositionTheme - 1], { delay:tlDelays[slidePositionTheme - 1], alpha:1 });
                }

                if ($competabilityModeFlag && isEditor)
                {
                    $('#slide-box').addClass('fallback_' + slideNumTheme);
                }
        });

            $scene.on('transitionDone', function (event, slideNumDoneTheme) {
                var slidePositionDoneTheme = (window.targetSlideNum % numberOfTargets == 0) ? numberOfTargets : window.targetSlideNum % numberOfTargets,
                    tlElement,
                    $currentTargetDoneTheme = document.getElementById('target' + slidePositionDoneTheme), // is the target you are headed fore
                    $targetsDoneTheme = $('.target');

                for ( i=1; i < numberOfTargets + 1; i++ ){
                    tlElement = document.getElementById('target' + i);
                    if ( i != slidePositionDoneTheme && tlElement ) { TweenLite.to(tlElement, 0.3, { alpha:0 }); }
                }

                $targetsDoneTheme.css('pointer-events', 'none');
                $($currentTargetDoneTheme).css('pointer-events', 'all');

                // $('.cloudFadeOutMark').removeClass('cloudFadeOutMark');

                if ( !isEditor && !$competabilityModeFlag && $currentTargetDoneTheme) {
                    $('.current-active-slide .sd-element-chart.google-visualization-table-table').removeClass('overflow-hidden');

                    c3 = new AnimationLayer('c3', function () {
                        function tb() {
                            TweenLite.set(c3.elm, { rotationZ: 180 });
                            ts();
                        }
                        function ts() {
                            TweenLite.to(c3.elm, 300, { x: -750, z: 650, ease:Linear.easeNone, onComplete: tr });
                        }
                        function tr() {
                            TweenLite.set(c3.elm, { rotationZ: 0 });
                            te();
                        }
                        function te() {
                            TweenLite.to(c3.elm, 300, { x: 1200, z: 450, ease:Linear.easeNone, onComplete: tb });
                        }
                        TweenLite.set(c3.elm, { rotationX: 90, scale: 0.8 });
                        tb();
                    });
                    c3.animate();
                }
            });

        $("<div id='svg-animation'></div>").load("//resources.emaze.com/vbscenes/kinetics/css/animationSVG.html", null , function(e){
        }).appendTo(document.body);
    });

    // kinetics
    window.zoomerInit = new function () {
        this.set = function (s) {
            // location: x,y,z
            // rotation: rx,ry,rz. Use 0-360 to prevent carousel problems
            // width: w (height is calculated as 16*9)
            // reverse: come to the slide from the other direction
            // s.addTarget(x, y, z, rx, ry, rz, width,time);

            //s.addTarget(0, 0, 0, 0, 0, 0, 2000); // 1920/2=960
            s.setLocation(90, 90, 50, -90, -180, 0, 180, 0);

            s.addTarget(90, 90, 50, -90, -180, 0, 180, 2500, 'Quadratic.Out');          //slide 1

            s.addTarget(-10, 110, 240, -85, -180, 2, 180, 3200, 'Quadratic.Out');       //slide 2

            s.addTarget(60, 130, 470, -90, -180, 359, 120, 3600, 'Quadratic.Out');      //slide 3

            s.addTarget(80, 150, 530, -90, -180, 0, 80, 3200, 'Quadratic.Out');         //slide 4

            s.addTarget(110, 160, 600, -90, -180, 0, 80, 3200, 'Quadratic.Out');        //slide 5

            s.addTarget(90, 170, 680, -90, -180, 0, 80, 3300, 'Quadratic.Out');         //slide 6

            s.addTarget(80, 150, 620, -95, -180, 0, 80, 3100, 'Quadratic.Out');         //slide 7

            s.addTarget(90, 130, 450, -83, -180, 0, 120, 3100, 'Quadratic.Out');        //slide 8

            s.addTarget(90, 110, 370, -90, -180, 0, 180, 2800, 'Quadratic.Out');        //slide 9


            // var x = 30,
            //     y = 250,
            //     w = 180,
            //     scalar = w / 1920;
            // x = x + 960 + ( (-(1 - scalar) / 2) * 1920);
            // y = y + 540 + ( (-(1 - scalar) / 2) * 1080);
            // console.log('x: ' + Math.round(x) + ' | y: ' + Math.round(y));

            // http://sole.github.io/tween.js/examples/03_graphs.html - You use this syntax
            // but refer here http://easings.net/ for general information regarding easings and illustration

        }
    } // GLIDE

})();
