import { lireDifficulte } from "./script.js";

const difficulté_robot = lireDifficulte();
let jeuCommence = false;
let tourJoueur = true;
let partieTerminee = false;
/** @type {Set<number>} */
const delaisActifs = new Set();
const TAILLE_GRILLE = 10;
const DELAI_AVANT_TIR_BOT = 1000;
const DELAI_APRES_TIR_BOT = 1000;
const DELAI_APRES_ANIMATION = 800;
const grilleElement = document.querySelector(".conteigner-jeu .grille");
if (!(grilleElement instanceof HTMLElement)) {
  throw new Error("La grille principale est introuvable.");
}
const grille = /** @type {HTMLElement} */ (grilleElement);
const btnCommenceElement = document.getElementById("commence-le-jeu");
if (!(btnCommenceElement instanceof HTMLButtonElement)) {
  throw new Error("Le bouton de démarrage est introuvable.");
}
const btnCommence = /** @type {HTMLButtonElement} */ (btnCommenceElement);
const miniConteignerElement = document.getElementById("mini-conteigner");
if (!(miniConteignerElement instanceof HTMLElement)) {
  throw new Error("Le conteneur de la mini-grille est introuvable.");
}
const miniConteigner = /** @type {HTMLElement} */ (miniConteignerElement);
const messageFinElement = document.getElementById("message-fin");
if (!(messageFinElement instanceof HTMLElement)) {
  throw new Error("Le conteneur du message de fin est introuvable.");
}
const messageFin = /** @type {HTMLElement} */ (messageFinElement);
const messageResultatElement = document.getElementById("message-resultat");
if (!(messageResultatElement instanceof HTMLElement)) {
  throw new Error("Le texte du résultat est introuvable.");
}
const messageResultat = /** @type {HTMLElement} */ (messageResultatElement);
const confettisElement = document.getElementById("confettis");
if (!(confettisElement instanceof HTMLElement)) {
  throw new Error("Le conteneur des confettis est introuvable.");
}
const confettis = /** @type {HTMLElement} */ (confettisElement);
const boutonRecommencerElement = document.getElementById("recommencer");
if (!(boutonRecommencerElement instanceof HTMLButtonElement)) {
  throw new Error("Le bouton recommencer est introuvable.");
}
const boutonRecommencer = /** @type {HTMLButtonElement} */ (
  boutonRecommencerElement
);
const grilleMiniInterneElement = document.getElementById("grille-mini-interne");
if (!(grilleMiniInterneElement instanceof HTMLElement)) {
  throw new Error("La grille interne de la mini-grille est introuvable.");
}
const grilleMiniInterne = /** @type {HTMLElement} */ (grilleMiniInterneElement);
const rangement = document.getElementById("conteigner-div");
const zoneRangement = rangement?.querySelector(".place-bateau") ?? null;
const boutonRotationElement = document.querySelector("#tourner-bateau");
if (
  boutonRotationElement !== null &&
  !(boutonRotationElement instanceof HTMLButtonElement)
) {
  throw new Error("Le bouton de rotation n'est pas un bouton.");
}
const boutonRotation = /** @type {HTMLButtonElement | null} */ (
  boutonRotationElement
);
const imageElements = document.querySelectorAll(".bateau");
if (
  Array.from(imageElements).some(
    (image) => !(image instanceof HTMLImageElement),
  )
) {
  throw new Error("Chaque bateau doit être une image.");
}
const images = /** @type {NodeListOf<HTMLImageElement>} */ (imageElements);
if (images.length !== 5) {
  throw new Error("La flotte doit contenir exactement cinq bateaux.");
}
/** @type {Map<HTMLImageElement, string>} */
const sourcesInitiales = new Map(
  Array.from(images, (image) => [image, image.getAttribute("src") ?? ""]),
);

/**
 * @typedef {{
 *   index: number,
 *   taille: number,
 *   x: number,
 *   y: number,
 *   orientation: number,
 *   touches: Set<string>,
 *   revele: boolean
 * }} BateauRobot
 */

/**
 * @typedef {{
 *   index: number,
 *   taille: number,
 *   x: number,
 *   y: number,
 *   orientation: number,
 *   cases: number[]
 * }} PlacementRobot
 */

/**
 * @param {() => void} callback
 * @param {number} délai
 */
function programmerDélai(callback, délai) {
  /** @type {number} */
  let id;
  id = window.setTimeout(() => {
    delaisActifs.delete(id);
    callback();
  }, délai);
  delaisActifs.add(id);
}

function terminerTourRobot() {
  miniConteigner.classList.remove("zoom-animation");
  programmerDélai(() => {
    if (!partieTerminee) tourJoueur = true;
  }, DELAI_APRES_ANIMATION);
}

function annulerDélais() {
  delaisActifs.forEach((id) => window.clearTimeout(id));
  delaisActifs.clear();
}

class Bateau {
  /**
   * @param {HTMLImageElement} image
   * @param {number} taille
   * @param {number} touche
  
   */
  constructor(image, taille, touche) {
    this.image = image;
    this.touche = touche;
    this.taille = taille;
    this.place = false;
    this.orientation = 0;
    this.angleRotation = 0;

    this.x = 0;
    this.y = 0;

    const ancienConteneur = image.parentElement;
    this.conteneur =
      ancienConteneur instanceof HTMLElement &&
      ancienConteneur.classList.contains("bateau-case")
        ? ancienConteneur
        : document.createElement("div");
    this.conteneur.className = "bateau-case";
    this.conteneur.append(image);
    if (ancienConteneur !== this.conteneur) {
      ancienConteneur?.append(this.conteneur);
    }
  }
}

const bateaux = [
  new Bateau(images[0], 5, 0),
  new Bateau(images[1], 2, 0),
  new Bateau(images[2], 3, 0),
  new Bateau(images[3], 4, 0),
  new Bateau(images[4], 3, 0),
];
/** @type {Bateau[]} */
const bateauxReveles = [];
/** @type {Map<number, Bateau>} */
/** @type {Map<number, Bateau>} */
const casesOccupees = new Map();
/** @type {Bateau | null} */
let bateauChoisi = null;
let positionPointeur = { x: 0, y: 0 };
/** @type {{ x: number, y: number, orientation: number, angleRotation: number } | null} */
let positionAvantSelection = null;

/** @param {Bateau} bateau */
function afficherBateau(bateau) {
  const horizontal = bateau.orientation % 2 === 1;
  bateau.conteneur.style.gridColumn = horizontal
    ? `${bateau.x + 1} / span ${bateau.taille}`
    : String(bateau.x + 1);
  bateau.conteneur.style.gridRow = horizontal
    ? String(bateau.y + 1)
    : `${bateau.y + 1} / span ${bateau.taille}`;
  bateau.conteneur.classList.remove(
    "orientation-haut",
    "orientation-droite",
    "orientation-bas",
    "orientation-gauche",
  );
  bateau.conteneur.classList.add(
    [
      "orientation-haut",
      "orientation-droite",
      "orientation-bas",
      "orientation-gauche",
    ][bateau.orientation],
  );
  bateau.image.style.setProperty("--taille-bateau", String(bateau.taille));
  bateau.image.style.setProperty(
    "--angle-rotation",
    `${bateau.angleRotation}deg`,
  );
  dimensionnerBateau(bateau);
}

/** @param {Bateau} bateau */
function dimensionnerBateau(bateau) {
  if (!grille.contains(bateau.conteneur)) return;
  const cellule = grille.querySelector(
    `.cell[data-x="${bateau.x}"][data-y="${bateau.y}"]`,
  );
  if (!(cellule instanceof HTMLElement)) return;

  const horizontal = bateau.orientation % 2 === 1;
  const derniereCellule = grille.querySelector(
    `.cell[data-x="${bateau.x + (horizontal ? bateau.taille - 1 : 0)}"][data-y="${bateau.y + (horizontal ? 0 : bateau.taille - 1)}"]`,
  );
  if (!(derniereCellule instanceof HTMLElement)) return;

  const debut = cellule.getBoundingClientRect();
  const fin = derniereCellule.getBoundingClientRect();
  const longueur = horizontal ? fin.right - debut.left : fin.bottom - debut.top;
  bateau.image.style.width = `${horizontal ? debut.height : debut.width}px`;
  bateau.image.style.height = `${longueur}px`;
}

/**
 * @param {{ taille: number, orientation: number }} bateau
 * @param {number} x
 * @param {number} y
 * @param {number} [orientation]
 * @returns {number[]}
 */
function trouverCases(bateau, x, y, orientation = bateau.orientation) {
  const horizontal = orientation % 2 === 1;
  return Array.from({ length: bateau.taille }, (_, index) =>
    horizontal
      ? y * TAILLE_GRILLE + x + index
      : (y + index) * TAILLE_GRILLE + x,
  );
}

/**
 * @param {Bateau} bateau
 * @param {number[]} cases
 * @returns {boolean}
 */
function chevaucheAutreBateau(bateau, cases) {
  const casesProposees = new Set(cases);
  return bateaux.some(
    (autreBateau) =>
      autreBateau !== bateau &&
      autreBateau.place &&
      trouverCases(
        autreBateau,
        autreBateau.x,
        autreBateau.y,
        autreBateau.orientation,
      ).some((index) => casesProposees.has(index)),
  );
}

function reconstruireCasesOccupees() {
  casesOccupees.clear();
  bateaux.forEach((bateau) => {
    if (!bateau.place) return;
    trouverCases(bateau, bateau.x, bateau.y, bateau.orientation).forEach(
      (index) => casesOccupees.set(index, bateau),
    );
  });
}

/** @param {"Victoire !" | "Défaite !"} message */
function terminerPartie(message) {
  partieTerminee = true;
  tourJoueur = false;
  miniConteigner.classList.remove("zoom-animation");
  messageResultat.textContent = message;
  messageFin.hidden = false;
  if (message === "Victoire !") lancerConfettis();
}

function initialiserBateauxRobot() {
  if (difficulté_robot === "hard") {
    placerFlotteRobotDifficile();
  } else {
    placeBateauRobot();
  }
}

function lancerConfettis() {
  const couleurs = ["#ff4d6d", "#ffd43b", "#51cf66", "#339af0", "#cc5de8"];
  for (let index = 0; index < 80; index += 1) {
    const confetti = document.createElement("span");
    confetti.className = "confetti";
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.setProperty(
      "--couleur-confetti",
      couleurs[index % couleurs.length],
    );
    confetti.style.setProperty("--delai-confetti", `${Math.random() * 1.5}s`);
    confetti.style.setProperty(
      "--duree-confetti",
      `${2.5 + Math.random() * 2}s`,
    );
    confetti.style.setProperty(
      "--deplacement-confetti",
      `${Math.random() * 200 - 100}px`,
    );
    confettis.append(confetti);
  }
}

function recommencerPartie() {
  annulerDélais();
  bateauChoisi?.image.classList.remove("bateaudragged");
  bateauChoisi = null;
  positionAvantSelection = null;
  jeuCommence = false;
  tourJoueur = true;
  partieTerminee = false;
  tirsJoueur.clear();
  tire_robot.clear();
  touchesRobot.clear();
  casesOccupees.clear();
  casesOccupeesRobot.clear();
  bateauxRobot.length = 0;
  cibleRobot = null;
  bateauxReveles.forEach((bateau) => bateau.conteneur.remove());
  bateauxReveles.length = 0;

  grille.querySelectorAll(".cell").forEach((cellule) => {
    cellule.classList.remove("touche", "rate", "a-leau");
  });
  grilleMiniInterne.replaceChildren();
  miniConteigner.classList.remove("zoom-animation");
  miniConteigner.style.display = "none";
  messageFin.hidden = true;
  messageResultat.textContent = "";
  confettis.replaceChildren();
  if (rangement !== null) rangement.hidden = false;
  btnCommence.style.display = "none";
  if (boutonRotation !== null) boutonRotation.hidden = true;

  bateaux.forEach((bateau) => {
    bateau.conteneur.remove();
    bateau.conteneur.style.removeProperty("grid-column");
    bateau.conteneur.style.removeProperty("grid-row");
    zoneRangement?.append(bateau.conteneur);
    bateau.place = false;
    bateau.touche = 0;
    bateau.x = 0;
    bateau.y = 0;
    bateau.orientation = 0;
    bateau.angleRotation = 0;
    bateau.image.src = sourcesInitiales.get(bateau.image) ?? bateau.image.src;
    bateau.image.style.removeProperty("width");
    bateau.image.style.removeProperty("height");
    bateau.image.style.removeProperty("--taille-bateau");
    bateau.image.style.removeProperty("--angle-rotation");
  });
}

boutonRecommencer.addEventListener("click", recommencerPartie);

function afficherBoutonRotation() {
  if (boutonRotation === null || bateauChoisi === null) return;
  boutonRotation.hidden = false;
  boutonRotation.style.left = `${Math.min(positionPointeur.x + 12, window.innerWidth - 48)}px`;
  boutonRotation.style.top = `${Math.min(positionPointeur.y + 12, window.innerHeight - 48)}px`;
}

/**
 * @param {Bateau} bateau
 * @param {MouseEvent} event
 */
function choisirBateau(bateau, event) {
  if (jeuCommence || partieTerminee) return;
  if (bateauChoisi !== null) annulerSelection();
  bateauChoisi = bateau;
  positionAvantSelection = {
    x: bateau.x,
    y: bateau.y,
    orientation: bateau.orientation,
    angleRotation: bateau.angleRotation,
  };
  bateau.image.classList.add("bateaudragged");
  positionPointeur = { x: event.clientX, y: event.clientY };
  afficherBoutonRotation();
}

function deselectionnerBateau() {
  bateauChoisi?.image.classList.remove("bateaudragged");
  bateauChoisi = null;
  positionAvantSelection = null;
  if (boutonRotation !== null) boutonRotation.hidden = true;
}

function annulerSelection() {
  if (bateauChoisi !== null && positionAvantSelection !== null) {
    bateauChoisi.x = positionAvantSelection.x;
    bateauChoisi.y = positionAvantSelection.y;
    bateauChoisi.orientation = positionAvantSelection.orientation;
    const toursComplets = Math.round(
      (bateauChoisi.angleRotation - positionAvantSelection.angleRotation) / 360,
    );
    bateauChoisi.angleRotation =
      positionAvantSelection.angleRotation + toursComplets * 360;
    afficherBateau(bateauChoisi);
  }
  deselectionnerBateau();
}

function tournerBateau() {
  if (jeuCommence || partieTerminee || bateauChoisi === null) return;

  const bateau = bateauChoisi;
  const nouvelleOrientation = (bateau.orientation + 1) % 4;
  const horizontal = nouvelleOrientation % 2 === 1;
  const nouveauX = Math.min(
    bateau.x,
    horizontal ? TAILLE_GRILLE - bateau.taille : TAILLE_GRILLE - 1,
  );
  const nouveauY = Math.min(
    bateau.y,
    horizontal ? TAILLE_GRILLE - 1 : TAILLE_GRILLE - bateau.taille,
  );
  bateau.orientation = nouvelleOrientation;
  bateau.x = nouveauX;
  bateau.y = nouveauY;
  bateau.angleRotation += 90;
  afficherBateau(bateau);
}

/**
 
 * @param {number} x
 * @param {number} y
 */
function placerBateau(x, y) {
  if (jeuCommence || partieTerminee || bateauChoisi === null) return;

  const bateau = bateauChoisi;
  const horizontal = bateau.orientation % 2 === 1;
  x = Math.min(
    x,
    horizontal ? TAILLE_GRILLE - bateau.taille : TAILLE_GRILLE - 1,
  );
  y = Math.min(
    y,
    horizontal ? TAILLE_GRILLE - 1 : TAILLE_GRILLE - bateau.taille,
  );
  const nouvellesCases = trouverCases(bateau, x, y);
  if (chevaucheAutreBateau(bateau, nouvellesCases)) {
    annulerSelection();
    return;
  }

  bateau.x = x;
  bateau.y = y;
  bateau.place = true;
  const imageRecadree = bateau.image.dataset.grilleSrc;
  if (imageRecadree) bateau.image.src = imageRecadree;
  grille.append(bateau.conteneur);
  afficherBateau(bateau);
  reconstruireCasesOccupees();
  deselectionnerBateau();

  if (bateaux.every((bateau) => bateau.place)) {
    if (rangement !== null) rangement.hidden = true;
    btnCommence.style.display = "block";
  }
}

btnCommence.addEventListener("click", () => {
  if (!bateaux.every((bateau) => bateau.place)) return;
  if (bateauChoisi !== null) annulerSelection();
  reconstruireCasesOccupees();
  btnCommence.style.display = "none";
  jeuCommence = true;
  miniConteigner.style.display = "block";
  bateaux.forEach((bateau) => grilleMiniInterne.append(bateau.conteneur));
  Array.from({ length: TAILLE_GRILLE * TAILLE_GRILLE }, (_, index) => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.x = String(index % TAILLE_GRILLE);
    cell.dataset.y = String(Math.floor(index / TAILLE_GRILLE));
    cell.style.gridColumn = String((index % TAILLE_GRILLE) + 1);
    cell.style.gridRow = String(Math.floor(index / TAILLE_GRILLE) + 1);
    grilleMiniInterne.append(cell);
  });
  initialiserBateauxRobot();
});

images.forEach((image, index) => {
  image.draggable = false;
  image.addEventListener("click", (event) => {
    const bateau = bateaux[index];
    if (bateau.place && bateauChoisi === bateau) {
      placerBateau(bateau.x, bateau.y);
      return;
    }
    choisirBateau(bateau, event);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") tournerBateau();
  if (event.key === "Escape") annulerSelection();
});

boutonRotation?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
});
boutonRotation?.addEventListener("click", tournerBateau);

document.addEventListener("click", (event) => {
  if (
    event.target instanceof Element &&
    !event.target.closest(".bateau-case, .cell, #tourner-bateau")
  ) {
    annulerSelection();
  }
});

document.addEventListener("pointerdown", (event) => {
  positionPointeur = { x: event.clientX, y: event.clientY };
  afficherBoutonRotation();
});

for (let index = 0; index < TAILLE_GRILLE * TAILLE_GRILLE; index += 1) {
  const cellule = document.createElement("div");
  cellule.className = "cell";
  cellule.dataset.x = String(index % TAILLE_GRILLE);
  cellule.dataset.y = String(Math.floor(index / TAILLE_GRILLE));
  cellule.style.gridColumn = String((index % TAILLE_GRILLE) + 1);
  cellule.style.gridRow = String(Math.floor(index / TAILLE_GRILLE) + 1);
  cellule.addEventListener("click", () => {
    if (partieTerminee) return;
    if (!jeuCommence) {
      placerBateau(Number(cellule.dataset.x), Number(cellule.dataset.y));
      return;
    }
    if (!tourJoueur) return;

    const cleTire = `${cellule.dataset.y}-${cellule.dataset.x}`;
    if (tirsJoueur.has(cleTire)) return;
    tirsJoueur.add(cleTire);
    tourJoueur = false;

    const bateauRobot = casesOccupeesRobot.get(cleTire);
    if (bateauRobot !== undefined) {
      cellule.classList.add("touche");
      bateauRobot.touches.add(cleTire);
      if (bateauRobot.touches.size === bateauRobot.taille) {
        revelerBateauCoule(bateauRobot);
      }
    } else {
      cellule.classList.add("rate");
      programmerDélai(() => {
        cellule.classList.remove("rate");
        cellule.classList.add("a-leau");
      }, 700);
    }

    if (
      bateauxRobot.length > 0 &&
      bateauxRobot.every((bateau) => bateau.revele)
    ) {
      terminerPartie("Victoire !");
      return;
    }

    miniConteigner.classList.add("zoom-animation");
    programmerDélai(tirerRobot, DELAI_AVANT_TIR_BOT);
  });
  grille.append(cellule);
}

const observerTailleGrille = new ResizeObserver(() => {
  bateaux.forEach(dimensionnerBateau);
  bateauxReveles.forEach(dimensionnerBateau);
});
observerTailleGrille.observe(grille);
/** @type {Set<string>} */
const tire_robot = new Set();
/** @type {Set<string>} */
const touchesRobot = new Set();
/** @type {Map<string, BateauRobot>} */
const casesOccupeesRobot = new Map();
/** @type {Set<string>} */
const tirsJoueur = new Set();
const DIRECTIONS_ROBOT = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];
/** @type {{ origineX: number, origineY: number, directionsTestees: Set<number>, indexDirection: number | null, dernierX: number, dernierY: number, nombreTouches: number } | null} */
let cibleRobot = null;
/** @type {BateauRobot[]} */
const bateauxRobot = [];

/**
 * @param {BateauRobot} bateauRobot
 */
function revelerBateauCoule(bateauRobot) {
  if (bateauRobot.revele) return;
  bateauRobot.revele = true;
  bateauRobot.touches.forEach((cle) => {
    const [yCase, xCase] = cle.split("-");
    grille
      .querySelector(`.cell[data-x="${xCase}"][data-y="${yCase}"]`)
      ?.classList.remove("touche");
  });

  const horizontal = bateauRobot.orientation % 2 === 1;
  const x =
    horizontal && bateauRobot.orientation === 3
      ? bateauRobot.x - bateauRobot.taille + 1
      : bateauRobot.x;
  const y =
    !horizontal && bateauRobot.orientation === 2
      ? bateauRobot.y - bateauRobot.taille + 1
      : bateauRobot.y;
  const bateauAffiche = new Bateau(
    /** @type {HTMLImageElement} */ (
      bateaux[bateauRobot.index].image.cloneNode()
    ),
    bateauRobot.taille,
    0,
  );
  bateauAffiche.x = x;
  bateauAffiche.y = y;
  bateauAffiche.orientation = bateauRobot.orientation;
  bateauAffiche.angleRotation = bateauRobot.orientation * 90;
  bateauAffiche.place = true;
  grille.append(bateauAffiche.conteneur);
  afficherBateau(bateauAffiche);
  bateauxReveles.push(bateauAffiche);
}

function placeBateauRobot() {
  bateaux.forEach(({ taille }, index) => {
    let place = false;

    while (!place) {
      const x = Math.floor(Math.random() * TAILLE_GRILLE);
      const y = Math.floor(Math.random() * TAILLE_GRILLE);
      const orientation = Math.floor(Math.random() * 4);

      if (orientation === 0) {
        if (y + taille > TAILLE_GRILLE) continue;
      }
      if (orientation === 2 && y - (taille - 1) < 0) continue;
      if (orientation === 1) {
        if (x + taille > TAILLE_GRILLE) continue;
      }
      if (orientation === 3 && x - (taille - 1) < 0) continue;

      let collision = false;
      const casesDuBateau = [];

      for (let i = 0; i < taille; i++) {
        let currentX = x;
        let currentY = y;

        if (orientation === 1) {
          currentX = x + i;
        } else if (orientation === 3) {
          currentX = x - i;
        } else if (orientation === 0) {
          currentY = y + i;
        } else if (orientation === 2) {
          currentY = y - i;
        }

        const cleCase = `${currentY}-${currentX}`;

        if (casesOccupeesRobot.has(cleCase)) {
          collision = true;
          break;
        }

        casesDuBateau.push(cleCase);
      }

      if (!collision) {
        const bateauRobot = {
          index,
          taille,
          x,
          y,
          orientation,
          touches: new Set(),
          revele: false,
        };
        bateauxRobot.push(bateauRobot);
        casesDuBateau.forEach((cle) => {
          casesOccupeesRobot.set(cle, bateauRobot);
        });
        place = true;
      }
    }
  });
}

/**
 * @template T
 * @param {T[]} tableau
 * @returns {T[]}
 */
function melanger(tableau) {
  for (let index = tableau.length - 1; index > 0; index -= 1) {
    const indexAleatoire = Math.floor(Math.random() * (index + 1));
    [tableau[index], tableau[indexAleatoire]] = [
      tableau[indexAleatoire],
      tableau[index],
    ];
  }
  return tableau;
}

function placerFlotteRobotDifficile() {
  /** @type {PlacementRobot[][]} */
  const placementsParBateau = bateaux.map((bateau, index) => {
    /** @type {PlacementRobot[]} */
    const placements = [];
    [0, 1].forEach((orientation) => {
      for (let y = 0; y < TAILLE_GRILLE; y += 1) {
        for (let x = 0; x < TAILLE_GRILLE; x += 1) {
          const cases = trouverCases(bateau, x, y, orientation);
          const dansGrille = cases.every(
            (caseIndex) =>
              caseIndex >= 0 &&
              caseIndex < TAILLE_GRILLE * TAILLE_GRILLE &&
              (orientation === 1
                ? Math.floor(caseIndex / TAILLE_GRILLE) === y
                : caseIndex % TAILLE_GRILLE === x),
          );
          if (dansGrille) {
            placements.push({
              index,
              taille: bateau.taille,
              x,
              y,
              orientation,
              cases,
            });
          }
        }
      }
    });
    return melanger(placements);
  });
  const ordreBateaux = bateaux
    .map((bateau, index) => ({ index, taille: bateau.taille }))
    .sort((a, b) => b.taille - a.taille);
  /** @type {PlacementRobot[]} */
  const positionsChoisies = [];
  const casesOccupees = new Set();
  let essais = 0;

  /**
   * @param {number} profondeur
   * @returns {boolean}
   */
  function chercherPlacement(profondeur) {
    if (profondeur === ordreBateaux.length) return true;
    if (essais > 30000) return false;
    const bateau = ordreBateaux[profondeur];

    for (const placement of placementsParBateau[bateau.index]) {
      essais += 1;
      const casesAdjacentes = placement.cases.flatMap((caseIndex) => {
        const x = caseIndex % TAILLE_GRILLE;
        const y = Math.floor(caseIndex / TAILLE_GRILLE);
        return [
          [x - 1, y - 1],
          [x, y - 1],
          [x + 1, y - 1],
          [x - 1, y],
          [x + 1, y],
          [x - 1, y + 1],
          [x, y + 1],
          [x + 1, y + 1],
        ]
          .filter(
            ([xVoisin, yVoisin]) =>
              xVoisin >= 0 &&
              xVoisin < TAILLE_GRILLE &&
              yVoisin >= 0 &&
              yVoisin < TAILLE_GRILLE,
          )
          .map(([xVoisin, yVoisin]) => yVoisin * TAILLE_GRILLE + xVoisin);
      });
      if (
        placement.cases.some((caseIndex) => casesOccupees.has(caseIndex)) ||
        casesAdjacentes.some((caseIndex) => casesOccupees.has(caseIndex))
      ) {
        continue;
      }

      placement.cases.forEach((caseIndex) => casesOccupees.add(caseIndex));
      positionsChoisies.push(placement);
      if (chercherPlacement(profondeur + 1)) return true;
      positionsChoisies.pop();
      placement.cases.forEach((caseIndex) => casesOccupees.delete(caseIndex));
    }
    return false;
  }

  if (!chercherPlacement(0)) {
    placeBateauRobot();
    return;
  }

  positionsChoisies.forEach((placement) => {
    const bateauRobot = {
      index: placement.index,
      taille: placement.taille,
      x: placement.x,
      y: placement.y,
      orientation: placement.orientation,
      touches: new Set(),
      revele: false,
    };
    bateauxRobot.push(bateauRobot);
    placement.cases.forEach((caseIndex) => {
      const y = Math.floor(caseIndex / TAILLE_GRILLE);
      const x = caseIndex % TAILLE_GRILLE;
      casesOccupeesRobot.set(`${y}-${x}`, bateauRobot);
    });
  });
}

function choisirTirAleatoire() {
  const casesDisponibles = Array.from(
    { length: TAILLE_GRILLE * TAILLE_GRILLE },
    (_, index) =>
      `${Math.floor(index / TAILLE_GRILLE)}-${index % TAILLE_GRILLE}`,
  ).filter((cle) => !tire_robot.has(cle));
  if (casesDisponibles.length === 0) return null;
  return casesDisponibles[Math.floor(Math.random() * casesDisponibles.length)];
}

function choisirTirDifficile() {
  const probabilites = Array(TAILLE_GRILLE * TAILLE_GRILLE).fill(0);
  const taillesRestantes = bateaux
    .filter((bateau) => bateau.touche < bateau.taille)
    .map((bateau) => bateau.taille);
  const chasse = touchesRobot.size === 0;

  taillesRestantes.forEach((taille) => {
    [0, 1].forEach((orientation) => {
      for (let y = 0; y < TAILLE_GRILLE; y += 1) {
        for (let x = 0; x < TAILLE_GRILLE; x += 1) {
          const cases = trouverCases(
            { taille, orientation },
            x,
            y,
            orientation,
          );
          if (
            cases.some(
              (caseIndex) =>
                caseIndex < 0 ||
                caseIndex >= TAILLE_GRILLE * TAILLE_GRILLE ||
                (orientation === 1
                  ? Math.floor(caseIndex / TAILLE_GRILLE) !== y
                  : caseIndex % TAILLE_GRILLE !== x),
            )
          ) {
            continue;
          }

          const cles = cases.map((caseIndex) => {
            const caseY = Math.floor(caseIndex / TAILLE_GRILLE);
            const caseX = caseIndex % TAILLE_GRILLE;
            return `${caseY}-${caseX}`;
          });
          if (
            cles.some((cle) => tire_robot.has(cle) && !touchesRobot.has(cle))
          ) {
            continue;
          }
          const touchesDansPlacement = cles.filter((cle) =>
            touchesRobot.has(cle),
          ).length;
          if (touchesRobot.size > 0 && touchesDansPlacement === 0) continue;

          const poids = 1 + touchesDansPlacement * 4;
          cles.forEach((cle, index) => {
            if (tire_robot.has(cle)) return;
            const caseIndex = cases[index];
            const caseX = caseIndex % TAILLE_GRILLE;
            const caseY = Math.floor(caseIndex / TAILLE_GRILLE);
            if (chasse && (caseX + caseY) % 2 !== 0) return;
            probabilites[caseIndex] += poids;
          });
        }
      }
    });
  });

  const meilleuresCases = probabilites
    .map((probabilite, index) => ({ probabilite, index }))
    .filter(({ probabilite, index }) => {
      const y = Math.floor(index / TAILLE_GRILLE);
      const x = index % TAILLE_GRILLE;
      return probabilite > 0 && !tire_robot.has(`${y}-${x}`);
    });
  if (meilleuresCases.length === 0) return choisirTirAleatoire();

  const meilleureProbabilite = Math.max(
    ...meilleuresCases.map(({ probabilite }) => probabilite),
  );
  const candidats = meilleuresCases.filter(
    ({ probabilite }) => probabilite === meilleureProbabilite,
  );
  const choix = candidats[Math.floor(Math.random() * candidats.length)].index;
  return `${Math.floor(choix / TAILLE_GRILLE)}-${choix % TAILLE_GRILLE}`;
}

function choisirTirNormal() {
  while (cibleRobot !== null) {
    if (cibleRobot.indexDirection !== null) {
      const direction = DIRECTIONS_ROBOT[cibleRobot.indexDirection];
      const x = cibleRobot.dernierX + direction.x;
      const y = cibleRobot.dernierY + direction.y;
      const cle = `${y}-${x}`;
      if (
        x >= 0 &&
        x < TAILLE_GRILLE &&
        y >= 0 &&
        y < TAILLE_GRILLE &&
        !tire_robot.has(cle)
      ) {
        return { cle, indexDirection: cibleRobot.indexDirection };
      }
      cibleRobot.directionsTestees.add(cibleRobot.indexDirection);
      cibleRobot.dernierX = cibleRobot.origineX;
      cibleRobot.dernierY = cibleRobot.origineY;
      const directionOpposee =
        (cibleRobot.indexDirection + 2) % DIRECTIONS_ROBOT.length;
      cibleRobot.indexDirection =
        cibleRobot.nombreTouches >= 2 &&
        !cibleRobot.directionsTestees.has(directionOpposee)
          ? directionOpposee
          : null;
      continue;
    }

    for (
      let indexDirection = 0;
      indexDirection < DIRECTIONS_ROBOT.length;
      indexDirection += 1
    ) {
      if (cibleRobot.directionsTestees.has(indexDirection)) continue;
      const direction = DIRECTIONS_ROBOT[indexDirection];
      const x = cibleRobot.origineX + direction.x;
      const y = cibleRobot.origineY + direction.y;
      const cle = `${y}-${x}`;
      if (
        x >= 0 &&
        x < TAILLE_GRILLE &&
        y >= 0 &&
        y < TAILLE_GRILLE &&
        !tire_robot.has(cle)
      ) {
        return { cle, indexDirection };
      }
      cibleRobot.directionsTestees.add(indexDirection);
    }
    cibleRobot = null;
  }

  const cle = choisirTirAleatoire();
  return cle === null ? null : { cle, indexDirection: null };
}

function tirerRobot() {
  if (partieTerminee) return;
  if (casesOccupeesRobot.size === 0) {
    placeBateauRobot();
    return;
  }
  if (tourJoueur || !jeuCommence) return;

  const tir =
    difficulté_robot === "easy"
      ? (() => {
          const cle = choisirTirAleatoire();
          return cle === null ? null : { cle, indexDirection: null };
        })()
      : difficulté_robot === "hard"
        ? (() => {
            const cle = choisirTirDifficile();
            return cle === null ? null : { cle, indexDirection: null };
          })()
        : choisirTirNormal();
  if (tir === null) {
    terminerTourRobot();
    return;
  }

  const { cle: cleTire, indexDirection } = tir;
  tire_robot.add(cleTire);
  const [y, x] = cleTire.split("-");
  const xTire = Number(x);
  const yTire = Number(y);
  const cellule = grilleMiniInterne.querySelector(
    `.cell[data-x="${x}"][data-y="${y}"]`,
  );

  if (cellule instanceof HTMLElement) {
    const bateauTouche = casesOccupees.get(
      Number(y) * TAILLE_GRILLE + Number(x),
    );
    if (bateauTouche !== undefined) {
      cellule.classList.add("touche");
      bateauTouche.touche += 1;
      if (difficulté_robot === "hard") touchesRobot.add(cleTire);
      if (bateauTouche.touche >= bateauTouche.taille) {
        casesOccupees.forEach((bateau, index) => {
          if (bateau !== bateauTouche) return;
          const y = Math.floor(index / TAILLE_GRILLE);
          const x = index % TAILLE_GRILLE;
          touchesRobot.delete(`${y}-${x}`);
        });
        cibleRobot = null;
      } else if (difficulté_robot !== "easy") {
        if (cibleRobot === null) {
          cibleRobot = {
            origineX: xTire,
            origineY: yTire,
            directionsTestees: new Set(),
            indexDirection: null,
            dernierX: xTire,
            dernierY: yTire,
            nombreTouches: 1,
          };
        } else {
          cibleRobot.nombreTouches += 1;
        }
        if (cibleRobot.indexDirection === null && indexDirection !== null) {
          cibleRobot.indexDirection = indexDirection;
          cibleRobot.dernierX = xTire;
          cibleRobot.dernierY = yTire;
        } else if (cibleRobot.indexDirection !== null) {
          cibleRobot.dernierX = xTire;
          cibleRobot.dernierY = yTire;
        }
      }
    } else {
      cellule.classList.add("rate");
      programmerDélai(() => {
        cellule.classList.remove("rate");
        cellule.classList.add("a-leau");
      }, 700);
      if (
        difficulté_robot !== "easy" &&
        cibleRobot !== null &&
        indexDirection !== null
      ) {
        cibleRobot.directionsTestees.add(indexDirection);
        cibleRobot.dernierX = cibleRobot.origineX;
        cibleRobot.dernierY = cibleRobot.origineY;
        const directionOpposee = (indexDirection + 2) % DIRECTIONS_ROBOT.length;
        cibleRobot.indexDirection =
          cibleRobot.nombreTouches >= 2 &&
          !cibleRobot.directionsTestees.has(directionOpposee)
            ? directionOpposee
            : null;
      }
    }
  }
  if (bateaux.every((bateau) => bateau.touche >= bateau.taille)) {
    terminerPartie("Défaite !");
    return;
  }
  programmerDélai(() => {
    terminerTourRobot();
  }, DELAI_APRES_TIR_BOT);
}
