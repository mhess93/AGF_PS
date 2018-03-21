$(document).ready(function(){
    var recordsModule = (function(){

        var records = [];

        var resolve;

        var moduleName = 'Recordmodule';

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
                    displayInPreview(records[$(evt.target).attr('list-id')], $(evt.target).attr('list-id'));
                    $('.album-list-wrapper').children('div').removeClass('active');
                    $(evt.target).addClass('active');
                });
                url = 'url(\" images/'+ record['record_cover']+'")';
                recordContainer.css('background-image',url );
            }
            resolve(recordList);
            moduleInitSuccess(moduleName);
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
                TwincatConnectionModule.fetchRecord(index, 0, 0);
                $('.controls.left-side').toggleClass('active');
            });

            $('.play-button.side-B').click(function(){
                TwincatConnectionModule.fetchRecord(index, 1, 0);
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
