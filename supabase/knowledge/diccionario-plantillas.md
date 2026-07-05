# Diccionario de plantillas

Usa este archivo para identificar rápidamente la plantilla más probable según código, nombre o tipo de examen.

La columna "Perfil clínico" describe qué hallazgos esperar en esa variante. Sirve para guiar el match cuando el input es ambiguo (ej: "eco abdomen esteatosis" sin especificación de vesícula). NO es una regla rígida ("si dice X usa Y"); es contexto para que el LLM elija bien.

| Modalidad | Código | Nombre de plantilla | Perfil clínico | Nota |
|---|---|---|---|---|
| Doppler | `doppler_plantilla_001` | Doppler Arterial EI - Pseudoaneurisma. |  |
| Doppler | `Dopplervaricesn` | Doppler Venoso EEII Várices - Normal | Código duplicado; elegir según nombre/contexto. |
| Doppler | `arterio venoso eeii` | Doppler arterio venoso eeii |  |
| Doppler | `dopplerFAVn` | Doppler FAV - Normal |  |
| Doppler | `dopplerabdomenn` | Doppler Abdomen |  |
| Doppler | `dopplerarterial1eeii` | Eco Doppler Arterial - Una extremidad inferior |  |
| Doppler | `dopplerarterialeeiin` | Doppler Arterial EEII |  |
| Doppler | `dopplerarterialeessn` | Doppler Arterial de EESS - Normal |  |
| Doppler | `dopplercarotideoateroma` | Doppler Carotídeo - Ateromatosis |  |
| Doppler | `dopplercarotideoateromauni` | Doppler Carotídeo - Ateromatosis unilateral |  |
| Doppler | `dopplercarotideon` | Doppler Carotídeo - Normal |  |
| Doppler | `dopplereessn` | Doppler EESS - Normal |  |
| Doppler | `dopplerepididimitis` | Doppler Testicular - Epididimitis aguda |  |
| Doppler | `dopplerfav` | Eco Doppler Mapeo FAV |  |
| Doppler | `dopplerhpn` | Doppler Hepato-Portal - Normal |  |
| Doppler | `dopplerrenaln` | Doppler Renal - Normal |  |
| Doppler | `dopplerrenaltransplante` | Doppler Renal Transplantado |  |
| Doppler | `dopplertemporaln` | Doppler Arteria Temporal - Normal |  |
| Doppler | `dopplertesticularn` | Doppler Testicular - Normal |  |
| Doppler | `dopplervarices1` | Doppler Várices EEII - Insuficiencia |  |
| Doppler | `dopplervarices2` | Doppler Várices - Insuficiencia Superficial y Profunda |  |
| Doppler | `dopplervariceseeii ordenado` | Doppler Várices EEII - Esquema ordenado |  |
| Doppler | `dopplervaricesn` | Doppler Venoso EEII - Normal | Código duplicado; elegir según nombre/contexto. |
| Doppler | `dopplervenosoivs` | Doppler Venoso EEII - Insuficiencia Venosa |  |
| Doppler | `dopplervenoson` | Doppler Venoso - Normal |  |
| Doppler | `ecohombro sesub` | Eco Hombro - Tendinosis del subescapular y supraespinoso. |  |
| Ecografía | `Artrosis1` | Desglose de Artrosis |  |
| Ecografía | `ECO PROSTATA` | HPB LEVE |  |
| Ecografía | `LIPO` | Lipoma |  |
| Ecografía | `PROSTATA HP` | HPB ACENTUADA |  |
| Ecografía | `abdominal` | hemangioma hepatico |  |
| Ecografía | `adenomiomatosis vesicular` | adenomiomatosis eco abdo |  |
| Ecografía | `antebrazo normal` | antebrazo normal |  |
| Ecografía | `dedoen gatillo` | gatillo |  |
| Ecografía | `diastasis y hernia umbilical` | paredabdominal |  |
| Ecografía | `ecoabdomen estcole` | Eco abdomen - Esteatosis - Colelitiasis | Higado graso + vesicula con calculos moviles. Usar si la usuaria menciona esteatosis + colelitiasis o vesicula con calculos. |  |
| Ecografía | `ecoabdomen polipoest` | Eco Abdominal - Pólipo & Esteatosis | Higado graso + polipo vesicular. Usar si mencionan esteatosis + polipo. |  |
| Ecografía | `ecoabdomencolecis` | Eco abdomen - Colecistectomizada. | Vesicula no visualizada (antecedente quirurgico). Usar si el paciente es colecistectomizado. |  |
| Ecografía | `ecoabdomencolelitiasis` | Eco abdomen - Colelitiasis | Higado normal + vesicula con calculos. Usar si mencionan colelitiasis sin esteatosis. |  |
| Ecografía | `ecoabdomendhc` | Eco Abdomen - DHC | Higado con dano hepatico cronico (cirrosis). Usar si mencionan DHC, cirrosis, higado nodular. |  |
| Ecografía | `ecoabdomenesco` | Eco abdomen - Esteatosis - Colesterolosis | Higado graso + colesterolosis vesicular (foco ecogenico sin sombra). Usar si mencionan colesterolosis. |  |
| Ecografía | `ecoabdomenest` | Eco abdomen - Esteatosis | Higado graso + vesicula sin calculos. VARIANTE CONSERVADORA para "eco abdomen esteatosis" sin especificar vesicula. |  |
| Ecografía | `ecoabdomenestcolecis` | Eco abdomen - Esteatosis - Colecistectomizado | Higado graso + vesicula no visualizada (antecedente quirurgico). Usar si mencionan esteatosis + colecistectomia. |  |
| Ecografía | `ecoabdomenn` | Eco abdomen - Normal | Higado normal + vesicula sin calculos. Usar para eco abdomen sin hallazgos. |  |
| Ecografía | `ecoabdomennefrolitiasis` | Eco Abdominal - Nefrolitiasis | Litiasis renal. Usar si mencionan nefrolitiasis o calculos renales. |  |
| Ecografía | `ecoabdomenpolipo` | Eco abdomen - Pólipo vesicular | Vesicula con polipo, higado normal. Usar si mencionan polipo vesicular sin esteatosis. |  |
| Ecografía | `ecoaquilesroto` | Eco Tendón de Aquiles - Rotura |  |
| Ecografía | `ecoaquilesteno` | Eco Tendón de Aquiles - Tenoentesopatía |  |
| Ecografía | `ecocaderan` | Eco Caderas - Normal |  |
| Ecografía | `ecocaderatendinosis` | Eco Caderas - Tendinosis |  |
| Ecografía | `ecocerebral` | Eco Cerebral RN - Normal |  |
| Ecografía | `ecocervicaln` | Eco PB cervical - Normal |  |
| Ecografía | `ecocervicaltiroiditiscronica` | Eco Cervical - Tiroiditis crónica |  |
| Ecografía | `ecocodo epiepi` | Eco Codo Epicondilitis y Epitrocleítis |  |
| Ecografía | `ecocodo epineuro` | Eco Codo - Epi Neuro |  |
| Ecografía | `ecocodo neuro` | Eco Codo - Neuro |  |
| Ecografía | `ecocodoepi` | Eco Codo - Epicondilitis |  |
| Ecografía | `ecocodoepineuro` | Eco Codo - Epicondilitis - Neuro |  |
| Ecografía | `ecocodon` | Eco Codo - Normal |  |
| Ecografía | `ecocriptorquidia` | Eco Testicular - Criptorquidia Bilateral |  |
| Ecografía | `ecodesgarro` | Eco PB - Desgarro muscular |  |
| Ecografía | `ecofemeninan` | Eco Pelviana Femenina - Normal |  |
| Ecografía | `ecofemeninaped` | Eco Pelvis Femenina Pediátrica - Normal |  |
| Ecografía | `ecofx` | Eco Tórax - Fractura |  |
| Ecografía | `ecohbpleve` | Eco Pelviana Masculina - HBP |  |
| Ecografía | `ecohbpmod` | Eco Pelviana Masculina - HBP 1 |  |
| Ecografía | `ecohbpn` | Eco Pelviana Masculina - Normal |  |
| Ecografía | `ecoherniacrural` | Eco Inguinal - Hernia Crural |  |
| Ecografía | `ecoherniainguinal` | Eco Inguinal - Hernia Inguinal |  |
| Ecografía | `ecohombro sebursitis` | Eco Hombro - Tendinopatía del SE - Bursitis | Código duplicado; elegir según nombre/contexto. |
| Ecografía | `ecohombro sebursitis` | Eco Hombro - Tendinosis - Bursitis - Artrosis | Código duplicado; elegir según nombre/contexto. |
| Ecografía | `ecohombro tendinosisdifusa` | Eco Hombro - Tendinopatía difusa - Bursitis |  |
| Ecografía | `ecohombro tenotend` | Eco Hombro - Tenosinovitis - Tendinosis SE |  |
| Ecografía | `ecohombrobursitis` | Eco Hombro - Bursitis |  |
| Ecografía | `ecohombroinfra` | Eco Hombro - Tendinosis del Infraespinoso |  |
| Ecografía | `ecohombron` | Eco Hombro - Normal |  |
| Ecografía | `ecohombropack 1` | Eco Hombro - Tendinopatía - Artrosis - Bursitis |  |
| Ecografía | `ecohombropack 2` | Eco Hombro - Pack |  |
| Ecografía | `ecohombropack 3` | Eco Hombro - Pack 3 |  |
| Ecografía | `ecohombropackcompleto` | Eco Hombro - Pack Completo |  |
| Ecografía | `ecohombrose` | Eco Hombro - Tendinosis SE |  |
| Ecografía | `ecohombrosub` | Eco Hombro - Tendinosis del Subescapular |  |
| Ecografía | `ecohombroteno` | Eco Hombro - Tenosinovitis |  |
| Ecografía | `ecoinforme` | Eco general - Examen a distancia. |  |
| Ecografía | `ecoinguinalhernioplastia` | Eco Inguinal - Hernioplastia |  |
| Ecografía | `ecoinguinaln` | Eco Inguinal - Normal |  |
| Ecografía | `ecolsrn` | Eco PB LumboSacra RN - Normal |  |
| Ecografía | `ecomalletfinger` | Eco PB - Mallet Finger |  |
| Ecografía | `ecomamab1` | Eco Mamaria - BIRADS 1 |  |
| Ecografía | `ecomamab2` | Eco Mamaria - BIRADS 2 |  |
| Ecografía | `ecomamab3` | Eco Mamaria - BIRADS 3 |  |
| Ecografía | `ecomamab4` | Eco Mamaria - BIRADS 4 |  |
| Ecografía | `ecomanoartrosis` | Eco Mano - Artrosis |  |
| Ecografía | `ecomanodupu` | Eco Mano - Enfermedad de Dupuytren |  |
| Ecografía | `ecomanon` | Eco Mano - Normal |  |
| Ecografía | `ecomanotenodege` | Eco Mano - Teno - Artrosis |  |
| Ecografía | `ecomuñeca neuro` | Eco Muñeca - Neuro |  |
| Ecografía | `ecomuñeca tenoneuro` | Eco Muñeca - Teno Neuro |  |
| Ecografía | `ecomuñecan` | Eco Muñeca - Normal |  |
| Ecografía | `ecomuñecaquervain` | Eco Muñeca - Sd. Quervain - Neuro |  |
| Ecografía | `ecomuñecaquiste` | Eco Muñeca - Quiste Sinovial |  |
| Ecografía | `ecomuñecateno` | Eco Muñeca - Tenosinovitis |  |
| Ecografía | `ecoosteoma` | Eco frontal - Osteoma |  |
| Ecografía | `ecoparedabdominaldiastasis` | Eco Pared Abdominal - Diástasis de los rectos |  |
| Ecografía | `ecoparedabdominaln` | Eco Pared Abdominal - Normal |  |
| Ecografía | `ecopbcelulitis` | Eco PB - Celulitis |  |
| Ecografía | `ecopbcuerpoextraño` | Eco PB - Cuerpo extraño |  |
| Ecografía | `ecopbhematoma` | Eco Partes blandas - Hematoma |  |
| Ecografía | `ecopblipoma` | Eco PB - Lipoma |  |
| Ecografía | `ecopbn` | Eco PB - Normal |  |
| Ecografía | `ecopediatrian` | Eco Caderas Pediatría Normal |  |
| Ecografía | `ecopieent` | Eco pie - Entesopatía Aquiliana |  |
| Ecografía | `ecopiefascitis` | Eco Pie - Fascitis |  |
| Ecografía | `ecopien` | Eco Pie - Normal |  |
| Ecografía | `ecopilonidal` | Eco PB - Quiste Pilonidal |  |
| Ecografía | `ecoquiste` | Eco PB - Quiste Epidérmico |  |
| Ecografía | `ecorenal nefropatiamedica` | Eco Renal - Nefropatía Médica |  |
| Ecografía | `ecorenalbolsa` | Eco renal - Bolsa hidronefrótica |  |
| Ecografía | `ecorenalerc` | Eco renal - ERC |  |
| Ecografía | `ecorenaln` | Eco Renal - Normal |  |
| Ecografía | `ecorenalquistes` | Eco Renal - Quistes |  |
| Ecografía | `ecorodillaartrosis` | Eco Rodilla - Artrosis |  |
| Ecografía | `ecorodillabaker` | Eco Rodilla - Quiste de Baker |  |
| Ecografía | `ecorodilladerrame` | Eco Rodilla - Derrame articular |  |
| Ecografía | `ecorodillaentext` | Eco Rodilla Unilateral - Entesopatía Cuadricipital - Extrusión Meniscal |  |
| Ecografía | `ecorodillaesguince` | Eco Rodilla - Esguince grado I |  |
| Ecografía | `ecorodillan` | Eco Rodilla - Normal |  |
| Ecografía | `ecorodillatendinosis` | Eco rodilla - Tendinosis rotuliana |  |
| Ecografía | `ecorodillatendinosisext` | Eco rodilla - Tendinosis Cuadricipital - Extrusión meniscal |  |
| Ecografía | `ecosupra` | Eco Pared Abdominal - Hernia Supraumbilical |  |
| Ecografía | `ecotesticularascensor` | Eco Testicular - Testículo en ascensor |  |
| Ecografía | `ecotesticularn` | Eco Testicular - Normal |  |
| Ecografía | `ecotesticularneo` | Eco Testicular - Sospecha Neo 1° |  |
| Ecografía | `ecotiroidectomia` | Eco Tiroides - Tiroidectomía |  |
| Ecografía | `ecotiroidesbocio` | Eco Tiroides - Bocio - Nódulos |  |
| Ecografía | `ecotiroidescronica` | Eco Tiroides - Tiroiditis crónica |  |
| Ecografía | `ecotiroidesheterogenea` | Eco Tiroides - Heterogénea |  |
| Ecografía | `ecotiroidesn` | Eco Tiroides - Normal |  |
| Ecografía | `ecotiroiditis` | Eco Tiroides - Tiroiditis |  |
| Ecografía | `ecotobillo esguinceteno` | Eco Tobillo - Esguince / Tenosinovitis de los peroneos |  |
| Ecografía | `ecotobillo1` | Eco Tobillo Esguince Grado 1 - Tenosinovitis del tibial posterior. |  |
| Ecografía | `ecotobillog1` | Eco Tobillo - Esguince Grado I |  |
| Ecografía | `ecotobillon` | Eco Tobillo - Normal |  |
| Ecografía | `ecotobilloperoneos` | Eco Tobillo - Tenosinovitis de los peroneos |  |
| Ecografía | `ecoumbilical` | Eco Pared Abdominal - Hernia Umbilical |  |
| Ecografía | `ecoumbsupra` | Eco Pared Abdominal l Hernia Supra y Umbilical |  |
| Ecografía | `entesopaticocadera` | Cambios Entesopáticos Cadera |  |
| Ecografía | `entesopaticopie` | Cambios Entesopáticos Pie |  |
| Ecografía | `fibromatosis plantar` | fibromatosis plantar |  |
| Ecografía | `histerectomia` | Eco Pelviana Femenina |  |
| Ecografía | `hombro biceps SE bursitis` | Tendinopatía bíceps supra y bursitis. |  |
| Ecografía | `mano normal` | Eco Mano |  |
| Ecografía | `partes blandas normal` | Partes blandas normal |  |
| Ecografía | `pelvis fem normalin` | pelvis fem normalin |  |
| Ecografía | `quiste de inclusion` | Partes blandas |  |
| Ecografía | `sinovitis AC` | hombro |  |
| Ecografía | `tendinosis SE bursa SASD` | HOMBRO tendinosis SE bursa SASD |  |
| Ecografía | `varices` | Doppler Várices |  |
| Ecografía | `vejiga de lucha diverticulos` | Eco Pelviana Masculina |  |
| Ecografía | `wes` | Eco Abdomen - Colelitiasis y Esteatosis | Vesicula NO distensible con patron Wall-Echo-Shadow (WES) + higado graso. Usar si mencionan WES, vesicula no distensible o colelitiasis multiple que ocupa la luz vesicular. |  |
