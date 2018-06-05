// ==UserScript==
// @name            JQ_ForceAutoComplete
// @namespace       http://stackoverflow.com/users/982924/rasg
// @author          RASG
// @version         2018.06.04.2315
// @description     Forces the autocomplete attribute for all forms and input fields in the page
// @require         http://code.jquery.com/jquery.min.js
// @require         https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @include         http*://*
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_addStyle
// @grant           GM_getMetadata
// @grant           GM_registerMenuCommand
// ==/UserScript==

// PREVENT JQUERY CONFLICT
this.$      = $.noConflict(true);
this.jQuery = jQuery.noConflict(true);

// START
$(function(){

    // ---
    // PARSE PASSWORD FIELDS
    // ---

    password_fields = $("input:password");

    function togglePassword() {
        show_password_as_clear_text ? $(password_fields).attr("type", "text") : $(password_fields).attr("type", "password");
    };

    // ---
    // OPTIONS / CONFIG MENU
    // ---
    try {
        var cfg = new MonkeyConfig({
            title: 'Config JQ_ForceAutoComplete',
            menuCommand: true,
            onSave: function() { togglePassword(); },
            params: {
                save_password: {
                    type: 'checkbox',
                    default: true
                },
                enable_field: {
                    type: 'checkbox',
                    default: true
                },
                show_password_as_clear_text: {
                    type: 'checkbox',
                    default: false
                }
            }
        });
    }
    catch(err) {
        console.log("could not instanciate cfg = new MonkeyConfig");
    }

    // ---
    // SELECT ELEMENTS TO WORK ON
    // ---

    $("body").on("focus click focusout", "form" , function() { parse( this ) });
    $("body").on("focus click focusout", "input", function() { parse( this ) });

    // ---
    // FUNCTION TO ADD / REMOVE ATTRIBUTES FROM THE ELEMENTS
    // ---

    function parse(element) {

        enable_field                = cfg.get("enable_field");
        save_password               = cfg.get("save_password");
        show_password_as_clear_text = cfg.get("show_password_as_clear_text");

        togglePassword();

        if ( enable_field ) {
            $(element).removeAttr("disabled readonly");
            $(element).removeProp("disabled readonly");
        }

        if ( save_password ) {
            $(element).attr("autocomplete", "on");
            $(element).prop("autocomplete", "on");
        }
    }

    // ---
    // KNOWN FUNCTIONS THAT PREVENTS AUTOCOMPLETE FROM WORKING
    // ---

    unsafeWindow.C = function(G) { return false };

});
