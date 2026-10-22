window.addEventListener("load", () => {
  /** @type {NodeListOf<HTMLImageElement>} */
  const bateaux = document.querySelectorAll(".bateau-animé");

  if (bateaux.length === 0) return;

  const hauteurBateau = bateaux[0].getBoundingClientRect().height;
  const espacement = 20;
  const nombreVoies = Math.max(
    1,
    Math.floor(
      (window.innerHeight + espacement) / (hauteurBateau + espacement),
    ),
  );
  const hauteurVoies =
    nombreVoies * hauteurBateau + (nombreVoies - 1) * espacement;
  const margeHaut = Math.max(0, (window.innerHeight - hauteurVoies) / 2);
  const bateauxActifs = new Set();

  /** @param {number} voie */
  const lancerBateau = (voie) => {
    const disponibles = Array.from(bateaux).filter(
      (bateau) => !bateauxActifs.has(bateau),
    );
    const bateau = disponibles[Math.floor(Math.random() * disponibles.length)];
    if (!bateau) return;

    bateauxActifs.add(bateau);
    bateau.style.top = `${margeHaut + voie * (hauteurBateau + espacement)}px`;
    bateau.style.animation = "none";
    void bateau.offsetWidth;

    const distance =
      window.innerWidth + bateau.getBoundingClientRect().width * 2;
    const vitesse = Math.random() * 40 + 80;
    const duree = distance / vitesse;
    const direction = Math.random() < 0.5 ? "normal" : "reverse";
    bateau.style.transform =
      direction === "normal" ? "rotate(90deg)" : "rotate(-90deg)";
    bateau.style.animation = `traverser-ecran ${duree}s linear 1 ${direction}`;
    bateau.onanimationend = () => {
      bateauxActifs.delete(bateau);
      window.setTimeout(() => lancerBateau(voie), Math.random() * 1500);
    };
  };

  for (let voie = 0; voie < Math.min(nombreVoies, bateaux.length); voie += 1) {
    lancerBateau(voie);
  }
});

const paramètre = document.getElementById("Paramètres");
if (paramètre) {
  paramètre.addEventListener("click", () => {
    window.location.replace("paramètre.html");
  });
}

const retour = document.getElementById("retour");
if (retour) {
  retour.addEventListener("click", () => {
    window.location.replace("index.html");
  });
}

const jouer = document.getElementById("Jouer");
const robots = document.querySelectorAll(".robot");
const niveauxAutorises = ["easy", "normal", "hard"];
export const lireDifficulte = () => {
  const valeurEnregistree = sessionStorage.getItem("settings");
  let difficulte = "normal";
  let valeurValide = false;

  if (valeurEnregistree !== null) {
    try {
      const settings = JSON.parse(valeurEnregistree);
      if (
        settings !== null &&
        typeof settings === "object" &&
        niveauxAutorises.includes(settings.difficulte)
      ) {
        difficulte = settings.difficulte;
        valeurValide = true;
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
  }

  if (!valeurValide) {
    sessionStorage.setItem("settings", JSON.stringify({ difficulte }));
  }

  return difficulte;
};

let difficulte = lireDifficulte();

if (jouer) {
  jouer.addEventListener("click", () => {
    window.location.replace("jeux.html");
  });
}

window.addEventListener("pagehide", lireDifficulte);

const mettreAJourSelection = () => {
  robots.forEach((robot) => {
    robot.classList.toggle(
      "selected",
      robot.getAttribute("data-difficulty") === difficulte,
    );
  });
};

let valeurSettings = sessionStorage.getItem("settings");
const verifierDifficulte = () => {
  const valeurActuelle = sessionStorage.getItem("settings");
  if (valeurActuelle === valeurSettings) return;

  difficulte = lireDifficulte();
  valeurSettings = sessionStorage.getItem("settings");
  mettreAJourSelection();
};

window.setInterval(verifierDifficulte, 100);
window.addEventListener("focus", verifierDifficulte);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") verifierDifficulte();
});

if (robots.length > 0) {
  robots.forEach((robot) => {
    const difficulteRobot = robot.getAttribute("data-difficulty");

    robot.classList.toggle("selected", difficulteRobot === difficulte);

    robot.addEventListener("click", () => {
      if (
        difficulteRobot === null ||
        !niveauxAutorises.includes(difficulteRobot)
      ) {
        return;
      }

      robots.forEach((r) => r.classList.remove("selected"));

      robot.classList.add("selected");

      difficulte = difficulteRobot;
      sessionStorage.setItem("settings", JSON.stringify({ difficulte }));
      valeurSettings = sessionStorage.getItem("settings");
    });
  });
}
