Analyse ce transcript de vidéo YouTube et fournis une analyse structurée complète: ${transcript}

INSTRUCTIONS DÉTAILLÉES:

1. ANALYSE GÉNÉRALE

   - Propose un titre court (150 caractères max) qui communique précisément le sujet de la vidéo.
   - Rédige un résumé concis (1200 caractères max) des idées principales, sans rentrer dans le développement de ces idées mais en explicitant commant les idées sont articulées entre elles et les conclusions générales de la vidéo.

2. EXTRACTION DES IDÉES PRINCIPALES

   - Identifie les idées principales (au plus 6)
   - Pour chaque idée, propose un titre court (150 caractères max) qui communique clairement l'idée des auteurs.
   - Pour chaque idée, rédige un résumé concis (1200 caractères max) de l'idée et de sa présentation. Sans rentrer dans le développement de chaque séquence, mais en explicitant comment les séquences sont articulées entre elles pour arriver à la conclusion de cette idée.

3. ANALYSE DE LA STRUCTURE DE CHAQUE IDÉE
   Pour chaque idée, présente les séquences qui mènent à cette conclusion (maximum 6 séquences):

   - un TITRE pour la séquence (max 150 caractères)
   - une DESCRIPTION pour la décrire (max 1200 caractères), en insistant sur la structure de la séquence: quelles idées elle articule, quelles références elle évoque, quels arguments elle avance etc...
   - un TIMECODE pour identifier le début de la séquence

FORMAT DE RÉPONSE ATTENDU:

```json
{
  "title": "Titre de la vidéo (150 caractères max)",
  "abstract": "Résumé des idées générales défendues par la vidéo, sans rentrer dans le détail de la démonstration de ces idées (1200 caractères max)",
  "ideas": [
    {
      "title": "Titre de l'idée (150 caractères max)",
      "abstract": "Résumé de l'idée et du raisonnement qui y a mené (1200 caractères max)",
      "sequences": [
        {
          "title": "Titre de la séquence",
          "abstract": "Description de la séquence",
          "timecode": "MM:SS"
        }
      ]
    }
  ]
}
```
