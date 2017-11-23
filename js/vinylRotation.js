$('document').ready(function(){

    var rotation = 0;
    var degrees = 30;
    var vinyl = $('.vinyl');
    var vinylContainer = $('.vinyl-container');
    var draging = false;

    var offset = vinylContainer.offset();
    var width = vinylContainer.width();
    var height = vinylContainer.height();

    var centerX = offset.left + width / 2;
    var centerY = offset.top + height / 2;

    vinylContainer.mousedown(function(eve){
        var offsetX = eve.offsetX;
        var offsetY = eve.offsetY;
        console.log("X: " + offsetX + ", Y: " + offsetY);
        draging = true;
    });

    vinylContainer.mouseup(function(eve){
        var offsetX = eve.offsetX;
        var offsetY = eve.offsetY;
        console.log("X: " + offsetX + ", Y: " + offsetY);
        draging = false;
    });

    $(document).mousemove(function(eve){
        if(draging) {
            console.log("MOVE");
            var offsetX = eve.offsetX;
            var offsetY = eve.offsetY;
            console.log("X: " + offsetX + ", Y: " + offsetY);
            var angleDeg = Math.atan2(offsetY - centerY, offsetX - centerX) * 180 / Math.PI;
            console.log(angleDeg)
        }
    });
});