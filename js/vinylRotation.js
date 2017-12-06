$('document').ready(function(){
    var vinylContainer = $('.vinyl-container');

    vinylContainer.propeller({inertia: 0, speed: 1});

    vinylContainer.dblclick(function(){
        console.log("DB");

        console.log(vinylContainer.css('transform'));

        vinylContainer.css({
            '-webkit-transform' : 'scale(2)',
            '-moz-transform'    : 'scale(2)',
            '-ms-transform'     : 'scale(2)',
            '-o-transform'      : 'scale(2)',
            'transform'         : 'scale(2)'
        });
    });


});