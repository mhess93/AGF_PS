/*
    Here initialization should be done.
    The DOM is save to manipulate, and tasks that are necessary before the user
    sees the user interface should be done here. (E.G eventListeners)
 */

$(document).ready(function(){

    var initCount = 0;

    function initializeSubscribers(asd){
        TwincatConnectionModule.subscribeTo('ActRack', displayRecordInPlayingContainer);
        TwincatConnectionModule.subscribeTo('ActSide', updateActiveInPlayingContainer);
        TwincatConnectionModule.subscribeTo('ActSong', updateActiveInPlayingContainer);
    }

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
                fetchRecord(recordNr, 0, event.data.index);
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
                fetchRecord(recordNr, 1, event.data.index);
            });
        }

        updateActiveInPlayingContainer();
    }

    function updateActiveInPlayingContainer(){
        var song, side, tempString, listContainer;

        song = TwincatConnectionModule.getActSong();
        side = TwincatConnectionModule.getActSide();

        if(side !== 0 && side !== 1){
            side = 0;
        }
        if(song === undefined){
            song = 0;
        }

        tempString = (side === 0) ? '.side-A' : '.side-B';
        console.log(song);
        console.log(side);

        listContainer = $('.song-selection-container');

        listContainer.find("li").removeClass('active')


        var sideList =  listContainer
            .children(tempString)
            .find('li');

        sideList[song].className += 'active';
    }

    function initialize(){
        if(initCount === 0){
            $(".init-element").html('Init. RecordsModule');
            RecordsModule.init();
        }
        else if(initCount === 1){
            $(".init-element").html('Init. TwincatModule');
            TwincatConnectionModule.init()
                .then(initializeSubscribers);
        }
        else if(initCount > 1){
            console.log("All Modules Initialized");
            //TwincatConnectionModule.startReadWrite();
            $(".init-element").remove();
        }
        else{
            console.error("Initialization failed");
        }
    }

    function moduleInitialized(name){
        console.log(name + " initialized");
        initCount++
        initialize();
    }

    function moduleInitializationFailed(name){
        console.error(name + ' initialization failed');
        setTimeout(initialize,100000);
    }

    window.moduleInitialized = moduleInitialized;
    window.moduleInitializationFailed = moduleInitializationFailed;

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

    window.forceInit = function (){
        $(".init-element").remove();
    };

    //TwincatConnectionModule.startReadWrite();

    /*

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

    */


});


