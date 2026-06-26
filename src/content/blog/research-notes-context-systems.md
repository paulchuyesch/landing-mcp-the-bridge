---
title: "Notas de Investigación: Lo que Aprendí Estudiando Sistemas de Contexto para IA"
description: "A pocos días de construir TU EMPRESA, investigué enfoques existentes para documentación de código y contexto para IA. Estos son mis hallazgos."
date: 2025-12-05
category: "Investigación"
image: "/images/research-notes.webp"
---

Llevo solo unos días construyendo TU EMPRESA. Este no es un anuncio pulido. Estas son notas personales de investigación — las cosas que he estado aprendiendo mientras exploro cómo otros han intentado dar a la IA contexto significativo sobre bases de código reales.

Estos hallazgos están influenciando las decisiones tempranas detrás de TU EMPRESA. Probablemente cambiarán de nuevo a medida que aprenda más y obtenga retroalimentación real de usuarios.

## El Problema que Intento Resolver

Los grandes modelos de lenguaje pueden leer código, pero luchan con la intención. Ven funciones y clases, pero no el razonamiento detrás de las decisiones arquitectónicas. Siguen importaciones, pero pierden las relaciones que realmente importan.

La documentación debería resolver esta brecha. En realidad, la documentación usualmente sigue el mismo ciclo de muerte:

```
Humanos escriben docs.
El código cambia.
Los docs se vuelven obsoletos.
La confianza desaparece.
Nadie los mantiene.
La documentación muere.
```

La encuesta de desarrolladores de Stack Overflow de 2024 lo confirma: la documentación es todavía una de las tareas más odiadas entre los desarrolladores. Cualquier sistema que dependa de escritura humana constante eventualmente colapsa.

Así que mi pregunta simple fue: ¿alguien ya ha resuelto esto? ¿Qué enfoques existen? ¿Qué funcionó y qué falló claramente?

## Lo que Investigué

En los últimos días, exploré diferentes estándares, herramientas e ideas. Este es un resumen de lo que encontré — notas informales, no un estudio científico.

### Especificación de Contexto de Base de Código (CCS)

Esta es la idea más cercana a lo que quiero. Propone archivos `.context.md` distribuidos a través del proyecto. Buena estructura, markdown legible y una intención clara.

Pero el proyecto fue archivado. Tuvo baja adopción, dependía demasiado de la escritura manual y carecía de herramientas para proveer valor instantáneo.

La lección principal: un buen formato no es suficiente. Sin generación automatizada, no sobrevivirá.

### Modelo C4

C4 es un modelo excelente para que los humanos comuniquen arquitectura. Maduro, bien documentado, ampliamente enseñado.

Limitación para mi caso: creación manual y diagramas estáticos. Grandioso para comunicación humano-a-humano, no para entendimiento de máquina.

### LikeC4

LikeC4 extiende C4 con arquitectura-como-código. Escribes un DSL, los diagramas se actualizan automáticamente, controlado por versión, amigable con CI.

Pero todavía depende de humanos escribiendo y manteniendo el DSL. Eso reintroduce la misma carga de mantenimiento.

### llms.txt

Una especificación markdown ligera destinada a ayudar a los LLMs a entender un sitio web o proyecto. Simple, estructurado, fácil de mantener. La adopción fue pequeña al principio, pero cuando Mintlify la integró, muchos sitios de documentación la adoptaron inmediatamente.

Insight clave: pequeños archivos de contexto estructurados funcionan mejor que grandes bloques de texto.

### CLAUDE.md

Claude Code usa un archivo de contexto persistente para guiar al modelo. Sus pautas son extremadamente prácticas: mantenlo corto, referencia código en lugar de duplicarlo, usa punteros archivo:linea, y confía en herramientas deterministas para el formato.

Su comando `/init` que auto-genera un CLAUDE.md es similar a lo que quiero que TU EMPRESA haga.

### Reglas de Cursor

Cursor usa archivos de reglas distribuidos que dan al editor contexto sobre el proyecto. Recomiendan archivos pequeños, organizados por funcionalidad, no un archivo de reglas gigante.

De nuevo, el mismo patrón aparece: contexto distribuido, archivos cortos, metadatos estructurados.

### Mejores Prácticas RAG (OpenAI y Google)

Tanto OpenAI como Google recomiendan enfoques similares: fragmentación semántica, indexación híbrida, recuperación de contexto específico en lugar de cargar todo, y forzar que el modelo deba basar su salida estrictamente en el contexto recuperado.

## Patrones Que Siguen Apareciendo

A través de todos estos enfoques, las mismas ideas aparecen repetidamente:

- Archivos cortos funcionan mejor que los largos.
- Apuntar al código es mejor que copiarlo.
- Generación automática vence a la escritura manual.
- Contexto distribuido funciona mejor que archivos globales.
- Markdown con metadatos estructurados da en el clavo entre legibilidad humana y de máquina.

La industria parece estar convergiendo hacia una idea: **archivos de contexto pequeños, distribuidos y generados automáticamente**.

## Mi Hipótesis para TU EMPRESA

Después de investigar todo esto, estas son las asunciones centrales dando forma a TU EMPRESA:

**El contexto debe ser distribuido.** Cada carpeta importante obtiene su propio `.context.md` colocado junto al código que describe.

**La IA debe generar, los humanos deben validar.** CCS mostró que confiar en humanos para escribir y mantener contexto no es sostenible. TU EMPRESA invierte eso: la IA analiza y genera, los humanos refinan.

**Las capas deben representar conocimiento, no solo estado.** En lugar de checkboxes básicos, las capas deben contener insights accionables y metadatos.

**RAG debe habilitar recuperación selectiva.** Chunks, embeddings, snapshots — la idea es recuperar solo lo que importa, no volcar el proyecto entero en el modelo.

## Lo Que Estoy Probando Ahora Mismo

Estas son preguntas abiertas, no conclusiones:

- ¿Es YAML frontmatter el formato correcto para metadatos?
- ¿Cuál es la longitud ideal para un archivo de contexto?
- ¿Cuánta autonomía debería tener la IA antes de requerir revisión?
- ¿Qué capas son esenciales y cuáles deberían ser personalizables?
- ¿Son suficientes las invalidaciones basadas en hash de código para detectar cuando el contexto se vuelve obsoleto?

## Preguntas Que Aún Están Sin Resolver

- ¿Cómo medimos si TU EMPRESA realmente hace un proyecto más fácil de entender?
- ¿Debería TU EMPRESA exportar a formatos C4 o LikeC4?
- ¿Cómo escalará este sistema a repositorios muy grandes?
- ¿Cuáles son las implicaciones de seguridad de exponer la intención arquitectónica?
- ¿Qué hace a un sistema de contexto adoptable en lugar de abandonado como CCS?

## Estado Actual

TU EMPRESA tiene solo unos pocos días de edad. Es pequeño, experimental, y absolutamente no listo para reclamar nada grande.

**Lo que existe hoy:**
- Generación básica de `.context.md`
- Una estructura de capas con metadatos
- Un sistema RAG simple con chunks y embeddings
- Detección básica de dependencias

**Lo que no existe todavía:**
- Actualizaciones en tiempo real
- Definiciones de capas personalizadas
- Soporte multi-proyecto
- Pruebas en repositorios de escala de producción

## Por Qué Estoy Compartiendo Esto Tan Temprano

Porque los desarrolladores entienden este problema mejor que yo.

Porque prefiero ajustar temprano que pasar meses construyendo la cosa incorrecta.

Porque si el objetivo es ayudar a entender código, tiene sentido que mi propio proceso sea transparente.

## Pensamientos de Cierre

Este pequeño sprint de investigación cambió mis prioridades. Originalmente pensé que la visualización era el valor central. Ahora pienso que la fundación es más simple: contexto confiable, distribuido y auto-generado que la IA realmente pueda usar.

La industria ya se está moviendo en esa dirección. La pieza faltante es el mantenimiento automatizado. Ahí es donde quiero que TU EMPRESA se enfoque.

Si tienes experiencia con documentación, sistemas de contexto, o desarrollo asistido por IA, me encantaría escuchar tu perspectiva. ¿Qué me perdí? ¿Qué debería repensar? ¿Qué importa más de lo que me doy cuenta?

Estas son notas del día tres. El día treinta probablemente se verá muy diferente.

*Edinson*
