$(document).ready(function(){
    var recordsModule = (function(){

        var records = [];

        var resolve;

        var moduleName = 'Recordmodule';
        var backupCover = "url(\" images/logo.png \")";

        var init = function(){
            return new Promise(function(resolveFunc, rejectFunc){
                resolve = resolveFunc;
                reject = rejectFunc;
                $.ajax({
                    type: "GET",
                    url: "xmlfiles/records_ANSII.xml",
                    dataType: "xml"
                })
                    .done(parseRecords)
                    .fail(
                        function(jqXHR, textStatus, errorThrown){
                            $('.init-message p').html("Error in RecordsModule: " + errorThrown);
                            console.log(errorThrown);
                            moduleInitFail(moduleName);
                            reject();
                        });
            });
        };

        var parseRecords = function (xml) {
            var recordListXML, recordToBeParsed, record, side, sideToParse;

            recordListXML = xml.getElementsByTagName("record");
            for (var i = 0; i < recordListXML.length; i++) {
                recordToBeParsed = recordListXML[i];
                record = [];
                record['record_name'] = recordToBeParsed.getElementsByTagName('record_name')[0].childNodes[0].nodeValue;
                record['artist'] = recordToBeParsed.getElementsByTagName('artist')[0].childNodes[0].nodeValue;
                record['record_cover'] = recordToBeParsed.getElementsByTagName('record_cover')[0].childNodes[0].nodeValue;
                record['rack_slot'] = recordToBeParsed.getElementsByTagName('rack_slot')[0].childNodes[0].nodeValue;

                sideToParse = recordToBeParsed.getElementsByTagName('side')[0].getElementsByTagName('song');
                side = [];

                for (var j = 0; j < sideToParse.length; j++) {
                    side[j] = sideToParse[j].getElementsByTagName('title')[0].childNodes[0].nodeValue;
                }

                record['side_a'] = side;

                sideToParse = recordToBeParsed.getElementsByTagName('side')[1].getElementsByTagName('song');
                side = [];

                for (j = 0; j < sideToParse.length; j++) {
                    side[j] = sideToParse[j].getElementsByTagName('title')[0].childNodes[0].nodeValue;
                }

                record['side_b'] = side;

                records[i] = record;
            }
            setupAlbumSelection();
        };

        function setupAlbumSelection(){
            var recordContainer, record, url ,recordList;
            recordList = $('.album-list-wrapper');
            for(var i = 0; i < records.length; i++){
                record = records[i];
                recordList.append('<div></div>');
                recordContainer = recordList.children().last();
                recordContainer.attr('list-id', i);
                recordContainer.click(function(evt){
                    displayInPreview($(evt.target).attr('list-id'));
                    $('.album-list-wrapper').children('div').removeClass('active');
                    $(evt.target).addClass('active');
                });
                url = 'url(\" images/'+ record['record_cover']+'")';
                url += ", " + backupCover;
                console.log(url);
                recordContainer.css('background-image',url );
            }
            resolve(recordList);
            displayInPreview(0);

            moduleInitSuccess(moduleName);
        }

        function displayInPreview(index){
            var previewContainer, side, sidePreview;
            var record = records[index];

            $('.possible-play-selection, .possible-side-selection').removeClass('active');
            previewContainer = $('.preview-wrapper');

            var url = 'url(\" images/'+ record['record_cover']+'")' + ", " + backupCover;

            previewContainer.children('.preview-album-cover')
                .css('background-image', url);

            previewContainer.children('.preview-album-information')
                .html('<b>' + record['record_name'] + ', ' + record['artist'] + '</b>');

            side = record['side_a'];

            sidePreview = $('.preview-side-A ul');
            sidePreview.children().remove();

            sidePreview.append('<h4 class="possible-side-selection">Side A</h4>');
            for(var i = 0; i < side.length; i++){
                sidePreview.append('<li class="possible-play-selection">'+ (i + 1)+ ". " + side[i] +'</li>')
            }

            side = record['side_b'];

            sidePreview = $('.preview-side-B ul');
            sidePreview.children().remove();

            sidePreview.append('<h4 class="possible-side-selection">Side B</h4>');
            for(i = 0; i < side.length; i++){
                sidePreview.append('<li class="possible-play-selection">'+ (i + 1)+ ". " + side[i] +'</li>')
            }
        }

        function playSelected(evt){
          console.log($('.possible-play-selection.active, .possible-side-selection.active'));
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

        return{
            init: init,

            getIndex: function(index) {
                return records[index];
            },

            getRecords: function(){
                return records;
            },

            length: function () {
                return records.length;
            },

            playSelected: playSelected,

            displayRecordInPlayingContainer : displayRecordInPlayingContainer
        }
    })();

    window.RecordsModule = recordsModule;
});
