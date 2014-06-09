// ==UserScript==
// @name            JQ_ForceAutoComplete
// @namespace       http://stackoverflow.com/users/982924/rasg
// @author          RASG
// @version         2012.09.21
// @description     Forces the autocomplete attribute for all forms and input fields in the page
// @require         http://code.jquery.com/jquery.min.js
// @include         http*://*
// @grant           GM_log
// ==/UserScript==


$(window).load(function(){

    $("body")
        .on("focus click", "form", function(){ $(this).removeAttr("disabled readonly").attr("autocomplete", "on") })
        .on("focus click", "input", function(){ $(this).removeAttr("disabled readonly").attr("autocomplete", "on") })

});