/* Functionality solely used in expert dashboard */
function clothingIcon(clo) {
    if( clo > 3 ) return "./img/clothing/2.0clo.png";
    else if( clo > 2 ) return "./img/clothing/2.0clo.png";
    else if( clo > 1.5 ) return "./img/clothing/1.5clo_wind.png";
    else if( clo > 1.1 ) return "./img/clothing/1.0clo.png";
    else if( clo >= 0.7 ) return "./img/clothing/0.9clo.png";
    else return "./img/clothing/0.5clo.png";
}
