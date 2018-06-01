// ==UserScript==
// @name        stackoverflow code box options
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description stackoverflow code box options
// @require     http://code.jquery.com/jquery.min.js
// @require     https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @include     http*://*stackexchange.com/*
// @include     http*://*stackoverflow.com/*
// @version     2018.06.01.1101
// @grant       GM_addStyle
// @grant       GM_getMetadata
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// ==/UserScript==

// PREVENT JQUERY CONFLICT
this.$ = this.jQuery = jQuery.noConflict(true);

// START
$(function(){

    // ---
    // OPTIONS / CONFIG MENU
    // ---

    var cfg = new MonkeyConfig({
        title: 'Config SO_code_box',
        menuCommand: true,
        onSave: function() { recarregar(); },
        params: {
            answer_box_expand: { type: 'checkbox', default: true },
            answer_box_height: { type: 'number',   default: 400 },
            answer_box_width : { type: 'number',   default: 900 },
            code_box_expand  : { type: 'checkbox', default: true },
            code_box_height  : { type: 'number',   default: 900 },
            code_box_width   : { type: 'number',   default: 900 },
            code_font_resize : { type: 'checkbox', default: true },
            code_font_size   : { type: 'number',   default: 12 }
        }
    });

    var answer_box_expand = cfg.get("answer_box_expand");
    var answer_box_height = cfg.get("answer_box_height");
    var answer_box_width  = cfg.get("answer_box_width");
    var code_box_expand   = cfg.get("code_box_expand");
    var code_box_height   = cfg.get("code_box_height");
    var code_box_width    = cfg.get("code_box_width");
    var code_font_resize  = cfg.get("code_font_resize");
    var code_font_size    = cfg.get("code_font_size");

    // ---
    // MODS
    // ---

    $('div.inner-content, div#content').attr('style', 'width: auto !important');

    if ( answer_box_expand ) {
        $('.post-editor').css({'width':answer_box_width + 'px'})
        $('textarea').css({'height':answer_box_height + 'px'})
    }

    if ( code_box_expand ) {
        $('.post-text').css({'width':code_box_width + 'px'})
        $('pre.prettyprinted').css({'max-height':code_box_height + 'px'})
    }

    if ( code_font_resize ) {
        $('blockquote, code, pre').css({'font-size':code_font_size + 'px'})
    }


});

// -----------------------------------------------------------------------------

function recarregar() {
    //alert('Recarregue a pagina para aplicar as alteracoes');
    document.location.reload(false);
}
