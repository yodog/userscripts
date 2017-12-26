// ==UserScript==
// @name        Calculadora do SISCOP
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description Calculadora do SISCOP
// @require     http://code.jquery.com/jquery.min.js
// @include     http*://siscop.portalcorporativo.serpro/ManRegPonto.asp*
// @version     2017.12.26.1649
// @grant       none
// ==/UserScript==

$(window).load(function(){

    var today = new Date();
    var dd    = today.getDate();

    var tblFlexivel = $('table')[1];
    $(tblFlexivel).attr('id', 'tblFlexivel');
    var flexivel = $('#tblFlexivel tr > td:nth-child(5)').eq(1).text();

    var tblDetalhada = $('table')[6];
    $(tblDetalhada).attr('id', 'tblDetalhada');

    var colsAteHoje = $('#tblDetalhada tr').map(function() {
        var tdf = Number( $('td:first', this).text() );
        if ( isNaN(tdf) ) return null;
        if ( tdf >= dd ) return null;
        $(this).css('border', '1px solid red').attr('class', 'colsAteHoje');
        return $(this);
    }).get();

    var colsExpNor = $('.colsAteHoje > td:nth-child(10)');

    var arrayValues = $(colsExpNor).map(function() {
        n = Number(this.textContent);
        if ( isNaN(n) ) return null;
        if ( n == 0 ) return null;
        return n;
    }).get();

    $(colsExpNor).each(function() {
        if ( this.textContent == arrayMenorValor(arrayValues) ) {
            $(this).css('background-color', 'yellow');
        }
        else if ( this.textContent == arrayMaiorValor(arrayValues) ) {
            $(this).css('background-color', 'lightgreen');
        }
    });

    //arrayMenorValor(arrayValues);
    //arrayMaiorValor(arrayValues);
    //arraySoma(arrayValues);
});


function arrayMenorValor(array) {
    console.log(`${arguments.callee.name} :: array is ${array}`);

    var sorted = array.sort(function(a, b) { return a - b });
    console.log(`${arguments.callee.name} :: sorted is ${sorted}`);

    var menor = sorted[0];
    console.log(`${arguments.callee.name} :: menor is ${menor}`);

    return menor;
};

function arrayMaiorValor(array) {
    console.log(`${arguments.callee.name} :: array is ${array}`);

    var sorted = array.sort(function(a, b) { return a - b });
    console.log(`${arguments.callee.name} :: sorted is ${sorted}`);

    var maior  = sorted.slice(-1).pop();
    console.log(`${arguments.callee.name} :: maior is ${maior}`);

    return maior;
};

function arraySoma(array) {
    console.log(`${arguments.callee.name} :: array is ${array}`);

    var sorted = array.sort(function(a, b) { return a - b });
    console.log(`${arguments.callee.name} :: sorted is ${sorted}`);

    var soma   = sorted.reduce(function(a, b) { return a + b; }, 0);
    console.log(`${arguments.callee.name} :: soma is ${soma}`);

    return soma;
};
