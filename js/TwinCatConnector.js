$(document).ready(function(){

    var twincatConnection = (function(){
        var status = 0;
        var variables = {};
        var NETID = "192.168.1.128.1.1"; // Empty string for local machine;
        var PORT = "851"; // PLC Runtime
        var SERVICE_URL = "http://192.168.43.242/TcAdsWebService/TcAdsWebService.dll"; // HTTP path to the TcAdsWebService;
        var client;
        var general_timeout = 500;

        var readLoopID = null;
        var readLoopDelay = 100;

        var writeLoopID = null;
        var writeLoopDelay = readLoopDelay;

        var readWriter;
        var readWriterBase64Data;
        var writeWriter;
        var totalSize;

        var writeData = [];

        var nameToIndexTranslation = [];

        var resolve, reject;

        function Variable(name, type){
            this.name = name;
            this.type = type;
            this.length = name.length;
            this.typeSize = getSizeFromDataType(type);
            this.subscribers = [];
            this.subscribe = function(subscriber){
                this.subscribers.push(subscriber);
            };
            this.update = function(newValue){
                if (arguments.length && this.value !== newValue) {
                    this.value = newValue;
                    for (var i = 0; i < this.subscribers.length; i++) {
                        this.subscribers[i](this.value);
                    }
                }
            }
        }

        var init = function(){
            return new Promise(function(resolveFunc, rejectFunc){
                resolve = resolveFunc;
                $.ajax({
                    type: "GET",
                    url: "xmlfiles/Labview.xml",
                    dataType: "xml"
                }).done(
                    function(data){
                        parseLabview(data);
                        setupClient();
                    }
                ).fail(
                    function(jqXHR, textStatus, errorThrown){
                        $('.init-message p').html("ERROR: " + errorThrown);
                        reject();
                    }
                );
            });
        };

        function parseLabview(xml){
            var variableListXML = xml.getElementsByTagName("variable");
            var varEntry, name, type;

            for(var i = 0; i < variableListXML.length; i++){
                varEntry = variableListXML[i];
                type = varEntry.childNodes[1].childNodes[1].nodeName;
                name = "."+varEntry.getAttribute("name");

                variables[i] = new Variable(name, type);

                nameToIndexTranslation[name.split('_')[1]] = i;
            }
        }

        function subscribeTo(varName, updateFunc){
            var index = nameToIndexTranslation[varName];
            if(index !== undefined){
                variables[index].subscribe(updateFunc);
                console.info("Subscribed to " + varName);
            } else {
                console.warn(varName + " not found");
            }
        }

        var prepareWriters = function(){
            readWriter = new TcAdsWebService.DataWriter();
            totalSize = 0;

            for(var i = 0; i < variables.length; i++){
                totalSize = totalSize + variables[i].typeSize;
                readWriter.writeDINT(TcAdsWebService.TcAdsReservedIndexGroups.SymbolValueByHandle);     // IndexGroup
                readWriter.writeDINT(variables[i].handle);                                               // IndexOffset = The target handle
                readWriter.writeDINT(variables[i].typeSize);                                             // size to read
            }
            readWriterBase64Data = readWriter.getBase64EncodedData();

            writeWriter = new TcAdsWebService.DataWriter();
            resolve();
            //initialized("Twincatconnection Module");
            moduleInitialized("Twincatmodule");
        };

        function setupClient(){
            client = new TcAdsWebService.Client(SERVICE_URL, null, null);
            client.readState(
                NETID,
                PORT,
                setupClientCallback,
                null,
                general_timeout,
                function(){
                    console.log("ReadState Timeout");
                },
                true
            );
        }

        function setupClientCallback(e){
            if (e && e.isBusy) {
                return;
            }
            if(e && !e.hasError){

                var reader = e.reader;
                console.log("ADSState: " + reader.readWORD() + " DeviceState " + reader.readWORD());
                fetchHandlesFromInformation();

            } else {
                handleADSError(e, arguments.callee);
            }
        }

        function fetchHandlesFromInformation(){

            var handleswriter = new TcAdsWebService.DataWriter();

            for(i = 0; i < variables.length; i++){
                handleswriter.writeDINT(TcAdsWebService.TcAdsReservedIndexGroups.SymbolHandleByName);
                handleswriter.writeDINT(0);
                handleswriter.writeDINT(4);
                handleswriter.writeDINT(variables[i].length);
            }

            // Write symbol names after the general information to the TcAdsWebService.DataWriter object;
            for (var i = 0; i < variables.length; i++) {
                handleswriter.writeString(variables[i].name);
            }

            client.readwrite(
                NETID,
                PORT,
                0xF082, 										// IndexGroup = ADS list-read-write command; Used to request handles for twincat symbols;
                variables.length, 								// IndexOffset = Count of requested symbol handles;
                (variables.length * 4) + (variables.length * 8), 	// Length of requested data + 4 byte errorcode and 4 byte length per twincat symbol;
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

        function handlesRequestCallback(e,s) {
            if (e && e.isBusy) {
                return;
            }

            if (e && !e.hasError) {
                var reader = e.reader;
                var hasAError = false;

                for (var i = 0; i < variables.length; i++) {
                    var err = reader.readDWORD();
                    var len = reader.readDWORD();
                    if (err !== 0) {
                        console.log("Error: " + err + " Len: " + len);
                        hasAError = true;
                    }
                }

                if(hasAError){

                    return;
                }

                for( i = 0; i < variables.length; i++){
                    variables[i].handle = reader.readWORD();
                }
                prepareWriters();

            } else {
                handleADSError(e, arguments.callee);
            }




        }

        function readLoop(){
            client.readwrite(
                NETID,
                PORT,
                0xF080,                             // 0xF080 = Read command;
                variables.length,                    // IndexOffset = Variables count;
                totalSize + (variables.length * 4),  // Length of requested data + 4 byte errorcode per variable;
                readWriterBase64Data,
                readCallback,
                null,
                general_timeout,
                function(e,s){
                    console.log("Calback Timeout");
                },
                true
            );
        }

        function readCallback(e,s){
            if (e && e.isBusy) {
                return;
            }
            if(e && !e.hasError){

                var reader = e.reader;

                // Read error codes from begin of TcAdsWebService.DataReader object;
                for (var i = 0; i < variables.length; i++) {
                    var err = reader.readDWORD();
                    if (err != 0) {
                        console.log("Symbol error!: " + err);
                        return;
                    }
                }

                var value;

                for(i = 0; i < variables.length; i++){

                    switch(variables[i].type){
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
                    variables[i].update(value);
                }

            } else {
                handleADSError(e, arguments.callee);
            }
        }

        function writeLoop(){

            var index, varSize, size = 0;
            if(writeData.length > 0){
                console.log(writeData);
                for(var i = 0; i < writeData.length; i++){
                    //console.log("Writing: " + writeData[i]);
                    index = writeData[i][0];
                    if(index < variables.length && index >= 0){
                        varSize = variables[index].typeSize;

                        writeWriter.writeDINT(TcAdsWebService.TcAdsReservedIndexGroups.SymbolValueByHandle);
                        writeWriter.writeDINT(variables[index].handle);
                        writeWriter.writeDINT(varSize);

                        size += varSize;

                    }else{
                        console.log("Index error in WriteLoop");
                        writeData.splice(i, 1);
                    }
                }
                //console.log(writeData);
                for(i = 0; i < writeData.length; i++){
                    index = writeData[i][0];
                    switch(variables[index].type){
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
                    writeCallback,
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

        function writeCallback(e,s){

            if (e && e.isBusy) {
                return;
            }

            if (e && !e.hasError) {


            } else {
                //console.log("	------------Has Error------------");
                handleADSError(e, arguments.callee);

            }
        }

        function handleADSError(e, callee){
            var funcName = callee.toString();
            funcName = funcName.substr('function '.length);
            funcName = funcName.substr(0, funcName.indexOf('('));
            console.error("ERROR IN: " + funcName);
            console.error(e.error);
            moduleInitializationFailed('Twincatmodule');
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

        return{
            toString: function(){
                return "Status: " + status;
            },

            init: init,

            subscribeTo: subscribeTo,

            startReadWrite : function(){
                //readLoopID =  window.setInterval(readLoop, readLoopDelay);
                writeLoopID = window.setInterval(writeLoop, writeLoopDelay);
                console.log("ReadWrite started");
            },

            stopReadWrite : function(){
                //clearInterval(readLoopID);
                clearInterval(writeLoopID);
                console.log("ReadWrite stopped");
            },

            start: function(){
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

            toggleMute: function(){
                var index = nameToIndexTranslation['Mute'];
                var value = variables[index].value;
                writeData.push([index, !value]);
            },


            getActSide: function(){
                return variables[nameToIndexTranslation['ActSide']].value;
            },

            getActSong: function(){
                return variables[nameToIndexTranslation['ActSong']].value;
            },

            getActRecord: function(){
                return variables[nameToIndexTranslation['ActRack']].value;
            },

            /* DELETE  ALL BELLOW */
            addToWrite: function(i,j){
                writeData.push([i,j]);
            },

            nameToIndex: nameToIndexTranslation,

            variables: variables,

            subscribe: function(name, updateFunction){
                var index = nameToIndexTranslation[name];
                if(!index){
                    console.log(name + " doesnt match a variablename to subscribe to");
                    return;
                }
                var variable = variables[index];
                variable.subscribe(updateFunction);
            },
        }

    })();
    window.TwincatConnectionModule = twincatConnection;
});