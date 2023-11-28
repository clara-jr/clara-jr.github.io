---
layout: ../../layouts/PostLayout.astro
title: 'Dockerizar aplicaciones web en Node.js 👩🏻‍💻'
pubDate: 2021/01/19
description: '"Pues en mi máquina funciona"'
author: 'Clara Jiménez'
image:
    url: '/images/posts/docker.png' 
    alt: 'Docker'
tags: ["docker", "javascript"]
---
¿Qué es Docker?
---------------

Docker es un proyecto de código abierto para automatizar el despliegue de aplicaciones dentro de contenedores sobre cualquier infraestructura y sistema operativo. Una aplicación dentro de un contenedor dispondrá de todas las dependencias necesarias para su funcionamiento independientemente de en qué máquina se ejecute el contenedor.

Componentes de Docker
---------------------

Demonio: construye las imágenes, crea, ejecuta y monitoriza los contenedores según las peticiones recibidas del cliente.

Cliente: intermediario entre el usuario y el demonio; el cliente de Docker sería la línea de comandos, además, la API de comunicación con el demonio de Docker permite desarrollar fácilmente un cliente particular para interactuar con el demonio.

Registros: almacenan las imágenes en repositorios públicos o privados; el Registry predeterminado de Docker es Docker Hub pero podemos crear también un Registry propio.

![Docker](/images/posts/docker.png)

Imágenes y contenedores
-----------------------

Una imagen es un conjunto de ficheros que reúne todos los elementos y dependencias necesarias para ejecutar una aplicación. No tienen estado y nunca cambian, son fijas. Al ejecutar una imagen se genera un contenedor que sí tiene estado y es variable.

Un contenedor es una estancia en ejecución de una imagen. A partir de una misma imagen puedo ejecutar uno o varios contenedores. Las capas de una imagen son de lectura y el contenedor genera una capa sobre ellas de escritura.

Para crear un contenedor a partir de una imagen ejecutaremos lo siguiente:

```bash
docker run [IMAGE_NAME]:[VERSION] --name [CONTAINER_NAME]
```

Creación de imágenes
--------------------

En lugar de crear contenedores a partir de imágenes ya existentes, podemos generar nuestras propias imágenes trasladando el contexto en que nos encontremos (carpetas, ficheros, etc.) al demonio de Docker.

Para esto tendremos un fichero de configuración Dockerfile para construir la imagen y un fichero .dockerignore que determinará qué partes del contexto querremos ignorar en la creación de la imagen.

El fichero de configuración llamado Dockerfile[\[1\]](https://docs.docker.com/engine/reference/builder/) es un archivo de texto plano que contiene las instrucciones a ejecutar para que la imagen se cree correctamente. Debemos indicar en estas instrucciones cuál será la imagen base, comandos para ejecutar dentro de la imagen base, archivos para incluir en ella, dependencias, puertos a abrir, etc.

Una serie de buenas prácticas[\[2\]](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#dockerfile-instructions) en la descripción de este fichero empiezan por la optimización de las instrucciones que escribimos en él. Conviene encadenar comandos en una sola instrucción (un solo RUN) para crear una única capa con todas las instrucciones y no una capa por cada instrucción. Tampoco debemos instalar paquetes innecesarios y deberemos minimizar el contenido que trasladaremos al demonio de Docker a lo estrictamente necesario usando .dockerignore. Como siempre, tenemos que tener en cuenta el orden de nuestro código también en este fichero, facilitando así su mantenimiento y la realización de futuros cambios necesarios.

Para crear una imagen, dentro del directorio donde se encuentra el fichero de configuración Dockerfile ejecutamos lo siguiente:

```bash
docker image build -t [IMAGE_NAME]:[VERSION] .
```

Siendo IMAGE_NAME y VERSION el nombre y la versión respectivamente que queremos darle a la imagen que vamos a crear.

Aplicaciones multicontenedor con Docker Compose
-----------------------------------------------

Docker Compose es una herramienta para definir y ejecutar aplicaciones Docker multicontenedor. Con Docker Compose, se utiliza un fichero YAML denominado docker-compose.yml[3] para configurar los servicios de la aplicación.

En vez de conectar contenedores, lo que haremos con Docker Compose será relacionar imágenes para administrar la aplicación de una manera más sencilla. Los contenedores con Docker Compose pasan a denominarse servicios. Básicamente Docker Compose es una herramienta de Docker para trabajar con microservicios.

Con un único comando se crean y arrancan todos los servicios a partir de la configuración del fichero docker-compose.yml:

```bash
docker-compose up
```

Generar contenedor Docker para una aplicación web en Node.js
------------------------------------------------------------

Cuando lanzamos un servidor web con Node.js, para desplegar la aplicación adecuadamente lo que hacemos es lanzar un servidor HTTP en un puerto determinado, instalar las dependencias necesarias para la aplicación descritas en el fichero package.json y arrancar nuestra aplicación. Pues bien, estos son básicamente los pasos que debemos incluir en nuestro Dockerfile.

Primero, con la instrucción FROM seleccionamos la imagen de Node.js de Docker Hub de la que partiremos. Esta imagen incluirá Node.js y npm. Seguidamente, creamos en nuestra imagen el directorio que contendrá el código de nuestra aplicación con la instrucción WORKDIR. Copiamos los ficheros de nuestro contexto en local al demonio de Docker con COPY y, teniendo así el fichero package.json, podemos ejecutar la instrucción de instalación de las dependencias con npm haciendo uso de la instrucción RUN. Ahora debemos informar a Docker en qué puerto escuchará nuestro contenedor con la instrucción EXPOSE. Por defecto, este puerto atenderá peticiones sobre TCP, pero puede describirse para que lo haga también sobre UDP. Esta instrucción no haría público este puerto desde fuera del contenedor, para esto deberemos utilizar el indicador -p en la ejecución del comando de creación del contenedor para publicar los puertos que necesitemos y asociarlos a los mismos u otros en nuestra máquina local. Finalmente, definimos el comando de ejecución de nuestra aplicación con la instrucción CMD.

```dockerfile
# Dockerfile

# Image with node and npm from Docker Hub
FROM node:10
# Create app directory
WORKDIR /usr/src/app
# Bundle app source
COPY . .
# Install app dependencies
RUN npm install
# Run app
EXPOSE 8080
CMD [ "node", "app.js" ]
```

Ahora ya podemos crear nuestra imagen y arrancar el contenedor asociado a ella con nuestra aplicación en Node.js:

```bash
docker build -t [IMAGE_NAME] .
docker run --name [CONTAINER_NAME] -p 8080:8080 -t -d [IMAGE_NAME]
```

En http://localhost:8080 tendremos nuestra aplicación.

Aplicación multicontenedor con varias instancias de Node.js
-----------------------------------------------------------

Ahora que sabemos dockerizar una aplicación web en Node.js podemos extrapolar la situación a la creación de una aplicación multicontenedor alojando varias instancias de Node.js que puedan incluso comunicarse entre ellas. Para esto necesitaremos generar un fichero docker-compose.yml con las instrucciones necesarias para lanzar varios servicios. Pensemos, por ejemplo, en desplegar dos instancias de Node.js con aplicaciones que interactúen en una arquitectura cliente-servidor. El servidor escuchará por ejemplo en el puerto 8181 peticiones recibidas por el cliente, al cual un usuario podrá acceder en el puerto 8080. Podremos definir que el cliente necesita que el servidor se genere previamente con la opción depends_on. Con la opción ports exponemos los puertos que estarán públicos para el usuario, especialmente en el servicio asociado al cliente. En la opción build determinamos la ruta en la que se encuentra el contexto de cada servicio, junto con su fichero propio Dockerfile.

```yml
# docker-compose.yml

version: '3.8'
services:
  client:
    container_name: client-container
    build: ./client
    depends_on:
      - server
    ports:
      - "8080:8080"
    restart: on-failure
  server:
    container_name: server-container
    build: ./server
    ports:
      - "8181:8181"
    restart: on-failure
```

Finalmente, en los directorios que definen cada uno de estos contenedores o servicios, encontraremos un fichero Dockerfile similar al descrito anteriormente para una única aplicación en Node.js. Únicamente deberemos cambiar la instrucción EXPOSE para exponer en cada caso el puerto correspondiente, 8080 en el cliente y 8181 en el servidor, y la instrucción WORKDIR, generando cada uno un directorio distinto para el cliente y el servidor respectivamente: WORKDIR /usr/src/app/client y WORKDIR /usr/src/app/server.

Ahora ya podemos crear nuestras imágenes y arrancar nuestros servicios asociados a ellas con Docker Compose:

```bash
docker-compose up -d
```

De nuevo podremos visitar nuestra aplicación ingresando la dirección http://localhost:8080 en un navegador. La opción -d arrancará los servicios en segundo plano y los dejará funcionando.

> “Docker allows you to package an application with all of its dependencies into a standardized unit for software development.”
>
> ###### Docker