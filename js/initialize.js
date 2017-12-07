/*
    Here initialization should be done.
    The DOM is save to manipulate, and tasks that are necessary before the user
    sees the user interface should be done here. (E.G eventListeners)
 */






var variableModule;
var recordsModule;

$(document).ready(function(){



    var INIT_VERBOSE = true;
    function initLogIfVerbose(message) {
        if(INIT_VERBOSE){
            console.log(message);
        }
    };

    var loadRecordRack = function(){
        initLogIfVerbose("------------Loading Rack------------");
        
        $.ajax({
            type: "GET",
            url: "xmlfiles/records.xml",
            dataType: "xml",
            success: parseRecords,
            error: function(jqXHR, textStatus, errorThrown){
                initLogIfVerbose("   ------------Error Loading XML File------------");
                initLogIfVerbose("       Status: " + textStatus);
                initLogIfVerbose("       Error Thrown: " + errorThrown);
                initLogIfVerbose("   ------------END------------");
                $('.init-message p').html("ERROR: " + errorThrown);
            },
        });
    };

    var parseRecords;
    parseRecords = function (xml) {
        initLogIfVerbose("------------Successfully loaded XML------------");
        initLogIfVerbose("------------Extracting Records from XML------------");
        var recordListXML, recordToBeParsed, records = [], record, side, sideToParse;

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
                side[j] = sideToParse[j].childNodes[0].nodeValue;
            }

            record['side_a'] = side;

            sideToParse = recordToBeParsed.getElementsByTagName('side')[1].getElementsByTagName('song');
            side = [];

            for (var j = 0; j < sideToParse.length; j++) {
                side[j] = sideToParse[j].childNodes[0].nodeValue;
            }

            record['side_b'] = side;

            records[i] = record;
            initLogIfVerbose(record);
        }

        recordsModule = (function () {
            var recordsData;

            recordsData = records;

            return{
                getIndex: function(i){
                    return recordsData[i];
                },

                length: function(){
                    return recordsData.length;
                }
            }
        })();

        initLogIfVerbose("------------END------------");
        setupAlbumSelection();
        $(".init-element").remove();
    };

    function setupAlbumSelection(){
        var recordContainer, record, url ,recordList;
        initLogIfVerbose("------------Setting up Album Selection------------");
        recordList = $('.album-list-wrapper');
        for(var i = 0; i < recordsModule.length() - 1; i++){
            record = recordsModule.getIndex(i);
            initLogIfVerbose(record);
            recordList.append('<div></div>');
            recordContainer = recordList.children().last();
            recordContainer.attr('list-id', i);
            recordContainer.click(function(evt){
                console.log(recordsModule.getIndex($(evt.target).attr('list-id')));
                displayInPreview(recordsModule.getIndex($(evt.target).attr('list-id')));
            })
            url = 'url(\" images/'+ record['record_cover']+'")';
            recordContainer.css('background-image',url );

        }
        initLogIfVerbose("------------End------------");
    }

    function displayInPreview(record){
        initLogIfVerbose("------------Previewing Record------------");
        var previewContainer, side, sidePreview;

        previewContainer = $('.preview-wrapper');
        previewContainer.children('.preview-album-cover')
            .css('background-image', 'url(\" images/'+ record['record_cover']+'")');

        side = record['side_a'];

        sidePreview = $('.preview-side-A ul');
        sidePreview.children().remove();

        sidePreview.append('<h4>Side A</h4>')
        for(var i = 0; i < side.length; i++){
            sidePreview.append('<li>'+ side[i] +'</li>')
        }

        side = record['side_b'];

        sidePreview = $('.preview-side-B ul');
        sidePreview.children().remove();

        sidePreview.append('<h4>Side B</h4>')
        for(var i = 0; i < side.length; i++){
            sidePreview.append('<li>'+ side[i] +'</li>')
        }
    }

    var parseLabview = function(xml){
        initLogIfVerbose("------------Successfully loaded XML------------");
        initLogIfVerbose("------------Extracting Variables from XML------------");
        var variableListXML = xml.getElementsByTagName("variable");
        initLogIfVerbose("       Number found: " + variableListXML.length);
        var varEntry, name, type, varInfos = [];
        for(var i = 0; i < variableListXML.length; i++){
            varEntry = variableListXML[i];
            type = varEntry.childNodes[1].childNodes[1].nodeName;
            name = "."+varEntry.getAttribute("name");

            varInfos[i] = [];
            varInfos[i]['name'] = name;
            varInfos[i]['type'] = type;
            varInfos[i]['length'] = name.length;
            varInfos[i]['handle'] = null;
            varInfos[i]['typeSize'] = getSizeFromDataType(type);
            varInfos[i]['value'] = null;
            initLogIfVerbose("       Name: " + name +
                ", Type: " + type +
                ", Length: " + varInfos[i]['length'] +
                ", TypeSize: " + varInfos[i]['typeSize'] +
                ", Value: " + varInfos[i]['value']);
        }
        initLogIfVerbose("------------END------------");

        variableModule = (function () {

            var variableData, myPrivateMethod;

            // A private counter variable
            variableData = varInfos;

            // A private function which logs any arguments
            myPrivateMethod = function( foo ) {
                console.log( foo );
            };

            return {

                // A public variable
                myPublicVar: "foo",

                // A public function utilizing privates
                get: function( int ) {
                    return variableData[int];
                },

                setHandle: function(int, handle){
                    variableData[i]['handle'] = handle;
                },
            };

        })();
        loadRecordRack();
    };

    $.ajax({
        type: "GET",
        url: "xmlfiles/Labview.xml",
        dataType: "xml",
        success: parseLabview,
        error: function(jqXHR, textStatus, errorThrown){
            initLogIfVerbose("   ------------Error Loading XML File------------");
            initLogIfVerbose("       Status: " + textStatus);
            initLogIfVerbose("       Error Thrown: " + errorThrown);
            initLogIfVerbose("   ------------END------------");
            $('.init-message p').html("ERROR: " + errorThrown);
        }
    });

});


