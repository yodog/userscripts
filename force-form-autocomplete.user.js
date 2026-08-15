// ==UserScript==
// @name            Force Forms AutoComplete
// @namespace       https://github.com/yodog/userscripts
// @author          yodog
// @version         2026.08.15.1433
// @description     Forces the autocomplete attribute, restores copy/paste, manages hidden fields, and shows passwords
// @require         https://code.jquery.com/jquery-3.7.1.min.js
// @require         https://raw.github.com/yodog/MonkeyConfig/master/monkeyconfig.js
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

if (typeof $ == 'undefined') console.log('JQuery not found. The script will certainly fail');

// -----------------------------------------------------------------------------
// OPTIONS / CONFIG MENU
// -----------------------------------------------------------------------------

/* global MonkeyConfig */

var parametros = {
    enable_all_fields:           { type: 'checkbox', default: false },
    save_password:               { type: 'checkbox', default: true },
    show_hidden_fields:          { type: 'checkbox', default: false },
    show_password_as_clear_text: { type: 'checkbox', default: false },
};

var cfg;
try {
    cfg = new MonkeyConfig({
        title:       'Userscript Options',
        menuCommand: true,
        params:      parametros,
        onSave:      function() { toggleHidden(); togglePassword(); },
    });
    console.log("MonkeyConfig loaded; The settings menu will be enabled");
}
catch(err) {
    console.log(err);
    console.log("MonkeyConfig not loaded; The settings menu will be disabled");
    cfg = {
        params: parametros,
        get:    function get(name) { return GM_getValue(name, this.params[name].default) },
    }
}

// funcao extra que retorna todas as configs do usuario. funciona com e sem MonkeyConfig
const getAllSettings = () => Object.fromEntries(Object.keys(parametros).map(k => [k, cfg.get(k)]));

// -----------------------------------------------------------------------------
// CORE LOGIC
// -----------------------------------------------------------------------------

GM_addStyle(`
    input.showhidden {
        border: 1px dashed #f44336 !important;
        display: inline-block !important;
        visibility: visible !important;
    }
`);

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType !== 1) return; // only continue on 'element' nodes
            if (node.matches('form, input, select, textarea') || node.querySelectorAll('form, input, select, textarea').length) {
                parse(node);
            }
        });
    });
});
observer.observe(document.body, { childList: true, subtree: true });

function togglePassword() {
    // Find any new password fields and mark them permanently
    $('input[type="password"]:not([data-was-password])').attr('data-was-password', 'true');

    // Select all fields that are currently, or EVER WERE, password fields
    let pwdfields = $('input[data-was-password="true"]');

    // Toggle type
    cfg.get('show_password_as_clear_text') ? pwdfields.attr('type', 'text') : pwdfields.attr('type', 'password');
}

function toggleHidden() {
    // Mark any hidden inputs we haven't seen yet so we keep tracking them later
    $('input[type="hidden"]:not([data-was-hidden]), input:hidden:not([data-was-hidden])').attr('data-was-hidden', 'true');

    // Select all fields that are currently, or EVER WERE, hidden
    let hiddenfields = $('input[data-was-hidden="true"]');

    // Toggle type and css class
    let show_hidden_fields = cfg.get('show_hidden_fields');
    hiddenfields.attr('type', show_hidden_fields ? 'text' : 'hidden').toggleClass('showhidden', show_hidden_fields);
}

function parse(element) {
    // converter elemento para objeto jquery
    let $self = $(element);

    // monitorar se estamos fazendo parse de muitos elementos
    console.debug('parsing', getAllSettings(), $self);

    // o selector ':input' busca todos os controles de formulario (input, textarea, select, button)
    // tambem vamos adicionar o proprio elemento caso ele seja um form, fieldset ou controle
    let $targets = $self.find(':input, fieldset').add($self.filter('form, fieldset, :input'));

    // remover disabled e readonly de tudo que foi encontrado
    if ( cfg.get("enable_all_fields") ) {
        $targets.removeAttr("disabled readonly").removeProp("disabled readonly");
    }

    // ligar o autocomplete apenas nos elementos que realmente suportam (button e fieldset não suportam)
    if ( cfg.get("save_password") ) {
        let $autoCompleteTargets = $targets.filter('form, input, select, textarea');
        $autoCompleteTargets.attr("autocomplete", "on").prop("autocomplete", "on");
    }

    // executar
    togglePassword();
    toggleHidden();
}

// -----------------------------------------------------------------------------
// RE-ENABLE EVENTS THAT WEBPAGES INSIST ON HIJACKING
// -----------------------------------------------------------------------------

const allowEvent = function(e){
  e.stopImmediatePropagation();
  return true;
};

document.addEventListener('copy', allowEvent, true);
document.addEventListener('cut', allowEvent, true);
document.addEventListener('paste', allowEvent, true);

// -----------------------------------------------------------------------------
// DISABLE KNOWN FUNCTIONS THAT PREVENTS AUTOCOMPLETE FROM WORKING
// -----------------------------------------------------------------------------

if ( (window.location.href).includes('google.com') ) {
    unsafeWindow.C = function(G) { return false };
}
