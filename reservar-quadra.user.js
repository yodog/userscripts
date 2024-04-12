// ==UserScript==
// @name         reservar-quadra
// @namespace    http://github.com/yodog
// @author       yodog
// @require      http://code.jquery.com/jquery.min.js
// @version      2024.04.12.1402
// @description  reservar-quadra
// @match        https://uniaocorinthians.areadosocio.com.br/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=areadosocio.com.br
// @grant        none
// ==/UserScript==

// -----------------------------------------------------------------------------
// PREVENT JQUERY CONFLICT
// -----------------------------------------------------------------------------

/* global $, jQuery */

this.$ = this.jQuery = jQuery.noConflict(true);

if (typeof $ == 'undefined') console.log('JQuery not found; The script will certainly fail');

// -----------------------------------------------------------------------------
// Ativar o botao de reserva sem precisar de captcha
// -----------------------------------------------------------------------------

    const mo = new MutationObserver((changes, observer) => {
        if ( (window.location.href).includes('concluir-reserva') ) {
            console.log('concluir-reserva');
            changes.forEach((mutation) => {
                const btnConfirmarReserva = $('button#salvarButton').removeAttr('disabled ng-disabled readonly').removeProp('disabled ng-disabled readonly')
            });
        }
    });
    mo.observe(document.querySelector('body'), { attributes: false, characterData: false, childList: true, subtree: true });

// -----------------------------------------------------------------------------
// Clicar no botao as 08:59:59 (verificando a cada meio segundo)
// -----------------------------------------------------------------------------

function checkAndClick() {
    const now = new Date();
    const clickTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0);

    if (now >= clickTime) {
        $('button#salvarButton').click();
        console.log('Click no botao as', now);
    }
    else {
        setTimeout(checkAndClick, 200);
        console.log('Esperando 14:00:00 ...', now);
    }
}

checkAndClick();
