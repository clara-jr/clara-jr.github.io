---
layout: ../../layouts/PostLayout.astro
title: 'Vinculación de cuentas en Skills de Alexa 👩🏻‍💻‍'
pubDate: 2019/06/12
description: 'El proceso de vinculación de cuentas en una Skill de Alexa permite conectar el usuario asociado a un dispositivo Amazon Echo con otro propio de una plataforma o aplicación externa, pudiendo acceder a servicios adicionales ofrecidos por dicha aplicación'
author: 'Clara Jiménez'
image:
    url: 'https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/accountlinking.png' 
    alt: 'OAuth 2.0'
tags: ["alexa"]
---
Algunas Skills requieren conectar el usuario identificado en Alexa con un usuario en otro sistema o aplicación. Este requisito se trata por tanto de un proceso de vinculación de cuentas o account linking, siendo el objetivo crear un enlace entre el usuario de Alexa y un usuario externo registrado en otro sistema.

Si estamos trabajando con una Skill personalizada o Custom Skill necesitaremos hacer uso de la vinculación de cuentas en caso de que nuestra Skill necesite acceso a datos particulares en otro sistema que requiera de un proceso de autenticación.

Al vincular nuestra cuenta de Alexa con otra propia de una aplicación externa podremos acceder a servicios que se ajusten a nuestro perfil, recibiendo funcionalidades e información personalizada. En el caso de uso de una Skill para el manejo de dispositivos en un hogar inteligente, sería necesario vincular nuestra cuenta asociada al altavoz Amazon Echo con el usuario propio de nuestro hogar en la aplicación externa desarrollada para Smart Homes. Otros casos de uso posibles podrían basarse en la necesidad de pedir comida a domicilio a través de una Skill, necesitando datos propios de un usuario concreto, o la posible vinculación con el usuario de nuestro gimnasio para reservar una clase a través de su Skill.

En el caso de manejar dispositivos en un hogar inteligente, dispondremos de una aplicación externa que permita a sus usuarios acceder a los datos de estos dispositivos instalados en las distintas salas de su hogar. Ofrecer una Skill personalizada que permite a los usuarios acceder por voz a estas funcionalidades es de gran utilidad, pero para completar estas peticiones de acceso por voz la Skill debe ser capaz precisamente de autenticarse como un usuario específico de esta aplicación externa. Por tanto, se necesita un enlace entre la cuenta de Amazon utilizada en el dispositivo de Alexa y la cuenta de esta aplicación propia del usuario en cuestión.

Framework de autorización OAuth 2.0
-----------------------------------

La implementación de esta funcionalidad de vinculación de cuentas entre una Skill de Alexa y servicios externos sigue el estándar o framework de autorización RFC6749 conocido como OAuth 2.0. Este estándar permite a las aplicaciones obtener acceso limitado a cuentas de usuario en un servicio HTTP. Delega la autenticación del usuario al servicio que aloja la cuenta del mismo (aplicación externa) y autoriza a las aplicaciones de terceros (Alexa) el acceso a dicha cuenta de usuario. OAuth 2.0 maneja los siguientes conceptos o roles: propietario del recurso o resource owner, cliente o client, servidor de recursos o resource server, servidor de autorización o authorization server. El propietario del recurso es el usuario registrado en la aplicación externa que tiene acceso a datos restringidos del servidor de recursos. El cliente es la aplicación, en este caso la Skill de Alexa, que desea acceder a la cuenta del propietario del recurso. Primeramente, el cliente debe autenticarse a través del servidor de autorización utilizando las credenciales de usuario del propietario de recursos para obtener acceso al servidor de recursos. El servidor de recursos es el servidor donde se alojan los servicios a los que el usuario quiere acceder. El servidor de autorización, que puede ser el mismo que el servidor de recursos, es el encargado de autenticar la identidad del propietario de recursos y entregar el token de acceso oportuno. Este token es el necesario para acceder a los datos y servicios ofrecidos por el servidor de recursos. El servidor de recursos aloja por tanto las cuentas de usuario y el servidor de autorización verifica la identidad del usuario y en caso de éxito genera el token de acceso a la aplicación.

![OAuth 2.0](https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/accountlinking.png)

Este es el flujo genérico del proceso, sin embargo, variará ligeramente dependiendo del tipo de autorización utilizado. El tipo de concesión de la autorización depende del método utilizado por el cliente para solicitar dicha autorización y de los tipos de autorización soportados por el propio servidor de autorización. OAuth 2.0 define distintos tipos de autorización, de los cuales Alexa ofrece autorización por código o Code Grant y autorización implícita o Implicit Grant.

Configuración de una Custom Skill para permitir vinculación de cuentas
----------------------------------------------------------------------

Para realizar la vinculación de cuentas el usuario deberá seguir por tanto una serie de indicaciones en la aplicación de Alexa para iniciar sesión en el servicio propio de la aplicación externa desde Alexa. Una vez el usuario se ha autenticado en este servicio externo a través de la aplicación de Alexa, las peticiones enviadas a nuestra Skill, que tienen formato JSON, además de incluir datos propios de la Intent que se ha generado o el valor de los Slots detectados, incluirán un token que podrá ser usado en la lógica implementada en nuestra función Lambda para identificar al usuario en el flujo de peticiones hacia el servidor externo.

De esta manera, el desarrollador de la Skill debe configurar la misma para permitir la vinculación de cuentas y conseguir conectar así el servicio de Alexa con la aplicación externa correspondiente. Como se ha mencionado anteriormente, la vinculación de cuentas para una Skill de desarrollo personalizado sigue el estándar OAuth 2.0 y puede ser de dos tipos: Code Grant o Implicit Grant. Se trata de dos formas distintas de autorizar al usuario a acceder a los servicios de un sistema externo y por tanto de la obtención del token requerido. Además, en este tipo de Skills, los usuarios pueden utilizar ciertos servicios sin necesidad de vincular la cuenta, de forma que la Skill puede ofrecer funcionalidad que requiera autenticación o no. Si todos los servicios de la Skill necesitan de un token válido para acceder a los datos pertinentes, la vinculación de cuentas se marcará como obligatoria en la consola de desarrollador de Alexa.

Para completar correctamente la vinculación de cuentas entre Alexa y la aplicación externa inicialmente debemos configurar la vinculación de cuentas en la consola de desarrollador de Alexa en la sección Build > Account Linking.

Marcamos la opción de permitir precisamente a un usuario crear dicha vinculación de cuentas con una cuenta de un servicio externo a Alexa. Solamente en caso de que nuestra Skill ofrezca funcionalidades que no requieran de autenticación de usuario, marcamos también la opción destinada a esta situación. Finalmente editamos los campos necesarios para configurar la autorización de tipo Implicit Grant o Code Grant.

Respecto al primer caso, la autorización implícita es la más sencilla y utilizada preferentemente en aplicaciones cuyo token de acceso no expira, ya que tan solo se pedirá el token al comienzo de la vinculación. Trabajando con este tipo de concesión de autorización, nos encontramos primeramente con el campo Authorization URI, que se refiere a la URI a la que será redirigido el usuario cuando realice el proceso de vinculación de cuentas a través de la aplicación de Alexa. En esta URI deberá encontrarse, sobre HTTPS, la página que permita iniciar sesión en la aplicación externa. El Client ID es el identificador único utilizado para diferenciar los distintos clientes, es decir, las diferentes Skills, que puedan requerir de un token de acceso de un mismo sistema. Parámetros que serán enviados en la query de esta dirección serán: el Client ID (client\_id); el tipo de respuesta (response\_type) que se espera recibir, en este caso será un token; el estado (state), que se trata de un valor utilizado internamente por los servicios de Alexa para identificar al usuario en el proceso de vinculación de cuentas; la URI a la que redireccionar (redirect\_uri) la respuesta obtenida tras el logueo.

Seguidamente debemos añadir los servicios necesarios en la API REST de nuestro servidor de autorización para permitir el inicio de sesión desde la aplicación Alexa que atienda a peticiones hacia la Authorization URI, del tipo:

```
https://miaplicacion.es/auth/o2/token?client_id=CLIENT_ID&response_type=token&state=STATE&redirect_uri=https://layla.amazon.com/spa/skill/account-linking-status.html?vendorId=MC40B5RDWUNFM
```

Este servicio deberá mostrar la pantalla de login y comprobar si la autenticación del usuario es correcta para devolver en la respuesta, en caso de que sea satisfactoria, el token e información requerida para poder realizar posteriores peticiones al servidor de recursos identificándose como un usuario específico. Esta respuesta proveniente de nuestra pantalla de login es dirigida concretamente a la Redirect URI con la información necesaria en los parámetros de la query (el token, el tipo de token y el estado). Por ejemplo:

```
https://layla.amazon.com/spa/skill/account-linking-status.html?vendorId=MC40B5RDWUNFM#state=STATE&access_token=ACCESS_TOKEN&token_type=Bearer
```

Finalmente debemos modificar el código de la función Lambda para recuperar el token que Alexa ha guardado. Este token se encuentra en el objeto JSON que se recibe en cada petición que el usuario hace a Alexa sobre esta Skill y deberá ser utilizado para autenticarse en cada petición a la API REST del servidor de recursos de nuestra aplicación externa.

```javascript
const accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
const options = {
  timeout: "6500",
  headers: {
    "Authorization": "Bearer " + accessToken
  }
};
axios.get("https://miaplicacion.es/" + path, options);
```

Para el caso en que se utilice una autorización de tipo Code Grant, la aplicación de Alexa mostrará la página de inicio de sesión utilizando la Authorization URI encontrada en la configuración de la Skill cambiando el tipo de respuesta esperada (response\_type) por code.

```
https://miaplicacion.es/auth/o2/code?client_id=CLIENT_ID&response_type=code&state=STATE&redirect_uri=https://layla.amazon.com/api/skill/link/MC40B5RDWUNFM
```

El servidor de autorización comprobará las credenciales de usuario y en caso de éxito devolverá un código de autorización en lugar de un token directamente. El servidor de autorización redirige por tanto al usuario a la Redirect URI proporcionada en la query de la anterior petición y envía de vuelta el estado y el código de autorización en la query de la URL.

```
https://layla.amazon.com/api/skill/link/MC40B5RDWUNFM?state=STATE&code=CODE
```

El servicio de Alexa usa este código para solicitar un token de acceso (y opcionalmente un token de actualización o refresh token), incluyendo a su vez en la petición el secreto del cliente (client\_secret), que se trata de una clave conocida y compartida por este cliente que es la Skill de Alexa y la aplicación externa. Esta solicitud se envía utilizando el método POST de HTTP a una nueva URI, la Access Token URI, encontrada también en la configuración de la vinculación de cuentas de la Skill.

```
https://miaplicacion.es/auth/o2/code/token?client_id=CLIENT_ID&client_secret=CLIENT_SECRET&grant_type=authorization_code&code=CODE&redirect_uri=https://layla.amazon.com/api/skill/link/MC40B5RDWUNFM
```

Este servicio es atendido de nuevo por el servidor de autorización, que debe responder de vuelta con un objeto JSON a la Redirect URI, rescatada de la petición previa recibida, en un tiempo máximo de 4,5 segundos. Si la autenticación es correcta, este servidor enviará en la respuesta el token de acceso y opcionalmente un refresh token.

```
https://layla.amazon.com/api/skill/link/MC40B5RDWUNFM?state=STATE
{
  "access_token": "2YotnFZFEjr1zCsicMWpAA",
  "expires_in": 600,
  "token_type": "bearer",
  "refresh_token": "XZF2jt431KPT36qpLpH2AQ"
}
```

Alexa guarda los tokens recibidos e incluye el token de acceso en cada petición que el usuario le haga a su Amazon Echo en esta Skill. En caso de que este token expire, Alexa solicita de nuevo al servidor de autorización un nuevo par de tokens a través de la Access Token URI y utilizando el refresh token.

Una vez que la cuenta de Alexa está vinculada a la cuenta propia del servicio externo, la Skill está lista para su uso. Además, podremos acceder ahora a la sección Analytics > Skill Activation para observar o analizar las métricas que representan esta vinculación de cuentas, pudiendo encontrar por ejemplo el número total de veces que se ha abierto una sesión.

Vinculación de cuentas por parte del usuario
--------------------------------------------

Lo siguiente para completar la vinculación de cuentas está en manos del usuario. Desde la aplicación de Alexa, accediendo al panel de nuestras Skills, Skills y juegos > Mis Skills > Desarrollador, es posible entrar en nuestra Skill para completar su configuración.

Al seleccionar el botón de “Permitir su uso” estamos comenzando el proceso de vinculación de cuentas. Para completar este proceso debemos seleccionar Configuración > Vincular cuenta. Es entonces cuando se maneja la configuración detallada en la consola de desarrollador de Alexa relativa a la Authorization URI con intención de redirigir adecuadamente al usuario a la pantalla de login de la aplicación externa. El usuario introduce entonces sus credenciales propias de la cuenta registrada en esta aplicación externa y, en caso de resultar una autenticación correcta, Amazon Alexa mostrará un mensaje sobre la vinculación correcta de nuestra Skill.

> “As the world is increasingly interconnected, everyone shares the responsibility of securing cyberspace”
>
> ###### Newton Lee