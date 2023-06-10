---
layout: ../../layouts/PostLayout.astro
title: 'Motor de búsqueda con MongoDB Atlas Search 👩🏻‍💻'
pubDate: 2023/06/10
description: 'Una solución rápida y sencilla de búsqueda de texto completo'
author: 'Clara Jiménez'
image:
    url: '/images/posts/mongo-atlas-search.svg' 
    alt: 'MongoDB Atlas Search'
tags: ["mongodb"]
---
MongoDB Atlas Search permite mantener sincronizada la base de datos con el buscador de texto gracias a tener una funcionalidad de búsqueda totalmente integrada con la base de datos en una única plataforma totalmente administrada. Esto simplifica las consultas de búsqueda y reduce el tiempo de desarrollo.

![MongoDB Atlas Search](/images/posts/mongo-atlas-search.svg)

Normalmente, en un buscador los usuarios solemos cometer errores tipográficos u ortográficos. A su vez, también es probable que incluyamos sinónimos de lo que realmente queremos encontrar. Para estos casos, MongoDB Atlas Search proporciona la posibilidad de realizar búsquedas más o menos difusas (*fuzzy searching*) así como definir términos de búsqueda similares para ayudarnos a encontrar el contenido que buscamos.

## Search indexes

Tenemos que crear un índice de búsqueda (*search index*) para identificar los campos con los que querremos ser capaces de hacer búsquedas.

Por ejemplo, con el siguiente índice estaríamos indicando que podremos buscar por todos los atributos de todos los documentos (`"dynamic": true`) de la colección, porque estaríamos indexando todos los atributos automáticamente:

```json
{
  "mappings": {
    "dynamic": true
  }
}
```

Para reducir el tamaño de este índice es preferible especificar los atributos que queramos indexar. Por ejemplo, el índice para poder buscar elementos de una colección a través de su título o descripción podría ser el siguiente:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "title": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "description": {
        "type": "string",
        "analyzer": "lucene.standard"
      }
    }
  }
}
```

Este índice sirve tanto para el caso de que `translations` sea un objeto con atributos `title` y `description` de tipo string como para el caso de ser ambos arrays de strings.

En caso de que el atributo por el que quisiéramos buscar estuviera dentro de un array de objetos, por ejemplo `translations`, con objetos distintos para cada uno de los idiomas soportados, teniendo cada objeto atributos como `lang`, `title` y `description`, el índice sería el siguiente:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "translations": {
        "type": "document",
        "fields": {
          "title": {
            "type": "string",
            "analyzer": "lucene.standard"
          },
          "description":{
            "type": "string",
            "analyzer": "lucene.standard"
          }
        }
      }
    }
  }
}
```

Este índice sirve tanto para el caso de que `translations` sea un objeto con propiedades `title` y `description` como para el caso mencionado de ser un array de objetos.

En caso de que el atributo por el que quisiéramos buscar estuviera embebido en un diccionario, por ejemplo `translations`, con claves para cada uno de los distintos idiomas soportados como `es`, `en`, etc. el índice sería el siguiente:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "translations": {
        "fields": {
          "es": {
            "fields": {
              "title": {
                "type": "string",
                "analyzer": "lucene.standard"
              },
              "description":{
                "type": "string",
                "analyzer": "lucene.standard"
              }
            }
          },
          "en": {
            "fields": {
              "title": {
                "type": "string",
                "analyzer": "lucene.standard"
              },
              "description":{
                "type": "string",
                "analyzer": "lucene.standard"
              }
            }
          }
          ...
        }
      }
    }
  }
}
```

Con `"analyzer": "lucene.standard"` podremos hacer búsquedas abarcando cualquier idioma.

## $search aggregation pipeline

La etapa `$search`[\[1\]](https://www.mongodb.com/docs/atlas/atlas-search/query-syntax/#-search), que debe ser siempre la primera del pipeline, permite realizar una búsqueda de texto completo en el campo o campos que especifiquemos, teniendo que estar estos campos cubiertos por un índice de búsqueda de Atlas Search. Aquí[\[2\]](https://www.mongodb.com/docs/atlas/atlas-search/operators-and-collectors/#std-label-operators-ref) tenemos una lista de los operadores que podemos usar con `$search`. Vamos a ver algunos de ellos, por ejemplo `text`, `phrase` y `autocomplete`, y los combinaremos a su vez usando `compound`.

### Autocomplete

Este operador permite completar una o varias palabras que le indiquemos como `query` con aquello que sea más probable que se pretenda buscar de entre los valores que se encuentren en los atributos que estemos usando para realizar la búsqueda. Antes de usar este operador deberemos indexar los atributos a través de los que queramos hacer autocompletados con el tipo `autocomplete` en la colección que corresponda.

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "title": [
        {
          "type": "autocomplete",
          "analyzer": "lucene.standard",
          "tokenization": "edgeGram",
          "minGrams": 3,
          "maxGrams": 20,
          "foldDiacritics": true
        }
      ],
      "description": [
        {
          "type": "autocomplete",
          "analyzer": "lucene.standard",
          "tokenization": "edgeGram",
          "minGrams": 3,
          "maxGrams": 20,
          "foldDiacritics": true
        }
      ]
    }
  }
}
```

Utilizamos `"tokenization": "edgeGram"` porque es lo que se utiliza para autocompletar con idiomas cuya escritura es de izquierda a derecha. Los parámetros `minGrams` y `maxGrams` representan el número mínimo y máximo de caracteres por secuencia indexada respectivamente; generalmente se empiezan a predecir resultados a partir del tercer caracter introducido en el buscador. Con `foldDiacritics` podemos establecer si somos o no sensitivos frente a tildes diacríticas. Por ejemplo, con `"foldDiacritics": true` podremos obtener resultados como café, cafè o cafe indistintamente ante una búsqueda con la palabra café.

Ahora ya podemos usar `autocomplete` sobre los atributos indexados:

```json
{
  "$search": {
    "autocomplete": {
      "query": "Pien",
      "path": "title",
      "fuzzy": {
        "maxEdits": 1,
        "prefixLength": 2,
        "maxExpansions": 10
      },
    }
  }
}
```

En el *fuzzy searching* podemos añadir también el parámetro `prefixLength` que indicará el número de caracteres que deben coincidir sí o sí con lo que se vaya a autocompletar (empezando por el primer caracter de la(s) palabra(s) que se indique(n) en la `query`). En el caso del ejemplo, los resultados del autocompletado deberán empezar obligatoriamente por *“Pi”*. Con `maxEdits` indicamos el número de caracteres que permitimos que varíen para asumirlos como posibles resultados de la búsqueda y con `maxExpansions` indicamos el número total de variaciones que aceptamos como válidas dados dichos caracteres variables.

### Text

Con este operador podemos buscar documentos en los que se encuentre(n) la(s) palabra(s) que indiquemos como `query`. Para encontrar palabras parecidas podemos hacer uso del *fuzzy searching* con los parámetros `maxEdits` y `maxExpansions`. Además, así como en el operador `autocomplete` no podíamos indicar más de un atributo de búsqueda en el campo `path`, aquí sí podremos hacerlo.

```json
{
  "$search": {
    "text": {
      "query": "Pienso",
      "path": ["title", "description"],
      "fuzzy": {
        "maxEdits": 1,
        "maxExpansions": 10
      },
    }
  }
}
```

De esta forma, obtendremos todos aquellos documentos que contengan *"Pienso"* en el título o en la descripción, con las posibles variaciones indicadas en `fuzzy`.

En caso de estar los atributos `title` y `description` dentro de un objeto o array denominado `translations`, por ejemplo, tendríamos `"path": ["translations.title", "translations.description"]`. Para el caso de que `translations` fuera un diccionario con los distintos idiomas disponibles como claves, tendríamos que hacer la búsqueda en cuestión en un idioma en concreto: `"path": ["translations.es.title", "translations.es.description"]`.

### Phrase

Con este operador podemos buscar documentos en los que se encuentren las palabras que indiquemos como `query` en el orden en el que lo escribimos. Es una opción más acertada que `text` para el caso de estar realizando una búsqueda con varias palabras y no solo una. El atributo `slop` permite indicar cuántas palabras permitimos que haya entre las palabras de nuestra `query` como para considerar como válido el resultado de la búsqueda.

```json
{
  "$search": {
    "phrase": {
      "query": "Pienso gatos esterilizados",
      "path": ["title", "description"],
      "slop": 2,
    }
  }
}
```

Con esta consulta encontraríamos aquellos documentos que incluyeran en la descripción la frase “Pienso gatos esterilizados” o cualquier otra variación con hasta 2 palabras entre medias.

### Compound

Este operador permite combinar varios operadores en una misma búsqueda, por ejemplo `text` y `phrase`. Con este operador podemos usar: `must`,  `should`, `mustNot` y `filter`. Estas condiciones nos permiten indicar qué cosas deben o no deben tener obligatoriamente los resultados de la búsqueda y qué cosas no son obligatorias pero serían de valor añadido, pudiendo aparecer más arriba o más abajo (con mayor o menor `score`) en el orden de los resultados devueltos.

```json
{
  "$search": {
    "compound": {
      "must": [
        {
          "text": {
            "query": "Pienso",
            "path": ["title"],
            "fuzzy": {
              "maxEdits": 1,
              "maxExpansions": 10
            },
          }
        }
      ],
      "should": [
        {
          "phrase": {
            "query": "Pienso gatos esterilizados",
            "path": ["description"],
            "slop": 2,
          }
        }
      ]
    }
  }
}
```

En esta búsqueda, por ejemplo, obtendríamos todos los documentos que incluyeran en el título la palabra *"Pienso"* (u otra parecida con un caracter variable hasta 10 posibles variaciones) y, de esos documentos, tendrían mayor `score` aquellos que incluyeran en la descripción la frase *"Pienso gatos esterilizados"* o cualquier otra variación con hasta 2 palabras entre medias, como por ejemplo *"Pienso para gatos esterilizados"*, *"Pienso especial para gatos esterilizados"* o incluso *"Pienso especial para gatos adultos esterilizados"*.

## Un poco más allá

Una vez visto un poco el funcionamiento de MongoDB Atlas Search y los distintos operadores de la etapa `$search`, vamos a ver también algún que otro impedimento que podríamos encontrar. Por ejemplo, podremos encontrarnos con que el operador `autocomplete` no nos devuelva ningún resultado si lo usamos con cadenas de una única letra. Para solucionar este comportamiento tendríamos que utilizar analizadores customizados[\[3\]](https://www.mongodb.com/docs/atlas/atlas-search/analyzers/custom/) en lugar de los analizadores que encontramos por defecto en este operador.

Además, si quisiéramos utilizar el operador `autocomplete` en campos que estuviesen dentro de arrays de objetos, como era el caso comentado de un atributo `translations` que contenía un array de objetos con atributos `lang`, `title` y `description`, no podríamos utilizarlo[\[4\]](https://www.mongodb.com/community/forums/t/atlas-search-autocomplete-on-an-array-of-object/13692/9), al menos no directamente.

Tendríamos que redefinir el índice de búsqueda indicando como tipo `embeddedDocuments`[\[5\]](https://www.mongodb.com/docs/atlas/atlas-search/field-types/embedded-documents-type/).

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "translations": {
        "dynamic": false,
        "type": "embeddedDocuments",
        "fields": {
          "title": {
            "type": "autocomplete"
          },
          "description": {
            "type": "autocomplete"
          }
        }
      }
    }
  }
}
```

Y a la hora de usar el operador `autocomplete`, deberemos usarlo también de la mano de `embeddedDocument`.

```json
{
  "$search": {
    "embeddedDocument": {
      "path": "translations",
      "operator": {
        "autocomplete": {
          "path": "translations.title",
          "query": "Pien"
        }
      }
    }
  }
}
```

Otra cosa que podemos tener en cuenta sobre la funcionalidad de los operadores de búsqueda es que, si introducimos varias palabras en la `query`, Atlas Search buscará matches para cada una de las palabras por separado[\[6\]](https://www.mongodb.com/community/forums/t/autocomplete-search-match-multiple-words-in-a-search-term-as-and/16423), no teniendo que contener necesariamente todas las palabras indicadas sino únicamente una de ellas. Es decir, si buscamos *"Pienso gato"*, nos devolverá resultados que contengan *"Pienso"* o *"gato"*, pudiendo devolvernos *"Pienso para perros"* como resultado. De hecho, resulta antintuitivo porque, funcionando de esta forma, cuantas más palabras escribamos, en lugar de acotarse la búsqueda, obtendremos más resultados. Al parecer, por el momento, lo que se sabe de este comportamiento es que *"no es un bug, es una feature"*, así que ante esta situación lo único que nos queda es echar mano de `compound` y acabar implementando consultas como estas:

```json
{
  "$search": {
    "compound": {
      "must": [
        {
          "autocomplete": {
            "query": "Pienso",
            "path": "title",
            "fuzzy": {
              "maxEdits": 1,
              "maxExpansions": 5,
            },
          },
        },
        {
          "autocomplete": {
            "query": "gato",
            "path": "title",
            "fuzzy": {
              "maxEdits": 1,
              "maxExpansions": 5,
            },
          },
        },
      ]
    },
  },
}
```

Se trata de separar cada palabra y asociarle un operador de autocompletado a cada una, agrupándolas finalmente en un `must`. De esta forma, con esta búsqueda obtendremos resultados que contengan tanto *"Pienso"* como *"gato"* en el título del documento. Como estamos separando cada palabra de la búsqueda, tendremos que tener en cuenta que, si usamos `autocomplete`, deberemos evitar introducir en la consulta las palabras que tengan una sola letra (a no ser que utilicemos algún analizador customizado).

```json
{
  "$search": {
    "compound": {
      "must": [
        {
          "compound": {
            "should": [
              {
                "autocomplete": {
                  "query": "Pienso",
                  "path": "title",
                  "fuzzy": {
                    "maxEdits": 1,
                    "maxExpansions": 5,
                  },
                },
              },
              {
                "autocomplete": {
                  "query": "Pienso",
                  "path": "description",
                  "fuzzy": {
                    "maxEdits": 1,
                    "maxExpansions": 5,
                  },
                },
              },
            ],
            "minimumShouldMatch": 1,
          },
        },
        {
          "compound": {
            "should": [
              {
                "autocomplete": {
                  "query": "gato",
                  "path": "title",
                  "fuzzy": {
                    "maxEdits": 1,
                    "maxExpansions": 5,
                  },
                },
              },
              {
                "autocomplete": {
                  "query": "gato",
                  "path": "description",
                  "fuzzy": {
                    "maxEdits": 1,
                    "maxExpansions": 5,
                  },
                },
              },
            ],
            "minimumShouldMatch": 1,
          },
        },
      ]
    },
  },
}
```

Con esta búsqueda obtendremos resultados que contengan *"Pienso"* en el título o en la descripción y que contengan además *"gato"* en el título o en la descripción.

> “Because Atlas Search is embedded right alongside the database, everything is automated for us. Now we’ve got feature releases down to 3 hours, representing a time saving of over 90%”
>
> ###### Johanes Mangold, Lead Solution Architect, Helvetia