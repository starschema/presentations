// custom theme classes
$(document).ready(function(){
    $('#scene').addClass('sd-slide-background-color_1');
});


// kinetics 
var zoomerInit = new function () {
    this.set = function (s) {
        // location: x,y,z
        // rotation: rx,ry,rz. Use 0-360 to prevent carousel problems
        // width: w (height is calculated as 16*9)
        // reverse: come to the slide from the other direction
        // s.addTarget(x, y, z, rx, ry, rz, width);

        //s.addTarget(0, 0, 0, 0, 0, 0, 2000); // 1920/2=960





        s.setLocation(200, 900, 60, -90, 20, 0, 350, 100);

        s.addTarget(570, 545, -120, -90, -170, 0, 230, 1600); //slide2 
        s.addTarget(470, 730, 0, -90, -150, 0, 150, 1200); //slide1

        s.addTarget(1080, 750, 130, -90, -50, 0, 250, 1400);  //slide7

        s.addTarget(860, 530, -110, -90, -95, 0, 180, 1400);  //slide6

        s.addTarget(850, 170, 10, -90, -35, 0, 250, 2100);  //slide5
        s.addTarget(590, 20, 0, -90, -305, 0, 250, 2000); //slide4 
        s.addTarget(380, 320, -10, -90, -280, 0, 180, 1600);//slide3 




























        //good

        //s.setLocation(200, 900, 60, -90, 20, 0, 350, 100, 1000);
        //s.addTarget(470, 730, 0, -90, -150, 0, 150, 1200); //slide1
        //s.addTarget(440, 535, 0, -90, -150, 0, 230, 1600); //slide2 
        //s.addTarget(380, 320, -10, -90, -280, 0, 180, 1600);//slide3 
        //s.addTarget(590, 20, 0, -90, -305, 0, 250, 1600); //slide4 
        //s.addTarget(800, 160, 10, -90, -60, 0, 250, 2500);  //slide5
        //s.addTarget(840, 530, 0, -90, -70, 0, 180, 1400);  //slide6 
        //s.addTarget(1080, 750, 140, -90, -50, 0, 250, 1400);  //slide7 




        //s.setLocation(200, 900, 60, -90, 20, 0, 350, 100, 1000);

        //s.addTarget(390, 730, 0, -90, -150, 0, 150); //slide1  
        //s.addTarget(440, 555, 0, -90, -150, 0, 230); //slide2  

        //s.addTarget(470, -250, 0, -90, -270, 0, 210, 2000);  //slide3  


        //s.addTarget(140, 310, 90, -90, -260, 0, 180);  //slide4  
        //s.addTarget(330, 310, 30, -90, -350, 0, 180);
        //s.addTarget(590, 20, 0, -90, -305, 0, 250); //slide5 



        //s.addTarget(800, 160, 10, -90, -60, 0, 250, 2500);  //slide6 

        //s.addTarget(840, 490, 0, -90, -90, 0, 180);  //slide7  


        //s.addTarget(1080, 750, 140, -90, -50, 0, 250);  //slide8 













    };
} // GLIDE