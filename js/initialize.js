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
        TwincatConnectionModule.subscribeTo('ActRack', RecordModule.displayRecordInPlayingContainer);
        TwincatConnectionModule.subscribeTo('ActSide', RecordModule.updateActiveInPlayingContainer);
        TwincatConnectionModule.subscribeTo('ActSong', RecordModule.updateActiveInPlayingContainer);
        TwincatConnectionModule.subscribeTo('StatusWord', function(statusWord){
            console.log(statusWord);
        });
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
/* Moved to RecordModule
    function displayRecordInPlayingContainer(recordNr){
        var record = RecordsModule.getIndex(recordNr);
        var songSelectionContainer =  $('.song-selection-container'),
            sideList,
            recordSideList,
            displayedIndex,
            elementToAppend;

        songSelectionContainer
            .children('h3')
            .html(record['record_name']);

        sideList = songSelectionContainer
            .children('.side-A')
            .children('ul');

        recordSideList= record['side_a'];
        sideList
            .children()
            .remove();

        for(var i = 0; i < recordSideList.length; i++){
            displayedIndex = i + 1;
            elementToAppend = $('<li>' + displayedIndex + '. ' + recordSideList[i] + '</li>');
            sideList.append(elementToAppend);
            elementToAppend.click({index: displayedIndex}, function(event){
                TwincatConnectionModule.fetchRecord(recordNr, 0, event.data.index - 1);
            });
        }

        sideList = songSelectionContainer
            .children('.side-B')
            .children('ul');

        recordSideList= record['side_b'];

        sideList
            .children()
            .remove();

        for(var i = 0; i < recordSideList.length; i++){
            displayedIndex = i + 1;
            elementToAppend = $('<li>' + displayedIndex + '. ' + recordSideList[i] + '</li>');
            sideList.append(elementToAppend);
            elementToAppend.click({index: displayedIndex}, function(event){
                TwincatConnectionModule.fetchRecord(recordNr, 1, event.data.index);
            });
        }

        updateActiveInPlayingContainer();
    }

    window.displayRecord = displayRecordInPlayingContainer;
*/

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
            initCount++;
            initialize();
            //TwincatConnectionModule.init()
            //    .then(initializeSubscribers);
            return;
        }
        else if(initCount === 2){
            initMessage.text("Setting up Handlers");
            initHandlers();
            return;
        }
        else if(initCount === 3){
            initMessage.text("Setting Up NotificationModule");
            NotificationModule.init();
            return;
        }
        else if(initCount === 4){
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

        $('.preview-side-A, .preview-side-B').click(handlePossiblePlaySelection);

        $('.play-selected-button').click(RecordsModule.playSelected);

        $('.vinyl-container').propeller({});

        moduleInitSuccess("Handlers");
    }

    function handlePossiblePlaySelection(evt){
      var target = $(evt.target);
      console.log(target);

      if(!target.hasClass('possible-side-selection')){
        var wasActive = target.hasClass('active');
        $('.possible-play-selection, .possible-side-selection').removeClass('active');
        if(!wasActive){
          target.addClass('active');
        }
      }
      else{
        var wasActive = target.parent().hasClass('active');
        $('.possible-play-selection, .possible-side-selection').removeClass('active');
        if(!wasActive){
          target.parent().addClass('active');
        }

      }
    }

    function moduleInitializationFailed(name){
        console.error(name + ' initialization failed');
        setTimeout(initialize,100000);
    }

    window.forceInit = function (){
        initCount = 4;
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
