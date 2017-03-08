// ==UserScript==
// @name            JQ_ForceAutoComplete
// @namespace       http://stackoverflow.com/users/982924/rasg
// @author          RASG
// @version         2017.03.08
// @description     Forces the autocomplete attribute for all forms and input fields in the page
// @require         http://code.jquery.com/jquery.min.js
// @include         http*://*
// ==/UserScript==

this.$ = this.jQuery = jQuery.noConflict(true);

$(window).load(function(){

    // ---
    // SELECT ELEMENTS TO WORK ON
    // ---

    $("body").on("focus click", "form" , function() { parse( this ) });
    $("body").on("focus click", "input", function() { parse( this ) });

    // ---
    // FUNCTION TO ADD / REMOVE ATTRIBUTES FROM THE ELEMENTS
    // ---

    function parse(element) {

        //console.log(element);

        $(element).removeAttr("disabled readonly");
        $(element).removeProp("disabled readonly");

        $(element).attr("autocomplete", "on");
        $(element).prop("autocomplete", "on");
    }

    // ---
    // KNOWN FUNCTIONS THAT PREVENTS AUTOCOMPLETE FROM WORKING
    // ---

    unsafeWindow.C = function(G) { return false };

});
