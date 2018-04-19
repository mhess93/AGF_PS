$(document).ready(function(){
    var notificationModule = (function(){

        var notificationHeader;

        return{
            displayNotification: function (message){
                notificationHeader.queue(function(){
                    $(this).css('background-color', '#34F841')
                        .html(message)
                        .slideDown()
                        .delay(1500)
                        .slideUp()
                        .dequeue();
                });
            },

            displayWarning: function (message){
                notificationHeader.queue(function(){
                    $(this).css('background-color', '#FFD235')
                        .html(message)
                        .slideDown()
                        .delay(1500)
                        .slideUp()
                        .dequeue();
                });
            },

            displayError: function (message){
                notificationHeader.queue(function(){
                    $(this).css('background-color', '#FF3A35')
                        .html(message)
                        .slideDown()
                        .delay(1500)
                        .slideUp()
                        .dequeue();
                });
            },
            init: function(){
                notificationHeader = $('.notification-header');
                moduleInitSuccess("NotificationModule");
            }
        }
    })();
    window.NotificationModule = notificationModule;

});