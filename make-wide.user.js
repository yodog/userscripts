// ==UserScript==
// @name        MakeWide
// @namespace   http://github.com/yodog/userscripts
// @author      yodog
// @description Enlarge selected pages to use the entire viewport width (perfect for wide screen monitors)
// @require     http://code.jquery.com/jquery.min.js
// @require     http://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require     http://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @require     http://cdn.datatables.net/1.13.1/js/jquery.dataTables.min.js
// @resource    toastcss   http://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @resource    datatables http://cdn.datatables.net/1.13.1/css/jquery.dataTables.min.css
// @match       *://*.fragrantica.com/*
// @match       *://*.fragrantica.com.br/*
// @match       *://*.reddit.com/*
// @match       *://*.redgifs.com/*
// @connect     *
// @icon        https://images.icon-icons.com/3251/PNG/512/panel_left_expand_regular_icon_203421.png
// @version     2025.06.13.1344
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

fnInjectStyle( GM_getResourceText("toastcss") );

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
// PREVENT ANIMATIONS THAT SLOW DOWN THE PAGE
// -----------------------------------------------------------------------------

console.log("Disabling animations");

document.getAnimations().forEach((animation) => { animation.cancel() });

const cssanimacoes = `
*, *:before, *:after {
    -moz-animation: none !important;
    -moz-transition-property: none !important;
    -moz-transition: none !important;
    -ms-animation: none !important;
    -ms-transform: none !important;
    -ms-transition-property: none !important;
    -o-animation: none !important;
    -o-transform: none !important;
    -o-transition-property: none !important;
    -o-transition: none !important;
    -webkit-animation: none !important;
     -webkit-transition: none !important;
     -webkit-transition-property: none !important;
    animation: none !important;
    animation-duration: 0s !important;
    animation-play-state: paused;
     transition: none !important;
     transition-property: none !important;
}`

fnInjectStyle(cssanimacoes);

// -----------------------------------------------------------------------------
// START
// -----------------------------------------------------------------------------

if ( (window.location.href).includes('fragrantica.com') ) {
    console.log('fragrantica.com');

    const css = `
div.grid-container { max-width: unset !important ; }
div.callout > div.grid-x { max-height: 26em !important ; }
div.grid-x:has(img.perfume-on-shelf) { flex-flow: wrap-reverse !important ; }
img.perfume-on-shelf { height: unset !important ; }
    `

    fnInjectStyle(css);

    //const elementoProsEContras = $('div.grid-x.grid-margin-x.grid-margin-y:has(:contains(Pros))');
    //console.log('elementoProsEContras', elementoProsEContras);
    //injetarElementoDaPaginaInglesa('#pros-cons-section', '.perfume-main-content', 'append');

    if ( (window.location.href).includes('perfume') ) {
        const socialcardlink = $('div#toptop a[href*=perfume-social-cards]').attr('href');
        const container = $('div.grid-x.grid-margin-x.grid-margin-y > div.cell.small-6:has(img[itemprop=image])');
        const socialcard = container.clone().find('img[itemprop=image]').attr('src', socialcardlink).removeAttr('srcset height width');
        socialcard.prependTo(container);

        $(document, 'body').on('click load pageshow ready scroll', () => {
            $('iframe#idIframeMMM').remove();
            $('input#showDiagram:not(:checked)').click();
        });
    }
}

// -----------------------------------------------------------------------------

if ( (window.location.href).includes('reddit.com') ) {
    console.log('reddit.com');

    const css = `
div.subgrid-container { min-width: -moz-available !important ; min-width: -webkit-fill-available !important ; }
div.main-container { grid-template-columns: minmax(0,1fr) minmax(0,auto) !important ; }
main.main { max-width: unset !important ; }
@media (min-width: 768px) { #right-sidebar-container { display: none ; } }
@media (min-width: 1200px) { #right-sidebar-container { display: block ; } }
`
    fnInjectStyle(css);
}

// -----------------------------------------------------------------------------

if ( (window.location.href).includes('redgifs.com') ) {
    console.log('redgifs.com');

    $(document).on('click load pageshow ready scroll', () => {
        $('.skyWrapper > .side').remove();
        $('div.watchFeed, div.previewFeed').css({'max-width':'unset'});
    });
}

// -----------------------------------------------------------------------------
// AUX FUNCTIONS
// -----------------------------------------------------------------------------

function fnInjectStyle(css) {
    try {
        console.log('Injetando css na pagina');
        GM_addStyle(css);
    }
    catch (e) {
        console.log('GM_addStyle falhou, usando fallback com jQuery');
        $('<style>').attr('type', 'text/css').text(css).addClass('cssinjetado').appendTo('head');
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

            //console.log('alterClass i', i);
            //console.log('alterClass it', it);
            //console.log('alterClass patt', patt);
        });

        return !additions ? self : self.addClass(additions);
    };
})(jQuery);

// -----------------------------------------------------------------------------

/**
 * Uma função auxiliar que envolve GM_xmlhttpRequest em uma Promise para uso com async/await.
 * @param {object} options - As opções para GM_xmlhttpRequest.
 * @returns {Promise<object>} Uma promessa que resolve com a resposta em caso de sucesso ou rejeita em caso de erro.
 */

function fetchAsyncGM(options) {
    return new Promise((resolve, reject) => {
        options.onload = response => (response.status >= 200 && response.status < 400) ? resolve(response) : reject(response);
        options.onerror = error => reject(error);
        GM_xmlhttpRequest(options);
    });
}

// -----------------------------------------------------------------------------

/**
 * (Versão async/await)
 * Busca um elemento de uma página correspondente no fragrantica.com e o injeta na página atual do fragrantica.com.br.
 *
 * @param {string} selectorDoElementoFonte - O seletor CSS do elemento a ser copiado da página em inglês. Ex: '#notas_de_topo'.
 * @param {string} selectorDoElementoAlvo - O seletor CSS do elemento na página em português onde o novo conteúdo será injetado. Ex: '#bloco_principal'.
 * @param {string} [posicaoDeInjecao='append'] - Como injetar o elemento. Opções: 'append', 'prepend', 'before', 'after'.
 */

async function injetarElementoDaPaginaInglesa(selectorDoElementoFonte, selectorDoElementoAlvo, posicaoDeInjecao = 'append') {
    // 1. Só executa o código se estivermos no site em português
    if (!window.location.hostname.includes('fragrantica.com.br')) {
        return;
    }

    const elementoAlvo = $(selectorDoElementoAlvo);
    if (elementoAlvo.length === 0) {
        console.warn(`[Userscript] Elemento alvo "${selectorDoElementoAlvo}" não encontrado na página. A injeção foi cancelada.`);
        return;
    }

    const urlAtual = window.location.href;
    const urlFonte = urlAtual.replace('fragrantica.com.br', 'fragrantica.com');

    console.log(`[Userscript] Buscando elemento "${selectorDoElementoFonte}" de: ${urlFonte}`);

    try {
        // 2. Usa 'await' para esperar a resposta da requisição de forma não-bloqueante
        const response = await fetchAsyncGM({
            method: 'GET',
            url: urlFonte
        });

        // O código abaixo só executa DEPOIS que a requisição for bem-sucedida
        const parser = new DOMParser();
        const docFonte = parser.parseFromString(response.responseText, 'text/html');
        const elementoParaInjetar = $(docFonte).find(selectorDoElementoFonte);

        if (elementoParaInjetar.length > 0) {
            console.log(`[Userscript] Elemento "${selectorDoElementoFonte}" encontrado. Injetando em "${selectorDoElementoAlvo}".`);

            // Corrige URLs relativas de links e imagens
            elementoParaInjetar.find('a[href^="/"]').each(function() {
                $(this).attr('href', 'https://www.fragrantica.com' + $(this).attr('href'));
            });
            elementoParaInjetar.find('img[src^="/"]').each(function() {
                $(this).attr('src', 'https://www.fragrantica.com' + $(this).attr('src'));
            });

            // Injeta o elemento na página
            switch (posicaoDeInjecao) {
                case 'prepend': elementoAlvo.prepend(elementoParaInjetar); break;
                case 'before':  elementoAlvo.before(elementoParaInjetar); break;
                case 'after':   elementoAlvo.after(elementoParaInjetar); break;
                default:        elementoAlvo.append(elementoParaInjetar); break;
            }
        } else {
            console.warn(`[Userscript] Elemento "${selectorDoElementoFonte}" não foi encontrado na página de origem.`);
        }

    } catch (error) {
        // 3. O bloco 'catch' lida com erros de rede ou respostas com status de erro (ex: 404, 500)
        console.error(`[Userscript] Falha ao buscar elemento de ${urlFonte}.`, error);
    }
}

// -----------------------------------------------------------------------------
