$(document).ready(function(){
	$('.burger-dropdown-toggle').click(function(e){
		var $menu = $('.burger-dropdown-menu');
		$menu.toggleClass('on');
		$(this).find('span').toggleClass('on');
		e.preventDefault();
		$('.burger-item').toggleClass('disabled');
		if ($menu.hasClass('on')) {
			$('.burger-item').bind('click', function(e){
				e.preventDefault();
			});
		} else {
			$('.burger-item').bind('click', function(e){
				window.location.href=$(this).attr('href');
			});
		}
	});
	$('#toggle').click(function(e){
		$('#toggle, #menu').toggleClass('on');
		e.preventDefault();
	});
});