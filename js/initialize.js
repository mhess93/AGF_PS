/*
    Here initialization should be done.
    The DOM is save to manipulate, and tasks that are necessary before the user
    sees the user interface should be done here. (E.G eventListeners)
 */

$(document).ready(function(){

    var initCount = 0;
    var timeout = 5000;
    var initMessage = $(".init-element").children('p').first();
    var loopDelay = 1000;

    function initializeSubscribers(asd){
        TwincatConnectionModule.subscribeTo('ActRack', RecordsModule.displayRecordInPlayingContainer);
        TwincatConnectionModule.subscribeTo('SideTwo', RecordsModule.updateActiveInPlayingContainer);
        TwincatConnectionModule.subscribeTo('ActSong', RecordsModule.updateActiveInPlayingContainer);
        TwincatConnectionModule.subscribeTo('StatusWord', function(statusWord){
            console.log(statusWord);
        });
        moduleInitSuccess('Subscribers');
        /*
        TwincatConnectionModule.subscribeTo('PlaymodeRepeatAll', function(isActive){
          var bool = new Boolean(isActive);
          var button = $('#repeat-all-button');
          if(button.hasClass('active') && !isActive){
            button.removeClass('active');
          }
          else if( !button.hasClass('active') && isActive){
            button.addClass('active');
          }
        });
        TwincatConnectionModule.subscribeTo('PlaymodeRepeatOne', function(isActive){
          var bool = new Boolean(isActive);
          var button = $('#repeat-one-button');
          if(button.hasClass('active') && !isActive){
            button.removeClass('active');
          }
          else if( !button.hasClass('active') && isActive){
            button.addClass('active');
          }
        });
        TwincatConnectionModule.subscribeTo('PlaymodeShuffleAll', function(isActive){
          var bool = new Boolean(isActive);
          var button = $('#shuffle-all-button');
          if(button.hasClass('active') && !isActive){
            button.removeClass('active');
          }
          else if( !button.hasClass('active') && isActive){
            button.addClass('active');
          }
        });
        */
    }

    window.moduleInitSuccess = function(name){
        console.log(name + " init success")
        initCount++;
        setTimeout(initialize, 0);
    }

    window.moduleInitFail = function(name){
        console.error(name + " init failed, trying again in " + timeout + " milisec");
        initMessage.text(name + " init failed, trying again in " + timeout + " milisec");
        setTimeout(initialize, timeout);
    }

    function initialize(){
        if(initCount === 0){
            initMessage.text("Initializing RecordModule");
            RecordsModule.init();
            return;
        }
        else if(initCount === 1){
            initMessage.text("Initializing Twincatmodule");
            TwincatConnectionModule.devInit();
            return;
        }
        else if(initCount === 2){
          initMessage.text("Initializing Subscribers");
            initializeSubscribers();
        }
        else if(initCount === 3){
            initMessage.text("Setting up Handlers");
            initHandlers();
            return;
        }
        else if(initCount === 4){
            initMessage.text("Setting Up NotificationModule");
            NotificationModule.init();
            return;
        }
        else if(initCount === 5){
            $(".init-element").remove();
            //TwincatConnectionModule.toggleFakeLoop();
            console.log("Init Successfull");
            NotificationModule.displayNotification("Init Successfull");
            return;
        }
    }

    initialize();

    function initHandlers(){

        $('.toggle-controls-albums').click(function(){
            $('.controls.left-side').toggleClass('active');
        });

        $('.song-controls').find('.play-button').click(function(){
            TwincatConnectionModule.start();
        });

        $('.song-controls').find('.stop-button').click(function(){
            TwincatConnectionModule.stop();
        });

        $('#skip-forward-button').click(function(){
            TwincatConnectionModule.skipForward();
        });

        $('#skip-backward-button').click(function(){
            TwincatConnectionModule.skipBackward();
        });

        var increaseLoop;
        $('#increase-volume-button').bind('touchstart mousedown',function(){
            increaseLoop = window.setInterval(function(){
                TwincatConnectionModule.increaseVolume();
            }, loopDelay);
        });

        $('#increase-volume-button').bind('touchend mouseup', function(){
            clearInterval(increaseLoop);
        });

        var decreaseLoop;
        $('#decrease-volume-button').bind('touchstart mousedown', function(){
            decreaseLoop = window.setInterval(function(){
                TwincatConnectionModule.decreaseVolume();
            }, loopDelay);
        });

        $('#decrease-volume-button').bind('touchend mouseup', function(){
            clearInterval(decreaseLoop);
        });

        $('#mute-button').click(function(){
            TwincatConnectionModule.toggleMute();
        });

        $('.repeat-all-button').click(function(){
          if($(this).hasClass('active')){
            $('.playmode-button').removeClass('active');
          }else{
            $('.playmode-button').removeClass('active');
            $(this).addClass('active');
          }
          TwincatConnectionModule.togglePlaymodeRepeatAll();
        });

        $('.repeat-one-button').click(function(){
          if($(this).hasClass('active')){
            $('.playmode-button').removeClass('active');
          }else{
            $('.playmode-button').removeClass('active');
            $(this).addClass('active');
          }
          TwincatConnectionModule.togglePlaymodeRepeatOne();
        });

        $('.shuffle-all-button').click(function(){
          if($(this).hasClass('active')){
            $('.playmode-button').removeClass('active');
          }else{
            $('.playmode-button').removeClass('active');
            $(this).addClass('active');
          }
          TwincatConnectionModule.togglePlaymodeShuffleAll();
        });

        $('.preview-side-A, .preview-side-B').click(RecordsModule.handlePossiblePlaySelection);

        $('.play-selected-button').click(RecordsModule.playSelected);

        $('.vinyl-container').propeller({});

        moduleInitSuccess("Handlers");
    }

    function moduleInitializationFailed(name){
        console.error(name + ' initialization failed');
        setTimeout(initialize,100000);
    }

    window.forceInit = function (){
        initCount = 5;
        $(".init-element").remove();
    };

    window.continueInit = function(){
        initCount++;
    }



/*

    initialize();

    /*
    RecordsModule.init();
    TwincatConnectionModule.init()
        .then(initializeSubscribers);
        */
    /*
    window.initialized  = function(name){
        initCount++;
        console.log(name + " initialized");

        if(initCount > 1){
            //TwincatConnectionModule.startReadWrite();
            $(".init-element").remove();
        }
    };
    */

    //TwincatConnectionModule.startReadWrite();

    /*

    $('.prevent-contextmenu').bind('contextmenu',function(e){
        console.log("Prevent");
        e.preventDefault();
    });

    $('.fullscreen-button').click(function(){
        $('.body-wrapper').toggleClass('active');
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

    */


});
