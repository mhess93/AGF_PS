$(document).ready(function(){
    var recordsModule = (function(){

        var records = [];

        var init = function(){
            var status = 0;
            $.ajax({
                type: "GET",
                url: "xmlfiles/records.xml",
                dataType: "xml",
                success: parseRecords,
                error: function(jqXHR, textStatus, errorThrown){
                    $('.init-message p').html("ERROR: " + errorThrown);
                    console.log(errorThrown);
                }
            }).then(
                function(){

                },
                function(){
                    console.log("Error in Records Module");
                    status = 1;
                }
            );
            return status;
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
                    displayInPreview(records[$(evt.target).attr('list-id')], $(evt.target).attr('list-id'));
                    $('.album-list-wrapper').children('div').removeClass('active');
                    $(evt.target).addClass('active');
                });
                url = 'url(\" images/'+ record['record_cover']+'")';
                recordContainer.css('background-image',url );
            }
            initialized("Record Module");
        }

        function displayInPreview(record, index){
            var previewContainer, side, sidePreview;

            previewContainer = $('.preview-wrapper');
            previewContainer.children('.preview-album-cover')
                .css('background-image', 'url(\" images/'+ record['record_cover']+'")');

            previewContainer.children('.preview-album-information')
                .html('<b>' + record['record_name'] + ', ' + record['artist'] + '</b>');

            side = record['side_a'];

            sidePreview = $('.preview-side-A ul');
            sidePreview.children().remove();

            sidePreview.append('<h4>Side A</h4><div class="play-button side-A">\n' +
                '                        <a href="#"> <img src="images/play-button.svg"></a>\n' +
                '                    </div>');
            for(var i = 0; i < side.length; i++){
                sidePreview.append('<li>'+ (i + 1)+ ". " + side[i] +'</li>')
            }

            side = record['side_b'];

            sidePreview = $('.preview-side-B ul');
            sidePreview.children().remove();

            sidePreview.append('<h4>Side B</h4> <div class="play-button side-B">\n' +
                '                        <a href="#"> <img src="images/play-button.svg"></a>\n' +
                '                    </div>');
            for(i = 0; i < side.length; i++){
                sidePreview.append('<li>'+ (i + 1)+ ". " + side[i] +'</li>')
            }


            $('.play-button.side-A').click(function(){
                RecordPlayer.playSide(index, 0);
                $('.controls.left-side').toggleClass('active');
            });

            $('.play-button.side-B').click(function(){
                RecordPlayer.playSide(index, 1);
                $('.controls.left-side').toggleClass('active');
            });
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
            }
        }
    })();

    window.RecordsModule = recordsModule;
});