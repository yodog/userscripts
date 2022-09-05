// ==UserScript==
// @name        Make my Whole Wide
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description Enlarge selected pages to use the entire viewport width (perfect for wide screen monitors)
// @require     http://code.jquery.com/jquery.min.js
// @require     https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require     https://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @resource    toastcss  https://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @match       *://*.clubefii.com.br/*
// @match       *://*.fiis.com.br/lupa-de-fiis/
// @match       *://*.fundsexplorer.com.br/ranking
// @match       *://*.investing.com/*
// @match       *://*.google.com/finance/*
// @match       *://*.oceans14.com.br/acoes/comparador-acoes/*
// @icon        https://www.google.com/s2/favicons?domain=google.com/finance
// @version     2022.09.05.0937
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @run-at      document-start
// @noframes
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
// START
// -----------------------------------------------------------------------------

var shouldreload = false;

// apply imediately at document start
fnCheckChanges();

// here the DOM is ready (but not JQuery)
(function() {

    console.log('DOM ready. Waiting for JQuery');

})();

// here JQuery is ready
$(function() {

    console.log('JQuery ready');

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

    console.log('fnCheckChanges');

    // All
    $('tr:odd').filter(':visible').css('background-color', 'mistyrose');
    $('tr:even').filter(':visible').css('background-color', 'inherit');

    // Clube FII
    $('span.exibir-resposta:lt(3)').filter(':visible').click();
    $('div[id*="sem_autorizacao"], footer, #modulo_seja_assinante').hide();
    $('div.container_comentarios, #tabela_rentabilidade, ul#posts').css({'max-width':'unset'});
    $('div[id*="grafico"], input, .adiciona_blur, .bloqueado, .desativa_selecao, .icon-regular_lock, .lock-assinatura, #travar').removeClass('adiciona_blur adiciona_blur_light bloqueado cadeado desativa_selecao icon-regular_lock lock-assinatura').css({'pointer-events':'unset'});

    // fiis.com.br
    $('div.dataTables_scrollBody').css({'max-height':'unset', 'height':'unset'});

    // Funds Explorer
    $('div.container').width('unset');
    $('div#scroll-wrapper').css({'height':'unset'});
    $('td, th').css({'font-size':'0.9em', 'padding':'3px', 'vertical-align':'middle'});

    // Google Finance
    $('div').filter(function() {return ($(this).width() == 1024);}).css({'max-width':'unset'});

    // Investing
    $('#leftColumn').width('unset');
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
