---
layout: ../../layouts/PostLayout.astro
title: 'API de WebSocket en Amazon API Gateway con Serverless Framework 👩🏻‍💻'
pubDate: 2020/07/14
description: 'Mezclamos canales de comunicación bidireccionales con un despliegue serverless en AWS'
author: 'Clara Jiménez'
image:
    url: '' 
    alt: 'API WebSocket Serverless'
tags: ["aws", "websocket", "serverless"]
---
WebSocket es un protocolo que permite establecer un canal de comunicación bidireccional sobre TCP, a diferencia de HTTP que está enfocado a una arquitectura cliente-servidor con comunicación unidireccional. Esta es la principal diferencia entre una API REST y una API WebSocket. Con WebSocket, los canales de conexión se crean inicialmente y se mantienen activos para permitir el intercambio de mensajes de un lado a otro sobre un único socket TCP.

Configuración API WebSocket en AWS con Serverless
-------------------------------------------------

Serverless Framework hace posible configurar una API WebSocket haciendo uso de Amazon API Gateway. Amazon API Gateway proporciona 4 tipos de rutas que pueden establecerse durante el ciclo de vida de un socket:

$connect es llamado en la creación de la conexión por parte de un cliente WebSocket.

$disconnect es llamado en la desconexión de un cliente WebSocket.

$default es llamado si no hay un handler específico para gestionar el evento que llega.

rutas personalizadas: un handler específico se encarga de gestionar un evento identificado por un nombre de ruta concreto.

Estas rutas deben describirse en el fichero serverless.yml junto con el resto de configuración asociada a la API, como la declaración de la base de datos de DynamoDB que se encargará de manejar las conexiones WebSocket activas.

```yml
# serverless.yml

service: my-api-ws

custom:
  CONNECTIONS_TABLE: "connections"

provider:
  name: aws
  runtime: nodejs12.x
  stage: dev
  region: eu-west-1
  websocketsApiName: my-api-ws
  websocketApiRouteSelectionExpression: $request.body.action
  iamRoleStatements:
    - Effect: Allow
      Action:
        - "execute-api:ManageConnections"
      Resource:
        - "arn:aws:execute-api:*:*:**/@connections/*"
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
    CONNECTIONS_TABLE: ${self:custom.CONNECTIONS_TABLE}

functions:
  connectionHandler:
    handler: app.connection
    events:
      - websocket:
          route: $connect
      - websocket:
          route: $disconnect
  defaultHandler:
    handler: app.default
    events:
      - websocket:
          route: $default
  loginEventHandler:
    handler: app.loginEvent
    events:
      - websocket:
          route: loginEvent

resources:
  Resources:
    ConnectionsDynamoDBTable:
      Type: 'AWS::DynamoDB::Table'
      Properties:
        AttributeDefinitions:
          -
            AttributeName: connectionId
            AttributeType: S
        KeySchema:
          -
            AttributeName: connectionId
            KeyType: HASH
        BillingMode: PAY_PER_REQUEST
        TableName: ${self:custom.CONNECTIONS_TABLE}
```

Un aspecto importante que destacar especialmente de este fichero de configuración es websocketApiRouteSelectionExpression: $request.body.action. Este apartado define dónde se encontrará el nombre de la ruta del evento que llega para asociar su gestión a un handler determinado. En el ejemplo mostrado, para la ruta personalizada atendida por el handler loginEventHandler, el nombre de la ruta que encontremos en el atributo action del evento que llega deberá ser 'loginEvent'. Esta ruta podremos utilizarla, por ejemplo, para usuarios que se introduzcan dentro de una sala en una aplicación web y manejar así eventos entre usuarios de una misma sala. Si llega un evento con cualquier otro nombre de ruta no vinculado a ningún handler, saltará el handler $default. El handler que gestiona cada evento se asocia con una función exportada del fichero app.js.

Y ahora… ¡A por el código!
--------------------------

Bien, pues ahora es momento de abordar el desarrollo del código de los handlers que atenderán los eventos que lleguen a la API WebSocket. En el fichero package.json deberemos importar el paquete aws-sdk para poder hacer uso tanto de API Gateway como de DynamoDB. En el fichero app.js describiremos los handlers a ejecutar para cada uno de los 4 tipos de rutas que se han definido en este ejemplo.

$connect provoca la creación de una conexión WebSocket, añadiendo un nuevo elemento en la base de datos creada; $disconnect destruye esta conexión; default imprime un mensaje por defecto; 'loginEvent' devuelve al cliente un evento de éxito y envía otro evento a todos los sockets que están en la misma sala que el nuevo socket informando de que se ha unido un nuevo usuario.

```javascript
// app.js

const dynamo = require('db_utils.js');
const ws = require('ws_utils.js');

module.exports.connection = (event, context, callback) => {
  const { connectionId } = event.requestContext;
  if (event.requestContext.eventType === 'CONNECT') {
    dynamo.addConnection(connectionId).then(() => {
      callback(null, { statusCode: 200, body: 'OK' });
    }).catch(error => {
      callback(null, { statusCode: 500, body: JSON.stringify(error) });
    });
  } else if (event.requestContext.eventType === 'DISCONNECT') {
    dynamo.deleteConnection(connectionId).then(() => {
      callback(null, { statusCode: 200, body: 'OK' });
    }).catch(error => {
      callback(null, { statusCode: 500, body: JSON.stringify(error) });
    });
  }
};

module.exports.loginEvent = (event, context, callback) => {
  const { connectionId } = event.requestContext;
  const body = JSON.parse(event.body);
  const { room_name } = body;
  dynamo.join(connectionId, room_name).then(() => {
    ws.sendMessageToSocket(connectionId, 'loginSuccess', event);
  }).then(() => {
    ws.sendMessageToRoom(room_name, 'newPlayerInTheRoom', event);
  }).then(() => {
    callback(null, { statusCode: 200, body: 'OK' });
  }).catch(error => {
    callback(null, { statusCode: 500, body: JSON.stringify(error) });
  });
}

module.exports.default = (event, context, callback) => {
  console.log("default");
};
```

Las funciones asociadas a la creación y borrado de elementos en la base de datos de conexiones WebSocket así como el envío de eventos de vuelta a un cliente o a todos los de una misma sala se describirán en ficheros distintos: db\_utils.js y ws\_utils.js, para dividir y mantener ordenado el código de la aplicación.

La función addConnection se encarga de añadir un elemento a la tabla de conexiones de DynamoDB con información sobre la sala a la que pertenecerá el socket creado y el identificador del socket, que se habrá obtenido en la llegada del evento $connect en el parámetro event.requestContext. La función deleteConnection elimina un elemento de esta base de datos utilizando este indentificador de la conexión. Cuando un usuario conectado se loguea dentro de una sala concreta, se recurre a la función join, editándose así el atributo 'room' del elemento de la base de datos correspondiente al identificador de conexión del usuario. Por último, como función asociada a DynamoDB, getPlayersInRoom nos permitirá obtener las conexiones establecidas dentro de una misma sala para poder así mandar mensajes colectivos a toda una sala.

```javascript
// db_utils.js

const AWS = require('aws-sdk');
const db = process.env.CONNECTIONS_TABLE || "connections";
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.addConnection = (connectionId) => {
  const params = {
    TableName: db,
    Item : {
      connectionId,
      room: ""
    }
  };
  return dynamoDb.put(params).promise();
}

exports.deleteConnection = (connectionId) => {
  const params = {
    TableName: db,
    Key : {
      connectionId
    }
  };
  return dynamoDb.delete(params).promise();
}

exports.join = (connectionId, room_name) => {
  const params = {
    TableName: db,
    Key : {
      connectionId
    },
    UpdateExpression: "SET room=:room",
    ExpressionAttributeValues: {
      ":room": room_name
    },
    ReturnValues: "ALL_NEW"
  };
  return dynamoDb.update(params).promise();
}

exports.getPlayersInRoom = (room_name) => {
  const params = {
    TableName: db,
    FilterExpression: "room=:room",
    ExpressionAttributeValues: {
      ":room": room_name
    },
    ProjectionExpression: "connectionId"
  };
  return dynamoDb.scan(params).promise();
}
```

Una vez tenemos establecidas las conexiones y estas están disponibles y accesibles en la base de datos de DynamoDB, podemos implementar las funciones encargadas de enviar mensajes a usuarios determinados e incluso a todos los usuarios de una sala concreta. Esto se podrá hacer con las funciones sendMessageToSocket y sendMessageToRoom respectivamente. Ambas funciones harán uso a su vez de la función send que se encargará de crear el mensaje y enviarlo utilizando postToConnection.

Para enviar un mensaje de vuelta a un usuario, debemos usar la clase ApiGatewayManagementApi de la dependencia aws-sdk, determinando en la creación de nuestro objecto el endpoint de nuestra API WebSocket. Con este objeto y aplicando el método postToConnection enviaremos la información especificada como parámetro a un usuario determinado.

```javascript
// ws_utils.js

const dynamo = require('db_utils.js');
const AWS = require('aws-sdk');

const create = (domainName, stage) => {
  const endpoint = domainName + "/" + stage;
  return new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint
  });
};

const send = (event, connectionId, action) => {
  const body = JSON.parse(event.body);
  body.action = action;
  const ws = create(event.requestContext.domainName, event.requestContext.stage);
  const params = {
    ConnectionId: connectionId,
    Data: JSON.stringify(body)
  };
  return ws.postToConnection(params).promise();
}

exports.sendMessageToRoom = (room_name, action, event) => {
  return dynamo.getPlayersInRoom(room_name).then(connectionData => {
    return connectionData.Items.map(item => {
      return send(event, item.connectionId, action);
    });
  });
}

exports.sendMessageToSocket = (connectionId, action, event) => {
  return send(event, connectionId, action);
}
```

Ya tenemos la funcionalidad de nuestra API WebSocket implementada, sólo quedaría hacer uso de ella en un cliente, por ejemplo, una aplicación web. En un formulario de login, un usuario podrá introducir su nombre y la sala a la que quiera conectarse, así como salirse de la misma y de la aplicación en general.

Para abrir una conexión WebSocket con nuestra API deberemos añadir lo siguiente:

```javascript
const ws = new WebSocket([WS_URL]);
```

Donde WS\_URL es el endpoint de nuestra API WebSocket (e. g. 'wss://6a412fvzju.execute-api.eu-west-1.amazonaws.com/dev').

Para loguearse en una sala determinada, el código sería:

```javascript
ws.onopen = () => {
  ws.send(JSON.stringify( { action: 'loginEvent', room_name: [ROOM_NAME], player_name: [PLAYER_NAME] } ));
}
```

Donde ROOM\_NAME es el nombre de la sala a la que se está uniendo el usuario en el proceso de login y PLAYER\_NAME el nombre de dicho usuario.

Finalmente, para recibir los eventos de vuelta, tendremos lo siguiente:

```javascript
ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  switch (data.action) {
    case 'loginSuccess':
      console.log(data.player_name + ' successfully registered in room: ' + data.room_name);
      break;
    case 'newPlayerInTheRoom':
      console.log('New player: ' + data.player_name + ' in room: ' + data.room_name);
      break;
    default:
      break;
  }
};
```

Bueno pues ¡ya tenemos todo!, sólo falta desplegar el código de la API en Amazon API Gateway con el framework Serverless.

```bash
serverless deploy
```

Y ahora sí que sí, con esta instrucción, ¡damos el despliegue por terminado!

Por cierto, en la respuesta a esta instrucción encontraremos el endpoint que AWS le ha dado a nuestra API, pudiendo sustituir así la variable WS\_URL por este valor. Con el cliente web también a punto, podemos probar maravillosamente el funcionamiento de nuestra API WebSocket serverless.

> “Amazon API Gateway is a fully managed service that makes it easy for developers to create, publish, maintain, monitor, and secure APIs at any scale”
>
> ###### Amazon Web Services