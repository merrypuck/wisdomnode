$(function() {
	var tabs = $( ".tabs" ).tabs({collapsible: true});
	tabs.find( ".ui-tabs-nav" ).sortable({
	axis: "x",
	stop: function() {
	tabs.tabs( "refresh" );
	}
	});
});


$(function() {
	$( ".tabs" ).tabs();
	// fix the classes
	$( ".tabs-bottom .ui-tabs-nav, .tabs-bottom .ui-tabs-nav > *" )
		.removeClass( "ui-corner-all ui-corner-top" )
		.addClass( "ui-corner-bottom" );
	// move the nav to the bottom
	$( ".tabs-bottom .ui-tabs-nav" ).appendTo( ".tabs-bottom" );
});