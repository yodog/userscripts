// ==UserScript==
// @name        siscopweb - calculadora de ponto
// @namespace   https://github.com/yodog/userscripts
// @author      RASG
// @require     http://code.jquery.com/jquery.min.js
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require     https://gist.github.com/raw/2625891/waitForKeyElements.js
// @include     http*://siscopweb.serpro/manutencao.html
// @version     2018.08.28.1228
// @grant       none
// @noframes
// ==/UserScript==

// -----------------------------------------------------------------------------
// PREVENT JQUERY CONFLICT
// -----------------------------------------------------------------------------

if (typeof $ == 'undefined') console.log('JQuery not found; The script will certainly fail');

this.$ = this.jQuery = jQuery.noConflict(true);

// -----------------------------------------------------------------------------
// START
// -----------------------------------------------------------------------------

$(function(){

    var today = new Date();
    var dd    = today.getDate();

    var tabelaRegistros = $('table#tabelaRegistros');
    var tblBody = tabelaRegistros.find('tbody');
    var tblRows = tblBody.find('tr');
    var lastrow = tblRows.last();;

    if (tblRows.length == 0) {
        waitForKeyElements('table#tabelaRegistros > tbody', function(e) {
            tblBody = e;
            tblRows = tblBody.find('tr');
            lastrow = tblRows.last();

            console.log('tblBody*', tblBody);
            console.log('tblRows*', tblRows);
            console.log('lastrow*', lastrow);

            if (tblRows.length == 0) return true;
        });
    }

    // Capturar o saldo do banco de horas
    var saldo_semestral_banco_horas = $('span#saldo_semestral_banco_horas');
    var txt  = saldo_semestral_banco_horas.text().split('/');

    console.log('tabelaRegistros', tabelaRegistros);
    console.log('tblBody', tblBody);
    console.log('tblRows', tblRows);
    console.log('lastrow', lastrow);
    console.log('totalrow', totalrow);
    console.log('txt', txt);

    var base = Number( txt[0].replace(/\D/g,'') );
    var act  = Number( txt[1].replace(/\D/g,'') );

    var ssbh = saldo_semestral_banco_horas.clone();
    saldo_semestral_banco_horas.append('<br>');
    saldo_semestral_banco_horas.after(ssbh);
    ssbh.attr('id', 'ssbh').text( 'Total: ' + MinToHM( arraySoma([base, act]) ) );


    // Capturar o dia do mes em cada linha e marcar com borda vermelha
    var colsAteHoje = tblRows.map(function() {
        var dia = Number( $('td:eq(3)', this).text() );
        if ( isNaN(dia) ) return null;
        if ( dia >= dd ) return null;
        $(this).css('border', '1px solid red').attr('class', 'colsAteHoje');
        return $(this);
    }).get();


    // Capturar todos o valores da coluna 'Diferenca na Jornada'
    var colsDifJorn = $('.colsAteHoje > td:nth-child(17)');

    var arrDifJornVals = colsDifJorn.map(function() {
        n = Number(this.textContent);
        if ( isNaN(n) ) return null;
        if ( n == 0 ) return null;
        return n;
    }).get();


    // Capturar todos o valores da coluna 'Saldo Final da Jornada'
    var colsSalFinJorn = $('.colsAteHoje > td:nth-child(18)');

    var arrSalFinJornVals = colsSalFinJorn.map(function() {
        n = Number(this.textContent);
        if ( isNaN(n) ) return null;
        if ( n == 0 ) return null;
        return n;
    }).get();


    // Colorir maior e menor valores
    colsDifJorn.each(function() {
        var cor;

        if ( this.textContent == arrayMenorValor(arrDifJornVals) ) { cor = 'yellow' }
        else if ( this.textContent == arrayMaiorValor(arrDifJornVals) ) { cor = 'lightgreen' }

        $(this).parent().css('background-color', cor);
    });


    // Adicionar linha de saldo abaixo da ultima linha da tabela
    var totalrow = lastrow.clone();
    lastrow.after(totalrow);

    totalrow.find('td').removeAttr('bgcolor style id').text('');
    totalrow.attr('id', 'totalrow').css('background-color', 'lightgrey');

    totalrow.find("td:first").text('SALDO');
    totalrow.find("td:eq(16)").text( MinToHM( arraySoma(arrDifJornVals) ) );
    totalrow.find("td:eq(17)").text( MinToHM( arraySoma(arrSalFinJornVals) ) );



    //console.log('colsAteHoje', colsAteHoje);
    //console.log('arrDifJornVals', arrDifJornVals);
    //console.log('arrSalFinJornVals', arrSalFinJornVals);

});

// -----------------------------------------------------------------------------
// FUNCOES
// -----------------------------------------------------------------------------

function MinToHM(minutos) {
    var h = Math.floor(minutos / 60);
    var m = minutos % 60;

    return `${minutos} (${h}h ${m}min)`;
}

function arrayMenorValor(array) {
    //console.log(`${arguments.callee.name} :: array is ${array}`);

    var sorted = array.sort(function(a, b) { return a - b });
    //console.log(`${arguments.callee.name} :: sorted is ${sorted}`);

    var menor = sorted[0];
    //console.log(`${arguments.callee.name} :: menor is ${menor}`);

    return menor;
}

function arrayMaiorValor(array) {
    //console.log(`${arguments.callee.name} :: array is ${array}`);

    var sorted = array.sort(function(a, b) { return a - b });
    //console.log(`${arguments.callee.name} :: sorted is ${sorted}`);

    var maior  = sorted.slice(-1).pop();
    //console.log(`${arguments.callee.name} :: maior is ${maior}`);

    return maior;
}

function arraySoma(array) {
    //console.log(`${arguments.callee.name} :: array is ${array}`);

    var sorted = array.sort(function(a, b) { return a - b });
    //console.log(`${arguments.callee.name} :: sorted is ${sorted}`);

    var soma   = sorted.reduce(function(a, b) { return a + b; }, 0);
    //console.log(`${arguments.callee.name} :: soma is ${soma}`);

    return soma;
}
