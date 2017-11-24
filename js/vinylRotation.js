$('document').ready(function(){

    var rotation = 0;
    var degrees = 30;
    var vinyl = $('.vinyl');
    var vinylContainer = $('.vinyl-container');

    var offset = vinylContainer.offset();
    var width = vinylContainer.width();
    var height = vinylContainer.height();

    var centerX = offset.left + width / 2;
    var centerY = offset.top + height / 2;

    vinylContainer.propeller({inertia: 0, speed: 1});
});