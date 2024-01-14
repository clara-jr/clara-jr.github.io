---
layout: ../../layouts/PostLayout.astro
title: 'BiciMATH 🚴🏻'
pubDate: 2023/07/27
description: 'BiciMAD dejará de ser gratis a partir del 31 de diciembre de 2023. ¿Y luego qué hago? Con lo que me he aficionado a ir a todos sitios en bici...'
author: 'Clara Jiménez'
image:
  url: '/images/posts/BiciMATH.jpg'
  alt: 'BiciMAD'
tags: ['maths']
---

Antes de nada, diré que, cuando empecé a escribir este post, el fin de la gratuidad de BiciMAD estaba previsto para el 31 de julio de 2023, de ahí mi preocupación por la situación a pocos días de terminar el mes de julio. Sin embargo, su extensión acaba de aprobarse en el Ayuntamiento de Madrid, así que podemos postergar nuestra preocupación hasta fin de año (aunque *persona precavida vale por dos*).

Pero bueno, vamos al lío: hace unos años, allá por 2020, me dio por realizar programática y geométricamente una [comparativa entre las distintas posibilidades de utilizar BiciMAD: ocasional o con abono anual](https://clara-jr.github.io/posts/python-bicimad). Por aquel entonces, el interés por el deporte y las actividades al aire libre estaba aumentando debido al proceso de desescalada tras la pandemia, por eso quise analizar el servicio de BiciMAD en sí mismo. Sin embargo, hoy me gustaría comparar BiciMAD con el precio de moverse con transporte público por la ciudad de Madrid.

Para refrescar un poco el conocimiento sobre las [tarifas de BiciMAD](https://www.bicimad.com/bicimad), tenemos que saber que tendremos diferentes tarifas si optamos por usar BiciMAD con un abono anual frente a hacerlo de forma ocasional. En un formato ocasional, los viajes tienen un coste de 2 € la primera hora y 4 € la segunda. Si disponemos de un abono anual de BiciMAD, la primera media hora será 0.50 € y de la siguiente media hora en adelante 0.60 € cada 30 minutos. Sin embargo, el abono anual tiene también un coste inicial de 25 € (15 € en caso de disponer a su vez de un abono transporte del Consorcio Regional de Transportes de la Comunidad de Madrid). Para esta comparativa asumiremos que no disponemos del abono transporte del CRTM porque, precisamente, nuestra idea es decidir entre movernos en bici o en transporte público por la ciudad, si tuviéramos el abono transporte del CRTM, ya habríamos elegido 🫣.

Actualmente, el abono de 10 viajes en transporte público cuesta 6.10 €, y así seguirá siendo al menos hasta el 31 de diciembre de 2023. Fuera de esta situación especial de descuento, este abono tendría un precio de 12.20 €. En cuanto al abono anual Zona A del CRTM, este tiene un coste de 546 € en una situación normal, y 218 € en su versión con descuento durante 2023.

Ya tenemos las tarifas de BiciMAD y del CRTM, ahora solo nos queda saber qué compensa más económicamente para moverse por Madrid.

![BiciMAD](/images/posts/BiciMATH.jpg)

## Abono ocasional BiciMAD 🤜🤛 Abono 10 viajes CRTM

Por si no os habíais dado cuenta todavía, esta comparativa va a ser bastante corta. La primera hora en bici con un abono ocasional cuesta 2 €, y 1 viaje en transporte público en Madrid cuesta 0.61 € hasta 2024, y tal vez 1.22 € de ahí en adelante. Salvo en el peor de los casos, **sale más barato ir en transporte público** de un punto A a un punto B de Madrid frente a ir en bici. ¿Y cuál es el peor de los casos? Aquel en el que para llegar del punto A al punto B tuviésemos que hacer algún trasbordo entre bus y metro o entre varios buses. Concretamente, en 2023 nos harían falta 3 trasbordos, es decir, gastar 4 viajes (2.44 €), para que el trayecto nos saliera más barato en bici. En cuanto las tarifas del CRTM vuelvan a subir, nos bastaría un trasbordo (2 viajes) para estar en la misma situación. Si somos capaces de recorrer esa distancia en bici en menos de 1 hora, pero no somos capaces de hacerlo sin hacer ese número de trasbordos, entonces y solo entonces, nos compensaría económicamente hacer uso de BiciMAD en su versión ocasional.

## Abono anual BiciMAD 🤜🤛 Abono 10 viajes CRTM

Analizar el abono anual de BiciMAD va a ser más interesante: tenemos que ser capaces de calcular el número mínimo de viajes que deberíamos hacer en la ciudad de Madrid para que nos compense tener un abono anual de BiciMAD frente a utilizar abonos de 10 viajes de transporte público. En este caso, no podemos comparar directamente cuánto cuesta un viaje en bici frente a un viaje en metro o bus, porque el precio de un viaje en bici, teniendo el abono anual de BiciMAD, no es un precio fijo sino variable. Este precio va disminuyendo a medida que aumentamos el número de viajes que hacemos al año. Asumiendo viajes de media hora, que cuestan 0.50 €, si solo hacemos 1 viaje al año realmente habremos pagado por ese viaje 25.50 €, un 4180 % más de lo que cuesta en 2023 un viaje en metro o bus (0.61 €). Sin embargo, si hacemos 2 viajes al año, cada viaje nos saldría a 13 €. Tenemos que seguir subiendo el número de viajes hasta saber cuál es el valor que nos devuelve un precio por viaje inferior al precio de un viaje en metro o bus (0.61 € en situación de descuento y 1.22 € en situación normal). Matemáticamente, nos encontraríamos con algo como esto:

$$$
\frac{25 + 0.5 * N}{N} \leq T
$$$

$$$
N \geq \frac{25}{T - 0.5}
$$$

siendo $$N$$ el número de viajes que deberíamos hacer con BiciMAD y $$T$$ el precio de un viaje en transporte público en Madrid. Asumiendo un valor de 0.61 € para $$T$$, tendríamos un valor mínimo de $$N$$ de 228. Sin embargo, cuando suban de nuevo los precios del transporte público y volvamos a gastar del orden de 1.22 € por cada viaje, con realizar 35 viajes en bici nos habrá compensado el abono anual de BiciMAD.

$$$
N \geq \frac{25}{0.61 - 0.5} \rightarrow N \geq 228
$$$

$$$
N \geq \frac{25}{1.22 - 0.5} \rightarrow N \geq 35
$$$

Centrándonos en la situación actual y sabiendo que un viaje en metro o bus nos cuesta 0.61 €, vemos por tanto que tendríamos que hacer mínimo **228 viajes al año** para que nos compensara ir en bici por Madrid. Teniendo un año 52 semanas, tendríamos que hacer mínimo 5 viajes a la semana. Teniendo en cuenta que no todas las semanas estaremos en Madrid, el tiempo no acompañará para poder ir en bici, o no necesitaremos ir muy lejos de nuestra casa como para no poder ir andando, seguramente muchas de las semanas del año no consigamos hacer ese número de viajes, y tendríamos que compensarlo haciendo bastantes viajes otras semanas. En cualquier caso, estas conjeturas están basadas en mi experiencia de vida, cada persona que lea esto tendrá su visión y le compensará más o menos la situación.

Sin embargo, podemos pasar a evaluar una comparativa que está aún más clara, que es aquella en la que el precio del viaje en bus/metro está a 1.22 €. En este caso, vemos que bastarían **35 viajes en bici** para que BiciMAD compensase económicamente frente al transporte público de Madrid. Esto no es solo que no implique los 5 viajes a la semana que se necesitaban en el caso anterior, sino que tan solo se necesitan 3 viajes al mes para cumplirlo. Esto ya es otra cosa; aquí no tengo ninguna duda, si en 2024 deciden subir los precios del transporte público, me veréis por los carriles bici de Madrid (bueno, generalmente por la carretera porque los carriles bici son bastante escasos 😶‍🌫️).

Para estos cálculos hemos asumido que **con 30 minutos tenemos suficiente para llegar a nuestro destino en bici**. Por mi experiencia de estos últimos meses, en los que han sido gratuitos los viajes de menos de 30 minutos y he podido disfrutar de ellos, he comprobado que generalmente puedo llegar a cualquier punto de interés de Madrid en menos de 30 minutos. Pero, de no ser así, simplemente tendríamos que repetir estos cálculos con 1.10 € en vez de 0.50 €, que es lo que costaría un viaje de 1 hora en bici en Madrid. Para esta situación, y en el caso de que el abono de 10 viajes de metro/bus costase de nuevo 12.20 €, deberíamos hacer mínimo 209 viajes al año en bici para que nos compensase. Sin embargo, mientras siga costando el abono de 10 viajes del CRTM 6.10 €, jamás nos compensará económicamente recurrir a un abono anual de BiciMAD para hacer trayectos de 1 hora porque en ese caso un viaje en bici ($$\geq$$ 1.1 €) nunca costará menos que un viaje en metro (0.61 €). En cuanto el precio de un viaje en metro/bus sea más bajo que el precio que se paga por ese mismo trayecto en bici (sin tener en cuenta el precio de 25 € del abono anual de BiciMAD), BiciMAD no podrá competir contra el transporte público. Aquí tenemos la explicación matemática ejemplificada para los precios de 0.5 € y 1.1 € por cada trayecto en bici, que se basa en el límite de la función que representa el cálculo del valor monetario por cada viaje en bici en función de $$N$$ (el número de viajes que hagamos):

$$$
\lim _{N \to \infin } \frac{25 + 0.5 * N}{N} = 0.5
$$$

$$$
\lim _{N \to \infin } \frac{25 + 1.1 * N}{N} = 1.1
$$$

## Abono anual BiciMAD 🤜🤛 Abono anual CRTM

Ya hemos visto el número de viajes a partir del cual nos compensa viajar en bici frente a hacerlo en transporte público haciendo uso del abono de 10 viajes del CRTM, pero ¿qué pasa si viajamos demasiado a lo largo del año? ¿Sigue compensándonos usar la bici o mejor optar por el abono anual del transporte público?

Siendo $$N$$ el número de viajes a hacer con BiciMAD y $$T'$$ el precio del abono anual del transporte público de Madrid, podemos calcular el valor máximo de $$N$$ a partir del cual el uso de BiciMAD deja de ser rentable y ya nos compensaría comprar el abono anual del CRTM:

$$$
25 + 0.5 * N \leq T'
$$$

$$$
N \leq \frac{T' - 25}{0.5}
$$$

El abono anual Zona A del CRTM tiene un precio de 546 € en una situación normal, y 218 € gracias al descuento actual. Para alcanzar ese valor haciendo uso del abono anual de BiciMAD, tendríamos que llegar a hacer 1042 y 386 viajes de menos de 30 minutos al año en cada una de las situaciones respectivamente.

$$$
N \leq \frac{546 - 25}{0.5} \rightarrow N \leq 1042
$$$

$$$
N \leq \frac{218 - 25}{0.5} \rightarrow N \leq 386
$$$

Estos valores equivalen a 20 y 8 viajes a la semana en el orden dado. El segundo de estos valores puedo llegar a considerarlo alcanzable para alguna persona (aunque desde luego no para mí), pero el primero me atrevo a decir que es inalcanzable para cualquiera. Así que, generalmente, **merecerá siempre más la pena utilizar BiciMAD** que un abono anual (o mensual) de transporte público.

## Que suban los precios del transporte público 🤞🏻

Aquí tenemos finalmente el intervalo de viajes anuales entre los cuales compensará económicamente utilizar un abono anual de BiciMAD:

$$$
\frac{25}{T - 0.5} \leq N \leq \frac{T'-25}{0.5}
$$$

siendo $$N$$ el número de viajes a hacer, $$T$$ el precio de 1 viaje en transporte público al comprar el abono de 10 viajes, y $$T'$$ el precio del abono anual del CRTM. Además, 25 es el desembolso inicial que requiere el abono anual de BiciMAD y 0.5 es lo que cuesta cada media hora de uso de una bicicleta.

Ya hemos visto que, **según los precios actuales de 2023**, solo compensará optar por el abono anual de BiciMAD en caso de hacer al año más de 228 trayectos de 30 min y menos de 386. En caso contrario, será mejor escoger abonos de 10 viajes (en caso de hacer menos de 228 viajes al año) o el abono anual del CRTM (en caso de superar la cifra de 386 viajes anuales). Esto nos aporta un intervalo en el que la bicicleta resulta más económica de **entre 5 y 7 trayectos en bici a la semana**. Por el momento, no creo que personalmente llegase a alcanzar estas cifras, así que seguiría optando por los abonos de 10 viajes de transporte público.

$$$
228 \leq N \leq 386
$$$

**Si vuelven a subir los precios en 2024**, este intervalo en el que BiciMAD resulta más económico que el transporte público tiene un valor mínimo de 35 viajes al año y un máximo de 1042 viajes. De esta manera, **si hacemos más de 3 viajes al mes y menos de 20 a la semana, BiciMAD siempre será la mejor opción**.

$$$
35 \leq N \leq 1042
$$$

Termino esta comparativa haciendo un llamamiento al CRTM para que vuelva a subir los precios del transporte público (en concreto de los abonos de 10 viajes) para que así me compense utilizar BiciMAD y en 2024 pueda seguir disfrutando sin remordimientos económicos de recorrer Madrid en bici (eléctrica, eso sí 🤭). Si no lo hacen, no me quedará más remedio que comprarme [esta bicicleta eléctrica tan molona](https://www.norauto.es/p/bicicleta-electrica-nilox-j1-plegable-20-36-v-6-ah-color-blanco-2299325.html), pero... ¿Cuánto tardaremos en amortizar la inversión en esta bicicleta eléctrica para decidir si nos compensa frente a usar BiciMAD? 😱

<details>
<summary>Aquí tienes la respuesta a esta última pregunta 🤓</summary>
<div>

$$$
A * (25 + 0.5 * N) \geq 699
$$$

Siendo 699 € el precio de la bicicleta eléctrica de Norauto, $$A$$ el número de años que tardaremos en amortizar la bicicleta que compremos y $$N$$ el número de viajes de menos de 30 minutos que haremos de media al año, y asumiendo que este será un valor en torno a **100 viajes** (2 viajes a la semana), tardaríamos **10 años** en amortizar la inversión que hicimos en nuestra bici eléctrica, y eso sin contar el gasto eléctrico que haríamos al cargar la bicicleta.

$$$
A * (25 + 50) \geq 699 \rightarrow A \geq 10
$$$

Una vez más, estos cálculos los he hecho asumiendo un uso de la bicicleta en base a mi estilo de vida; concretamente, yo disfruto del teletrabajo, de modo que no suelo necesitar hacer trayectos largos durante gran parte de la semana, por eso he asumido una media de 2 trayectos en bici por semana. Sin embargo, es probable que, trabajando de forma presencial y en una oficina a la que pudiera llegar en menos de 30 minutos en bici, llegase a coger la bicicleta del orden de 40 veces al mes. En un caso así, haríamos 480 trayectos en bici al año y, por tanto, amortizaríamos la bicicleta en 5 años. Con estas cifras, basándonos en los precios del transporte público con descuento de 2023, sería más rentable optar por el abono anual del transporte público. Sin embargo, con los precios habituales del transporte público de Madrid, nos saldría más rentable un abono anual de BiciMAD frente a utilizar el transporte público.
</div>
</details>

Por último, dejo por [aquí](https://clara-jr.github.io/bicimath) una aplicación web que podréis utilizar cada vez que tengáis alguna duda (y la queráis resolver rápidamente) sobre qué método de transporte utilizar para moveros por Madrid.

> “Las matemáticas están en todas partes, pero somos miopes”
>
> ###### Santi García Cremades
