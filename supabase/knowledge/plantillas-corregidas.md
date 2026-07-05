# Plantillas radiológicas corregidas para GPT

Versión preparada para cargar como conocimiento de un GPT asistente de informes radiológicos.

Criterio de corrección aplicado:
- Se eliminó HTML y formato heredado.
- Se normalizaron encabezados: ANTECEDENTES CLÍNICOS, HALLAZGOS e IMPRESIÓN.
- Se corrigieron tildes, errores tipográficos evidentes y espaciado.
- Se conservó el sentido clínico original de cada plantilla.
- No se agregaron medidas ni hallazgos nuevos.

Instrucción de uso: cuando exista contradicción entre una frase normal y un hallazgo patológico entregado por la usuaria, el asistente debe adaptar la plantilla y eliminar la frase contradictoria.

# Doppler


## Doppler Arterial EI - Pseudoaneurisma.

Código: `doppler_plantilla_001`

```text
ANTECEDENTES CLÍNICOS:
El sistema arterial se examinó en forma continua desde el territorio femoral común al territorio tibial, registrándose imágenes representativas de los diferentes segmentos.

HALLAZGOS:
Las arterias femorales comunes, femorales profundas, poplíteas, tibiales posteriores y pedias están permeables, y presentan velocidades de flujo en sus picos sistólicos dentro de límites normales.

Dependiente de la arteria femoral superficial se identifica una lesión hipoecogénica que presenta flujo al estudio Doppler color con patrón de pseudoaneurisma, el cual mide 16 x 23 diámetros en sus ejes mayores y su cuello 5 mm.

Al estudio espectral, las curvas obtenidas son de aspecto trifásico.

La pared arterial es de aspecto normal, identificándose algunas placas de ateroma que no determinan estenosis significativa.

No hay evidencia de estenosis significativa ni oclusión arterial.

IMPRESIÓN:
Hallazgos sugerentes de pseudoaneurisma dependiente de la arteria femoral superficial.

Resto del estudio sin hallazgos patológicos.
```


## Doppler Venoso EEII Várices - Normal

Código: `Dopplervaricesn`
Código duplicado: sí, variante 1

```text
ANTECEDENTES CLÍNICOS:
Varices.

HALLAZGOS:
Las venas femorales comunes, femorales profundas, femorales superficiales y poplíteas presentan caracteres morfológicos normales. Muestran flujo espontáneo, de tipo bifásico, que varía con los movimientos respiratorios.
Las venas tibiales posteriores y peroneas no muestran alteraciones, encontrándose competentes en todo su recorrido.
El cayado de la vena safena interna derecha mide 5 mm y es competente en toda su extensión.
El cayado de la vena safena interna izquierda mide 4,1 mm y es competente en toda su extensión.
Venas safenas externas permeables, competentes.
No se demostraron imágenes endoluminales sospechosas de trombosis, tampoco paquetes varicosos.
Piel y tejido celular subcutáneo sin alteraciones.

IMPRESIÓN:
Examen sin evidencia de insuficiencia superficial ni profunda.
Examen negativo para trombosis venosa profunda femoro-poplítea e infrapoplítea.
```


## Doppler arterio venoso eeii

Código: `arterio venoso eeii`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Las arterias femoral común, femoral profunda, femoral superficial, poplítea, tibial posterior, tibial anterior, peronea y pedia están permeables, y presentan velocidades de flujo en sus picos sistólicos dentro de límites normales.

Al estudio espectral, las curvas obtenidas son de aspecto trifásico.

La pared arterial es de aspecto normal, identificándose algunas placas de ateroma que no determinan estenosis significativa.

No hay evidencia de estenosis significativa ni oclusión arterial.

Las venas femoral común, femoral profunda, femoral superficial y poplítea presentan caracteres morfológicos normales. Muestran flujo espontáneo, de tipo bifásico, que varía con los movimientos respiratorios.

Las venas tibiales posteriores, peroneas y gastrocnemias no muestran alteraciones.

Venas safenas interna y externa permeables.

No se demostraron imágenes endoluminales sospechosas de trombosis.

Piel y tejido celular subcutáneo sin alteraciones.

IMPRESIÓN:
Examen sin evidencia de TVP.

Estudio sin hallazgos de significado patológico.
```


## Doppler FAV - Normal

Código: `dopplerFAVn`

```text
ECOTOMOGRAFÍA Doppler - COLOR DE FÍSTULA ARTERIOVENOSA DE EXTREMIDAD SUPERIOR

ANTECEDENTES CLÍNICOS:
Antecedente de fístula radiocefálica.

HALLAZGOS:
Utilizando transductor lineal de alta resolución, se exploró en forma continua el territorio arterial y venoso de la extremidad.
La arteria braquial izquierda se encuentra permeable, con un diámetro aproximado de 6,9 mm y presentan curvas de baja resistencia concordante con la presencia una fístula arteriovenosa distal y volúmenes de flujo de 2638 cc/min.
Existe una fístula arteriovenosa radiocefálica en el tercio medio del antebrazo, la que se encuentra permeable, con un diámetro aproximado de 4 mm en su origen y volumen de flujo de 550 cc/min.
La arteria cubital se encuentra permeable, con un diámetro de 3,9 mm, curvas de baja resistencia y volúmenes flujo de 154 cc/min.
La arteria radial se encuentra permeable, con un diámetro de 3,9 mm, curvas de baja resistencia y volúmenes flujo de 154 cc/min.
La vena cefálica se encuentra permeable, alcanzando diámetros de alrededor de 22 mm, a aproximadamente a 4 cm de la fístula. Se bifurca a nivel de la fosa cubital, continuando y tanto hacia la vena basílica como cefálica en el brazo. No se demostraron zonas de estenosis en el territorio eferente así como tampoco en la vena axilar, el cayado de la vena cefálica ni en la vena subclavia en su segmento visible.
La fístula presentan un volumen de flujo entre 1400 y 2500 cc/min.

IMPRESIÓN:
Fístula arteriovenosa radiocefálica permeable. No se demuestran estenosis significativas.
```


## Doppler Abdomen

Código: `dopplerabdomenn`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
El hígado es de tamaño, ecogenicidad y morfología normal. En estas condiciones no se observan lesiones focales en el espesor del parénquima.

La vena porta principal y sus ramas izquierda y derecha, se encuentran permeables y presentan flujo hepatopeto normal. La velocidad del flujo en la vena porta principal alcanza valores dentro de límites normales con curvas espectrales de morfología normal.

La arteria hepática se encuentra permeable, presentan velocidades de flujo en el peak sistólico dentro de límites normales.

Venas suprahepáticas permeables, con flujo hepatófugo, velocidades de flujo dentro de límites normales y curvas espectrales trifásicas normales.

Vesícula biliar en repleción, de paredes finas, sin cálculos.

Vía biliar de calibre normal.

riñónes de tamaño y morfología normal. Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal. No se observa dilatación pielocaliciaria.

Segmentos visibles del bazo y páncreas sin alteraciones.

Segmentos visibles de la aorta abdominal de calibre conservado.

No se observa líquido libre intraabdominal.

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## Eco Doppler Arterial - Una extremidad inferior

Código: `dopplerarterial1eeii`

```text
Doppler ARTERIAL DE EXTREMIDAD INFERIOR

ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Las arterias femoral común, femoral profunda, femoral superficial, poplítea, tibial posterior, tibial anterior, peronea y pedia están permeables, y presentan velocidades de flujo en sus picos sistólicos dentro de límites normales.
Al estudio espectral, las curvas obtenidas son de aspecto trifásico.
La pared arterial es de aspecto normal, identificándose algunas placas de ateroma que no determinan estenosis significativa.
No hay evidencia de estenosis significativa ni oclusión arterial.

IMPRESIÓN:
Examen sin hallazgos de estenosis hemodinámicamente significativa.
```


## Doppler Arterial EEII

Código: `dopplerarterialeeiin`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen
.

Las arterias femorales comunes, femorales profundas, femorales superficiales, poplíteas, tibiales posteriores, tibiales anteriores, peroneas y pedias están permeables, y presentan velocidades de flujo en sus picos sistólicos dentro de límites normales.
Al estudio espectral, las curvas obtenidas son de aspecto trifásico.
La pared arterial es de aspecto normal, identificándose algunas placas de ateroma que no determinan estenosis significativa.
No hay evidencia de estenosis significativa ni oclusión arterial.

IMPRESIÓN:
Examen sin hallazgos de estenosis hemodinámicamente significativa.
```


## Doppler Arterial de EESS - Normal

Código: `dopplerarterialeessn`

```text
ANTECEDENTES CLÍNICOS:
El sistema arterial se examinó en forma continua desde el territorio subclavio al territorio distal a nivel de la muñeca, registrándose imágenes representativas de los diferentes segmentos.

HALLAZGOS:
Las arterias subclavia, axilar, braquial, radial y cubital están permeables, y presentan velocidades de flujo en sus picos sistólicos dentro de límites normales.

Al estudio espectral, las curvas obtenidas son de aspecto trifásico.

La pared arterial es de aspecto normal, identificándose algunas placas de ateroma que no determinan estenosis significativa.

No hay evidencia de estenosis significativa ni oclusión arterial.

IMPRESIÓN:
Examen sin hallazgos de estenosis hemodinámicamente significativa.
```


## Doppler Carotídeo - Ateromatosis

Código: `dopplercarotideoateroma`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Ambas arterias carótidas comunes, internas y externas son de morfología conservada. Leve engrosamiento del complejo intimo - medial bilateral, a derecha 12 mm y a izquierda 10 mm.
Las arterias examinadas se encuentran permeables, con velocidades de flujo en sus picos sistólicos dentro de límites normales y curvas espectrales de morfología normal. Placa de ateroma en la unión del bulbo con la ACI derecha que mide 6 x 6 x 3 mm, sin signos de obstrucción. A izquierda Placa de ateroma en el bulbo que mide 10 x 2 x 8 mm y placa de ateroma en la ACI que mide 5 x 2 x 6 mm, sin estenosis significativa.
Ambas arterias vertebrales se encuentran permeables, presentan flujo vascular ascendente con velocidad de flujo de sus picos sistólicos dentro de límites normales y curvas espectrales de morfología normal.

IMPRESIÓN:
Ateromatosis carotídea bilateral sin signos de estenosis hemodinámicamente significativa.
```


## Doppler Carotídeo - Ateromatosis unilateral

Código: `dopplercarotideoateromauni`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.
Ambas arterias carótidas comunes, internas y externas son de morfología conservada, sin engrosamiento del complejo intimo - medial.
Las arterias examinadas se encuentran permeables, con velocidades de flujo en sus picos sistólicos dentro de límites normales y curvas espectrales de morfología normal. Placa de ateroma en la unión del bulbo con la ACI derecha que mide 1,2 x 0,2 x 0,6 cm sin signos de obstrucción.
Ambas arterias vertebrales se encuentran permeables, presentan flujo vascular ascendente con velocidad de flujo de sus picos sistólicos dentro de límites normales y curvas espectrales de morfología normal.

IMPRESIÓN:
Ateromatosis carotídea derecha sin signos de estenosis hemodinámicamente significativos.
```


## Doppler Carotídeo - Normal

Código: `dopplercarotideon`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Ambas arterias carótidas comunes, internas y externas son de morfología conservada, sin identificar placas de ateroma ni engrosamiento del complejo intimo - medial.
Las arterias examinadas se encuentran permeables, con velocidades de flujo en sus picos sistólicos dentro de límites normales y curvas espectrales de morfología normal.
Ambas arterias vertebrales se encuentran permeables, presentan flujo vascular ascendente con velocidad de flujo de sus peaks sistólicos dentro de límites normales y curvas espectrales de morfología normal.

IMPRESIÓN:
Examen sin hallazgos de significado patológico, en especial no se demostraron signos de estenosis hemodinámicamente significativas.
```


## Doppler EESS - Normal

Código: `dopplereessn`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Las venas yugular, subclavia, axilar, braquiales, radiales y cubitales son de morfología normal y se encuentran permeables.
El estudio Doppler espectral muestra curvas de tipo normal.
El sistema superficial (basílica y cefálica) no muestra alteraciones.
No hay signos de trombosis.

IMPRESIÓN:
Examen sin signos de trombosis venosa profunda.
```


## Doppler Testicular - Epididimitis aguda

Código: `dopplerepididimitis`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Ambos testículos se encuentran en el saco escrotal al momento del examen. Son de tamaño y morfología normal. Su parénquima es homogéneo y no se observan lesiones focales.
El testículo derecho mide 3.9 x 2.9 x 3.3 cm y el izquierdo mide 4.0 x 2.7 x 3.1 cm en sus ejes longitudinal, anteroposterior y transversal respectivamente.
Ambos testículos presentan perfusión arterial homogénea y simétrica.
Epidídimos derecho aumentado de tamaño, grueso, heterogéneo, con acentuado aumento de la vascularización al estudio Doppler color.
Quistes en ambas cabezas de los epididímos de hasta 3 mm.
Leve hidrocele derecho. No hay hidrocele a izquierda.
En situación extratesticular no hay signos sugerentes de varicocele.

IMPRESIÓN:
Signos sugerentes de una ependimitis aguda derecha.
Leve hidrocele derecho, probablemente reactivo.
Quistes epididimarios bilaterales.
```


## Eco Doppler Mapeo FAV

Código: `dopplerfav`

```text
ESTUDIO DE MAPEO PRE FÍSTULA ARTERIOVENOSA DE EXTREMIDAD SUPERIOR.

ANTECEDENTES CLÍNICOS:
Preoperatorio.

HALLAZGOS:
Las arterias subclavia, axilar, braquial, radial y cubital se observan permeables, de calibre y trayecto habitual, sin áreas de estenosis ni irregularidad parietal. Demuestran curvas espectrales de alta resistencia, habituales de observar.
Las venas yugular, subclavia, axilar, braquial, radial, cubital, cefálica y basílicas, se observan permeables y compresibles, de paredes finas, sin imágenes endoluminales sugerente de trombos.

Extremidad superior (medidas en el antebrazo y muñeca):

A nivel del brazo:

⦁ Arteria braquial: mm a mm de la superficie.
⦁ Vena cefálica: mm a mm de la superficie.
⦁ Vena basílica: mm a mm de la superficie.
⦁ Distancia arteria braquial/vena cefálica: mm.
⦁ Distancia arteria braquial/vena basílica: mm.

A nivel de la muñeca:

⦁ Arteria radial: mm a mm de la superficie.
⦁ Arteria cubital: mm a mm de la superficie.
⦁ Vena cefálica: mm a mm de la superficie.
⦁ Vena basílica: mm a mm de la superficie.
⦁ Distancia arteria cubital/vena basílica: mm.
⦁ Distancia arteria radial/vena cefálica: mm.
```


## Doppler Hepato-Portal - Normal

Código: `dopplerhpn`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
La vena porta principal y sus ramas izquierda y derecha, se encuentran permeables y presentan flujo hepatopeto normal. La velocidad del flujo en la vena porta principal alcanza valores dentro de límites normales con curvas espectrales de morfología normal.

La arteria hepática se encuentra permeable, presentan velocidades de flujo en el peak sistólico dentro de límites normales.

Venas suprahepáticas permeables, con flujo hepatófugo, velocidades de flujo dentro de límites normales y curvas espectrales trifásicas normales.

La vena esplénica se encuentra permeable, de calibre normal, con buena variabilidad a los movimientos respiratorios.

No se observa desarrollo de vasos colaterales en el hilio esplénico ni formación de shunt espleno-renal.

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## Doppler Renal - Normal

Código: `dopplerrenaln`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Ambos riñónes son de tamaño y configuración normal.
El riñón derecho mide 12,8 cm en su diámetro longitudinal, y el izquierdo alcanza 12,7 cm en este mismo eje. Presentan una ecoestructura interna conservada, con adecuado espesor cortical, y buena diferenciación entre parénquima y seno renal.
No se identifica dilatación pielocaliciaria ni imágenes sugerentes de litiasis.
Ambas arterias renales se encuentran permeables, y presentan velocidades de flujo en sus picos sistólicos dentro de límites normales. Índices aorto-renales normales.
Venas renales permeables.
El estudio de la vasculatura intrarrenal demostró que los índices resistivos se encuentran dentro de límites normales, con peak sistólico precoz y velocidad de aceleración conservada.
No se observa líquido ni colecciones en situación perirrenal.

IMPRESIÓN:
Examen sin evidencia de estenosis hemodinámicamente significativa a nivel de las arterias renales.
```


## Doppler Renal Transplantado

Código: `dopplerrenaltransplante`

```text
ANTECEDENTES CLÍNICOS:
Control trasplante renal.

HALLAZGOS:
riñónes nativos a tróficos.
Se identifica injerto renal en FID, el cual mide 12,5 x 5,0 x 7,4 cm, con un volumen aproximado de 240 cc. Presentan una ecoestructura interna conservada, con adecuado espesor cortical, y buena diferenciación entre parénquima y seno renal.
No se identifica dilatación pielocaliciaria ni imágenes sugerentes de litiasis.
La arteria renal se encuentra permeable, y presenta velocidades de flujo en sus picos sistólicos dentro de límites normales.
Índice reno ilíaco normales.
Vena renal permeables.
El estudio de la vasculatura intrarrenal demostró que los índices resistivos se encuentran dentro de límites normales, con peak sistólico precoz y velocidad de aceleración conservada.
No se observa líquido ni colecciones en situación perirrenal.

IMPRESIÓN:
Control de trasplante renal, sin evidencia de estenosis significativa a nivel de la arteria del riñón trasplantado.
```


## Doppler Arteria Temporal - Normal

Código: `dopplertemporaln`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.
Se explora con transductor lineal de alta resolución ambas arterias temporales principales así como sus ramas parietales y occipitales.
Las arterias y sus ramas presentan morfología normal, sin evidencia de estenosis significativa.
No se visualizan signo del halo ni focos de oclusión.
Al estudio o Doppler espectral ambas arterias y sus ramas presentan curvas de alta resistencia con velocidades de hasta aproximadamente 40 cm/s, normal.

IMPRESIÓN:
Examen sin evidencias categóricas de una arteritis de la temporal.
```


## Doppler Testicular - Normal

Código: `dopplertesticularn`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Ambos testículos se encuentran en el saco escrotal al momento del examen, y son de tamaño y morfología normal. Su parénquima es homogéneo y no se observan lesiones focales.
El testículo derecho mide cm y el izquierdo mide cm en sus ejes longitudinal, anteroposterior y transversal respectivamente.
Ambos testículos presentan perfusión arterial homogénea y simétrica.
Epidídimos sin alteraciones.
No hay hidrocele.
En situación extratesticular no hay signos sugerentes de varicocele.

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## Doppler Várices EEII - Insuficiencia

Código: `dopplervarices1`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Las venas femoral común, femoral profunda, femoral superficial y poplítea presentan caracteres morfológicos normales. Muestran flujo espontáneo, de tipo bifásico, que varía con los movimientos respiratorios. No hay signos de insuficiencia venosa profunda.
Las venas tibiales posteriores, peroneas y gastrocnemias no muestran alteraciones.
Venas safenas interna y externa permeables. Signos de insuficiencia venosa con regurgitación al Valsalva de ambas safenas mayores.
Colaterales compresibles en la cara medial de la pierna derecha dependientes de la vena safena mayor insuficiente. Perforante muscular insuficiente en la cara medial de la pierna derecha.
No se demostraron imágenes endoluminales sospechosas de trombosis.
Piel y tejido celular subcutáneo sin alteraciones.

IMPRESIÓN:
Examen negativo para trombosis venosa profunda femoro-poplítea e infrapoplítea.
No hay insuficiencia venosa profunda significativa.
Signos de insuficiencia venosa superficial de ambas safenas mayores con colaterales superficiales en la cara medial de la pierna derecha.
```


## Doppler Várices - Insuficiencia Superficial y Profunda

Código: `dopplervarices2`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Las venas femoral común, femoral profunda, femoral superficial y poplítea presentan caracteres morfológicos normales. Muestran flujo espontáneo, de tipo bifásico, que varía con los movimientos respiratorios. Signos de moderada insuficiencia venosa profunda en venas femorales comunes, superficiales y poplíteas bilaterales.
Las venas tibiales posteriores, peroneas y gastrocnemias no muestran alteraciones.
Venas safenas interna y externa permeables. Signos de insuficiencia venosa con regurgitación al Valsalva de ambas safenas mayores y menores con colaterales compresibles en ambas piernas dependientes de ambas venas safenas insuficiente.
No se demostraron imágenes endoluminales sospechosas de trombosis.
Piel y tejido celular subcutáneo sin alteraciones.

IMPRESIÓN:
Examen negativo para trombosis venosa profunda femoro-poplítea e infrapoplítea.
Moderada insuficiencia venosa profunda femoropoplítea bilateral.
Signos de insuficiencia venosa superficial de ambas safenas mayores y menores con colaterales superficiales en ambas piernas.
```


## Doppler Várices EEII - Esquema ordenado

Código: `dopplervariceseeii ordenado`

```text
ANTECEDENTES CLÍNICOS:
Varices

HALLAZGOS:
SISTEMA VENOSO PROFUNDO:

Las venas femorales comunes, femorales profundas, femorales superficiales y poplíteas presentan caracteres morfológicos normales. Muestran flujo espontáneo, de tipo bifásico, que varía con los movimientos respiratorios.
Las venas tibiales posteriores, gastrocnemias, sóleas y peroneas no muestran alteraciones.No se demostraron imágenes endoluminales sospechosas de trombosis.
Piel y tejido celular subcutáneo sin alteraciones.

SISTEMA VENOSO SUPERFICIAL:

EXTREMIDAD INFERIOR DERECHA:

Venas safena interna y externa, permeables.
El cayado de la vena safena interna derecha mide 4,8 mm y es insuficiente en toda su extensión. Demuestra cambios flebíticos de aspecto crónico.
Perforante insuficiente a 10 cm y a 20 cm del MI.
Várices por la cara medial de la pierna.

EXTREMIDAD INFERIOR IZQUIERDA:

Venas safena interna y externa, permeables.
El cayado de la vena safena interna izquierda mide 9,9 mm y es insuficiente en toda su extensión.
Perforante insuficiente a 25 cm MI. Otra a 10 cm MI.
Varices mediales.

IMPRESIÓN:
Examen negativo para trombosis venosa profunda femoro-poplítea e infrapoplítea.
Insuficiencia venosa superficial bilateral en territorio de ambas venas safenas internas, con paquetes varicosos y perforantes insuficientes, según lo descrito.
```


## Doppler Venoso EEII - Normal

Código: `dopplervaricesn`
Código duplicado: sí, variante 2

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Las venas femorales comunes, femorales profundas, femorales superficiales y poplíteas presentan caracteres morfológicos normales. Muestran flujo espontáneo, de tipo bifásico, que varía con los movimientos respiratorios.
Las venas tibiales posteriores, peroneas y gastrocnemias no muestran alteraciones.
Venas safenas internas y externas permeables. No hay regurgitación venosa al Valsalva.
No se demostraron imágenes endoluminales sospechosas de trombosis.
Piel y tejido celular subcutáneo sin alteraciones.

IMPRESIÓN:
Examen sin evidencia de TVP.
Estudio sin signos de insuficiencia venosa superficial ni profunda.
```


## Doppler Venoso EEII - Insuficiencia Venosa

Código: `dopplervenosoivs`

```text
ANTECEDENTES CLÍNICOS:
Varices

HALLAZGOS:
Las venas femorales comunes, femorales profundas, femorales superficiales y poplíteas presentan caracteres morfológicos normales. Muestran flujo espontáneo, de tipo bifásico, que varía con los movimientos respiratorios.
Las venas tibiales posteriores, gastrocnemias, sóleas y peroneas no muestran alteraciones.
El cayado de la vena safena interna derecha mide 6,3 mm y presenta insuficiencia segmentaria de la vena safena interna en el tercio distal del muslo y proximal de la pierna.
El cayado de la vena safena interna izquierda mide 6,3 mm y presenta insuficiencia segmentaria de la vena safena interna en el tercio distal del muslo y proximal de la pierna.
Venas safenas externas permeables, competentes.
No se demostraron imágenes endoluminales sospechosas de trombosis.
Piel y tejido celular subcutáneo sin alteraciones.

IMPRESIÓN:
Insuficiencia venosa superficial bilateral en territorio de ambas venas safenas internas que dan origen a paquetes varicosos en territorio dependiente.
Examen negativo para trombosis venosa profunda femoro-poplítea e infrapoplítea.
```


## Doppler Venoso - Normal

Código: `dopplervenoson`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Las venas femoral común, femoral profunda, femoral superficial y poplítea presentan caracteres morfológicos normales. Muestran flujo espontáneo, de tipo bifásico, que varía con los movimientos respiratorios.
Las venas tibiales posteriores, peroneas, gastrocnemias y sóleas, no muestran alteraciones.
Venas safenas interna y externa permeables.
No se demostraron imágenes endoluminales sospechosas de trombosis.
Piel y tejido celular subcutáneo sin alteraciones.

IMPRESIÓN:
Examen sin evidencia de trombosis venosa profunda femoropoplítea e infrapoplítea.
```


## Eco Hombro - Tendinosis del subescapular y supraespinoso.

Código: `ecohombro sesub`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Tendón de la porción larga del bíceps bien situado en la corredera bicipital, de grosor y patrón fibrilar conservado, sin líquido en su vaina.
Intervalo rotador de configuración habitual.
Tendón del infraespinoso de grosor y patrón fibrilar normal, sin desgarros.
Leve engrosamiento e hipoecogenicidad heterogénea del subescapular y supraespinoso, sin desgarros.
Articulación acromioclavicular congruente.
No se observa derrame articular, evaluado en receso glenohumeral posterior.
No hay distensión ni engrosamiento de la bursa subacromio-subdeltoídea.

IMPRESIÓN:
Leve tendinopatía del subescapular y supraespinoso.
```


# Ecografía


## Desglose de Artrosis

Código: `Artrosis1`

```text
determinados por disminución del espacio articular, esclerosis subcondral y aguzamiento de los márgenes óseos.
```


## HPB LEVE

Código: `ECO PROSTATA`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Vejiga en repleción parcial, de paredes finas, sin imágenes endoluminales patológicas. Volumen premiccional cc.

Glándula prostática aumentada de tamaño, homogénea, de bordes bien definidos, mide 4,3 x 3,8 x 2,8 cm en sus ejes mayores, con un volumen aproximado 24 cc.

Vesículas seminales simétricas.

No se identifica líquido libre en la excavación pelviana.

No hay residuo postmiccional significativo (volumen aproximado 12 cc).

IMPRESIÓN:
Aumento del volumen prostático.
```


## Lipoma

Código: `LIPO`

```text
Tejido subcutáneo de ecogenicidad conservada. Imagen mamaria izquierda bien definida de similar ecogenicidad al tejido adiposo circundante, ubicada en el plano celular subcutáneo, que mide 13 x 5 x 16 mm, sin flujo al Doppler color.
```


## HPB ACENTUADA

Código: `PROSTATA HP`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Vejiga en repleción parcial, de paredes finas, sin imágenes endoluminales patológicas. Volumen premiccional cc.

Glándula prostática aumentada de tamaño, indenta el piso vesical, mide 4,3 x 3,8 x 2,8 cm en sus ejes mayores, con un volumen aproximado cc.

Vesículas seminales simétricas.

No se identifican masas en relación a los vasos iliacos.

No se observa líquido libre en la excavación pelviana.

Residuo postmiccional significativo (volumen aproximado 12 cc).

IMPRESIÓN:
Acentuado aumento del volumen prostático asociado a residuo postmiccional siginificativo.
```


## hemangioma hepatico

Código: `abdominal`

```text
ANTECEDENTES CLÍNICOS:
Sin antecedentes en orden médica.

HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y en los comentarios del operador.

Hígado de forma, tamaño y ecogenicidad normales.

En el segmento hepático II se identifica una lesión focal hiperecogénica, homogénea, de contornos bien definidos, que mide aproximadamente 21 mm, con refuerzo acústico posterior, con aspecto típico de hemangioma.

En el segmento hepático VIII se observa otra lesión focal con características similares a las descritas previamente, que mide aproximadamente 14 mm

Vesícula biliar en repleción, de paredes finas, sin evidencia de litiasis.

Vía biliar intra y extrahepática de calibre normal.

Segmentos visibles del bazo y páncreas sin alteraciones.

riñónes de tamaño y morfología normal, con adecuado espesor cortical y diferenciación corticomedular. No se observa dilatación pielocalicial ni imágenes sugerentes de litiasis.

Segmentos visibles de la aorta abdominal de calibre conservado.

No se observa líquido libre intraabdominal.

IMPRESIÓN:
Lesiones focales hepáticas de aspecto ecográfico típico de hemangiomas.

Sin otros hallazgos de significado patológico.
```


## adenomiomatosis eco abdo

Código: `adenomiomatosis vesicular`

```text
ANTECEDENTES CLÍNICOS:
chequeo

HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Hígado de forma, tamaño y ecogenicidad normales. No se observan lesiones focales en el espesor del parénquima.

Vesícula biliar en repleción, de paredes finas, no se identifican imágenes sugerentes de litiasis. En el fondo vesícular se observan focos ecogénicos con artefacto en forma de cola de cometa, compatiblen con adenomiomatosis.

Vía biliar intra y extrahepática de calibre normal.

Segmentos visibles del bazo y páncreas sin alteraciones.

riñónes de tamaño y morfología normal. Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal. No se observa dilatación pielocaliciaria ni imágenes sugerentes de litiasis.

Segmentos visibles de la aorta abdominal de calibre conservado.

No se observa líquido libre intraabdominal.

IMPRESIÓN:
Hallazgos compatibles con adenomiomatosis vesícular.

Resto del examen sin hallazgos de significado patológico.
```


## antebrazo normal

Código: `antebrazo normal`

```text
ANTECEDENTES CLÍNICOS:
compresion del nervio rdial

HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.

Con transductor lineal de alta frecuencia se explora la región señalada.

Complejo dermo epidérmico y tejido celular subcutáneo sin alteraciones evidentes.

Planos musculares y tendinosos explorados de grosor y patrón fibrilar normal, sin evidencia de desgarros.

Estructuras vasculares visibles, permeables.Nervio mediano, cubital y radial de grosor y patrón fascicular conservado

No hay adenopatías regionales.

No se observan resaltes corticales.

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## gatillo

Código: `dedoen gatillo`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

El examen demuestra un engrosamiento hipoecogénico circunferencial en la polea A1 del tendón flexor, manifestación de tenosinovitis focal, observando restricción del paso tendineo al estudio dinámico. Los restantes componentes del tendón flexor demuestran grosor y patrón fibrilar normales.
No hay signos de derrame articular ni sinovitis.
Contorno óseo visible de aspecton regular.

IMPRESIÓN:
Tenosinovitis focal estenosante de polea A1, hallazgo que se observa en el contecto clínico de síndrome de ''dedo en gatillo''.
```


## paredabdominal

Código: `diastasis y hernia umbilical`

```text
ANT. CLÍNICOS:

HALLAZGOS:
Con transductor lineal de alta resolución se explora en forma dirigida la región anterolateral del abdomen.

Tejido subcutáneo de ecogenicidad normal.

diástasis de los rectos abdominales a nivel supraumbilical de hasta 3.3 cm.En la región umbilical, se identifica un defecto musculoaponeurótico, cuyo anillo alcanza un diámetro de ___ mm y da salida espontánea a contenido adiposo, conformando un saco herniado de ___ mm en reposo. Aumenta con maniobras de valsalva y se reduce parcialmente en reposo. No hay signos de complicación actual.

No se identifican hernias en relación a la línea media supra ni infraumbilical.

No hay alteraciones en las líneas semilunares.

No hay colecciones ni masas en los planos profundos.

IMPRESIÓN:
diástasis de los rectos abdominales supraumbilical.

hernia umbilical con contenido adiposo, sin signos de complicacion
```


## Eco abdomen - Esteatosis - Colelitiasis

Código: `ecoabdomen estcole`

```text
ANTECEDENTES CLÍNICOS:
Dolor abdominal.

HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

El hígado es de tamaño y morfología normal. Se observa aumento de su ecogenicidad asociado a pérdida de la definición de estructuras vasculares. En estas condiciones, no se observan lesiones focales en el espesor del parénquima.
Vesícula biliar en repleción, de paredes finas, con cálculos móviles en su interior.
Vía biliar de calibre normal.
riñónes de tamaño y morfología normal. Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal. No se observa dilatación pielocaliciaria ni imágenes sugerentes de litiasis.
Segmentos visibles del bazo y páncreas sin alteraciones.
Segmentos visibles de la aorta abdominal de calibre conservado.
No se observa líquido libre intraabdominal.

IMPRESIÓN:
Colelitiasis.
Signos de esteatosis hepática difusa.
```


## Eco Abdominal - Pólipo & Esteatosis

Código: `ecoabdomen polipoest`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

El hígado es de tamaño y morfología normal. Presenta aumento difuso de la ecogenicidad, lo que determina perdida de la definición de estructuras vasculares. En estas condiciones, no se observan lesiones focales en el espesor del parénquima.
Vesícula biliar en repleción, de paredes finas, con imágen ecogénica parietal de ___ mm que no se moviliza y no proyecta sombra acústica posterior, sugerente de pólipo.
Vía biliar intra y extrahepática de calibre normal.
riñónes de tamaño y morfología normal. Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal. No se observa dilatación pielocaliciaria ni imágenes sugerentes de litiasis.
Segmentos visibles del bazo y páncreas sin alteraciones.
Segmentos visibles de la aorta abdominal de calibre conservado.
No hay líquido libre intraabdominal.

IMPRESIÓN:
Pólipo vesícular.
Esteatosis hepática difusa.
```


## Eco abdomen - Colecistectomizada.

Código: `ecoabdomencolecis`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Hígado de forma, tamaño y ecogenicidad normales. No se observan lesiones focales en el espesor del parénquima.
Vesícula biliar no visualizada (antecedente quirúrgico).
Vía biliar intra y extrahepática de calibre normal.
riñónes de tamaño y morfología normal. Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal. No se observa dilatación pielocaliciaria ni imágenes sugerentes de litiasis.
Segmentos visibles del bazo y páncreas sin alteraciones.
Segmentos visibles de la aorta abdominal de calibre conservado.
No se observa líquido libre intra abdominal.

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## Eco abdomen - Colelitiasis

Código: `ecoabdomencolelitiasis`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Hígado de forma, tamaño y ecogenicidad normales. No se observan lesiones focales en el espesor del parénquima.
Vesícula biliar en repleción, de paredes finas, con cálculos móviles en su interior.
Vía biliar de calibre normal.
riñónes de tamaño y morfología normal. Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal. No se observa dilatación pielocaliciaria ni imágenes sugerentes de litiasis.
Segmentos visibles del bazo y páncreas sin alteraciones.
Segmentos visibles de la aorta abdominal de calibre conservado.
No hay líquido libre intraabdominal.

IMPRESIÓN:
Colelitiasis.
```


## Eco Abdomen - DHC

Código: `ecoabdomendhc`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.
Hígado de contornos nodulares, cisuras amplias y prominencia del lóbulo caudado. Su ecoesctrutura interna es gruesa y heterogénea. No se obsservan lesiones focales.
Vena porta...
Vesícular biliar en repleción, de pared fina, sin cálculos en su interior.
Vía biliar intra y extrahepática de calibre normal.
riñónes de tamaño y morfología normal. Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal. No se observa dilatación pielocaliciaria ni imágenes sugerentes de litiasis.
Segmentos visibles del páncreas y bazo sin alteraciones.
Segmentos visibles de la aorta abdominal de calibre conservado.

IMPRESIÓN:
Hallazgos compatibles con daño hepático crónico.
```


## Eco abdomen - Esteatosis - Colesterolosis

Código: `ecoabdomenesco`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

El hígado es de tamaño y morfología normal. Se observa aumento de su ecogenicidad asociado a perdida de la definición de estructuras vasculares. En estas condiciones, no se observan lesiones focales en el espesor del parénquima.
Vesícula biliar en repleción, de paredes finas, sin cálculos en su interior. Foco ecogénico parietal que determina artefacto en cola de cometa, sugerente de colesterolosis.
Vía biliar de calibre normal.
riñónes de tamaño y morfología normal. Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal. No se observa dilatación pielocaliciaria ni imágenes sugerentes de litiasis.
Segmentos visibles del bazo y páncreas sin alteraciones.
Segmentos visibles de la aorta abdominal de calibre conservado.
No se observa líquido libre intraabdominal.

IMPRESIÓN:
Signos de esteatosis hepática difusa.
Foco sugerente de colesterolosis vesícular.
```


## Eco abdomen - Esteatosis

Código: `ecoabdomenest`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

El hígado es de tamaño y morfología normal. Se observa aumento de su ecogenicidad asociado a pérdida de la definición de estructuras vasculares. En estas condiciones, no se observan lesiones focales en el espesor del parénquima.
Vesícula biliar en repleción, de paredes finas, sin cálculos.
Vía biliar de calibre normal.
riñónes de tamaño y morfología normal. Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal. No se observa dilatación pielocaliciaria ni imágenes sugerentes de litiasis.
Segmentos visibles del bazo y páncreas sin alteraciones.
Segmentos visibles de la aorta abdominal de calibre conservado.
No se observa líquido libre intraabdominal.

IMPRESIÓN:
Signos de esteatosis hepática difusa.
```


## Eco abdomen - Esteatosis - Colecistectomizado

Código: `ecoabdomenestcolecis`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

El hígado es de tamaño y morfología normal. Presenta aumento difuso de la ecogenicidad de su parénquima, lo que determina pérdida de la definición de estructuras vasculares. En estas condiciones, no se observan lesiones focales en el espesor del parénquima.
Vesícula biliar no visualizada (antecedente quirúrgico).
Vía biliar intra y extrahepática de calibre normal.
riñónes de tamaño y morfología normal. Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal. No se observa dilatación pielocaliciaria ni imágenes sugerentes de litiasis.
Segmentos visibles del bazo y páncreas sin alteraciones.
Segmentos visibles de la aorta abdominal de calibre conservado.
No hay líquido libre intra abdominal.

IMPRESIÓN:
Signos de esteatosis hepática difusa.
```


## Eco abdomen - Normal

Código: `ecoabdomenn`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Hígado de forma, tamaño y ecogenicidad normales. No se observan lesiones focales en el espesor del parénquima.
Vesícula biliar en repleción, de paredes finas, no se identifican imágenes sugerentes de litiasis.
Vía biliar intra y extrahepática de calibre normal.
Segmentos visibles del bazo y páncreas sin alteraciones.
riñónes de tamaño y morfología normal. Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal. No se observa dilatación pielocaliciaria ni imágenes sugerentes de litiasis.
Segmentos visibles de la aorta abdominal de calibre conservado.
No se observa líquido libre intraabdominal.

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## Eco Abdominal - Nefrolitiasis

Código: `ecoabdomennefrolitiasis`

```text
ANTECEDENTES

CLÍNICOS
:

HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Hígado de forma, tamaño y ecogenicidad normales. No se observan lesiones focales en el espesor del parénquima.
Vesícula biliar en repleción, de paredes finas, no se identifican imágenes sugerentes de litiasis.
Vía biliar intra y extrahepática de calibre normal.
Segmentos visibles del bazo y páncreas sin alteraciones.
riñónes de tamaño y morfología normal. Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal. Imagen hiperecogénica en seno renal derecho / izquiero de ___ mm, sugerente de litiasis. No hay hidronefrosis.
Segmentos visibles de la aorta abdominal de calibre conservado.
No se observa líquido libre intraabdominal.

IMPRESIÓN:
Nefrolitiasis derecha, no obstructiva.
```


## Eco abdomen - Pólipo vesicular

Código: `ecoabdomenpolipo`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Hígado de forma, tamaño y ecogenicidad normales. No se observan lesiones focales en el espesor del parénquima.
Vesícula biliar en repleción, de paredes finas, no se identifican imágenes sugerentes de litiasis. Pequeña imagen polipoidea dependiente de la pared avascular, mide ___ mm.
Vía biliar intra y extrahepática de calibre normal.
Segmentos visibles del bazo y páncreas sin alteraciones.
riñónes de tamaño y morfología normal. Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal. No se observa dilatación pielocaliciaria ni imágenes sugerentes de litiasis.
Segmentos visibles de la aorta abdominal de calibre conservado.
No se observa líquido libre intraabdominal.

IMPRESIÓN:
Pólipo vesícular.
```


## Eco Tendón de Aquiles - Rotura

Código: `ecoaquilesroto`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Con transductor lineal de alta resolución se explora dirigidamente la región referida.
Piel y tejido subcutáneo de ecogenicidad conservada.
Se observa desgarro completo del Tendón de Aquiles con un gap de xxx cm al cabo distal. Su defecto se encuentra ocupado por posible contenido hemático.
Grasa de kager de ecogenicidad normal.

IMPRESIÓN

Desgarro completo del Tendón de Aquiles.
```


## Eco Tendón de Aquiles - Tenoentesopatía

Código: `ecoaquilesteno`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Con transductor lineal de alta resolución se explora dirigidamente la región plantar del pie derecho
Piel y tejido subcutáneo de ecogenicidad conservada.
Tendón de Aquiles de grosor levemente aumentado y patrón fibrilar conservado, sin signos de desgarros. Calcificaciones de hasta 12 mm e irregularidad cortical en su inserción distal.
Grasa de kager de ecogenicidad normal.

IMPRESIÓN:
Tenoentesopatía aquiliana.
```


## Eco Caderas - Normal

Código: `ecocaderan`

```text
ANTECEDENTES CLÍNICOS:
Dolor inguinal.

HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Receso articular coxofemoral anterior sin distensión líquida que sugiera de derrame articular.
Musculo y tendón psoas iliaco de aspecto normal. No hay signos de bursitis iliopectínea.
Tendones recto femoral y sartorio sin alteraciones.
Tendones glúteos menor y medio de grosor y patrón fibrilar conservado.
Tendón tensor de la fascia lata de grosor normal.
No hay signos de bursitis pertrocantérea.

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## Eco Caderas - Tendinosis

Código: `ecocaderatendinosis`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Con transductor lineal de alta resolución se explora en forma dirigida las partes blandas de la cadera correspondiente.
Tejido subcutáneo de ecogenicidad conservada.
Planos musculares visibles de patrón fibrilar normal.
Se aprecia engrosamiento e hipoecogenicidad de la inserción distal del tendón del glúteo menor y glúteo medio, sin desgarros evidentes.
Estructuras vasculares visibles permeables.
No hay masas ni colecciones en los planos profundos.
No hay derrame articular en el receso anterior.
No hay bursitis.

IMPRESIÓN:
tendinosis del glúteo menor y glúteo medio.
```


## Eco Cerebral RN - Normal

Código: `ecocerebral`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Tercer y cuarto ventrículos en la línea media.
Tronco encéfalo y cerebelo sin alteraciones evidentes.
Ventrículos laterales de configuración y volumen normales.
En el parénquima cerebral no se observan alteraciones.
Amplitud del espacio subaracnoideo dentro de rangos normales.
Resto del examen sin hallazgos patológicos.

IMPRESIÓN:
Examen sin hallazgos patológicos.
```


## Eco PB cervical - Normal

Código: `ecocervicaln`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Piel y tejido celular subcutáneo de grosor y ecogenicidad conservada.
Planos musculares de trayectos fibrilares, homogéneos.
Glándulas Parótidas y submaxilares simétricas de tamaño, morfología y ecogenicidad adecuados.
Espacio Submentoniano conservado.
Estructuras vasculares sin alteraciones.
Glándula tiroides de forma, tamaño y ecogenicidad normales, con adecuada vascularización al estudio Doppler color. No se observan nodulos en el espesor del parénquima.
No se observan adenopatías cervicales en las cadenas exploradas.

IMPRESIÓN:
Examen sin hallazgos destacables.
```


## Eco Cervical - Tiroiditis crónica

Código: `ecocervicaltiroiditiscronica`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Piel y tejido celular subcutáneo de grosor y ecogenicidad conservada.
Planos musculares de trayectos fibrilares, homogéneos.
Glándulas Parótidas y submaxilares simétricas de tamaño, morfología y ecogenicidad adecuados.
Espacio Submentoniano conservado.
Estructuras vasculares sin alteraciones.
Glándula Tiroides: Se observa disminuida de tamaño. Su ecoestructura interna es gruesa, hipoecogénica y heterogénea, y no presenta aumento del flujo vascular al estudio Doppler - color. El istmo alcanza un espesor de ___ mm.
No se observan adenopatías cervicales en las cadenas exploradas.

IMPRESIÓN:
Signos sugerentes de una tiroiditis crónica.
```


## Eco Codo Epicondilitis y Epitrocleítis

Código: `ecocodo epiepi`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tendón del bíceps y del tríceps sin alteraciones.
Cápsula articular sin signos de distensión que sugiera la presencia de derrame articular.
Se aprecia engrosamiento e hipoecogenicidad del tendón extensor y flexor común en su inserción proximal, sin signos de rotura.
Nervio cubital situado medial al canal epitrócleo-olecraneano en flexión volviendo a su posición habitual en extensión, de grosor normal, con un área transversal de ___ mm².
Fascia de Osborne de grosor normal.

IMPRESIÓN:
tendinosis del extensor y flexor común de los dedos.
```


## Eco Codo - Epi Neuro

Código: `ecocodo epineuro`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Tendón del bíceps y del tríceps sin alteraciones.
Cápsula articular sin signos de distensión que sugiera la presencia de derrame articular.
Se aprecia engrosamiento e hipoecogenicidad del tendón extensor común en su inserción proximal en el epicóndilo lateral, sin signos de rotura.
Tendón tendón flexor común evaluado en epicóndilo medial, de patrón fibrilar conservado.
Nervio cubital engrosado e hipoecogénico, con un área transversal de 12 mm².
Fascia de Osborne de grosor normal.

IMPRESIÓN:
tendinosis del extensor común de los dedos.
Engrosamiento del nervio cubital, que podría sugerir una neuropatía compresiva.
```


## Eco Codo - Neuro

Código: `ecocodo neuro`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Tendón del bíceps y del tríceps sin alteraciones.
Cápsula articular sin signos de distensión que sugiera la presencia de derrame articular.
Tendon extensor comun evaluado a nivel del epicóndilo lateral y tendon flexor comun evaluado en epicóndilo medial, de patron fibrilar conservado.
Nervio cubital bien situado en el canal epitrócleo-olecraneano, levemente engrosado con un área transversal de ___ mm².
Fascia de Osborne de grosor normal.

IMPRESIÓN:
Leve engrosamiento del nervio cubital que podría sugerir neuropatia. Corroborar con clínica.
```


## Eco Codo - Epicondilitis

Código: `ecocodoepi`

```text
ANT. clínicoS:

HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tendón del bíceps y del tríceps sin alteraciones.
Cápsula articular sin signos de distensión que sugiera la presencia de derrame articular.
Se aprecia engrosamiento e hipoecogenicidad del tendón extensor común en su inserción proximal en el epicóndilo lateral, sin signos de rotura.
Tendón tendón flexor común evaluado en epicóndilo medial, de patrón fibrilar conservado.
Nervio cubital bien situado en canal epitrócleo-olecraneano, de trayecto y calibre normal, con un área transversal de ___ mm².
Fascia de Osborne de grosor normal.

IMPRESIÓN:
tendinosis del extensor común de los dedos.
```


## Eco Codo - Epicondilitis - Neuro

Código: `ecocodoepineuro`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tendón del bíceps y del tríceps sin alteraciones.
Cápsula articular sin signos de distensión que sugiera la presencia de derrame articular.
Se aprecia engrosamiento e hipoecogenicidad del tendón extensor común en su inserción proximal en el epicóndilo lateral, sin signos de rotura.
Tendón tendón flexor común evaluado en epicóndilo medial, de patrón fibrilar conservado.
Nervio cubital situado medial al canal epitrócleo-olecraneano en flexión volviendo a su posición habitual en extensión, levemente engrosado con un área transversal de ___ mm².
Fascia de Osborne de grosor normal.

IMPRESIÓN:
tendinosis del tendón extensor común de los dedos.
Neuropatia y subluxación del nervio cubital
```


## Eco Codo - Normal

Código: `ecocodon`

```text
ANT. CLÍNICOS
: Dolor.

HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Tendón del bíceps y del tríceps sin alteraciones.
Cápsula articular sin signos de distensión que sugiera la presencia de derrame articular.
Tendón extensor común evaluado a nivel del epicóndilo lateral y tendón flexor común evaluado en epicóndilo medial, de patrón fibrilar conservado.
Nervio cubital bien situado en canal epitrócleo-olecraneano, de trayecto y calibre normal, con un área transversal de ___ mm².
Fascia de Osborne de grosor normal.

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## Eco Testicular - Criptorquidia Bilateral

Código: `ecocriptorquidia`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Ambos testículos permanecen en canal inguinal durante el examen y no descienden con maniobras de compresión.
Los testículos son de tamaño y forma normal. Su ecoestructura interna es homogénea, sin evidencia de lesiones focales intraparenquimatosas.
El testículo derecho mide 1,5 x 0,8 x 0,9 cm en sus diámetros longitudinal, anteroposterior y transversal respectivamente. El testículo izquierdo mide 1,4 x 0,8 x 1,0 cm en estos mismos ejes.
Ambos epidídimos son de aspecto ecotomográfico normal.
No hay signos de hidrocele.
En situación extratesticular no se observa dilatación de las venas del plexo pampiniforme sugerente de varicocele.

IMPRESIÓN:
Signos de criptorquidia bilateral.
```


## Eco PB - Desgarro muscular

Código: `ecodesgarro`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Con transductor lineal de alta frecuencia se explora la región señalada.
Se observa desgarro de la unión míotendínea distal del gastrocnemio medial asociado a pequeña colección laminar, mide aproximadamente 8,2 cm de longitud y un ancho aproximado de 3,7 cm.
Restantes planos musculares y tendíneos visibles sin alteraciones.
No hay masas ni colecciones en los planos profundos.
Estructuras vasculares regionales permeables.
No hay adenopatías.

IMPRESIÓN:
Desgarro de la unión míotendínea distal del gastrocnemio medial
```


## Eco Pelviana Femenina - Normal

Código: `ecofemeninan`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.
Vejiga en repleción, de paredes finas y sin imágenes endoluminales. Volumen premiccional 235 cc.
Útero en anteversión, de tamaño y morfología normal para la edad, mide ___ mm en sus ejes mayores.
Cavidad endometrial en línea media fina.
Ovarios de tamaño y ecogenicidad normal. Ovarios no visualizados por interposición de asas con gas.
No hay masas anexiales.
No se observa líquido libre en excavación pelviana.
Volumen postmiccional cc.

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## Eco Pelvis Femenina Pediátrica - Normal

Código: `ecofemeninaped`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
El útero posee una morfología *. Mide ___ mm en los ejes longitudinal, anteroposterior y transversal respectivamente. Su estructura interna se encuentran dentro de límites normales con identificación parcial de una fina línea endometrial.
Ambos ovarios poseen características morfológicas dentro de límites normales, con pequeños folículos en centro. El derecho mide ___ mm (volumen aproximado de 2,1 cc) y el izquierdo mm (volumen aproximado de 1,8 cc).
No se visualizan masas patológicas en la pelvis.
No se observa líquido libre en la excavación pelviana.
```


## Eco Tórax - Fractura

Código: `ecofx`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Con transductor lineal de alta resolución se explora en forma dirigida la región torácica anterolateral respectiva.
Tejido subcutáneo de ecogenicidad conservada.
Se identifica irregularidad y resalte cortical en el arco anterolateral de la quinta costilla izquierda, sugerente de fractura. Restantes arcos explorados impresionan continuos.
Planos musculares visibles sin alteraciones.
No hay masas ni colecciones en los planos profundos.

IMPRESIÓN:
Signos sugerentes de fractura no desplazada del quinto arco costal.
```


## Eco Pelviana Masculina - HBP

Código: `ecohbpleve`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Vejiga en repleción parcial, de paredes finas, sin imágenes endoluminales patológicas. Volumen premiccional cc.
Glándula prostática aumentada de tamaño, homogénea, de bordes bien definidos, mide ___ mm en sus ejes mayores, con un volumen aproximado cc.
Vesículas seminales simétricas.
No se identifica líquido libre en la excavación pelviana.
Residuo postmiccional aproximado de cc.

IMPRESIÓN:
Crecimiento prostático.
```


## Eco Pelviana Masculina - HBP 1

Código: `ecohbpmod`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Vejiga en repleción, de paredes finas, sin imágenes endoluminales patológicas. Volumen premiccional cc.
Glándula prostática aumentada de tamaño, homogénea, de bordes bien definidos, mide ___ mm en sus ejes mayores, con un volumen aproximado cc.
Vesículas seminales simétricas.
No se identifica líquido libre en la excavación pelviana.
Residuo postmiccional aproximado de cc.

IMPRESIÓN:
Crecimiento prostático.
Aumento del volumen residual post miccional.
```


## Eco Pelviana Masculina - Normal

Código: `ecohbpn`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Vejiga en repleción parcial, de paredes finas, sin imágenes endoluminales patológicas. Volumen premiccional cc.
Glándula prostática de tamaño normal, homogénea, de bordes bien definidos, mide ___ mm en sus ejes mayores, con un volumen aproximado cc.
Vesículas seminales simétricas.
No se observa líquido libre en la excavación pelviana.
Residuo postmiccional aproximado de cc.

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## Eco Inguinal - Hernia Crural

Código: `ecoherniacrural`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Línea semilunar continua, sin defectos focales.
En la región crural, se identifica un defecto musculoaponeurótico, cuyo anillo alcanza un diámetro de 0,5 cm y da salida espontánea a contenido adiposo, conformando un saco de ___ mm con Valsalva, reduciéndose parcialmente en reposo. No hay signos de complicación actual.
No hay una hernia inguinal.
Vasos femorales permeables.
No hay adenopatías regionales.

IMPRESIÓN:
Hernia crural con contenido omental, sin signos de complicación.
```


## Eco Inguinal - Hernia Inguinal

Código: `ecoherniainguinal`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Línea semilunar continua, sin defectos focales.
En la región inguinal, se identifica un defecto musculoaponeurótico, cuyo anillo alcanza un diámetro de ___ mm yda salida espontánea a contenido adiposo, conformando un saco herniado de ___ mm en reposo. Aumenta con maniobras de valsalva y se reduce parcialmente en reposo. No hay signos de complicación actual.
No hay una hernia crural.
Vasos femorales permeables.
No hay adenopatías regionales.

IMPRESIÓN:
Hernia inguinal con contenido omental, sin signos de complicación.
```


## Eco Hombro - Tendinopatía del SE - Bursitis

Código: `ecohombro sebursitis`
Código duplicado: sí, variante 1

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Tendón de la porción larga del bíceps bien situado en la corredera bicipital, de grosor y patrón fibrilar conservado, sin líquido en su vaina.
Intervalo rotador de configuración habitual.
Tendón del subescapular e infraespinoso de grosor y patrón fibrilar normal, sin desgarros.
Engrosamiento e hipoecogenicidad heterogénea del supraespinoso, sin desgarros.
Articulación acromioclavicular congruente.
No se observa derrame articular, evaluado en receso glenohumeral posterior.
Leve distensión y engrosamiento de la bursa subacromio-subdeltoídea.

IMPRESIÓN:
Tendinopatía del supraespinoso.
Bursitis subacromio-subdeltoídea.
```


## Eco Hombro - Tendinosis - Bursitis - Artrosis

Código: `ecohombro sebursitis`
Código duplicado: sí, variante 2

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Tendón de la porción larga del bíceps bien situado en la corredera bicipital, de grosor y patrón fibrilar conservado, sin líquido en su vaina.

Intervalo rotador de configuración habitual.

Tendón del subescapular e infraespinoso de grosor y patrón fibrilar normal, sin desgarros.

Leve engrosamiento e hipoecogenicidad heterogénea del supraespinoso, sin desgarros.

Articulación acromioclavicular con cambios degenerativos.

No se observa derrame articular, evaluado en receso glenohumeral posterior.

Leve distensión y engrosamiento de la bursa subacromio-subdeltoídea.

IMPRESIÓN:
Leve tendinosis del supraespinoso.

Leve bursitis subacromiosubdeltoidea.

Signos de artrosis acromioclavicular.
```


## Eco Hombro - Tendinopatía difusa - Bursitis

Código: `ecohombro tendinosisdifusa`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Tendón de la porción larga del bíceps bien situado en la corredera bicipital, de grosor y patrón fibrilar conservado, sin líquido en su vaina.
Intervalo rotador de configuración habitual.
Engrosamiento e hipoecogenicidad heterogénea del subescapular, supra e infraespinoso, sin desgarros.
Articulación acromioclavicular congruente.
No se observa derrame articular, evaluado en receso glenohumeral posterior.
Leve distensión y engrosamiento de la bursa subacromio-subdeltoídea.

IMPRESIÓN:
Tendinopatía del subescapular, supra e infraespinoso.
Leve bursitis subacromio-subdeltoídea.
```


## Eco Hombro - Tenosinovitis - Tendinosis SE

Código: `ecohombro tenotend`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tendón de la porción larga del bíceps bien situado en la corredera bicipital, levemente engrosado e hipoecogénico, con líquido en su vaina.
Intervalo rotador de configuración habitual.
Tendón del subescapular e infraespinoso de grosor y patrón fibrilar normal, sin desgarros.
Engrosamiento e hipoecogenicidad heterogénea del supraespinoso, sin desgarros.
Articulación acromioclavicular congruente.
No se observa derrame articular, evaluado en receso glenohumeral posterior.
No hay distensión ni engrosamiento de la bursa subacromio-subdeltoídea.

IMPRESIÓN:
Tenosinovitis bicipital.
Leve tendinopatía del supraespinoso.
```


## Eco Hombro - Bursitis

Código: `ecohombrobursitis`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Tendón de la porción larga del bíceps bien situado en la corredera bicipital, de grosor y patrón fibrilar conservado, sin líquido en su vaina.
Intervalo rotador de configuración habitual.
Tendón del subescapular e infraespinoso de grosor y patrón fibrilar normal, sin desgarros.
Tendón del supraespinoso de grosor y patrón fibrilar normal, sin desgarros.
Articulación acromioclavicular congruente.
No se observa derrame articular, evaluado en receso glenohumeral posterior.
Leve distensión y engrosamiento de la bursa subacromio-subdeltoídea.

IMPRESIÓN:
Bursitis subacromio-subdeltoídea.
```


## Eco Hombro - Tendinosis del Infraespinoso

Código: `ecohombroinfra`

```text
ANTECEDENTES CLÍNICOS:
Hombro doloroso.

HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Tendón de la porción larga del bíceps bien situado en la corredera bicipital, de grosor y patrón fibrilar conservado, sin líquido en su vaina.
Intervalo rotador de configuración habitual.
Tendón del subescapular y supraespinoso de grosor y patrón fibrilar normal, sin desgarros.
Leve engrosamiento e hipoecogenicidad heterogénea del infraespinoso, sin desgarros.
Articulación acromioclavicular congruente.
No se observa derrame articular, evaluado en receso glenohumeral posterior.
No hay distensión ni engrosamiento de la bursa subacromio-subdeltoídea.

IMPRESIÓN:
Leve tendinopatía del infraespinoso.
```


## Eco Hombro - Normal

Código: `ecohombron`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Tendón de la porción larga del bíceps bien situado en la corredera bicipital, de grosor y patrón fibrilar conservado, sin líquido en su vaina.
Intervalo rotador de configuración habitual.
Tendón del subescapular de grosor y patrón fibrilar normal, sin roturas.
Articulación acromioclavicular, sin alteraciones.
No se observa derrame articular, evaluado en receso glenohumeral posterior.
Tendones del supraespinoso e infraespinoso de grosor y patrón fibrilar normal, sin roturas.
Bursa subacromio-subdeltoídea de grosor conservado.

IMPRESIÓN:
Examen sin hallazgos patológicos.
```


## Eco Hombro - Tendinopatía - Artrosis - Bursitis

Código: `ecohombropack 1`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Tendón de la porción larga del bíceps bien situado en la corredera bicipital, de grosor y patrón fibrilar conservado, sin líquido en su vaina.
Intervalo rotador de configuración habitual.
Tendón del subescapular de grosor y patrón fibrilar normal.
Engrosamiento e hipoecogenicidad heterogénea del supraespinoso e infraespinoso, sin desgarros
Articulación acromioclavicular con leves cambios degenerativos.
No se observa derrame articular, evaluado en receso glenohumeral posterior.
Leve distensión y engrosamiento de la bursa subacromio-subdeltoídea.

IMPRESIÓN:
Tendinopatía del supraespinoso e infraespinoso.
Leve artrosis de la articulación acromio clavicular.
Bursitis subacromio-subdeltoídea.
```


## Eco Hombro - Pack

Código: `ecohombropack 2`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tendón de la porción larga del bíceps bien situado en la corredera bicipital, levemente engrosado e hipoecogénico, con leve distensión con líquido en su vaina.
Intervalo rotador de configuración habitual.
Tendón del subescapular de grosor y patrón fibrilar normal.
Desgarro de ancho y espesor completo del supraespinoso, mide 2,3 cm al cabo distal.
Engrosamiento e hipoecogenicidad heterogénea del infraespinoso, sin desgarros
Articulación acromioclavicular con cambios degenerativos.
No se observa derrame articular, evaluado en el receso glenohumeral posterior.
Leve distensión y engrosamiento de la bolsa subacromio-subdeltoídea.

IMPRESIÓN:
Leve tenosinovitis bicipital.
Desgarro de ancho y espesor completo del supraespinoso.
Tendinopatía del infraespinoso.
Bursitis subacromio-subdeltoídea.
Artrosis leve acromioclavicular.
```


## Eco Hombro - Pack 3

Código: `ecohombropack 3`

```text
ANT. CLÍNICOS:

HALLAZGOS:
Tendón de la porción larga del bíceps bien situado en la corredera bicipital, levemente engrosado e hipoecogénico, con leve distensión con líquido en su vaina.
Intervalo rotador de configuración habitual.
Tendón del subescapular de grosor y patrón fibrilar normal.
Engrosamiento e hipoecogenicidad heterogénea del supraespinoso, con desgarro de ancho y espesor parcial, de 13 x 10 x 4 mm.
Engrosamiento e hipoecogenicidad heterogénea del infraespinoso, sin desgarros
Articulación acromioclavicular con cambios degenerativos.
No se observa derrame articular, evaluado en receso glenohumeral posterior.
Leve distensión y engrosamiento de la bursa subacromio-subdeltoídea.

IMPRESIÓN:
Leve tenosinovitis bicipital.
tendinosis del supraespinoso con desgarro de ancho y espesor parcial
Tendinopatía del infraespinoso.
Bursitis subacromio-subdeltoídea.
Leve artrosis acromioclavicular.
```


## Eco Hombro - Pack Completo

Código: `ecohombropackcompleto`

```text
ANTECEDENTES CLÍNICOS:
Dolor.

HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Tendón de la porción larga del bíceps bien situado en la corredera bicipital, de grosor aumentado e hipoecogénico, con líquido en su vaina.
Intervalo rotador de configuración habitual.
Engrosamiento e hipoecogenicidad del subescapular, con rotura de espesor y ancho parcial de 6 x 3 mm.
Engrosamiento e hipoecogenicidad del supraespinoso, con rotura de espesor total y ancho parcial de 11 mm.
Engrosamiento e hipoecogenicidad del infraespinoso, sin roturas.
Articulación acromioclavicular con proliferación osteofítica.
No se observa derrame articular, evaluado en receso glenohumeral posterior.
Distensión y engrosamiento de la bursa subacromio subdeltoidea.

IMPRESIÓN:
Tenosinovitis bicipital.
tendinosis del supraespinoso, con signos de rotura de espesor total y ancho parcial.
tendinosis del subescapular con rotura de espesor y ancho parcial.
Tendinopatía del infraespinoso.
Bursitis subacromio subdeltoídea.
Artrosis acromio-clavicular.
```


## Eco Hombro - Tendinosis SE

Código: `ecohombrose`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tendón de la porción larga del bíceps bien situado en la corredera bicipital, de grosor y patrón fibrilar conservado, sin líquido en su vaina.
Intervalo rotador de configuración habitual.
Tendón del subescapular e infraespinoso de grosor y patrón fibrilar normal, sin desgarros.
Leve engrosamiento e hipoecogenicidad heterogénea del supraespinoso, sin desgarros.
Articulación acromioclavicular congruente.
No se observa derrame articular, evaluado en receso glenohumeral posterior.
No hay distensión ni engrosamiento de la bursa subacromio-subdeltoídea.

IMPRESIÓN:
Leve tendinopatía del supraespinoso.
```


## Eco Hombro - Tendinosis del Subescapular

Código: `ecohombrosub`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Tendón de la porción larga del bíceps bien situado en la corredera bicipital, de grosor y patrón fibrilar conservado, sin líquido en su vaina.
Intervalo rotador de configuración habitual.
Tendón del supraespinoso e infraespinoso de grosor y patrón fibrilar normal, sin desgarros.
Engrosamiento e hipoecogenicidad heterogénea del subescapular , sin desgarros.
Articulación acromioclavicular congruente.
No se observa derrame articular, evaluado en receso glenohumeral posterior.
No hay distensión ni engrosamiento de la bursa subacromio-subdeltoídea.

IMPRESIÓN:
Tendinopatía del subescapular.
```


## Eco Hombro - Tenosinovitis

Código: `ecohombroteno`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Tendón de la porción larga del bíceps bien situado en la corredera bicipital, engrosado e hipoecogénico, con líquido en su vaina.
Intervalo rotador de configuración habitual.
Tendón del subescapular, supraespinoso e infraespinoso de grosor y patrón fibrilar normal, sin desgarros.
Articulación acromioclavicular congruente.
No se observa derrame articular, evaluado en receso glenohumeral posterior.
No hay distensión ni engrosamiento de la bursa subacromio-subdeltoídea

IMPRESIÓN:
Tenosinovitis bicipital.
```


## Eco general - Examen a distancia.

Código: `ecoinforme`

```text
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.
```


## Eco Inguinal - Hernioplastia

Código: `ecoinguinalhernioplastia`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Con transductor lineal de alta resolución se explora en forma dirigida la región inguinal referida por el paciente.
Tejido subcutáneo de grosor y ecogenicidad conservada.
Cambios postquirúrgicos de una hernioplastia con malla. No hay signos de recidiva ni colecciones adyacentes.
No se aprecian defectos musculoaponeuróticos en región inguinal ni crural que sugieran una hernia.
Planos musculares visibles sin alteraciones.
No hay masas ni colecciones en los planos profundos
Vasos femorales permeables.
No hay adenopatías regionales.

IMPRESIÓN:
Cambios postquirúrgicos de una hernioplastia con malla. No hay signos de recidiva ni colecciones adyacentes.
```


## Eco Inguinal - Normal

Código: `ecoinguinaln`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Con transductor lineal de alta resolución se explora en forma dirigida la región inguinal señalada.
Tejido subcutáneo de grosor y ecogenicidad conservada.
No se aprecian defectos musculoaponeuróticos en región inguinal ni crural que sugieran una hernia.
Planos musculares visibles sin alteraciones.
No hay masas ni colecciones en los planos profundos
Vasos femorales permeables.
No hay adenopatías regionales.

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## Eco PB LumboSacra RN - Normal

Código: `ecolsrn`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Piel y plano celular subcut·neo sin alteraciones.
Médula espinal de características morfológicas normales. El cono medular se localiza a nivel del cuerpo vertebral L1.
Raíces de la cola de caballo de morfología y movilidad conservados.
El diámetro anteroposterior del canal raquídeo se encuentra dentro de límites normales.
No hay evidencia de lesiones expansivas intrarraquídeas.

IMPRESIÓN:
Examen dentro de límites normales.
```


## Eco PB - Mallet Finger

Código: `ecomalletfinger`

```text
ANTECEDENTES CLÍNICOS:
Traumatismo en dedo anular, extensión ausente.

HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Con transductor lineal de alta frecuencia se explora la región señalada.
Piel y tejido celular subcutáneo sin alteraciones.
Se identifican signos de una rotura completa del tendón extensor del dedo anular a nivel de su inserción en la falange distal, con aparente resalte cortical adyacente, que podría traducir una pequeña fractura por avulsión. Se acompaña de cambios inflamatorios del tejido blando adyacente.
Estructuras vasculares visibles, permeables.
No hay colecciones ni masas.

IMPRESIÓN:
Signos sugerentes de una rotura del tendón extensor a nivel de su inserción de la falange distal del dedo anular (Mallet finger), con probable fractura por avulsión y con cambios inflamatorios adyacentes, según lo descrito.
```


## Eco Mamaria - BIRADS 1

Código: `ecomamab1`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.

Parénquima de ecoestructura heterogénea.

No observo nódulos sólidos ni quistes.

No observo adenopatías.

IMPRESIÓN:
No observo hallazgos sugerentes de lesión maligna.

BI-RADS 1.

Se recomienda control mamográfico anual.
```


## Eco Mamaria - BIRADS 2

Código: `ecomamab2`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.

Parénquima de ecoestructura heterogénea.

No se observan nódulos sólidos.

Quiste mamario derecho CSI, de 5 mm.

No hay adenopatías axilares.

IMPRESIÓN:
Quiste mamario derecho.

BI-RADS 2.
```


## Eco Mamaria - BIRADS 3

Código: `ecomamab3`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Parénquima de ecoestructura heterogénea.
Nódulo mamario derecho CSE, H11 a 2 cm, ovalado bien delimitado, hipoecogénico, avascular, mide 6 x 6 mm.
No hay adenopatías axilares.

IMPRESIÓN:
Nódulo mamario derecho, no sospechoso. Se sugiere controlar en 6 meses.
BI-RADS 3.
```


## Eco Mamaria - BIRADS 4

Código: `ecomamab4`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.

Parénquima de ecoestructura heterogénea.

Nódulo mamario derecho CSE, sólido, hipoecogénico, irregular, con sombra posterior, avascular, que mide 11 x 8 mm.

No hay adenopatías axilares.

IMPRESIÓN:
Nódulo mamario derecho sospechoso. Se sugiere biopsia CORE.

BI-RADS 4.
```


## Eco Mano - Artrosis

Código: `ecomanoartrosis`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tejido subcutáneo de ecogenicidad conservada.
Tendones extensores y flexores de los dedos de grosor y ecogenicidad conservada.
Planos musculares visibles en región tenar e hipotenar de patrón fibrilar normal.
Estructuras vasculares visibles permeables.
No hay masas ni colecciones en los planos profundos
Articulaciones metacarpofalángicas e interfalángicas proximales y distales congruentes. Con proliferación osteofítica en múltiples articulaciones interfalángicas proximales y distales, sin sinovitis.

IMPRESIÓN:
Signos degenerativos en múltiples articulaciones interfalángicas.
```


## Eco Mano - Enfermedad de Dupuytren

Código: `ecomanodupu`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Tejido subcutáneo de ecogenicidad conservada.
En la región palmar superficial a nivel de la región del V metacarpiano en su porción distal, superficial al tendón flexor, se observa una lesión hipoecogénica heteogénea regularmente definida, avascular, que mide 0.8 x 0.4 x 0.5 cm en sus ejes longitudinal, anteroposterior y transversal.
Tendones extensores y flexores de los dedos de grosor y ecogenicidad conservada.
Planos musculares visibles en región tenar e hipotenar de patrón fibrilar normal.
Estructuras vasculares visibles permeables.
No hay masas ni colecciones en los planos profundos
Articulaciones metacarpofalángicas e interfalángicas proximales y distales congruentes. No hay signos de sinovitis.
Articulación trapecio metacarpinana congruente, sin sinovitis.

IMPRESIÓN:
Lesión nodular que impresiona fibromatosis de Dupuytren en aponeurosis palmar en situación descrita.
```


## Eco Mano - Normal

Código: `ecomanon`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tejido subcutáneo de ecogenicidad conservada.
Tendones extensores y flexores de los dedos de grosor y ecogenicidad conservada.
Planos musculares visibles en región tenar e hipotenar de patrón fibrilar normal.
Estructuras vasculares visibles permeables.
No hay masas ni colecciones en los planos profundos
Articulaciones metacarpofalángicas e interfalángicas proximales y distales congruentes.

IMPRESIÓN:
Examen sin hallazgos patológicos.
```


## Eco Mano - Teno - Artrosis

Código: `ecomanotenodege`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tejido subcutáneo de ecogenicidad conservada.
Engrosamiento del tendón flexor del primer dedo asociado a líquido peritendíneo y engrosamiento de la polea A1. No hay signos de desgarro. No existe asincronia al realizar maniobra dinámica.
Tendones extensores y flexores de los dedos de grosor y ecogenicidad conservada.
Planos musculares visibles en región tenar e hipotenar de patrón fibrilar normal.
Estructuras vasculares visibles permeables.
No hay masas ni colecciones en los planos profundos
Articulaciones metacarpofalángicas e interfalángicas proximales y distales congruentes. Con proliferación osteofítica en múltiples articulaciones interfalángicas
Cambios degenerativos de la articulación trapeciometacarpiana, sin sinovitis.

IMPRESIÓN:
Signos de una leve tenosinovitis estenosante del flexor del pulgar derecho.
Signos degenerativos en múltiples articulaciones interfalángicas.
Rizartrosis.
```


## Eco Muñeca - Neuro

Código: `ecomuñeca neuro`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.
Tendones extensores evaluados en sus compartimentos de la muñeca, de grosor y patrón fibrilar normal, sin líquido en sus vainas ni engrosamiento de sus retináculos.
No hay signos de derrame articular radiocarpiano ni signos de quiste sinovial.
Túnel del carpo de configuración habitual, sin evidencia de proceso expansivo.
Fascia palmar de grosor normal.
Tendones flexores evaluados a nivel del túnel carpiano de grosor y patrón fibrilar normal.
Nervio mediano evaluado a nivel del túnel carpiano se aprecia levemente engrosado con un área de ___ mm².

IMPRESIÓN:
Engrosamiento del nervio mediano que podría sugerir una neuropatía por atrapamiento. Corroborar con antecedentes clínicos.
```


## Eco Muñeca - Teno Neuro

Código: `ecomuñeca tenoneuro`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Leve engrosamiento e hipoecogenicidad del tendón del tercer compartimiento extensor a nivel de la articulación radiocarpiana, con leve distensión con líquido.
Restantes tendones extensores evaluados en sus compartimentos de la muñeca, de grosor y patrón fibrilar normal, sin líquido en sus vainas ni engrosamiento de sus retináculos.
No hay signos de derrame articular radiocarpiano ni signos de quiste sinovial.
Túnel del carpo de configuración habitual, sin evidencia de proceso expansivo.
Fascia palmar de grosor normal.
Tendones flexores evaluados a nivel del túnel carpiano de grosor y patrón fibrilar normal.

IMPRESIÓN:
Leve Tenosinovitis de C3.
Leve engrosamiento del nervio mediano, que podría traducir una neuropatía compresiva.
```


## Eco Muñeca - Normal

Código: `ecomuñecan`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tendones extensores evaluados en sus compartimentos de la muñeca, de grosor y patrón fibrilar normal, sin líquido en sus vainas ni engrosamiento de sus retináculos.
No hay signos de derrame articular radiocarpiano ni signos de quiste sinovial.
Túnel del carpo de configuración habitual, sin evidencia de proceso expansivo.
Fascia palmar de grosor normal.
Tendones flexores evaluados a nivel del túnel carpiano de grosor y patrón fibrilar normal.
Nervio mediano de grosor y patrón fascicular conservado, con un área transversal de ___ mm².

IMPRESIÓN:
Examen sin hallazgos relevantes.
```


## Eco Muñeca - Sd. Quervain - Neuro

Código: `ecomuñecaquervain`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Engrosamiento e hipoecogenicidad del tendón extensor corto del pulgar a nivel de la articulación radiocarpiana, con leve distensión con líquido.
Restantes tendones extensores evaluados en sus compartimentos de la muñeca, de grosor y patrón fibrilar normal, sin líquido en sus vainas ni engrosamiento de sus retináculos.
No hay signos de derrame articular radiocarpiano ni signos de quiste sinovial.
Túnel del carpo de configuración habitual, sin evidencia de proceso expansivo.
Fascia palmar de grosor normal.
Tendones flexores evaluados a nivel del túnel carpiano de grosor y patrón fibrilar normal.
Nervio mediano evaluado a nivel del túnel carpiano se aprecia levemente engrosado con un área de ___ mm².

IMPRESIÓN:
Signos de una leve tenosinovitis de Quervain.
Leve engrosamiento del nervio mediano que podría sugerir una neuropatía por atrapamiento. Corroborar con antecedentes clínicos.
```


## Eco Muñeca - Quiste Sinovial

Código: `ecomuñecaquiste`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Tendones extensores evaluados en sus compartimentos de la muñeca, de grosor y patrón fibrilar normal, sin líquido en sus vainas ni engrosamiento de sus retináculos.
Se identifica una lesión quística bien definida de morfología redondeada, aparentemente dependiente de la articulación radiocarpiana por la región volar, que mide 1.3 x 1.0 x 0.6 cm en sus ejes mayores.
No hay signos de derrame articular radiocarpiano.
Túnel del carpo de configuración habitual, sin evidencia de proceso expansivo.
Fascia palmar de grosor normal.
Tendones flexores evaluados a nivel del túnel carpiano de grosor y patrón fibrilar normal.
Nervio mediano de grosor y patrón fascicular conservado, con un área transversal de ___ mm².

IMPRESIÓN:
Signos sugerentes de un quiste sinovial dependiente de la articulación radiocarpiana en la región volar de la muñeca.
```


## Eco Muñeca - Tenosinovitis

Código: `ecomuñecateno`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Leve engrosamiento e hipoecogenicidad del tendón del sexto compartimiento extensor a nivel de la articulación radiocarpiana, con leve distensión con líquido.
Restantes tendones extensores evaluados en sus compartimentos de la muñeca, de grosor y patrón fibrilar normal, sin líquido en sus vainas ni engrosamiento de sus retináculos.
No hay signos de derrame articular radiocarpiano ni signos de quiste sinovial.
Túnel del carpo de configuración habitual, sin evidencia de proceso expansivo.
Fascia palmar de grosor normal.
Tendones flexores evaluados a nivel del túnel carpiano de grosor y patrón fibrilar normal.
Nervio mediano de grosor y patrón fascicular conservado, con un área transversal de ___ mm².

IMPRESIÓN:
Leve Tenosinovitis de C6.
```


## Eco frontal - Osteoma

Código: `ecoosteoma`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Con transductor lineal de alta frecuencia se explora la región señalada frontal en línea media.
Piel y tejido celular subcutáneo sin alteraciones.
Se identifica una imagen ecogénica solevantada que proyecta sombra posterior que depende de la tabla externa de la calota, mide 6 mm, sin vascularización ni compromiso profundo.
Planos musculares y tendinosos de grosor y patrón fibrilar normal, sin evidencia de desgarros.
Estructuras vasculares permeables.
No hay colecciones ni masas.
No hay adenopatías regionales.

IMPRESIÓN:
Signos sugerentes de un pequeño osteoma frontal.
```


## Eco Pared Abdominal - Diástasis de los rectos

Código: `ecoparedabdominaldiastasis`

```text
ANT. CLÍNICOS:

HALLAZGOS:
Con transductor lineal de alta resolución se explora en forma dirigida la región anterolateral del abdomen.

Tejido subcutáneo de ecogenicidad normal.

diástasis de los rectos abdominales a nivel supraumbilical de hasta 3.3 cm.

No se identifican hernias en relación a la línea media supra ni infraumbilical, así como tampoco en región umbilical.

No hay alteraciones en las líneas semilunares.

No hay colecciones ni masas en los planos profundos.

IMPRESIÓN:
diástasis de los rectos abdominales supraumbilical.
```


## Eco Pared Abdominal - Normal

Código: `ecoparedabdominaln`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Con transductor lineal de alta resolución se explora en forma dirigida la región anterolateral del abdomen.
Tejido subcutáneo de ecogenicidad normal.
No se identifican hernias en relación a la línea media supra ni infraumbilical, así como tampoco en región umbilical.
No hay alteraciones en las líneas semilunares.
No hay colecciones ni masas en los planos profundos.

IMPRESIÓN:
Examen sin hallazgos relevantes.
```


## Eco PB - Celulitis

Código: `ecopbcelulitis`

```text
HALLAZGOS:
Destaca engrosamiento y aumento difuso de la ecogenicidad del tejido dermo-epidérmico y celular subcutáneo adyacente, con aumento del flujo vascular al estudio Doppler color. Esto se acompaña de edema.
No se identifican masas ni colecciones.
Plano muscular visible indemne, con patrón fibrilar respetado.

IMPRESIÓN:
Hallazgos descritos compatibles con proceso inflamatorio - Infeccioso del tejido celular subcutáneo.
```


## Eco PB - Cuerpo extraño

Código: `ecopbcuerpoextraño`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Con transductor lineal de alta frecuencia se explora la región señalada.
En el espesor del tejido celular subcutáneo profundo, en relación al margen dorsal de la falange proximal del dedo pulgar, se observa una imagen lineal hiperecogénica heterogénea de 9 mm. Se margina por aumento de la ecogenicidad y engrosamiento del tejido circundante, edema y aumento de la vascularización al estudio Doppler color. La lesión de ubica a 4 mm del plano cutáneo, sin identificarse trayectos fistulosos a este nivel.
Planos musculares y tendinosos de grosor y patrón fibrilar normal, sin evidencia de desgarros.
No hay colecciones ni procesos expansivos.
Estructuras vasculares permeables.
No se observan resaltes corticales.

IMPRESIÓN:
Signos sugerentes de un cuerpo extraño en situación descrita, con cambios inflamatorios adyacentes.
```


## Eco Partes blandas - Hematoma

Código: `ecopbhematoma`

```text
ANTECEDENTES CLÍNICOS:
Aumento de volumen en la cara medial y distal de la pierna tras contusión.

HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Con transductor lineal de alta frecuencia se explora la región señalada.
En el espesor del tejido celular subcutáneo profundo, a nivel del tercio distal por la cara medial de la pierna, se observa una colección bien delimitada, de contenido hipoecogénico heterogéneo, sin vascularización al estudio Doppler color. Mide 82 x 11 mm en sus ejes mayores. Se acompaña de extensos cambios edematosos del tejido celular subcutáneo circundante.
Planos musculares y tendinosos explorados de grosor y patrón fibrilar normal, sin evidencia de desgarros.
Estructuras vasculares visibles, permeables.
No hay adenopatías regionales.
No se observan resaltes corticales.

IMPRESIÓN:
Voluminosa colecciones en situación descrita, de probable carácter hemático, con cambios inflamatorios circundantes, según lo descrito. Se recomienda controlar.
```


## Eco PB - Lipoma

Código: `ecopblipoma`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Con transductor lineal de alta frecuencia se explora la región señalada.

Tejido subcutáneo de ecogenicidad conservada. Imagen bien definida de similar ecogenicidad al tejido adiposo circundante, ubicada en el plano celular subcutáneo, que mide 1.7 x 1.0 x 2.1 cm, sin flujo al Doppler color.

Planos musculares visibles de patrón fibrilar normal.

Estructuras vasculares visibles permeables.No hay masas ni colecciones en los planos profundos.

No hay adenopatías regionales.

IMPRESIÓN:
Lesión subcutánea de posible estirpe lipomatosa.
```


## Eco PB - Normal

Código: `ecopbn`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Con transductor lineal de alta frecuencia se explora la región señalada.
Piel y tejido celular subcutáneo sin alteraciones.
Planos musculares y tendinosos explorados de grosor y patrón fibrilar normal, sin evidencia de desgarros.
Estructuras vasculares visibles, permeables.
No hay colecciones ni masas.
No hay adenopatías regionales.
No se observan resaltes corticales.

IMPRESIÓN:
Examen sin hallazgos patológicos.
```


## Eco Caderas Pediatría Normal

Código: `ecopediatrian`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Ambas cabezas femorales presentan una morfología conservada, de contornos regulares.
Poseen una adecuada cobertura acetabular y con maniobras de stress no presentan desplazamientos patológicos.
No hay signos compatibles con una displasia de luxación ni inestabilidad de ambas caderas.
Labrum de morfología conservada.
Resto del examen sin hallazgos patológicos que señalar.

IMPRESIÓN:
Examen sin evidencia de una displasia desarrollo de las caderas.
```


## Eco pie - Entesopatía Aquiliana

Código: `ecopieent`

```text
ANT.CLÍNICOS:

HALLAZGOS:
Con transductor lineal de alta resolución se explora dirigidamente las partes blandas del pie correspondiente.

Piel y tejido subcutáneo de ecogenicidad conservada.

Fascia plantar a nivel de su inserción proximal de grosor y ecogenicidad normal. No hay nódulos en la fascia distal.

Planos musculares y tendíneos visibles de ecogenicidad y grosor normal.

Articulaciones regionales congruentes, sin sinovitis.

Tendón de Aquiles de grosor y patrón fibrilar conservado, sin signos de desgarros. Muestra irregularidad y algunas pequeñas calcificaciones en su inserción en el calcáneo de aspecto entesopático.

IMPRESIÓN:
Entesopatía aquiliana.
```


## Eco Pie - Fascitis

Código: `ecopiefascitis`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Con transductor lineal de alta resolución se explora en forma dirigida las partes blandas del pie correspondiente.
Piel y tejido subcutáneo de ecogenicidad conservada.
Se observa engrosamiento de la fascia plantar hasta 4,3 mm a nivel de su inserción proximal asociado a focos de hipoecogenicidad de sus fibras. No hay nódulos en la fascia distal.
Articulaciones regionales congruentes, sin sinovitis.
Tendón de Aquiles de grosor y patrón fibrilar conservado, sin signos de desgarros.

IMPRESIÓN:
Leve fascitis plantar de la banda central.
```


## Eco Pie - Normal

Código: `ecopien`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Con transductor lineal de alta resolución se explora dirigidamente las partes blandas del pie correspondiente.
Piel y tejido subcutáneo de ecogenicidad conservada.
Fascia plantar a nivel de su inserción proximal de grosor y ecogenicidad normal. No hay nódulos en la fascia distal.
Planos musculares y tendíneos visibles de ecogenicidad y grosor normal.
Articulaciones regionales congruentes, sin sinovitis.
Tendón de Aquiles de grosor y patrón fibrilar conservado, sin signos de desgarros.

IMPRESIÓN:
Examen sin hallazgos patológicos.
```


## Eco PB - Quiste Pilonidal

Código: `ecopilonidal`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Con transductor lineal de alta resolución se explora en forma dirigida las partes blandas de la región interglútea superior.
Tejido subcutáneo de ecogenicidad conservada. En su espesor superficial se identifica imagen quística hipoecogénica heterogénea con refuerzo posterior, que mide 4,7 x x cm, con leve flujo periférico al Doppler color. Se encuantra a escasos milímetros inferior del plano cutáneo y una profundidad máxima de 1,5 cm.
Planos musculares visibles de patrón fibrilar normal.
Estructuras vasculares visibles permeables.
No hay masas ni colecciones en los planos profundos.
No hay adenopatías regionales.

IMPRESIÓN:
Lesion quística subcutánea interglútea, compatible con quiste pilonidal con leves cambios inflamatorios.
```


## Eco PB - Quiste Epidérmico

Código: `ecoquiste`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Con transductor lineal de alta resolución se explora en forma dirigida las partes blandas de la región correspondiente.
Tejido subcutáneo de ecogenicidad conservada. En su espesor se identifica pequeña imagen nodular hipoecogénica heterogénea con refuerzo posterior, que mide 0,7 x 0,7 x 0,4 cm, sin flujo al Doppler color.
Planos musculares visibles de patrón fibrilar normal.
Estructuras vasculares visibles permeables.
No hay masas ni colecciones en los planos profundos.
No hay adenopatías regionales.

IMPRESIÓN:
Lesion quística subcutánea, impresiona quiste de inclusión epidérmico.
```


## Eco Renal - Nefropatía Médica

Código: `ecorenal nefropatiamedica`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Ambos riñónes son de tamaño y morfología normal.
El riñón derecho mide 10,1 cmy el izquierdo 11,2 cmen sus ejes mayores.
Se observa leve aumento difuso de la ecogenicidad de su parénquima, asociado a menor diferenciación entre parénquima y seno renal. Presentan buen espesor cortical.
No se observan imágenes sugerentes de litiasis ni dilatación pielocaliciaria.
Espacios perirrenales libres.

IMPRESIÓN:
Signos sugerentes de una nefropatía médica bilateral.
```


## Eco renal - Bolsa hidronefrótica

Código: `ecorenalbolsa`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Hígado de forma, tamaño, arquitectura y ecogenicidad normales, sin lesiones focales.
Vesícula biliar en repleción parcial, de pared fina, sin litiasis. Vía biliar de calibre normal.
Segmentos visibles de la cabeza y parte del cuerpo del páncreas, sin alteraciones.
Bazo de aspecto ecográfico habitual.
Riñón derecho significativamente aumentado de tamaño con marcado adelgazamiento difuso e irregular de su parénquima con severa dilatación baloniforme pielocalicilar, identificándose a nivel de la pelvis renal imagen sugerente de cálculo de 16 mm.
El riñón izquierdo normosituado, de forma, tamaño y ecogenicidad normales. Presentan adecuada diferenciación entre seno y parénquima renal. No se observa hidronefrosis. Se identifican algunos quistes corticales de hasta 20 mm y otros parapiélicos de hasta 15 mm, de aspecto simples.
Segmentos visibles de aorta abdominal de calibre conservado con leve ateromatosis.
No se observa líquido libre intraabdominal.
Vejiga con escasa repleción, no evaluable.

IMPRESIÓN:
Gran bolsa hidronefrótica derecha con atrofia parenquimatosa que impresiona estar determinado por cálculo piélico, recomendándose complementar estudio con TC contrastado.
```


## Eco renal - ERC

Código: `ecorenalerc`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
riñónes disminuidos de tamaño y grosor cortical.
El riñón derecho mide 10,1 cm y el izquierdo 11,2 cm en sus ejes mayores.
Se observa aumento de la ecogenicidad de su parénquima asociado a la perdida de la diferenciación entre parénquima y seno renal.
No se observan imágenes sugerentes de litiasis ni dilatación pielocaliciaria.
Espacios perirrenales libres.

IMPRESIÓN:
Signos sugerentes de una nefropatía crónica bilateral.
```


## Eco Renal - Normal

Código: `ecorenaln`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

riñónes de forma, tamaño y ecogenicidad normales.
El riñón derecho mide cm y el izquierdo mide cm en sus ejes mayores.
Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal.
No se observan imágenes sugerentes de litiasis ni dilatación pielocaliciaria.
Espacios perirrenales libres.

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## Eco Renal - Quistes

Código: `ecorenalquistes`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
riñónes de forma, tamaño y ecogenicidad normales.
El riñón derecho mide 10,7 cm y el izquierdo mide 12,0 cm en sus ejes mayores.
Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal.
No se observan imágenes sugerentes de litiasis ni dilatación pielocaliciaria.
Quistes corticales renales bilaterales de aspecto simple, que miden hasta 27 mm.
Espacios perirrenales libres.

IMPRESIÓN:
Quistes renales bilaterales.
```


## Eco Rodilla - Artrosis

Código: `ecorodillaartrosis`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Tendones del cuádriceps y patelar de grosor y patrón fibrilar conservado.
No se observa distension del receso articular suprapatelar que sugiera derrame articular.
Grasa de Hoffa sin alteraciones focales evidentes.
Retinaculos medial y lateral de grosor normal.
Ligamentos colaterales medial y lateral de grosor y patrón fibrilar conservado.
Tendones de la pata de ganso, de la banda iliotibial y bíceps femoral sin alteraciones.
Bursa del músculo gastrocnemio-semimembranoso sin distensión líquida.
Proliferación osteofítica femorotibial.

IMPRESIÓN:
Artrosis femorotibial.
```


## Eco Rodilla - Quiste de Baker

Código: `ecorodillabaker`

```text
ANT. CLÍNICOS:

HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tendones del cuádriceps y patelar de grosor y patrón fibrilar conservado.

No hay engrosamiento ni distensión del receso articular suprapatelar que sugiera derrame articular.

Grasa de Hoffa sin alteraciones focales evidentes.

Retináculos medial y lateral de grosor normal.

Ligamentos colaterales medial y lateral de grosor y patrón fibrilar conservado.

Tendones de la pata de ganso, de la banda iliotibial y bíceps femoral sin alteraciones.

Distensión de la Bursa del músculo gastrocnemio-semimembranoso líquida, mide 0.4 x 1.1 x 0.4 cm, sin signos de complicación.

IMPRESIÓN:
Quiste de Baker sin signos de complicación.
```


## Eco Rodilla - Derrame articular

Código: `ecorodilladerrame`

```text
ANT
.
CLÍNICOS
:

HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tendones del cuádriceps y patelar de grosor y patrón fibrilar conservado.
Se observa leve distensión del receso articular suprapatelar, que sugiere derrame articular.
Grasa de Hoffa sin alteraciones focales evidentes.
Retináculos medial y lateral de grosor normal.
Ligamentos colaterales medial y lateral de grosor y patrón fibrilar conservado.
Tendones de la pata de ganso, de la banda iliotibial y bíceps femoral sin alteraciones.
Bursa del músculo gastrocnemio-semimembranoso sin distensión líquida.

IMPRESIÓN:
Leve derrame articular suprapatelar.
```


## Eco Rodilla Unilateral - Entesopatía Cuadricipital - Extrusión Meniscal

Código: `ecorodillaentext`

```text
ANT. CLÍNICOS
:

HALLAZGOS:
Tendones del cuádriceps y patelar de grosor y patrón fibrilar conservado. Calcificación e irregularidad cortical en la inserción del tendon cuadricipital.
No hay distensión del receso articular suprapatelar que sugiere derrame articular.
Grasa de Hoffa sin alteraciones focales evidentes.
Retináculos medial y lateral de grosor normal.
Ligamentos colaterales medial y lateral de grosor y patrón fibrilar conservado.
Imagen heterogénea en la interlínea medial, que podría sugerir extrusión meniscal.
Tendones de la pata de ganso, de la banda iliotibial y bíceps femoral sin alteraciones.
Bursa del músculo gastrocnemio-semimembranoso sin distensión líquida.

IMPRESIÓN:
Entesopatía cuadricipital.
Aparente extrusión meniscal medial que podría sugerir meniscopatía. Complementar con RM de rodilla.
```


## Eco Rodilla - Esguince grado I

Código: `ecorodillaesguince`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Tendones del cuádriceps y patelar de grosor y patrón fibrilar conservado.
No se observa distension del receso articular suprapatelar que sugiera derrame articular.
Grasa de Hoffa sin alteraciones focales evidentes.
Retináculos medial y lateral de grosor normal.
Ligamento colateral medial levemente engrosado e hipoecogénico en su inserción proximal, con pérdida del patrón fibrilar, sin roturas evidentes.
Ligamento colateral lateral de grosor y patrón fibrilar respetado.
Tendones de la pata de ganso, de la banda iliotibial y bíceps femoral sin alteraciones.
Bursa del músculo gastrocnemio-semimembranoso sin distension líquida.

IMPRESIÓN:
Posible lesión grado I de ligamento colateral medial.
```


## Eco Rodilla - Normal

Código: `ecorodillan`

```text
ANT. CLÍNICOS:

HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tendones del cuádriceps y patelar de grosor y patrón fibrilar conservado.
No se observa distensión del receso articular suprapatelar que sugiera derrame articular.
Grasa de Hoffa sin alteraciones focales evidentes.
Retináculos medial y lateral de grosor normal.
Ligamentos colaterales medial y lateral de grosor y patrón fibrilar conservado.
Tendones de la pata de ganso, de la banda iliotibial y bíceps femoral sin alteraciones.
Bursa del músculo gastrocnemio-semimembranoso sin distensión líquida.

IMPRESIÓN:
Examen sin hallazgos patológicos.
```


## Eco rodilla - Tendinosis rotuliana

Código: `ecorodillatendinosis`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Leve engrosamiento e hipoecogenicidad del tendón rotuliano en su tercio distal, sin roturas.
Tendón del cuádriceps sin alteraciones.
No se observa distensión del receso articular suprapatelar que sugiera derrame articular.
Grasa de Hoffa sin alteraciones focales evidentes.
Retinaculos medial y lateral de grosor normal.
Ligamentos colaterales medial y lateral de grosor y patrón fibrilar conservado.
Tendones de la pata de ganso, de la banda iliotibial y bíceps femoral sin alteraciones.
Bursa del músculo gastrocnemio-semimembranoso sin distensión líquida.

IMPRESIÓN:
Tendinopatía rotuliana.
```


## Eco rodilla - Tendinosis Cuadricipital - Extrusión meniscal

Código: `ecorodillatendinosisext`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Tendón del cuádriceps engrosado e hipoecogénico, sin roturas.

Tendón patelar de grosor y patrón fibrilar conservado.

No hay engrosamiento ni distensión del receso articular suprapatelar que sugiera derrame articular.

Grasa de Hoffa sin alteraciones focales evidentes.

Retináculos medial y lateral de grosor normal.

Ligamentos colaterales medial y lateral de grosor y patrón fibrilar conservado.

Tendones de la pata de ganso, de la banda iliotibial y bíceps femoral sin alteraciones.

Proliferación osteofítica femorotibial.

Imagen heterogénea en la interlínea medial, que podría sugerir extrusión meniscal.

IMPRESIÓN:
tendinosis cuadricipital.

Signos de artrosis femorotibial.

Aparente extrusión meniscal medial que podría sugerir meniscopatía. Complementar con RM de rodilla.
```


## Eco Pared Abdominal - Hernia Supraumbilical

Código: `ecosupra`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Con transductor lineal de alta resolución se explora en forma dirigida la región anterolateral del abdomen.
Tejido subcutáneo de ecogenicidad normal.
Defecto musculoaponeurótico en la línea media supraumbilical, cuyo anillo alcanza un diámetro de ___ mm y da salida espontánea a contenido adiposo, conformando un saco herniado de ___ mm en reposo. Aumenta con maniobras de valsalva y se reduce parcialmente en reposo. No hay signos de complicación actual.
No se identifican hernias en relación a la línea media infraumbilical ni región umbilical.
Líneas semilunares continuas, sin hernias.
No hay colecciones ni masas en los planos profundos.

IMPRESIÓN:
Hernia supraumbilical con contenido adiposo, no complicada.
```


## Eco Testicular - Testículo en ascensor

Código: `ecotesticularascensor`

```text
ANTECEDENTES CLÍNICOS:
Testículo no descendido en estudio.

HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
El testículo derecho se observa en el canal inguinal, descendiendo con maniobra de compresión a la bolsa escrotal en forma intermitente. Es de forma, tamaño y ecogenicidad normal, con adecuada vascularización al estudio Doppler-color. No se observan lesiones focales sospechosas.
El testículo izquierdo se observa en la bolsa escrotal durante toda el examen. Es de forma, tamaño y ecogenicidad normal, con adecuada vascularización al estudio Doppler-color. No se observan lesiones focales sospechosas.
El testículo derecho mide 15 x 9 x 10 mm en los ejes longitudinal, transverso y anteroposterior, respectivamente, con un volumen de 0,7 ml. El testículo izquierdo mide 14 x 9 x 10 mm en los mismos ejes, con un volumen de 0,7 ml.
Ambos epidídimos son de aspecto ecotomográfico normal.
No hay signos de hidrocele.
En situación extratesticular no se observa dilatación de las venas del plexo pampiniforme sugerente de varicocele.

IMPRESIÓN:
Signos sugerentes de testículo derecho en ascensor.
```


## Eco Testicular - Normal

Código: `ecotesticularn`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Testículos en escroto durante el examen.
Los testículos son de tamaño y morfología normal. Su ecoestructura interna es homogénea, sin evidencia de lesiones focales intraparenquimatosas.
El testículo derecho mide 4 x 2,3 x 2,6 cm en sus diámetros longitudinal, anteroposterior y transversal respectivamente. El testículo izquierdo mide 4,6 x 2,2 x 3,2 cm en estos mismos ejes.
Ambos epidídimos son de aspecto ecotomográfico normal.
No hay signos de hidrocele.
En situación extratesticular no se observa dilatación de las venas del plexo pampiniforme sugerente de varicocele.

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## Eco Testicular - Sospecha Neo 1°

Código: `ecotesticularneo`

```text
ANT. clínicoS:

HALLAZGOS:
Ambos testículos se encuentran en el saco escrotal al momento del examen, y son de tamaño y morfología normal, con adecuada vascularización al estudio Doppler color.
En el testículo derecho vuelve a observarse la imagen nodular intraparenquimatosa sólida hipoecogénica heterogénea, bien delimitada, que mide 1.7 x 1.3 x 1.2 cm, con vascularización al estudio Doppler color.
El testículo derecho mide 4.4 x 2.2 x 3.3 cm y el izquierdo mide 4.3 x 2.1 x 3.2 cm en sus ejes longitudinal, anteroposterior y transversal respectivamente.
Epidídimos y cordones espermáticos sin alteraciones. Quistes en el epidídimo izquierdo de hasta 3 mm.
No hay hidrocele.
En situación extratesticular no hay signos sugerentes de varicocele.

IMPRESIÓN:
El presente estudio muestra estabilidad de la lesión focal nodular intraparenquimatosa derecha.
```


## Eco Tiroides - Tiroidectomía

Código: `ecotiroidectomia`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Se observan cambios postquirúrgicos propios de una tiroidectomía total.
No se observan nódulos ni colecciones en ambos lechos tiroideos.
Glándulas submandibulares, sin alteraciones.
Estructuras vasculares sin alteraciones.
No hay adenopatías cervicales por criterios de tamaño.

IMPRESIÓN:
Control de neoplasia tiroidea operada sin evidencia de recidiva macroscópica.
```


## Eco Tiroides - Bocio - Nódulos

Código: `ecotiroidesbocio`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Glándula tiroides levemente aumentada de tamaño forma global. Su ecoestructura interna es discretamente hipoecogénica heterogénea, con leve aumento de la vascularización al estudio Doppler color.
El istmo alcanza un espesor de ___ mm.
No hay nódulos sospechosos ni quistes en el espesor del parénquima.
Glándulas submandibulares, sin lesiones focales en el espesor de su parénquima.
Estructuras vasculares sin alteraciones.
No se observan adenopatías en las regiones cervicales anteriores exploradas.

IMPRESIÓN:
Signos sugerentes de Bocio.
```


## Eco Tiroides - Tiroiditis crónica

Código: `ecotiroidescronica`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

La glándula tiroides se observa disminuida de tamaño. Su ecoestructura interna es gruesa, hipoecogénica y heterogénea, y no presenta aumento del flujo vascular al estudio Doppler - color.
El istmo alcanza un espesor de ___ mm.
No se observan nódulos categorizables en el espesor del parénquima.
No se observan adenopatías en las regiones cervicales anteriores exploradas.
Estructuras vasculares sin alteraciones.
Glándulas submandibulares sin alteraciones.

IMPRESIÓN:
Signos sugerentes de una tiroiditis crónica.
```


## Eco Tiroides - Heterogénea

Código: `ecotiroidesheterogenea`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Glándula tiroides normosituada, de tamaño y morfología normal. Su ecoestructura es gruesa heterogénea, sin alteración del flujo vascular al estudio con Doppler - Color.
El istmo alcanza un espesor de ___ mm.
No se identifican nódulos categorizables en el parénquima tiroideo.
En las regiones cervicales exploradas no se observan adenopatías.
Estructuras vasculares sin alteraciones.
Glándulas submandibulares sin alteraciones.

IMPRESIÓN:
Glándula tiroides heterogénea, hallazgo de carácter inespecífico
```


## Eco Tiroides - Normal

Código: `ecotiroidesn`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

La glándula tiroides es de tamaño y morfología normal. Su ecoestructura interna es homogénea y no se observa aumento del flujo vascular al estudio Doppler - color.
El istmo alcanza un espesor de ___ mm.
No se observan nódulos categorizables en el espesor del parénquima.
Glándulas submandibulares, sin alteraciones.
Estructuras vasculares sin alteraciones.
No se observan adenopatías en las regiones cervicales anteriores exploradas.

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## Eco Tiroides - Tiroiditis

Código: `ecotiroiditis`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

La glándula tiroides es de tamaño normal. Su ecoestructura interna es gruesa y heterogénea, de aspecto pseudonodular. Presenta leve aumento del flujo vascular al estudio Doppler - color.

El istmo alcanza un espesor de ___ mm.

No se observan nódulos categorizables en el espesor del parénquima.

No se observan adenopatías en las regiones cervicales anteriores exploradas.

Estructuras vasculares sin alteraciones.

Glándulas submandibulares sin alteraciones.

IMPRESIÓN:
Signos sugerentes de una tiroiditis.
```


## Eco Tobillo - Esguince / Tenosinovitis de los peroneos

Código: `ecotobillo esguinceteno`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Tendones tibial anterior, extensor del hallux y extensor de los dedos de patrón fibrilar conservado.
No hay derrame articular tibiotalar.
Engrosamiento e hipoecogenicidad heterogénea del ligamento peroneo-astragalino anterior, sin desgarro evidente.
Ligamentos tibio-peroneo anterior y peroneo-calcáneo sin alteraciones evidentes.
Tendones peroneos laterales corto y largo engrosados e hipoecogénicos, con líquido en su vaina, sin roturas.
Porciones evaluables del ligamento deltoideo sin alteraciones.
Tendones tibial posterior, flexor común de los dedos y flexor propio del hallux de grosor y patrón fibrilar normal, sin distensión líquida significativa de sus vainas sinoviales.
Tendón de Aquiles de patrón fibrilar conservado, sin signos de engrosamiento peritendíneo.

IMPRESIÓN:
Posible lesión grado 1 del ligamento peroneo-astragalino anterior.
Tenosinovitis de los peroneos.
```


## Eco Tobillo Esguince Grado 1 - Tenosinovitis del tibial posterior.

Código: `ecotobillo1`

```text
ANT. CLÍNICOS:

HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Tendones tibial anterior, extensor del hallux y extensor de los dedos de patrón fibrilar conservado.
No hay derrame articular tibiotalar.
Engrosamiento e hipoecogenicidad del ligamento peroneo-astragalino anterior, con pérdida parcial del patrón fibrilar, sin desgarro evidente.
Ligamentos tibio-peroneo anterior y peroneo-calcáneo sin alteraciones evidentes.
Tendones peroneos laterales corto y largo sin alteraciones.
Porciones evaluables del ligamento deltoideo sin alteraciones.
Tendones tibial posterior levemente engrosado e hipoecogénico, son líquido peritendíneo.
Tendones flexor común de los dedos y flexor propio del hallux de grosor y patrón fibrilar normal, sin distensión líquida significativa de sus vainas sinoviales.
Tendón de Aquiles de patrón fibrilar conservado, sin signos de engrosamiento peritendíneo.
Edema subcutáneo por la cara lateral y medial del tobillo.

IMPRESIÓN:
Posible lesión grado 1 del ligamento peroneo-astragalino anterior.
leve tenosinovitis del tibial posterior.
Edema subcutáneo en el tobillo.
```


## Eco Tobillo - Esguince Grado I

Código: `ecotobillog1`

```text
ANT. CLÍNICOS:

HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.

Tendones tibial anterior, extensor del hallux y extensor de los dedos de patrón fibrilar conservado.

No hay derrame articular tibiotalar.

Engrosamiento e hipoecogenicidad heterogénea del ligamento peroneo-astragalino anterior, sin desgarro evidente.

Ligamentos tibio-peroneo anterior y peroneo-calcáneo sin alteraciones evidentes.

Tendones peroneos laterales corto y largo, sin alteraciones.

Porciones evaluables del ligamento deltoideo sin alteraciones.

Tendones tibial posterior, flexor común de los dedos y flexor propio del hallux de grosor y patrón fibrilar normal, sin distensión líquida significativa de sus vainas sinoviales.

Tendón de Aquiles de patrón fibrilar conservado, sin signos de engrosamiento peritendíneo.

IMPRESIÓN:
Posible lesión grado 1 del ligamento peroneo-astragalino anterior.
```


## Eco Tobillo - Normal

Código: `ecotobillon`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tendones tibial anterior, extensor del hallux y extensor de los dedos de patrón fibrilar conservado.
No hay signos de derrame articular tibiotalar.
Ligamentos tibio-peroneo anterior, peroneo-astragalino anterior y peroneo-calcaneo sin alteraciones evidentes.
Tendones peroneos laterales corto y largo de grosor y patron fibrilar normal, sin engrosamiento de sus vainas sinoviales.
Porciones evaluables del ligamento deltoideo sin alteraciones.
Tendones tibial posterior, flexor común de los dedos y flexor propio del hallux de grosor y patrón fibrilar normal, sin distension liquida significativa de sus vainas sinoviales.
Tendón de Aquiles de patrón fibrilar conservado, sin signos de engrosamiento peritendineo.
Grasa de Kager sin alteraciones.

IMPRESIÓN:
Examen sin hallazgos patológicos.
```


## Eco Tobillo - Tenosinovitis de los peroneos

Código: `ecotobilloperoneos`

```text
ANTECEDENTES

CLÍNICOS
:

HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.
Tendones tibial anterior, extensor del hallux y extensor de los dedos de patrón fibrilar conservado.
No hay signos de derrame articular tibiotalar.
Ligamentos tibio-peroneo anterior, peroneo-astragalino anterior y peroneo-calcáneo sin alteraciones evidentes.
Tendones peroneos laterales corto y largo engrosados e hipoecogénicos, con leve líquido en su vaina.
Porciones evaluables del ligamento deltoideo sin alteraciones.
Tendones tibial posterior, flexor común de los dedos y flexor propio del hallux de grosor y patrón fibrilar normal, sin distensión líquida significativa de sus vainas sinoviales.
Tendón de Aquiles de patrón fibrilar conservado, sin signos de engrosamiento peritendineo.
Grasa de Kager sin alteraciones.

IMPRESIÓN:
Tenosinovitis de los peroneos.
```


## Eco Pared Abdominal - Hernia Umbilical

Código: `ecoumbilical`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Con transductor lineal de alta resolución se explora en forma dirigida la región anterolateral del abdomen.
Tejido subcutáneo de ecogenicidad normal.
En la región umbilical, se identifica un defecto musculoaponeurótico, cuyo anillo alcanza un diámetro de ___ mm y da salida espontánea a contenido adiposo, conformando un saco herniado de ___ mm en reposo. Aumenta con maniobras de valsalva y se reduce parcialmente en reposo. No hay signos de complicación actual.
No se identifican hernias en relación a la línea media supra ni infraumbilical.
Líneas semilunares continuas, sin hernias.
No hay colecciones ni masas en los planos profundos.

IMPRESIÓN:
hernia umbilical con contenido adiposo, no complicada.
```


## Eco Pared Abdominal l Hernia Supra y Umbilical

Código: `ecoumbsupra`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Con transductor lineal de alta resolución se explora en forma dirigida la región anterolateral del abdomen.
Tejido subcutáneo de ecogenicidad normal.
Defecto musculoaponeurótico en la línea media supraumbilical, cuyo anillo alcanza un diámetro de ___ mm y da salida espontánea a contenido adiposo, conformando un saco herniado de ___ mm en reposo. Aumenta con maniobras de valsalva y se reduce parcialmente en reposo. No hay signos de complicación actual.
En la región umbilical, se identifica un defecto musculoaponeurótico, cuyo anillo alcanza un diámetro de ___ mm y da salida espontánea a contenido adiposo, conformando un saco herniado de ___ mm en reposo. Aumenta con maniobras de valsalva y se reduce parcialmente en reposo. No hay signos de complicación actual.
No se identifican hernias en relación a la línea media infraumbilical.
Líneas semilunares continuas, sin hernias.
No hay colecciones ni masas en los planos profundos.

IMPRESIÓN:
Hernia supraumbilical con contenido adiposo, no complicada.
hernia umbilical, no complicada.
```


## Cambios Entesopáticos Cadera

Código: `entesopaticocadera`

```text
Cambios entesopáticos degenerativos en ambas crestas ilíacas, trocánteres mayores y tuberosidades isquiáticas.
```


## Cambios Entesopáticos Pie

Código: `entesopaticopie`

```text
Cambios entesopáticos degenerativos aquilianos y de la fascia plantar en su inserción calcánea, bilateralmente.
```


## fibromatosis plantar

Código: `fibromatosis plantar`

```text
ANTECEDENTES CLÍNICOS:
Fascitis, no clasificada en otra parte.

HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Con transductor lineal de alta resolución se explora dirigidamente las partes blandas del pie correspondiente.

Piel y tejido subcutáneo de ecogenicidad conservada.

Nódulo sólido hipoecoico dependiente de la fascia plantar, no vascularizado, mide 28 x 4 mm, sugestivo de fibromatosis plantar.

Planos musculares y tendíneos visibles de ecogenicidad y grosor normal.

Articulaciones regionales congruentes, sin sinovitis.

Tendón de Aquiles de grosor y patrón fibrilar conservado, sin signos de desgarros.

IMPRESIÓN:
Engrosamiento nodular hipoecoico de la fascia plantar, compatible con fibromatosis plantar
```


## Eco Pelviana Femenina

Código: `histerectomia`

```text
ANTECEDENTES CLÍNICOS:
ITU a repetición. Histerectomía.

HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Vejia en replecion, de paredes finas y sin imágenes endoluminales. Volumen premiccional 332 cc.

Útero y anexos no visualizados en relación a antecedente quirúrgico. No se visualizan masas patológicas en la pelvis.

No se observa líquido libre en la excavación pelviana.

Residuo postmiccional no significativo ( volumen aproximado 88 cc)

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## Tendinopatía bíceps supra y bursitis.

Código: `hombro biceps SE bursitis`

```text
ANTECEDENTES CLÍNICOS:
sindrome cervicobraquial

HALLAZGOS:
Sin antecedentes en orden medica.

Tendón de la porción larga del bíceps bien situado en la corredera bicipital, se observa líquido peritendinoso en la vaina, asociado a leve engrosamiento tendinoso.

Intervalo rotador de configuración habitual.

Tendón del subescapular e infraespinoso de grosor y patrón fibrilar normal.

Engrosamiento e hipoecogenicidad heterogénea del supraespinoso, sin desgarros

Articulación acromioclavicular sin alteraciones.

No se observa derrame articular, evaluado en receso glenohumeral posterior.

Leve distensión y engrosamiento de la bursa subacromio-subdeltoídea.

IMPRESIÓN:
Tenosinovitis del bíceps.

Tendinopatía del supraespinoso.

Bursitis subacromio-subdeltoídea.
```


## Eco Mano

Código: `mano normal`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tejido subcutáneo de ecogenicidad conservada.

Tendones extensores y flexores con patrón fibrilar normal, de grosor y ecogenicidad conservada, sin engrosamiento ni líquido en su vaina sinovial.

Articulaciones metacarpofalángicas e interfalángicas proximales y distales congruentes, sin signos de derrame articular ni sinovitis.

IMPRESIÓN:
Examen sin hallazgos patológicos.
```


## Partes blandas normal

Código: `partes blandas normal`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Con transductor lineal de alta resolución se explora en forma dirigida las partes blandas señaladas.

Plano dermoepidérmico y tejido celular subcutáneo de características ecográficas normales.

No se observan colecciones ni masas.

Planos musculares adyacentes de grosor y patrón fibrilar normal.

Corticales óseas exploradas sin alteraciones evidentes

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## pelvis fem normalin

Código: `pelvis fem normalin`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Vejia en replecion, de paredes finas y sin imágenes endoluminales. Volumen premiccional cc.

El útero es de tamaño y morfología normal. Mide 7,3 x 3,1 x 4,4 cm en los ejes sagital, anteroposterior y transversal respectivamente.

Cavidad endometrial en línea media, mide cm.

El ovario derecho mide 3,3 x 1,3 x 2,7 cm en sus ejes mayores (volumen aproximado de 6,1 cc).

El ovario izquierdo mide 3,9 x 2,0 x 3,3 cm (volumen aproximado de 13,1 cc).

No se visualizan masas patológicas en la pelvis.

No se observa líquido libre en la excavación pelviana.

Residuo postmiccional no significativo ( volumen aproximado cc)

IMPRESIÓN:
Examen sin hallazgos de significado patológico.
```


## Partes blandas

Código: `quiste de inclusion`

```text
ANTECEDENTES CLÍNICOS:
nódulo palpable.

HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Con transductor lineal de alta resolución se explora en forma dirigida __________

En el plano subdérmico se observa un nódulo mixto, hipoecogénico, de contorno irregular, bordes definidos, avascular, que mide ______ mm.

Tejido subcutáneo de ecogenicidad normal.

No hay colecciones ni masas en los planos profundos.

IMPRESIÓN:
Los hallazgos antes descritos podrian estar en contexto de un quiste de inclusión epidermica.
```


## hombro

Código: `sinovitis AC`

```text
ANTECEDENTES CLÍNICOS:
Síndrome del manguito rotador

HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Tendón de la porción larga del bíceps bien situado en la corredera bicipital, de grosor y patrón fibrilar conservado, sin líquido en su vaina.

Intervalo rotador de configuración habitual.

Tendón del subescapular e infraespinoso de grosor y patrón fibrilar normal, sin desgarros.

Leve engrosamiento e hipoecogenicidad heterogénea del supraespinoso, sin desgarros.

Articulación acromioclavicular congruente, con leve distensión capsular y engrosamiento sinovial asociado a leve aumento de la vascularización al Doppler color hipervascularización.

No se observa derrame articular, evaluado en receso glenohumeral posterior.

No hay distensión ni engrosamiento de la bursa subacromio-subdeltoídea.

IMPRESIÓN:
Leve tendinopatía del supraespinoso.

Sinovitis acromioclavicular.
```


## HOMBRO tendinosis SE bursa SASD

Código: `tendinosis SE bursa SASD`

```text
ANTECEDENTES CLÍNICOS:
sin antecedentes en orden medica.

HALLAZGOS:
Informe confeccionado en base a imágenes representativas disponibles a distancia y comentarios de ejecutor del examen.

Tendón de la porción larga del bíceps bien situado en la corredera bicipital, con patron fibrilar normal, sin rotura ni distension liquida de su vaina.

Intervalo rotador de configuración habitual.

Engrosamiento e hipoecogenicidad del supraespinoso, sin rotura.

Tendones del subescapular e infraespinoso con patron fibrilar normal, sin rotura. Articulación acromioclavicular sin alteraciones.

No se observa derrame articular, evaluado en receso glenohumeral posterior.

Distensión y engrosamiento de la bursa subacromio subdeltoidea.

IMPRESIÓN:
tendinosis del supraespinoso

Bursitis subacromio subdeltoídea.
```


## Doppler Várices

Código: `varices`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Sistema venoso profundo:

Las venas femorales comunes, femorales superficiales, femorales profundas y poplíteas presentan caracteres morfológicos normales. Muestran flujo espontáneo, con fasicidad conservada, que varía con los movimientos respiratorios.
Las venas tibiales posteriores, gastrocnemias, peroneas y sóleas sin alteraciones
No se demostraron imágenes endoluminales sospechosas de trombosis.

Sistema superficial izquierdo:

El cayado de la vena safena mide ___ mm y es competente al igual que todo el trayecto de la vena safena interna de este lado.
Vena safena externa competente.
No se identifican colaterales patológicas.

Sistema superficial derecho:

El cayado de la vena safena mide ___ mm y es competente al igual que todo el trayecto de la vena safena interna de este lado.
Vena safena externa competente.
No se identifican colaterales patológicas.

IMPRESIÓN:
```


## Eco Pelviana Masculina

Código: `vejiga de lucha diverticulos`

```text
ANTECEDENTES CLÍNICOS:
HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

Vejiga en repleción, con engrosamiento parietal difuso y aspecto trabeculado, con al menos tres divertículos, miden 3 mm, 3 mm y 4 mm, sin imágenes endoluminales patológicas. Volumen premiccional 428 cc.

Glándula prostática aumentada de tamaño, homogénea, de bordes bien definidos, con algunas calcificaciones, mide 44 x 42 x 35 mm en sus ejes mayores, con un volumen aproximado 51 cc.

Vesículas seminales simétricas.

No se identifica líquido libre en la excavación pelviana.

Residuo postmiccional aproximado de 137 cc.

IMPRESIÓN:
Crecimiento prostático.

Vejiga trabeculada con residuo postmiccional aumentado, en el contexto de vejiga de lucha.

Divertículos vesicales.
```


## Eco Abdomen - Colelitiasis y Esteatosis

Código: `wes`

```text
ANTECEDENTES CLÍNICOS:
sin antecedentes en orden médica.

HALLAZGOS:
Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.

El hígado es de tamaño y morfología normal. Se observa aumento de su ecogenicidad asociado a pérdida de la definición de estructuras vasculares. En estas condiciones, no se observan lesiones focales en el espesor del parénquima.

Vesícula biliar no distensible con patrón Wall-Echo-Shadow (WES), compatible con colelitiasis múltiple que ocupa la totalidad de la luz vesícular.

Vía biliar de calibre normal.

riñónes de tamaño y morfología normal. Presentan buen espesor cortical y adecuada diferenciación entre parénquima y seno renal. No se observa dilatación pielocaliciaria ni imágenes sugerentes de litiasis.

Segmentos visibles del bazo y páncreas sin alteraciones.

Segmentos visibles de la aorta abdominal de calibre conservado.

No se observa líquido libre intraabdominal.

IMPRESIÓN:
Colelitiasis.

Signos de esteatosis hepática difusa.
```
