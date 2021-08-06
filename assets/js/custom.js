// Custom Scripts for Primal Template //

jQuery(function($) {
    "use strict";


    // get the value of the bottom of the #main element by adding the offset of that element plus its height, set it as a variable
    var mainbottom = $('#main').offset().top;

    // on scroll,
    $(window).on('scroll', function() {

        // we round here to reduce a little workload
        stop = Math.round($(window).scrollTop());
        if (stop > mainbottom) {
            $('.navbar').addClass('past-main');
            $('.navbar').addClass('effect-main')
        } else {
            $('.navbar').removeClass('past-main');
        }

    });


    // Collapse navbar on click

    $(document).on('click.nav', '.navbar-collapse.in', function(e) {
        if ($(e.target).is('a')) {
            $(this).removeClass('in').addClass('collapse');
        }
    });



    /*-----------------------------------
    ----------- Scroll To Top -----------
    ------------------------------------*/

    $(window).scroll(function() {
        if ($(this).scrollTop() > 1000) {
            $('#back-top').fadeIn();
        } else {
            $('#back-top').fadeOut();
        }
    });
    // scroll body to 0px on click
    $('#back-top').on('click', function() {
        $('#back-top').tooltip('hide');
        $('body,html').animate({
            scrollTop: 0
        }, 1500);
        return false;
    });





    /*-------- Owl Carousel ---------- */
    $(".rev-list").owlCarousel({

        slideSpeed: 200,
        items: 1,
        singleItem: true,
        autoPlay: true,
        pagination: false
    });




    /* ------ jQuery for Easing min -- */

    // Smooth scrolling using jQuery easing
    $('a.js-scroll-trigger[href*="#"]:not([href="#"])').on('click', function() {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
            if (target.length) {
                $('html, body').animate({
                    scrollTop: (target.offset().top - 54)
                }, 1000, "easeInOutExpo");
                return false;
            }
        }
    });


    /* --------- Wow Init ------ */

    new WOW().init();


    /* ----- Counter Up ----- */

    $('.counter').counterUp({
        delay: 10,
        time: 1000
    });


    /*----- Subscription Form ----- */
    /*----- Subscription Form ----- */

    $(document).ready(function() {
        // jQuery Validation
        $("#chimp-form").validate({
            // if valid, post data via AJAX
            submitHandler: function(form) {
                $.post("assets/php/subscribe.php", { email: $("#chimp-email").val() }, function(data) {
                    $('#response').html(data);
                });
            },
            // all fields are required
            rules: {
                email: {
                    required: true,
                    email: true
                }
            }
        });
    });


    // Accordion //

    function toggleChevron(e) {
        $(e.target)
            .prev('.panel-heading')
            .find("span.glyphicon")
            .toggleClass('glyphicon-chevron-down glyphicon-chevron-right');
    }
    $('#accordion').on('hide.bs.collapse show.bs.collapse', toggleChevron);

});


function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}


/* ---------------------------------------------
 Contact form
 --------------------------------------------- */
$(document)
    .ready(function() {

        var urlParams = new URLSearchParams(location.search);
        if (urlParams.has('ref')) {
            setCookie('ref', urlParams.get('ref'), 30);
        }


        if (urlParams.get('ref')) {
            document.querySelector('#invite-code').innerHTML = getCookie('ref');
            document.querySelector('#show-success').click();
        }
        //

        function isEmail(email) {
            var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            return regex.test(email);
        }


        //



        $("#chimp-form").click(function(event) {
            event.preventDefault();



            $('#contact-message')
                .css('border-color', '#fff');
            $('#contact-name')
                .css('border-color', '#fff');
            $('#contact-email')
                .css('border-color', '#fff');

            var message = $('#contact-message').val();
            var name = $('#contact-name').val();
            var email = $('#contact-email').val();

            var proceed = true;
            if (message == "") {
                $('#contact-message').css('border', '2px solid red');
                proceed = false;
            }
            if (name == "") {
                $('#contact-name').css('border', '2px solid red');
                proceed = false;
            }
            if (email == "") {
                $('#contact-email').css('border', '2px solid red');
                proceed = false;
            }
            if (!isEmail(email)) {
                $('#contact-email').css('border', '2px solid red');
                proceed = false;
            }

            if (proceed) {
                document.querySelector("#recaptcha1").style.display = "block";
                document.querySelector("#contact-submit").style.display = "none";
            }


        });




    });