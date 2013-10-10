angular.module('color',[]).factory('color',function() {
    function hue2rgb(p, q, t){
        if (t < 0) {
            t += 1;
        }
        if (t > 1) {
            t -= 1;
        }
        if (t < 1/6) {
            return p + (q - p) * 6 * t;
        }
        if (t < 1/2) {
            return q;
        }
        if (t < 2/3) {
            return p + (q - p) * (2/3 - t) * 6;
        }
        return p;
    }

    function hslToRgb(hsl) {
        // in JS 1.7 use: var [h, s, l] = hsl;
        var h = hsl[0],
            s = hsl[1],
            l = hsl[2],

        r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            var
            q = l < 0.5 ? l * (1 + s) : l + s - l * s,
            p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [r * 0xFF, g * 0xFF, b * 0xFF];
    }

    function getColor(key) {
        if (!key) {
            return '';
        }
        var i = key.toUpperCase().split('').reduce(function(prev,ch) {
            return prev+ch.charCodeAt(0);
        },0);
        var numcols = 40; // 40 different colors
        var hue = 1*(i%numcols)/numcols;
        var col = hslToRgb([hue,0.6,0.75]).map(function(c) {
            return Math.round(c);
        });
        var rgb = 'rgb('+col.join(',')+')';
        return rgb;
    }

    return {
        hue2rgb: hue2rgb,
        hslToRgb: hslToRgb,
        getColor: getColor
    };
});