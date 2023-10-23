---
layout: ../../layouts/PostLayout.astro
title: 'Redis Keyspace Notifications 👩🏻‍💻'
pubDate: 2021/03/02
description: 'O cómo gestionar eventos de expiración con Redis'
author: 'Clara Jiménez'
image:
    url: '' 
    alt: 'Redis Keyspace Notifications'
tags: ["redis", "microservices", "javascript"]
---
Los sistemas de almacenamiento temporales, como Redis, suelen ser ampliamente utilizados para eliminar parte de carga de las bases de datos, especialmente cuando se trata de consultas pesadas o altamente frecuentes. **Si una consulta se espera que sea realizada con alta frecuencia, podemos hacerla una vez, almacenar la respuesta en una caché y las siguientes veces comprobar si el resultado lo tenemos en caché** antes de acudir de nuevo a la base de datos. La caché será mucho más rápida que la base de datos porque almacenará los datos en memoria. Tenemos que tener presente, en este caso de soluciones, cada cuánto se modifican los datos que estamos consultando en la base de datos. Si esta frecuencia es baja, todo correcto, pero si es mínimamente alta, podemos correr el riesgo de estar recuperando datos de caché desactualizados con respecto a los datos persistidos en base de datos. Para evitar problemas como este, tendremos que implementar una política de expiración de nuestros datos de caché. Cuando los datos expiren, se eliminarán de la caché automáticamente, evitando así que los datos de la caché queden desactualizados y facilitando su sincronización con la base de datos.

Sin embargo, no es el único uso que podemos querer dar a un sistema de almacenamiento temporal. Quizás, cuando hay demasiadas peticiones de **escritura con mucha frecuencia en base de datos, preferimos retrasar la persistencia de estos datos y pasar primero por una caché que después volcaremos, con menor frecuencia, a la base de datos**. Aquí también trabajaremos con una política de expiración. Cuando los datos expiren, deberán persistirse a la base de datos y eliminarse de la caché. La diferencia entre este caso de uso y el anterior, es que aquí necesitamos recuperar los datos que han expirado para procesarlos antes de ser eliminados. Por tanto, no podemos permitir que se eliminen automáticamente tras su expiración. Otro caso de uso para el que podemos necesitar recuperar la información que está expirando será para cualquier sistema de notificaciones o tareas con fecha de vencimiento programada. Para estos casos de uso, vamos a ver cómo **Redis nos permite gestionar la expiración de nuestros datos almacenados en caché sin que estos sean eliminados automáticamente gracias a [Redis Keyspace Notifications](https://redis.io/docs/manual/keyspace-notifications/)**.

Gestión de eventos de expiración
---------------------------------

Para gestionar eventos de expiración en Redis, la primera idea que debemos tener clara es que, si queremos hacer algo con el objeto almacenado en Redis tras su expiración, deberemos manejar dos objetos en Redis asociados de algún modo a una misma clave. **Un primer objeto almacenará la información que queramos recuperar y un segundo objeto no almacenará ninguna información relevante pero marcará la expiración del primer objeto**. Esto debe implementarse así porque cuando se establece una fecha de expiración a un objeto en Redis, este se borra automáticamente y, al suscribirnos a eventos de expiración, luego no podremos recuperar la información del objeto que ha expirado porque habrá sido eliminado automáticamente.

Lo primero que haremos será importar el paquete de [`ioredis`](https://www.npmjs.com/package/ioredis). Inicializamos también nuestros clientes de Redis, no olvidando incluir en la configuración de uno de ellos `notify-keyspace-events: 'Ex'`, aunque sea programáticamente.

```javascript
import Redis from 'ioredis';
const config = { host: '127.0.0.1', port: 6379 };

const redisCache = new Redis(config);
redisCache.on('ready', () => {
  redisCache.config('SET', 'notify-keyspace-events', 'Ex');
});
const expirationSubscriber = new Redis(config);
```

Ahora ya podemos registrar dos objetos asociados a una clave `key`, el que almacena la información y el que gestiona la expiración:

```javascript
// Save string in Redis with a particular key
await redisCache.set(key, JSON.stringify(object));

// Generate expiration key in Redis
await redisCache.setex(`reminder:${key}`, TTL, 'expire');
```

También podemos realizar ambas acciones en una misma llamada haciendo uso de `multi()` y `exec()`. Si hubiera algún error de sintaxis en alguno de los comandos, no se ejecutaría ninguno de ellos.

```javascript
await redisCache.multi().set(key, JSON.stringify(object)).setex(`reminder:${key}`, TTL, 'expire').exec();
```

Ya podemos también suscribirnos a eventos de expiración en Redis y recoger adecuadamente la información del objeto que esté expirando:

```javascript
const { db = 0 } = config;
expirationSubscriber.on('ready', () => {
  const expiredSubKey = `__keyevent@${db}__:expired`;
  expirationSubscriber.subscribe(expiredSubKey, () => {
    expirationSubscriber.on('message', async (channel, message) => {
      // Do not execute expirationHandler on every expired event
      if (message.split(':')[0] === 'reminder') {
        await expirationHandler(message);
      }
    });
  });
});

async function expirationHandler(message) {
  message = message.split(':');
  if (message.length >= 2) {
    const key = message[1];
    const object = await redisCache.get(key);
    object = JSON.parse(object);
    // Business logic...
    await redisCache.del(key);
  }
}
```

A su vez, tras recuperar el objeto con clave `key` y tratarlo como sea necesario, debemos borrarlo si así lo queremos, ya que solo se ha borrado automáticamente el objeto con clave `reminder:[key]`, el cual gestionaba concretamente la expiración.

Gestión de eventos de expiración con múltiples instancias de un mismo microservicio
-----------------------------------------------------------------------------------

El manejo de eventos, ya sea en este caso de expiración o debido a cualquier manejo de publicación y suscripción a eventos, puede acabar teniendo varios destinatarios, varios *subscribers*. En el caso de suscripción a eventos de expiración, si son varias instancias las que tenemos del microservicio que se encarga de esto, **todas querrán atender a ese evento de expiración** y ejecutarían el mismo código en paralelo innecesariamente y pudiendo ocasionar errores.

Por esta razón, queremos **que cuando un objeto expire, sea una sola instancia la que se encargue de manejar su evento de expiración**. Esto podremos hacerlo generando el objeto que expira por una instancia y marcando ese objeto para que se sepa qué instancia lo registró y que sea así esa la única que ejecute el código establecido en su expiración. Podemos utilizar la librería [`anyid`](https://www.npmjs.com/package/anyid) para generar identificadores únicos para cada instancia y marcar los objetos con esos identificadores. Si, cuando un objeto expira, no esta marcado con mi identificador de instancia, es que no soy yo la instancia encargada de gestionar ese objeto.

```javascript
import { anyid } from 'anyid';

const INSTANCEID = generateInstanceId();

function generateInstanceId() {
  return anyid().encode('Aa0').length(8).random().id();
}
```

```javascript
// Save string in Redis with a particular key
await redisCache.set(key, JSON.stringify(object));

// Generate expiration key in Redis (only if it was not generated by another instance before)
redisCache.keys(`reminder:${key}:*`, async (err, keys) => {
  if (!err && keys.length === 0) {
    await redisCache.setex(`reminder:${key}:${INSTANCEID}`, TTL, 'expire');
  }
});
```

```javascript
async function expirationHandler(message) {
  message = message.split(':');
  if (message.length >= 3 && message[2] === INSTANCEID) {
    const key = message[1];
    const object = await redisCache.get(key);
    object = JSON.parse(object);
    // Business logic...
    await redisCache.del(key);
  }
}
```

Pero, un momento, una última pregunta: **¿qué pasa si la instancia encargada de atender alguno de los eventos de expiración se cae?** Como Redis Pub/Sub tiene un funcionamiento *fire and forget*, perderíamos todos los eventos expirados mientras que la instancia haya estado caída. Si queremos solventar también este último punto, **podremos hacer uso de `GETDEL`** y dejar de usar `anyid` para permitir que cualquier instancia atienda a cualquier evento de expiración, pero solo una recogerá el elemento de Redis (la primera que recupere el objeto y lo elimine).

```javascript
async function expirationHandler(message) {
  message = message.split(':');
  if (message.length >= 2) {
    const key = message[1];
    const object = await redisCache.getdel(key);
    if (object) {
      object = JSON.parse(object);
      // Business logic...
    }
  }
}
```

¿Y qué pasaría si todas las instancias estuvieran caídas? 🫣 En este caso llegaríamos a tener datos *huérfanos*, sin clave de expiración asociada, y podrían quedarse en Redis sin llegar a persistirse en base de datos indefinidamente. Para solucionar esto, cada vez que nos llegue información actualizada sobre un objeto que tengamos almacenado en Redis, además de actualizarla podemos generar su clave de expiración si es que esta desapareció:

```javascript
const expirationKey = await redisCache.get(`reminder:${key}`)
if (expirationKey) {
  await redisCache.set(key, JSON.stringify(object));
} else {
  await redisCache.multi().set(key, JSON.stringify(object)).setex(`reminder:${key}`, TTL, 'expire').exec();
}
```

Lo que sí hemos comprobado es que no podríamos recurrir a Redis Keyspace Notifications en caso de necesitar realizar una acción determinada en el momento justo de recibir un mensaje bajo suscripción a Redis Pub/Sub. Porque si ese mensaje llega y *no estoy*, lo habré perdido para siempre 🥵.

Ya sabéis cómo utilizar almacenamiento temporal en caché. ¡Ahora sólo tenéis que utilizarlo bien!

> “Redis is the most advanced NoSQL database with no single point of failure.”
>
> ###### Senior IT Architect