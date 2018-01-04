$(document).ready(function(){

    var recordPlayer = (function(){
        var currentRecord = null,
            currentSide = null,
            currentSong = null;

        function isInt(value) {
            var x;
            if (isNaN(value)) {
                return false;
            }
            x = parseFloat(value);
            return (x | 0) === x;
        }

        function displayInPlayingContainer(recordNr,side,song){
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
                if(side === 0 && displayedIndex === song){
                    sideList.children().last().addClass("active");
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
                displayedIndex = i + 1;
                elementToAppend = $('<li>' + displayedIndex + '. ' + recordSideList[i] + '</li>');
                sideList.append(elementToAppend);
                elementToAppend.click({index: displayedIndex}, function(event){
                    fetchRecord(recordNr, 1, event.data.index);
                });
                if(side === 1 && displayedIndex === song){
                    sideList.children().last().addClass("active");
                }
            }
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
        }

        function sideToString(){
            return "side_" + (currentSide === 0 ? 'a' : 'b');
        }

        var fetchRecord = function(recordNr, side, song){
            /*
                var wrongParameters = false,
                    error = "";

                if(!isInt(recordNr)){
                    wrongParameters = true;
                    error += "Records: " +  recordNr + ", ";
                }
                if(!isInt(side) || side < 0 || side > 1){
                    wrongParameters = true;
                    error += "Side: " + side + ", ";
                }
                if(song > RecordsModule.getIndex(recordNr)[sideToString()].length || song < 1){
                    wrongParameters = true;
                    error += "Song: " +song + ", ";
                }
                if(wrongParameters){
                    console.log("Wrong parameters: " + error);
                    return;
                }
                if(currentRecord === recordNr && currentSide === side && currentSong === song){
                    NotificationModule.displayWarning("Bereits am Spielen");
                    return;
                }
                */

                /*
                currentRecord = record;
                currentSide = side;
                currentSong = song;
                playing = true;
                */
                TwincatConnectionModule.fetchRecord(recordNr,side,song);
                var record = RecordsModule.getIndex(recordNr);
                //displayInPlayingContainer(recordNr,side,song);
                NotificationModule.displayNotification("Spiele <b>" + record['record_name'] + "</b> from <b>" + record['artist'] + "</b>, Seite " +
                    (side === 0 ? 'A' : 'B'));
            };

        var toString =  function(){
            return "Record: " + currentRecord + ", Side: " + currentSide + " , Song: " + currentSong;
        };

        return{

            displayRecordInPlayingContainer: displayRecordInPlayingContainer,

            fetchRecord: fetchRecord,
            playSide: function(record, side){
                fetchRecord(record, side, 1);
            },
            start: function(){
                NotificationModule.displayNotification("Start");
                TwincatConnectionModule.start();
            },
            stop: function(){
                NotificationModule.displayWarning("Stop");
                TwincatConnectionModule.stop();
            },
            skipForward: function(){
                NotificationModule.displayWarning("Vorwärts");
                TwincatConnectionModule.skipForward();
            },
            skipBackward: function(){
                NotificationModule.displayWarning("Rückwärts");
                TwincatConnectionModule.skipBackward();
            },
            increaseVolume: function(){
                console.log("Increase Volume");
                TwincatConnectionModule.increaseVolume();
            },

            decreaseVolume: function(){
                console.log("Decrease Volume");
                TwincatConnectionModule.decreaseVolume();
            },

            updatePlayingContainer: function(){
                console.log("Update");
                var newRecord = TwincatConnectionModule.getActRecord(),
                    newSide = TwincatConnectionModule.getActSide(),
                    newSong = TwincatConnectionModule.getActSong() - 1,
                    sideList;

                if (newRecord !== currentRecord) {
                    currentRecord = newRecord;
                    currentSide = newSide;
                    currentSong = newSong;
                    displayRecordInPlayingContainer(newRecord);

                    if(newSide === 0){
                        sideList = $('.song-selection-container').children('.side-A').find('li');
                    }

                    if(newSide === 1){
                        sideList = $('.song-selection-container').children('.side-B').find('li');
                    }
                    $(sideList[newSong]).addClass('active');
                }
                else if(newSide !== currentSide){
                    currentSide = newSide;
                    currentSong = newSong;

                    $('.song-selection-container').find('li').removeClass('active');

                    if(newSide === 0){
                        sideList = $('.song-selection-container').children('.side-A').find('li');
                    }

                    if(newSide === 1){
                        sideList = $('.song-selection-container').children('.side-B').find('li');
                    }
                    $(sideList[newSong]).addClass('active');
                }else{
                    currentSong = newSong;
                    if(newSide === 0){
                        sideList = $('.song-selection-container').children('.side-A').find('li');
                    }

                    if(newSide === 1){
                        sideList = $('.song-selection-container').children('.side-B').find('li');
                    }

                    sideList.removeClass('active');
                    $(sideList[newSong]).addClass('active');
                }
            },

            toString: toString
        }
    })();

    window.RecordPlayer = recordPlayer;
});