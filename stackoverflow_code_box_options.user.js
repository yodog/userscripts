// ==UserScript==
// @name        stackoverflow code box options
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description stackoverflow code box options
// @require     http://code.jquery.com/jquery.min.js
// @require     https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @include     http*://*stackoverflow.com/*
// @version     2018.05.30.1238
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
$(window).load(function(){

    // ---
    // OPTIONS / CONFIG MENU
    // ---

    var cfg = new MonkeyConfig({
        title: 'Config SO_code_box',
        menuCommand: true,
        onSave: function() { recarregar(); },
        params: {
            code_box_expand: {
                type: 'checkbox',
                default: true
            },
            code_box_height: {
                type: 'number',
                default: 900
            },
            code_box_width: {
                type: 'number',
                default: 900
            },
            code_font_resize: {
                type: 'checkbox',
                default: true
            },
            code_font_size: {
                type: 'number',
                default: 12
            },
            answer_box_expand: {
                type: 'checkbox',
                default: true
            },
            answer_box_height: {
                type: 'number',
                default: 400
            },
            answer_box_width: {
                type: 'number',
                default: 900
            }
        }
    });

    var code_box_expand   = cfg.get("code_box_expand");
    var code_box_height   = cfg.get("code_box_height");
    var code_box_width    = cfg.get("code_box_width");
    var code_font_resize  = cfg.get("code_font_resize");
    var code_font_size    = cfg.get("code_font_size");
    var answer_box_expand = cfg.get("answer_box_expand");
    var answer_box_height = cfg.get("answer_box_height");
    var answer_box_width  = cfg.get("answer_box_width");

    // ---
    // ELEMENTS
    // ---

    var divinnercontent = $('div.inner-content');
    var posttext = $('.post-text');
    var codebox = $('pre.prettyprinted');
    var codeboxcode = codebox.find('code');
    var posteditor = $('.post-editor');
    var youranswer = posteditor.find('textarea');

    // ---
    // MODS
    // ---

    divinnercontent.attr('style', 'width: auto !important');

    if ( code_box_expand ) {
        posttext.css({'width':code_box_width + 'px'})
        codebox.css({'max-height':code_box_height + 'px'})
    }

    if ( code_font_resize ) {
        codeboxcode.attr('style', 'font-size: ' + code_font_size + 'px !important');
    }

    if ( answer_box_expand ) {
        posteditor.css({'width':answer_box_width + 'px'})
        youranswer.css({'height':answer_box_height + 'px'})
    }

});


// ---
//
// ---

function recarregar() {
    alert('Recarregue a pagina para aplicar as alteracoes');
}
