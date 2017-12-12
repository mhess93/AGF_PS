$(document).ready(function(){
    var twincatConnection = (function(){
        var status = 0;

        return{
            toString: function(){
                return "Status: " + status;
            }
        }
    })();

    window.TwincatConnectionModule = twincatConnection;
});