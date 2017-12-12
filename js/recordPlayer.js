$(document).ready(function(){
    var recordPlayer = (function(){
        var currentRecord = null,
            currentSide = null,
            currentSong = null,
            playing = false,
            adsWebService = null,
            STARTING_POINT = 0;

        function isInt(value) {
            var x;
            if (isNaN(value)) {
                return false;
            }
            x = parseFloat(value);
            return (x | 0) === x;
        }

        function displayInPlayingContainer(){
            var songSelectionContainer =  $('.song-selection-container');
            var record = recordsModule.getIndex(currentRecord);
            var sideList, recordSideList;

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
                sideList.append('<li>' + i + '. ' + recordSideList[i] + '</li>')
                if(currentSide === 0 && i === 0){
                    sideList.children().last().append('  <small>playing</small>')
                }
            }

            sideList = songSelectionContainer
                .children('.side-B')
                .children('ul');

            recordSideList= record['side_b'];

            sideList
                .children()
                .remove();

            for(var i = 0; i < recordSideList.length; i++){
                sideList.append('<li>' + i + '. ' + recordSideList[i] + '</li>')
                if(currentSide === 1 && i === 0){
                    sideList.children().last().append(' <small>playing</small>')
                }
            }

            NotificationModule.displayNotification("Spiele <b>" + record['record_name'] + "</b> from <b>" + record['artist'] + "</b>, Seite " +
                (currentSide === 0 ? 'A' : 'B'));
        }

        return{
            play: function(record, side){
                var wrongParameters = false,
                    error = "";

                if(!isInt(record)){
                    wrongParameters = true;
                    error += record + ", ";
                }
                if(!isInt(side) || side < 0 || side > 1){
                    wrongParameters = true;
                    error += side + ", ";
                }
                if(wrongParameters){
                    console.log("Wrong parameters: " + error);
                }
                if(currentRecord === record && currentSide === side){
                    NotificationModule.displayWarning("Bereits am Spielen");
                    return;
                }
                currentRecord = record;
                currentSide = side;
                currentSong = STARTING_POINT;
                playing = true;
                displayInPlayingContainer();
            },
            start: function(){
                if(playing){
                    return 0;
                }
                playing = true;
                NotificationModule.displayNotification("Start");
            },
            stop: function(){
                if(! playing){
                    return 0;
                }
                playing = false;
                NotificationModule.displayWarning("Stop");
            },
            togglePlaying: function() {
                if(playing){
                    this.stop();
                }
                else{
                    this.start();
                }
            },
            toString: function(){
                return "Record: " + currentRecord + ", Side: " + currentSide + " , Song: " + currentSong + " ,Playing: " + playing;
            }
        }
    })();

    window.RecordPlayer = recordPlayer;
});