$(document).ready(function(){
    var isVerbose = true;
    $('#startReadingVariables').click(function(){
        logIfVerbose("Start Reading");
    });

    $('#stopReadingVariables').click(function(){
        logIfVerbose("Stop Reading");
    });

    function logIfVerbose(message){
        if(isVerbose){
            console.log(message);
        }
    }
})


