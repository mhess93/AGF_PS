var SCRIPT_VERBOSE = true;

$(document).ready(function(){
    $('.fullscreen-button').click(function(){
        $('.body-wrapper').toggleClass('active');
    });

    $('.toggle-controls-albums').click(function(){
        $('.controls.left-side').toggleClass('active');
    });

});

/*
	Displays the correct tab when clicking on the tabbutton
*/
function openInnerTab(evt, tabName, indices) {
	// Declare all variables

    activeIndices = indices;

	var jqueryTarget = $(evt.target);
	var tab = jqueryTarget.parent();
	var tabLinks = tab.children('.tab-links');

	tabLinks.removeClass('active');
	jqueryTarget.addClass('active');
	$('.tabcontent').removeClass('active');
    var tabToOpen = $('.tabcontent#'+tabName);
    tabToOpen.addClass('active');

/*
	// Get all elements with class="tabcontent" and hide them
	tabcontent = parent.parentNode.getElementsByClassName("tabcontent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = parent.getElementsByClassName("tab-links");
    for (i = 0; i < tablinks.length; i++) {
    	tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active"; */
}

function openOuterTab(evt, tabName) {
	// Declare all variables
	var i, tabContent, tablinks, parent, tabToOpen;
    parent = evt.currentTarget.parentNode;

    if(parent.classList.contains('active')){
        return;
    }

	// Get all elements with class="tabcontent" and hide them
	tabContent = $(".outer-tab-content");
    tabContent.removeClass('active');



    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = $(".tab-links.control-button");

    tablinks.removeClass('active');

    // Show the current tab, and add an "active" class to the button that opened the tab
    tabToOpen = $("#"+tabName);

    tabToOpen.addClass("active");
    tabToOpen.find(".tab-links")[0].click();

    parent.classList += " active";
}

