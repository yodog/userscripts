// ==UserScript==
// @name        Mercado Livre - calculadora de frete
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description Mercado Livre - calculadora de frete
// @require     http://code.jquery.com/jquery.min.js
// @include     http*://*.mercadolivre.com.br/*
// @version     2018.01.15.1830
// @grant       GM_xmlhttpRequest
// ==/UserScript==

$(window).load(function(){

    //$('.item__info:lt(2)').each(function() {
    //$('div.rowItem:lt(2)').each(function() {
    $('div.rowItem').each(function() {

        iteminfotitle = $(this).find('.item__info-title');
        link          = iteminfotitle.attr('href');

        //console.log( 'link: ', link );

        var id = $(this).attr('id');

        //console.log( 'id: ', id );

        var itemprice = $(this).find('.item__price');
        itemprice.append('<span> Envio: </span> <span id="freteholder_'+id+'">?</span> <span> Total: </span> <span id="totalholder_'+id+'">?</span>');

        //console.log( 'itemprice: ', itemprice );

        pricefraction = $(this).find('.price-fraction');
        var preco     = pricefraction.text();

        //console.log( 'preco: ', preco );

        conectar('GET', link, resparser);

        function conectar(metodo, endereco, resposta, corpo) {
            callback = function(xhr) { resposta(xhr); }

            GM_xmlhttpRequest({
                "method"    : metodo,
                "url"       : endereco,
                "onerror"   : callback,
                "onload"    : callback,
                "headers"   : {'Content-Type' : 'application/x-www-form-urlencoded'},
                "data"      : corpo
            });
        }

        function resparser(detalhes) {
            //console.log( 'detalhes: ', detalhes );
            //console.log( 'detalhes.responseText: ', detalhes.responseText );
            //console.log( 'detalhes.response: ', detalhes.response );

            elfrete = $(detalhes.responseText).find('.shipping-method-title > .ch-price').contents().filter(function() { return this.nodeType == 3; });
            valorfrete = elfrete.text();

            n1 = valorfrete.replace(/\D/g,'');
            n2 = preco.replace(/\D/g,'');

            valortotal = parseInt(n1) + parseInt(n2);

            //console.log( 'elfrete: ', elfrete );
            //console.log( 'valorfrete: ', valorfrete );
            //console.log( 'n1: ', n1 );
            //console.log( 'n2: ', n2 );
            //console.log( 'valortotal: ', valortotal );
            //console.log( 'itemprice2: ', itemprice );
            //console.log( 'preco2: ', preco );
            //console.log( 'id2: ', id );

            itemprice.find('#freteholder_'+id).html(valorfrete);
            itemprice.find('#totalholder_'+id).html(valortotal);
        }
    })
});
