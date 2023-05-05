// ==UserScript==
// @name        Linkedin New Options
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description Add new options to Linkedin
// @require     http://code.jquery.com/jquery.min.js
// @require     https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require     https://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @resource    toastcss  https://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @include     http*://*linkedin.com/*
// @icon        https://www.google.com/s2/favicons?domain=linkedin.com
// @version     2023.05.05.1002
// @grant       GM_addStyle
// @grant       GM_getMetadata
// @grant       GM_getResourceText
// @grant       GM_getValue
// @grant       GM_notification
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// ==/UserScript==

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
    duration: 3000,
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
    open_links_in_new_tab : { type: 'checkbox', default: true },
    page_wide             : { type: 'checkbox', default: true },
};

var cfg;
try {
    cfg = new MonkeyConfig({
        title:       'Config Linkedin New Options',
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

    $('#ads-container, .org-container__ad-module, .ad-banner-container').remove();

    var page_size = '';
    if (cfg.get("page_wide")) page_size = 'unset';
    $('div.scaffold-layout-container').width('100%').css('max-width', page_size);
    $('div.job-view-layout > div.grid').width(page_size).css('max-width', page_size);
    $('button[data-control-name*="see_more"], button[aria-label*="Click to see more"]').click();

    if (cfg.get("open_links_in_new_tab")) fnReplaceLinks();
}

// -----------------------------------------------------------------------------

function fnReplaceLinks() {

    [...document.links].forEach(
        a => $(a).filter(function() {
            return this.href.match(/^http/) && this.hostname !== location.hostname;
        }).attr('target', '_blank')
    );
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
