// ==UserScript==
// @name        Discuss Elastic Options
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description Add options to discuss.elastic.co to (1) expand code box, (2) resize code font size, (3) expand answer box
// @require     http://code.jquery.com/jquery.min.js
// @require     https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @include     http*://*discuss.elastic.co/*
// @version     2019.12.27.1446
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
            title: 'Config DE_code_box',
            menuCommand: true,
            onSave: function() { recarregar(); },
            params: {
                code_box_expand  : { type: 'checkbox', default: true },
                code_box_height  : { type: 'number',   default: 900 },
                code_font_resize : { type: 'checkbox', default: true },
                code_font_size   : { type: 'number',   default: 12 },
                page_wide        : { type: 'checkbox', default: true },
            }
        });
        console.log("Created var cfg = new MonkeyConfig");
    }
    catch(err) {
        console.log("Could not create var cfg = new MonkeyConfig");
    }

    var code_box_expand  = (!!cfg) ? cfg.get("code_box_expand")  : true;
    var code_box_height  = (!!cfg) ? cfg.get("code_box_height")  : 900;
    var code_font_resize = (!!cfg) ? cfg.get("code_font_resize") : true;
    var code_font_size   = (!!cfg) ? cfg.get("code_font_size")   : 12;
    var page_wide        = (!!cfg) ? cfg.get("page_wide")        : true;

    // ---
    // MODS
    // ---

    $(document).on('ready scroll', function() {

        if ( code_box_expand ) $('code').css({'max-height':code_box_height + 'px'})

        if ( code_font_resize ) $('blockquote, code, pre').css({'font-size':code_font_size + 'px'})

        if ( page_wide ) {

            $('#main-outlet').css({'max-width':'none'});
            $('.timeline-container').css({'margin-left':'90%'});
            $('.topic-body').css({
                'margin-right':'10%',
                'float':'unset',
                'width':'unset'
            });
        }
    });
});

// -----------------------------------------------------------------------------

function recarregar() {
    //alert('Recarregue a pagina para aplicar as alteracoes');
    document.location.reload(false);
}
