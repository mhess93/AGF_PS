$(document).ready(function(){

    var twincatConnection = (function(){
        var status = 0;
        var varInfos = [];
        var NETID = "192.168.1.128.1.1"; // Empty string for local machine;
        var PORT = "851"; // PLC Runtime
        var SERVICE_URL = "http://192.168.1.128/TcAdsWebService/TcAdsWebService.dll"; // HTTP path to the TcAdsWebService;
        var client;
        var general_timeout = 500;

        var readLoopID = null;
        var readLoopDelay = 500;

        var writeLoopID = null;
        var writeLoopDelay = readLoopDelay;

        var readWriter;
        var readWriterBase64Data;
        var writeWriter;
        var totalSize;

        var writeData = [];

        var initStatus;

        var nameToIndexTranslation = [];

        var init = function(){
            initStatus = 0;
            $.ajax({
                type: "GET",
                url: "xmlfiles/Labview.xml",
                dataType: "xml",
                error: function(jqXHR, textStatus, errorThrown){
                    $('.init-message p').html("ERROR: " + errorThrown);
                    initStatus = 1;
                }
            }).then(
                function(data){
                    parseLabview(data);
                    client = new TcAdsWebService.Client(SERVICE_URL, null, null);
                    fetchHandlesFromInformation();
                }
            ).then(
                function(){
                    initStatus = 0;
                }
            );
            return initStatus;
        };

        function parseLabview(xml){
            var variableListXML = xml.getElementsByTagName("variable");
            var varEntry, name, type;

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
                varInfos[i]['subscribers'] = [];
                varInfos[i]['subscribe'] = function(subscriber){
                    this.subscribers.push(subscriber);
                }
                varInfos[i]['update'] = function(newValue){
                    if (arguments.length && this.value !== newValue) {
                        this.value = newValue;
                        for (var i = 0; i < this.subscribers.length; i++) {
                            this.subscribers[i](this.value);
                        }
                    }

                }

                nameToIndexTranslation[name.split('_')[1]] = i;
            }


        }

        function getSizeFromDataType(dataType){
            var size;
            switch(dataType) {
                case "BYTE":
                    size = 1;
                    break;
                case "Word":
                    size =  2;
                    break;
                case "INT":
                    size =  2;
                    break;
                case "BOOL":
                    size =  1;
                    break;
                case "REAL":
                    size =  4;
                    break;
                case "DINT":
                    size =  4;
                    break;
                case "string":
                    size =  80;
                    break;
            }
            return size;
        }

        function fetchHandlesFromInformation(){

            var handleswriter = new TcAdsWebService.DataWriter();

            for(i = 0; i < varInfos.length; i++){
                handleswriter.writeDINT(TcAdsWebService.TcAdsReservedIndexGroups.SymbolHandleByName);
                handleswriter.writeDINT(0);
                handleswriter.writeDINT(4);
                handleswriter.writeDINT(varInfos[i].length);
            }

            // Write symbol names after the general information to the TcAdsWebService.DataWriter object;
            for (var i = 0; i < varInfos.length; i++) {
                handleswriter.writeString(varInfos[i].name);
            }

            client.readwrite(
                NETID,
                PORT,
                0xF082, 										// IndexGroup = ADS list-read-write command; Used to request handles for twincat symbols;
                varInfos.length, 								// IndexOffset = Count of requested symbol handles;
                (varInfos.length * 4) + (varInfos.length * 8), 	// Length of requested data + 4 byte errorcode and 4 byte length per twincat symbol;
                handleswriter.getBase64EncodedData(),
                handlesRequestCallback,
                null,
                general_timeout,
                function () {
                    console.log("Handles Request Timeout");
                },
                true
            );

        }

        var handlesRequestCallback = (function (e,s) {
            if (e && e.isBusy) {
                return;
            }

            if (e && !e.hasError) {
                var reader = e.reader;
                var hasAError = false;
                for (var i = 0; i < varInfos.length; i++) {
                    var err = reader.readDWORD();
                    var len = reader.readDWORD();
                    if (err != 0) {
                        console.log("		Error: " + err + " Len: " + len);
                        hasAError = true;
                    }
                }
                if(hasAError){

                    return;
                } else {
                }

                handles = [];
                for( var i = 0; i < varInfos.length; i++){
                    varInfos[i].handle = reader.readDWORD();
                }
                prepareWriters();
            } else {
                initStatus = 1;
                console.log("ERROR in RequestHandlesCallback");

                if (e.error.getTypeString() == "TcAdsWebService.ResquestError") {
                    // HANDLE TcAdsWebService.ResquestError HERE;
                    console.log("Error: StatusText = " + e.error.statusText + " Status: " + e.error.status);
                }
                else if (e.error.getTypeString() == "TcAdsWebService.Error") {
                    // HANDLE TcAdsWebService.Error HERE;
                    console.log("Error: ErrorMessage = " + e.error.errorMessage + " ErrorCode: " + e.error.errorCode);
                }
            }

        });

        var prepareWriters = function(){
            readWriter = new TcAdsWebService.DataWriter();
            var size = 0;
            totalSize = 0;

            for(var i = 0; i < varInfos.length; i++){
                totalSize = totalSize + varInfos[i].typeSize;
                readWriter.writeDINT(TcAdsWebService.TcAdsReservedIndexGroups.SymbolValueByHandle);     // IndexGroup
                readWriter.writeDINT(varInfos[i].handle);                                               // IndexOffset = The target handle
                readWriter.writeDINT(varInfos[i].typeSize);                                             // size to read
            }
            readWriterBase64Data = readWriter.getBase64EncodedData();

            writeWriter = new TcAdsWebService.DataWriter();
            initialized("Twincatconnection Module");
        };

        var readLoop = function(){
            client.readwrite(
                NETID,
                PORT,
                0xF080,                             // 0xF080 = Read command;
                varInfos.length,                    // IndexOffset = Variables count;
                totalSize + (varInfos.length * 4),  // Length of requested data + 4 byte errorcode per variable;
                readWriterBase64Data,
                function(e,s){
                    if (e && e.isBusy) {
                        return;
                    }
                    if(e && !e.hasError){

                        var reader = e.reader;

                        // Read error codes from begin of TcAdsWebService.DataReader object;
                        for (var i = 0; i < varInfos.length; i++) {
                            var err = reader.readDWORD();
                            if (err != 0) {
                                console.log("Symbol error!: " + err);
                                return;
                            }
                        }

                        var intValue, boolValue, varValue;
                        var value;

                        for(i = 0; i < varInfos.length; i++){

                            switch(varInfos[i].type){
                                case "INT":
                                    value = reader.readINT();

                                    break;
                                case "BOOL":
                                    value = reader.readBOOL();

                                    break;
                                case "BYTE":
                                    value = reader.readBYTE();

                                    break;
                                case "WORD":
                                    value = reader.readWORD();
                                    break;
                                case "REAL":
                                    value = reader.readREAL();
                                    break;
                                case "DINT":
                                    value = reader.readDINT();
                                    break;
                                case "STRING":
                                    value = reader.readSTRING();
                                    break;
                            }
                            varInfos[i].update(value);
                            //console.log("		Received: " + varInfos[i].name + " Value: " + value);

                        }

                    } else {
                        if (e.error.getTypeString() == "TcAdsWebService.ResquestError") {
                            // HANDLE TcAdsWebService.ResquestError HERE;
                            console.log("Error: StatusText = " + e.error.statusText + " Status: " + e.error.status);
                        }
                        else if (e.error.getTypeString() == "TcAdsWebService.Error") {
                            // HANDLE TcAdsWebService.Error HERE;
                            console.log("Error: ErrorMessage = " + e.error.errorMessage + " ErrorCode: " + e.error.errorCode);
                        }
                    }
                },
                null,
                general_timeout,
                function(e,s){
                    console.log("Calback Timeout");
                },
                true
            );
        };

        var writeLoop = function(){

            var index, varSize, size = 0;
            if(writeData.length > 0){
                console.log(writeData);
                for(var i = 0; i < writeData.length; i++){
                    //console.log("Writing: " + writeData[i]);
                    index = writeData[i][0];
                    if(index < varInfos.length && index >= 0){
                        varSize = varInfos[index].typeSize;

                        writeWriter.writeDINT(TcAdsWebService.TcAdsReservedIndexGroups.SymbolValueByHandle);
                        writeWriter.writeDINT(varInfos[index].handle);
                        writeWriter.writeDINT(varSize);

                        size += varSize;

                        //console.log(varInfos[index]);
                    }else{
                        console.log("Index error in WriteLoop");
                        writeData.splice(i, 1);
                    }
                }
                //console.log(writeData);
                for(i = 0; i < writeData.length; i++){
                    index = writeData[i][0];
                    switch(varInfos[index].type){
                        case "INT":
                            writeWriter.writeINT(parseInt(writeData[i][1]));
                            break;
                        case "BOOL":
                            writeWriter.writeBOOL(Boolean(writeData[i][1]));
                            break;
                        case "BYTE":

                            break;
                        case "WORD":

                            break;
                        case "REAL":

                            break;
                    }
                }


                client.readwrite(
                    NETID,
                    PORT,
                    0xF081, // 0xF081 = Call Write SumCommando
                    writeData.length, // IndexOffset = Count of requested variables.
                    size + (writeData.length*4), // Length of requested data + 4 byte errorcode per variable.
                    writeWriter.getBase64EncodedData(),
                    function(e,s){

                        //console.log("------------Write Callback------------");

                        if (e && e.isBusy) {

                            //console.log("	------------Still Busy------------");

                            var message = "Writing data to plc...";
                            div_log.innerHTML = message;

                            //console.log("------------End------------");
                            return;
                        }

                        if (e && !e.hasError) {
                            //console.log("	------------Successfull------------");

                            var message = "Writing data successfully finished...";
                            div_log.innerHTML = message;

                            //console.log("------------End------------");

                        } else {
                            //console.log("	------------Has Error------------");

                            if (e.error.getTypeString() == "TcAdsWebService.ResquestError") {

                                div_log.innerHTML = "Error: StatusText = " + e.error.statusText + " Status: " + e.error.status;

                                //console.log("		------------ADS WebService Request Error------------");
                                console.log("Error: StatusText = " + e.error.statusText + " Status: " + e.error.status);
                            }
                            else if (e.error.getTypeString() == "TcAdsWebService.Error") {

                                //console.log("		------------ADS WebService Error------------");
                                console.log("Error: StatusText = " + e.error.errorMessage + " Status: " + e.error.errorCode);

                                div_log.innerHTML = "Error: ErrorMessage = " + e.error.errorMessage + " ErrorCode: " + e.error.errorCode;
                            }

                            //console.log("	------------End------------");

                        }

                        //console.log("------------End------------");

                    },
                    null,
                    general_timeout,
                    function(e,s){
                        console.log("WRITTTTTE TIMEOUT");
                    },
                    true
                );

                writeWriter = new TcAdsWebService.DataWriter();
                writeData = [];
            }

        };

        return{
            toString: function(){
                return "Status: " + status;
            },

            init: init,
            varInfos: varInfos,
            startReadWrite : function(){
                readLoopID =  window.setInterval(readLoop, readLoopDelay);
                writeLoopID = window.setInterval(writeLoop, writeLoopDelay);
                console.log("ReadWrite started");
            },
            stopReadWrite : function(){
                clearInterval(readLoopID);
                clearInterval(writeLoopID);
                console.log("ReadWrite stopped");
            },

            start: function(){
                //writeData.push([6,1]);
                writeData.push([nameToIndexTranslation['Play'],true]);
            },

            stop: function(){
                writeData.push([nameToIndexTranslation['Stop'],true]);
            },

            fetchRecord: function(record,side,song){
                var recordIndex = nameToIndexTranslation['Rack'],
                    sideIndex = nameToIndexTranslation['Side'],
                    songIndex = nameToIndexTranslation['Song'];
                writeData.push([recordIndex,record], [sideIndex, side],[songIndex, song]);
            },

            skipForward: function(){
                writeData.push([nameToIndexTranslation['Skipforward'],true]);
            },

            skipBackward: function(){
                writeData.push([nameToIndexTranslation['Skipback'],true]);
            },

            writeData: writeData,

            increaseVolume: function(){
                writeData.push([nameToIndexTranslation['IncreaseVolume'],1]);
            },

            decreaseVolume: function(){
                writeData.push([nameToIndexTranslation['DecreaseVolume'],1]);
            },

            subscribe: function(name, updateFunction){
                var index = nameToIndexTranslation[name];
                if(!index){
                    console.log(name + " doesnt match a variablename to subscribe to");
                    return;
                }
                var variable = varInfos[index];
                variable.subscribe(updateFunction);
            },

            toggleMute: function(){
                var index = nameToIndexTranslation['Mute'];
                var value = varInfos[index].value;
                writeData.push([index, !value]);
            },

            nameToIndex: nameToIndexTranslation,

            /* DELETE */
            addToWrite: function(i,j){
                writeData.push([i,j]);
            }

        }

    })();
    window.TwincatConnectionModule = twincatConnection;
});