---
layout: ../../layouts/PostLayout.astro
title: 'Redis Event-Driven Microservices 👩🏻‍💻'
pubDate: 2021/06/19
description: 'O cómo conseguir arquitecturas controladas por eventos con Redis'
author: 'Clara Jiménez'
image:
    url: 'https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/redis-streams.png' 
    alt: 'Redis Event-Driven Microservices'
tags: ["redis", "microservices", "javascript"]
---
Cuando tenemos una arquitectura de microservicios, aparecen un montón de herramientas y metodologías para establecer la comunicación entre ellos. La más sencilla, pero no siempre la más práctica, se basa en recurrir a peticiones HTTP de un microservicio a otro. Sin embargo, HTTP es un protocolo de comunicación sincrónica, lo que implica tener que esperar a la respuesta del destinatario de la petición. En un monolito, estas peticiones que ahora son entre microservicios se verían reducidas a llamadas a funciones, donde no se tendría la latencia añadida por una petición HTTP.

Además, podemos ir un paso más allá y contemplar la posibilidad de que un microservicio necesite comunicarse, para una misma petición, con varios microservicios. Esto implicaría notificar algo en cascada, lo que con peticiones HTTP, supondría, además de tener que conocer todos los destinatarios de una notificación, asumir las latencias que esto supone.

Para evitar esta latencia en una arquitectura con microservicios, y, además, ofrecer la abstracción e independencia necesarias entre los microservicios como para enviar un mensaje "al aire" y que lo recoja quien considere que lo necesita, debemos evitar el uso de comunicación sincrónica entre ellos y comenzar a pensar en soluciones basadas en una arquitectura controlada por eventos (Event-Driven Architecture).

Redis Pub/Sub para publicación y suscripción a eventos
------------------------------------------------------

Redis Pub/Sub es la herramienta que nos aporta Redis para poder enviar mensajes a varios destinatarios sin necesidad de conocerlos desde un emisor. Un microservicio publica un mensaje bajo un determinado topic y múltiples microservicios pueden suscribirse a ese topic, recibiendo así todos los mensajes que se publiquen bajo ese topic.

```javascript
import redis from 'redis';
const config = { host: '127.0.0.1', port: 6379 };

const publisher = redis.createClient(config);

publisher.publish('notify-event', JSON.stringify(object));
```

```javascript
import redis from 'redis';
const config = { host: '127.0.0.1', port: 6379 };

const subscriber = redis.createClient(config);

subscriber.subscribe('notify-event', () => {
  subscriber.on('message', async (channel, message) => {
    await messageHandler(message);
  })
});
```

Sin embargo, a diferencia de otras soluciones en este ámbito como RabbitMQ, Redis Pub/Sub no hace diferenciación entre las instancias de un mismo subscriber. En este caso, si tenemos varias instancias de un mismo microservicio, todas suscritas a un determinado topic, cada vez que se publique un mensaje bajo ese topic, todas las instancias acudirán a ejecutar el código correspondiente simultáneamente. En este caso, Redis Streams sería la opción a utilizar, introducida por Redis en su versión 5.0, para controlar esto. Además, Redis Streams ofrece frente a Redis Pub/Sub la posibilidad de persistir los mensajes antes de ser consumidos por sus destinatarios. Si un consumidor, en Redis Pub/Sub no está activo y ejecutándose con normalidad, los mensajes que se publiquen que sean de su interés no podrán ser rescatados más adelante. Con Redis Streams sí podremos hacer esto gracias a la persistencia de mensajes que ofrece.

Redis Streams
-------------

Con Redis Streams podemos tener, al igual que con Redis Pub/Sub, varios consumidores de un mismo topic, en este caso, stream. Sin embargo, en Redis Streams aparecen los consumer groups o grupos de consumidores. Cada grupo de consumidores recibiría una notificación con cada mensaje publicado en el stream al que se haya suscrito. Sin embargo, si un grupo de consumidores contiene más de una instancia, solo una de ellas procesará el evento recibido mediante balanceamiento de cargas. Además, puede haber varios consumer groups suscritos a un mismo stream pero, quizás, no a todos les afecten los mismos eventos publicados en ese stream. Entonces, aunque les lleguen todos los eventos del stream al que están suscritos, podremos hacer también que actúen o no en función de qué evento/acción sea.

Este concepto de consumer group podemos encontrarlo también en soluciones como RabbitMQ, KubeMQ o Apache Kafka.

![Redis Streams Consumers](https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/redis-streams.png)

Producer:

```javascript
import redis from 'redis';
const config = { host: '127.0.0.1', port: 6379 };

const redisClient = redis.createClient(config);

const STREAMS_KEY = 'streamsKey';

// produce the message
redisClient.xadd(STREAMS_KEY, '*',
  'action', 'action_type',
  'key_1', 'value_1',
  'key_2', 'value_2',
  'key_3', 'value_3',
  (err) => {
    if (err) console.log(`ERROR: ${err}`);
  }
);
```

Consumer:

```javascript
import redis from 'redis';
import async from 'async';
const config = { host: '127.0.0.1', port: 6379 };

const redisClient = redis.createClient(config);

const STREAMS_KEY = 'streamsKey';
const GROUP_ID = 'groupId';
const CONSUMER_ID = 'consumerId';

// create the group
redisClient.xgroup('CREATE', STREAMS_KEY, GROUP_ID, '$', 'MKSTREAM', (err) => {
  if (err) {
    if (err.code === 'BUSYGROUP') {
      console.log(`Group ${GROUP_ID} already exists at stream ${STREAMS_KEY}`);
    } else {
      console.log(`ERROR: ${err}`);
    }
  } else {
    console.log(`Group ${GROUP_ID} successfully subscribed to stream ${STREAMS_KEY}`);
  }
});

// read messages
async.forever(
  (next) => {
    redisClient.xreadgroup('GROUP', GROUP_ID, CONSUMER_ID, 'BLOCK', 500, 'NOACK', 'STREAMS', STREAMS_KEY, '>', (err, stream) => {
      if (err) {
        next(err);
      }
      if (stream) {
        const messages = stream[0][1];
        // print all messages
        messages.forEach((message) => {
          // convert the message into a JSON Object
          const id = messages[0];
          const values = messages[1];
          let msgObject = { id };
          for (let i = 0; i < values.length; i = i + 2) {
            msgObject[values[i]] = values[i + 1];
          }
          console.log(`Message: ${JSON.stringify(msgObject)}`);
        })
      } else {
        // No message in the consumer buffer
        console.log('No new message...');
      }
      next();
    });
  },
  (err) => {
    console.log(`ERROR: ${err}`);
  }
);
```

Al crear un grupo asociado a un stream, si el stream no existe deberemos añadir el parámetro MKSTREAM para que lo cree automáticamente como un stream vacío. No podemos tratar de subscribirnos a un stream que no existe. También con XADD, al enviar un mensaje a un stream concreto, se crea directamente el stream si no había sido creado previamente.

En XREADGROUP también tenemos algún parámetro importante a tener en cuenta como el parámetro BLOCK que indica la cantidad de tiempo que una instancia estará bloqueando un stream de un consumer group a la espera de leer mensajes, o el parámetro COUNT que permite determinar cuántos mensajes recogerá una instancia como máximo si se encuentra varios mensajes en la cola dispuestos a ser procesados.

Podéis encontrar un ejemplo desarrollado sobre el uso de Redis Streams en mi GitHub [\[1\]](https://github.com/clara-jr/redis-streams-node). En este ejemplo añado también la gestión de fallos en mensajes una vez procesados por una instancia. Si utilizamos XREADGROUP sin el parámetro NOACK, cada vez que una instancia lea un mensaje de un stream, deberá confirmar su procesamiento con un ACK (mediante XACK), y si no lo hace, este mensaje permanecerá en una nueva cola de mensajes pendientes. En esta cola tendremos información de cuánto tiempo lleva el mensaje sin ser procesado (en cada intento de procesarse este tiempo se resetea), cuántos reintentos ha soportado y los identificadores de las instancias que se han encargado de estos reintentos. Podremos inspeccionar esta cola (mediante XPENDING) siempre que lo necesitemos y rescatar mensajes (mediante XCLAIM) pendientes de ser procesados para que desaparezcan de dicha cola al confirmar su procesamiento satisfactorio con XACK.

Por cierto, adjunto cheat sheet muy chulo sobre Redis Streams[\[2\]](https://lp.redislabs.com/rs/915-NFD-128/images/DS-Redis-Streams.pdf) ❤️

Redis Pub/Sub + RSMQ para publicación y suscripción a eventos mediante colas
----------------------------------------------------------------------------

RSMQ (Redis Simple Message Queue)[\[3\]](https://www.npmjs.com/package/rsmq)[\[4\]](https://github.com/smrchy/rsmq) es una librería, generada con Redis como base (Just Redis and ~500 lines of javascript), que permite gestionar envío de mensajes con Redis mediante colas.

Lo primero que debemos hacer es inicializar RSMQ con la configuración propia de Redis, añadiendo una clave más que será ns: 'rsmq'. Después, para poder enviar mensajes a una cola, debemos crear la cola con createQueue, dándole un nombre a la cola (qname).

```javascript
import RedisSMQ from 'rsmq';
const config = { host: '127.0.0.1', port: 6379 };

const publisher = new RedisSQM({ ...config, ns: 'rsmq' });

publisher.createQueue({ qname: 'notify-event' }, (err, res) => {
  if (err) {
    console.log(`ERROR: ${err}`);
    return;
  }
  if (res === 1) console.log('queue created');
});
```

Una vez creada la cola, podemos enviar mensajes a dicha cola mediante sendMessage para que los recojan los destinatarios.

```javascript
publisher.sendMessage({ qname: 'notify-event', message: JSON.stringify(object) }, (err, res) => {
  if (err) {
    console.log(`ERROR: ${err}`);
    return;
  }
  console.log(`Message sent with id ${res}`);
});
```

Para recibir los mensajes de una cola podemos utilizar las funciones receiveMessage o popMessage, ambas reciben el último mensaje de la cola seleccionada y, popMessage, además, elimina seguidamente el mensaje de la cola. No habrá manera de recibir el mensaje de nuevo si algo va mal en la gestión del mismo.

```javascript
import RedisSMQ from 'rsmq';
const config = { host: '127.0.0.1', port: 6379 };

const subscriber = new RedisSQM({ ...config, ns: 'rsmq' });

subscriber.popMessage({ qname: 'notify-event' }, (err, res) => {
  if (err) {
    console.log(`ERROR: ${err}`);
    return;
  }
  if (res.id) {
    const { message } = res;
    // Business logic...
    console.log(`Message received and deleted from queue: ${res}`);
  } else {
    console.log('No messages for me...');
  }
});
```

Dado que esta forma de recibir mensajes que se han publicado previamente no es la misma que con Redis Pub/Sub, no estaremos suscritos a las publicaciones de mensajes, si no que tendremos que recoger los mensajes de la cola bajo petición. De esta manera, para hacer un seguimiento constante de lo que se va publicando en la cola deberemos hacer polling continuo usando receiveMessage o popMessage.

Por otro lado, si inicializáramos RSMQ con el parámetro opcional realtime a true, en cada mensaje nuevo que se envía a RSQM a través de sendMessage, se enviará un PUBLISH de Redis a {config.ns}:rt:{qname}, lo que en nuestro caso sería rsmq:rt:notify-event. De esta manera, tendremos que encargarnos nosotros de recoger este mensaje mediante un SUBSCRIBE de Redis para recibir estas notificaciones de sendMessage y emitir aquí una llamada a receiveMessage (o popMessage). Sin embargo, si tenemos varias instancias de un mismo microservicio y todas se suscriben a estos mensajes, estaríamos de nuevo ejecutando múltiples llamadas receiveMessage (o popMessage) simultáneamente. Si queremos recurrir a Redis como solución a una comunicación por eventos entre microservicios con varias instancias para cada microservicio, deberemos usar Redis Streams.

> “Redis Streams allows for a completely asynchronous pattern where every service announces events on its own stream, and listens only to streams belonging to services it’s interested in.”
>
> ###### Redis Techies