# Touché Coulé

Un jeu de bataille navale jouable dans le navigateur. Place tes bateaux sur la grille, puis affronte le robot et essaie de couler toute sa flotte.

## Lancer le jeu

Le projet est un site statique : il n’y a pas de dépendances à installer ni de compilation à effectuer.

1. Ouvre le dossier du projet dans Visual Studio Code.
2. Lance `index.html` avec l’extension **Live Server**.
3. Clique sur **Jouer**, choisis une difficulté dans les paramètres, puis place tes bateaux.
4. Clique sur **OK** pour commencer la partie.

## Commandes

- Clique sur un bateau puis sur une case de la grille pour le placer ou le déplacer.
- Appuie sur `R` pour tourner le bateau sélectionné.
- Appuie sur `Échap` pour annuler la sélection.
- Clique sur une case de la grille adverse pour tirer.

## Difficultés

- **Facile** : le robot choisit ses tirs au hasard.
- **Moyen** : après une touche, il teste les cases voisines et poursuit dans la direction qui touche.
- **Difficile** : il place les bateaux sans les faire se toucher et choisit ses tirs avec une carte de probabilités tenant compte des tailles de bateaux restantes et des touches déjà obtenues.

La difficulté choisie est conservée dans le stockage de session du navigateur.

## Licence

Le contenu du projet est sous licence **Creative Commons
Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** :
il peut être partagé et modifié avec attribution, sans usage commercial, et
les adaptations doivent conserver la même licence. Consulte [`LICENSE`](./LICENSE)
et le texte officiel sur <https://creativecommons.org/licenses/by-nc-sa/4.0/>.

Cette licence Creative Commons n'est pas recommandée pour les logiciels.

## Fichiers principaux

- `index.html` : accueil.
- `paramètre.html` : choix de la difficulté.
- `jeux.html` : plateau et interface du jeu.
- `jeu.js` : placement, tirs, robot et fin de partie.
- `script.js` : navigation et paramètres.
- `style.css` : styles et animations.
- `asset/` : images, animations et polices utilisées par le jeu.
