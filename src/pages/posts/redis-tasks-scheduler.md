---
layout: ../../layouts/PostLayout.astro
title: 'Redis Tasks Scheduler 👩🏻‍💻'
pubDate: 2023/09/01
description: 'Creamos un sistema de planificación de tareas con Redis'
author: 'Clara Jiménez'
image:
    url: 'images/posts/redis-tasks-scheduler.jpg' 
    alt: 'Redis Tasks Scheduler'
tags: ["redis", "microservices", "javascript"]
draft: true
---

Un sistema de planificación y ejecución de tareas es muy útil (y necesario) para gran cantidad de proyectos. Es muy común, por ejemplo, tener la necesidad de enviar emails a determinados usuarios cada cierto tiempo o en un momento concreto y preestablecido. Por otro lado, también es frecuente encontrarse con la necesidad de programar tareas bajo alguna expreción *cronológica*, como algo que haga falta hacer 1 vez al día o al mes. Por eso, vamos a ver cómo podríamos centralizar esta necesidad que tenemos en un planificador de tareas utilizando Redis.

## Tareas recurrentes

Para la ejecución de tareas recurrentes (bajo alguna expreción *cronológica*) no necesitaremos recurrir a Redis todavía. Tan solo haremos uso de [`node-cron`](https://github.com/node-cron/node-cron).

```javascript
import cron from 'node-cron';

const recurrentTasks = {
  'dailyTask': {
    handler: dailyTask.runTask,
    cronExpression: 0 0 * * *
  },
  'monthlyTask': {
    handler: monthlyTask.runTask,
    cronExpression: 0 0 1 * *
  }
}

// Start execution of recurrent tasks
Object.keys(recurrentTasks).forEach((taskType) => {
  const { handler, cronExpression } = recurrentTasks[taskType];
  runRecurrentTasks(taskType, handler, cronExpression);
  console.log(`Running ${taskType} recurrent tasks`);
});

function runRecurrentTasks(taskType, handler, cronExpression) {
  recurrentTasks[taskType].task = cron.schedule(cronExpression, handler);
}
```

Si en algún momento quisiéramos parar alguna de las tareas recurrentes programadas bastaría con parar la tarea que se ha creado con `cron.schedule`.

```javascript
function stopRecurrentTasks(taskType) {
  const task = recurrentTasks[taskType]?.task;
  if (task) {
    task.stop();
  }
  console.log(`Stopped ${taskType} recurrent tasks`);
}
```

Si la instancia se apaga, también se desprograman estas tareas recurrentes, ya que `node-cron` simplemente se encarga de ejecutar la función que le hemos indicado (`handler`) según la expresión cronológica asociada (`cronExpression`). Por eso, al reiniciar el servicio deberíamos crear estas tareas de nuevo.

## Tareas programadas

Para el caso de las tareas programadas ya podemos meternos de lleno en Redis. Antes de nada, la primera solución que se nos puede venir a la mente para gestionar tareas planificadas para una determinada fecha es usar **Redis Keyspace Notifications**, como vimos en [este post](https://clara-jr.github.io/posts/redis-keyspace-notifications/), con una clave que expira y otra clave asociada a esta primera con los datos necesarios para ejecutar la tarea en el momento de expiración. Sin embargo, **Redis Pub/Sub tiene un funcionamiento *fire and forget***, de forma que, si la instancia suscrita a los eventos se desconecta y se vuelve a conectar más tarde, todos los eventos entregados durante el tiempo en el que estuvo desconectada se perderían.

Comenzamos por inicializar nuestro cliente de Redis:

```javascript
import Redis from 'ioredis';

const redisConfig = { host: 'localhost', port: 6379 }
const redis = new Redis(redisConfig);
```

Seguidamente, para programar las tareas, **trabajaremos con un [sorted set](https://redis.io/docs/data-types/sorted-sets/) para cada tipo de tarea y con un [hash](https://redis.io/docs/data-types/hashes/) para almacenar la información de cada tarea**. El sorted set tendrá por clave un valor representativo del tipo de tareas que gestionará (`tasks:[taskType]`) y la clave de cada hash será única para cada tarea concreta (`tasks:[taskType]:[taskId]`). Por ejemplo, podemos tener una tarea asociada al envío de correos de aviso de que va a dar comienzo la nueva temporada de una serie a aquellos usuarios que marcaron dicha serie como favorita, siendo estas tareas del tipo `sendSeriesStartsEmail`. Esto daría como resultado un sorted set con clave `tasks:sendSeriesStartsEmail` y un hash para cada serie concreta con la clave, por ejemplo, `tasks:sendSeriesStartsEmail:StrangerThings`.

![Redis Tasks Scheduler](/images/posts/redis-tasks-scheduler.jpg)

Al programar una tarea, **añadimos con `ZADD` un elemento al sorted set** que corresponda (según el tipo de tarea) con un valor que será el del identificador (`ìd`) de la tarea concreta (p. ej. `StrangerThings`). **El *score* de este elemento tomará el valor de la fecha en la que quiere ejecutarse dicha tarea** (como marca temporal de Unix en milisegundos). A su vez, **creamos un hash utilizando `HSET`** con la clave identificativa de la tarea (p. ej. `StrangerThings`) y con un objecto con la información que vayamos a necesitar en el momento de ejecución de la tarea como valor (`seriesName`, `newSeasonStartDate`, etc.). Al utilizar un hash en vez de un [string](https://redis.io/docs/data-types/strings/), podríamos recuperar los atributos del hash, e incluso editarlos, por separado, si fuera necesario. De esta forma, el hash funciona como una composición de subclaves asociadas a distintos valores en formato string. Si quisiéramos almacenar un valor con un formato distinto de un string, bastaría con *stringificar* dicho valor antes de insertarlo y parsearlo al recuperarlo.

```javascript
async function scheduleTask(taskType, taskId, time, payload) {
  const setKey = `tasks:${taskType}`;
  const hashKey = `tasks:${taskType}:${taskId}`;

  // Add task to sorted set with taskId as value and execution time as score
  await redis.zadd(setKey, new Date(time).getTime(), taskId);

  if (payload) {
    // Add task data to hash with payload as field-value pairs
    await redis.hset(hashKey, payload);
  }
}
```

Al (re)iniciar el servicio debemos arrancar la lectura de los sorted sets que tengamos almacenados en Redis con intención de ir ejecutando las tareas de las cuales haya vencido la fecha (el *score*). **Cada tipo de tarea tendrá asociada una función (`handler`)** que se ejecutará cuando se rescate una tarea vencida de ese tipo; esta función se ejecutará en el momento establecido con el objeto almacenado en el hash de redis como parámetro de la función.

Cada tipo de tarea tendrá también **un indicador de tiempo (`timeout`)** determinado que representará el tiempo de espera entre que se rescata una tarea de este tipo y se empieza a buscar la siguiente, **y otro timeout (`timeoutWhenEmpty`) algo mayor** que representará el tiempo de espera a tener en cuenta cuando no se encuentren tareas vencidas de ese tipo.

Por último, **podemos añadir también una función `checkBeforeReschedule`** que determine, para cada tipo de tarea, si dicha tarea debe ser reprogramada o no. Para el ejemplo del envío de un correo cuando empiece una nueva temporada de una serie, el primer correo puede decidir programarse para 1 semana antes de la fecha de inicio de la nueva temporada, y tal vez se quiera reprogramar para enviar otro nuevo correo 1 día antes o el mismo día del estreno. En este caso, la función asociada a `checkBeforeReschedule` tendrá que comprobar si el correo que se acaba de enviar es el de la semana previa al estreno o si, por el contrario, ya estamos en la fecha de estreno para saber si se quiere reprogramar la tarea o no.

```javascript
const scheduledTasks = {
  'sendSeriesStartsEmail': {
    handler: sendSeriesStartsEmail.runTask,
    timeout: 500, // Timeout between executions in ms
    timeoutWhenEmpty: 10000, // Timeout between executions when tasks list is empty
    checkBeforeReschedule: sendSeriesStartsEmail.checkIfTaskMustBeRescheduled
  }
}

// Start execution of scheduled tasks
Object.keys(scheduledTasks).forEach((taskType) => {
  const { handler, timeout, timeoutWhenEmpty, checkBeforeReschedule } = scheduledTasks[taskType];
  runScheduledTasks(taskType, handler, timeout, timeoutWhenEmpty, checkBeforeReschedule);
  console.log(`Running ${taskType} scheduled tasks`);
});
```

Ahora vamos a ver cómo debería comportarse la función encargada de gestionar, ejecutar y posiblemente reprogramar las tareas programadas. **Haciendo uso de `ZRANGEBYSCORE` buscamos cada cierto tiempo en cada sorted set de tareas programadas**, aquellas que tengan un *score* asignado entre 0 (1 de enero de 1970 UTC, [Época ECMAScript](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-time-values-and-time-range)) y el timestamp de la fecha actual. Si no hay nada, creamos un temporizador para esperar `timeoutWhenEmpty` milisegundos hasta volver a hacer la siguiente búsqueda.

Cuando encontremos alguna tarea vencida, cogemos el valor del primer elemento del sorted set devuelto por `ZRANGEBYSCORE`, que será el identificador de la tarea (p. ej. `StrangerThings`), y lo usamos para **eliminar ese elemento del sorted set**. Utilizamos de nuevo el identificador de la tarea para componer la clave del hash (`tasks:sendSeriesStartsEmail:StrangerThings`) y rescatar su valor con `HGETALL`. **Usamos el valor del hash para pasárselo a la función encargada de ejecutar este tipo de tareas** (en este caso, `sendSeriesStartsEmail.runTask`). Una vez ejecutada la función de la tarea, **eliminamos el hash de Redis** y comprobamos si debemos **reprogramar la tarea**. El hash de redis podría tener almacenado, por ejemplo, en caso de ser necesaria una reprogramación de la tarea, un atributo `periodicity` con el número de días tras los cuales se debería volver a ejecutar la tarea en cuestión. En el caso del ejemplo, podríamos tener aquí un valor de 7 ya que el primer correo se envía una semana antes del comienzo de la nueva temporada de la serie y se quiere volver a enviar el día del estreno. A su vez, tendremos una doble comprobación haciendo uso de la función `sendSeriesStartsEmail.checkIfTaskMustBeRescheduled` para ver si la fecha de estreno de la nueva temporada (`newSeasonStartDate`) ya ha pasado y por tanto no deberíamos reprogramar la tarea. Una vez ejecutada (y reprogramada) la tarea, **creamos un nuevo temporizador asociado a este tipo de tareas para esperar `timeout` milisegundos** hasta la siguiente inspección del sorted set.

```javascript
// Timers associated to the different tasks types
let timeoutIds = {};

async function runScheduledTasks(
  taskType,
  handler,
  timeout,
  timeoutWhenEmpty,
  checkBeforeReschedule = (payload) => {
    return { payload, reschedule: true };
  },
) {
  const setKey = `tasks:${taskType}`;

  // Get pending tasks with due dates present or past
  const pendingTasks = await redis.zrangebyscore(setKey, 0, Date.now());
  if (!pendingTasks || !pendingTasks.length) {
    // Wait timeoutWhenEmpty ms before checking for new scheduled tasks
    timeoutIds[taskType] = setTimeout(() => {
      runScheduledTasks(taskType, handler, timeout, timeoutWhenEmpty, checkBeforeReschedule);
    }, timeoutWhenEmpty);
    return;
  }

  // First pending task will be run
  const taskId = pendingTasks[0];

  // Remove pending task from redis set
  const removedTasksCount = await redis.zrem(setKey, taskId);
  if (removedTasksCount < 1) {
    // Task was already removed which means it was picked up by other instance
    timeoutIds[taskType] = setTimeout(() => {
      runScheduledTasks(taskType, handler, timeout, timeoutWhenEmpty, checkBeforeReschedule);
    }, timeout);
    return;
  }

  console.log(`Running ${taskType} scheduled task with id ${taskId}`);

  // Get task data from redis hash
  const hashKey = `tasks:${taskType}:${taskId}`;
  const taskDataObject = await redis.hgetall(hashKey);
  const doesObjectExist = Object.keys(taskDataObject).length

  if (doesObjectExist) {
    // Run task using given handler function
    handler(taskDataObject)
      .catch((error) => {
        console.error(`Scheduled task ${taskType} with id ${taskId} failed: ${error}`);
        // If we need retries for tasks that failed we could check hash tasks that don't exist in the set
      })
      .then(() => {
        // Delete hash storing task data
        return redis.del(hashKey);
      })
      .finally(() => {
        // Create another task after periodicity (days) if needed
        const { scheduleDate, periodicity = 0, endDate } = taskDataObject;
        if (periodicity > 0) {
          if (!endDate || endDate > scheduleDate) {
            const newScheduleDate = new Date(scheduleDate);
            newScheduleDate.setDate(newScheduleDate.getDate() + periodicity);
            rescheduleTask(taskType, taskId, newScheduleDate, taskDataObject, checkBeforeReschedule);
          }
        }
      });
  }

  timeoutIds[taskType] = setTimeout(() => {
    runScheduledTasks(taskType, handler, timeout, timeoutWhenEmpty, checkBeforeReschedule);
  }, timeout);
}
```

Al reprogramar una tarea, añadimos de nuevo un elemento al sorted set correspondiente con la nueva fecha como *score* y creamos un nuevo hash con la misma clave y con los datos actualizados para la siguinete ejecución de la tarea. Para abordar estos posibles cambios en el *payload* del hash, usamos [deepmerge](https://github.com/TehShrike/deepmerge) con intención de evitar sobreescribir propiedades embebidas y de poder sobreescribir aquellos atributos que sean arrays en lugar de añadir elementos al array del payload de la tarea anterior.

```javascript
import merge from 'deepmerge';

async function rescheduleTask(taskType, taskId, time, oldPayload = {}, checkBeforeReschedule) {
  const setKey = `tasks:${taskType}`;
  const hashKey = `tasks:${taskType}:${taskId}`;

  const { payload: newPayload, reschedule: taskMustBeScheduled } =
    checkBeforeReschedule(oldPayload);

  if (taskMustBeScheduled) {
    // Add task to sorted set with taskId as value and execution time as score
    await redis.zadd(setKey, new Date(time).getTime(), taskId);

    if (newPayload) {
      const newPayloadWithNewScheduleDate = { ...newPayload, scheduleDate: new Date(time) };
      const arrayMerge = (destinationArray, sourceArray) => sourceArray;
      const dataMerged = merge(oldPayload, newPayloadWithNewScheduleDate, {
        arrayMerge,
      });
      // Add task data to hash with taskId as key and payload as field-value pairs
      await redis.hset(hashKey, dataMerged);
    }
  }
}
```

Como sucedía en las tareas recurrentes, si en algún momento quisiéramos parar alguna de las tareas programadas en Redis bastaría con eliminar el temporizador asociado al tipo de tarea que necesitemos parar. De esta manera, ya no seguiremos inspeccionando el sorted set en busca de elementos con fechas vencidas.

```javascript
function stopScheduledTasks(taskType) {
  const timeoutId = timeoutIds[taskType];
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  console.log(`Stopped ${taskType} scheduled tasks`);
}
```

> “Redis is the most advanced NoSQL database with no single point of failure.”
>
> ###### Senior IT Architect
