---
layout: ../../layouts/PostLayout.astro
title: 'Respuestas visuales en Skills de Alexa con APL 👩🏻‍💻'
pubDate: 2019/06/13
description: 'Al combinar elementos visuales con experiencias de voz, los desarrolladores ampliarán notoriamente las formas de interacción y de muestra de contenido que puedan ofrecer sus Skills'
author: 'Clara Jiménez'
image:
    url: 'https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/apl.png' 
    alt: 'Alexa Presentation Language'
tags: ["alexa"]
---
Actualmente existen dispositivos de Alexa que incluyen una pantalla con intención de respaldar visualmente las respuestas ofrecidas por voz a través de Alexa. El lenguaje utilizado por Alexa para describir estas respuestas visuales es Alexa Presentation Language (APL), basado generalmente en documentos JSON que describen la información a mostrar y cómo mostrarla.

El manejo de un dispositivo y los servicios que este engloba a través de la voz resulta sencillo y natural. Sin embargo, creando una experiencia multimodal con la combinación en una sola interfaz de: la voz, una pantalla táctil, respuestas visuales mediante texto, imágenes o vídeo, … ofreces al usuario un manejo del sistema más agradable y atractivo sin llegar a reducir la sencillez. Podemos proporcionar al usuario información complementaria a la respuesta por voz mediante información visualizada en la pantalla, enriqueciendo su experiencia con el sistema desarrollado. Además, esta información visual es adaptable a los diferentes tipos de dispositivos de Amazon Alexa.

Estructura de un documento APL
------------------------------

APL se basa en un documento JSON que se traduce en una experiencia visual. De esta manera, la interfaz gráfica de usuario está definida por lo que se denomina un documento APL. Este documento está compuesto por objetos de diseño (layouts) definidos por variables ofrecidas por Alexa y/o configurables por un desarrollador. El documento APL puede importar por tanto paquetes de contenido APL existente desarrollado por Amazon Alexa como propiedades, estilos, u objetos de diseño predefinidos para ser utilizados a lo largo del documento. Nuestra Skill enviará este documento al dispositivo Alexa acompañado de información añadida para su procesado.

La estructura de este documento es la siguiente:

```json
{
  "type": "APL",
  "version": "1.0",
  "import": [],
  "resources": [],
  "styles": {},
  "layouts": {},
  "mainTemplate": {}
}
```

Implementar respuestas APL en una Skill
---------------------------------------

Para conseguir mediante APL las respuestas visuales por pantalla en caso de que el dispositivo de Alexa la tenga, debemos seguir una serie de indicaciones. Primeramente, para permitir que un documento APL sea parte de la respuesta de nuestra Skill, debemos habilitar la interfaz de APL en la consola de desarrollador de Alexa en la sección Build > Interfaces. Esto aportará a nuestra Skill la capacidad de representar respuestas mediante APL agregando automáticamente las Intents necesarias en nuestro modelo.

A su vez, el código de nuestra Skill está inicialmente diseñado para devolver a través de la función Lambda una respuesta por voz; opcionalmente podemos editar este código para que sea capaz de enviar respuestas gráficas en caso de que el dispositivo con el que se esté trabajando sea capaz de ello.

Para comprobar si nuestro dispositivo soporta o no APL, es decir, si es un dispositivo con o sin pantalla, recurriremos a la descripción de la siguiente función:

```javascript
supportsAPL(handlerInput) {
  const { supportedInterfaces } = handlerInput.requestEnvelope.context.System.device;
  return supportedInterfaces['Alexa.Presentation.APL'];
}
```

Así, utilizando esta función podremos proceder a enviar o no una respuesta visual:

```javascript
if (supportsAPL(handlerInput)) {
  handlerInput.responseBuilder.addDirective({
    type: 'Alexa.Presentation.APL.RenderDocument',
    version: '1.0',
    document: require('./documents/template.json'),
    datasources: require('./documents/datasources.json')
  })
}
```

Siendo template.json nuestro documento APL y datasources.json un fichero con un objeto JSON que agrupa variables definidas por un desarrollador. Estas variables son enviadas al documento APL donde son recuperadas y utilizadas para describir la interfaz gráfica de usuario.

En caso de desarrollar una Skill que atienda a diversas Intents deberemos trabajar con numerosas pantallas que mostrar con datos y formas distintas. Sin embargo, guardando un diseño de interfaz generalmente similar podemos utilizar un único documento APL al que enviaremos distinta información en el parámetro datasources. Además, podremos añadir diversas condiciones en el documento APL para la renderización de elementos concretos según los parámetros recibidos en los datasources.

Finalmente creamos nuestro documento APL en formato JSON, definiendo así propiedades y estilos que controlarán cómo se mostrarán los componentes, los objetos de diseño denominados layouts formados por varios componentes, y el diseño principal: mainTemplate. El elemento mainTemplate, que describe el diseño principal del documento APL tendrá un atributo parameters que identificará aquella información necesaria de recuperar, como lo son los datasources.

```json
{
  "type": "APL",
  "version": "1.0",
  "import": [
    {
      "name": "alexa-layouts",
      "version": "1.0.0"
    }
  ],
  "resources": [],
  "styles": {},
  "layouts": {},
  "mainTemplate": {
    "parameters": [
      "payload"
    ],
    "items": [
      {
        "type": "Text", 
        "text": "${payload.datasources.text}"
      }
    ]
  }
}
```

Siendo el fichero datasources:

```json
{
  "datasources": {
    "text": "Bienvenido a mi skill"
  }
}
```

Podemos probar la descripción de nuestro documento APL acompañado de sus datasources en la herramienta online de creación de experiencias visuales para Skills que ofrece Amazon.

Además, mientras probamos nuestra Skill en la consola de desarrollador de Alexa en la sección de Test podemos observar también los resultados de nuestro documento APL activando la opción Device Display.

Diseño avanzado de un documento APL
-----------------------------------

Una vez conocido el proceso de inclusión de respuestas visuales en nuestros dispositivos Amazon Echo con pantalla, podemos ser capaces de mostrar información con un diseño más elaborado y adaptable a la forma y tamaño de cada dispositivo.

![Alexa Presentation Language](https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/apl.png)

Para conseguir una pantalla como esta crearemos nuestros propios layouts compuestos por distintos elementos: texto, imagen, etc. En el atributo resources podemos incluir además valores parametrizados que puedan ser utilizados de forma genérica y ordenada en el resto del documento APL.

```json
{
  "type": "APL",
  "version": "1.0",
  "import": [
    {
      "name": "alexa-styles",
      "version": "1.0.0"
    },
    {
      "name": "alexa-layouts",
      "version": "1.0.0"
    },
    {
      "name": "alexa-viewport-profiles",
      "version": "1.0.0"
    }
  ],
  "resources": [
    {
      "when": "${viewport.shape == 'round'}",
      "dimensions": {
        "myTextTopPadding": "10dp",
        "mySubTextTopPadding": "5dp",
        "myImageWidth": "30vw",
        "myImageHeight": "22vh"
      }
    },
    {
      "when": "${@viewportProfile == @hubLandscapeSmall || @viewportProfile == @hubLandscapeMedium || @viewportProfile == @hubLandscapeLarge || @viewportProfile == @tvLandscapeXLarge}",
      "dimensions": {
        "myTextTopPadding": "20dp",
        "mySubTextTopPadding": "50dp",
        "myImageWidth": "32vw",
        "myImageHeight": "32vh"
      }
    }
  ],
  "styles": {},
  "layouts": {
    "CentralLayout": {
      "description": "A basic central screen layout with an image and a text",
      "parameters": [
        {
          "name": "image",
          "type": "string"
        },
        {
          "name": "text",
          "type": "string"
        },
        {
          "name": "subtext",
          "type": "string"
        }
      ],
      "items": [
        {
          "type": "Container",
          "width": "100vw",
          "height": "100vh",
          "alignItems": "center",
          "justifyContent": "center",
          "item": [
            {
              "type": "Image",
              "source": "${image}",
              "width": "@myImageWidth",
              "height": "@myImageHeight"
            },
            {
              "type": "Text",
              "text": "${text}",
              "color": "#FFFFFF",
              "textAlign": "center",
              "fontSize": "68",
              "style": "textStyleDisplay2",
              "paddingTop": "@myTextTopPadding"
            },
            {
              "when": "${viewport.shape == 'round'}",
              "type": "Text",
              "text": "${subtext}",
              "color": "#FFFFFF",
              "textAlign": "center",
              "style": "textStyleBody",
              "paddingTop": "@mySubTextTopPadding"
            },
            {
              "when": "${@viewportProfile == @hubLandscapeSmall || @viewportProfile == @hubLandscapeMedium || @viewportProfile == @hubLandscapeLarge || @viewportProfile == @tvLandscapeXLarge}",
              "type": "Text",
              "text": "${subtext}",
              "color": "#FFFFFF",
              "textAlign": "center",
              "style": "textStyleDisplay4",
              "paddingTop": "@mySubTextTopPadding"
            }
          ]
        }
      ]
    }
  },
  "mainTemplate": {
    "parameters": [
      "payload"
    ],
    "items": [
      {
        "type": "Container",
        "items": [
          {
            "type": "Image",
            "source": "${payload.datasources.background}",
            "scale": "best-fill",
            "width": "100vw",
            "height": "100vh"
          },
          {
            "type": "Container",
            "position": "absolute",
            "width": "100vw",
            "height": "100vh",
            "items": [
              {
                "when": "${viewport.shape == 'round'}",
                "type": "Container",
                "width": "100vw",
                "height": "75vh",
                "alignItems": "center",
                "justifyContent": "center",
                "items": [
                  {
                    "type": "CentralLayout",
                    "image": "${payload.datasources.image}",
                    "text": "${payload.datasources.text}",
                    "subtext": "${payload.datasources.subtext}"
                  }
                ]
              },
              {
                "when": "${@viewportProfile == @hubLandscapeSmall || @viewportProfile == @hubLandscapeMedium || @viewportProfile == @hubLandscapeLarge || @viewportProfile == @tvLandscapeXLarge}",
                "type": "Container",
                "width": "100vw",
                "height": "90vh",
                "alignItems": "center",
                "justifyContent": "center",
                "items": [
                  {
                    "type": "CentralLayout",
                    "image": "${payload.datasources.image}",
                    "text": "${payload.datasources.text}",
                    "subtext": "${payload.datasources.subtext}"
                  }
                ]
              },
              {
                "type": "AlexaFooter",
                "hintText": "${payload.datasources.footer}",
                "paddingTop": "15dp"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

```json
{
  "datasources": {
    "background": "https://s3-eu-west-1.amazonaws.com/miscalexa/background.png",
    "image": "https://miaplicacion.es/images/device_icon.png",
    "text": "24.8 °C",
    "subtext": "Temperatura en el salón",
    "footer": "Alexa, ¿qué temperatura hace aquí?"
  }
}
```

Así conseguimos ofrecer una experiencia multimodal en nuestra Alexa Skill.

> “With the Alexa Presentation Language, you can unleash your creativity and build interactive skills that adapt to the unique characteristics of Alexa Smart Screen devices; we can’t wait to see what you create”
>
> ###### Nedim Fresko