var NETID = ""; // Empty string for local machine;
var PORT = "851"; // PLC Runtime
var SERVICE_URL = "http://192.168.1.128/TcAdsWebService/TcAdsWebService.dll"; // HTTP path to the TcAdsWebService;

var client = new TcAdsWebService.Client(SERVICE_URL, null, null);

var general_timeout = 500;

var readLoopID = null;
var readLoopDelay = 50;

var varInfos = [];
var totalSize;

var globalBool = false;
var verbose = false;

/* 
Loads a xml file exported from TwinCat 3  from thxe server. 
Calls function getHandles with the all tags with name "globalVars".
*/
$(document).ready(function () {
    logIfVerbose("------------Document Loaded------------");
    loadVariableInformation();
    $('#readOverviewVariables').click(readOverviewVariables);
});

function loadVariableInformation(){
    logIfVerbose("------------Loading XML File------------");
    $.ajax({
        url: 'xmlfiles/Labview.xml',
        context: document.body,
        //timeout
        dataType: 'xml',
        success: function(xml){
            logIfVerbose("   ------------Successfully loaded XML------------");
            logIfVerbose("   ------------Extracting Variables from XML------------");
            var variableListXML = xml.getElementsByTagName("variable");
            logIfVerbose("       Number found: " + variableListXML.length);
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
                logIfVerbose("       Name: " + name +
                                    ", Type: " + type + 
                                    ", Length: " + varInfos[i]['length'] + 
                                    ", TypeSize: " + varInfos[i]['typeSize'] + 
                                    ", Value: " + varInfos[i]['value']);
            }
            logIfVerbose("   ------------END------------");
        },

        error: function(jqXHR, textStatus, errorThrown){
            logIfVerbose("   ------------Error Loading XML File------------");
            logIfVerbose("       Status: " + textStatus);
            logIfVerbose("       Error Thrown: " + errorThrown);
            logIfVerbose("   ------------END------------");
        },

        complete: function(jqXHR, textStatus){
            logIfVerbose("------------Loading Complete, Status: " + textStatus + "------------");
            fetchHandlesFromInformation();
        }
    });
}

/*
	Writes request for handles to the ADS Webservice.
	First writes information about variables to writer (Size and namelength)
	Then writes handlenames to writer.
	Thes send request. 
*/
function fetchHandlesFromInformation(callback){
    logIfVerbose("------------Fetching Variables------------");

	var handleswriter = new TcAdsWebService.DataWriter();

    logIfVerbose("	------------Writing Informations To HandlesWriter------------");

	for(i = 0; i < varInfos.length; i++){
		handleswriter.writeDINT(TcAdsWebService.TcAdsReservedIndexGroups.SymbolHandleByName);
		handleswriter.writeDINT(0);
        handleswriter.writeDINT(4);
        handleswriter.writeDINT(varInfos[i].length);
        logIfVerbose("		Wrote length to handleswriter: " + varInfos[i].length);
	}
    logIfVerbose("	-----------END-----------");

    logIfVerbose("	-----------Writing handle names to handlewriter-----------");
     // Write symbol names after the general information to the TcAdsWebService.DataWriter object;
    for (var i = 0; i < varInfos.length; i++) {
        handleswriter.writeString(varInfos[i].name);
        logIfVerbose("		Wrote Handle Name: " + varInfos[i].name);
    }

    logIfVerbose("	-----------END-----------");

    logIfVerbose("-----------END-----------");

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
                handlesRequestTimeoutCallback,
                true
        );
}

var readAllVariables = (function (){
    readVariables(varInfos.length, function(){})
});

var readVariables = ( function ( tempIndex, updateCallback ){
    logIfVerbose("-----------Reading Variables-----------");
    logIfVerbose("   TempIndex: " + tempIndex);
    logIfVerbose("   -----------Writing information----------");

    var readSymbolValuesWriter = new TcAdsWebService.DataWriter();
    var size = 0;
    totalSize = 0;

    for(var i = 0; i < tempIndex; i++){
        totalSize = totalSize + varInfos[i].typeSize;
        readSymbolValuesWriter.writeDINT(TcAdsWebService.TcAdsReservedIndexGroups.SymbolValueByHandle);     // IndexGroup
        readSymbolValuesWriter.writeDINT(varInfos[i].handle);                                               // IndexOffset = The target handle
        readSymbolValuesWriter.writeDINT(varInfos[i].typeSize);                                             // size to read

        logIfVerbose("       Wrote Handle: " + varInfos[i].handle);
        logIfVerbose("       Wrote Size: "  + varInfos[i].typeSize);
    }

    logIfVerbose("   -----------END-----------");
    logIfVerbose("   Total Size: "  + totalSize);

    readSymbolValuesData = readSymbolValuesWriter.getBase64EncodedData();

    logIfVerbose("-----------END-----------");

    //readLoopID = window.setInterval(ReadLoop, readLoopDelay);

    client.readwrite(
        NETID,
        PORT,
        0xF080,                             // 0xF080 = Read command;
        tempIndex,                    // IndexOffset = Variables count;
        totalSize + (tempIndex * 4),  // Length of requested data + 4 byte errorcode per variable;
        readSymbolValuesData,
        function(e,s){
            readCallback(e,s,updateCallback, tempIndex);
        },
        null,
        general_timeout,
        ReadTimeoutCallback,
        true
    );
});

var readOverviewVariables = (function (){
    logIfVerbose("------------Reading Overview Variables------------");
    readVariables(2, updateOverview);
});

var updateOverview = (function (){
    logIfVerbose("------------Updating Overview Variables------------");
    firstVar.innerHTML = varInfos[0]['value'];
    secondVar.innerHTML = varInfos[1]['value'];
    logIfVerbose("------------END------------");
});


/*
	Gets called when the handles-information request returns. 
	If still busy, display and exit.
	When the request has no error, reads request.
	Reads error for all variable and displays them when existant. When there was a error, returns.
	If there was no error, reads the variable handles and saves them in varInfos.
	Then writes first read-loop and sets up read loop.

	If the request had an error, displays and returns. 
*/
var handlesRequestCallback = (function (e,s) {
	logIfVerbose("------------Callback for Handles Request------------");
	if (e && e.isBusy) {
        var message = "Requesting handles...";
        variableContainer.innerHTML = message;
        logIfVerbose("	Request Still Busy");
        logIfVerbose("-----------END-----------");
        return;
    }	

    if (e && !e.hasError) {
        var reader = e.reader;
        var hasAError = false;
        logIfVerbose("	------------Checking for Errors------------");
        for (var i = 0; i < varInfos.length; i++) {
            var err = reader.readDWORD();
            var len = reader.readDWORD();
            if (err != 0) {
            	logIfVerbose("		Error: " + err + " Len: " + len);
                variableContainer.innerHTML = "Handle error!";
                hasAError = true;
            }
        }
        if(hasAError){
        	logIfVerbose("		Has Error");
        	logIfVerbose("	-----------END-----------");
        	logIfVerbose("-----------END-----------");
        	return;
        } else {
        	logIfVerbose("		No Errors");
        	logIfVerbose("	-----------END-----------");
        }
        logIfVerbose("	----------- Reading Variable Handles-----------");

        handles = [];
		for( var i = 0; i < varInfos.length; i++){
        	varInfos[i].handle = reader.readDWORD();
        	logIfVerbose("		Received Handle: " + varInfos[i].handle);
        }
        logIfVerbose("	-----------END-----------");
        logIfVerbose(varInfos);

    } else {

        logIfVerbose("-----------ERROR in RequestHandlesCallback-----------");

        if (e.error.getTypeString() == "TcAdsWebService.ResquestError") {
            // HANDLE TcAdsWebService.ResquestError HERE;
            variableContainer.innerHTML = "Error: StatusText = " + e.error.statusText + " Status: " + e.error.status;
        }
        else if (e.error.getTypeString() == "TcAdsWebService.Error") {
            // HANDLE TcAdsWebService.Error HERE;
            variableContainer.innerHTML = "Error: ErrorMessage = " + e.error.errorMessage + " ErrorCode: " + e.error.errorCode;
        }

    }
    logIfVerbose("-----------END-----------");
});

/*
	Gets called when Handles Request runs into timeout
*/
var handlesRequestTimeoutCallback = (function () {
    variableContainer.innerHTML = "Request handles timeout!";
});

/*
	Writes a read-request cyclicly.
	@See ReadCallback @See ReadTimeCalback @See handlesRequestCallback
*/
var ReadLoop = (function () {

	logIfVerbose("------------Read Loop------------");
	logIfVerbose("------------End------------");

    client.readwrite(
        NETID,
        PORT,
        0xF080, 							// 0xF080 = Read command;
        varInfos.length, 					// IndexOffset = Variables count;
        totalSize + (varInfos.length * 4), 	// Length of requested data + 4 byte errorcode per variable;
        readSymbolValuesData,
        ReadCallback,
        null,
        general_timeout,
        ReadTimeoutCallback,
        true);

});

/*
	Is called when read-request returns.
	When busy, displays and returns.
	When the request had an error the user is informed.
	Otherwise the variable values are read from the response object and displayed to the user. 
	@See ReadLoop
*/
var readCallback = (function (e, s, updateCallback, tempIndex) {
	logIfVerbose("------------Processing Read Callback------------");
    if (e && e.isBusy) {
    	logIfVerbose("	------------Still Busy------------");
        return;
    }
    logIfVerbose("	------------Checking for Errors------------");

    if (e && !e.hasError) {

        var reader = e.reader;
        
        // Read error codes from begin of TcAdsWebService.DataReader object;
        for (var i = 0; i < tempIndex; i++) {
            var err = reader.readDWORD();
            if (err != 0) {
                div_log.innerHTML = "Symbol error!";
                return;
            }
        }

        logIfVerbose("	------------End------------");

        logIfVerbose("	------------Reading Variable Values------------");

        var intValue, boolValue, varValue;
        var responseString = "";
        for(i = 0; i < tempIndex; i++){
        	switch(varInfos[i].type){
        		case "INT": 
        			intValue = reader.readINT(); 
        			varValue = intValue;           			
        			break;
        		case "BOOL":
        			boolValue = reader.readBOOL();
        			varValue = boolValue;
        			break;
        		case "BYTE":
        			boolValue = reader.readBYTE();
        			varValue = boolValue;
        			break;
        		case "WORD":
        			boolValue = reader.readWORD();
        			varValue = boolValue;
        			break;
        		case "REAL":
        			boolValue = reader.readREAL();
        			varValue = boolValue;
        			break;
                case "DINT":
                    boolValue = reader.readDINT();
                    varValue = boolValue;
                    break;
                case "STRING":
                    boolValue = reader.readSTRING();
                    varValue = boolValue;
                    break;
        	}

        	logIfVerbose("		Received: " + varInfos[i].type + " Value: " + varValue);
            varInfos[i]['value'] = varValue;
        	responseString = responseString + "<p>Name: " + varInfos[i].name  + " , "  + varInfos[i].handle  + " , " + varValue +  "</p>";
        }

        logIfVerbose("	------------End------------");
        variableContainer.innerHTML = responseString;

    } else {

        if (e.error.getTypeString() == "TcAdsWebService.ResquestError") {
            // HANDLE TcAdsWebService.ResquestError HERE;
            variableContainer.innerHTML = "Error: StatusText = " + e.error.statusText + " Status: " + e.error.status;
        }
        else if (e.error.getTypeString() == "TcAdsWebService.Error") {
            // HANDLE TcAdsWebService.Error HERE;
            variableContainer.innerHTML = "Error: ErrorMessage = " + e.error.errorMessage + " ErrorCode: " + e.error.errorCode;
        }
    }
    updateCallback();
    logIfVerbose("------------End------------");

});

/*
	Gets called when the the Read Request has run for to long.
	@See readLoop()
*/
var ReadTimeoutCallback = (function () {
    // HANDLE TIMEOUT HERE;
    logIfVerbose("------------Processing Read Timeout------------");

    div_log.innerHTML = "Read timeout!";
    clearInterval(readLoopID);
    logIfVerbose("------------END------------");
});

/*
	Is called when the "Zurücksetzen" button is pressed, and sends the reset request to ADS Webservice
	First writes infos (size of datatype and handle) to a DataWriter.
	Then the values for each variable are written to the DataWriter with a Switch.
	Finally a request is written to the Ads Webservice.
*/
resetVariables = function () {

    var writer = new TcAdsWebService.DataWriter();

    logIfVerbose("------------Reset Variables------------");

    logIfVerbose("	------------Writing Information------------");

    var size = 0;
    var varSize = 0;
    for (var i = 0; i < varInfos.length; i++) {
    	varSize = varInfos[i].typeSize;

        writer.writeDINT(TcAdsWebService.TcAdsReservedIndexGroups.SymbolValueByHandle);
        writer.writeDINT(varInfos[i].handle);
        writer.writeDINT(varSize);

        size = size + varSize;

        logIfVerbose("		Handle:  " + varInfos[i].handle + " Size: " + varSize + ' Name: '  + varInfos[i].name);
    }

    logIfVerbose("	------------End------------");
    logIfVerbose("	Total Size: " + size);
    
    var bool = false;
    // Write values to TcAdsWebService.DataWrite object;
	if(globalBool){
    	bool = false;
    	globalBool = false;
    } else {
    	bool = true;
    	globalBool = true;
    }

    for(var i = 0; i < varInfos.length; i++){
    	switch(varInfos[i].type){
    		case "INT": 
				    writer.writeINT(parseInt(0));    			
    			break;
    		case "BOOL":
    				writer.writeBOOL(bool);
    			break;
    		case "BYTE":
    				
    			break;
    		case "WORD":
    			
    			break;
    		case "REAL":
    			
    			break;
        	}
    }   

    logIfVerbose("	------------Sending Request------------");
    logIfVerbose("------------End------------");

    client.readwrite(
            NETID,
            PORT,
            0xF081, // 0xF081 = Call Write SumCommando
            varInfos.length, // IndexOffset = Count of requested variables.
            size+(varInfos.length*4), // Length of requested data + 4 byte errorcode per variable.
            writer.getBase64EncodedData(),
            WriteCallback,
            null,
            general_timeout,
            WriteTimeoutCallback,
            true);
};

/*
	Displays correct message when write request has been answered.
	When the request is still busy, a messag is displayed
	When an error has occured, the correct code is displayed.
	On success nothing happens.
	The values are adjusted in the next read request @See ReadCallback
*/
var WriteCallback = (function(e,s){

	logIfVerbose("------------Write Callback------------");

    if (e && e.isBusy) {

    	logIfVerbose("	------------Still Busy------------");

        var message = "Writing data to plc...";
        div_log.innerHTML = message;

        logIfVerbose("------------End------------");
        return;
    }

    if (e && !e.hasError) {
    	logIfVerbose("	------------Successfull------------");

        var message = "Writing data successfully finished...";
        div_log.innerHTML = message;

        logIfVerbose("------------End------------");

    } else {
    	logIfVerbose("	------------Has Error------------");

        if (e.error.getTypeString() == "TcAdsWebService.ResquestError") {

            div_log.innerHTML = "Error: StatusText = " + e.error.statusText + " Status: " + e.error.status;

            logIfVerbose("		------------ADS WebService Request Error------------");
            logIfVerbose("			------------ Error: StatusText = " + e.error.statusText + " Status: " + e.error.status + " ------------");
        }
        else if (e.error.getTypeString() == "TcAdsWebService.Error") {

            logIfVerbose("		------------ADS WebService Error------------");
            logIfVerbose("			------------ Error: StatusText = " + e.error.errorMessage + " Status: " + e.error.errorCode + " ------------");

            div_log.innerHTML = "Error: ErrorMessage = " + e.error.errorMessage + " ErrorCode: " + e.error.errorCode;
        }

        logIfVerbose("	------------End------------");

    }

    logIfVerbose("------------End------------");

});

/*
	Gets called when the the Write Request has run for to long.
	@See resetVariables()
*/
var WriteTimeoutCallback = (function () {
    // HANDLE TIMEOUT HERE;
    div_log.innerHTML = "Write timeout!";
});

/*
	Provides datatype sizes in Bytes (1 Byte = 8 Bit).
	TODO: Add all variables.
*/
function getSizeFromDataType(dataType){
	//logIfVerbose("-----------Getting Data Type for: " + dataType+"-----------");
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

	//logIfVerbose("	Size = " + size);
	//logIfVerbose("-----------END-----------");
	return size;
}

function logIfVerbose(message){
    if(verbose){
        console.log(message);
    }
}