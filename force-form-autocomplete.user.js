// ==UserScript==
// @name            Force Forms AutoComplete
// @namespace       https://github.com/yodog/userscripts
// @author          RASG
// @version         2026.07.09.1004
// @description     Forces the autocomplete attribute for all forms and input fields in the page
// @require         http://code.jquery.com/jquery-3.7.1.min.js
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
    var $self = $(element);

    // o selector ':input' busca todos os controles de formulario (input, textarea, select, button)
    // tambem vamos adicionar o proprio elemento caso ele seja um form, fieldset ou controle
    var $targets = $self.find(':input, fieldset').add($self.filter('form, fieldset, :input'));

    // remover disabled e readonly de tudo que foi encontrado
    if ( cfg.get("enable_field") ) {
        $targets.removeAttr("disabled readonly").removeProp("disabled readonly");
    }

    // liga o autocomplete apenas nos elementos que realmente suportam (button e fieldset não suportam)
    if ( cfg.get("save_password") ) {
        var $autoCompleteTargets = $targets.filter('form, input, textarea, select');
        $autoCompleteTargets.attr("autocomplete", "on").prop("autocomplete", "on");
    }

    togglePassword();
}

$(function() {
    $("body").on("click focus load ready", "form, input" , function() {
        parse(this)
    });
});

// -----------------------------------------------------------------------------
// RE-ENABLE EVENTS THAT WEBPAGES INSIST ON HIJACKING
// -----------------------------------------------------------------------------

var allowEvent = function(e){
  e.stopImmediatePropagation();
  return true;
};

document.addEventListener('copy', allowEvent, true);
document.addEventListener('paste', allowEvent, true);

// -----------------------------------------------------------------------------
// KNOWN FUNCTIONS THAT PREVENTS AUTOCOMPLETE FROM WORKING
// -----------------------------------------------------------------------------

unsafeWindow.C = function(G) { return false };
