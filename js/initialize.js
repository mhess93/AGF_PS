/*
    Here initialization should be done.
    The DOM is save to manipulate, and tasks that are necessary before the user
    sees the user interface should be done here. (E.G eventListeners)
 */

var variableModule;

$(document).ready(function(){

    var initCount = 0;
    var loopDelay = 500;

    var initialized = function(name){
        initCount++;
        console.log(name + " initialized");
        if(initCount >= 3){
            TwincatConnectionModule.startReadWrite();
            initializeSubscribers();
            $(".init-element").remove();
        }
    };

    var forceInit = function (){
        $(".init-element").remove();
    }

    function initializeSubscribers(){
        TwincatConnectionModule.subscribe("ActRack",RecordPlayer.updatePlayingContainer);

        TwincatConnectionModule.subscribe('ActSide',RecordPlayer.updatePlayingContainer);

        TwincatConnectionModule.subscribe('ActSong',RecordPlayer.updatePlayingContainer);
    }

    window.initialized = initialized;
    window.forceInit = forceInit;

    NotificationModule.init();
    RecordsModule.init();
    TwincatConnectionModule.init();

    //TwincatConnectionModule.startReadWrite();

    $('.prevent-contextmenu').bind('contextmenu',function(e){
        console.log("Prevent");
        e.preventDefault();
    });

    $('.fullscreen-button').click(function(){
        $('.body-wrapper').toggleClass('active');
    });

    $('.toggle-controls-albums').click(function(){
        $('.controls.left-side').toggleClass('active');
    });

    $('.song-controls').find('.play-button').click(function(){
        RecordPlayer.start();
    });

    $('.song-controls').find('.stop-button').click(function(){
        RecordPlayer.stop();
    });

    $('#skip-forward-button').click(function(){
        RecordPlayer.skipForward();
    });

    $('#skip-backward-button').click(function(){
        RecordPlayer.skipBackward();
    });

    var increaseLoop;
    $('#increase-volume-button').bind('touchstart mousedown',function(){
        increaseLoop = window.setInterval(function(){
            RecordPlayer.increaseVolume();
        }, loopDelay);
    });

    $('#increase-volume-button').bind('touchend mouseup', function(){
        clearInterval(increaseLoop);
    });

    var decreaseLoop;
    $('#decrease-volume-button').bind('touchstart mousedown', function(){
        decreaseLoop = window.setInterval(function(){
            RecordPlayer.decreaseVolume();
        }, loopDelay);
    });

    $('#decrease-volume-button').bind('touchend mouseup', function(){
        clearInterval(decreaseLoop);
    });

    $('#mute-button').click(function(){
        TwincatConnectionModule.toggleMute();
    });

    $('.playmode-button').click(function(evt){
        var target = $(evt.target);
        if(target.hasClass('active')){
            target.removeClass('active');
        }else{
            $('.playmode-button').removeClass('active');
            target.addClass('active');
        }
    });


});


