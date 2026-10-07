# Proyecto PowerUpEnglish

Este proyecto es una web alojada en GitHub Pages, con el motor Jekyll de fondo, con recursos para aprender inglés. En este documento se define la estructura general de contenidos que se pretende gestionar.

## Estructura de la web

En la parte superior habrá una barra de navegación con el logo de la página a la izquierda ("PowerUpEnglish"), y un menú de opciones/niveles a la derecha, para que quien entre pueda elegir el nivel al que quiere acceder: A1, A2, B1, B2, C1 o C2.

Al elegir un nivel, se abrirá un panel izquierdo vertical con los contenidos de ese nivel, para que el usuario elija uno. Los contenidos pueden ser de 4 tipos, y cada uno debería ir identificado al lado por un icono representativo:

* **Vocabulary**: una página con vocabulario específico de ese nivel. Por ejemplo, los días de la semana, o las profesiones.
* **Grammar**: una página con contenidos de gramática de ese nivel. Por ejemplo, el verbo "to be", o el uso del "present continuous".
* **Use of English**: una página con contenidos sobre el uso del idioma. Por ejemplo, *phrasal verbs* acordes al nivel indicado, etc.
* **Exercises**: una página con ejercicio(s) sobre los contenidos vistos hasta ese punto. Pueden ser *listenings*, *readings*, *writings*...

El menú de contenidos a mostrar para cada nivel (A1, A2, etc) se define en el fichero `menu.md`, que se irá actualizando más adelante conforme se piensen más contenidos. Los menús también deben poderse ver en dos idiomas. Por defecto aparecerán en inglés, pero pulsando un botón de *swap* o similar se mostrarán los mismos textos pero en español. A continuación se muestra el texto a mostrar en cada enlace, en español y en inglés, junto a qué categoría pertenece cada uno (*Vocabulary*, *Grammar*, *Use of English* o *Exercises*) para que se le añada un icono o marca diferenciadora a cada elemento.

## Comportamiento adicional

Toda la web va a compartir un mismo encabezado y pie (que deberían sacarse aparte con algún tipo de *_includes* o similar), y también me gustaría que los contenidos en cada página HTML que se definan estuvieran en dos idiomas (inglés y español) intercambiables pulsando un botón en la propia página. Así, las explicaciones pueden aparecer en un idioma, y que haya un botón (siempre visible) para cambiar de idioma a modo de *swap*. Esto debería centralizarse en algún tipo de JavaScript y CSS compartido por todas las páginas, de forma que, por ejemplo, los elementos con la clase *class* indicada se oculten y aparezcan los correspondientes en el otro idioma, en el mismo lugar. Es importante que esto se aplique de forma global a la página, y sólo a aquellos textos que estén marcados con algún selector determinado que los haga susceptibles de intercambiarse. Así, por ejemplo, si una sección tiene una serie de palabras en inglés con su correspondiente traducción al español, esa sección no es susceptible de hacer *swap*, porque ya estará en los dos idiomas a la vez.