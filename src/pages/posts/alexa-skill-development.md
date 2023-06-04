---
layout: ../../layouts/PostLayout.astro
title: 'Desarrollo de Skills de Alexa 👩🏻‍💻‍'
pubDate: 2019/06/10
description: 'Alexa es el servicio de voz propio de Amazon y el cerebro que se encuentra detrás de los altavoces inteligentes Amazon Echo'
author: 'Clara Jiménez'
image:
    url: 'https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/alexa.png' 
    alt: 'Alexa Voice Interaction Model'
tags: ["alexa"]
---
Los asistentes virtuales son agentes software que permiten la automatización de la realización de tareas en un sistema con la mínima interacción hombre-máquina. La interacción que se da entre un asistente virtual y una persona debe ser natural. En el caso de asistentes virtuales por voz (Google Assistant, Amazon Alexa, etc.) una persona se comunica usando la voz y el asistente virtual lo procesa, interpreta y responde de la misma manera.

Alexa es capaz de realizar tareas como reproducir música de aplicaciones externas (Spotify, Apple Music, etc.), programar alarmas o temporizadores, informar en tiempo real sobre el clima, el tráfico o diversas noticias de actualidad, e incluso controlar dispositivos inteligentes compatibles.

Los usuarios pueden extender las habilidades de Alexa instalando funcionalidades adicionales desarrolladas por terceros denominadas Skills.

Los asistentes virtuales pueden ser por tanto configurables por parte de un desarrollador con intención de permitir distintas interacciones personalizadas dentro de un sistema. Esto se consigue con el desarrollo de Skills personalizadas o Custom Skills. Por ejemplo, en caso de que se disponga de un despliegue de dispositivos inteligentes para un proyecto de domótica no compatibles con el sistema de Amazon Alexa, se deberá proceder a la configuración del asistente virtual para la interacción con los dispositivos del sistema en cuestión. Un usuario podría preguntar, usando la voz, acerca de distintos parámetros de su hogar como la temperatura en alguna de las salas o el consumo energético del hogar en un periodo de tiempo determinado e incluso apagar o encender distintos aparatos de la casa.

Para conseguir ofrecer estas funcionalidades debe existir una interoperabilidad entre el sistema externo, en este caso el sistema de Smart Homes, y estos asistentes virtuales.

Interoperabilidad con el asistente virtual Alexa
------------------------------------------------

Para conseguir que un sistema inteligente desarrollado sea compatible con Alexa es necesario tanto describir la lógica correspondiente en el asistente virtual para la realización de peticiones dirigidas a la plataforma externa como realizar modificaciones en dicha plataforma, añadiendo los servicios necesarios de acceso a los datos o manipulación de los mismos.

Estos servicios pueden basarse por ejemplo en servicios REST que, implementados en el servidor de la plataforma desarrollada, cumplan con la interoperabilidad requerida por los asistentes virtuales recibiendo las peticiones HTTP oportunas y realizando las tareas correspondientes para, en caso necesario, devolver una respuesta o realizar una acción concreta.

Para proceder a realizar la configuración del asistente virtual de voz Amazon Alexa, debemos acceder a la consola de desarrollador de Amazon con nuestro usuario previamente registrado.

Inicialmente debemos crear una nueva Skill en la consola y describir las distintas Intents asociadas a nuestra Skill. Las Skills de Alexa son funcionalidades añadidas que pueden instalarse en nuestro asistente. Podemos pensar en ellas como el equivalente a las aplicaciones móviles para el asistente de voz. Por defecto, nuestro Amazon Echo vendrá con una serie de Skills o habilidades de serie basadas en sus funcionalidades básicas. Y es precisamente con la creación de nuevas Skills con lo que vamos a poder añadir nuestras propias habilidades extra al asistente de voz.

Para el caso de uso del manejo de dispositivos inteligentes debe crearse por tanto una nueva Skill. La Skill deberá tener un nombre de invocación determinado, como puede ser “Mi casa inteligente”, y se lanzará con el siguiente comando: “Alexa, lanza Mi casa inteligente” o “Alexa, pregunta a Mi casa inteligente…”.

Una vez creada la Skill es el momento de describir el modelo de interacción a través de la creación de Intents asociados a la misma. Estas Intents serán las acciones que se permitirá realizar al usuario. Por ejemplo, podríamos tener una Intent denominada ParameterIntent encargada de atender preguntas sobre parámetros ambientales en alguna zona de la casa. Las diferentes expresiones que podrá usar el usuario para invocar las acciones se denominan Utterances: “¿Qué temperatura hace en el salón?”, “¿Cuál es la humedad actual en la cocina?”, etc. En estas expresiones el usuario podrá incluir determinadas variables con información relevante que serán los Slots. Un Slot podría ser en este caso el parámetro ambiental por el que estamos preguntando, o el lugar de la casa en cuestión.

![Alexa Voice Interaction Model](https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/alexa.png)

La descripción de estas acciones posibles (Intents) con las distintas expresiones (Utterances) para su invocación así como el tipo de datos incluidos en estas expresiones con información relevante (Slots) se realiza en la herramienta Build ofrecida por la consola de desarrollador de Alexa.

Toda esta descripción de nuestra Skill puede realizarse manualmente o a través de la integración de un esquema JSON que describa el modelo de interacción con Alexa en el apartado Build > JSON Editor.

El siguiente paso es implementar la lógica de nuestra Skill. Podemos recurrir a una implementación en Node.js desplegada en Lambda functions dada la sencillez del despliegue/conexión con la Skill y los recursos que hay ya sobre este lenguaje/plataforma. La descripción lógica de nuestra Lambda puede implementarse actualmente a través de la consola de desarrollador de Alexa en la herramienta Code.

En la lógica de nuestra Skill describimos y exportamos las funciones asociadas a los distintos Intents que se ejecutarán cuando se invoquen mediante las expresiones de usuario definidas previamente en el modelo de interacción.

```javascript
const ParameterIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'ParameterIntent';
  },
  handle(handlerInput) {
    ...
  }
};
```

```javascript
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    ParameterIntentHandler,
    ConsumptionIntentHandler,
    PlugIntentHandler,
    DimmingIntentHandler,
    LocationIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler)
  .addErrorHandlers(
    ErrorHandler)
  .lambda();
```

Será en el código asociado a cada Intent donde se procesará la petición del usuario y se ejecutarán las acciones requeridas. En caso de necesitar acceder a servicios propios de una plataforma externa, como es el caso del ejemplo planteado, se podrá recurrir a un cliente HTTP para recuperar la información necesaria antes de devolver una respuesta mediante el asistente virtual por voz. Describiendo nuestra Lambda en Node.js podemos hacer uso de la librería Axios para Javascript.

```javascript
async function getValues(url, token) {
  const options = {
    timeout: 6500,
    headers: {
      "Authorization": "Bearer " + token
    }
  };
  const res = await axios.get(url, options);
  return res.data;
}
```

```javascript
return getValues(url, token).then((result) => {
   ...
}).catch((error) => {
   ...
});
```

Una vez hemos completado toda la lógica de una Intent y queremos devolver la respuesta por voz, se procede de la siguiente manera:

```javascript
return handlerInput.responseBuilder
  .speak(speechText)
  .reprompt(repromptText)
  .getResponse();
```

Para testear nuestro desarrollo sin necesidad de realizar las peticiones por voz con nuestro asistente virtual podemos acceder de nuevo a la consola de desarrollador de Alexa, en el apartado Test.

> “Technology, like art, is a soaring exercise of the human imagination”
>
> ###### Daniel Bell