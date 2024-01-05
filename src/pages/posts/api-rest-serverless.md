---
layout: ../../layouts/PostLayout.astro
title: 'Convertir una API REST en serverless con Amazon API Gateway, Lambda Function y DynamoDB 👩🏻‍💻'
pubDate: 2020/06/29
description: 'Aprende a llevar tus aplicaciones a un lugar mejor: la nube'
author: 'Clara Jiménez'
image:
    url: '' 
    alt: 'API REST Serverless'
tags: ["aws", "serverless"]
---
Puesta a punto
--------------

Lo primero que tenemos que hacer para conseguir desplegar nuestra aplicación en la nube, en este caso, es instalar Serverless [[1]](https://www.serverless.com/framework/docs/getting-started/), un framework que nos facilita enormemente el despliegue de aplicaciones:

```bash
npm install -g serverless
```

Lo siguiente que debemos hacer es vincular Serverless con nuestra cuenta de proveedor de servicios en la nube, en este caso AWS, para permitirle tener acceso a los distintos componentes de nuestra cuenta en el cloud de AWS. Hay varias formas de hacer esto, y una de ellas, la que yo escogí, se basa en configurar la CLI de Serverless para usar las claves de acceso de AWS almacenadas en AWS Profiles.

Primero creamos un usuario de IAM particular para Serverless Framework en nuestra cuenta de AWS. Podemos darle un nombre como “serverless-admin”, que nos permita identificar su funcionalidad. Debemos permitir a este usuario el acceso de forma programática marcando la opción “Programmatic access” y seguidamente, le añadimos la política AdministratorAccess. Esta política simplifica las cosas en este momento inicial de creación de nuestro usuario, pero conviene cambiarla por otras más específicas cuando trabajemos en un entorno de producción. Cuando terminemos el proceso de creación del usuario obtendremos nuestro par de claves que deberemos guardar para completar la configuración de Serverless + AWS.

Así, finalmente procedemos a configurar las credenciales de Serverless de forma permanente mediante el uso de AWS Profiles. Existe un comando de configuración de Serverless que nos permite realizar este paso para completar rápidamente la vinculación de la CLI de Serverless con nuestra cuenta de AWS a través del usuario que hemos creado.

```bash
serverless config credentials --provider aws --key [ACCESS_KEY_ID] --secret [SECRET_ACCESS_KEY]
```

Ya podemos adentrarnos en la parte importante del despliegue de nuestra aplicación para conseguir hacerla serverless.

Hacemos nuestra API REST serverless con Node.js, Express y Serverless framework
-------------------------------------------------------------------------------

Bien, pues ya podemos agregar Serverless a nuestro proyecto para proceder al despliegue automático de nuestra aplicación en los servicios de la nube de Amazon.

Agregamos la librería serverless-http a nuestro proyecto:

```bash
npm install --save serverless-http
```

En el punto de entrada de ejecución de nuestra aplicación, lo que sería el fichero app.js, podemos incluir ahora esta librería para finalmente exportar el código a través de ella, ya que ahora será Serverless quien se encargue de ejecutar el código de nuestra aplicación.

```javascript
// app.js

const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/index');
const app = express();
app.use(bodyParser.json({ strict: false }));
app.use('/', routes);
module.exports.handler = serverless(app);
```

Finalmente, sólo tendremos que crear un fichero YAML para configurar Serverless, estableciendo cómo se comportará nuestra aplicación en la nube y qué recursos necesitará (S3, CloudFront, Route53, DynamoDB, etc.).

```yml
# serverless.yml

service: my-api-rest

provider:
  name: aws
  runtime: nodejs12.x
  stage: dev
  region: eu-west-1


functions:
  app:
    handler: app.handler
    events:
      - http: ANY /
      - http: 'ANY {proxy+}'
```

Ya estamos listos para desplegar nuestra aplicación en la nube de Amazon a través de Serverless. Serverless creará mediante CloudFormation una API REST en Amazon API Gateway y la enlazará con una función Lambda. Para ello, también subirá nuestro código a un nuevo bucket en S3, el cual podremos eliminar una vez haya concluido el despliegue.

```bash
serverless deploy
```

Este comando nos ofrecerá como resultado el endpoint que habrá adquirido nuestra API REST en Amazon API Gateway, desde el cual podremos acceder a los recursos web que hayamos descrito con Node.js y Express.

Si queremos eliminar cualquier rastro de la aplicación desplegada, podemos hacerlo utilizando únicamente el comando remove de Serverless, que limpiará todos los componentes de la infraestructura afectados por el despliegue.

```bash
serverless remove
```

Ya tenemos la configuración básica para hacer nuestra aplicación serverless. Si queremos añadir funcionalidades, tan sólo tendremos que trabajar sobre esta base inicial.

Añadir persistencia con DynamoDB a través de Serverless
-------------------------------------------------------

Para poder hacer uso de otros componentes de AWS desde nuestra aplicación, como puede ser en este caso DynamoDB, debemos indicarlo en el fichero YAML y hacer uso de dicho componente en el código de nuestra aplicación.

Al editar el fichero YAML, añadimos la configuración necesaria para generar el nombre de la tabla de manera dinámica, crearla de manera automática y además, generar los permisos necesarios para que nuestra aplicación, particularmente la función Lambda, pueda acceder a estos recursos.

```yml
# serverless.yml

service: my-api-rest

custom:
  MY_DYNAMODB_TABLE: "my-table"

provider:
  name: aws
  runtime: nodejs12.x
  stage: dev
  region: eu-west-1
  iamRoleStatements:
    - Effect: Allow
      Action:
        - dynamodb:Query
        - dynamodb:Scan
        - dynamodb:GetItem
        - dynamodb:PutItem
        - dynamodb:UpdateItem
        - dynamodb:DeleteItem
      Resource: "*" 
  environment:
    MY_DYNAMODB_TABLE: ${self:custom.MY_DYNAMODB_TABLE}

functions:
  app:
    handler: app.handler
    events:
      - http: ANY /
      - http: 'ANY {proxy+}'

resources:
  Resources:
    MyDynamoDBTable:
      Type: 'AWS::DynamoDB::Table'
      Properties:
        AttributeDefinitions:
          -
            AttributeName: name
            AttributeType: S
        KeySchema:
          -
            AttributeName: name
            KeyType: HASH
        ProvisionedThroughput:
          ReadCapacityUnits: 1
          WriteCapacityUnits: 1
        TableName: ${self:custom.MY_DYNAMODB_TABLE}
```

Para acceder a la tabla creada desde nuestra aplicación, importamos el SDK de AWS en nuestro controlador encargado de describir la lógica de los recursos web expuestos.

```bash
npm install --save aws-sdk
```

Importamos esta librería en nuestro código y ya podemos utilizarla para manipular nuestra base de datos.

```javascript
const AWS = require('aws-sdk');
const db = process.env.MY_DYNAMODB_TABLE;
const dynamoDb = new AWS.DynamoDb.DocumentClient();
```

Algunas operaciones que podríamos realizar con DynamoDB, por ejemplo, serían:

```javascript
// GET ITEMS

const params = {
  TableName: db,
  Limit: 100
};

dynamoDb.scan(params, (error, result) => {
  if (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  } else {
    res.status(200).send({ items: result.Items });
  }
});
```

```javascript
// GET ITEM

const name = req.params.name;
const params = {
  TableName: db,
  Key: {
    name
  }
};

dynamoDb.get(params, (error, result) => {
  if (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  } else {
    res.status(200).send({ item: result.Item });
  }
});
```

```javascript
// CREATE ITEM

const name = req.params.name;
const { description } = req.body;
const params = {
  TableName: db,
  Item: {
    name,
    description
  }
};

dynamoDb.put(params, (error, result) => {
  if (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  } else {
    console.log("CreateItem succeeded:", JSON.stringify(result));
    res.status(200).send("OK");
  }
});
```

```javascript
// UPDATE ITEM

const name = req.params.name;
const { description } = req.body;
const params = {
  TableName: db,
  Key: {
    name
  }
  UpdateExpression: "SET attr=:value",
  ExpressionAttributeNames : {
    "#attr" : "description"
  },
  ExpressionAttributeValues:{
    ":value": description
  },
  ReturnValues: "ALL_NEW"
};

dynamoDb.update(params, (error, result) => {
  if (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  } else {
    console.log("UpdateItem succeeded:", JSON.stringify(result));   
    res.status(200).send("OK");
  }
});
```

```javascript
// DELETE ITEM

const name = req.params.name;
const params = {
  TableName: db,
  Key: {
    name
  }
};

dynamoDb.delete(params, (error, result) => {
  if (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  } else {
    console.log("DeleteItem succeeded:", JSON.stringify(result));   
    res.status(200).send("OK");
  }
});
```

Una vez hechos los cambios para utilizar persistencia con DynamoDB, volvemos a desplegar nuestra aplicación con Serverless:

```bash
serverless deploy
```

Ahora podemos probar nuestros servicios REST serverless accediendo al endpoint de nuestra API a través de cualquier cliente REST como Postman, una de las herramientas más populares de desarrollo Web que permite realizar peticiones HTTP para probar una API REST de forma sencilla. ¡Y ya estaría!

> “Cloud is about how you do computing, not where you do computing”
>
> ###### Paul Maritz