# Prompt d'Extraction Générale (Étape 1)

```
Première étape: Analyse cette transcription pour en extraire les informations suivantes au format JSON:
- title: Le titre de la vidéo
- abstract: Un résumé du contenu
- ideas: Un tableau contenant MAXIMUM 4 idées principales discutées (uniquement les titres et descriptions)

Format de sortie JSON attendu:

{
  "title": "Titre de la vidéo",
  "abstract": "Résumé du contenu",
  "ideas": [
    {
      "title": "Titre de l'idée 1",
      "abstract": "Résumé de l'idée 1"
    },
    {
      "title": "Titre de l'idée 2",
      "abstract": "Résumé de l'idée 2"
    }
  ]
}
```

Ce prompt demande à l'IA d'extraire les informations générales de la transcription, notamment le titre, un résumé et jusqu'à 4 idées principales avec leurs titres et descriptions. Le résultat est attendu au format JSON selon la structure spécifiée.
