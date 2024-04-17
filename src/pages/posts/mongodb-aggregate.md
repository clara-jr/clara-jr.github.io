---
layout: ../../layouts/PostLayout.astro
title: 'Agregados con MongoDB y su equivalencia en SQL 👩🏻‍💻'
pubDate: 2024/04/17
description: 'Procesado de documentos y análisis de datos usando agregados de MongoDB y consultas SQL'
author: 'Clara Jiménez'
image:
    url: '' 
    alt: ''
tags: ["mongodb", "sql"]
draft: false
---

Cuando gestionamos y manipulamos grandes cantidades de datos en MongoDB, es muy probable que acabemos necesitando recurrir al uso de agregados, y esto lo haremos a través de *aggregation pipelines* [[1]](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/) [[2]](https://www.mongodb.com/basics/aggregation-pipeline). Estos agregados los ejecutaremos haciendo uso del método `db.collection.aggregate()`, que nos permitirá hacer operaciones mucho más flexibles y robustas que un simple `find()`. Haremos cálculos basados en agrupaciones de datos, recuperaremos información de diversas colecciones, proyectaremos sólo los atributos relevantes, etc. En este artículo veremos un caso de uso en el que utilizar agregados de MongoDB y, además, podremos ver las diferencias entre las consultas hechas con agregados de MongoDB y las consultas equivalentes que se realizarían con SQL en caso de utilizar una base de datos relacional.

<!-- markdownlint-disable MD026 -->
## ¡Vamos a por el caso de uso!

Vamos a utilizar varios operadores y etapas del *aggregation pipeline* para **analizar datos de encuestas** de satisfacción de un servicio o producto. Imaginemos, por ejemplo, que el producto o servicio en cuestión es un curso de una plataforma de e-learning. Tenemos multitud de usuarios registrados en diferentes cursos y, cuando los completan, responden una encuesta de satisfacción para valorar lo aprendido en el curso. Nuestra intención es analizar los datos de estas encuestas para conocer, por ejemplo, cuál es la valoración media de nuestros cursos, qué aplicabilidad tienen y con qué probabilidad los usuarios los recomendarían.

Lo primero que haremos será recuperar todas las encuestas que vayamos a querer analizar, por ejemplo, las de un determinado curso; para aplicar este tipo de filtros recurrimos a la etapa [`$match`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/match/).

```javascript
db.surveys.aggregate([
  { 
    $match: {
      courseId: ObjectId("..."),
    },
  },
])
```

Cada encuesta tendrá un atributo `score` y un atributo `applicability`, indicando la puntuación que se le ha dado a un determinado curso (del 0 al 10) y si se ha considerado aplicable (`"yes"`) o no (`"no"`).

Sabiendo esto, lo siguiente que vamos a querer hacer es calcular la puntuación media que se le ha dado a ese curso (para lo cual usamos [`$avg`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/avg/) y [`$toInt`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toInt/)), la media de usuarios que recomendaron el curso (valorándolo por encima de 5), y la diferencia entre la media de usuarios que lo valoraron por encima de 8 y los que lo hicieron por debajo de 7  (haciendo uso además de los operadores [`$cond`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/cond/), [`$eq`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/eq/), [`$gt`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/gt/), [`$lt`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lt/) y [`$subtract`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/subtract/)). Esto último representará el [ratio Net Promoter Score (NPS)](https://es.wikipedia.org/wiki/Net_Promoter_Score), que sirve para medir la satisfacción de los usuarios mediante la relación entre el porcentaje de promotores y el de detractores. Además, queremos saber qué porcentaje de los usuarios han considerado lo impartido en el curso como aplicable en alguna de las tareas que realicen, para lo cual debemos calcular la media de cuántos `"yes"` tenemos en el atributo `applicability` de las encuestas. Para esto, transformaremos a valor numérico (0 o 1) el atributo que indica si el usuario consideró o no aplicable el curso para su futuro profesional, y calcularemos el valor medio con [`$avg`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/avg/). Por último, también querremos calcular la función de distribución de las puntuaciones que se le han dado al curso.

Para todos estos cálculos vamos a tener que recurrir a la etapa [`$facet`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/facet/), que nos permitirá trabajar con *sub-pipelines* para que lo que salga de cada [`$group`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/) o [`$match`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/match/) no aplique a la siguiente etapa del pipeline y podamos seguir trabajando con todas las encuestas y no sólo con aquellas que salgan de la ejecución de cada una de las etapas que vamos a necesitar para hacer estos cálculos. Por ejemplo, si utilizásemos en una etapa un [`$match`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/match/) para filtrar las encuestas valoradas por encima de 8, estaríamos dejando atrás el resto de encuestas, y las siguientes etapas del pipeline tendrían como entrada sólo las encuestas con una nota superior a 8. Sin embargo, no queremos esto, queremos hacer los cálculos con [`$group`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/) sin afectar a los datos de entrada de las siguientes etapas del pipeline, así que nuestro aliado será [`$facet`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/facet/).

```javascript
db.surveys.aggregate([
  ...,
  {
    $facet: {
      data: [
        {
          $group: {
            _id: "",
            surveysCount: { $sum: 1 },
            averageScore: { $avg: { $toInt: "$score" } },
            ratioApplicability: {
              $avg: { $cond: { if: { $eq: ["$applicability", "yes"] }, then: 1, else: 0 } },
            },
            ratioRecommendation: {
              $avg: { $cond: { if: { $gt: [{ $toInt: "$score" }, 5] }, then: 1, else: 0 } },
            },
            ratioNPS: {
              $avg: {
                $subtract: [
                  {
                    $avg: { $cond: { if: { $gt: [{ $toInt: "$score" }, 8] }, then: 1, else: 0 } },
                  },
                  {
                    $avg: { $cond: { if: { $lt: [{ $toInt: "$score" }, 7] }, then: 1, else: 0 } },
                  },
                ],
              },
            },
          },
        },
      ],
      scoreDistribution: [{ $group: { _id: "$score", total: { $sum: 1 } } }],
    },
  },
])
```

Tras la ejecución de esta etapa tendremos nuevos atributos: `data` y `scoreDistribution`, con la peculiaridad de que `data` será un array con un solo objeto en su interior. Para poder extraer el objeto y que deje de ser un array, tendremos que recurrir a la etapa [`$unwind`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/), que generará un documento por cada elemento del array que estemos deconstruyendo, pero al ser en este caso un array de una sola dimensión, sólo se generará un documento. Por otro lado, `scoreDistribution` contendrá un array con objetos que tendrán los atributos `_id` y `total`; `_id` representará una puntuación del 0 al 10 y `total` el número de encuestas que han sido puntuadas con dicho valor.

```javascript
db.surveys.aggregate([
  ...,
  { $unwind: { path: "$data", preserveNullAndEmptyArrays: true } },
])
```

Al aplicar el [`$unwind`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/) ya tendremos los siguientes atributos: `data.surveysCount`, `data.averageScore`, `data.ratioApplicability`, `data.ratioRecommendation` y `data.ratioNPS`. El primero contiene el número total de encuestas que estamos analizando, el siguiente representa la puntuación media de dichas encuestas, los ratios representan la media de encuestas que han devuelto un resultado positivo (`"yes"`) en cuanto a aplicabilidad, la media de usuarios que han recomendado el curso y el ratio NPS.

Ahora vamos a intentar *castear* estos datos con [`$ifNull`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/ifNull/), para cubrirnos las espaldas, de forma que si alguno de ellos tiene un valor nulo (por ejemplo, porque no existan encuestas para el curso pedido), lo tomaremos como un 0. Además, con [`$map`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/map/) haremos una transformación a los objetos del array `scoreDistribution` para que la puntuación pase de estar almacenada en la propiedad `_id` a estarlo en la propiedad `points`. También vamos a utilizar [`$multiply`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/multiply/) y [`$round`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/round/) para pasar de tanto por uno a tanto por ciento y para redondear todas las métricas a 2 decimales. Para añadir estos nuevos atributos al resultado de nuestro agregado usaremos la etapa [`$addFields`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/addFields/).

```javascript
db.surveys.aggregate([
  ...,
  {
    $addFields: {
      surveysCount: { $ifNull: ["$data.surveysCount", 0] },
      averageScore: { $round: [{ $ifNull: ["$data.averageScore", 0] }, 2] },
      ratioApplicability: {
        $round: [{ $multiply: [100, { $ifNull: ["$data.ratioApplicability", 0] }] }, 2],
      },
      ratioRecommendation: {
        $round: [{ $multiply: [100, { $ifNull: ["$data.ratioRecommendation", 0] }] }, 2],
      },
      ratioNPS: { $round: [{ $multiply: [100, { $ifNull: ["$data.ratioNPS", 0] }] }, 2] },
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

Por último, *proyectamos* con [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/) sólo los atributos que queramos devolver como resultado de la consulta:

```javascript
db.surveys.aggregate([
  ...,
  {
    $project: {
      surveysCount: 1,
      averageScore: 1,
      ratioApplicability: 1,
      ratioRecommendation: 1,
      ratioNPS: 1,
      scoreDistribution: 1,
    },
  },
])
```

<details>
<summary>Si quieres ver cómo quedaría el agregado final, lo tienes aquí 👇🏻</summary>

<div>

```javascript
db.surveys.aggregate([
  {
    $match: { courseId: ObjectId("...") },
  },
  {
    $facet: {
      data: [
        {
          $group: {
            _id: "",
            surveysCount: { $sum: 1 },
            averageScore: { $avg: { $toInt: "$score" } },
            ratioApplicability: {
              $avg: { $cond: { if: { $eq: ["$applicability", "yes"] }, then: 1, else: 0 } },
            },
            ratioRecommendation: {
              $avg: { $cond: { if: { $gt: [{ $toInt: "$score" }, 5] }, then: 1, else: 0 } },
            },
            ratioNPS: {
              $avg: {
                $subtract: [
                  {
                    $avg: { $cond: { if: { $gt: [{ $toInt: "$score" }, 8] }, then: 1, else: 0 } },
                  },
                  {
                    $avg: { $cond: { if: { $lt: [{ $toInt: "$score" }, 7] }, then: 1, else: 0 } },
                  },
                ],
              },
            },
          },
        },
      ],
      scoreDistribution: [{ $group: { _id: "$score", total: { $sum: 1 } } }],
    },
  },
  { $unwind: { path: "$data", preserveNullAndEmptyArrays: true } },
  {
    $addFields: {
      surveysCount: { $ifNull: ["$data.surveysCount", 0] },
      averageScore: { $round: [{ $ifNull: ["$data.averageScore", 0] }, 2] },
      ratioApplicability: {
        $round: [{ $multiply: [100, { $ifNull: ["$data.ratioApplicability", 0] }] }, 2],
      },
      ratioRecommendation: {
        $round: [{ $multiply: [100, { $ifNull: ["$data.ratioRecommendation", 0] }] }, 2],
      },
      ratioNPS: { $round: [{ $multiply: [100, { $ifNull: ["$data.ratioNPS", 0] }] }, 2] },
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
    $project: {
      surveysCount: 1,
      averageScore: 1,
      ratioApplicability: 1,
      ratioRecommendation: 1,
      ratioNPS: 1,
      scoreDistribution: 1,
    },
  },
]);
```

</div>

</details>

<details>
<summary>¿Tienes curiosidad por saber cómo se realizaría esta consulta con SQL? 👀</summary>

<div>

Si utilizáramos una base de datos relacional con una tabla llamada `surveys`, tendríamos la siguiente consulta:

```sql
SELECT
  COUNT(*) AS surveysCount,
  ROUND(AVG(CAST(score AS INT)), 2) AS averageScore,
  ROUND(100 * AVG(CASE WHEN applicability = "yes" THEN 1 ELSE 0 END), 2) AS ratioApplicability,
  ROUND(100 * AVG(CASE WHEN CAST(score AS INT) > 5 THEN 1 ELSE 0 END), 2) AS ratioRecommendation,
  ROUND(100 * ((AVG(CASE WHEN CAST(score AS INT) > 8 THEN 1 ELSE 0 END) - AVG(CASE WHEN CAST(score AS INT) < 7 THEN 1 ELSE 0 END))), 2) AS ratioNPS,
  COUNT(CASE WHEN CAST(score AS INT) = 0 THEN 1 END) AS score_0,
  COUNT(CASE WHEN CAST(score AS INT) = 1 THEN 1 END) AS score_1,
  COUNT(CASE WHEN CAST(score AS INT) = 2 THEN 1 END) AS score_2,
  COUNT(CASE WHEN CAST(score AS INT) = 3 THEN 1 END) AS score_3,
  COUNT(CASE WHEN CAST(score AS INT) = 4 THEN 1 END) AS score_4,
  COUNT(CASE WHEN CAST(score AS INT) = 5 THEN 1 END) AS score_5,
  COUNT(CASE WHEN CAST(score AS INT) = 6 THEN 1 END) AS score_6,
  COUNT(CASE WHEN CAST(score AS INT) = 7 THEN 1 END) AS score_7,
  COUNT(CASE WHEN CAST(score AS INT) = 8 THEN 1 END) AS score_8,
  COUNT(CASE WHEN CAST(score AS INT) = 9 THEN 1 END) AS score_9,
  COUNT(CASE WHEN CAST(score AS INT) = 10 THEN 1 END) AS score_10
FROM
  surveys
WHERE
  courseId = "...";
GROUP BY
  courseId
```

MySQL admite la sintaxis `IF` (`IF(condition, true_value, false_value)`), pero otros sistemas de bases de datos relacionales, por ejemplo PostgreSQL, sólo admiten `CASE` (`CASE WHEN condition THEN true_value ELSE false_value END`).
</div>
</details>

Por rizar un poco más el rizo, vamos a analizar una situación en la que los cursos pudieran funcionar como rutas de aprendizaje o *learning paths* y estuviesen compuestos por varios temas o lecciones. En este caso de uso, los usuarios podrían contestar a una encuesta por cada lección del curso. De esta manera, para estos cursos, querríamos agrupar el resultado de las encuestas de cada una de sus lecciones para obtener la información propia de cada curso. Además, sólo querremos tener en cuenta las encuestas de cursos completados (con todas las lecciones terminadas).

Para este caso de uso, deberemos buscar las encuestas asociadas a cada matrícula de un usuario en un curso. Para recuperar las encuestas de una matrícula hay que recurrir a la etapa [`$lookup`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/), y además podemos utilizar el operador [`$exists`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/exists/) para tener en cuenta sólo las matrículas con encuestas. En función de cuántos temas tenga el curso tendremos un array de encuestas de mayor o menor tamaño. Se quiere obtener una valoración asociada al curso en sí mismo, de modo que calculamos la valoración media de las lecciones del curso con [`$reduce`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/reduce/) y [`$divide`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/divide/). Usamos también [`$reduce`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/reduce/) para saber cuántos temas del curso ha valorado el estudiante como aplicables y [`$divide`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/divide/) para determinar si el curso en su conjunto se puede considerar como aplicable o no. Para completar estos cálculos usamos también los operadores [`$round`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/round/), [`$sum`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sum/), [`$toInt`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toInt/), [`$cond`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/cond/), [`$eq`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/eq/) y [`$size`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/size/).

```javascript
db.enrollments.aggregate([
  {
    $match: {
      courseId: ObjectId("..."),
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
            enrollmentsCount: { $sum: 1 }, // number of completed enrollments
            surveysCount: { $sum: { $size: "$surveys" } }, // number of completed surveys (counting N surveys by enrollment)
            averageScore: { $avg: "$score" },
            ratioApplicability: { $avg: "$applicability" },
            ratioRecommendation: {
              $avg: { $cond: { if: { $gt: [{ $toInt: "$score" }, 5] }, then: 1, else: 0 } },
            },
            ratioNPS: {
              $avg: {
                $subtract: [
                  {
                    $avg: { $cond: { if: { $gt: [{ $toInt: "$score" }, 8] }, then: 1, else: 0 } },
                  },
                  {
                    $avg: { $cond: { if: { $lt: [{ $toInt: "$score" }, 7] }, then: 1, else: 0 } },
                  },
                ],
              },
            },
          },
        },
      ],
      scoreDistribution: [{ $group: { _id: "$score", total: { $sum: 1 } } }],
    },
  },
  { $unwind: { path: "$data", preserveNullAndEmptyArrays: true } },
  {
    $addFields: {
      surveysCount: { $ifNull: ["$data.surveysCount", 0] },
      enrollmentsCount: { $ifNull: ["$data.enrollmentsCount", 0] },
      averageScore: { $round: [{ $ifNull: ["$data.averageScore", 0] }, 2] },
      ratioApplicability: {
        $round: [{ $multiply: [100, { $ifNull: ["$data.ratioApplicability", 0] }] }, 2],
      },
      ratioRecommendation: {
        $round: [{ $multiply: [100, { $ifNull: ["$data.ratioRecommendation", 0] }] }, 2],
      },
      ratioNPS: { $round: [{ $multiply: [100, { $ifNull: ["$data.ratioNPS", 0] }] }, 2] },
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
    $project: {
      enrollmentsCount: 1,
      surveysCount: 1,
      averageScore: 1,
      ratioApplicability: 1,
      ratioRecommendation: 1,
      ratioNPS: 1,
      scoreDistribution: 1,
    },
  },
]);
```

<details>
<summary>¿Tienes curiosidad por saber cómo se realizaría esta consulta con SQL? 👀</summary>

<div>

```sql
WITH enrollmentsSurveys AS (
  SELECT
    e.id,
    e.courseId,
    COUNT(*) AS surveysCount,
    ROUND(AVG(CASE WHEN s.applicability = "yes" THEN 1.0 ELSE 0.0 END)) AS applicability,
    ROUND(AVG(CAST(s.score AS INT))) AS score
  FROM
    enrollments e
  JOIN
    surveys s ON e.id = s.enrollmentId
  WHERE
    e.courseId = "..." AND e.status = "completed"
  GROUP BY
    e.id
)

SELECT
  SUM(e.surveysCount) AS surveysCount,
  COUNT(DISTINCT e.id) AS enrollmentsCount,
  ROUND(AVG(e.score), 2) AS averageScore,
  ROUND(100 * AVG(e.applicability), 2) AS ratioApplicability,
  ROUND(100 * SUM(CASE WHEN CAST(e.score AS INT) > 5 THEN 1 ELSE 0 END) / COUNT(DISTINCT e.id), 2) AS ratioRecommendation,
  ROUND(100 * (SUM(CASE WHEN CAST(e.score AS INT) > 8 THEN 1 ELSE 0 END) - SUM(CASE WHEN CAST(e.score AS INT) < 7 THEN 1 ELSE 0 END)), 2) / COUNT(DISTINCT e.id) AS ratioNPS,
  COUNT(CASE WHEN CAST(e.score AS INT) = 0 THEN 1 END) AS score_0,
  COUNT(CASE WHEN CAST(e.score AS INT) = 1 THEN 1 END) AS score_1,
  COUNT(CASE WHEN CAST(e.score AS INT) = 2 THEN 1 END) AS score_2,
  COUNT(CASE WHEN CAST(e.score AS INT) = 3 THEN 1 END) AS score_3,
  COUNT(CASE WHEN CAST(e.score AS INT) = 4 THEN 1 END) AS score_4,
  COUNT(CASE WHEN CAST(e.score AS INT) = 5 THEN 1 END) AS score_5,
  COUNT(CASE WHEN CAST(e.score AS INT) = 6 THEN 1 END) AS score_6,
  COUNT(CASE WHEN CAST(e.score AS INT) = 7 THEN 1 END) AS score_7,
  COUNT(CASE WHEN CAST(e.score AS INT) = 8 THEN 1 END) AS score_8,
  COUNT(CASE WHEN CAST(e.score AS INT) = 9 THEN 1 END) AS score_9,
  COUNT(CASE WHEN CAST(e.score AS INT) = 10 THEN 1 END) AS score_10
FROM
  enrollmentsSurveys e
GROUP BY
  e.courseId;
```

Hemos tenido que recurrir al uso de una CTE (Common Table Expression) llamada `enrollmentsSurveys` para calcular la valoración y la aplicabilidad que se le ha dado al curso en cada matrícula (como la media de lo que se ha respondido para cada lección del curso). Luego, en la consulta principal, se utiliza ese dato para calcular las métricas a nivel de curso.

En `enrollmentsSurveys` buscamos las matrículas del curso en cuestión que estén completadas y tengan encuestas rellenadas. Para estas matrículas se calcula la puntuación media que se le ha dado al curso y si se ha considerado o no aplicable (1 o 0 respectivamente). Así, en nuestra consulta principal recuperaremos aquellas encuestas cuya matrícula esté en `enrollmentsSurveys`, teniendo por tanto en cuenta sólo las encuestas de matrículas completadas del curso en cuestión.

</div>
</details>

<details>
<summary>También dejo por aquí el agregado que habría que utilizar para obtener los datos de todos los cursos y no sólo de un curso en concreto, y la versión de dicha consulta en SQL 🤓</summary>
<div>

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
      scoreCount: { $sum: 1 },
      surveysCount: { $sum: { $size: "$surveys" } },
      ratioApplicability: { $sum: "$applicability" },
    },
  },
  {
    $group: {
      _id: "$_id.courseId",
      enrollmentsCount: { $sum: "$scoreCount" }, // number of completed enrollments
      surveysCount: { $sum: "$surveysCount" }, // number of completed surveys (counting N surveys by enrollment)
      averageScore: { $sum: { $multiply: ["$_id.score", "$scoreCount"] } },
      ratioApplicability: { $sum: "$ratioApplicability" },
      recommenders: { $sum: { $cond: [{ $gt: ["$_id.score", 5] }, "$scoreCount", 0] } },
      detractors: { $sum: { $cond: [{ $lt: ["$_id.score", 7] }, "$scoreCount", 0] } },
      promotors: { $sum: { $cond: [{ $gt: ["$_id.score", 8] }, "$scoreCount", 0] } },
      scoreDistribution: {
        $push: {
          points: "$_id.score",
          total: "$scoreCount",
        },
      },
    },
  },
  {
    $addFields: {
      enrollmentsCount: { $ifNull: ["$enrollmentsCount", 0] },
      surveysCount: { $ifNull: ["$surveysCount", 0] },
    }
  },
  {
    $addFields: {
      averageScore: {
        $cond: {
          if: { $eq: ["$enrollmentsCount", 0] },
          then: 0,
          else: {
            $round: [{ $divide: ["$averageScore", "$enrollmentsCount"] }, 2],
          },
        },
      },
      ratioApplicability: {
        $cond: {
          if: { $eq: ["$enrollmentsCount", 0] },
          then: 0,
          else: {
            $round: [
              {
                $multiply: [100, { $divide: ["$ratioApplicability", "$enrollmentsCount"] }],
              },
              2,
            ],
          },
        },
      },
      ratioRecommendation: {
        $cond: {
          if: { $eq: ["$enrollmentsCount", 0] },
          then: 0,
          else: {
            $round: [
              {
                $multiply: [100, { $divide: ["$recommenders", "$enrollmentsCount"] }],
              },
              2,
            ],
          },
        },
      },
      ratioNPS: {
        $cond: {
          if: { $eq: ["$enrollmentsCount", 0] },
          then: 0,
          else: {
            $round: [
              {
                $multiply: [100, { $divide: [{ $subtract: ["$promotors", "$detractors"] }, "$enrollmentsCount"] }],
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
      enrollmentsCount: 1,
      surveysCount: 1,
      scoreDistribution: 1,
      averageScore: 1,
      ratioApplicability: 1,
      ratioRecommendation: 1,
      ratioNPS: 1,
    },
  },
]);
```

```sql
WITH enrollmentsSurveys AS (
  SELECT
    e.id,
    e.courseId,
    COUNT(*) AS surveysCount,
    ROUND(AVG(CASE WHEN s.applicability = "yes" THEN 1.0 ELSE 0.0 END)) AS applicability,
    ROUND(AVG(CAST(s.score AS INT))) AS score
  FROM
    enrollments e
  JOIN
    surveys s ON e.id = s.enrollmentId
  WHERE
    e.status = "completed"
  GROUP BY
    e.id
)

SELECT
  SUM(e.surveysCount) AS surveysCount,
  COUNT(DISTINCT e.id) AS enrollmentsCount,
  ROUND(AVG(e.score), 2) AS averageScore,
  ROUND(100 * AVG(e.applicability), 2) AS ratioApplicability,
  ROUND(100 * SUM(CASE WHEN CAST(e.score AS INT) > 5 THEN 1 ELSE 0 END) / COUNT(DISTINCT e.id), 2) AS ratioRecommendation,
  ROUND(100 * (SUM(CASE WHEN CAST(e.score AS INT) > 8 THEN 1 ELSE 0 END) - SUM(CASE WHEN CAST(e.score AS INT) < 7 THEN 1 ELSE 0 END)), 2) / COUNT(DISTINCT e.id) AS ratioNPS,
  COUNT(CASE WHEN CAST(e.score AS INT) = 0 THEN 1 END) AS score_0,
  COUNT(CASE WHEN CAST(e.score AS INT) = 1 THEN 1 END) AS score_1,
  COUNT(CASE WHEN CAST(e.score AS INT) = 2 THEN 1 END) AS score_2,
  COUNT(CASE WHEN CAST(e.score AS INT) = 3 THEN 1 END) AS score_3,
  COUNT(CASE WHEN CAST(e.score AS INT) = 4 THEN 1 END) AS score_4,
  COUNT(CASE WHEN CAST(e.score AS INT) = 5 THEN 1 END) AS score_5,
  COUNT(CASE WHEN CAST(e.score AS INT) = 6 THEN 1 END) AS score_6,
  COUNT(CASE WHEN CAST(e.score AS INT) = 7 THEN 1 END) AS score_7,
  COUNT(CASE WHEN CAST(e.score AS INT) = 8 THEN 1 END) AS score_8,
  COUNT(CASE WHEN CAST(e.score AS INT) = 9 THEN 1 END) AS score_9,
  COUNT(CASE WHEN CAST(e.score AS INT) = 10 THEN 1 END) AS score_10
FROM
  enrollmentsSurveys e
GROUP BY
  e.courseId;
```

</div>
</details>

> “Users love MongoDB because it offers the fastest time to value compared to any other DBMS technology”
>
> ###### Eliot Horowitz, Founder and CTO of MongoDB Inc
