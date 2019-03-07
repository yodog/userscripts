// ==UserScript==
// @name            AliExpressTools
// @namespace       https://github.com/yodog/userscripts
// @author          RASG
// @description:en  Add new functions to AliExpress (shipping calc, shipping from, sort by)
// @description:pt  Adiciona novas funcoes ao AliExpress (calculadora de frete, mostrar somente itens que ja estao no brasil, ordem de produtos)
// @version         2019.03.07.1835
// @require         http://code.jquery.com/jquery.min.js
// @require         https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @include         http*://*.aliexpress.com/*
// @grant           GM_addStyle
// @grant           GM_getMetadata
// @grant           GM_getValue
// @grant           GM_registerMenuCommand
// @grant           GM_setValue
// @grant           GM_xmlhttpRequest
// @noframes
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
    only_items_from_my_country: { type: 'checkbox', default: false },
    country_code:               { type: 'text',     default: 'br' },
    force_sorting:              { type: 'checkbox', default: false },
    sort_by:                    { type: 'select',   default: 'price_asc', choices: {
        'default'           :'Best Match',
        'total_tranpro_desc':'Orders',
        'create_desc'       :'Newest',
        'price_asc'         :'Price',
    } },
}

var cfg;
try {
    cfg = new MonkeyConfig({
        title:       'Config AliExpressTools',
        menuCommand: true,
        onSave:      function() { recarregar(montarurl()) },
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

var shouldreload = true;

(function() {
    'use strict';

    // Reload webpage
    // Recarregar a pagina

    if (shouldreload) recarregar(montarurl());

    // Bring shipping prices to the front page and show total cost
    // Trazer o preco do frete para a pagina principal e calcular o custo total

})();

// -----------------------------------------------------------------------------
// FUNCTIONS
// -----------------------------------------------------------------------------

// ---
// ASSEMBLE URL FROM SETTINGS
// ---

function montarurl() {
    shouldreload = false;
    var url = new URL(window.location.href);

    // Show only items shipped from my country
    // Mostrar somente itens que tem estoque no meu pais

    var shipFromCountry = url.searchParams.get('shipFromCountry');

    if (cfg.get("only_items_from_my_country")) {
        if (shipFromCountry != cfg.get("country_code")) {
            url.searchParams.set('shipFromCountry', cfg.get("country_code"));
            shouldreload = true;
        }
    }
    else {
        if (url.searchParams.has('shipFromCountry')) {
            url.searchParams.delete('shipFromCountry');
            shouldreload = true;
        }
    }

    // Sort by
    // Odenar por

    var SortType = url.searchParams.get('SortType');

    if (cfg.get("force_sorting")) {
        if (SortType != cfg.get("sort_by")) {
            url.searchParams.set('SortType', cfg.get("sort_by"));
            shouldreload = true;
        }
    }
    else {
        if (url.searchParams.has('SortType')) {
            url.searchParams.delete('SortType');
            shouldreload = true;
        }
    }

    return url.toString();
}

// ---
// RELOAD PAGE (USED WHEN SETTINGS ARE CHANGED)
// ---

function recarregar(s) {

    if (!shouldreload) return;
    (s) ? window.location = s : document.location.reload(false);
}
