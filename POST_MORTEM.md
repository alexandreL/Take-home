# Post-mortem

## 1. Validation à la frontière

Il manque totalement la validation des entrées, je l'ai complètement oubliée.
J'airais du l'implementer un zod par example, rapide et fnctionnel.

## 2. Race sur la capacité (itération 2)

Il y a une race dans l'itération 2, corrigée implicitement par l'itération 3 :
`node:sqlite` est synchrone donc le `COUNT` et l'`INSERT` ne peuvent plus s'entrelacer.

## 3. Un agent sur deux shifts en même temps

Non géré. `assignAgent` lit les assignations de l'agent puis écrit, mais la
transaction ne couvre que le nombre de places : deux requêtes simultanées pour
le même agent sur deux shifts qui se chevauchent passent toutes les deux.

L'idée serait de mettre un mutex au niveau de l'agent : au moment d'une
requête qui touche une édition (l'assignation d'un agent), on locke l'agent, on
fait toutes nos étapes, nos vérifications et nos insertions, puis on le
déloque. Ça nécessiterait de changer le data model, et honnêtement c'est
peut-être un peu over-engineered pour un test.
