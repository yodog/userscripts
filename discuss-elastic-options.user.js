// ==UserScript==
// @name        Discuss Elastic Options
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description Add options to discuss.elastic.co to (1) expand code box, (2) resize code font size, (3) expand answer box
// @require     http://code.jquery.com/jquery.min.js
// @require     https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @include     http*://*discuss.elastic.co/*
// @icon        https://www.google.com/s2/favicons?domain=discuss.elastic.co
// @version     2019.12.27.1751
// @grant       GM_addStyle
// @grant       GM_getMetadata
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// ==/UserScript==

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
    page_wide        : { type: 'checkbox', default: true },
};

var cfg;
try {
    cfg = new MonkeyConfig({
        title:       'Config DE_code_box',
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

        if ( cfg.get("page_wide") ) {
            $('#main-outlet').css({'max-width':'none'});
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
    if (! shouldreload) return;
    //alert('Recarregue a pagina para aplicar as alteracoes');
    document.location.reload(false);
}
