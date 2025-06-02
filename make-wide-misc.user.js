// ==UserScript==
// @name        MakeWide - stonks edition
// @namespace   http://github.com/yodog/userscripts
// @author      yodog
// @description Enlarge selected pages to use the entire viewport width (perfect for wide screen monitors)
// @require     http://code.jquery.com/jquery.min.js
// @require     http://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require     http://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @require     http://cdn.datatables.net/1.13.1/js/jquery.dataTables.min.js
// @resource    toastcss   http://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @resource    datatables http://cdn.datatables.net/1.13.1/css/jquery.dataTables.min.css
// @match       *://*.fragrantica.com.br/*
// @match       *://*.reddit.com/*
// @match       *://*.redgifs.com/*
// @connect     *
// @icon        https://cdn3.emoji.gg/emojis/6645_Stonks.png
// @version     2025.06.02.1537
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @sandbox     JavaScript
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
// PREVENT ANIMATIONS THAT SLOW DOWN THE PAGE
// -----------------------------------------------------------------------------

console.log("Disabling animations");

document.getAnimations().forEach((animation) => {
   animation.cancel();
});

GM_addStyle(`
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
);

// -----------------------------------------------------------------------------
// DATATABLES
// -----------------------------------------------------------------------------

var datatableloaded = false;

// default for all tables
$.extend($.fn.dataTable.defaults, {
    language: { decimal: ',' , thousands: '.' },
    ordering:  true,
    paging: false,
    searching: true,
});

// datatables type date-uk: sort table columns by date format dd/mm/yyyy
$.extend($.fn.dataTableExt.oSort, {
    "date-uk-pre": function ( a ) {
        var ukDatea = a.split('/');
        return (ukDatea[2] + ukDatea[1] + ukDatea[0]) * 1;
    },
    "date-uk-asc": function ( a, b ) {
        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
    },
    "date-uk-desc": function ( a, b ) {
        return ((a < b) ? 1 : ((a > b) ? -1 : 0));
    }
});

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

// -----------------------------------------------------------------------------

if ( (window.location.href).includes('fragrantica.com') ) {
    console.log('fragrantica.com');
    $(document, 'body').on('click load pageshow ready scroll', () => {
        $('div.grid-container').css({'max-width':'unset'});
    });
    if ( (window.location.href).includes('busca-notas') ) {
        $(document, 'body').on('click load pageshow ready scroll', () => {
            $('div.callout > div.grid-x').css({'max-height':'26em'});
        });
    }
    if ( (window.location.href).includes('perfume') ) {
        $(document, 'body').on('click load pageshow ready scroll', () => {
            $('iframe#idIframeMMM').remove();
            $('input#showDiagram:not(:checked)').click();
        });
    }
}

// -----------------------------------------------------------------------------

if ( (window.location.href).includes('reddit.com') ) {
    console.log('reddit.com');

    const redditcss = `
<style type='text/css' id='redditcss'>
div.subgrid-container { min-width: -moz-available !important ; min-width: -webkit-fill-available !important ; }
div.main-container { grid-template-columns: minmax(0,1fr) minmax(0,auto) !important ; }
main.main { max-width: unset !important ; }
@media (min-width: 768px) { #right-sidebar-container { display: none ; } }
@media (min-width: 1200px) { #right-sidebar-container { display: block ; } }
</style>
`
    $(redditcss).appendTo('head');
}

// -----------------------------------------------------------------------------

if ( (window.location.href).includes('redgifs.com') ) {
    console.log('redgifs.com');
    $(document, 'body').on('click load pageshow ready scroll', () => {
        $('div.homeFeed').css({'max-width':'unset'});
        $('div.previewFeed').css({'display':'contents'});
    });
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

            //console.log('alterClass i', i);
            //console.log('alterClass it', it);
            //console.log('alterClass patt', patt);
        });

        return !additions ? self : self.addClass(additions);
    };
})(jQuery);

// -----------------------------------------------------------------------------
