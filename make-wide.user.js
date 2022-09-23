// ==UserScript==
// @name        Make my Whole Wide - stonks edition
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description Enlarge selected pages to use the entire viewport width (perfect for wide screen monitors)
// @require     http://code.jquery.com/jquery.min.js
// @require     https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require     https://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @resource    toastcss  https://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @match       *://*.analisedeacoes.com/*
// @match       *://*.clubefii.com.br/*
// @match       *://*.fiis.com.br/lupa-de-fiis/
// @match       *://*.fundsexplorer.com.br/ranking
// @match       *://*.google.com/finance/*
// @match       *://*.investidor10.com.br/*
// @match       *://*.investing.com/*
// @match       *://*.justetf.com/*
// @match       *://*.mycapital.com.br/*
// @match       *://*.oceans14.com.br/acoes/*
// @match       *://*.simplywall.st/*
// @icon        https://cdn3.emoji.gg/emojis/6645_Stonks.png
// @version     2022.09.23.2048
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

var i = 0;
function fnCheckChanges(changes, observer) {

    console.log('fnCheckChanges', i++);

    $('footer, #footer').hide();

    if ( (window.location.href).includes('analisedeacoes.com') ) {
        $('div.container').css({'max-width':'unset'});
        $('div.table-fixed').css({'max-height':'unset'});
    }

    if ( (window.location.href).includes('clubefii.com.br') ) {
        $('span.exibir-resposta:lt(3)').filter(':visible').click();
        $('div[id*="sem_autorizacao"], #modulo_seja_assinante').hide();
        $('div.container_comentarios, #tabela_rentabilidade, ul#posts').css({'max-width':'unset'});
        $('tr:odd').filter(':visible').css('background-color', 'mistyrose');
        $('tr:even').filter(':visible').css('background-color', 'inherit');

        $('div[id*="grafico"], input, .adiciona_blur, .bloqueado, .desativa_selecao, .icon-regular_lock, .lock-assinatura, #travar')
            .removeClass('adiciona_blur adiciona_blur_light bloqueado cadeado desativa_selecao icon-regular_lock lock-assinatura')
            .css({'pointer-events':'unset'});
    }

    if ( (window.location.href).includes('fiis.com.br') ) {
        $('div.container').width('unset');
        $('div.dataTables_scrollBody').css({'max-height':'unset', 'height':'unset'});
        $('td, th').css({'font-size':'0.9em', 'padding':'3px', 'vertical-align':'middle'});
    }

    if ( (window.location.href).includes('fundsexplorer.com.br') ) {
        $('div.container').width('unset');
        $('div#scroll-wrapper').css({'height':'unset'});
        $('td, th').css({'font-size':'0.9em', 'padding':'4px', 'vertical-align':'middle'});
        $('tr:odd').filter(':visible').css('background-color', 'mistyrose');
        $('tr:even').filter(':visible').css('background-color', 'inherit');
    }

    if ( (window.location.href).includes('google.com') ) {
        $('div').filter(function() {return ($(this).width() == 1024);}).css({'max-width':'unset'});
    }

    if ( (window.location.href).includes('investidor10.com.br') ) {
        $('div.container').css({'max-width':'unset'});
        $('div.grid').css({'grid-template-columns':'repeat(6,1fr)'});
        $('#indicators').addClass('do-medias');
        $('div.box.especial div.collapsed').removeClass('collapsed').addClass('expanded');

        $('div.payment').filter(function() {
            var strDataCom = $(this).find('p.payment-with').text().match(/(\d+\/\d+\/\d+)/);
            var objDataCom = new Date(strDataCom[0].split('/').reverse().join('/'));
            var objHoje = new Date();
            return (objDataCom < objHoje);
        }).hide();
    }

    if ( (window.location.href).includes('investing.com') ) {
        $('div.wrapper').width('unset').css({'max-width':'1500px'});
        $('#fullColumn, #leftColumn').width('unset');
        $('span.earnCalCompanyName').css({'max-width':'unset'});
        $('tr:odd').filter(':visible').css('background-color', 'mistyrose');
        $('tr:even').filter(':visible').css('background-color', 'inherit');
        $('#marketsPerformance').css({'table-layout':'unset'});
    }

    if ( (window.location.href).includes('justetf.com') ) {
        $('div.container').width('unset');
        $('tr:odd').filter(':visible').css('background-color', 'mistyrose');
        $('tr:even').filter(':visible').css('background-color', 'inherit');
    }

    if ( (window.location.href).includes('mycapital.com.br') ) {
        $('p-sidebar').removeClass('sidebar-retraida sidebar-mobile-fechada').addClass('sidebar-expandida sidebar-mobile-aberta');
        $('div.p-sidebar').css({'float':'left', 'position':'sticky'});
        $('div.layout-content').css({'position':'relative'});
        $('div.p-overlaypanel').css({'position':'fixed'});
        $('.card-previsao-imposto').height('unset');
        $('.card-previsao-imposto__valores, .valores-imposto-irrf').removeClass('fechar valores-imposto-irrf-fechado').addClass('expandir').css({'position':'unset'});
    }

    if ( (window.location.href).includes('oceans14.com.br') ) {
        $('div.container').width('unset');
    }

    if ( (window.location.href).includes('simplywall.st') ) {
        $('#root').css({'filter':'unset'});
        $('section').css({'max-width':'unset'});
        $('button:contains("Show all")').filter(':visible').click();
        $('div').filter(function() {return ($(this).width() > 1024);}).css({'max-width':'unset'});
    }
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
