// ==UserScript==
// @name        Calculadora do SISCOP
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description Calculadora do SISCOP
// @require     http://code.jquery.com/jquery.min.js
// @include     http*://siscop.portalcorporativo.serpro/*
// @version     2018.04.16.1507
// @grant       none
// ==/UserScript==

$(window).load(function(){

    if (window.location.href.indexOf('ManRegPonto.asp') > -1) {

        var today = new Date();
        var dd    = today.getDate();

        var tblFlexivel = $('table')[1];
        $(tblFlexivel).attr('id', 'tblFlexivel');
        var flexivel = $('#tblFlexivel tr > td:nth-child(5)').eq(1).text();

        var tblSaldoViagem = $('table')[2];
        $(tblSaldoViagem).find('td').each(function() {
            sv = Number(this.textContent);
            if ( isNaN(sv) ) return null;
            if ( sv == 0 ) return null;
            $(this).text( MinToHM(sv) );
        });

        var tblSaldoComp = $('table')[3];
        $(tblSaldoComp).find('td').each(function() {
            sc = Number(this.textContent);
            if ( isNaN(sc) ) return null;
            if ( sc == 0 ) return null;
            $(this).text( MinToHM(sc) );
        });

        var tblSaldoInstrutoria = $('table')[4];
        $(tblSaldoInstrutoria).find('td').each(function() {
            si = Number(this.textContent);
            if ( isNaN(si) ) return null;
            if ( si == 0 ) return null;
            $(this).text( MinToHM(si) );
        });

        var tblAtrasosInjust = $('table')[5];
        $(tblAtrasosInjust).find('td').each(function() {
            ai = Number(this.textContent);
            if ( isNaN(ai) ) return null;
            if ( ai == 0 ) return null;
            $(this).text( MinToHM(ai) );
        });

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
            var cor;

            if ( this.textContent == arrayMenorValor(arrayValues) ) { cor = 'yellow' }
            else if ( this.textContent == arrayMaiorValor(arrayValues) ) { cor = 'lightgreen' }

            $(this).parent().css('background-color', cor);
        });

        // -------------------------------------------------------------------------
        // ADICIONAR LINHA COM A SOMA DOS MINUTOS AO FIM DA TABELA
        // -------------------------------------------------------------------------

        $lastrow  = $(tblDetalhada).find("tr:last");
        $totalrow = $lastrow.clone();
        $lastrow.after($totalrow);

        $totalrow.find("td").removeAttr("bgcolor style").text('');
        $totalrow.css('background-color', 'lightgrey');

        $totalrow.find("td:first").text('SALDO');
        $totalrow.find("td:eq(9)").text( MinToHM( arraySoma(arrayValues) ) );
    }

    // -------------------------------------------------------------------------
    //
    // -------------------------------------------------------------------------

    if (window.location.href.indexOf('CadRegPonto.asp') > -1) {
        frmCadastro = $('form[name="frmCadastro"] table');

        // TIRAR LIMITE DE TAMANHO DA TABELA
        frmCadastro.width(300);

        // MOSTRAR 'PREVISAO DE SAIDA'
        frmCadastro.find("td > font").removeAttr("onmouseout").css('color', 'black');
    }

    // -------------------------------------------------------------------------
    // EXPANDIR TODAS AS OPCOES DO MENU
    // -------------------------------------------------------------------------

    if (window.location.href.indexOf('ManRegPonto.asp') < 0) {
        $('.sbm').show();
    }

});


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
