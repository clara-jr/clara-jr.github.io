---
layout: ../../layouts/PostLayout.astro
title: 'Mover la lógica de una Alexa-Hosted Skill a una función Lambda en AWS 👩🏻‍💻'
pubDate: 2020/05/06
description: 'Las Alexa-Hosted Skills nos permiten desarrollar una Skill de Alexa end-to-end haciendo uso de la capa gratuita de AWS pero, ¿y si necesitamos más?'
author: 'Clara Jiménez'
image:
    url: 'https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/lambda3.png' 
    alt: 'Alexa Skill Lambda'
tags: ["aws", "alexa"]
---
Lo más sencillo y directo a la hora de crear una Skill de Alexa es hacerlo todo a través de la consola de desarrollo de Alexa, donde describiremos siempre el Voice Interaction Model o Modelo de Interacción Vocal, y además, podemos describir también la lógica de la Skill. Esto es lo que llamamos una Alexa-Hosted Skill. Servicios alojados en AWS son ofrecidos por Amazon, como una función Lambda para la implementación de la lógica de nuestra Skill o espacio en Amazon S3 para almacenamiento de atributos persistentes. Desarrollar una Skill de este modo es totalmente gratuito para el desarrollador; sin embargo, tan sólo incluye los servicios limitados por la capa gratuita de AWS. Estos servicios son:

Lambda Function: 1 millón de peticiones a la función Lambda y 400 mil segundos de procesamiento al mes.

Amazon S3: 5 GB de almacenamiento en S3, 20 mil solicitudes de lectura al mes, 2 mil solicitudes de escritura al mes y 15 GB/mes de transferencia de datos.

AWS CodeCommit: 50 GB/mes de almacenamiento de versiones de código y 10 mil solicitudes Git al mes.

Generalmente, estos limites pueden ser suficientes para el desarrollo de una Skill y su mantenimiento pero, en caso de no serlo, deberíamos cambiar el backend de nuestra Skill, la lógica, a una función Lambda propia de nuestra cuenta particular de AWS. Si nos pasamos de los límites ofrecidos por la capa gratuita de AWS, esto supondrá un coste a cargo de nuestra cuenta. Sin embargo, Amazon promueve un gran número de sistemas de recompensas y podemos registrarnos para llegar a obtener, por ejemplo, 100 $ de crédito para AWS al mes.

¿Cómo trasladar el código de la consola de desarrollo de Alexa a la función Lambda en AWS?
------------------------------------------------------------------------------------------

A medida que los desarrolladores de Amazon avanzan en este terreno de actualidad que son las Alexa Skills, se descubren necesidades y actualizaciones que nos permiten avanzar en la creación más rápida y enriquecedora de Alexa Skills.

Una de las herramientas añadidas en últimas actualizaciones fue la posibilidad de descargar el código de la lógica de una Alexa-Hosted Skill de la consola de desarrollo e insertarlo cargando un fichero comprimido en la función Lambda de nuestra cuenta de AWS.

El primero de los pasos intermedios que habría que realizar en este traspaso de código sería instalar en local las dependencias necesarias propias de nuestra Skill. En una Skill desarrollada en Node.js, nos referimos a los paquetes de la carpeta node\_modules indicados en nuestro fichero package.json que harán funcionar nuestra Skill. Para ello necesitaremos tener instalado npm, el sistema de gestión de paquetes por defecto para Node.js. Una vez instalado, ejecutamos el comando para la instalación de dependencias:

```bash
npm install
```

El siguiente paso sería introducir la verificación del ID de nuestra Skill en el código de la misma, a través del método SkillBuilder.withSkillId en la configuración de la instancia de nuestra Skill. De este modo, el código de la Skill rechazará cualquier solicitud no proveniente de una Skill cuyo ID sea equivalente al representado en este método como parámetro.

```javascript
Alexa.SkillBuilders.custom().withSkillId([ID])
```

El ID de nuestra Skill se muestra en la consola de desarrollo de Alexa, tanto en el listado de Skills como en la sección Build, en el apartado Endpoint.

![Alexa Skill Lambda](https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/lambda1.png)

Ahora ya podemos volver a crear nuestro fichero comprimido incluyendo estas dependencias, es decir, la carpeta node\_modules trabajando con Node.js, y cargarla en nuestra función Lambda previamente creada en AWS. Esta función Lambda puede haber sido creada perfectamente como una función “Desde Cero”.

![Alexa Skill Lambda](https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/lambda2.png)

Una vez creada la función Lambda y habiendo desplegado en ella el código de la lógica de nuestra Skill, es momento de terminar de conectar nuestra lambda con el Modelo de Interacción Vocal de nuestra Skill en la consola de desarrollo de Alexa. Para esto, debemos añadir un desencadenador o trigger del tipo Alexa Skills Kit a nuestra Lambda e introducir en él el ID de nuestra Skill.

![Alexa Skill Lambda](https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/lambda3.png)

![Alexa Skill Lambda](https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/lambda4.png)

Finalmente, debemos editar el endpoint de nuestra Skill en la sección Build de la consola de desarrollo, en el apartado Endpoint. Introducimos en este campo el Amazon Resource Name (ARN) de nuestra función Lambda, que lo encontraremos en AWS, en la parte de arriba a la derecha de la página de configuración de nuestra Lambda.

![Alexa Skill Lambda](https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/lambda5.png)

Trabajar con versiones y alias para entornos de producción y desarrollo en AWS
------------------------------------------------------------------------------

Lo que he contado hasta ahora supondría la existencia de una única versión de nuestra función Lambda tanto para producción como para desarrollo. Sin embargo, a lo largo de la vida útil de una Skill necesitaremos revisarla y hacer cambios que deberemos probar antes de publicarlos.

Para esto, necesitaremos tener un endpoint al que apunte nuestra Skill publicada y otro diferente para apuntar desde nuestra Skill en desarrollo. Sin embargo, ahora sólo disponemos de un endpoint asociado al ARN por defecto (Incompleto o Unqualified), el cual está conectado con la versión $LATEST. Para disponer de varios endpoints tendremos que crear nuevos alias y asociar estos a distintas versiones. No nos olvidemos tampoco de configurar el trigger Alexa Skills Kit para cada uno de los alias que creemos.

![Alexa Skill Lambda Versions](https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/lambda7.png)

![Alexa Skill Lambda Versions](https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/lambda8.png)

El ARN del alias que utilicemos para publicar nuestra Skill deberá apuntar a una versión estable y estática, mientras que, podremos utilizar un segundo alias para nuestra Skill en desarrollo que, apuntando a una versión distinta, podamos editar y probar sin modificar la Skill publicada.

Empecemos por tanto creando un alias para la primera publicación de nuestra Lambda, lo llamaremos “Alias 1” y quedará apuntando a la versión $LATEST. El endpoint al que vincularemos nuestra Skill en desarrollo será, por tanto, el ARN del alias “Alias 1”. Ponemos a punto nuestra versión $LATEST y mandamos nuestra Skill al proceso de certificación. Una vez publicada, estará vinculada al “Alias 1”, y no podrá cambiarse esta vinculación a no ser que pretendamos pasar otra vez el proceso de certificación.

![Alexa Skill Lambda Alias](https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/lambdaalias1.png)

Pues bien, podemos crear ahora una nueva versión a la que llamaremos “Versión 1”, con el mismo contenido que la versión $LATEST, y podemos tomar la decisión de editar el alias “Alias 1” para que apunte a esta versión, la cual será una versión estable que a su vez debe ser estática, no es modificable. Tendremos así el código de nuestra Skill pública congelado en el alias “Alias 1” que lleva por versión “Versión 1”.

Podemos crear ahora un nuevo alias para el endpoint de nuestra Skill en desarrollo al que llamaremos “Alias 2” y vincularlo a la versión $LATEST, la cual sí podremos modificar tranquilamente para testear cambios en nuestra Skill sin estropear nuestra Skill en producción.

![Alexa Skill Lambda Alias](https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/lambdaalias2.png)

Una vez que la nueva versión es estable con los nuevos cambios añadidos, podemos publicar una versión “Versión 2” y cambiar la versión a la que apunta el “Alias 1”, endpoint de nuestra Skill pública. Habremos actualizado nuestra Skill en producción sin necesidad de pasar un proceso de certificación.

En caso de realizar cambios a su vez en el Modelo de Interacción Vocal, sí deberemos pasar por el proceso de certificación y, por tanto, el endpoint de nuestra Skill publicada cambiará cuando la Skill que estaba en desarrollo sea aceptada, pasando a apuntar a la versión $LATEST del alias “Alias 2”. Una vez pasado el proceso de certificación y publicada nuestra Skill con este nuevo endpoint apuntando al ARN del alias “Alias 2” con la versión $LATEST, podemos publicar exitosamente una versión estable con nombre “Versión 2” y dejar este alias estático vinculándolo a esta versión. El “Alias 1” lo apuntaremos ahora hacia la versión $LATEST, siendo así esta versión la que editemos siempre en desarrollo y, ahora, el “Alias 1” será el que representará el endpoint de nuestra Skill en desarrollo y el “Alias 2” nuestra Skill en producción.

![Alexa Skill Lambda Alias](https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/lambdaalias3.png)

También podríamos optar por generar un nuevo alias por cada versión que publiquemos. Sin embargo, tan sólo con dos alias y, aplicando un intercambio adecuado de versiones, podemos ser perfectamente capaces de tener nuestros dos entornos de desarrollo y producción.

Manejo de datos persistentes con AWS
------------------------------------

En una Alexa-Hosted Skill, si queríamos trabajar con datos persistentes debíamos hacer uso de Amazon S3. Sin embargo, con nuestra propia función Lambda podemos recurrir a DynamoDB. Para ello, debemos completar la creación de nuestra función Lambda con la edición de las políticas del rol que esta tiene o la creación de nuevas políticas que le permitan el acceso a DynamoDB.

En la sección de Permisos de nuestra función Lambda podemos abrir el rol que tiene asignado nuestra función, y editar las políticas que tiene asociadas, añadiendo a estas los permisos necesarios para la lectura y escritura de datos persistentes almacenados en DynamoDB.

![Alexa Skill Lambda DynamoDB](https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/lambda6.png)

Podemos añadir, por ejemplo, las siguientes acciones a la política de nuestro rol de ejecución:

```json
{
  "Effect": "Allow",
    "Action": [
      "dynamodb:CreateTable",
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
      "dynamodb:Scan",
      "dynamodb:Query",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem"
    ],
    "Resource": "arn:aws:dynamodb:*:*:table/[TABLE_NAME]"
}
```

La tabla cuyo nombre debemos insertar en \[TABLE\_NAME\] deberemos crearla manualmente en AWS en DynamoDB o bien programáticamente mediante código en nuestra función Lambda.

En la capa gratuita de DynamoDB tendremos los siguientes servicios:

25 GB de almacenamiento de datos.

1 GB/mes de transferencia saliente de datos (15 GB/mes en los primeros 12 meses), acumulado para los servicios de AWS.

25 WCU y 25 RCU de capacidad aprovisionada.

25 rWCU para tablas globales implementadas en dos regiones de AWS.

2.5 millones de solicitudes de lectura de stream de DynamoDB Streams.

> “I like crossing the imaginary boundaries people set up between different fields — it’s very refreshing. There are lots of tools, and you don’t know which one would work. It’s about being optimistic and trying to connect things.”
>
> ###### Maryam Mirzakhani