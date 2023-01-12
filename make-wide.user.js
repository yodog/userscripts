// ==UserScript==
// @name        Make my Whole Wide (yes, its a pun) - stonks edition
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description Enlarge selected pages to use the entire viewport width (perfect for wide screen monitors)
// @require     http://code.jquery.com/jquery.min.js
// @require     https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require     https://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @resource    toastcss  https://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @match       *://admin.carteiradeinvestimentos.com/*
// @match       *://app.dividendos.me/*
// @match       *://app.genialinvestimentos.com.br/*
// @match       *://app.kinvo.com.br/*
// @match       *://web.whatsapp.com/*
// @match       *://*.analisedeacoes.com/*
// @match       *://*.clubefii.com.br/*
// @match       *://*.fiis.com.br/*
// @match       *://*.fundsexplorer.com.br/ranking
// @match       *://*.google.com/finance/*
// @match       *://*.investidor10.com.br/*
// @match       *://*.investing.com/*
// @match       *://*.justetf.com/*
// @match       *://*.mycapital.com.br/*
// @match       *://*.oceans14.com.br/acoes/*
// @match       *://*.reddit.com/*
// @match       *://*.simplywall.st/*
// @match       *://*.statusinvest.com.br/carteira/*
// @match       *://*.trademap.com.br/portfolio/*
// @match       *://*.xpi.com.br/*
// @icon        https://cdn3.emoji.gg/emojis/6645_Stonks.png
// @version     2023.01.12.1433
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @noframes
// ==/UserScript==

// -----------------------------------------------------------------------------
// LOAD TOAST NOTIFICATIONS LIBRARY
// -----------------------------------------------------------------------------

/* global siiimpleToast */

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

/* global $, jQuery */

this.$ = this.jQuery = jQuery.noConflict(true);

if (typeof $ == 'undefined') console.log('JQuery not found; The script will certainly fail');

// -----------------------------------------------------------------------------
// START
// -----------------------------------------------------------------------------

var shouldreload = false;

// ---
// this is a test
// ---
// im calling the mutation observer before the 'DOM ready' status
// trying to see if jquery fails
// ---

if ( (window.location.href).includes('app.genialinvestimentos') ) {
    console.log('app.genialinvestimentos');

    // sort bonds by due date
    $(document).on('click load ready scroll', 'div.MuiButtonBase-root', () => {
        if ( (window.location.href).includes('carteira/posicao') ) {
            //console.log('carteira/posicao');
            sortUsingNestedText('div.Mui-expanded:contains("Renda Fixa") tbody.MuiTableBody-root', 'tr.MuiTableRow-root', 'td:nth-child(6)', true);
        }
    });

    const mo = new MutationObserver((changes, observer) => {
        changes.forEach(function(mutation) {
            var newNodes = mutation.addedNodes;
            //console.log('newNodes', newNodes);

            // click button to show hidden values
            $('button span:contains("Exibir valores")').click();

            // sort statement by date
            if ( (window.location.href).includes('extrato/a-liquidar') ) {
                //console.log('extrato/a-liquidar', changes);
                $(newNodes).filter('div.MuiBox-root.MuiGrid-root').has('tbody.MuiBox-root').each(function() {
                    sortUsingNestedText('tbody.MuiBox-root', 'tr[data-testid="item__box"]', 'td:first', true);
                });
            }

            // expand investments info
            if ( (window.location.href).includes('investir/renda-fixa') ) {
                //console.log('investir/renda-fixa', changes);
                $(newNodes).filter('div.MuiContainer-root[role=item]').each(function() {
                    var linha = $(this);
                    $('[data-testid=list-item__content]', linha).css({'justify-content':'unset'});
                });
            }
        });
    });
    mo.observe(document.querySelector('body'), { attributes: false, characterData: false, childList: true, subtree: true });
}

// ---
// here the DOM is ready (but not JQuery)
// ---
// its a safe place to add elements to the page without interfering with the mutation observer
// and to call non-jquery functions that should run only once
// ---

(function() {
    console.log('DOM ready. Waiting for JQuery');

    // ordenar alfabeticamente o menu lateral
    // adicionar uma barra no topo que depois ira conter o total dos rendimentos
    if ( (window.location.href).includes('clubefii') ) {
        sortUsingNestedText('ul#menu', 'li', 'a');
        $('div#barra').prepend('<div id="rasg" style="background:pink ; border:1px dotted red ; text-align:center"> ACUMULADO: <span id="soma"> 0 </span> MEDIA: <span id="media"> 0 </span> </div>');
    }
})();

// ---
// here JQuery is ready (and the DOM also)
// ---
// we can call jquery functions
// and its a good place to start the mutation observer
// ---

$(function() {
    console.log('JQuery ready');

    // monitor the page for changes and reapply if necessary
    // use 'observer.disconnect()' in 'fnCheckChanges()' to stop monitoring
    var alvo = document.querySelector('body');
    var observer = new MutationObserver(fnCheckChanges);
    observer.observe(alvo, { attributes: false, characterData: false, childList: true, subtree: true });

    // soma e media dos rendimentos trava a pagina se deixado no bloco padrao, por isso separei
    if ( (window.location.href).includes('clubefii') ) {
        const dq = document.querySelector('body');
        const mo = new MutationObserver((changes, observer) => {
            if ( (window.location.href).includes('proventos') ) {
                let media = 0;
                let soma = 0;
                let celulas = $('div.tabela-proventos table tbody td:nth-child(7)');
                celulas.each(function() {
                    let value = +($(this).text().replace(',', '.').replace('%', ''));
                    soma += value;
                    console.log('value', value, 'soma', soma);
                });
                let m = (soma / celulas.length);
                media = Math.trunc(m * 100) / 100;
                console.log('soma', soma, 'media', media);

                $('span#soma').text(soma);
                $('span#media').text(media);
            }
        });
        mo.observe(dq, { attributes: true, characterData: false, childList: false, subtree: true });
    }

    // statusinvest requires only 'childList: true' to monitor for changes (oftentimes not even that)
    if ( (window.location.href).includes('statusinvest.com.br') ) {
        const dq = document.querySelector('body');
        const mo = new MutationObserver((changes, observer) => {
            $('#rf-transaction-result ul.dropdown-content li:contains("TODOS")').click();
        });
        mo.observe(dq, { attributes: false, characterData: false, childList: true, subtree: false });

        $('#dropdown-year-to-year-categories-grid li').addClass('selected').first().click();
        $('#main-result a[role="button"] :contains("Categoria")').click();
        $('#earning-maint-result a[role="button"] :contains("Categoria")').click();
    }
});

// -----------------------------------------------------------------------------
// FUNCTION TO RUN ON EVERY CHANGE
// -----------------------------------------------------------------------------

var i = 0;
function fnCheckChanges(changes, observer) {

    console.log('fnCheckChanges', i++);

    //$('footer, #footer').hide();

    // --- reddit (waiting for a dedicated script)
    if ( (window.location.href).includes('reddit.com') ) {
        $('div._1OVBBWLtHoSPfGCRaPzpTf, div._3xX726aBn29LDbsDtzr_6E, div._3tw__eCCe7j-epNCKGXUKk').width('unset').css('max-width', 'unset');
        $('div.Chtkt3BCZQruf0LtmFg2c').css({'max-height':'unset', '-webkit-mask-image':'unset'});
    }

    // --- whatsapp (waiting for a dedicated script)
    if ( (window.location.href).includes('web.whatsapp') ) {
        $('footer, #footer').show();
        $('div._3mSPV, div._26F99, div.O2yv0').width('unset').css('max-width', 'unset');
        $('div.message-in').css('align-items', 'unset');
        $('div.mwp4sxku').css('min-height', '5em');
    }

    if ( (window.location.href).includes('analisedeacoes.com') ) {
        $('div.container').css({'max-width':'unset'});
        $('div.table-fixed').css({'max-height':'unset'});
    }

    if ( (window.location.href).includes('app.dividendos.me') ) {
        $('div.PageDetailsContainer, div.PortfolioSummaryView').css({'max-width':'unset'});
    }

    if ( (window.location.href).includes('app.kinvo') ) {
        $('section.premium-feature-lock').remove();
        if ( (window.location.href).includes('carteira/') ) {
            $('div.card__content div').css('max-height', '70vh');
            //$('div.card__content div').css('overflow', 'unset');
            if ( (window.location.href).includes('analises/proventos') ) {
                $('main section section section').filter(':contains("Hist"), :contains("Proventos por ativo")').css('grid-row-start', '6');
            }
        }
    }

    if ( (window.location.href).includes('carteiradeinvestimentos.com') ) {
        $('div[class*="blocked"], div[class*="pro-func"]').alterClass( 'blocked* pro-func*', 'rasg' )
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
        $('div.wrapper').css({'max-width':'unset'});
        $('div.default-fiis-table').width('unset').css({'max-width':'unset', 'text-align':'-webkit-center'});
        $('div.default-fiis-table__container').css({'max-width':'unset', 'max-height':'unset'});
        $('table.default-fiis-table__container__table').width('unset');
        $('td, th').css({'border-left':'1px dotted black', 'font-size':'0.7em', 'max-width':'150px', 'padding':'5px', 'vertical-align':'middle'});
        $('tr:odd').filter(':visible').css('background-color', 'mistyrose');
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
        $(document.body).css('overflow', 'auto');
        $('div#root div.hfyYtE').css('display', 'unset');
        $('section.gKkKsf, div.gVuFnq, section.hKzrpd, section.FIHPB').css('max-width', 'unset');
        //$('#root').css({'filter':'unset'});
        //$('section').css({'max-width':'unset'});
        //$('button:contains("Show all")').filter(':visible').click();
        //$('div').filter(function() {return ($(this).width() > 1024);}).css({'max-width':'unset'});
    }

    if ( (window.location.href).includes('trademap.com.br/portfolio/statement/agenda') ) {
        $('fla-tab').css('display', 'flex');
        $('schedule-component > div.schedule-month').detach().appendTo('fla-tab');
        $('div.calendar-width').css('max-width', '40vw');
        $('div#schedule-grid').width('-webkit-fill-available').css({'max-width':'45vw', 'min-height':'50vh'});
    }

    if ( (window.location.href).includes('xpi.com.br') ) {
        $('div.container_12').css({'margin':'1em'}).width('unset');
        $('div.grid_12').css({'float':'unset'}).width('unset');
        $('div.advanced-filters, div.secondary-wrapper-content').css({'max-width':'unset'});
    }
}

// -----------------------------------------------------------------------------
// AUX FUNCTIONS
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

// -----------------------------------------------------------------------------

function sortUsingNestedText(parentSelector, childSelector, keySelector, keyIsDate=false) {

    console.log('---> ordenando o elemento', parentSelector);

    parentSelector = $(parentSelector);

    var items = parentSelector.children(childSelector).sort(function(a, b) {
        var vA = $(keySelector, a).text().trim();
        var vB = $(keySelector, b).text().trim();

        //console.log('texto', vA, vB);

        // converte dd/mm/yyyy para yyyy/mm/dd
        if (keyIsDate) {
            vA = new Date(vA.split('/').reverse().join('/'));
            if ( isNaN(vA.getTime()) ) vA = new Date('2029/01/01');

            vB = new Date(vB.split('/').reverse().join('/'));
            if ( isNaN(vB.getTime()) ) vB = new Date('2029/01/01');
        }

        //console.log('data', vA, vB);
        return (vA < vB) ? -1 : (vA > vB) ? 1 : 0;
    });

    //console.log('items', items);
    parentSelector.append(items);
}

// -----------------------------------------------------------------------------

/**
 * jQuery alterClass plugin
 *
 * Remove element classes with wildcard matching. Optionally add classes:
 *   $( '#foo' ).alterClass( 'foo-* bar-*', 'foobar' )
 *
 * Copyright (c) 2011 Pete Boere (the-echoplex.net)
 * Free under terms of the MIT license: http://www.opensource.org/licenses/mit-license.php
 *
 */

(function ($) {
    $.fn.alterClass = function (removals, additions) {
        var self = this;

        if (removals.indexOf('*') === -1) {
            // Use native jQuery methods if there is no wildcard matching
            self.removeClass(removals);
            return !additions ? self : self.addClass(additions);
        }

        var patt = new RegExp('\\s' +
            removals.
                replace(/\*/g, '[A-Za-z0-9-_]+').
                split(' ').
                join('\\s|\\s') +
            '\\s', 'g');

        self.each(function (i, it) {
            var cn = ' ' + it.className + ' ';
            while (patt.test(cn)) {
                cn = cn.replace(patt, ' ');
            }
            it.className = $.trim(cn);
        });

        return !additions ? self : self.addClass(additions);
    };
})(jQuery);

// -----------------------------------------------------------------------------
