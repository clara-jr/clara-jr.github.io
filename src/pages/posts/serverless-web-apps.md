---
layout: ../../layouts/PostLayout.astro
title: 'Serverless Web Apps 👩🏻‍💻'
pubDate: 2020/06/11
description: 'Aplicaciones web sin servidor… ¿Perdona? ¿Cómo que “sin servidor”?'
author: 'Clara Jiménez'
image:
    url: '/images/posts/awsgateway.png' 
    alt: 'Serverless Web Apps'
tags: ["aws", "serverless"]
---
A la hora de alojar una aplicación web en un servidor y hacerla pública, si no dispones de tus propios servidores y sistemas de seguridad, el método más útil es recurrir a aplicaciones serverless o sin servidor, además de las múltiples soluciones XaaS existentes. Esto nos permitirá crear y ejecutar aplicaciones o servicios sin tener que “preocuparnos” de los servidores, lo cual no quiere decir que no existan. Externalizamos los servicios de administración de los servidores que alojen nuestra aplicación. De esta manera, los programadores podemos enfocarnos en el código de nuestra aplicación sin preocuparnos por la configuración y administración de los servidores. Pero, ¿en qué servidores puedo alojar mis aplicaciones? Pues, sin duda, hay multitud de posibilidades diferentes.

Desde GitHub Pages hasta AWS
----------------------------

Para aplicaciones web estáticas suele utilizarse Netlify o GitHub Pages. En caso de sitios web estáticos como blogs, en esta segunda opción podríamos utilizar además Jekyll. Para aplicaciones web que requieran de un backend e incluso de una base de datos, podemos recurrir a hostings como Heroku, Digital Ocean, Google Cloud o Amazon. Y, concretamente, en este último caso, podemos abordar a su vez el despliegue de nuestra aplicación de múltiples formas, dentro de las cuales podremos utilizar componentes de Amazon Web Services como AWS Amplify, Lambda Function, API Gateway, GraphQL, AppSync, DynamoDB, Amazon S3, Amazon Cognito, Elastic Beanstalk, Amazon EC2, Amazon Lightsail, AWS Fargate, Amazon SNS, Route 53, etc. Según nuestros requerimientos, decidiremos utilizar uno o varios de estos elementos si alojamos nuestro sitio web en AWS. Otros servicios de hosting para mí no tan conocidos son GoDaddy, LiquidWeb, Vultr, BlueHost, Vercel o Firebase. Algunas de estas opciones podrán requerir de un pago puntual o mensual según las necesidades de la aplicación que vayamos a alojar. Sin embargo, para un sitio web personal y de requisitos mínimos, plataformas como GitHub Pages, Netlify, Heroku, Google Cloud o Amazon pueden disfrutarse perfectamente dentro de su capa gratuita. GitHub Pages, de hecho, es totalmente gratuito. Si nuestra aplicación es estática, estamos de suerte con esto, y si no, podremos alojar el frontend de nuestra aplicación en GitHub Pages y hacer peticiones a una API alojada en otro cloud hosting. Eso sí, tendremos que asegurarnos de habilitar el intercambio de recursos de origen cruzado, conocido como CORS. Bueno, pues este cloud hosting para nuestro backend podría tratarse de algún o algunos componentes de Amazon; e incluso podríamos alojar nuestro frontend de la mano de Amazon también. Veamos algunas de las posibilidades que tendríamos en este caso.

API Gateway + Lambda Function + S3 + DynamoDB + Amazon Cognito
--------------------------------------------------------------

Azúcar, especias, y muchas cosas bonitas fueron los ingredientes escogidos para crear… bueno, no son especias, ni azúcar, pero cosas bonitas igual sí: API Gateway, Lambda Function, Amazon S3, DynamoDB y Amazon Cognito.

Según las necesidades que tengamos para desplegar nuestra aplicación necesitaremos utilizar todos estos componentes o quizás sólo algunos de ellos.

![AWS API Gateway & Lambda](/images/posts/awsgateway.png)

Amazon S3 podremos utilizarlo para almacenar el frontend de nuestra web, los ficheros con información estática (ReactJS, Angular, JavaScript, HTML, CSS, imágenes, etc.). Sin embargo, si decidimos utilizar GitHub Pages para esta parte, no necesitaremos recurrir a este elemento de AWS. En cualquier caso, este frontend realizará peticiones a una API REST que estará alojada en Amazon API Gateway con un endpoint determinado y en el que podremos definir métodos HTTP como GET, PUT, POST o DELETE.

En la función Lambda encontraremos el código a ejecutar para cada una de estas peticiones HTTP a nuestra API. Por tanto, debemos unir de alguna manera esta función Lambda con nuestra API, y esto se hará a través de un desencadenador o trigger, de forma que las peticiones realizadas desde el frontend a la API REST se redirigirán al código de nuestro backend situado en nuestra función Lambda.

En este backend, los datos podrán estar alojados de forma persistente en una base de datos NoSQL que, en AWS, podrá ser DynamoDB. Crearemos una tabla en DynamoDB y añadiremos las políticas necesarias en el rol de nuestra función Lambda para que esta pueda leer y escribir en la base de datos creada. El código alojado en nuestra función Lambda podrá ahora hacer las peticiones necesarias a nuestra base de datos DynamoDB, tanto de lectura como de escritura.

Por último, si necesitamos autenticación de usuario en nuestra aplicación podremos recurrir de forma fácil y rápida al uso de Amazon Cognito.

Todo este proceso de despliegue, además, puede verse reducido en tiempo y esfuerzo con la creación de ficheros YAML de configuración para el despliegue haciendo uso de Serverless framework[[1]](https://www.serverless.com).

AWS Amplify
-----------

Al desplegar una aplicación web en AWS Amplify, podremos indicar un proveedor Git del que obtener el código de nuestra aplicación que podrá ser GitHub, GitLab, BitBucket o AWS CodeCommit. Si no queremos usar un proveedor Git, podremos decidir desplegar el contenido de nuestra aplicación manualmente desde nuestra máquina en local o desde ficheros almacenados en Amazon S3 o en cualquier URL pública.

De esta manera, con AWS Amplify podemos alojar rápidamente proyectos estáticos creados en GitHub o incluso en local, y, a su vez, añadir una API REST o GraphQL que controle datos almacenados en DynamoDB. En caso de recurrir a una API REST, haremos uso de nuevo de Amazon API Gateway. Si decidimos optar por una API GraphQL, entrará en juego un nuevo componente llamado AWS APPSync, que permitirá a su vez utilizar un método de subscripción a cambios en la base de datos y actualizar así la interfaz web en tiempo real (real-time UI).

![AWS Amplify](/images/posts/awsamplify.png)

AWS Elastic Beanstalk + DynamoDB
--------------------------------

Por último, voy a hablaros de Amazon EC2, y concretamente, su integración con AWS Elastic Beanstalk que, en este caso, se trata de un PaaS, a diferencia de los componentes serverless como API Gateway y Lambda. Para este tipo de despliegue de aplicaciones, tanto el frontend como el backend se podrán alojar en instancias de Amazon EC2, pudiendo tener una aplicación web completa alojada en un mismo lugar, basada por ejemplo en ReactJS, Node.js y Express; además podríamos disponer de nuevo de una base de datos NoSQL haciendo uso de DynamoDB. También, haciendo uso de Amazon SNS podemos publicar notificaciones para controlar el mantenimiento de la web.

![AWS Elastic Beanstalk](/images/posts/awsbeanstalk.png)

Amazon EC2 es un servicio de Amazon utilizado para crear y ejecutar máquinas virtuales en la nube, lo que se denominan instancias de máquinas virtuales. Estas máquinas virtuales incluirán un sistema operativo determinado por el usuario e incluso podrán ser creadas con aplicaciones integradas. A parte del sistema operativo pueden escogerse otra serie de características sobre el procesador, el número de CPUs virtuales, la memoria o la velocidad de transferencia de datos. Con Elastic Beanstalk, podremos simplificar el despliegue del código de nuestra aplicación en instancias EC2, encargándose Elastic Beanstalk automáticamente del proceso.

Finalmente, podemos utilizar en cualquier caso Amazon Route 53 para asociar un dominio a nuestra aplicación web, direccionando adecuadamente el tráfico de Internet a nuestro sitio web usando un dominio específico.

Otras múltiples formas de alojar una aplicación web en los servicios en la nube de Amazon pueden ser Amazon Fargate, para el despliegue de aplicaciones paquetizadas en contenedores, o Amazon Lightsail, donde podremos alojar aplicaciones basadas en Wordpress o Drupal, o incluso en el stack MEAN con facilidad, pero pagando una mensualidad.

> “The cloud is for everyone. The cloud is a democracy.”
>
> ###### Marc Russell Benioff