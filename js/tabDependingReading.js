$(document).ready(function(){
    var isVerbose = true;
    var intervalTimeout = 500;
    var loopId = null;
    var reading = false;

    $('#startReadingVariables').click(function(){
        if(!reading) {
            logIfVerbose("Start Reading");
            loopId = setInterval(readVariables, intervalTimeout);
            reading = true;
        }else{
            logIfVerbose("Already Reading");
        }
    });

    $('#stopReadingVariables').click(function(){
        if(reading){
            logIfVerbose("Stop Reading");
            clearInterval(loopId);
            reading = false;
        }else{
            logIfVerbose("Not Reading");
        }
    });

    function logIfVerbose(message){
        if(isVerbose){
            console.log(message);
        }
    }

    var readVariables = (function (){
        console.log("READING " + activeIndices);

    });
})


