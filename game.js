import * as THREE from "three";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

const TABLE_Y = 0.92;
const TABLE_Z = -0.72;
const GRAB_RADIUS = 0.24;
const SNAP_XZ = 0.28;
const MAGNET_XZ = 0.26;
const SNAP_Y_MIN = -0.7;
const SNAP_Y_MAX = 1.0;
const BIOME_CAP = 5;
const RESIDENT_SCALE = 0.36;
const RESIDENT_RADIUS = 0.1;

const SPAWN_SLOTS = [
  new THREE.Vector3(-0.18, TABLE_Y + 0.12, TABLE_Z + 0.18),
  new THREE.Vector3(0.18, TABLE_Y + 0.12, TABLE_Z + 0.18),
  new THREE.Vector3(0.0, TABLE_Y + 0.12, TABLE_Z + 0.26),
];

const CREATURES = [
  {
    id: "penguin",
    biome: "arctic",
    title: "Penguin",
    correct: ["Belly slide initiated.", "Penguin rates this ice: 5 stars.", "Formal wear. Formal ice."],
    wrong: ["I am wearing a tuxedo. This is not ice.", "The penguin begins fanning itself with a flipper."],
  },
  {
    id: "bear",
    biome: "arctic",
    title: "Polar bear",
    correct: ["Bear becomes a very large marshmallow.", "Ice: occupied."],
    wrong: ["The bear sits anyway and looks disappointed in you.", "Too warm. Bear is melting a tiny sad puddle."],
  },
  {
    id: "camel",
    biome: "desert",
    title: "Camel",
    correct: ["Camel parks. Humps: two. Complaints: zero.", "Desert taxi is in service."],
    wrong: ["Camel tries to drink the furniture.", "This is not sand. Camel files a review."],
  },
  {
    id: "cactus",
    biome: "desert",
    title: "Cactus",
    correct: ["Cactus puts on tiny sunglasses.", "Spiky roommate: home."],
    wrong: ["Cactus sprouts one extra spike out of spite.", "I do not photosynthesize in soup."],
  },
  {
    id: "owl",
    biome: "forest",
    title: "Owl",
    correct: ["Owl clocks in for the night shift.", "Sleep mask deployed."],
    wrong: ["Owl honks a tiny alarm clock at you.", "Wrong office. Hoot."],
  },
  {
    id: "frog",
    biome: "forest",
    title: "Frog",
    correct: ["Frog grabs a reed microphone.", "It is karaoke o'clock."],
    wrong: ["Frog puts on a rain hat and stares.", "No pond. No vibe."],
  },
  {
    id: "fox",
    biome: "forest",
    title: "Fox",
    correct: ["Fox vanishes into the ferns, dramatically.", "Forest gossips increase by one."],
    wrong: ["Too much sky. Not enough trees.", "Fox would like a refund."],
  },
  {
    id: "seal",
    biome: "arctic",
    title: "Seal",
    correct: ["Seal applauds with flippers.", "Snoot: refrigerated."],
    wrong: ["This is not a slip-and-slide.", "Seal looks for a colder couch."],
  },
  {
    id: "lizard",
    biome: "desert",
    title: "Lizard",
    correct: ["Lizard claims the warm rock.", "Sunbathing professional."],
    wrong: ["Too soggy. Scales dislike this.", "Lizard files a heat complaint."],
  },
  {
    id: "turtle",
    biome: "ocean",
    title: "Turtle",
    correct: ["Turtle is in no hurry. This water is fine.", "Shell: seaworthy."],
    wrong: ["The turtle politely declines dry land.", "This is not the current."],
  },
  {
    id: "banana",
    biome: "junk",
    title: "Banana",
    junk: true,
    correct: ["Snack drawer. Correct-ish.", "Banana is not a mammal. Table knew that."],
    wrong: ["Wildlife does not accept fruit.", "The biome is not a lunchbox."],
  },
  {
    id: "fish",
    biome: "ocean",
    title: "Fish",
    correct: ["Fish does a little loop-de-loop.", "Water accepted."],
    wrong: ["Fish makes a dry, judgmental face.", "I require soup. The good kind. Ocean."],
  },
  {
    id: "crab",
    biome: "ocean",
    title: "Crab",
    correct: ["Crab punches in. Break time is later.", "Sideways forever."],
    wrong: ["Crab sidewalks off the table in protest.", "Union rules: ocean only."],
  },
  {
    id: "sock",
    biome: "junk",
    title: "Lost sock",
    junk: true,
    correct: ["Sock drawer claims another victim.", "The sock is finally with its people."],
    wrong: ["That is laundry, not wildlife.", "The biome politely declines the sock."],
  },
  {
    id: "duck",
    biome: "junk",
    title: "Rubber duck",
    junk: true,
    correct: ["Toy. Drawer. Correct. Table is proud.", "Duck does not pay ocean rent."],
    wrong: ["Cute, but fake. Sock drawer, please.", "Real fish are watching. They know."],
  },
];

const TABLE_LINES = {
  intro: [
    "I am Table. I sort nature. Sometimes poorly.",
    "Creatures incoming. Try not to mail the penguin to the desert.",
  ],
  idle: [
    "I am wood. You are the expert.",
    "The hatch is thinking.",
    "Ecosystem loading... loading... still loading.",
  ],
  fuss: [
    "This one is tapping a foot. Metaphorically.",
    "It keeps looking at its real home.",
    "Someone is becoming a little dramatic.",
  ],
};

const FUNNY_SUB = {
  penguin: "CEO of ice",
  bear: "giant marshmallow",
  seal: "flipper applause",
  camel: "two-hump taxi",
  cactus: "spiky roommate",
  lizard: "professional sunbather",
  owl: "night shift",
  frog: "pond karaoke",
  fox: "forest gossip",
  fish: "requires soup",
  crab: "sideways union",
  turtle: "unhurried",
  sock: "escaped laundry",
  duck: "not a real fish",
  banana: "not a mammal",
};

const state = {
  score: 0,
  combo: 0,
  best: 0,
  wave: 1,
  placed: 0,
  started: false,
  vr: false,
  line: "I am Table. Put things where they live.",
  lineUntil: 0,
  nextSpawn: 1.2,
  awaitingSpawn: true,
  maxLive: 1,
  sessionMin: 0,
  deck: [],
  lastId: "",
};

let renderer, scene, camera, clock;
let tableGroup, hatch;
let scorePlane, scoreCtx, scoreTex;
let pointer = { down: false, x: 0, y: 0 };
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const biomes = [];
const live = [];
const controllers = [];
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const tmp3 = new THREE.Vector3();

const mats = {
  wood: new THREE.MeshStandardMaterial({ color: 0x8b5a3c, roughness: 0.7, metalness: 0.05 }),
  darkWood: new THREE.MeshStandardMaterial({ color: 0x5c3a24, roughness: 0.8 }),
  sand: new THREE.MeshStandardMaterial({ color: 0xe2c48a, roughness: 1 }),
  moss: new THREE.MeshStandardMaterial({ color: 0x3f7a4a, roughness: 0.9 }),
  water: new THREE.MeshStandardMaterial({ color: 0x2aa0c7, roughness: 0.2, metalness: 0.15 }),
  ice: new THREE.MeshStandardMaterial({ color: 0xd7f3ff, roughness: 0.25, metalness: 0.1 }),
  basket: new THREE.MeshStandardMaterial({ color: 0xc4a574, roughness: 0.8 }),
  black: new THREE.MeshStandardMaterial({ color: 0x22242b, roughness: 0.6 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf6f1e8, roughness: 0.55 }),
  orange: new THREE.MeshStandardMaterial({ color: 0xe07a2f, roughness: 0.55 }),
  beige: new THREE.MeshStandardMaterial({ color: 0xd7b07a, roughness: 0.7 }),
  green: new THREE.MeshStandardMaterial({ color: 0x3f9a4a, roughness: 0.6 }),
  darkGreen: new THREE.MeshStandardMaterial({ color: 0x2b6b38, roughness: 0.65 }),
  brown: new THREE.MeshStandardMaterial({ color: 0x6a4330, roughness: 0.7 }),
  rust: new THREE.MeshStandardMaterial({ color: 0xc45a3a, roughness: 0.55 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xf0c44a, roughness: 0.5 }),
  gray: new THREE.MeshStandardMaterial({ color: 0x9aa4ad, roughness: 0.6 }),
  pink: new THREE.MeshStandardMaterial({ color: 0xe7a0b8, roughness: 0.55 }),
  teal: new THREE.MeshStandardMaterial({ color: 0x3aa87a, roughness: 0.55 }),
  navy: new THREE.MeshStandardMaterial({ color: 0x3a4a6a, roughness: 0.55 }),
  cream: new THREE.MeshStandardMaterial({ color: 0xf3e6c8, roughness: 0.6 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xe8c84a, roughness: 0.45 }),
  shell: new THREE.MeshStandardMaterial({ color: 0x5a8f4a, roughness: 0.7 }),
  room: new THREE.MeshStandardMaterial({ color: 0xe8d9b8, roughness: 1 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x6d8a5a, roughness: 1 }),
};

function say(text, seconds = 3.2) {
  state.line = text;
  state.lineUntil = clock.elapsedTime + seconds;
  paintScore();
}

function addShadowless(mesh) {
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

function makeEyes(group, x = 0.018, y = 0.03, z = 0.045, scale = 1) {
  const geo = new THREE.SphereGeometry(0.008 * scale, 10, 8);
  const white = new THREE.Mesh(geo, mats.white);
  const white2 = white.clone();
  white.position.set(-x, y, z);
  white2.position.set(x, y, z);
  const pupilGeo = new THREE.SphereGeometry(0.004 * scale, 8, 8);
  const p1 = new THREE.Mesh(pupilGeo, mats.black);
  const p2 = p1.clone();
  p1.position.set(-x, y, z + 0.006 * scale);
  p2.position.set(x, y, z + 0.006 * scale);
  group.add(white, white2, p1, p2);
}

function paw(mat, x, y, z, sx = 1, sy = 0.45, sz = 1.15) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  return m;
}

function creatureVisual(id) {
  const g = new THREE.Group();
  if (id === "penguin") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 12), mats.black);
    body.scale.set(0.82, 1.2, 0.78);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), mats.white);
    belly.position.set(0, -0.004, 0.03);
    belly.scale.set(0.78, 1.05, 0.48);
    const flip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), mats.black);
    flip.scale.set(0.35, 1.1, 0.7);
    flip.position.set(-0.048, 0.0, 0.01);
    const flip2 = flip.clone();
    flip2.position.x = 0.048;
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.028, 8), mats.orange);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.028, 0.055);
    g.add(body, belly, flip, flip2, beak, paw(mats.orange, -0.018, -0.058, 0.02), paw(mats.orange, 0.018, -0.058, 0.02));
    makeEyes(g, 0.015, 0.034, 0.05, 0.95);
  } else if (id === "bear") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.062, 16, 12), mats.white);
    body.scale.set(1.08, 0.88, 0.92);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), mats.white);
    head.position.set(0, 0.05, 0.038);
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mats.cream);
    snout.position.set(0, 0.042, 0.068);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), mats.black);
    nose.position.set(0, 0.044, 0.082);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 8), mats.white);
    const ear2 = ear.clone();
    ear.position.set(-0.024, 0.078, 0.03);
    ear2.position.set(0.024, 0.078, 0.03);
    g.add(body, head, snout, nose, ear, ear2, paw(mats.cream, -0.03, -0.052, 0.03, 1.2), paw(mats.cream, 0.03, -0.052, 0.03, 1.2));
    makeEyes(g, 0.013, 0.056, 0.07, 0.85);
  } else if (id === "seal") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 12), mats.gray);
    body.scale.set(1.45, 0.72, 0.8);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 10), mats.gray);
    head.position.set(0.055, 0.02, 0.02);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), mats.black);
    nose.position.set(0.078, 0.018, 0.032);
    const flip = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), mats.navy);
    flip.scale.set(1.4, 0.35, 0.7);
    flip.position.set(0.01, -0.02, 0.04);
    const flip2 = flip.clone();
    flip2.position.set(0.01, -0.02, -0.03);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), mats.gray);
    tail.position.set(-0.07, -0.01, 0);
    tail.scale.set(1.2, 0.5, 1.4);
    g.add(body, head, nose, flip, flip2, tail);
    makeEyes(head, 0.01, 0.008, 0.02, 0.75);
  } else if (id === "camel") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 10), mats.beige);
    body.scale.set(1.35, 0.78, 0.78);
    const hump = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), mats.beige);
    hump.position.set(-0.012, 0.048, 0);
    const hump2 = hump.clone();
    hump2.position.set(0.028, 0.044, 0);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.015, 0.072, 8), mats.beige);
    neck.position.set(0.058, 0.032, 0.01);
    neck.rotation.z = -0.55;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), mats.beige);
    head.position.set(0.086, 0.062, 0.02);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.018, 6), mats.beige);
    ear.position.set(0.078, 0.08, 0.016);
    const ear2 = ear.clone();
    ear2.position.set(0.094, 0.08, 0.016);
    g.add(body, hump, hump2, neck, head, ear, ear2);
    g.add(paw(mats.beige, -0.03, -0.048, 0.018), paw(mats.beige, 0.03, -0.048, 0.018), paw(mats.beige, -0.03, -0.048, -0.016), paw(mats.beige, 0.03, -0.048, -0.016));
    makeEyes(head, 0.008, 0.006, 0.016, 0.65);
  } else if (id === "cactus") {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.13, 12), mats.green);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.055, 8), mats.green);
    arm.position.set(0.042, 0.022, 0);
    arm.rotation.z = 1.05;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), mats.green);
    cap.position.set(0.062, 0.042, 0);
    const arm2 = arm.clone();
    arm2.position.set(-0.04, 0.0, 0);
    arm2.rotation.z = -1.12;
    const cap2 = cap.clone();
    cap2.position.set(-0.06, 0.02, 0);
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), mats.pink);
    flower.position.set(0, 0.072, 0);
    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.012, 0.012), mats.black);
    shades.position.set(0, 0.038, 0.03);
    g.add(stem, arm, cap, arm2, cap2, flower, shades);
    makeEyes(g, 0.012, 0.038, 0.032, 0.8);
  } else if (id === "lizard") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 10), mats.teal);
    body.scale.set(1.8, 0.7, 0.85);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), mats.teal);
    head.position.set(0.048, 0.01, 0.01);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.08, 8), mats.darkGreen);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-0.06, 0.0, 0);
    g.add(body, head, tail);
    g.add(paw(mats.teal, 0.02, -0.02, 0.02, 0.9), paw(mats.teal, -0.01, -0.02, 0.02, 0.9), paw(mats.teal, 0.02, -0.02, -0.016, 0.9), paw(mats.teal, -0.01, -0.02, -0.016, 0.9));
    makeEyes(head, 0.008, 0.006, 0.016, 0.7);
  } else if (id === "owl") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 12), mats.brown);
    body.scale.set(0.92, 1.12, 0.86);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mats.cream);
    belly.position.set(0, -0.008, 0.032);
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), mats.brown);
    wing.scale.set(0.45, 1.1, 0.7);
    wing.position.set(-0.042, 0.0, 0.0);
    const wing2 = wing.clone();
    wing2.position.x = 0.042;
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.028, 6), mats.brown);
    const tuft2 = tuft.clone();
    tuft.position.set(-0.02, 0.062, 0.01);
    tuft2.position.set(0.02, 0.062, 0.01);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.016, 6), mats.orange);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.012, 0.052);
    g.add(body, belly, wing, wing2, tuft, tuft2, beak);
    makeEyes(g, 0.016, 0.024, 0.046, 1.2);
  } else if (id === "frog") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.046, 14, 10), mats.green);
    body.scale.set(1.18, 0.72, 1.05);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), mats.green);
    const cheek2 = cheek.clone();
    cheek.position.set(-0.03, 0.03, 0.02);
    cheek2.position.set(0.03, 0.03, 0.02);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), mats.cream);
    belly.position.set(0, -0.008, 0.028);
    belly.scale.set(1.1, 0.7, 0.5);
    g.add(body, cheek, cheek2, belly);
    g.add(paw(mats.green, -0.028, -0.03, 0.028, 1.3, 0.4, 1.4), paw(mats.green, 0.028, -0.03, 0.028, 1.3, 0.4, 1.4));
    makeEyes(g, 0.016, 0.034, 0.042, 1.15);
  } else if (id === "fox") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 10), mats.orange);
    body.scale.set(1.3, 0.78, 0.82);
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), mats.white);
    chest.position.set(0.02, 0.0, 0.028);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), mats.orange);
    head.position.set(0.048, 0.032, 0.02);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.028, 6), mats.orange);
    const ear2 = ear.clone();
    ear.position.set(0.036, 0.058, 0.014);
    ear2.position.set(0.06, 0.058, 0.014);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.016, 6), mats.pink);
    inner.position.set(0.036, 0.054, 0.02);
    const inner2 = inner.clone();
    inner2.position.set(0.06, 0.054, 0.02);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), mats.orange);
    tail.position.set(-0.062, 0.012, -0.01);
    tail.scale.set(1.7, 0.7, 0.7);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), mats.white);
    tip.position.set(-0.088, 0.016, -0.012);
    g.add(body, chest, head, ear, ear2, inner, inner2, tail, tip);
    makeEyes(head, 0.008, 0.006, 0.02, 0.75);
  } else if (id === "fish") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 10), mats.orange);
    body.scale.set(1.45, 0.78, 0.68);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.048, 6), mats.yellow);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-0.062, 0, 0);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.03, 6), mats.yellow);
    fin.position.set(0.0, 0.034, 0);
    const side = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.022, 6), mats.gold);
    side.rotation.z = 0.9;
    side.position.set(0.01, -0.006, 0.028);
    g.add(body, tail, fin, side);
    makeEyes(g, 0.01, 0.012, 0.03, 0.9);
  } else if (id === "crab") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), mats.rust);
    body.scale.set(1.4, 0.55, 1.05);
    const claw = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), mats.rust);
    claw.scale.set(1.3, 0.7, 0.9);
    const claw2 = claw.clone();
    claw.position.set(-0.058, 0.012, 0.022);
    claw2.position.set(0.058, 0.012, 0.022);
    g.add(body, claw, claw2);
    for (const x of [-0.03, 0.0, 0.03]) {
      g.add(paw(mats.rust, x, -0.02, 0.03, 0.6, 0.35, 1.1));
      g.add(paw(mats.rust, x, -0.02, -0.024, 0.6, 0.35, 1.1));
    }
    makeEyes(g, 0.014, 0.03, 0.032, 0.8);
  } else if (id === "turtle") {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 10), mats.shell);
    shell.scale.set(1.15, 0.7, 1.05);
    const plate = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mats.darkGreen);
    plate.position.set(0, 0.018, 0);
    plate.scale.set(1.1, 0.4, 1.0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mats.teal);
    head.position.set(0.055, 0.008, 0.016);
    const flip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), mats.teal);
    flip.scale.set(1.5, 0.35, 0.7);
    const flip2 = flip.clone();
    flip.position.set(0.02, -0.012, 0.04);
    flip2.position.set(0.02, -0.012, -0.03);
    g.add(shell, plate, head, flip, flip2);
    makeEyes(head, 0.007, 0.004, 0.012, 0.6);
  } else if (id === "sock") {
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.022, 12), mats.white);
    cuff.position.set(-0.02, 0.04, 0);
    cuff.rotation.z = 0.35;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.08, 12), mats.pink);
    tube.rotation.z = 0.35;
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.023, 0.018, 12), mats.yellow);
    stripe.position.set(-0.006, 0.012, 0);
    stripe.rotation.z = 0.35;
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), mats.pink);
    foot.position.set(0.032, -0.038, 0.008);
    foot.scale.set(1.35, 0.58, 0.92);
    g.add(cuff, tube, stripe, foot);
    makeEyes(g, 0.01, 0.018, 0.03, 0.75);
  } else if (id === "duck") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.044, 12, 10), mats.yellow);
    body.scale.set(1.2, 0.82, 0.92);
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), mats.gold);
    wing.scale.set(0.7, 0.45, 1.1);
    wing.position.set(-0.01, 0.006, 0.038);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), mats.yellow);
    head.position.set(0.032, 0.038, 0.018);
    const beak = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.01, 0.016), mats.orange);
    beak.position.set(0.05, 0.03, 0.03);
    g.add(body, wing, head, beak, paw(mats.orange, -0.012, -0.036, 0.016), paw(mats.orange, 0.016, -0.036, 0.016));
    makeEyes(g, 0.01, 0.046, 0.04, 0.8);
  } else if (id === "banana") {
    const fruit = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 0.11, 12), mats.gold);
    fruit.rotation.z = 0.55;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mats.gold);
    tip.position.set(0.04, -0.038, 0);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.024, 8), mats.brown);
    stem.position.set(-0.038, 0.052, 0);
    stem.rotation.z = 0.4;
    g.add(fruit, tip, stem);
    makeEyes(g, 0.01, 0.01, 0.02, 0.7);
  }
  g.traverse((n) => {
    if (n.isMesh) addShadowless(n);
  });
  return g;
}

function drawDoodle(ctx, id) {
  ctx.save();
  ctx.translate(128, 116);
  if (id === "penguin") {
    ctx.fillStyle = "#22242b";
    ctx.beginPath();
    ctx.ellipse(0, 10, 36, 52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(0, 18, 22, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e07a2f";
    ctx.fillRect(-8, -8, 16, 8);
  } else if (id === "bear") {
    ctx.fillStyle = "#f6f1e8";
    ctx.beginPath();
    ctx.arc(0, 8, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-32, -28, 14, 0, Math.PI * 2);
    ctx.arc(32, -28, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.fillRect(-6, 10, 12, 8);
  } else if (id === "seal") {
    ctx.fillStyle = "#9aa4ad";
    ctx.beginPath();
    ctx.ellipse(0, 8, 58, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(40, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(48, 2, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "camel") {
    ctx.fillStyle = "#d7b07a";
    ctx.fillRect(-40, 0, 70, 28);
    ctx.beginPath();
    ctx.arc(-10, -8, 16, 0, Math.PI * 2);
    ctx.arc(16, -6, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(30, -20, 12, 30);
  } else if (id === "cactus") {
    ctx.fillStyle = "#3f9a4a";
    ctx.fillRect(-10, -40, 20, 80);
    ctx.fillRect(10, -10, 28, 12);
    ctx.fillRect(-38, 8, 28, 12);
    ctx.fillStyle = "#e7a0b8";
    ctx.beginPath();
    ctx.arc(0, -44, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "lizard") {
    ctx.fillStyle = "#3aa87a";
    ctx.beginPath();
    ctx.ellipse(0, 8, 50, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(40, 0, 18, 12);
    ctx.strokeStyle = "#2b6b38";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-50, 8);
    ctx.quadraticCurveTo(-70, 30, -40, 24);
    ctx.stroke();
  } else if (id === "owl") {
    ctx.fillStyle = "#6a4330";
    ctx.beginPath();
    ctx.arc(0, 8, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f3e6c8";
    ctx.beginPath();
    ctx.arc(-14, 0, 14, 0, Math.PI * 2);
    ctx.arc(14, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(-14, 0, 6, 0, Math.PI * 2);
    ctx.arc(14, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "frog") {
    ctx.fillStyle = "#3f9a4a";
    ctx.beginPath();
    ctx.ellipse(0, 16, 46, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-20, -8, 14, 0, Math.PI * 2);
    ctx.arc(20, -8, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-20, -8, 8, 0, Math.PI * 2);
    ctx.arc(20, -8, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "fox") {
    ctx.fillStyle = "#e07a2f";
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(-40, -20);
    ctx.lineTo(0, -8);
    ctx.lineTo(40, -20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 16, 12, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "fish") {
    ctx.fillStyle = "#e07a2f";
    ctx.beginPath();
    ctx.ellipse(4, 8, 42, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0c44a";
    ctx.beginPath();
    ctx.moveTo(-40, 8);
    ctx.lineTo(-68, -16);
    ctx.lineTo(-68, 32);
    ctx.closePath();
    ctx.fill();
  } else if (id === "crab") {
    ctx.fillStyle = "#c45a3a";
    ctx.beginPath();
    ctx.ellipse(0, 8, 40, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c45a3a";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(-48, 0, 14, Math.PI * 0.2, Math.PI * 1.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(48, 0, 14, -Math.PI * 0.4, Math.PI * 0.8);
    ctx.stroke();
  } else if (id === "turtle") {
    ctx.fillStyle = "#5a8f4a";
    ctx.beginPath();
    ctx.ellipse(0, 8, 48, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3aa87a";
    ctx.beginPath();
    ctx.arc(44, 8, 12, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "sock") {
    ctx.fillStyle = "#e7a0b8";
    ctx.fillRect(-16, -40, 28, 70);
    ctx.beginPath();
    ctx.ellipse(16, 28, 28, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(-16, -40, 28, 12);
  } else if (id === "duck") {
    ctx.fillStyle = "#f0c44a";
    ctx.beginPath();
    ctx.ellipse(-6, 16, 36, 22, 0, 0, Math.PI * 2);
    ctx.arc(20, -8, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e07a2f";
    ctx.fillRect(28, -12, 22, 10);
  } else if (id === "banana") {
    ctx.strokeStyle = "#e8c84a";
    ctx.lineWidth = 22;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 8, 40, 0.3, 2.4);
    ctx.stroke();
    ctx.fillStyle = "#6a4330";
    ctx.fillRect(-8, -40, 10, 16);
  } else {
    ctx.fillStyle = "#4e8a6c";
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(-10, 0, 4, 0, Math.PI * 2);
  ctx.arc(10, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function makeFunnyCard(def) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 320;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#f4efe4";
  ctx.fillRect(0, 0, 256, 320);
  ctx.fillStyle = "#fff8ee";
  ctx.fillRect(14, 14, 228, 198);
  ctx.strokeStyle = "#d7c4a2";
  ctx.strokeRect(14, 14, 228, 198);
  drawDoodle(ctx, def.id);
  ctx.fillStyle = "#1b2a24";
  ctx.font = "700 26px Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(def.title.toUpperCase(), 128, 246);
  ctx.fillStyle = "#5a6b4a";
  ctx.font = "600 16px Trebuchet MS, sans-serif";
  ctx.fillText(FUNNY_SUB[def.id] || "Table's guest", 128, 274);
  const tex = new THREE.CanvasTexture(c);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.15, 0.188),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  mesh.position.set(0, 0.17, 0.02);
  mesh.userData.isCard = true;
  return mesh;
}

function makeLabel(title, color) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = color;
  ctx.roundRect(0, 0, 256, 64, 18);
  ctx.fill();
  ctx.fillStyle = "#1b2a24";
  ctx.font = "700 32px Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, 128, 34);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.07), mat);
  mesh.position.y = 0.13;
  mesh.position.z = 0.12;
  return mesh;
}

function makeBiome(id, title, x, colorMat, accentFn) {
  const g = new THREE.Group();
  g.position.set(x, TABLE_Y + 0.02, TABLE_Z - 0.02);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.05, 20), colorMat);
  g.add(addShadowless(bowl));
  if (accentFn) accentFn(g);
  g.add(makeLabel(title, "#f4efe4"));
  g.userData = { id, highlight: 0, residents: [] };
  biomes.push(g);
  tableGroup.add(g);
  return g;
}

function buildRoom() {
  const room = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  room.add(addShadowless(floor));

  const back = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.4), mats.room);
  back.position.set(0, 1.2, -1.7);
  room.add(addShadowless(back));

  const window = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x9fd7ef, emissive: 0x24445a, emissiveIntensity: 0.2 })
  );
  window.position.set(0, 1.45, -1.68);
  room.add(addShadowless(window));

  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.12, 12), mats.rust);
  pot.position.set(1.1, 0.16, -1.2);
  const plant = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mats.darkGreen);
  plant.position.set(1.1, 0.34, -1.2);
  room.add(addShadowless(pot), addShadowless(plant));
  scene.add(room);
}

function buildTable() {
  tableGroup = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.07, 0.62), mats.wood);
  top.position.set(0, TABLE_Y, TABLE_Z);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.08, 0.58), mats.darkWood);
  apron.position.set(0, TABLE_Y - 0.07, TABLE_Z);
  tableGroup.add(addShadowless(top), addShadowless(apron));
  for (const x of [-0.58, 0.58]) {
    for (const z of [-0.22, 0.22]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, TABLE_Y - 0.04, 0.07), mats.darkWood);
      leg.position.set(x, (TABLE_Y - 0.04) / 2, TABLE_Z + z);
      tableGroup.add(addShadowless(leg));
    }
  }

  hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 20), mats.darkWood);
  hatch.position.set(0, TABLE_Y + 0.036, TABLE_Z + 0.18);
  tableGroup.add(addShadowless(hatch));

  makeBiome("desert", "DESERT", -0.48, mats.sand, (g) => {
    const dune = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mats.sand);
    dune.position.set(0.03, 0.03, -0.02);
    dune.scale.set(1.4, 0.5, 1);
    g.add(addShadowless(dune));
  });
  makeBiome("forest", "FOREST", -0.16, mats.moss, (g) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.08, 8), mats.brown);
    trunk.position.set(-0.03, 0.06, -0.02);
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), mats.darkGreen);
    leaves.position.set(-0.03, 0.1, -0.02);
    g.add(addShadowless(trunk), addShadowless(leaves));
  });
  makeBiome("ocean", "OCEAN", 0.16, mats.water, (g) => {
    const wave = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16), mats.ice);
    wave.rotation.x = Math.PI / 2;
    wave.position.y = 0.03;
    g.add(addShadowless(wave));
  });
  makeBiome("arctic", "ARCTIC", 0.48, mats.ice, (g) => {
    const berg = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 5), mats.white);
    berg.position.set(0.02, 0.055, -0.02);
    g.add(addShadowless(berg));
  });

  const junk = new THREE.Group();
  junk.position.set(0.0, TABLE_Y - 0.16, TABLE_Z + 0.38);
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.12, 16, 1, true), mats.basket);
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), mats.basket);
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = -0.06;
  junk.add(addShadowless(basket), addShadowless(bottom), makeLabel("SOCKS", "#f4d35e"));
  junk.children[2].position.set(0, 0.1, 0.12);
  junk.userData = { id: "junk", highlight: 0, residents: [] };
  biomes.push(junk);
  tableGroup.add(junk);

  scene.add(tableGroup);
}

function paintScore() {
  if (!scoreCtx) return;
  const { width, height } = scoreCtx.canvas;
  scoreCtx.clearRect(0, 0, width, height);
  scoreCtx.fillStyle = "rgba(27, 42, 36, 0.82)";
  roundRect(scoreCtx, 0, 0, width, height, 28);
  scoreCtx.fill();
  scoreCtx.fillStyle = "#f4d35e";
  scoreCtx.font = "700 36px Trebuchet MS, sans-serif";
  scoreCtx.fillText(`Score  ${state.score}`, 36, 52);
  scoreCtx.fillStyle = "#f4efe4";
  scoreCtx.font = "600 26px Trebuchet MS, sans-serif";
  scoreCtx.fillText(`Combo  x${Math.max(1, state.combo)}    Wave ${state.wave}`, 36, 92);
  scoreCtx.fillStyle = "#cfe7d8";
  scoreCtx.font = "500 24px Trebuchet MS, sans-serif";
  wrapText(scoreCtx, `Table: ${state.line}`, 36, 140, width - 72, 30);
  scoreTex.needsUpdate = true;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(line, x, yy);
      line = word + " ";
      yy += lineH;
    } else line = test;
  }
  ctx.fillText(line, x, yy);
}

function buildScoreboard() {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 256;
  scoreCtx = canvas.getContext("2d");
  scoreTex = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.96, 0.32),
    new THREE.MeshBasicMaterial({ map: scoreTex, transparent: true })
  );
  mesh.position.set(0, TABLE_Y + 0.42, TABLE_Z - 0.28);
  mesh.rotation.x = -0.18;
  scorePlane = mesh;
  scene.add(mesh);
  paintScore();
}

function freeSpawnPos() {
  for (const slot of SPAWN_SLOTS) {
    let busy = false;
    for (const c of live) {
      if (!c.parent || c.userData.heldBy || c.userData.done || c.userData.returning) continue;
      if (c.position.distanceTo(slot) < 0.14) busy = true;
    }
    if (!busy) return slot.clone();
  }
  return SPAWN_SLOTS[0].clone();
}

function refillDeck() {
  const bag = CREATURES.slice();
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = bag[i];
    bag[i] = bag[j];
    bag[j] = swap;
  }
  if (state.lastId && bag[0] && bag[0].id === state.lastId) bag.push(bag.shift());
  state.deck = bag;
}

function nextCreatureDef() {
  if (!state.deck.length) refillDeck();
  const def = state.deck.shift();
  state.lastId = def.id;
  return def;
}

function spawnCreature(prefId) {
  const living = live.filter((c) => c.parent && !c.userData.done).length;
  if (living >= state.maxLive) return;

  const def = prefId ? CREATURES.find((c) => c.id === prefId) : nextCreatureDef();
  const visual = creatureVisual(def.id);
  const slot = freeSpawnPos();
  visual.position.copy(slot);
  visual.userData = {
    def,
    heldBy: null,
    bob: Math.random() * Math.PI * 2,
    spawnY: slot.y,
    home: slot.clone(),
    walk: slot.clone(),
    returning: false,
    pop: 0.2,
    ai: "idle",
    aiUntil: 0,
    age: 0,
    fussed: false,
  };
  const card = makeFunnyCard(def);
  visual.add(card);
  visual.userData.card = card;
  scene.add(visual);
  live.push(visual);
  hatch.scale.set(1.15, 1, 1.15);
  say(`${def.title} — ${FUNNY_SUB[def.id] || "new roommate"}.`, 2.4);
}

function nearestCreature(worldPos) {
  let best = null;
  let bestD = GRAB_RADIUS;
  for (const c of live) {
    if (!c.parent || c.userData.heldBy || c.userData.resident || c.userData.done) continue;
    c.getWorldPosition(tmp);
    const d = tmp.distanceTo(worldPos);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function nearBiome(biome, worldPos, radius) {
  biome.getWorldPosition(tmp3);
  const xz = Math.hypot(worldPos.x - tmp3.x, worldPos.z - tmp3.z);
  const dy = worldPos.y - tmp3.y;
  const extra = biome.userData.id === "junk" ? 0.12 : 0;
  return xz <= radius + extra && dy >= SNAP_Y_MIN && dy <= SNAP_Y_MAX;
}

function biomeAt(worldPos, radius = SNAP_XZ) {
  let best = null;
  let bestD = radius;
  for (const b of biomes) {
    b.getWorldPosition(tmp);
    const xz = Math.hypot(worldPos.x - tmp.x, worldPos.z - tmp.z);
    const dy = worldPos.y - tmp.y;
    const extra = b.userData.id === "junk" ? 0.12 : 0;
    if (xz <= bestD + extra && dy >= SNAP_Y_MIN && dy <= SNAP_Y_MAX) {
      bestD = xz;
      best = b;
    }
  }
  return best;
}

function sampleHoldPoints(creature, hand) {
  const points = [];
  creature.getWorldPosition(tmp);
  points.push(tmp.clone());
  if (hand && hand !== camera) {
    hand.getWorldPosition(tmp2);
    points.push(tmp2.clone());
    points.push(new THREE.Vector3(tmp2.x, tmp2.y - 0.18, tmp2.z));
    points.push(new THREE.Vector3(tmp2.x, TABLE_Y + 0.08, tmp2.z));
    const grip = hand.userData.grip;
    if (grip) {
      grip.getWorldPosition(tmp2);
      points.push(tmp2.clone());
    }
  }
  return points;
}

function tryStickCorrect(creature, hand) {
  const home = biomeGroup(creature.userData.def.biome);
  if (!home || creature.userData.done) return false;
  const points = sampleHoldPoints(creature, hand);
  for (const p of points) {
    if (nearBiome(home, p, MAGNET_XZ)) {
      if (hand && hand.userData.holding === creature) hand.userData.holding = null;
      resolveDrop(creature, home);
      return true;
    }
  }
  return false;
}

function grab(creature, hand) {
  if (!creature || creature.userData.heldBy || creature.userData.resident || creature.userData.done) return;
  creature.userData.heldBy = hand;
  hand.userData.holding = creature;
  creature.userData.returning = false;
  creature.userData.ai = "held";
  scene.attach(creature);
  if (hand === camera) {
    creature.scale.setScalar(1.08);
    return;
  }
  const grip = hand.userData.grip || hand;
  grip.attach(creature);
  creature.position.set(0, 0, -0.04);
  creature.scale.setScalar(1.08);
}

function release(hand) {
  const creature = hand.userData.holding;
  if (!creature) return;
  hand.userData.holding = null;
  creature.userData.heldBy = null;
  scene.attach(creature);
  creature.scale.setScalar(1);
  if (tryStickCorrect(creature, hand)) return;
  const points = sampleHoldPoints(creature, hand);
  let zone = null;
  for (const p of points) {
    zone = biomeAt(p, SNAP_XZ);
    if (zone) break;
  }
  if (zone) resolveDrop(creature, zone);
  else {
    say("Closer — hover over its real bowl.", 2.4);
    bounceHome(creature);
  }
}

function pickLine(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function resolveDrop(creature, zone) {
  if (!creature || creature.userData.done || !zone) return;
  const def = creature.userData.def;
  const ok = zone.userData.id === def.biome;
  if (ok) {
    state.combo = Math.min(12, state.combo + 1);
    const pts = (def.junk ? 15 : 10) * state.combo;
    state.score += pts;
    state.placed += 1;
    state.best = Math.max(state.best, state.combo);
    if (state.placed % 5 === 0) state.wave += 1;
    say(pickLine(def.correct) + `  +${pts}`, 3);
    settleInBiome(creature, zone);
    ding(true);
  } else {
    state.combo = 0;
    say(pickLine(def.wrong || ["Nope. Try another home."]), 3.2);
    bounceHome(creature);
    ding(false);
  }
  paintScore();
}

function evictResident(creature) {
  if (!creature) return;
  if (creature.parent) creature.removeFromParent();
  const i = live.indexOf(creature);
  if (i >= 0) live.splice(i, 1);
}

function settleInBiome(creature, zone) {
  if (!zone.userData.residents) zone.userData.residents = [];
  while (zone.userData.residents.length >= BIOME_CAP) {
    evictResident(zone.userData.residents.shift());
  }
  creature.userData.heldBy = "done";
  creature.userData.ai = "resident";
  creature.userData.done = true;
  creature.userData.resident = true;
  creature.userData.homeRadius = zone.userData.id === "junk" ? 0.11 : RESIDENT_RADIUS;
  creature.userData.walk.set((Math.random() - 0.5) * 0.12, 0.05, (Math.random() - 0.5) * 0.1);
  zone.attach(creature);
  creature.position.set((Math.random() - 0.5) * 0.1, 0.055, (Math.random() - 0.5) * 0.08);
  creature.scale.setScalar(RESIDENT_SCALE);
  if (creature.userData.card) creature.userData.card.visible = false;
  zone.userData.residents.push(creature);
  state.awaitingSpawn = true;
  state.nextSpawn = clock.elapsedTime + 1.15;
}

function bounceHome(creature) {
  creature.userData.returning = true;
  creature.userData.ai = "return";
  creature.userData.heldBy = null;
  creature.userData.home = freeSpawnPos();
  creature.userData.walk = creature.userData.home.clone();
  creature.userData.spawnY = creature.userData.home.y;
  scene.attach(creature);
}

function biomeGroup(id) {
  return biomes.find((b) => b.userData.id === id);
}

function clampTable(pos) {
  pos.x = Math.max(-0.46, Math.min(0.46, pos.x));
  pos.z = Math.max(TABLE_Z + 0.08, Math.min(TABLE_Z + 0.3, pos.z));
  pos.y = TABLE_Y + 0.12;
  return pos;
}

function audioCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ding.ctx) ding.ctx = new AC();
  if (ding.ctx.state === "suspended") ding.ctx.resume();
  return ding.ctx;
}

function startTune() {
  if (startTune.on) return;
  const ctx = audioCtx();
  if (!ctx) return;
  startTune.on = true;

  const master = ctx.createGain();
  master.gain.value = 0.035;
  master.connect(ctx.destination);

  const pad = ctx.createOscillator();
  pad.type = "sine";
  pad.frequency.value = 196;
  const padGain = ctx.createGain();
  padGain.gain.value = 0.12;
  pad.connect(padGain);
  padGain.connect(master);
  pad.start();

  const scale = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
  const melody = [0, 2, 4, 2, 3, 2, 0, 2, 4, 5, 4, 2, 1, 2, 0, 2];
  let step = 0;

  function pluck(freq, when, life) {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.28, when + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, when + life);
    o.connect(g);
    g.connect(master);
    o.start(when);
    o.stop(when + life + 0.02);
  }

  function bar() {
    if (!startTune.on) return;
    const now = ctx.currentTime;
    const note = scale[melody[step % melody.length]];
    pluck(note, now, 0.62);
    if (step % 8 === 0) pluck(246.94, now, 0.95);
    if (step % 16 === 8) pluck(329.63, now + 0.2, 0.5);
    step += 1;
    startTune.timer = window.setTimeout(bar, 430);
  }
  bar();
}

function ding(good) {
  const ctx = audioCtx();
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = good ? 660 : 220;
  g.gain.value = 0.04;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  o.frequency.exponentialRampToValueAtTime(good ? 880 : 140, ctx.currentTime + 0.12);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
  o.stop(ctx.currentTime + 0.18);
}

function setupControllers() {
  const factory = new XRControllerModelFactory();
  for (let i = 0; i < 2; i += 1) {
    const controller = renderer.xr.getController(i);
    controller.addEventListener("selectstart", () => grab(nearestFromHand(controller), controller));
    controller.addEventListener("selectend", () => release(controller));
    controller.addEventListener("squeezestart", () => grab(nearestFromHand(controller), controller));
    controller.addEventListener("squeezeend", () => release(controller));
    scene.add(controller);

    const grip = renderer.xr.getControllerGrip(i);
    grip.add(factory.createControllerModel(grip));
    controller.userData.grip = grip;
    scene.add(grip);

    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xf4d35e })
    );
    marker.position.z = -0.04;
    controller.add(marker);
    controllers.push(controller);
  }

  for (let i = 0; i < 2; i += 1) {
    const hand = renderer.xr.getHand(i);
    scene.add(hand);
    const index = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xf4efe4 })
    );
    hand.userData.pinchDot = index;
    hand.add(index);
    controllers.push(hand);
  }
}

function nearestFromHand(hand) {
  hand.getWorldPosition(tmp2);
  return nearestCreature(tmp2);
}

function updateHands() {
  for (const hand of controllers) {
    if (!hand.joints) continue;
    const tip = hand.joints["index-finger-tip"];
    const thumb = hand.joints["thumb-tip"];
    if (tip && hand.userData.pinchDot) {
      tip.getWorldPosition(tmp);
      hand.worldToLocal(tmp);
      hand.userData.pinchDot.position.copy(tmp);
    }
    if (!tip || !thumb) continue;
    tip.getWorldPosition(tmp);
    thumb.getWorldPosition(tmp2);
    const pinching = tmp.distanceTo(tmp2) < 0.022;
    if (pinching && !hand.userData.holding && !hand.userData.pinched) {
      grab(nearestCreature(tmp), hand);
    }
    if (!pinching && hand.userData.pinched) {
      release(hand);
    }
    hand.userData.pinched = pinching;
  }
}

function highlightBiomes() {
  const holders = controllers.concat(camera);
  for (const b of biomes) {
    const holding = holders.some((c) => c.userData.holding);
    let target = 1;
    if (holding) {
      const held = holders.find((c) => c.userData.holding)?.userData.holding;
      if (held) {
        const home = biomeGroup(held.userData.def.biome);
        held.getWorldPosition(tmp);
        const overCorrect = home === b && nearBiome(b, tmp, MAGNET_XZ + 0.08);
        const near = biomeAt(tmp, SNAP_XZ) === b;
        target = overCorrect ? 1.16 : near ? 1.08 : 0.96;
      }
    }
    b.scale.lerp(new THREE.Vector3(target, target, target), 0.15);
  }
}

function updateCreatures(dt, t) {
  hatch.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
  for (const c of live) {
    if (!c.parent) continue;
    const data = c.userData;
    data.bob += dt * 2.2;

    if (data.card && data.card.visible && camera) {
      camera.getWorldPosition(tmp);
      data.card.lookAt(tmp);
    }

    if (data.resident) {
      const capR = data.homeRadius || RESIDENT_RADIUS;
      if (t > data.aiUntil) {
        data.walk.set((Math.random() - 0.5) * capR * 1.6, 0.05, (Math.random() - 0.5) * capR * 1.4);
        data.aiUntil = t + 1.4 + Math.random();
      }
      c.position.x += (data.walk.x - c.position.x) * dt * 1.4;
      c.position.z += (data.walk.z - c.position.z) * dt * 1.4;
      const dist = Math.hypot(c.position.x, c.position.z);
      if (dist > capR) {
        c.position.x *= capR / dist;
        c.position.z *= capR / dist;
      }
      c.position.y = 0.05 + Math.sin(data.bob * 1.6) * 0.006;
      c.rotation.y += dt * 0.9;
      continue;
    }

    if (data.done) {
      c.rotation.y += dt * 3.2;
      c.position.y = 0.07 + Math.sin(data.bob * 2) * 0.02;
      continue;
    }

    if (data.pop > 0) {
      data.pop -= dt;
      const s = 1 + Math.sin((0.2 - data.pop) * 18) * 0.08;
      if (!data.heldBy) c.scale.setScalar(s);
    }

    if (data.heldBy && data.heldBy !== "done") continue;

    if (data.returning) {
      tmp.copy(data.home || SPAWN_SLOTS[0]);
      c.position.lerp(tmp, 0.14);
      c.rotation.y += dt * 4;
      if (c.position.distanceTo(tmp) < 0.03) {
        data.returning = false;
        data.ai = "idle";
        data.aiUntil = t + 1.2;
        c.position.copy(tmp);
      }
      continue;
    }

    data.age += dt;
    const id = data.def.id;
    const speed = id === "crab" || id === "fox" || id === "fish" || id === "lizard" ? 0.16 : id === "bear" || id === "cactus" || id === "camel" || id === "turtle" || id === "banana" ? 0.07 : 0.11;

    if (data.age > 7 && !data.fussed) {
      data.fussed = true;
      data.ai = "fuss";
      data.aiUntil = t + 2.5;
      say(pickLine(TABLE_LINES.fuss), 2.6);
    }

    if (t > data.aiUntil) {
      if (data.age > 8) data.ai = "seek";
      else data.ai = Math.random() < 0.55 ? "wander" : "look";
      if (data.ai === "wander") {
        data.walk.set((Math.random() - 0.5) * 0.5, TABLE_Y + 0.12, TABLE_Z + 0.14 + Math.random() * 0.12);
        clampTable(data.walk);
      }
      data.aiUntil = t + 1.6 + Math.random() * 1.4;
    }

    if (data.ai === "look" || data.ai === "seek" || data.ai === "fuss") {
      const home = biomeGroup(data.def.biome);
      if (home) {
        home.getWorldPosition(tmp);
        tmp.y = c.position.y;
        const face = Math.atan2(tmp.x - c.position.x, tmp.z - c.position.z);
        c.rotation.y += (face - c.rotation.y) * Math.min(1, dt * 3);
        if (data.ai === "seek") {
          tmp.y = TABLE_Y + 0.12;
          const rim = c.position.distanceTo(tmp);
          if (rim > 0.24) c.position.lerp(tmp, dt * 0.55);
        }
      }
    }

    if (data.ai === "wander") {
      c.position.x += (data.walk.x - c.position.x) * dt * speed * 8;
      c.position.z += (data.walk.z - c.position.z) * dt * speed * 8;
      const face = Math.atan2(data.walk.x - c.position.x, data.walk.z - c.position.z);
      c.rotation.y += (face - c.rotation.y) * Math.min(1, dt * 4);
    }

    if (data.ai === "fuss") {
      c.rotation.z = Math.sin(t * 10) * 0.18;
    } else {
      c.rotation.z += (0 - c.rotation.z) * dt * 6;
    }

    if (id === "crab") c.position.x += Math.sin(t * 6) * dt * 0.04;
    if (id === "lizard") c.position.x += Math.sin(t * 5) * dt * 0.03;
    if (id === "fish" || id === "seal") c.rotation.x = Math.sin(t * 8) * 0.15;
    else c.rotation.x += (0 - c.rotation.x) * dt * 5;

    const hop = data.ai === "fuss" ? 0.03 : 0.012;
    c.position.y = (data.spawnY || TABLE_Y + 0.12) + Math.sin(data.bob) * hop;
    clampTable(tmp.copy(c.position));
    c.position.x = tmp.x;
    c.position.z = tmp.z;
  }
}

function setupMouse() {
  window.addEventListener("pointerdown", (e) => {
    if (!state.started || state.vr) return;
    pointer.down = true;
    updateMouse(e);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(live, true);
    if (hits.length) {
      let obj = hits[0].object;
      while (obj && !obj.userData.def) obj = obj.parent;
      if (obj) grab(obj, camera);
    }
  });
  window.addEventListener("pointerup", () => {
    if (camera.userData.holding) release(camera);
    pointer.down = false;
  });
  window.addEventListener("pointermove", (e) => {
    if (!state.started) return;
    updateMouse(e);
    if (camera.userData.holding) {
      raycaster.setFromCamera(mouse, camera);
      tmp.copy(raycaster.ray.origin).addScaledVector(raycaster.ray.direction, 0.9);
      camera.userData.holding.position.copy(tmp);
    }
  });
}

function updateMouse(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function setStatus(text, isErr = false) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = text;
  el.className = isErr ? "err" : "";
}

function startGame() {
  if (state.started) return;
  state.started = true;
  document.getElementById("hud").classList.add("hidden");
  say(pickLine(TABLE_LINES.intro), 4);
  startTune();
  state.awaitingSpawn = true;
  state.nextSpawn = clock.elapsedTime + 0.7;
  refillDeck();
}

async function enterVR() {
  const btn = document.getElementById("vr-btn");
  if (!navigator.xr) {
    setStatus("No WebXR here. Open this exact Pages URL in Quest Browser, not on github.com.", true);
    return;
  }
  try {
    const supported = await navigator.xr.isSessionSupported("immersive-vr");
    if (!supported) {
      setStatus("This browser cannot start immersive VR.", true);
      return;
    }
    btn.disabled = true;
    setStatus("Starting VR…");
    const session = await navigator.xr.requestSession("immersive-vr", {
      optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
    });
    try {
      renderer.xr.setReferenceSpaceType("local-floor");
      await renderer.xr.setSession(session);
    } catch (err) {
      renderer.xr.setReferenceSpaceType("local");
      await renderer.xr.setSession(session);
    }
  } catch (err) {
    btn.disabled = false;
    setStatus("VR did not start: " + (err && err.message ? err.message : err), true);
  }
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87c5d6);
  scene.fog = new THREE.Fog(0x87c5d6, 4, 8);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 30);
  camera.position.set(0, 1.46, 0.35);
  camera.lookAt(0, TABLE_Y + 0.05, TABLE_Z);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  renderer.xr.addEventListener("sessionstart", () => {
    state.vr = true;
    startGame();
    camera.position.set(0, 1.6, 0);
  });
  renderer.xr.addEventListener("sessionend", () => {
    state.vr = false;
    camera.position.set(0, 1.46, 0.35);
    camera.lookAt(0, TABLE_Y + 0.05, TABLE_Z);
  });

  scene.add(new THREE.HemisphereLight(0xfff2d8, 0x3d5a46, 1.1));
  const sun = new THREE.DirectionalLight(0xfff4d2, 0.85);
  sun.position.set(-2, 4, 2);
  scene.add(sun);

  buildRoom();
  buildTable();
  buildScoreboard();
  setupControllers();
  setupMouse();

  clock = new THREE.Clock();
  const startBtn = document.getElementById("start-btn");
  const vrBtn = document.getElementById("vr-btn");
  startBtn.disabled = false;
  startBtn.addEventListener("click", startGame);
  vrBtn.disabled = false;
  vrBtn.addEventListener("click", enterVR);
  if (navigator.xr) {
    navigator.xr.isSessionSupported("immersive-vr").then((ok) => {
      setStatus(ok ? "Ready. Tap Enter VR." : "Page loaded, but this browser has no immersive VR.");
    }).catch(() => setStatus("Ready. Tap Enter VR."));
  } else {
    setStatus("Ready on a screen. For the headset, open this page in Quest Browser.");
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  renderer.setAnimationLoop(tick);
}

function tick() {
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;

  if (state.started) {
    const active = live.some((c) => c.parent && !c.userData.done);
    if (state.awaitingSpawn && !active && t >= state.nextSpawn) {
      spawnCreature();
      state.awaitingSpawn = false;
    }
    if (t > state.lineUntil && Math.floor(t) % 11 === 0) {
      say(pickLine(TABLE_LINES.idle), 3);
    }
    if (t > 12 * 60 && t < 12 * 60 + 1) {
      say("Table recommends a stretch. Brains also need biomes.", 5);
    }
    updateHands();
    updateCreatures(dt, t);
    highlightBiomes();
  }

  renderer.render(scene, camera);
}

try {
  init();
} catch (err) {
  const el = document.getElementById("status");
  if (el) {
    el.className = "err";
    el.textContent = "Could not start the table: " + (err && err.message ? err.message : err);
  }
}
