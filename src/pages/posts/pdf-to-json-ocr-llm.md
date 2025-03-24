---
layout: ../../layouts/PostLayout.astro
title: 'Procesar documentos con IA generativa 👩🏻‍💻'
pubDate: 2025/03/21
description: '¿Cómo podemos extraer información estructurada de un documento? ¿Son los LLMs la única solución? ¿Y si alucinan 😵?'
author: 'Clara Jiménez'
image:
    url: '/images/posts/pdf-to-json.png' 
    alt: 'PDF to JSON'
tags: ["llm", "generative ai", "machine learning", "javascript"]
---
Para extraer información estructurada de PDFs y convertirla en JSON:

- Si el PDF está formado por texto podríamos usar un parseador de PDFs como [`pdf-parse`](https://www.npmjs.com/package/pdf-parse) seguido de expresiones regulares para sacar la información concreta del texto y transformar este en un objeto JSON. En lugar de expresiones regulares podríamos hacer uso también de un modelo de NLP (Natural Language Processing) que aplique NER (Named-Entity Recognition) para identificar los campos que nos interesen (fechas, importes monetarios, etc.).

- Si el PDF es una imagen escaneada, podríamos transformar el PDF en una imagen y utilizar un OCR (Optical Character Recognition), como puede ser [Tesseract](https://tesseract-ocr.github.io/) (open-source y gratuito) o [Amazon Textract](https://aws.amazon.com/es/textract/) (closed-source y de pago), seguido de nuevo de expresiones regulares o de un modelo de NLP para sacar la información concreta y construir un objeto JSON.

- En ambos casos podríamos recurrir directamente a un LLM (Large Language Model) multimodal incluyendo un prompt y el contenido del PDF. Finalmente, podremos comprobar los campos recibidos haciendo uso también de expresiones regulares para evaluar si tienen el formato correcto; en caso de que algún campo parezca incorrecto, se podrá afinar la respuesta final retornando los campos problemáticos de nuevo al LLM para que los corrija.

![PDF to JSON](/images/posts/pdf-to-json.png)

## PDF parser + Regular Expressions

Si el PDF está formado por texto, basta recurrir a un parseador de PDFs como puede ser [`pdf-parse`](https://www.npmjs.com/package/pdf-parse) para transformar dicho PDF en un string con su contenido.

```javascript
import fs from 'node:fs';
import parsePDF from 'pdf-parse';

async function extractTextFromPDF (path) {
  const buffer = fs.readFileSync(path);
  const { text } = await parsePDF(buffer);
  return text;
}

async function processPDF () {
  const text = await extractTextFromPDF('test.pdf');
  const json = extractFieldsFromText(text);
  return json;
}

processPDF();
```

Para extraer los campos del texto, y obtener así un objeto JSON, podemos usar expresiones regulares.

```javascript
function extractFieldsFromText (text) {
  const amounts = text.match(/€\s?(\d+(?:\.\d{2})?)/g) ?? []; // € N.NN
  const dates = text.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? []; // YYYY-MM-DD
  return {
    date: dates[0] ?? null,
    amount: amounts[0] ? parseFloat(amounts[0].replace('€', '').trim()) : null,
  }
}
```

## OCR + Regular Expressions

Si el PDF es una imagen escaneada, transformaremos primero el PDF en imagen, usando por ejemplo [`pdf-to-img`](https://www.npmjs.com/package/pdf-to-img), para poder hacer uso de un OCR. Finalmente, extraemos el texto de la imagen con [`tesseract.js`](https://www.npmjs.com/package/tesseract.js) y terminamos por extraer de dicho texto los campos requeridos en formato JSON.

```javascript
import { pdf } from 'pdf-to-img';
import Tesseract from 'tesseract.js';

async function convertPDFToImage (path) {
  const image = await pdf(path, { scale: 3 });
  return image.getPage(1);
}

async function extractTextFromImage (image, language = 'eng') {
  const { data: { text } } = await Tesseract.recognize(image, language);
  return text;
}

async function processPDF () {
  const image = await convertPDFToImage('test.pdf');
  const text = await extractTextFromImage(image);
  const json = extractFieldsFromText(text);
  return json;
}

processPDF();
```

## LLM + Regular Expressions

En la documentación de Google AI podemos revisar los distintos [modelos de Gemini](https://ai.google.dev/gemini-api/docs/models) multimodales existentes y podemos ver [cómo generar texto a partir de entradas multimodales (texto e imagen)](https://ai.google.dev/gemini-api/docs/get-started/tutorial?lang=node&hl=es-419#generate-text-from-text-and-image-input) a través del [Google AI JavaScript SDK](https://www.npmjs.com/package/@google/generative-ai) e incluso [cómo trabajar directamente con ficheros en formato PDF](https://ai.google.dev/gemini-api/docs/document-processing?hl=es-419&lang=node), transformándolo previamente a base64.

En el prompt indicamos que queremos la respuesta en formato JSON y nos devolverá un texto que comenzará por ` ```json ` y terminará por ` ``` `. Eliminando esos caracteres podremos recuperar y parsear el JSON.

```javascript
import fs from 'node:fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = '***';

const googleAI = new GoogleGenerativeAI(geminiApiKey);
const geminiModel = googleAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
});

async function extractFieldsFromPDF (pdf) {
  const prompt = 'Analyze the text in the provided image. ' +
                 'Extract all readable content and present it in a structured JSON format. ' +
                 'Represent the following fields: date, amount.';
  const data = {
    inlineData: {
      data: pdf.toString('base64'),
      mimeType: 'application/pdf',
    },
  };
  const result = await geminiModel.generateContent([prompt, data]);
  let json = JSON.parse(response.text().replace(/```json\n?/, '').replace(/\n?```$/, ''));
  if (Array.isArray(json)) {
    json = json[0];
  }
  return json;
}

async function processPDF () {
  const pdf = Buffer.from(fs.readFileSync('test.pdf'));
  const json = await extractFieldsFromPDF(pdf);
  return json;
}

processPDF();
```

### Controlled Generation

Para evitar recibir la respuesta envuelta entre ` ```json ` y ` ``` ` podemos recurrir a [controlled generation](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output) indicando `responseMimeType: 'application/json'` en la configuración del modelo. Así, para parsear la respuesta bastará con hacer `JSON.parse(response.text())`.

```javascript
const generationConfig = {
  responseMimeType: 'application/json', // Controlled generation
};
const geminiApiKey = '***';

const googleAI = new GoogleGenerativeAI(geminiApiKey);
const geminiModel = googleAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig,
});
```

Incluso podemos ir un paso más allá e indicar en la propiedad `responseSchema` qué tipo de esquema debe seguir el JSON que esperamos recibir, siguiendo el estándar [OpenAPI 3.0](https://spec.openapis.org/oas/v3.0.3#schema). Esto nos permite garantizar que la respuesta del modelo siempre siga un esquema específico, asegurando así un formato consistente y determinista. De esta manera, evitaremos errores causados por alucinaciones en la respuesta del LLM, como por ejemplo que falten algunos campos (o se añadan campos adicionales), o que tengan un nombre diferente al esperado, o incluso que estén encapsulados dentro de propiedades que no hemos indicado explícitamente en el prompt. Los campos que indiquemos en el esquema son opcionales de base, y el LLM podrá devolverlos en la respuesta o no; si queremos que sean obligatorios, podremos incluirlos como tal en la propiedad `required`. Para evitar que devuelva valores incorrectos en campos obligatorios, porque no encuentre una respuesta adecuada basada en el contexto del prompt, podremos indicar que dichos campos son _nullable_ (`nullable: 'True'`).

```javascript
const generationConfig = {
  responseMimeType: 'application/json', // Controlled generation
  responseSchema: { // Controlled generation with a specified response schema
    type: 'OBJECT',
    properties: {
      date: { type: 'STRING', nullable: 'True' },
      amount: { type: 'NUMBER', nullable: 'True' },
    },
    required: ['date', 'amount'],
  },
};
const geminiApiKey = '***';

const googleAI = new GoogleGenerativeAI(geminiApiKey);
const geminiModel = googleAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig,
});
````

Esta forma de lograr que la salida del LLM tenga un formato específico está fundamentada en el [uso de DFAs (Deterministic Finite Automaton) construidos a partir de expresiones regulares](https://arxiv.org/abs/2407.08103), de forma que el modelo sólo podrá generar tokens que cumplan con la estructura definida. Como las expresiones regulares no se aplican sobre la salida ya generada sino que se utilizan para generar DFAs que se combinan con el LLM, se logra validar la secuencia de tokens a tiempo real, paso a paso, a medida que el modelo genera texto.

### Few-shot prompting

Como ayuda adicional al LLM, podemos también recurrir a [few-shot prompting](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/few-shot-examples) e indicar en el prompt ciertos ejemplos de la respuesta que esperamos recibir.

```javascript
async function extractFieldsFromPDF (pdf) {
  const prompt = 'Analyze the text in the provided image. ' +
                 'Extract all readable content and present it in a structured JSON format. ' +
                 'Represent the following fields: date, amount.' +
                 'Examples:' + // Few-shot prompting
                 '{"date": "2024-07-10T11:57:00.000Z","amount": 23}' +
                 '{"date": "2025-01-07T17:00:00.000Z","amount": 76.97}';
  const data = {
    inlineData: {
      data: pdf.toString('base64'),
      mimeType: 'application/pdf',
    },
  };
  const result = await model.generateContent([prompt, data]);
  const json = JSON.parse(response.text());
  return json;
}
```

Finalmente, si los campos que esperamos recibir sabemos que deben tener un formato concreto, podríamos validarlos haciendo uso de nuevo de expresiones regulares; en caso de que algún campo resultase tener un formato inesperado, se podría parsear a `null` (indicando que no ha sido posible la detección del valor), o incluso podríamos utilizarlo como entrada de una nueva petición al LLM para que trate de corregirlo en un siguiente intento y afinar así la respuesta final.

> “Think before you AI”
>
> ###### Lisa Talia Moretti, Digital Sociologist