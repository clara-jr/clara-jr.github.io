---
layout: ../../layouts/PostLayout.astro
title: 'Blue-Green Deployment con GitHub Actions 👩🏻‍💻'
pubDate: 2025/04/16
description: 'Desplegar sin interrupciones y hacer rollback a velocidad del ⚡️ rayo: así es un Blue-Green Deployment con S3, CloudFront y GitHub Actions'
author: 'Clara Jiménez'
image:
    url: '/images/posts/bluegreen.png' 
    alt: 'Blue-Green Deployment'
tags: ["devops", "github actions", "aws"]
---
Los despliegues *blue-green* son una estrategia popular para minimizar el *downtime* durante los despliegues a producción y lograr agilizar los rollbacks. En este post veremos en qué consiste esta estrategia y cómo implementarla con GitHub Actions y AWS (S3 + CloudFront).

## ¿Qué es un despliegue blue-green?

La estrategia *blue-green* consiste en tener **dos componentes** de producción separados (por ejemplo buckets en S3 para servir una aplicación web): uno *activo* (digamos, "blue") y otro *en espera* ("green"). Cuando **desplegamos una nueva versión**, lo hacemos **al componente en espera**, al **"green"**. Una vez validado, simplemente **redirigimos el tráfico al "green"** (modificando, por ejemplo, la configuración del CloudFront que apunta a dichos buckets). De esta manera, no habría interrupciones del servicio durante el despliegue al no estar afectando en ningún momento al componente "blue" que está activo. En caso de necesitar hacer un rollback por haber detectado un bug 🐛 en la nueva versión desplegada, bastaría con redirigir de nuevo el tráfico al componente anterior.

## Workflow de despliegue

Teniendo la nueva versión previamente construida y desplegada en un entorno de *staging*, bastará con copiar este contenido al bucket que esté en espera, el "green". Cuando esto termine, editaremos la configuración del CloudFront para que apunte al nuevo bucket e invalidaremos la caché. Adicionalmente, podemos desplegar también la nueva versión a un bucket destinado a almacenar snapshots de versiones anteriores para poder realizar rollbacks a versiones concretas.

![Blue-Green Deployment](/images/posts/bluegreen.png)

El siguiente workflow permite desplegar automáticamente a producción al hacer push a `master` o al ejecutarlo manualmente:

```yaml
name: Deployment
on:
  push:
    branches:
      - 'master'
  workflow_dispatch:

concurrency:
  group: deployment-production
  cancel-in-progress: false

env:
  BUCKET_ONE: "bucket-one-name"
  BUCKET_TWO: "bucket-two-name"
  STG_BUCKET: "stg-bucket-name"
  VERSIONS_BUCKET: "versions-bucket-name"
  CF_ID: "***"
  SLACK_CHANNEL: "***"

jobs:  
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
      with:
        fetch-depth: 1

    - name: Add version
      id: get-version
      run: |
        VERSION=$(npm run current-version --silent)
        echo "version=$VERSION" >> "$GITHUB_OUTPUT"

    - name: 📦 S3 deploy stg -> bucket with builds for rollbacks
      if: success()
      run: |
        echo "Uploading contents of $STG_BUCKET to $VERSIONS_BUCKET/${{ steps.get-version.outputs.version }}"
        aws s3 sync s3://$STG_BUCKET s3://$VERSIONS_BUCKET/${{ steps.get-version.outputs.version }}/ --delete
      env:
        AWS_DEFAULT_REGION: us-west-2
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        
    - name: 🔍 Detect target bucket
      id: detect-bucket
      run: |
        CONFIG_FILE="config.json"
        aws cloudfront get-distribution-config --id $CF_ID > $CONFIG_FILE
        TARGET_ORIGIN_ID=$(jq -r '.DistributionConfig.DefaultCacheBehavior.TargetOriginId' $CONFIG_FILE)
        if [[ "$TARGET_ORIGIN_ID" == "Origin-Id-$BUCKET_ONE" ]]; then
          GREEN_BUCKET="$BUCKET_TWO"
        else
          GREEN_BUCKET="$BUCKET_ONE"
        fi

        echo "⏭️ Next bucket: $GREEN_BUCKET"
        echo "green_bucket=$GREEN_BUCKET" >> "$GITHUB_OUTPUT"
        echo "green_origin_id=Origin-Id-$GREEN_BUCKET" >> "$GITHUB_OUTPUT"
      env:
        AWS_DEFAULT_REGION: us-west-2
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        
    - name: 📦 S3 deploy stg -> green bucket
      run: |
        echo "Uploading contents of $STG_BUCKET to ${{ steps.detect-bucket.outputs.green_bucket }}"
        aws s3 sync s3://$STG_BUCKET s3://${{ steps.detect-bucket.outputs.green_bucket }} --delete
      env:
        AWS_DEFAULT_REGION: us-west-2
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        
    - name: 🔀 Update CloudFront to point to green bucket
      run: |
        CONFIG_FILE="config.json"
        UPDATED_CONFIG_FILE="updated-config.json"
        E_TAG=$(jq -r '.ETag' $CONFIG_FILE)
        
        # Update TargetOriginId
        jq --arg origin "${{ steps.detect-bucket.outputs.green_origin_id }}" \
          '.DistributionConfig.DefaultCacheBehavior.TargetOriginId = $origin' \
          "$CONFIG_FILE" > "$UPDATED_CONFIG_FILE"
        
        # Remove the ETag field from the distribution config and extract the fields of DistributionConfig to the root
        jq '.DistributionConfig' "$UPDATED_CONFIG_FILE" > temp.json && mv temp.json "$UPDATED_CONFIG_FILE"

        # Update CF config
        aws cloudfront update-distribution \
          --id $CF_ID \
          --if-match $E_TAG \
          --distribution-config "file://$UPDATED_CONFIG_FILE"
        echo "✅ Updated CloudFront Distribution: $CF_ID"
      env:
        AWS_DEFAULT_REGION: us-west-2
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        
    - name: ⚙️ Invalidate CloudFront cache
      run: |
        aws cloudfront create-invalidation --distribution-id $CF_ID --paths "/*"
        echo "✅ Invalidation triggered on CloudFront: $CF_ID"
      env:
        AWS_DEFAULT_REGION: us-west-2
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}

    - name: 📣✅ Send message when deploy to production success
      if: success()
      uses: archive/github-actions-slack@v2.10.1
      with:
        slack-bot-user-oauth-access-token: ${{ secrets.SLACK_TOKEN }}
        slack-channel: ${{ env.SLACK_CHANNEL }}
        slack-optional-icon_emoji: ":rocket:"
        slack-text: |
          Deployment triggered on *${{ github.repository }}* by *${{ github.actor }}* succeeded :rocket:
          → Bucket: `${{ steps.detect-bucket.outputs.green_bucket }}`
          → Version: `${{ steps.get-version.outputs.version }}`

    - name: 📣🚨 Send message when deploy to production fails
      if: failure()
      uses: archive/github-actions-slack@v2.10.1
      with:
        slack-bot-user-oauth-access-token: ${{ secrets.SLACK_TOKEN }}
        slack-channel: ${{ env.SLACK_CHANNEL }}
        slack-optional-icon_emoji: ":warning:"
        slack-text: ":warning: Deployment triggered on *${{ github.repository }}* by *${{ github.actor }}*" failed :warning:"
```

Para redirigir el tráfico al nuevo bucket, editamos el *origin* al que está apuntando el *behaviour* del CloudFront. De este modo, tenemos que revisar cuál es el identificador del *origin* al que está apuntando actualmente (`DefaultCacheBehavior.TargetOriginId`) y [cambiarlo por el que está en espera](https://docs.aws.amazon.com/cli/latest/reference/cloudfront/update-distribution.html). Por simplicidad, asumimos que el identificador del *origin* lleva implícito el nombre del bucket al que hace referencia (p.ej. `"Origin-Id-[BUCKET_NAME]"`), para no tener que buscar dicho *origin* y recuperar su `DomainName` para saber qué bucket está activo y cuál en espera.

## Workflow de rollback

Para hacer un rollback a la versión directamente anterior, sólo tendremos que editar la configuración del CloudFront para que apunte al bucket que está en espera, el cual contiene dicha versión directamente anterior, e invalidar la caché. Si queremos hacer rollback a una versión concreta, podremos indicarlo como input del workflow y recuperaremos primeramente el contenido de dicha versión del bucket de snapshots de versiones anteriores y lo copiaremos en el bucket que está en espera antes de modificar la configuración del CloudFront.

![Blue-Green Rollback](/images/posts/bluegreen-rollback.png)

De esta manera, si algo sale mal, el rollback se puede ejecutar manualmente indicando una versión específica o volviendo a la versión directamente anterior haciendo un simple _swap_ entre buckets:

```yaml
name: Rollback
on:
  workflow_dispatch:
    inputs:
      version:
        description: "Specific version for rollback (leave empty for automatic rollback)"
        required: false
        type: string

concurrency:
  group: rollback-production
  cancel-in-progress: false

env:
  BUCKET_ONE: "bucket-one-name"
  BUCKET_TWO: "bucket-two-name"
  VERSIONS_BUCKET: "versions-bucket-name"
  CF_ID: "***"
  SLACK_CHANNEL: "***"

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
      with:
        fetch-depth: 1

    - name: 🔍 Detect target bucket
      id: detect-bucket
      run: |
        CONFIG_FILE="config.json"
        aws cloudfront get-distribution-config --id $CF_ID > $CONFIG_FILE
        TARGET_ORIGIN_ID=$(jq -r '.DistributionConfig.DefaultCacheBehavior.TargetOriginId' $CONFIG_FILE)
        if [[ "$TARGET_ORIGIN_ID" == "Origin-Id-$BUCKET_ONE" ]]; then
          GREEN_BUCKET="$BUCKET_TWO"
        else
          GREEN_BUCKET="$BUCKET_ONE"
        fi

        echo "⏭️ Next bucket: $GREEN_BUCKET"
        echo "green_bucket=$GREEN_BUCKET" >> "$GITHUB_OUTPUT"
        echo "green_origin_id=Origin-Id-$GREEN_BUCKET" >> "$GITHUB_OUTPUT"
      env:
        AWS_DEFAULT_REGION: us-west-2
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}

    - name: 📦 Copy version from builds (if version provided)
      if: inputs.version != ''
      run: |
        echo "Rolling back to version ${{ inputs.version }} using bucket ${{ steps.detect-bucket.outputs.green_bucket }}"
        aws s3 sync s3://$VERSIONS_BUCKET/${{ inputs.version }} s3://${{ steps.detect-bucket.outputs.green_bucket }} --delete
      env:
        AWS_DEFAULT_REGION: us-west-2
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}

    - name: 🔀 Update CloudFront to point to green bucket
      if: success()
      run: |
        CONFIG_FILE="config.json"
        UPDATED_CONFIG_FILE="updated-config.json"
        E_TAG=$(jq -r '.ETag' $CONFIG_FILE)

        # Update TargetOriginId
        jq --arg origin "${{ steps.detect-bucket.outputs.green_origin_id }}" \
          '.DistributionConfig.DefaultCacheBehavior.TargetOriginId = $origin' \
          "$CONFIG_FILE" > "$UPDATED_CONFIG_FILE"

        # Remove the ETag field from the distribution config and extract the fields of DistributionConfig to the root
        jq '.DistributionConfig' "$UPDATED_CONFIG_FILE" > temp.json && mv temp.json "$UPDATED_CONFIG_FILE"

        # Update CF config
        aws cloudfront update-distribution \
          --id $CF_ID \
          --if-match $E_TAG \
          --distribution-config "file://$UPDATED_CONFIG_FILE"
        echo "✅ Updated CloudFront Distribution: $CF_ID"
      env:
        AWS_DEFAULT_REGION: us-west-2
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}

    - name: ⚙️ Invalidate CloudFront cache
      run: |
        aws cloudfront create-invalidation --distribution-id $CF_ID --paths "/*"
        echo "✅ Invalidation triggered on CloudFront: $CF_ID"
      env:
        AWS_DEFAULT_REGION: us-west-2
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}

    - name: 📣✅ Notify rollback success
      if: success()
      uses: archive/github-actions-slack@v2.10.1
      with:
        slack-bot-user-oauth-access-token: ${{ secrets.SLACK_TOKEN }}
        slack-channel: ${{ env.SLACK_CHANNEL }}
        slack-optional-icon_emoji: ":rewind:"
        slack-text: |
          🔁 Rollback triggered on *${{ github.repository }}* by *${{ github.actor }}* succeeded
          → Bucket: `${{ steps.detect-bucket.outputs.green_bucket }}`
          → Version: `${{ inputs.version || 'previous version' }}`

    - name: 📣🚨 Notify rollback failure
      if: failure()
      uses: archive/github-actions-slack@v2.10.1
      with:
        slack-bot-user-oauth-access-token: ${{ secrets.SLACK_TOKEN }}
        slack-channel: ${{ env.SLACK_CHANNEL }}
        slack-optional-icon_emoji: ":x:"
        slack-text: ":x: Rollback triggered on *${{ github.repository }}* by *${{ github.actor }}* failed"
```

> “Making mistakes is human, automating them is DevOps.”
>
> ###### Unknown