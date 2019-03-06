// ==UserScript==
// @name            AliExpressTools
// @namespace       https://github.com/yodog/userscripts
// @author          RASG
// @description:en  Add new functions to AliExpress (shipping calc, shipping from, sort by)
// @version         2019.03.06.0133
// @require         http://code.jquery.com/jquery.min.js
// @require         https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @include         http*://*.aliexpress.com/*
// ==/UserScript==

if (typeof $ == 'undefined') console.log('JQuery not found; The script will certainly fail');

(function() {
    'use strict';

    var url = new URL(window.location.href);
    var shouldreload = false;

    // Show only items shipped from my country
    // Mostrar somente itens que tem estoque no meu pais

    var sfc = url.searchParams.get('shipFromCountry');
    var myprefcountry = 'br';

    if (sfc != myprefcountry) {
        url.searchParams.set('shipFromCountry', myprefcountry);
        shouldreload = true;
    }

    // Sort by
    // Odenar por

    var bestmatch = 'default';
    var orders = 'total_tranpro_desc';
    var newest = 'create_desc';
    var price = 'price_asc';

    var st = url.searchParams.get('SortType');
    var myprefsort = orders;

    if (st != myprefsort) {
        url.searchParams.set('SortType', myprefsort);
        shouldreload = true;
    }

    // Reload webpage
    // Recarregar a pagina

    if (shouldreload) window.location = url.toString();

    // Bring shipping prices to the front page and show total cost
    // Trazer o preco do frete para a pagina principal e calcular o custo total

})();
