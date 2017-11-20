var NETID = ""; // Empty string for local machine;
var PORT = "851"; // PLC Runtime
var SERVICE_URL = "http://localhost/TcAdsWebService/TcAdsWebService.dll"; // HTTP path to the TcAdsWebService;

var client = new TcAdsWebService.Client(SERVICE_URL, null, null);

var general_timeout = 500;

var readLoopID = null;
var readLoopDelay = 50;

var varInfos = [];
var totalSize;

var globalBool = false;

/* 
Loads a xml file exported from TwinCat 3  from thxe server. 
Calls function getHandles with the all tags with name "globalVars".
*/
$(document).ready(function () {
    console.log("------------Document Loaded------------");
/*	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			parser = new DOMParser();
			xmlDoc = parser.parseFromString(this.responseText, "text/xml");
			getPOUVariablesInformations(xmlDoc);
			fetchHandlesFromInformation();
		}
	};
	xhttp.open("GET", "MAIN_variables.xml", true);
	xhttp.send();*/

    loadVariableInformation();
});

function loadVariableInformation(){
    console.log("------------Loading XML File------------");
    $.ajax({
        url: 'Labview.xml',
        context: document.body,
        //timeout
        dataType: 'xml',
        success: function(xml){
            console.log("   ------------Successfully loaded XML------------");
            console.log("   ------------Extracting Variables from XML------------");
            var variableListXML = xml.getElementsByTagName("variable");
            console.log("       Number found: " + variableListXML.length);
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
                console.log("       Name: " + name + 
                                    ", Type: " + type + 
                                    ", Length: " + varInfos[i]['length'] + 
                                    ", TypeSize: " + varInfos[i]['typeSize']);
            }
            console.log("   ------------END------------");
        },

        error: function(jqXHR, textStatus, errorThrown){
            console.log("   ------------Error Loading XML File------------");
            console.log("       Status: " + textStatus);
            console.log("       Error Thrown: " + errorThrown);
            console.log("   ------------END------------");
        },

        complete: function(jqXHR, textStatus){
            console.log("------------Loading Complete, Status: " + textStatus + "------------");
            fetchHandlesFromInformation();
        },


    });
}

/*
	Reads information about POU Variables from imported the XML document. (XML-Document is exported from TwinCat 3)
	Reads name, datatype, namelength (length), and size of datatype (typeSize) to an assoziative array. Also creates slot for handle. 
	returns the 
*/
function getPOUVariablesInformations(xmlDoc){
	console.log("------------Getting POU Variable Informations------------");
	console.log("	------------Reading informations------------");

	var variables = xmlDoc.getElementsByTagName("variable");
	var variableGroup = xmlDoc.getElementsByTagName("pou")[0].getAttribute("name");

	console.log("		Number of Variables: " + variables.length);
	console.log("		Variable Group: " + variableGroup);

	var variable, name, type;
	var TempPOUVarInformation = [];
	for(i = 0; i < variables.length; i++){
		variable = variables[i];
		type = variable.childNodes[1].childNodes[1].nodeName;
		name = variableGroup +"."+variable.getAttribute("name");

		varInfos[i] = {};
		varInfos[i]["name"] = name;
		varInfos[i]["type"] = type;
		varInfos[i]["length"] = name.length;
		varInfos[i]["handle"] = null;
		varInfos[i]["typeSize"] = getSizeFromDataType(type);

		TempPOUVarInformation[i] = [name, type, name.length];
		console.log("		" + TempPOUVarInformation[i]);
		console.log('		Name: ' + varInfos[i]['name'] + ', Type: ' + varInfos[i]['type'] + ', Length: ' + varInfos[i]['length'] + ', Handle: ' + varInfos[i]['handle'] + ', typeSize: ' + varInfos[i]["typeSize"]);

	}		
	console.log("	-----------END-----------");

	console.log("-----------END-----------");

	return TempPOUVarInformation;
}

/*
	Writes request for handles to the ADS Webservice.
	First writes information about variables to writer (Size and namelength)
	Then writes handlenames to writer.
	Thes send request. 
*/
function fetchHandlesFromInformation(){
	console.log("------------Fetching Variables------------");

	var handleswriter = new TcAdsWebService.DataWriter();	

	console.log("	------------Writing Informations To HandlesWriter------------");

	for(i = 0; i < varInfos.length; i++){
		handleswriter.writeDINT(TcAdsWebService.TcAdsReservedIndexGroups.SymbolHandleByName);
		handleswriter.writeDINT(0);
        handleswriter.writeDINT(4);
        handleswriter.writeDINT(varInfos[i].length);
        console.log("		Wrote length to handleswriter: " + varInfos[i].length);
	}	
	console.log("	-----------END-----------");

	console.log("	-----------Writing handle names to handlewriter-----------");
     // Write symbol names after the general information to the TcAdsWebService.DataWriter object;
    for (var i = 0; i < varInfos.length; i++) {
        handleswriter.writeString(varInfos[i].name);
        console.log("		Wrote Handle Name: " + varInfos[i].name);
    }

    console.log("	-----------END-----------");

    console.log("-----------END-----------");

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
	console.log("------------Callback for Handles Request------------");
	if (e && e.isBusy) {
        var message = "Requesting handles...";
        variableContainer.innerHTML = message;
        console.log("	Request Still Busy");
        console.log("-----------END-----------");
        return;
    }	

    if (e && !e.hasError) {
    	
        var reader = e.reader;
        var hasAError = false;
        console.log("	------------Checking for Errors------------");

        for (var i = 0; i < varInfos.length; i++) {

            var err = reader.readDWORD();
            var len = reader.readDWORD();

            

            if (err != 0) {
            	console.log("		Error: " + err + " Len: " + len);
                variableContainer.innerHTML = "Handle error!";
                hasAError = true;
            }

        }

        if(hasAError){
        	console.log("		Has Error");
        	console.log("	-----------END-----------");
        	console.log("-----------END-----------");
        	return;
        } else {
        	console.log("		No Errors");
        	console.log("	-----------END-----------");
        }
        
        console.log("	----------- Reading Variable Handles-----------");

        handles = [];
		for( i = 0; i < varInfos.length; i++){
        	varInfos[i].handle = reader.readDWORD();

        	console.log("		Received Handle: " + varInfos[i].handle);
        }
        console.log("	-----------END-----------");

        var readSymbolValuesWriter = new TcAdsWebService.DataWriter();
        var size = 0;

        console.log("	-----------Writing handles to Writer-----------");

        totalSize = 0;

        for(i = 0; i < varInfos.length; i++){
        	totalSize = totalSize + varInfos[i].typeSize;
        	readSymbolValuesWriter.writeDINT(TcAdsWebService.TcAdsReservedIndexGroups.SymbolValueByHandle); 	// IndexGroup
        	readSymbolValuesWriter.writeDINT(varInfos[i].handle); 												// IndexOffset = The target handle
        	readSymbolValuesWriter.writeDINT(varInfos[i].typeSize); 											// size to read

        	console.log("		Wrote Handle: " + varInfos[i].handle);
        	console.log("		Wrote Size: "  + varInfos[i].typeSize);
        }

        console.log("	-----------END-----------");
        console.log("	Total Size: "  + totalSize);

        readSymbolValuesData = readSymbolValuesWriter.getBase64EncodedData();

        console.log("-----------END-----------");

        readLoopID = window.setInterval(ReadLoop, readLoopDelay);

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
        	true
    	);

    } else {

        console.log("-----------ERROR in RequestHandlesCallback-----------");

        if (e.error.getTypeString() == "TcAdsWebService.ResquestError") {
            // HANDLE TcAdsWebService.ResquestError HERE;
            variableContainer.innerHTML = "Error: StatusText = " + e.error.statusText + " Status: " + e.error.status;
        }
        else if (e.error.getTypeString() == "TcAdsWebService.Error") {
            // HANDLE TcAdsWebService.Error HERE;
            variableContainer.innerHTML = "Error: ErrorMessage = " + e.error.errorMessage + " ErrorCode: " + e.error.errorCode;
        }

    }
    console.log("-----------END-----------");
});

/*
	Gets called when Handles Request runs into timeout
*/
var handlesRequestTimeoutCallback = (function () {
    variableContainer.innerHTML = "Requuest handles timeout!";
});

/*
	Writes a read-request cyclicly.
	@See ReadCallback @See ReadTimeCalback @See handlesRequestCallback
*/
var ReadLoop = (function () {

	console.log("------------Read Loop------------");
	console.log("------------End------------");

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
var ReadCallback = (function (e, s) {

	console.log("------------Processing Read Callback------------");

    if (e && e.isBusy) {

    	console.log("	------------Still Busy------------");


        console.log("	------------End------------");
        return;
    }
    console.log("	------------Checking for Errors------------");

    if (e && !e.hasError) {

        var reader = e.reader;
        
        // Read error codes from begin of TcAdsWebService.DataReader object;
        for (var i = 0; i < varInfos.length; i++) {
            var err = reader.readDWORD();
            if (err != 0) {
                div_log.innerHTML = "Symbol error!";
                return;
            }
        }

        console.log("	------------End------------");

        console.log("	------------Reading Variable Values------------");

        var intValue, boolValue, varValue;
        var responseString = "";
        for(i = 0; i < varInfos.length; i++){
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
        	}

        	console.log("		Received: " + varInfos[i].type + " Value: " + varValue);

        	responseString = responseString + "<p>Name: " + varInfos[i].name  + " , "  + varInfos[i].handle  + " , " + varValue +  "</p>";
        }

        console.log("	------------End------------");
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

    console.log("------------End------------");

});

/*
	Gets called when the the Read Request has run for to long.
	@See readLoop()
*/
var ReadTimeoutCallback = (function () {
    // HANDLE TIMEOUT HERE;
    console.log("------------Processing Read Timeout------------");

    div_log.innerHTML = "Read timeout!";
    clearInterval(readLoopID);
    console.log("------------END------------");
});

/*
	Is called when the "Zurücksetzen" button is pressed, and sends the reset request to ADS Webservice
	First writes infos (size of datatype and handle) to a DataWriter.
	Then the values for each variable are written to the DataWriter with a Switch.
	Finally a request is written to the Ads Webservice.
*/
resetVariables = function () {

    var writer = new TcAdsWebService.DataWriter();

    console.log("------------Reset Variables------------");

    console.log("	------------Writing Information------------");

    var size = 0;
    var varSize = 0;
    for (var i = 0; i < varInfos.length; i++) {
    	varSize = varInfos[i].typeSize;

        writer.writeDINT(TcAdsWebService.TcAdsReservedIndexGroups.SymbolValueByHandle);
        writer.writeDINT(varInfos[i].handle);
        writer.writeDINT(varSize);

        size = size + varSize;

        console.log("		Handle:  " + varInfos[i].handle + " Size: " + varSize + ' Name: '  + varInfos[i].name);
    }

    console.log("	------------End------------");
    console.log("	Total Size: " + size);
    
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

    console.log("	------------Sending Request------------");
    console.log("------------End------------");

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

	console.log("------------Write Callback------------");

    if (e && e.isBusy) {

    	console.log("	------------Still Busy------------");

        var message = "Writing data to plc...";
        div_log.innerHTML = message;
       	
        console.log("------------End------------");
        return;
    }

    if (e && !e.hasError) {
    	console.log("	------------Successfull------------");

        var message = "Writing data successfully finished...";
        div_log.innerHTML = message;

        console.log("------------End------------");

    } else {
    	console.log("	------------Has Error------------");

        if (e.error.getTypeString() == "TcAdsWebService.ResquestError") {

            div_log.innerHTML = "Error: StatusText = " + e.error.statusText + " Status: " + e.error.status;

            console.log("		------------ADS WebService Request Error------------");
            console.log("			------------ Error: StatusText = " + e.error.statusText + " Status: " + e.error.status + " ------------");
        }
        else if (e.error.getTypeString() == "TcAdsWebService.Error") {

            console.log("		------------ADS WebService Error------------");
            console.log("			------------ Error: StatusText = " + e.error.errorMessage + " Status: " + e.error.errorCode + " ------------");

            div_log.innerHTML = "Error: ErrorMessage = " + e.error.errorMessage + " ErrorCode: " + e.error.errorCode;
        }

        console.log("	------------End------------");

    }

    console.log("------------End------------");

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
	//console.log("-----------Getting Data Type for: " + dataType+"-----------");
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

	//console.log("	Size = " + size);
	//console.log("-----------END-----------");
	return size;
}