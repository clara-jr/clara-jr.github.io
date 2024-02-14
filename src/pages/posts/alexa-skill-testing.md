---
layout: ../../layouts/PostLayout.astro
title: 'Testeando Alexa Skills 👩🏻‍💻‍'
pubDate: 2024/02/14
description: 'Un código sin tests es un código con fecha de caducidad'
author: 'Clara Jiménez'
image:
    url: ''
    alt: 'Alexa Testing'
tags: ["alexa"]
---

Hacer pruebas de nuestro código es costoso pero merece la pena. No hacer pruebas o hacer pruebas manuales es *pan para hoy, hambre para mañana* ya que, el hecho de que algo funcione *hoy*, no quiere decir que vaya a seguir haciéndolo *mañana* (tras implementar cualquier otro cambio). Además, muy pocas son las veces en las que implementamos código 100 % funcional a la primera y sin haberlo testeado, así que es probable que un código sin tests ni siquiera esté funcionando *hoy*. En el desarrollo de Alexa Skills nada de esto va a ser menos. Podemos probar nuestra Skill las veces que consideremos en nuestra consola de desarrollo de Alexa o incluso en un dispositivo físico, pero eso no es una garantía confiable de que nuestra Alexa Skill verdaderamente funciona (sobre todo más allá del *happy path*).

## Preparándonos para testear una Alexa Skill

Para poder testear Alexa Skills tenemos la **librería [ask-sdk-test](https://www.npmjs.com/package/ask-sdk-test)**, que facilita la creación de **tests para Alexa Skills usando [Mocha](https://mochajs.org/)**. Tendremos que instalar esta librería y ejecutar los tests (que tendrán que estar en la carpeta test de nuestra lambda) con mocha:

```bash
npm install ask-sdk-test --save-dev
npm install mocha --save-dev
npx mocha
```

Ahora vamos a ver cuáles deberán ser las primeras líneas de código de un fichero de test de una Skill de Alexa:

```javascript
// include the testing framework
import test from 'ask-sdk-test';

// include handler and all necessary utilities
import { handler as skillHandler } from '../index.js';
import util from '../src/utilities/util.js';

// i18n strings for all supported locales
import i18n from 'i18next';
import es from '../src/i18n/es.js';
import en from '../src/i18n/en.js';
import fr from '../src/i18n/fr.js';
const languageStrings = {
  es,
  en,
  fr
};

// initialize i18n with the locale data we are testing
const skillSettings = {
  appId: util.skillId,
  userId: 'amzn1.ask.account.VOID',
  deviceId: 'amzn1.ask.device.VOID',
  locale: 'es-ES'
};
i18n.init({
  lng: skillSettings.locale,
  resources: languageStrings,
  returnObjects: true
});

// initialize the testing framework
const alexaTest = new test.AlexaTest(skillHandler, skillSettings);
```

Como hemos visto, debemos indicar todos los idiomas a los que está traducida nuestra Skill y, de entre ellos, seleccionar aquel para el que vamos a generar nuestro fichero de tests. Deberemos utilizar esta información para inicializar [i18n](https://www.npmjs.com/package/i18next). Por último, inicializamos nuestro test indicando las propiedades de nuestra Skill (identificador de la Skill, del usuario, del dispositivo e idioma que vamos a utilizar) y el *handler* que se encargará de desviar las peticiones según la *intent* que estemos invocando.

Además, si tenemos intención de testear una Alexa Skill que incluya datos persistentes en DynamoDB, deberemos incluir el siguiente código previo a la ejecución de nuestros tests:

```javascript
describe('Alexa Skill', () => {
  before(() => {
    alexaTest.withDynamoDBPersistence('TestTable');
  });
  // ...
})
```

## Testeando la respuesta de Alexa

**Los atributos `saysLike` y `repromtsLike` comprueban que los mensajes de respuesta y de *repromt* que ofrece Alexa contengan el *string* que indiquemos**. Si queremos hacer comprobaciones exactas podemos utilizar directamente `says` o `reprompts`. Con `repromptsNothing` y `shouldEndSession` comprobamos si hay mensaje de *repromt* y si la sesión permanece abierta o se cierra respectivamente. En la misma línea tenemos también el atributo `saysNothing`, que puede ser útil para testear respuestas en las que utilicemos APLA como vía de comunicación en lugar del *speech output* que se envía como respuesta en `handlerInput.responseBuilder.speak()`.

**El atributo `ignoreQuestionCheck` es muy útil para evitar comprobar que el mensaje ofrecido por Alexa contenga un signo de interrogación** cuando la sesión permanezca abierta. Generalmente, no es necesario que Alexa haga una pregunta para que el hilo de la conversación siga abierto. Por ejemplo, puede ofrecernos una respuesta con un imperativo verbal para que respondamos a su petición: "Dime a qué categoría quieres jugar". Esta respuesta sería perfectamente válida para continuar la conversación con el usuario y, sin embargo, para `ask-sdk-test` no lo es y nuestro test fallaría. Podemos evitar eso asignando un valor `true` a `ignoreQuestionCheck`.

```javascript
describe('should open the Skill with a welcome message', () => {
  alexaTest.test([
    {
      request: new test.LaunchRequestBuilder(skillSettings).build(),
      saysLike: i18n.t('HELLO'),
      repromptsLike: i18n.t('REPROMPT_HELLO'),
      repromptsNothing: false,
      shouldEndSession: false,
      // If true (default false), avoid testing that the response speech contains a question mark when the session is kept open
      // Set to true to stop showing error: 'Possible Certification Problem: The response keeps the session open but does not contain a question mark.'
      ignoreQuestionCheck: true
    }
  ]);
});
```

## Testing de atributos

Otro elemento importante que podremos testear es **el contexto: los atributos de sesión y persistentes**. Con `hasAtttributes` y `storesAttributes` podremos comprobar que los atributos de sesión y persistentes, respectivamente, son los esperados al completar la *intent* y devolver una respuesta. A su vez, podemos hacer uso de `withSessionAttributes` y `withStoredAttributes` para indicar los atributos de sesión y persistentes de los que partiremos en la *intent* que estemos testeando.

```javascript
describe('should update session & persistent attributes correctly', () => {
  alexaTest.test([
    {
      request: new test.IntentRequestBuilder(skillSettings, 'HelloIntent').build(),
      withSessionAttributes: {
        isSkillLaunched: false
      },
      withStoredAttributes: {
        isANewUser: true
      },
      hasAttributes: {
        isSkillLaunched: true
      },
      storesAttributes: {
        isANewUser: false
      }
    }
  ]);
});
```

## APL(A) Testing

**Para testear el renderizado de un documento APL (o APLA) utilizaremos el atributo `renderDocument`**. En este atributo deberemos indicar el token que utilizamos para renderizar el documento, podremos testear las propiedades del propio documento JSON y por último las propiedades que le fueron pasadas al documento como *datasources*.

```javascript
describe('should render APL document', () => {
  alexaTest.test([
    {
      request: new test.LaunchRequestBuilder(skillSettings)
        .withInterfaces({ apl: true })
        .build(),
      renderDocument: {
        token: 'token',
        document: (doc) => {
          return doc?.type === 'APL';
        },
        hasDataSources: {
          datasources: (ds) => {
            return (
              ds?.properties?.background === i18n.t('BACKGROUND') &&
              ds?.properties?.logo === i18n.t('LOGO') &&
              ds?.properties?.text === i18n.t('HELLO_TEXT')
            );
          }
        }
      }
    }
  ]);
});
```

Igual que **introducimos `.withInterfaces({ apl: true })` para indicar que el dispositivo virtual con el que queremos ejecutar el test tiene pantalla**, podríamos añadir además **`video: true` para probar el comportamiento de nuestra Skill en dispositivos con pantalla que soporten vídeo**. Hasta febrero de 2023, esta condición simplemente editaba el valor de `handlerInput.requestEnvelope.context.System.device.supportedInterfaces.VideoApp` para poder probar la interfaz `VideoApp`, sin embargo también existe el parámetro `handlerInput.requestEnvelope.context.Viewport.video` que indica si un dispositivo puede reproducir vídeos, lo cual es necesario para renderizar componentes de tipo `Video` (sin recurrir a `VideoApp`). Pero, a raíz de abrir [este issue](https://github.com/taimos/ask-sdk-test/issues/31) y [esta PR](https://github.com/taimos/ask-sdk-test/pull/37), si introducimos el valor `video: true`, estaremos editando la propiedad `handlerInput.requestEnvelope.context.Viewport.video`, que tomará el valor `{ codecs: ['H_264_41', 'H_264_42'] }`, indicando así que podemos usar el componente `Video` en nuestros documentos APL.

En cuanto al testeo de documentos APLA, podremos realizarlo de forma equivalente al testeo de documentos APL:

```javascript
describe('should render APLA document', () => {
  alexaTest.test([
    {
      request: new test.LaunchRequestBuilder(skillSettings).build(),
      renderDocument: {
        token: 'token',
        document: (doc) => {
          return doc?.type === 'APLA';
        },
        hasDataSources: {
          datasources: (ds) => {
            return (
              ds?.properties?.speechText.includes(i18n.t('HELLO'))
            );
          }
        }
      }
    }
  ]);
});
```

## ¿Qué más puedo testear?

Además de todos los atributos para testing que se han mencionado, tenemos también la posibilidad de utilizar **el atributo `callback`, que nos devolverá directamente la respuesta de la *intent*** que estemos testeando y podremos hacer comprobaciones concretas sobre la información que contiene el objeto JSON devuelto.

Aún así hay bastantes atributos más que podéis utilizar y se encuentran en [el repositorio de `ask-sdk-test`](https://github.com/taimos/ask-sdk-test/blob/master/src/types.ts), concretamente en `SequenceItem`. Hay atributos para comprobar que Alexa pregunta al usuario por el valor de un *slot* necesario, o que pide confirmación de dicho valor, etc. Podemos testear también la información que se muestra en una card enviada a la Alexa App, interfaces de `AudioPlayer` y `VideoApp`, así como información relativa a *account linking*, como el token almacenado del usuario.

Por último, y no por ello menos importante (de hecho es bastante interesante), debemos saber que tenemos la posibilidad de testear literalmente **el flujo de una conversación**. Si os habéis fijado, el parámetro que introducimos al ejecutar `alexaTest.test()` es un array 👀; esto quiere decir que podemos ir anidando *intents* una detrás de otra como si fueran interacciones continuadas dentro de una misma conversación. Testear una *intent* en solitario está bien, pero realmente **lo que vamos a necesitar que funcione es esa *intent* invocada en cualquier momento de la conversación, la cual es probable que no devuelva la misma respuesta en cualquier contexto**.

```javascript
describe('should follow the conversation correctly', () => {
  alexaTest.test([
    {
      request: new test.LaunchRequestBuilder(skillSettings).build(),
      ...
    },
    {
      request: new test.IntentRequestBuilder(skillSettings, 'HelloIntent').build(),
      ...
    },
    {
      request: new test.IntentRequestBuilder(skillSettings, 'AMAZON.StopIntent').build(),
      ...
    }
  ]);
});
```

Además, utilizando estos tests en cadena, dejaremos de tener la necesidad de recurrir a `withSessionAttributes` o `withStoredAttributes` porque precisamente cada *intent* será ejecutada teniendo el contexto (atributos de sesión y persistentes) que dejó la *intent* que la precedía en la conversación.

## Curiosidades

La librería `ask-sdk-tests` no está adaptada para funcionar con los `it` de mocha, tan solo con los `describe`. De esta manera, el código que muestro a continuación mostraría siempre un test satisfactorio, pusiéramos lo que pusiéramos en los valores de respuesta esperados.

```javascript
describe('Alexa Skill', () => {
  it('LaunchRequest', () => {
    alexaTest.test([
      {
        request: new test.LaunchRequestBuilder(skillSettings).build(),
        saysLike: i18n.t('HELLO'),
        repromptsLike: i18n.t('REPROMPT_HELLO')
      }
    ]);
  });

  it('AMAZON.FallbackIntent', () => {
    alexaTest.test([
      {
        request: new test.IntentRequestBuilder(skillSettings, 'AMAZON.FallbackIntent').build(),
        saysLike: i18n.t('FALLBACK'),
        repromptsLike: i18n.t('REPROMPT_FALLBACK')
      }
    ]);
  });
});
```

Deberíamos escribir algo como esto para que realmente nuestros tests estuvieran funcionando:

```javascript
describe('Alexa Skill', () => {
  describe('LaunchRequest', () => {
    alexaTest.test([
      {
        request: new test.LaunchRequestBuilder(skillSettings).build(),
        saysLike: i18n.t('HELLO'),
        repromptsLike: i18n.t('REPROMPT_HELLO')
      }
    ]);
  });

  describe('AMAZON.FallbackIntent', () => {
    alexaTest.test([
      {
        request: new test.IntentRequestBuilder(skillSettings, 'AMAZON.FallbackIntent').build(),
        saysLike: i18n.t('FALLBACK'),
        repromptsLike: i18n.t('REPROMPT_FALLBACK')
      }
    ]);
  });
});
```

Como última apreciación sobre el testing de Alexa Skills, por si no os habéis topado ya con ello, debéis saber que no podemos testear APL a la vez que testeamos APLA. Si en la respuesta de una *intent* renderizamos tanto un documento APL como un documento APLA, no habrá manera de testear el funcionamiento de ambas directivas. ¿Te animas a abrir un issue o una PR y contribuir así al código de `ask-sdk-test`? 🤓

> “Technology, like art, is a soaring exercise of the human imagination”
>
> ###### Daniel Bell
