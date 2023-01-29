// ==UserScript==
// @name            Force Forms AutoComplete
// @namespace       https://github.com/yodog/userscripts
// @author          RASG
// @version         2023.01.29.1217
// @description     Forces the autocomplete attribute for all forms and input fields in the page
// @require         http://code.jquery.com/jquery.min.js
// @require         https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_addStyle
// @grant           GM_registerMenuCommand
// @include         http*://*
// @exclude         http*://*.google.com/*
// @exclude         http*://*.live.com/*
// @noframes
// ==/UserScript==

// -----------------------------------------------------------------------------
// PREVENT JQUERY CONFLICT
// -----------------------------------------------------------------------------

/* global $, jQuery */

this.$ = this.jQuery = jQuery.noConflict(true);

if (typeof $ == 'undefined') console.log('JQuery not found; The script will certainly fail');

// -----------------------------------------------------------------------------
// OPTIONS / CONFIG MENU
// -----------------------------------------------------------------------------

/* global MonkeyConfig */

try {
    var cfg = new MonkeyConfig({
        title: 'Config JQ_ForceAutoComplete',
        menuCommand: true,
        onSave: function() { togglePassword(); },
        params: {
            enable_field                : { type: 'checkbox', default: true },
            save_password               : { type: 'checkbox', default: true },
            show_password_as_clear_text : { type: 'checkbox', default: false }
        }
    });
    console.log("MonkeyConfig loaded; The settings menu will be enabled");
}
catch(err) {
    console.log("MonkeyConfig not loaded; The settings menu will be disabled");
}

// -----------------------------------------------------------------------------
//
// -----------------------------------------------------------------------------

var pwdfields = $('input:password');

function togglePassword() {
    pwdfields = pwdfields.add( $('input:password') );
    cfg.get('show_password_as_clear_text') ? pwdfields.attr('type', 'text') : pwdfields.attr('type', 'password');
};

function parse(element) {
    if ( cfg.get("enable_field") ) {
        $('input', element).andSelf().removeAttr("disabled readonly").removeProp("disabled readonly");
    }
    if ( cfg.get("save_password") ) {
        $('input', element).andSelf().attr("autocomplete", "on").prop("autocomplete", "on");
    }
    togglePassword();
}

$(function() {
    $("body").on("click focus load ready", "form, input" , function() {
        parse(this)
    });
});

// -----------------------------------------------------------------------------
// KNOWN FUNCTIONS THAT PREVENTS AUTOCOMPLETE FROM WORKING
// -----------------------------------------------------------------------------

unsafeWindow.C = function(G) { return false };
