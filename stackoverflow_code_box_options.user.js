// ==UserScript==
// @name        StackOverflow CodeBox Options
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description Add options to StackOverflow to (1) expand code box, (2) resize code font size, (3) expand answer box
// @require     http://code.jquery.com/jquery.min.js
// @require     https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @include     http*://*stackexchange.com/*
// @include     http*://*stackoverflow.com/*
// @version     2018.06.13.1204
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

    try {
        var cfg = new MonkeyConfig({
            title: 'Config SO_code_box',
            menuCommand: true,
            onSave: function() { recarregar(); },
            params: {
                answer_box_expand   : { type: 'checkbox', default: true },
                answer_box_height   : { type: 'number',   default: 400 },
                code_box_expand     : { type: 'checkbox', default: true },
                code_box_height     : { type: 'number',   default: 900 },
                code_font_resize    : { type: 'checkbox', default: true },
                code_font_size      : { type: 'number',   default: 12 },
                page_wide           : { type: 'checkbox', default: true },
                remove_left_sidebar : { type: 'checkbox', default: true }
            }
        });
        console.log("Created var cfg = new MonkeyConfig");
    }
    catch(err) {
        console.log("Could not create var cfg = new MonkeyConfig");
    }

    var answer_box_expand   = (!!cfg) ? cfg.get("answer_box_expand")   : true;
    var answer_box_height   = (!!cfg) ? cfg.get("answer_box_height")   : 400;
    var code_box_expand     = (!!cfg) ? cfg.get("code_box_expand")     : true;
    var code_box_height     = (!!cfg) ? cfg.get("code_box_height")     : 900;
    var code_font_resize    = (!!cfg) ? cfg.get("code_font_resize")    : true;
    var code_font_size      = (!!cfg) ? cfg.get("code_font_size")      : 12;
    var page_wide           = (!!cfg) ? cfg.get("page_wide")           : true;
    var remove_left_sidebar = (!!cfg) ? cfg.get("remove_left_sidebar") : true;

    // ---
    // MODS
    // ---

    $('#mainbar').css({'text-align':'justify'});

    if ( answer_box_expand ) $('textarea').css({'height':answer_box_height + 'px'})

    if ( code_box_expand ) $('pre').css({'max-height':code_box_height + 'px'})

    if ( code_font_resize ) $('blockquote, code, pre').css({'font-size':code_font_size + 'px'})

    if ( page_wide ) {
        $('div.container, div#content').css({'max-width':'99%'});
        //$('div#content, div.inner-content').css({'width':'auto'});
        //$('div#content, div.inner-content').attr('style', 'width: auto !important');
    }

    if ( remove_left_sidebar ) $('.left-sidebar, #left-sidebar').remove();

});

// -----------------------------------------------------------------------------

function recarregar() {
    //alert('Recarregue a pagina para aplicar as alteracoes');
    document.location.reload(false);
}
