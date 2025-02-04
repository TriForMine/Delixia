## **Delixia - La Quête Gourmande du Panda**

---

### **1. Introduction**

**Delixia** est un jeu d'aventure et de plateforme **en 3D** où les joueurs incarnent des pandas gourmands dans un monde
entièrement composé de nourriture. Le but est de retrouver les **Cristaux de Saveur** volés par le sorcier **Glouton
Noir** pour sauver le royaume de Delixia. Le jeu propose un mode **multijoueur coopératif**, tout en étant **entièrement
jouable en solo**.
x&
---

### **2. Objectifs du jeu**

- **Principal :** Récupérer les Cristaux de Saveur et vaincre le Glouton Noir.
- **Secondaires :**
    - Aider les habitants de Delixia en résolvant des énigmes.
    - Collecter des snacks et des ingrédients magiques pour progresser.
- **Multijoueur coopératif :**
    - Coopérer pour atteindre les objectifs communs.
    - Partager les snacks et les ingrédients.

---

### **3. Public cible**

- **Tranche d’âge :** Tout public (enfants, adolescents, adultes).
- **Style :** Mignon, humoristique et accessible.
- **Multijoueur :** Idéal pour les joueurs qui aiment jouer en coopération.

---

### **4. Plateformes**

- **Navigateur web** (HTML5 + Babylon.js).
- **PC** (via une version standalone si nécessaire).
- **Multijoueur :** En ligne via une connexion Internet.

---

### **5. Gameplay**

#### **5.1. Mécaniques principales (Singleplayer et Coop)**

1. **Mouvement 3D :**
    - Avancer/reculer, se déplacer latéralement (gauche/droite), contrôler la caméra.
    - Saut.
    - Glissade ou sprint.
2. **Faim :**
    - Jauge de faim qui diminue avec le temps.
    - Manger des snacks pour remplir la jauge.
3. **Attaques :**
    - Écrasement des ennemis en sautant dessus.
    - Projectiles de sel avec le **Cristal Salé**.
4. **Pouvoirs spéciaux :**
    - **Cristal Sucré :** Saut plus haut et plateformes en guimauve.
    - **Cristal Acide :** Dissoudre des obstacles et glisser sur les ennemis.

#### **5.2. Multijoueur : Mode Coopératif**

- Les joueurs travaillent ensemble pour récupérer les cristaux et vaincre les boss.
- Partage des snacks et des ingrédients.
- Capacités complémentaires (ex : un joueur utilise le Cristal Sucré pour créer des plateformes, l’autre utilise le
  Cristal Salé pour attaquer les ennemis).
- **Serveur simplifié :** Le serveur ne fait que transmettre et partager les informations reçues des joueurs. Étant un
  jeu exclusivement coopératif, la gestion de la triche n'est pas une priorité, ce qui permet un code multijoueur plus
  léger.

#### **5.3. Ennemis : Les Slimes Gourmands**

- **Types :**
    1. **Slime Gelée :** Saute pour attaquer.
    2. **Slime Sauce Tomate :** Laisse des traces collantes.
    3. **Slime Glace :** Glisse rapidement.
    4. **Slime Pourri :** Empoisonne les joueurs.
- **Comportement :** Déplacement en sautillant ou en glissant, attaques simples.

#### **5.4. Niveaux et zones**

1. **Forêt de Bonbons :**
    - Environnement : Arbres en guimauve, rivières de chocolat.
    - Boss : Slime Gâteau Géant.
2. **Plaine de Pâtes :**
    - Environnement : Herbe en spaghettis, lacs de sauce tomate.
    - Boss : Slime Spaghetti Géant.
3. **Montagne de Glace :**
    - Environnement : Glaciers en sucre glace, geysers de soda.
    - Boss : Slime Cornet de Glace.
4. **Cuisine du Glouton Noir :**
    - Environnement : Château sombre fait de nourriture pourrie.
    - Boss : Glouton Noir.

---

### **6. Design et ambiance**

#### **6.1. Personnages**

- **Pandas jouables :** Plusieurs pandas avec des apparences différentes (couleurs, accessoires).
- **Slimes :** Créatures gélatineuses faites de nourriture, avec des yeux expressifs.
- **PNJ :** Habitants de Delixia (hamburgers, fraises, etc.).

#### **6.2. Environnements**

- **Forêt de Bonbons :** Couleurs vives, arbres en guimauve, rivières de chocolat.
- **Plaine de Pâtes :** Herbe en spaghettis, rochers en boulettes de viande.
- **Montagne de Glace :** Glaciers en sucre glace, sommets en crème chantilly.
- **Cuisine du Glouton Noir :** Ambiance sombre, nourriture pourrie.

#### **6.3. Ambiance sonore**

- **Musique :** Douce et magique pour les zones calmes, dynamique pour les combats.
- **Sons :** Bruits de pas, sauts, glissades, mastication, attaques des slimes.

---

### **7. Technologies et outils**

- **Moteur de jeu :** Babylon.js.
- **Langage :** TypeScript.
- **Runtime :** Bun.
- **Multijoueur :** Utilisation de **colyseus.js** pour la communication en temps réel.
- **Modélisation 3D :** Blender.
- **Assets :** Kenney.nl, OpenGameArt, etc.

---

### **8. Échéancier**

1. **Mois 1 :**
    - Finalisation du concept et du design des niveaux.
    - Modélisation des personnages et des objets.
    - Création de la scène de base avec Babylon.js.
2. **Mois 2 :**
    - Développement des mécaniques de base (mouvement, collecte, faim).
    - Création de la première zone (Forêt de Bonbons).
    - Intégration du multijoueur coop (connexion, synchronisation des joueurs).
3. **Mois 3 :**
    - Ajout des autres zones (Plaine de Pâtes, Montagne de Glace).
    - Intégration des énigmes, des boss et des sons.
    - Approfondissement des mécaniques de coopération.
4. **Mois 4 :**
    - Polissage, tests et équilibrage du gameplay.
    - Ajout de finitions (effets visuels, animations supplémentaires).
    - Tests multijoueur et correction des bugs.

---

### **9. Schémas**

#### **9.1. Structure des niveaux**

```
Niveau 1 : Forêt de Bonbons
   - Environnement : Arbres en guimauve, rivières de chocolat.
   - Ennemis : Slime Gelée, Slime Guimauve.
   - Boss : Slime Gâteau Géant.

Niveau 2 : Plaine de Pâtes
   - Environnement : Herbe en spaghettis, lacs de sauce tomate.
   - Ennemis : Slime Sauce Tomate, Slime Fromage.
   - Boss : Slime Spaghetti Géant.

Niveau 3 : Montagne de Glace
   - Environnement : Glaciers en sucre glace, geysers de soda.
   - Ennemis : Slime Glace, Slime Sirop.
   - Boss : Slime Cornet de Glace.

Niveau final : Cuisine du Glouton Noir
   - Environnement : Château sombre, nourriture pourrie.
   - Ennemis : Slime Pourri, Slime Magique.
   - Boss : Glouton Noir.
```

#### **9.2. Diagramme des mécaniques de jeu**

```
+-------------------+
|      Mécaniques   |
+-------------------+
| - Déplacement 3D  |
| - Saut            |
| - Glissade        |
| - Faim            |
| - Attaques        |
| - Pouvoirs        |
+-------------------+
```

#### **9.3. Diagramme du multijoueur coop**

```
+-------------------+
| Multijoueur       |
+-------------------+
| - Connexion       |
| - Synchronisation |
| - Coopération     |
+-------------------+
   |
   v
+-------------------+
| Mode de jeu       |
+-------------------+
| - Coopératif      |
+-------------------+
```

---

### **10. Points forts pour le concours**

- Un titre mystérieux et accrocheur (**Delixia**).
- Un concept mignon et rigolo avec des pandas gourmands.
- Un monde de nourriture coloré et attractif.
- Des mécaniques de jeu simples mais amusantes.
- Une ambiance légère et humoristique.
- Un mode multijoueur coopératif pouvant aussi se jouer en solo.

---

### **11. Conclusion**

**Delixia : La Quête Gourmande du Panda** est un jeu qui combine exploration, humour et défis dans un monde unique et
gourmand. Avec son histoire attachante, ses mécaniques accessibles, son univers visuellement riche et son mode
multijoueur coopératif (jouable également en solo), il a tout pour plaire aux joueurs de tous âges.