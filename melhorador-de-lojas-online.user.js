// ==UserScript==
// @name            Melhorador de lojas online
// @namespace       http://stackoverflow.com/users/982924/rasg
// @author          RASG
// @description:en  Brazillian online sale sites are awful. This is my attempt to fix that.
// @description:pt  Bora melhorar o layout das nossas lojas online.
// @require         http://code.jquery.com/jquery.min.js
// @require         https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require         https://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @require         https://raw.githubusercontent.com/yodog/userscripts/master/online-store-beautifier/boletando.js
// @require         https://raw.githubusercontent.com/yodog/userscripts/master/online-store-beautifier/magazinevoce.js
// @require         https://raw.githubusercontent.com/yodog/userscripts/master/online-store-beautifier/pelando.js
// @resource        toastcss  https://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @include         http*://*boletando.com/*
// @include         http*://*magazinevoce.com.br/*
// @icon            https://www.google.com/s2/favicons?domain=pelando.com.br
// @version         2021.09.10.1449
// @grant           GM_addStyle
// @grant           GM_getMetadata
// @grant           GM_getResourceText
// @grant           GM_getValue
// @grant           GM_notification
// @grant           GM_registerMenuCommand
// @grant           GM_setValue
// @grant           GM_xmlhttpRequest
// @run-at          document-start
// @noframes
// ==/UserScript==

// -----------------------------------------------------------------------------
// DONE: magazinevoce.com.br
// TODO: americanas.com.br boletando.com extra.com.br mercadolivre.com.br pelando.com.br
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// LOAD TOAST NOTIFICATIONS LIBRARY
// -----------------------------------------------------------------------------

// @require     https://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @resource    toastcss  https://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @grant       GM_addStyle
// @grant       GM_getResourceText

GM_addStyle( GM_getResourceText("toastcss") );

var toast = siiimpleToast.setOptions({
    position: 'top|right',
    duration: 4000,
});

// -----------------------------------------------------------------------------
// PREVENT JQUERY CONFLICT
// -----------------------------------------------------------------------------

var $      = window.$;
var jQuery = window.jQuery;

this.$ = this.jQuery = jQuery.noConflict(true);

if (typeof $ == 'undefined') console.log('JQuery not found; The script will certainly fail');

// -----------------------------------------------------------------------------
// OPTIONS / CONFIG MENU
// -----------------------------------------------------------------------------

var parametros = {
    code_font_resize : { type: 'checkbox', default: false },
    code_font_size   : { type: 'number',   default: 12 },
    layout           : { type: 'select',   choices: [ 'padrao', 'lista', 'mini lista' ], default: 'padrao' },
    page_wide        : { type: 'checkbox', default: true },
};

var cfg;
try {
    cfg = new MonkeyConfig({
        title:       'Config Github Options',
        menuCommand: true,
        onSave:      function() { fnSaveChanges(); },
        params:      parametros
    });
    console.log("MonkeyConfig loaded; The settings menu will be enabled");
}
catch(err) {
    console.log(err);
    console.log("MonkeyConfig not loaded; The settings menu will be disabled");
    cfg = {
        params: parametros,
        get:    function get(name) { return GM_getValue(name, this.params[name].default) }
    }
}

// -----------------------------------------------------------------------------
// START
// -----------------------------------------------------------------------------

var shouldreload = false;

// apply imediately at document start
fnCheckChanges();

// also wait for page load. jquery will be ready here
$(function() {

    // monitor the page for changes and reapply if necessary
    // use 'observer.disconnect()' in 'fnCheckChanges()' to stop monitoring
    var alvo = document.querySelector('body');
    var observer = new MutationObserver(fnCheckChanges);
    observer.observe(alvo, { attributes: false, characterData: false, childList: true, subtree: true });

});

// -----------------------------------------------------------------------------
// FUNCTIONS
// -----------------------------------------------------------------------------

function fnCheckChanges(changes, observer) {

    aplicar_boletando();
    aplicar_magazinevoce();
}

// -----------------------------------------------------------------------------

function fnSaveChanges() {

    $('body').on("click", "#reloadnow", function() {
        $(this).fadeOut("fast", function() { document.location.reload(false); });
    });

    var msg_success = 'Settings saved';
    toast.success(msg_success);

    var msg_reload = '<span id="reloadnow"> Some changes will be applied after you reload the page. <br> Click here to reload now </span>';
    if (shouldreload) toast.message(msg_reload, { delay: 3000, duration: 7000 });
}
