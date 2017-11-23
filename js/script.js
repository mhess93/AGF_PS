
$(document).ready(function(){
    $('.fullscreen-button').click(function(){
        console.log("Fullscreen");
        $('.body-wrapper').toggleClass('active');
    });

});

/*
	Displays the correct tab when clicking on the tabbutton
*/
function openInnerTab(evt, tabName) {
	// Declare all variables
	var i, tabcontent, tablinks, parent;

	parent = evt.target.parentNode;

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
    evt.currentTarget.className += " active";
}

function openOuterTab(evt, tabName) {
	// Declare all variables
	var i, tabcontent, tablinks, parent, tabToOpen;
    parent = evt.currentTarget.parentNode;

    if(parent.classList.contains('active')){
        return;
    }

	// Get all elements with class="tabcontent" and hide them
	tabcontent = document.getElementsByClassName("outer-tab-content");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tab-links control-button");
    for (i = 0; i < tablinks.length; i++) {
    	tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    tabToOpen = document.getElementById(tabName);

    tabToOpen.style.display = "block";
    tabToOpen.getElementsByClassName("tab-links")[0].click();

    parent.className += " active";
}

