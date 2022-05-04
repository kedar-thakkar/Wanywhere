jQuery(document).ready(function(){
    jQuery('.ToggleIconBox').click(function(){
        jQuery(this).toggleClass('ToggleIconBoxActive') 
    });

    jQuery('.TileView').click(function(){
        jQuery("body").toggleClass('TileChange') 
    });
});



$(function () {
	$('.open_popup').magnificPopup({
		type: 'inline',
		preloader: false,
		focus: '#username',
		removalDelay: 900,
		modal: true,
		callbacks: {
		beforeOpen: function() {
				this.st.mainClass = this.st.el.attr('data-effect');
			}
		}
	});
	$(document).on('click', '.popup-modal-dismiss', function (e) {
		e.preventDefault();
		$.magnificPopup.close();
	});
});	








