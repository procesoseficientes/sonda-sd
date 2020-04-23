$(document).ready(function () {
    $(".scroller").click(function () {
        $('html, body').animate({            
            scrollTop: $($(this).attr("goal")).offset().top - 150            
        }, 1000);
    });
});
