---
layout: ../../layouts/PostLayout.astro
title: 'MongoDB Aggregation Pipeline 👩🏻‍💻'
pubDate: 2024/04/10
description: 'Procesado de documentos y análisis de datos usando agregados de MongoDB'
author: 'Clara Jiménez'
image:
    url: '/images/posts/mongo-aggregate.png' 
    alt: 'MongoDB Aggregation Pipeline'
tags: ["mongodb"]
draft: true
---

Cuando gestionamos y manipulamos grandes cantidades de datos en MongoDB es muy probable que acabemos necesitando recurrir al uso de agregados, y esto lo haremos a través de *aggregation pipelines* [[1]](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/)[[2]](https://www.mongodb.com/basics/aggregation-pipeline). Estos agregados los ejecutaremos haciendo uso del método `db.collection.aggregate()`, que nos permitirá hacer operaciones mucho más flexibles y robustas que un simple `find()`: haremos cálculos basados en agrupaciones de datos, recuperaremos información de diversas colecciones, proyectaremos solo los atributos relevantes, etc.

![MongoDB Aggregation Pipeline](/images/posts/mongo-aggregate.png)

## Aggregation Pipeline Stages [[3]](https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/)

A continuación podemos ver algunas de las etapas que podremos utilizar en el pipeline de agregación, para qué sirven y cómo funcionan:

[`$addFields`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/addFields/)<br>
[`$count`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/count/)<br>
[`$facet`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/facet/)<br>
[`$group`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/)<br>
[`$lookup`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/)<br>
[`$match`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/match/)<br>
[`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/)<br>
[`$unwind`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/)

## Aggregation Pipeline Operators [[4]](https://www.mongodb.com/docs/manual/reference/operator/aggregation/)

Aquí vemos algunos de los operadores que vamos a poder utilizar en las etapas del pipeline de agregación:

[`$avg`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/avg/)<br>
[`$cond`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/cond/)<br>
[`$divide`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/divide/)<br>
[`$eq`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/eq/)<br>
[`$exists`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/exists/)<br>
[`$gte`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/gte/)<br>
[`$ifNull`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/ifNull/)<br>
[`$lte`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lte/)<br>
[`$map`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/map/)<br>
[`$multiply`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/multiply/)<br>
[`$reduce`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/reduce/)<br>
[`$round`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/round/)<br>
[`$size`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/size/)<br>
[`$subtract`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/subtract/)<br>
[`$sum`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sum/)<br>
[`$toInt`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toInt/)<br>

## ¡Vamos a por el caso de uso!

Vamos a utilizar todos estos operadores y etapas del *aggregation pipeline* para **analizar datos de encuestas de satisfacción de un servicio o producto**. Imaginemos, por ejemplo, que el producto o servicio en cuestión es un curso de una plataforma de e-learning. Tenemos multitud de usuarios registrados en diferentes cursos y, cuando los completan, responden una encuesta de satisfacción para valorar lo aprendido en el curso. Nuestra intención es analizar los datos de estas encuestas para conocer, por ejemplo, cuál es la valoración media de nuestros cursos, qué aplicabilidad tienen y con qué probabilidad los usuarios los recomendarían.

Lo primero que haremos será recuperar todas las encuestas que vayamos a querer analizar, por ejemplo, las de un determinado curso; para aplicar este tipo de filtros recurrimos a la etapa `$match`. Cada encuesta tendrá un atributo `score` y un atributo `applicability`, indicando la puntuación que se le ha dado a un determinado curso (del 0 al 10) y si se ha considerado aplicable (`"yes"`) o no (`"no"`). Con la etapa `$addFields` rescataremos el valor de la puntuación con la que el usuario valoró el curso y transformaremos a valor numérico (0 o 1) el atributo que indica si el usuario consideró o no aplicable el curso para su futuro profesional (haciendo uso además de los operadores `$toInt`, `$cond` y `$eq`).

```javascript
db.surveys.aggregate([
  { 
    $match: {
      courseId: ObjectId("..."),
    },
  },
  { 
    $addFields: {
      score: { $toInt: "$score" },
      applicability: { $cond: [{ $eq: ["$applicability", "yes"] }, 1, 0] },
    },
  },
])
```

Lo siguiente que vamos a querer hacer es conseguir calcular cuántos usuarios valoraron por encima de 5 el curso de la encuesta, cuántos por debajo de 7, y cuántos por encima de 8. Esto nos servirá para saber el número de recomendadores, detractores y promotores de nuestro producto. Además, queremos saber qué porcentaje de los usuarios han considerado lo impartido en el curso como aplicable en alguna de las tareas que realicen, para lo cual debemos hacer un recuento de cuántos `"yes"` tenemos en el atributo `applicability` de las encuestas. Para todos estos cálculos vamos a tener que recurrir a la etapa `$facet`, que nos permitirá trabajar con *sub-pipelines* para que lo que salga de cada `$group` o `$match` no aplique a la siguinete etapa del pipeline y podamos seguir trabajando con todas las encuestas y no solo con aquellas que salgan de la ejecución de cada una de las etapas que vamos a necesitar para hacer estos cálculos. Por ejemplo, al utilizar en una etapa un `$match` para filtrar las encuestas valoradas por encima de 8, estaríamos dejando atrás el resto de encuestas y las siguientes etapas del pipeline tendrían como entrada solo las encuestas con una nota superior a 8. Sin embargo, no queremos esto, queremos hacer este cálculo sin afectar a los datos de entrada de las siguientes etapas del pipeline, así que nuestro aliado será `$facet`.

```javascript
db.surveys.aggregate([
  ...,
  {
    $facet: {
      recommenders: [{ $match: { score: { $gte: 6 } } }, { $count: "total" }],
      detractors: [{ $match: { score: { $lte: 6 } } }, { $count: "total" }],
      promotors: [{ $match: { score: { $gt: 8 } } }, { $count: "total" }],
      data: [
        {
          $group: {
            _id: "",
            surveys: { $sum: 1 },
            score: { $avg: "$score" },
            applicability: { $avg: "$applicability" },
          },
        },
      ],
      scoreDistribution: [{ $group: { _id: "$score", total: { $sum: 1 } } }],
    },
  },
])
```

Tras la ejecución de esta etapa tendremos nuevos atributos: `recommenders`, `detractors`, `promotors`, `data` y `scoreDistribution`, con la peculiaridad de que todos ellos serán arrays con un solo objeto en su interior. Para poder extraer el objeto y que dejen de ser arrays, tendremos que recurrir a la etapa `$unwind`, que generará un documento por cada elemento del array que estemos deconstruyendo, pero al ser todos en este caso de una sola dimensión, solo se generará un documento.

```javascript
db.surveys.aggregate([
  ...,
  { $unwind: { path: "$recommenders", preserveNullAndEmptyArrays: true } },
  { $unwind: { path: "$detractors", preserveNullAndEmptyArrays: true } },
  { $unwind: { path: "$promotors", preserveNullAndEmptyArrays: true } },
  { $unwind: { path: "$data", preserveNullAndEmptyArrays: true } },
  { $unwind: { path: "$scoreDistribution", preserveNullAndEmptyArrays: true } },
])
```

Al aplicar el `$unwind` ya tendremos los siguientes atributos: `recommenders.total`, `detractors.total`, `promotors.total`, `data.surveys`, `data.score`, `data.applicability` y `scoreDistribution`. Los tres primeros representan el número de recomendadores, detractores y promotores (para los cuales se ha usado la etapa `$count`), `data` contiene el número total de encuestas que estamos analizando, la puntuación media de dichas encuestas y el porcentaje (en tanto por 1) de encuestas que han devuelto un resultado positivo (`"yes"`) en cuanto a aplicabilidad (para lo cual se ha usado `$sum` y `$avg` en la etapa `$group`). Por último, también tendremos `scoreDistribution`, que contendrá un array con objetos que tendrán los atributos `_id` y `total`; `_id` representará una puntuación del 0 al 10 y `total` el número de encuestas que han sido puntuadas con dicho valor.

Ahora vamos a intentar *castear* estos datos, para cubrirnos las espaldas, de forma que si alguno de ellos tiene un valor nulo, lo tomaremos como un 0. Además, con `$map` haremos una transformación a los objetos del array `scoreDistribution` para que la puntuación pase de estar almacenada en la propiedad `_id` a estarlo en la propiedad `points`.

```javascript
db.surveys.aggregate([
  ...,
  {
    $addFields: {
      recommenders: { $ifNull: ["$recommenders.total", 0] },
      detractors: { $ifNull: ["$detractors.total", 0] },
      promotors: { $ifNull: ["$promotors.total", 0] },
      surveys: { $ifNull: ["$data.surveys", 0] },
      score: { $ifNull: ["$data.score", 0] },
      applicability: { $ifNull: ["$data.applicability", 0] },
      scoreDistribution: {
        $map: {
          input: "$scoreDistribution",
          as: "score",
          in: { points: "$$score._id", total: "$$score.total" },
        },
      },
    },
  },
])
```

Por (casi) último, procedemos a hacer cálculos de medias y porcentajes con los valores acumulados que tenemos. Utilizamos `$eq`, `$cond`, `$multiply`, `$divide`, `$round` y `$subtract` para acabar obteniendo la valoración media de las encuestas analizadas, el ratio de aplicación (o porcentaje de personas que consideran el curso aplicable) y de recomendación, y el ratio Net Promoter Score (NPS) para medir la satisfacción de los usuarios mediante la relación entre el porcentaje de promotores y el de detractores.

```javascript
db.surveys.aggregate([
  ...,
  {
    $addFields: {
      averageScore: { $round: ["$score", 2] },
      ratioApplication: {
        $round: [
          {
            $multiply: [100, "$applicability"],
          },
          2,
        ],
      },
      ratioRecommendation: {
        $cond: {
          if: { $eq: ["$surveys", 0] },
          then: 0,
          else: {
            $round: [
              {
                $multiply: [100, { $divide: ["$recommenders", "$surveys"] }],
              },
              2,
            ],
          },
        },
      },
      ratioNPS: {
        $cond: {
          if: { $eq: ["$surveys", 0] },
          then: 0,
          else: {
            $round: [
              {
                $multiply: [
                  100,
                  {
                    $divide: [{ $subtract: ["$promotors", "$detractors"] }, "$surveys"],
                  },
                ],
              },
              2,
            ],
          },
        },
      },
    },
  },
])
```

Por último, *proyectamos* con `$project` solo los atributos que queramos devolver como resultado de la consulta:

```javascript
db.surveys.aggregate([
  ...,
  {
    $project: {
      surveys: 1,
      scoreDistribution: 1,
      averageScore: 1,
      ratioApplication: 1,
      ratioRecommendation: 1,
      ratioNPS: 1,
    },
  },
])
```

<details>
<summary>Si quieres ver cómo quedaría el agregado final, lo tienes aquí 👀</summary>

```javascript
db.surveys.aggregate([
  { 
    $match: {
      courseId: ObjectId("..."),
    },
  },
  { 
    $addFields: {
      score: { $toInt: "$score" },
      applicability: { $cond: [{ $eq: ["$applicability", "yes"] }, 1, 0] },
    },
  },
  {
    $facet: {
      recommenders: [{ $match: { score: { $gte: 6 } } }, { $count: "total" }],
      detractors: [{ $match: { score: { $lte: 6 } } }, { $count: "total" }],
      promotors: [{ $match: { score: { $gt: 8 } } }, { $count: "total" }],
      data: [
        {
          $group: {
            _id: "",
            surveys: { $sum: 1 },
            score: { $avg: "$score" },
            applicability: { $avg: "$applicability" },
          },
        },
      ],
      scoreDistribution: [{ $group: { _id: "$score", total: { $sum: 1 } } }],
    },
  },
  { $unwind: { path: "$recommenders", preserveNullAndEmptyArrays: true } },
  { $unwind: { path: "$detractors", preserveNullAndEmptyArrays: true } },
  { $unwind: { path: "$promotors", preserveNullAndEmptyArrays: true } },
  { $unwind: { path: "$data", preserveNullAndEmptyArrays: true } },
  { $unwind: { path: "$scoreDistribution", preserveNullAndEmptyArrays: true } },
  {
    $addFields: {
      recommenders: { $ifNull: ["$recommenders.total", 0] },
      detractors: { $ifNull: ["$detractors.total", 0] },
      promotors: { $ifNull: ["$promotors.total", 0] },
      surveys: { $ifNull: ["$data.surveys", 0] },
      score: { $ifNull: ["$data.score", 0] },
      applicability: { $ifNull: ["$data.applicability", 0] },
      scoreDistribution: {
        $map: {
          input: "$scoreDistribution",
          as: "score",
          in: { points: "$$score._id", total: "$$score.total" },
        },
      },
    },
  },
  {
    $addFields: {
      averageScore: { $round: ["$score", 2] },
      ratioApplication: {
        $round: [
          {
            $multiply: [100, "$applicability"],
          },
          2,
        ],
      },
      ratioRecommendation: {
        $cond: {
          if: { $eq: ["$surveys", 0] },
          then: 0,
          else: {
            $round: [
              {
                $multiply: [100, { $divide: ["$recommenders", "$surveys"] }],
              },
              2,
            ],
          },
        },
      },
      ratioNPS: {
        $cond: {
          if: { $eq: ["$surveys", 0] },
          then: 0,
          else: {
            $round: [
              {
                $multiply: [
                  100,
                  {
                    $divide: [{ $subtract: ["$promotors", "$detractors"] }, "$surveys"],
                  },
                ],
              },
              2,
            ],
          },
        },
      },
    },
  },
  {
    $project: {
      surveys: 1,
      scoreDistribution: 1,
      averageScore: 1,
      ratioApplication: 1,
      ratioRecommendation: 1,
      ratioNPS: 1,
    },
  },
]);
```

</details>

Por rizar un poco más el rizo, vamos a analizar una situación en la que tuviéramos tanto cursos individuales como rutas de aprendizaje o *learning paths* compuestas de varios cursos. Para estas rutas, querríamos agrupar el resultado de las encuestas de cada uno de sus cursos para obtener la información propia de cada ruta. Además, solo querremos tener en cuenta las encuestas de rutas de aprendizaje completadas (con todos los cursos terminados).

Para este caso de uso, deberemos buscar las encuestas asociadas a cada matrícula de un usuario en un curso o ruta (en el primer caso, solo habrá una encuesta pero en el segundo habrá tantas como cursos conformen la ruta). En función de cuántos cursos tenga la ruta tendremos un array de encuestas de mayor o menor tamaño. Se quiere obtener una valoración asociada a la ruta en sí misma, de modo que calculamos la valoración media de los cursos de la ruta con `$reduce` y `$divide`. Usamos también `$reduce` para saber cuántos cursos de la ruta ha valorado el estudiante como aplicables y `$divide` para determinar si la ruta en su conjunto se puede considerar como aplicable o no. Para completar estos cálculos usamos también los operadores `$round`, `$sum`, `$toInt`, `$cond`, `$eq` y `$size`.

```javascript
db.enrollments.aggregate([
  {
    $match: {
      courseId: ObjectId("..."), // course or path identifier
      status: "completed",
    },
  },
  {
    $lookup: {
      from: "surveys",
      localField: "_id",
      foreignField: "enrollmentId",
      as: "surveys",
    },
  },
  {
    $match: { "surveys.0": { $exists: true } },
  },
  {
    $addFields: {
      score: {
        $round: [
          {
            $divide: [
              {
                $reduce: {
                  input: "$surveys.score",
                  initialValue: 0,
                  in: { $sum: ["$$value", { $toInt: "$$this" }] },
                },
              },
              { $size: "$surveys" },
            ],
          },
          0,
        ],
      },
      applicability: {
        $round: [
          {
            $divide: [
              {
                $reduce: {
                  input: "$surveys.applicability",
                  initialValue: 0,
                  in: {
                    $sum: ["$$value", { $cond: [{ $eq: ["$$this", "yes"] }, 1, 0] }],
                  },
                },
              },
              { $size: "$surveys" },
            ],
          },
          0,
        ],
      },
    },
  },
  {
    $facet: {
      data: [
        {
          $group: {
            _id: "",
            paths: { $sum: 1 }, // number of learning paths with completed surveys
            surveys: { $sum: { $size: "$surveys" } }, // number of completed surveys (counting N surveys by learning path)
            score: { $avg: "$score" },
            applicability: { $avg: "$applicability" },
          },
        },
      ],
      ...
    },
  },
  ...
]);
```

<details>
<summary>Si quieres ver cómo quedaría el agregado final, lo tienes aquí 👀</summary>

```javascript
db.enrollments.aggregate([
  {
    $match: {
      courseId: ObjectId("..."), // course or path identifier
      status: "completed",
    },
  },
  {
    $lookup: {
      from: "surveys",
      localField: "_id",
      foreignField: "enrollmentId",
      as: "surveys",
    },
  },
  {
    $match: { "surveys.0": { $exists: true } },
  },
  {
    $addFields: {
      score: {
        $round: [
          {
            $divide: [
              {
                $reduce: {
                  input: "$surveys.score",
                  initialValue: 0,
                  in: { $sum: ["$$value", { $toInt: "$$this" }] },
                },
              },
              { $size: "$surveys" },
            ],
          },
          0,
        ],
      },
      applicability: {
        $round: [
          {
            $divide: [
              {
                $reduce: {
                  input: "$surveys.applicability",
                  initialValue: 0,
                  in: {
                    $sum: ["$$value", { $cond: [{ $eq: ["$$this", "yes"] }, 1, 0] }],
                  },
                },
              },
              { $size: "$surveys" },
            ],
          },
          0,
        ],
      },
    },
  },
  {
    $facet: {
      recommenders: [{ $match: { score: { $gte: 6 } } }, { $count: "total" }],
      detractors: [{ $match: { score: { $lte: 6 } } }, { $count: "total" }],
      promotors: [{ $match: { score: { $gte: 9 } } }, { $count: "total" }],
      data: [
        {
          $group: {
            _id: "",
            paths: { $sum: 1 }, // number of learning paths with completed surveys
            surveys: { $sum: { $size: "$surveys" } }, // number of completed surveys (counting N surveys by learning path)
            score: { $svg: "$score" },
            applicability: { $avg: "$applicability" },
          },
        },
      ],
      scoreDistribution: [{ $group: { _id: "$score", total: { $sum: 1 } } }],
    },
  },
  { $unwind: { path: "$recommenders", preserveNullAndEmptyArrays: true } },
  { $unwind: { path: "$detractors", preserveNullAndEmptyArrays: true } },
  { $unwind: { path: "$promotors", preserveNullAndEmptyArrays: true } },
  { $unwind: { path: "$data", preserveNullAndEmptyArrays: true } },
  { $unwind: { path: "$scoreDistribution", preserveNullAndEmptyArrays: true } },
  {
    $addFields: {
      recommenders: { $ifNull: ["$recommenders.total", 0] },
      detractors: { $ifNull: ["$detractors.total", 0] },
      promotors: { $ifNull: ["$promotors.total", 0] },
      surveys: { $ifNull: ["$data.surveys", 0] },
      paths: { $ifNull: ["$data.paths", 0] },
      score: { $ifNull: ["$data.score", 0] },
      applicability: { $ifNull: ["$data.applicability", 0] },
      scoreDistribution: {
        $map: {
          input: "$scoreDistribution",
          as: "score",
          in: { points: "$$score._id", total: "$$score.total" },
        },
      },
    },
  },
  {
    $addFields: {
      averageScore: { $round: ["$score", 2] },
      ratioApplication: {
        $round: [
          {
            $multiply: [100, "$applicability"],
          },
          2
        ],
      },
      ratioRecommendation: {
        $cond: {
          if: { $eq: ["$paths", 0] },
          then: 0,
          else: {
            $round: [
              {
                $multiply: [100, { $divide: ["$recommenders", "$paths"] }],
              },
              2,
            ],
          },
        },
      },
      ratioNPS: {
        $cond: {
          if: { $eq: ["$paths", 0] },
          then: 0,
          else: {
            $round: [
              {
                $multiply: [
                  100,
                  {
                    $divide: [{ $subtract: ["$promotors", "$detractors"] }, "$paths"],
                  },
                ],
              },
              2,
            ],
          },
        },
      },
    },
  },
  {
    $project: {
      paths: 1,
      surveys: 1,
      scoreDistribution: 1,
      averageScore: 1,
      ratioApplication: 1,
      ratioRecommendation: 1,
      ratioNPS: 1,
    },
  },
]);
```

</details>

<details>
<summary>También dejo por aquí el agregado que habría que utilizar para obtener los datos de todos los cursos o rutas y no solo de un curso o ruta en concreto 🤓</summary>

```javascript
db.enrollments.aggregate([
  {
    $match: {
      status: "completed",
    },
  },
  {
    $lookup: {
      from: "surveys",
      localField: "_id",
      foreignField: "enrollmentId",
      as: "surveys",
    },
  },
  {
    $match: { "surveys.0": { $exists: true } },
  },
  {
    $addFields: {
      score: {
        $round: [
          {
            $divide: [
              {
                $reduce: {
                  input: "$surveys.score",
                  initialValue: 0,
                  in: { $sum: ["$$value", { $toInt: "$$this" }] },
                },
              },
              { $size: "$surveys" },
            ],
          },
          0,
        ],
      },
      applicability: {
        $round: [
          {
            $divide: [
              {
                $reduce: {
                  input: "$surveys.applicability",
                  initialValue: 0,
                  in: {
                    $sum: ["$$value", { $cond: [{ $eq: ["$$this", "yes"] }, 1, 0] }],
                  },
                },
              },
              { $size: "$surveys" },
            ],
          },
          0,
        ],
      },
    },
  },
  {
    $group: {
      _id: { courseId: "$courseId", score: "$score" },
      count: { $sum: 1 },
      surveys: { $sum: { $size: "$surveys" } },
      applicability: { $sum: "$applicability" },
    },
  },
  {
    $group: {
      _id: "$_id.courseId",
      recommenders: { $sum: { $cond: [{ $gte: ["_id.score", 6] }, "$count", 0] } },
      detractors: { $sum: { $cond: [{ $lte: ["_id.score", 6] }, "$count", 0] } },
      promotors: { $sum: { $cond: [{ $gte: ["_id.score", 9] }, "$count", 0] } },
      paths: { $sum: "$count" }, // number of enrollments with completed surveys for each course/path
      surveys: { $sum: "$surveys" }, // number of completed surveys (counting N surveys by learning path) for each course/path
      score: { $sum: { $multiply: ["$_id.score", "$count"] } },
      applicability: { $sum: "$applicability" },
      scoreDistribution: {
        $push: {
          points: "$_id.score",
          total: "$count",
        },
      },
    },
  },
  {
    $addFields: {
      paths: { $ifNull: ["$paths", 0] },
      surveys: { $ifNull: ["$surveys", 0] },
      score: { $ifNull: ["$score", 0] },
      applicability: { $ifNull: ["$applicability", 0] },
    },
  },
  {
    $addFields: {
      averageScore: {
        $cond: {
          if: { $eq: ["$paths", 0] },
          then: 0,
          else: {
            $round: [{ $divide: ["$score", "$paths"] }, 2],
          },
        },
      },
      ratioApplication: {
        $cond: {
          if: { $eq: ["$paths", 0] },
          then: 0,
          else: {
            $round: [
              {
                $multiply: [100, { $divide: ["$applicability", "$paths"] }],
              },
              2,
            ],
          },
        },
      },
      ratioRecommendation: {
        $cond: {
          if: { $eq: ["$paths", 0] },
          then: 0,
          else: {
            $round: [
              {
                $multiply: [100, { $divide: ["$recommenders", "$paths"] }],
              },
              2,
            ],
          },
        },
      },
      ratioNPS: {
        $cond: {
          if: { $eq: ["$paths", 0] },
          then: 0,
          else: {
            $round: [
              {
                $multiply: [
                  100,
                  {
                    $divide: [{ $subtract: ["$promotors", "$detractors"] }, "$paths"],
                  },
                ],
              },
              2,
            ],
          },
        },
      },
    },
  },
  {
    $project: {
      paths: 1,
      surveys: 1,
      scoreDistribution: 1,
      averageScore: 1,
      ratioApplication: 1,
      ratioRecommendation: 1,
      ratioNPS: 1,
    },
  },
]);
```

</details>

> “Users love MongoDB because it offers the fastest time to value compared to any other DBMS technology”
>
> ###### Eliot Horowitz, Founder and CTO of MongoDB Inc.
