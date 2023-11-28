---
layout: ../../layouts/PostLayout.astro
title: 'Patrones de diseño creacionales en JavaScript 👩🏻‍💻'
pubDate: 2020/11/14
description: 'Patrones de diseño: el déjà vu del desarrollo software'
author: 'Clara Jiménez'
image:
    url: '/images/posts/design_patterns.png' 
    alt: 'Design Patterns'
tags: ["javascript"]
---
Seguramente todo desarrollador se ha encontrado alguna vez con un problema que no sabía cómo resolver y ha pensado “Pero… ¡seguro que esto ya lo ha resuelto alguien antes!”. Los patrones de diseño son precisamente técnicas para resolver problemas comunes en el mundo del diseño o desarrollo de software. Cuando tienes la sensación de haber vivido un mismo problema antes o piensas que no eres el único que ha debido pasar por esa piedra, tu déjà vu tiene sentido y seguramente se resuelva con un patrón de diseño. Así que un patrón de diseño no es nada más y nada menos que una solución estandarizada, reutilizable y documentada a un problema generalmente común. Fue en el año 1995 cuando Erich Gamma, John Vlissides, Ralph Johnson y Richard Helm documentaron estos patrones de diseño en el libro “Design Patterns: Elements of Reusable Object-Oriented Software”. Al tener un nombre tan largo y venir de 4 autores, comenzaron a llamarlo popularmente el libro de la Gang of Four, abreviándose finalmente como el libro GoF. Este libro fue esencial para que el uso de los patrones se formalizara y siga latente actualmente.

![Design Patterns](/images/posts/design_patterns.png)

Tipos de Patrones de Diseño
---------------------------

Hay 3 tipos de patrones: creacionales, estructurales y de comportamiento. Los 3 tipos de patrones se autodefinen en su nomenclatura; por orden de mención, el primero de ellos facilita la creación de objetos de forma controlada, el segundo afecta a las relaciones entre objetos, definiendo cómo agrupar o separar distintos objetos, y el último facilita la comunicación entre objetos que asumen responsabilidades distintas.

Yo voy a centrarme en el primero de estos patrones, los patrones de diseño creacionales, y trataré de explicar con ejemplos en JavaScript el uso que se puede dar a varios patrones creacionales.

Singleton
---------

Singleton es un patrón de diseño que permite crear una única instancia de una clase, proporcionando así un punto de acceso global a dicha instancia. Este patrón es útil, por ejemplo, para gestionar el acceso a datos persistentes, creando una única instancia que represente la conexión con la base de datos para utilizar siempre la misma conexión y mantener solo una conexión abierta simultáneamente.

Imaginemos, por ejemplo, que gestionamos objetos que representan a desarrolladores de software y estamos en un mundo en el que no hay avances. Naces desarrollador y conoces una serie de lenguajes de programación, pero no puedes aspirar a más ni aprender nuevos lenguajes. El desarrollador se queda estancado.

```javascript
// SINGLETON

class Developer {
  constructor(senior, name, age, languages) {
    this.senior = senior;
    this.name = name;
    this.age = age;
    this.languages = languages;
    if (!Developer.instance) {
      Developer.instance = this;
    }
    return Developer.instance;
  }
}

const developerJunior = new Developer(false, 'Clara', 18, ['Java']);
const developerSenior = new Developer(true, 'Clara', 26, ['Java', 'JavaScript']);

console.log(developerJunior);
console.log(developerSenior);
```

![Singleton](/images/posts/design_patterns_1.png)

Builder
-------

El patrón Builder nos permite construir objetos con muchas características distintas paso a paso y de forma bastante autodescriptiva con métodos SET. Si no usáramos este patrón, nos podríamos encontrar con un constructor enorme y difícil de mantener. Además, separando las distintas características y dejándolas fuera del constructor, tendremos la posibilidad de crear distintos tipos de objetos siguiendo un mismo esquema de construcción.

Volviendo a la creación de desarrolladores, a cada uno de nuestros desarrolladores podremos asignarle distintas características e incluso no todos los desarrolladores tendrán por qué tener definidos todos los atributos del esquema de construcción común. Todos tendrán un nombre o una edad, por ejemplo, pero solo algunos serán Senior. Tras establecer las características de nuestros objetos, los crearemos finalmente con un método común que, en estos ejemplos he denominado build().

```javascript
// BUILDER

class Developer {
  constructor(senior, name, age, languages) {
    this.senior = false;
    this.name = '';
    this.age = 0;
    this.languages = [];
  }
  setSenior() {
    this.senior = true;
    return this;
  }
  setName(name) {
    this.name = name;
    return this;
  }
  setAge(age) {
    this.age = age;
    return this;
  }
  addLanguage(language) {
    this.languages.push(language);
    return this;
  }
  build() {
    return {
      senior: this.senior;
      name: this.name;
      age: this.age;
      languages: this.languages;
    };
  }
}

const developerJunior = new Developer().setName('Clara').setAge(18).addLanguage('Java').build();
const developerSenior = new Developer().setSenior().setName('Clara').setAge(18).addLanguage('Java').addLanguage('JavaScript').build();

console.log(developerJunior);
console.log(developerSenior);
```

![Builder](/images/posts/design_patterns_2.png)

Ahora nuestra desarrolladora Clara no se ha quedado estancada y hemos podido comprobar su avance describiendo sus características de forma bastante autodescriptiva y legible.

Prototype
---------

Podemos decir que el patrón Prototype se basa en la creación de objetos que actúan como prototipos de otros objetos. El objeto prototipo en sí mismo se usa como modelo para crear otros objetos. Representa un método de clonación de objetos en el que, además, los objetos clonados a raíz del prototipo pueden contener información adicional o sobrescribir el contenido heredado.

Vamos a seguir creando desarrolladores. En concreto, vamos a comenzar a crear dos tipos diferenciados de desarrolladores: FrontEnd y BackEnd. Tanto los desarrolladores Front como los desarrolladores Back compartirán una clase base con métodos comunes: Developer. A su vez, cada una de las dos clases, FrontEnd y BackEnd, podrá generar sus propios métodos adicionales o incluso modificar y reescribir los métodos heredados de la clase que tienen en común.

```javascript
// PROTOTYPE

class Developer {
  constructor(name, age) {
    this.name = '';
    this.age = 0;
  }
  setName(name) {
    this.name = name;
  }
  setAge(age) {
    this.age = age;
  }
  getName() {
    console.log(`Me llamo ${this.name}`);
  }
  getAge() {
    console.log(`Tengo ${this.age} años`);
  }
  getProperties() {
    this.getName();
    this.getAge();
  }
}

class FrontEnd extends Developer {
  constructor(name, age, frameworks) {
    super(name, age);
    this.frameworks = frameworks;
  }
  setFrameworks(frameworks) {
    this.frameworks = frameworks;
  }
  getFrameworks() {
    console.log(`Como frontend utilizo: ${this.frameworks.join(', ').replace(/,([^,]*)$/, ' y $1')}`);
  }
  getProperties() {
    this.getName();
    this.getAge();
    this.getFrameworks();
  }
}

class BackEnd extends Developer {
  constructor(name, age, db) {
    super(name, age);
    this.db = db;
  }
  setDB(db) {
    this.db = db;
  }
  getDB() {
    console.log(`Como backend utilizo: ${this.db.join(', ').replace(/,([^,]*)$/, ' y $1')}`);
  }
  getProperties() {
    this.getName();
    this.getAge();
    this.getDB();
  }
}

const frontendDeveloper = new FrontEnd('Natalia', 27, ['ReactJS', 'Angular', 'Vue']);
const backendDeveloper = new BackEnd('Clara', 26, ['MongoDB', 'DynamoDB', 'Redis']);
frontendDeveloper.getProperties();
backendDeveloper.getProperties();
```

![Prototype](/images/posts/design_patterns_3.png)

Factory Method
--------------

El patrón de diseño creacional Factory Method permite agrupar la forma de creación de objetos de distintas clases a través de un método único y común que actúe como una fábrica de objetos.

Siguiendo con el patrón Prototype en el que creábamos dos tipos de desarrolladores compartiendo información de una clase común, podemos ir más allá y crear una interfaz que nos facilite y estandarice la creación de los desarrolladores FrontEnd y BackEnd. Tendremos así una fábrica de desarrolladores FrontEnd y BackEnd.

```javascript
// FACTORY METHOD

class DevelopersFactory {
  constructor(developer) {
    switch(developer) {
      case 'frontend':
        return new FrontEnd();
      case 'backend':
        return new BackEnd();
      default:
        return null;
    }
  }
}

const frontendDeveloper = new DevelopersFactory('frontend');
frontendDeveloper.setName('Natalia');
frontendDeveloper.setAge(27);
frontendDeveloper.setFrameworks(['ReactJS', 'Angular', 'Vue']);
const backendDeveloper = new DevelopersFactory('backend');
backendDeveloper.setName('Clara');
backendDeveloper.setAge(26);
backendDeveloper.setDB(['MongoDB', 'DynamoDB', 'Redis']);
```

Si en cualquier momento aumentan las necesidades de nuestra fábrica y necesitamos crear otro tipo de objetos o desarrolladores como, por ejemplo, FullStack, podremos crear la clase FullStack y añadirla a nuestra fábrica para seguir creando más desarrolladores a través de ella.

Simple Factory
--------------

Conociendo el patrón Factory Method, este resultará más sencillo. Se trata de crear una fábrica distinta para la creación de objetos de cada clase. Tendremos una fábrica de desarrolladores BackEnd y otra fábrica de desarrolladores FrontEnd, abstrayendo la creación de objetos con el operador new.

```javascript
// SIMPLE FACTORY

const FrontEndFactory = {
  createDeveloper: (name, age, frameworks) => new FrontEnd(name, age, frameworks)
}

const BackEndFactory = {
  createDeveloper: (name, age, db) => new BackEnd(name, age, db)
}

const frontendDeveloper = FrontEndFactory.createDeveloper('Natalia', 27, ['ReactJS', 'Angular', 'Vue']);
const backendDeveloper = BackEndFactory.createDeveloper('Clara', 26, ['MongoDB', 'DynamoDB', 'Redis']);
```

El patrón Factory Method también sugiere abstraer el uso del operador new al construir objetos a través de la fábrica común.

```javascript
// FACTORY METHOD

const DevelopersFactory = {
  createDeveloper: (developer) => {
    switch(developer) {
      case 'frontend':
        return new FrontEnd();
      case 'backend':
        return new BackEnd();
      default:
        return null;
    }
  }
}

const frontendDeveloper = DevelopersFactory.createDeveloper('frontend');
frontendDeveloper.setName('Natalia');
frontendDeveloper.setAge(27);
frontendDeveloper.setFrameworks(['ReactJS', 'Angular', 'Vue']);
const backendDeveloper = DevelopersFactory.createDeveloper('backend');
backendDeveloper.setName('Clara');
backendDeveloper.setAge(26);
backendDeveloper.setDB(['MongoDB', 'DynamoDB', 'Redis']);
```

Así, en lugar de inicializar nuestros objetos utilizando el operador new sobre distintas clases, utilizamos una función fábrica común que abstrae para nosotros el uso de new.

```javascript
// ABSTRACT FACTORY

const WorkersFactory = {
  constructor() {
    this.developer = new DevelopersFactory();
    this.designer = new DesignersFactory();
  }
  createDeveloper() {
    return this.developer;
  }
  createDesigner() {
    return this.designer;
  }
}

const frontendDeveloper = WorkersFactory.createDeveloper().createDeveloper('frontend');
frontendDeveloper.setName('Natalia');
frontendDeveloper.setAge(27);
frontendDeveloper.setFrameworks(['ReactJS', 'Angular', 'Vue']);
const backendDeveloper = WorkersFactory.createDeveloper().createDeveloper('backend');
backendDeveloper.setName('Clara');
backendDeveloper.setAge(26);
backendDeveloper.setDB(['MongoDB', 'DynamoDB', 'Redis']);
```

En caso de que nos encontremos un problema que requiera de varias fábricas en las que usemos Factory Method y podamos agruparlas, estaremos ante la posibilidad de recurrir al patrón Abstract Factory.

Abstract Factory
----------------

Factory Method nos permitía crear una fábrica de objetos, llamados generalmente productos. Con el patrón Abstract Factory damos un paso más y podemos crear una fábrica de fábricas.

Desde una fábrica global de trabajadores indicaremos qué queremos crear: un desarrollador o un diseñador. Desde cada una de las fábricas individuales declaramos la creación de tipos de trabajadores específicos (productos) en esa rama, por ejemplo, FrontEnd y BackEnd en la fábrica de desarrolladores que creamos previamente con Factory Method.

```javascript
// ABSTRACT FACTORY

const WorkersFactory = {
  constructor() {
    this.developer = new DevelopersFactory();
    this.designer = new DesignersFactory();
  }
  createDeveloper() {
    return this.developer;
  }
  createDesigner() {
    return this.designer;
  }
}
```

Refactoring.Guru
----------------

No quería terminar este post sin mencionar un recurso muy útil para aprender y consultar sobre patrones de diseño: Refactoring.Guru[\[1\]](https://refactoring.guru/)

> “Learning from your mistakes makes you smart. Learning from other people's mistakes makes you a genius.”
>
> ###### Unknown