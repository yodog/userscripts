// ==UserScript==
// @name        Docker Forum Options
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description Add options to forums.docker.com to (1) expand code box, (2) resize code font size, (3) expand answer box
// @require     http://code.jquery.com/jquery.min.js
// @require     https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require     https://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @resource    toastcss  https://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @include     https://forums.docker.com/*
// @icon        https://www.google.com/s2/favicons?domain=forums.docker.com
// @version     2020.01.15.1734
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
    code_box_expand  : { type: 'checkbox', default: true },
    code_box_height  : { type: 'number',   default: 900 },
    code_font_resize : { type: 'checkbox', default: true },
    code_font_size   : { type: 'number',   default: 12 },
    hide_page_header : { type: 'checkbox', default: false },
    page_wide        : { type: 'checkbox', default: true },
};

var cfg;
try {
    cfg = new MonkeyConfig({
        title:       'Config DF_code_box',
        menuCommand: true,
        onSave:      function() { recarregar(); },
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

$(function(){

    // ---
    // MODS
    // ---

    $(document).on('ready scroll', function() {

        if ( cfg.get("code_box_expand") ) {
            var code_box_height = cfg.get("code_box_height");
            $('code').css({'max-height':code_box_height + 'px'});
            shouldreload = true;
        }

        if ( cfg.get("code_font_resize") ) {
            var code_font_size = cfg.get("code_font_size");
            $('blockquote, code, pre').css({'font-size':code_font_size + 'px'});
        }

        var pageheader = $('header.header');
        if ( cfg.get("hide_page_header") ) {
            pageheader.hide();
        }
        else {
            pageheader.css({'height':'100px'});
            pageheader.show();
        }

        if ( cfg.get("page_wide") ) {
            $('#main-outlet').css({'max-width':'none'});
            $('.container.posts').css({'width':'unset'});
            $('.timeline-container').css({'margin-left':'90%'});
            $('.topic-body').css({
                'margin-right':'10%',
                'float':'unset',
                'width':'unset'
            });
            shouldreload = true;
        }
    });
});

// -----------------------------------------------------------------------------

function recarregar() {

    $('body').on("click", "#reloadnow", function() {
        document.location.reload(false);
    });

    var msg_success = 'Settings saved';
    toast.success(msg_success);

    var msg_reload = '<span id="reloadnow"> Some changes will be applied after you reload the page. <br> Click here to reload now </span>';
    if (shouldreload) toast.message(msg_reload, { delay:2000, duration:5000 });
}
