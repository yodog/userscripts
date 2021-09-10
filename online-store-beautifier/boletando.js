function aplicar_boletando() {

    console.log('Carregando configuracoes do boletando v2021.09.10.1429')

    if (typeof $ == 'undefined') {
        console.log('JQuery nao encontrado. Saindo da funcao aplicar_boletando');
        return
    }

    // Adicionar borda nos itens para facilitar a visualizacao
    $('.offer_grid.col_item').css({'border':'1px dotted blue'});

    // Dimimuir espaco entre os itens
    $('.col_wrap_fourth .col_item').css({'margin':'0.5em'});

    // Dimimuir tamanho dos itens
    $('.col_wrap_fourth .col_item').css({'width':'15%'});
}
