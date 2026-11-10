/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PerformanceSettings, TelemetryData, LivingNpc } from '../types/game';
import { INITIAL_CITIZENS } from '../data/civilization';
import { soundEngine } from '../systems/audio';

// Fast procedural noise approximation for terrain height
export function getTerrainHeight(x: number, z: number): number {
  // Central Citadel plateau is flattened around (0,0) within 28m
  const distFromCenter = Math.sqrt(x * x + z * z);
  if (distFromCenter < 28) {
    return 0.5;
  }
  const blend = Math.min(1, (distFromCenter - 28) / 15);
  const naturalHeight =
    Math.sin(x * 0.04) * Math.cos(z * 0.04) * 4.5 +
    Math.sin(x * 0.09 + z * 0.07) * 2.2 +
    Math.cos(x * 0.02 - z * 0.03) * 6.0;
  return blend * naturalHeight;
}

export interface TrainingDummy {
  id: string;
  name: string;
  x: number;
  z: number;
  y: number;
  mesh: THREE.Group;
  health: number;
  maxHealth: number;
  wobbleAngle: number;
}

export interface FloatingText {
  id: string;
  text: string;
  color: string;
  pos: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class GameScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private settings: PerformanceSettings;

  // Lighting
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private ambientLight: THREE.AmbientLight;

  // Player & Kinematics
  public playerGroup: THREE.Group;
  private playerTorso!: THREE.Mesh;
  private playerLeftLeg!: THREE.Mesh;
  private playerRightLeg!: THREE.Mesh;
  private playerLeftArm!: THREE.Mesh;
  private playerRightArm!: THREE.Mesh;
  private playerWeapon!: THREE.Group;
  private playerShield!: THREE.Mesh;
  private blockBarrierMesh!: THREE.Mesh;

  public playerPosition = new THREE.Vector3(0, 0.5, 5);
  public playerVelocity = new THREE.Vector3();
  public playerRotation = 0; // Y axis orientation
  public isGrounded = true;
  public isSprinting = false;

  // Combat States
  public isAttacking = false;
  public attackTimer = 0;
  public comboStep = 0; // 0, 1, 2
  public comboResetTimer = 0;

  public isBlocking = false;
  public isDodging = false;
  public dodgeTimer = 0;
  public dodgeCooldownTimer = 0;

  // Special Skills
  public activeSkill: 'none' | 'whirlwind' | 'nova' | 'heal' = 'none';
  public skillTimer = 0;
  private whirlwindMesh!: THREE.Mesh;
  private novaMesh!: THREE.Mesh;
  private healPillarMesh!: THREE.Mesh;

  private walkAnimTime = 0;

  // Camera Orbit
  public cameraDistance = 7.5;
  public cameraPitch = 0.32;
  public cameraYaw = 0;
  private targetCameraPos = new THREE.Vector3();

  // Input states
  public keys: Record<string, boolean> = {};
  public virtualJoystick = { x: 0, y: 0 };

  // World Instancing & Environment
  private treeInstances!: THREE.InstancedMesh;
  private rockInstances!: THREE.InstancedMesh;
  private terrainMesh!: THREE.Mesh;
  private buildingsGroup = new THREE.Group();
  private npcsGroup = new THREE.Group();
  private npcMeshes: Map<string, THREE.Group> = new Map();
  private npcCitizens: LivingNpc[] = [];
  public trainingDummies: TrainingDummy[] = [];

  // Day-Night & Weather
  public dayTime = 0.35; // 0..1
  private dayDurationSec = 360;

  // Particle Pools
  private particlePool: THREE.Mesh[] = [];
  private activeParticles: Array<{ mesh: THREE.Mesh; life: number; maxLife: number; vel: THREE.Vector3 }> = [];

  // Telemetry & Timing
  private clock = new THREE.Clock();
  private lastFpsUpdate = 0;
  private frameCount = 0;
  private currentFps = 60;
  private currentFrameTime = 16.6;

  // Callbacks
  public onTelemetryUpdate?: (data: TelemetryData) => void;
  public onInteractableNpcChange?: (npc: LivingNpc | null) => void;
  public onPlayerAttackHit?: (targetName: string, damage: number, isComboFinisher: boolean) => void;
  public onFloatingDamage?: (text: string, color: string, pos: { x: number; y: number; z: number }) => void;

  private isRunning = true;
  private animFrameId: number | null = null;
  private interactDistance = 3.6;
  public nearestNpc: LivingNpc | null = null;

  constructor(container: HTMLElement, initialSettings: PerformanceSettings) {
    this.container = container;
    this.settings = initialSettings;

    // Detect software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !this.isSoftwareGl && this.settings.preset !== 'batterySaver',
      depth: true,
      stencil: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.applyResolutionAndShadows();

    this.container.appendChild(this.renderer.domElement);

    // 2. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0f172a');
    this.scene.fog = new THREE.FogExp2('#0f172a', 0.012);

    this.camera = new THREE.PerspectiveCamera(
      58,
      container.clientWidth / (container.clientHeight || 1),
      0.2,
      this.settings.viewDistance
    );

    // 3. Studio reflection environment
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {
      // Fallback safe
    }

    // 4. Lighting Rig
    this.hemiLight = new THREE.HemisphereLight('#87ceeb', '#2e1c0c', 0.85);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight('#1e293b', 0.35);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight('#fff4e0', 2.0);
    this.dirLight.position.set(40, 80, 50);
    this.dirLight.castShadow = !this.isSoftwareGl && this.settings.shadowQuality !== 'off';
    if (this.dirLight.castShadow) {
      const shadowMapRes = this.settings.shadowQuality === 'pcfSoft' ? 2048 : 1024;
      this.dirLight.shadow.mapSize.width = shadowMapRes;
      this.dirLight.shadow.mapSize.height = shadowMapRes;
      this.dirLight.shadow.camera.near = 0.5;
      this.dirLight.shadow.camera.far = 250;
      const d = 45;
      this.dirLight.shadow.camera.left = -d;
      this.dirLight.shadow.camera.right = d;
      this.dirLight.shadow.camera.top = d;
      this.dirLight.shadow.camera.bottom = -d;
      this.dirLight.shadow.bias = -0.0004;
      this.dirLight.shadow.normalBias = 0.03;
    }
    this.scene.add(this.dirLight);

    // 5. Build Content
    this.playerGroup = this.createPlayerCharacter();
    this.scene.add(this.playerGroup);

    this.createTerrain();
    this.createCitadelAndStructures();
    this.createInstancedEnvironment();
    this.createLivingNpcs();
    this.createTrainingDummies();
    this.initParticlePool();
    this.initSkillVisuals();

    // 6. Listeners & loop
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    this.setupInputHandlers();

    this.startLoop();
  }

  private applyResolutionAndShadows() {
    const scale = this.isSoftwareGl ? 0.8 : this.settings.resolutionScale;
    const pixelRatio = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.75);
    this.renderer.setPixelRatio(pixelRatio * scale);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    if (this.settings.shadowQuality === 'off' || this.isSoftwareGl) {
      this.renderer.shadowMap.enabled = false;
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type =
        this.settings.shadowQuality === 'pcfSoft'
          ? THREE.PCFSoftShadowMap
          : THREE.PCFShadowMap;
    }
  }

  public updateSettings(newSettings: PerformanceSettings) {
    this.settings = newSettings;
    this.applyResolutionAndShadows();

    if (this.camera) {
      this.camera.far = newSettings.viewDistance;
      this.camera.updateProjectionMatrix();
    }
    if (this.scene.fog && 'density' in this.scene.fog) {
      this.scene.fog.density = 2.5 / newSettings.viewDistance;
    }
  }

  // ==================== PROCEDURAL 3D PLAYER ====================
  private createPlayerCharacter(): THREE.Group {
    const group = new THREE.Group();

    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.25,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
    });
    const clothMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.8,
    });
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1,
    });

    // 1. Torso & Chestplate
    this.playerTorso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.4), armorMat);
    this.playerTorso.position.y = 1.3;
    this.playerTorso.castShadow = true;
    group.add(this.playerTorso);

    // Torso gold chest emblem (Front face at +Z)
    const emblem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 8), goldTrimMat);
    emblem.rotation.x = Math.PI / 2;
    emblem.position.set(0, 0.05, 0.22);
    this.playerTorso.add(emblem);

    // 2. Head & Visored Knight Helm
    const helm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.44), armorMat);
    helm.position.y = 1.95;
    helm.castShadow = true;
    group.add(helm);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.08, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    visor.position.set(0, 0, 0.22);
    helm.add(visor);

    const plume = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.35), goldTrimMat);
    plume.position.set(0, 0.3, -0.05);
    helm.add(plume);

    // 3. Pauldrons / Shoulders
    const leftPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.32), goldTrimMat);
    leftPauldron.position.set(-0.48, 1.6, 0);
    group.add(leftPauldron);

    const rightPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.32), goldTrimMat);
    rightPauldron.position.set(0.48, 1.6, 0);
    group.add(rightPauldron);

    // 4. Arms
    this.playerLeftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.65, 8), clothMat);
    this.playerLeftArm.position.set(-0.48, 1.25, 0);
    this.playerLeftArm.castShadow = true;
    group.add(this.playerLeftArm);

    this.playerRightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.65, 8), clothMat);
    this.playerRightArm.position.set(0.48, 1.25, 0);
    this.playerRightArm.castShadow = true;
    group.add(this.playerRightArm);

    // 5. Shield on Left Arm
    const shieldGeom = new THREE.BoxGeometry(0.42, 0.75, 0.08);
    this.playerShield = new THREE.Mesh(shieldGeom, goldTrimMat);
    this.playerShield.position.set(-0.16, 0, 0.15);
    this.playerShield.castShadow = true;
    this.playerLeftArm.add(this.playerShield);

    // Arcane Block Barrier (Lights up on block)
    this.blockBarrierMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 0.95, 16),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
      })
    );
    this.blockBarrierMesh.position.set(0, 1.3, 0.85);
    this.blockBarrierMesh.visible = false;
    group.add(this.blockBarrierMesh);

    // 6. Legs
    this.playerLeftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.8, 8), armorMat);
    this.playerLeftLeg.position.set(-0.2, 0.5, 0);
    this.playerLeftLeg.castShadow = true;
    group.add(this.playerLeftLeg);

    this.playerRightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.8, 8), armorMat);
    this.playerRightLeg.position.set(0.2, 0.5, 0);
    this.playerRightLeg.castShadow = true;
    group.add(this.playerRightLeg);

    // 7. Cape (At back: -Z)
    const capeGeom = new THREE.PlaneGeometry(0.65, 1.1, 3, 4);
    const capeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      side: THREE.DoubleSide,
      roughness: 0.9,
    });
    const cape = new THREE.Mesh(capeGeom, capeMat);
    cape.position.set(0, 1.15, -0.22);
    cape.rotation.x = 0.1;
    group.add(cape);

    // 8. Weapon (Attached to right arm)
    this.playerWeapon = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.25, 0.04), bladeMat);
    blade.position.y = 0.6;
    blade.castShadow = true;
    this.playerWeapon.add(blade);

    const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.08), goldTrimMat);
    crossguard.position.y = 0.05;
    this.playerWeapon.add(crossguard);

    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8), armorMat);
    hilt.position.y = -0.1;
    this.playerWeapon.add(hilt);

    this.playerWeapon.position.set(0.6, 0.8, 0.25);
    this.playerWeapon.rotation.x = Math.PI / 4;
    group.add(this.playerWeapon);

    // Ground Contact Shadow
    const contactShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.7, 16),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.02;
    group.add(contactShadow);

    return group;
  }

  // ==================== SPECIAL SKILL VISUAL EFFECTS ====================
  private initSkillVisuals() {
    // 1. Whirlwind Slash Ring
    const whirlGeom = new THREE.TorusGeometry(3.2, 0.25, 8, 24);
    const whirlMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    this.whirlwindMesh = new THREE.Mesh(whirlGeom, whirlMat);
    this.whirlwindMesh.rotation.x = Math.PI / 2;
    this.whirlwindMesh.visible = false;
    this.scene.add(this.whirlwindMesh);

    // 2. Arcane Nova Sphere
    const novaGeom = new THREE.SphereGeometry(1.0, 16, 16);
    const novaMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
      wireframe: true,
    });
    this.novaMesh = new THREE.Mesh(novaGeom, novaMat);
    this.novaMesh.visible = false;
    this.scene.add(this.novaMesh);

    // 3. Solar Heal Pillar
    const healGeom = new THREE.CylinderGeometry(1.2, 1.2, 4.5, 12, 1, true);
    const healMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    this.healPillarMesh = new THREE.Mesh(healGeom, healMat);
    this.healPillarMesh.visible = false;
    this.scene.add(this.healPillarMesh);
  }

  // ==================== TRAINING DUMMIES ====================
  private createTrainingDummies() {
    const dummyPositions = [
      { id: 'dummy_1', name: 'Training Target Alpha', x: -6, z: 12 },
      { id: 'dummy_2', name: 'Training Target Beta', x: 6, z: 12 },
      { id: 'dummy_3', name: 'Rogue Quarry Golem', x: 0, z: 22 },
    ];

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
    const targetMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    dummyPositions.forEach((dp) => {
      const dGroup = new THREE.Group();
      const y = getTerrainHeight(dp.x, dp.z);
      dGroup.position.set(dp.x, y, dp.z);

      // Post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.2, 8), woodMat);
      post.position.y = 1.1;
      post.castShadow = true;
      dGroup.add(post);

      // Torso cross
      const cross = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.15), woodMat);
      cross.position.y = 1.6;
      dGroup.add(cross);

      // Straw Body
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 10), strawMat);
      body.position.y = 1.35;
      body.castShadow = true;
      dGroup.add(body);

      // Target Bullseye
      const bullseye = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12), targetMat);
      bullseye.position.set(0, 1.4, 0.36);
      dGroup.add(bullseye);

      this.scene.add(dGroup);
      this.trainingDummies.push({
        id: dp.id,
        name: dp.name,
        x: dp.x,
        z: dp.z,
        y,
        mesh: dGroup,
        health: 250,
        maxHealth: 250,
        wobbleAngle: 0,
      });
    });
  }

  // ==================== PROCEDURAL TERRAIN ====================
  private createTerrain() {
    const size = 320;
    const segments = 120;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const grassColor = new THREE.Color(0x386641);
    const stoneColor = new THREE.Color(0x6b7280);
    const plazaColor = new THREE.Color(0x94a3b8);
    const pathColor = new THREE.Color(0x854d0e);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);

      const dist = Math.sqrt(x * x + z * z);
      let c = grassColor;

      if (dist < 26) {
        c = plazaColor;
      } else if (dist < 34) {
        c = (x + z) % 4 > 2 ? pathColor : plazaColor;
      } else if (y > 4.5) {
        c = stoneColor;
      } else {
        c = grassColor;
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1,
    });

    this.terrainMesh = new THREE.Mesh(geometry, mat);
    this.terrainMesh.receiveShadow = !this.isSoftwareGl;
    this.scene.add(this.terrainMesh);
  }

  // ==================== CITADEL BUILDINGS ====================
  private createCitadelAndStructures() {
    const stoneWallMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8, metalness: 0.2 });
    const stoneTrimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5, metalness: 0.3 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const goldDomeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.85 });
    const windowGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const buildTower = (x: number, z: number, height: number, width: number, hasDome = false) => {
      const y = getTerrainHeight(x, z);
      const bGroup = new THREE.Group();
      bGroup.position.set(x, y, z);

      const base = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, 1.2, width + 0.6), stoneTrimMat);
      base.position.y = 0.6;
      base.castShadow = true;
      base.receiveShadow = true;
      bGroup.add(base);

      const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, width), stoneWallMat);
      body.position.y = 1.2 + height / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      bGroup.add(body);

      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.8), windowGlowMat);
      win.position.set(0, height * 0.6, width / 2 + 0.05);
      bGroup.add(win);

      if (hasDome) {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(width * 0.6, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), goldDomeMat);
        dome.position.y = 1.2 + height;
        dome.castShadow = true;
        bGroup.add(dome);

        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.4, 4, 8), goldDomeMat);
        spire.position.y = 1.2 + height + width * 0.6 + 2;
        bGroup.add(spire);
      } else {
        const roof = new THREE.Mesh(new THREE.ConeGeometry(width * 0.8, 3, 4), woodMat);
        roof.position.y = 1.2 + height + 1.5;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        bGroup.add(roof);
      }

      this.buildingsGroup.add(bGroup);
    };

    buildTower(0, -35, 24, 12, true);
    buildTower(-18, -32, 14, 8, true);
    buildTower(18, -32, 14, 8, true);

    buildTower(-20, -10, 7, 7);
    buildTower(20, -12, 7, 7);
    buildTower(-22, 14, 6, 6);
    buildTower(22, 12, 6, 6);
    buildTower(26, -4, 8, 8);
    buildTower(-4, 26, 5, 6);

    // Central Fountain
    const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.8, 0.8, 16), stoneTrimMat);
    fountainBase.position.set(0, 0.4, 0);
    this.buildingsGroup.add(fountainBase);

    const fountainPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 3.2, 12), stoneTrimMat);
    fountainPillar.position.set(0, 1.6, 0);
    this.buildingsGroup.add(fountainPillar);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.8,
    });
    const waterDisc = new THREE.Mesh(new THREE.CircleGeometry(4.2, 16), waterMat);
    waterDisc.rotation.x = -Math.PI / 2;
    waterDisc.position.set(0, 0.78, 0);
    this.buildingsGroup.add(waterDisc);

    // Street Lamps
    const lampCoords = [[-12, -4], [12, -4], [-12, 12], [12, 12], [0, -16], [0, 16]];
    lampCoords.forEach(([lx, lz]) => {
      const ly = getTerrainHeight(lx, lz);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.2, 8), stoneWallMat);
      post.position.set(lx, ly + 1.6, lz);
      const lantern = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      lantern.position.set(lx, ly + 3.2, lz);
      this.buildingsGroup.add(post);
      this.buildingsGroup.add(lantern);
    });

    this.scene.add(this.buildingsGroup);
  }

  // ==================== INSTANCED FOLIAGE & ROCKS ====================
  private createInstancedEnvironment() {
    const leavesBottom = new THREE.ConeGeometry(2.0, 3.5, 6);
    leavesBottom.translate(0, 3.5, 0);

    const treeCount = this.settings.preset === 'batterySaver' ? 180 : 450;
    const treeMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      roughness: 0.75,
      metalness: 0.05,
    });
    this.treeInstances = new THREE.InstancedMesh(leavesBottom, treeMat, treeCount);
    this.treeInstances.castShadow = !this.isSoftwareGl && this.settings.shadowQuality !== 'off';
    this.treeInstances.receiveShadow = !this.isSoftwareGl;

    const dummy = new THREE.Object3D();
    const tintColor = new THREE.Color();

    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 34 + Math.random() * 110;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;
      const ty = getTerrainHeight(tx, tz);

      dummy.position.set(tx, ty, tz);
      const scale = 0.75 + Math.random() * 0.6;
      dummy.scale.set(scale, scale * (0.9 + Math.random() * 0.3), scale);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.updateMatrix();

      this.treeInstances.setMatrixAt(i, dummy.matrix);
      tintColor.setHSL(0.33 + (Math.random() - 0.5) * 0.08, 0.55, 0.25 + Math.random() * 0.15);
      this.treeInstances.setColorAt(i, tintColor);
    }
    this.treeInstances.instanceMatrix.needsUpdate = true;
    if (this.treeInstances.instanceColor) this.treeInstances.instanceColor.needsUpdate = true;
    this.treeInstances.computeBoundingSphere();
    this.scene.add(this.treeInstances);

    // Rocks
    const rockCount = this.settings.preset === 'batterySaver' ? 80 : 200;
    const rockGeom = new THREE.DodecahedronGeometry(1.2, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.85,
      metalness: 0.2,
    });
    this.rockInstances = new THREE.InstancedMesh(rockGeom, rockMat, rockCount);
    this.rockInstances.castShadow = !this.isSoftwareGl && this.settings.shadowQuality !== 'off';

    for (let i = 0; i < rockCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 28 + Math.random() * 115;
      const rx = Math.cos(angle) * radius;
      const rz = Math.sin(angle) * radius;
      const ry = getTerrainHeight(rx, rz);

      dummy.position.set(rx, ry + 0.4, rz);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      const s = 0.5 + Math.random() * 1.2;
      dummy.scale.set(s, s * 0.7, s);
      dummy.updateMatrix();

      this.rockInstances.setMatrixAt(i, dummy.matrix);
      tintColor.setHSL(0.58, 0.1, 0.35 + Math.random() * 0.2);
      this.rockInstances.setColorAt(i, tintColor);
    }
    this.rockInstances.instanceMatrix.needsUpdate = true;
    if (this.rockInstances.instanceColor) this.rockInstances.instanceColor.needsUpdate = true;
    this.rockInstances.computeBoundingSphere();
    this.scene.add(this.rockInstances);
  }

  // ==================== LIVING NPCS ====================
  private createLivingNpcs() {
    this.npcCitizens = [...INITIAL_CITIZENS];
    this.scene.add(this.npcsGroup);

    this.npcCitizens.forEach((npc) => {
      const npcModel = this.buildNpcModel(npc);
      const groundY = getTerrainHeight(npc.x, npc.z);
      npcModel.position.set(npc.x, groundY, npc.z);
      this.npcMeshes.set(npc.id, npcModel);
      this.npcsGroup.add(npcModel);
    });
  }

  private buildNpcModel(npc: LivingNpc): THREE.Group {
    const group = new THREE.Group();
    let mainColor = 0x4b5563;
    let accentColor = 0x9ca3af;

    switch (npc.profession) {
      case 'Guard': mainColor = 0x1e3a8a; accentColor = 0x38bdf8; break;
      case 'Blacksmith': mainColor = 0x9a3412; accentColor = 0xf97316; break;
      case 'Doctor': mainColor = 0x065f46; accentColor = 0x34d399; break;
      case 'Merchant': mainColor = 0xb45309; accentColor = 0xfde047; break;
      case 'Scholar':
      case 'Engineer': mainColor = 0x581c87; accentColor = 0xc084fc; break;
      case 'Farmer': mainColor = 0x3f6212; accentColor = 0xa3e635; break;
      case 'Child': mainColor = 0x0284c7; accentColor = 0x7dd3fc; break;
      default: mainColor = 0x475569; accentColor = 0xcbd5e1;
    }

    const bodyMat = new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.7 });
    const trimMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.5 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.5 });

    const scale = npc.profession === 'Child' ? 0.65 : 1.0;

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55 * scale, 0.7 * scale, 0.35 * scale), bodyMat);
    torso.position.y = 1.1 * scale;
    torso.castShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35 * scale, 0.38 * scale, 0.35 * scale), headMat);
    head.position.y = 1.65 * scale;
    head.castShadow = true;
    group.add(head);

    if (npc.profession === 'Guard') {
      const helm = new THREE.Mesh(new THREE.ConeGeometry(0.25 * scale, 0.3 * scale, 8), trimMat);
      helm.position.y = 1.95 * scale;
      group.add(helm);
    } else if (npc.profession === 'Farmer') {
      const strawHat = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * scale, 0.45 * scale, 0.05 * scale, 12), trimMat);
      strawHat.position.y = 1.9 * scale;
      group.add(strawHat);
    } else if (npc.profession === 'Scholar') {
      const hood = new THREE.Mesh(new THREE.BoxGeometry(0.42 * scale, 0.45 * scale, 0.42 * scale), trimMat);
      hood.position.y = 1.65 * scale;
      group.add(hood);
    }

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 0.75 * scale, 0.2 * scale), bodyMat);
    leftLeg.position.set(-0.15 * scale, 0.38 * scale, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 0.75 * scale, 0.2 * scale), bodyMat);
    rightLeg.position.set(0.15 * scale, 0.38 * scale, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    const beacon = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14 * scale),
      new THREE.MeshBasicMaterial({ color: accentColor })
    );
    beacon.position.y = 2.25 * scale;
    group.add(beacon);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.5 * scale, 12),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);

    group.userData = { npc, beacon, torso, leftLeg, rightLeg, animPhase: Math.random() * 10 };
    return group;
  }

  // ==================== PARTICLE POOL ====================
  private initParticlePool() {
    const pGeom = new THREE.BoxGeometry(0.09, 0.09, 0.09);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    for (let i = 0; i < 60; i++) {
      const mesh = new THREE.Mesh(pGeom, pMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.particlePool.push(mesh);
    }
  }

  public spawnHitSparks(pos: THREE.Vector3, color = 0xf59e0b, count = 10) {
    for (let i = 0; i < count; i++) {
      const mesh = this.particlePool.find((p) => !p.visible);
      if (!mesh) break;

      mesh.visible = true;
      (mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
      mesh.position.copy(pos).add(
        new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.4 + Math.random() * 0.4, (Math.random() - 0.5) * 0.4)
      );

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 7,
        Math.random() * 5 + 2.5,
        (Math.random() - 0.5) * 7
      );

      this.activeParticles.push({
        mesh,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        vel,
      });
    }
  }

  // ==================== INPUT HANDLING ====================
  private setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyF') {
        this.triggerAttack();
      } else if (e.code === 'KeyQ') {
        this.triggerBlock(true);
      } else if (e.code === 'KeyR') {
        this.triggerDodge();
      } else if (e.code === 'Digit1') {
        this.triggerSkillWhirlwind();
      } else if (e.code === 'Digit2') {
        this.triggerSkillNova();
      } else if (e.code === 'Digit3') {
        this.triggerSkillHeal();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'KeyQ') {
        this.triggerBlock(false);
      }
    });

    // Mouse drag camera orbit
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const el = this.renderer.domElement;
    el.addEventListener('mousedown', (e) => {
      if (e.button === 0 || e.button === 2) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      this.cameraYaw -= dx * 0.005;
      this.cameraPitch = Math.max(0.08, Math.min(1.25, this.cameraPitch + dy * 0.004));
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch look on right half of mobile screen (Smooth Minecraft-style swipe)
    let touchStartX = 0;
    let touchStartY = 0;
    let activeTouchId: number | null = null;

    el.addEventListener('touchstart', (e) => {
      if (activeTouchId === null && e.touches.length > 0) {
        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i];
          if (touch.clientX > window.innerWidth * 0.38) {
            activeTouchId = touch.identifier;
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            break;
          }
        }
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId) {
          const dx = touch.clientX - touchStartX;
          const dy = touch.clientY - touchStartY;

          // Update reference coordinates every frame for smooth non-jumping tracking
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;

          this.cameraYaw -= dx * 0.0055;
          this.cameraPitch = Math.max(0.08, Math.min(1.25, this.cameraPitch + dy * 0.0045));
          break;
        }
      }
    }, { passive: true });

    el.addEventListener('touchend', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          activeTouchId = null;
          break;
        }
      }
    });
  }

  // ==================== COMBAT ACTIONS & COMBOS ====================
  public triggerAttack() {
    if (this.isAttacking || this.isBlocking || this.isDodging) return;

    this.isAttacking = true;
    this.comboResetTimer = 1.0;

    // 3-hit combo progression
    if (this.comboStep === 0) {
      this.attackTimer = 0.28;
      soundEngine.playSwordSlash();
    } else if (this.comboStep === 1) {
      this.attackTimer = 0.32;
      soundEngine.playSwordSlash();
    } else {
      // Heavy Combo Finisher
      this.attackTimer = 0.45;
      soundEngine.playComboFinisher();
      if (this.isGrounded) {
        this.playerVelocity.y = 4.2; // hop up into overhead smash
      }
    }

    // Strike vector facing front
    const forwardX = Math.sin(this.playerRotation);
    const forwardZ = Math.cos(this.playerRotation);
    const hitCenter = this.playerPosition.clone().add(new THREE.Vector3(forwardX * 2.0, 0.8, forwardZ * 2.0));

    const sparkColor = this.comboStep === 2 ? 0xf59e0b : this.comboStep === 1 ? 0x38bdf8 : 0x60a5fa;
    this.spawnHitSparks(hitCenter, sparkColor, this.comboStep === 2 ? 18 : 8);

    const isFinisher = this.comboStep === 2;
    const baseDamage = isFinisher ? Math.floor(75 + Math.random() * 35) : Math.floor(32 + Math.random() * 15);

    // 1. Check Training Dummies
    this.trainingDummies.forEach((dummy) => {
      const dist = this.playerPosition.distanceTo(new THREE.Vector3(dummy.x, 0.5, dummy.z));
      if (dist < 3.2) {
        dummy.wobbleAngle = (Math.random() > 0.5 ? 1 : -1) * 0.35;
        dummy.health = Math.max(0, dummy.health - baseDamage);
        if (dummy.health === 0) dummy.health = dummy.maxHealth;

        soundEngine.playHitImpact();
        if (this.onPlayerAttackHit) {
          this.onPlayerAttackHit(dummy.name, baseDamage, isFinisher);
        }
      }
    });

    // 2. Check Living NPCs in vicinity
    if (this.nearestNpc) {
      const dist = this.playerPosition.distanceTo(new THREE.Vector3(this.nearestNpc.x, 0.5, this.nearestNpc.z));
      if (dist < 3.2) {
        soundEngine.playHitImpact();
        if (this.onPlayerAttackHit) {
          this.onPlayerAttackHit(this.nearestNpc.name, baseDamage, isFinisher);
        }
      }
    }

    // Advance combo step
    this.comboStep = (this.comboStep + 1) % 3;
  }

  public triggerBlock(blocking: boolean) {
    if (this.isDodging) return;
    this.isBlocking = blocking;
    this.blockBarrierMesh.visible = blocking;
    if (blocking) {
      soundEngine.playShieldBlock();
      this.spawnHitSparks(this.playerPosition.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x38bdf8, 5);
    }
  }

  public triggerDodge() {
    if (this.isDodging || this.dodgeCooldownTimer > 0) return;
    this.isDodging = true;
    this.dodgeTimer = 0.38;
    this.dodgeCooldownTimer = 0.85;
    this.isBlocking = false;
    this.blockBarrierMesh.visible = false;
    soundEngine.playDodgeRoll();

    // Spurt dust particles
    this.spawnHitSparks(this.playerPosition, 0x94a3b8, 12);
  }

  public triggerJump() {
    if (this.isGrounded && !this.isDodging) {
      this.playerVelocity.y = 8.5;
      this.isGrounded = false;
      soundEngine.playJump();
    }
  }

  // ==================== SPECIAL SKILLS ====================
  public triggerSkillWhirlwind() {
    if (this.activeSkill !== 'none') return;
    this.activeSkill = 'whirlwind';
    this.skillTimer = 0.65;
    soundEngine.playSkillWhirlwind();

    this.whirlwindMesh.visible = true;
    this.whirlwindMesh.position.copy(this.playerPosition).add(new THREE.Vector3(0, 1.2, 0));

    // AOE strike all nearby targets
    this.trainingDummies.forEach((d) => {
      if (this.playerPosition.distanceTo(new THREE.Vector3(d.x, 0.5, d.z)) < 5.0) {
        d.wobbleAngle = 0.45;
        if (this.onPlayerAttackHit) {
          this.onPlayerAttackHit(d.name, 110, true);
        }
      }
    });
    this.spawnHitSparks(this.playerPosition, 0xf59e0b, 20);
  }

  public triggerSkillNova() {
    if (this.activeSkill !== 'none') return;
    this.activeSkill = 'nova';
    this.skillTimer = 0.6;
    soundEngine.playSkillNova();

    this.novaMesh.visible = true;
    this.novaMesh.position.copy(this.playerPosition).add(new THREE.Vector3(0, 1.4, 0));
    this.novaMesh.scale.set(0.1, 0.1, 0.1);

    this.trainingDummies.forEach((d) => {
      if (this.playerPosition.distanceTo(new THREE.Vector3(d.x, 0.5, d.z)) < 6.0) {
        d.wobbleAngle = -0.5;
        if (this.onPlayerAttackHit) {
          this.onPlayerAttackHit(d.name, 140, true);
        }
      }
    });
    this.spawnHitSparks(this.playerPosition, 0x38bdf8, 25);
  }

  public triggerSkillHeal() {
    if (this.activeSkill !== 'none') return;
    this.activeSkill = 'heal';
    this.skillTimer = 0.7;
    soundEngine.playSkillHeal();

    this.healPillarMesh.visible = true;
    this.healPillarMesh.position.copy(this.playerPosition).add(new THREE.Vector3(0, 2.2, 0));
    this.spawnHitSparks(this.playerPosition, 0x10b981, 20);
  }

  // ==================== MAIN SIMULATION LOOP ====================
  private startLoop() {
    const tick = () => {
      if (!this.isRunning) return;

      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05);

      this.updatePhysicsAndPlayer(dt);
      this.updateLivingNpcs(dt);
      this.updateTrainingDummies(dt);
      this.updateSkillEffects(dt);
      this.updateParticles(dt);
      this.updateDayNightCycle(dt);
      this.updateCamera(dt);

      this.renderer.render(this.scene, this.camera);
      this.updateTelemetry(rawDt);

      if (this.isSoftwareGl) {
        this.animFrameId = window.setTimeout(tick, 20);
      } else {
        this.animFrameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.animFrameId = window.setTimeout(tick, 20);
    } else {
      this.animFrameId = requestAnimationFrame(tick);
    }
  }

  // ==================== REVOLUTIONARY MOVEMENT KINEMATICS ====================
  private updatePhysicsAndPlayer(dt: number) {
    // 1. Calculate Camera Orientation on the horizontal plane
    // Camera is at player + Vector3(sin(yaw)*cos(pitch)*dist, ..., cos(yaw)*cos(pitch)*dist)
    // Looking from camera toward player gives forward: (-sin(yaw), 0, -cos(yaw))
    const camForwardX = -Math.sin(this.cameraYaw);
    const camForwardZ = -Math.cos(this.cameraYaw);
    const camRightX = Math.cos(this.cameraYaw);
    const camRightZ = -Math.sin(this.cameraYaw);

    // 2. Read Keyboard Inputs
    let forwardInput = 0; // +1 forward, -1 backward
    let rightInput = 0;   // +1 right, -1 left

    if (this.keys['KeyW'] || this.keys['ArrowUp']) forwardInput += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) forwardInput -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) rightInput += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) rightInput -= 1;

    // 3. Read Mobile Virtual Joystick Inputs
    // On touch joystick: pushing UP yields negative y, pushing DOWN yields positive y.
    // So forwardInput is -virtualJoystick.y (UP is positive forward)!
    if (Math.abs(this.virtualJoystick.x) > 0.08 || Math.abs(this.virtualJoystick.y) > 0.08) {
      rightInput += this.virtualJoystick.x;
      forwardInput -= this.virtualJoystick.y;
    }

    if (this.keys['Space']) {
      this.triggerJump();
    }

    // Cooldown timers
    if (this.dodgeCooldownTimer > 0) {
      this.dodgeCooldownTimer -= dt;
    }

    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) {
        this.comboStep = 0;
      }
    }

    // Dodge Roll state
    if (this.isDodging) {
      this.dodgeTimer -= dt;
      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.playerTorso.rotation.x = 0;
      } else {
        // Roll animation: tilt torso forward 360 deg
        const rollFrac = 1 - this.dodgeTimer / 0.38;
        this.playerTorso.rotation.x = rollFrac * Math.PI * 2;
      }
    }

    this.isSprinting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    let speed = this.isSprinting ? 9.8 : 5.4;
    if (this.isBlocking) speed *= 0.45;
    if (this.isDodging) speed *= 2.3;

    const inputMag = Math.sqrt(forwardInput * forwardInput + rightInput * rightInput);

    if (inputMag > 0.05) {
      const normF = forwardInput / Math.max(1, inputMag);
      const normR = rightInput / Math.max(1, inputMag);

      // World movement vector
      const worldMoveX = camForwardX * normF + camRightX * normR;
      const worldMoveZ = camForwardZ * normF + camRightZ * normR;

      this.playerVelocity.x = worldMoveX * speed;
      this.playerVelocity.z = worldMoveZ * speed;

      // Character orientation:
      // Front of character is at +Z in local coords.
      // So Math.atan2(worldMoveX, worldMoveZ) points +Z directly along movement vector!
      const targetAngle = Math.atan2(worldMoveX, worldMoveZ);
      let angleDiff = targetAngle - this.playerRotation;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.playerRotation += angleDiff * Math.min(1, dt * 18);

      // Walk cycle animation
      this.walkAnimTime += dt * (this.isSprinting ? 15 : 9);
      this.playerLeftLeg.rotation.x = Math.sin(this.walkAnimTime) * 0.7;
      this.playerRightLeg.rotation.x = -Math.sin(this.walkAnimTime) * 0.7;
      this.playerLeftArm.rotation.x = -Math.sin(this.walkAnimTime) * 0.6;
      this.playerRightArm.rotation.x = Math.sin(this.walkAnimTime) * 0.6;

      if (Math.abs(Math.sin(this.walkAnimTime)) > 0.95 && this.isGrounded) {
        soundEngine.playFootstep();
      }
    } else {
      // Smooth deceleration damping
      this.playerVelocity.x *= Math.max(0, 1 - dt * 14);
      this.playerVelocity.z *= Math.max(0, 1 - dt * 14);

      this.playerLeftLeg.rotation.x *= Math.max(0, 1 - dt * 10);
      this.playerRightLeg.rotation.x *= Math.max(0, 1 - dt * 10);
      this.playerLeftArm.rotation.x *= Math.max(0, 1 - dt * 10);
      this.playerRightArm.rotation.x *= Math.max(0, 1 - dt * 10);
    }

    // Blocking animation stance
    if (this.isBlocking) {
      this.playerLeftArm.rotation.x = THREE.MathUtils.damp(this.playerLeftArm.rotation.x, Math.PI / 3, 14, dt);
      this.playerLeftArm.rotation.y = THREE.MathUtils.damp(this.playerLeftArm.rotation.y, Math.PI / 4, 14, dt);
      this.playerWeapon.rotation.x = THREE.MathUtils.damp(this.playerWeapon.rotation.x, Math.PI / 2.5, 14, dt);
    } else {
      this.playerLeftArm.rotation.y = THREE.MathUtils.damp(this.playerLeftArm.rotation.y, 0, 14, dt);
    }

    // Attack combo swing kinematics
    if (this.isAttacking) {
      this.attackTimer -= dt;
      const progress = Math.max(0, 1 - this.attackTimer / 0.35);

      if (this.comboStep === 1) {
        // Hit 1: Left-to-right horizontal slice
        this.playerWeapon.rotation.x = Math.PI / 4 + Math.sin(progress * Math.PI) * 1.6;
        this.playerWeapon.rotation.y = -Math.PI / 4 + progress * (Math.PI / 2);
        this.playerWeapon.rotation.z = Math.sin(progress * Math.PI) * 0.8;
      } else if (this.comboStep === 2) {
        // Hit 2: Upward cross strike
        this.playerWeapon.rotation.x = Math.PI / 3 - Math.sin(progress * Math.PI) * 1.4;
        this.playerWeapon.rotation.y = Math.PI / 4 - progress * (Math.PI / 2);
        this.playerWeapon.rotation.z = -Math.sin(progress * Math.PI) * 0.6;
      } else {
        // Hit 3: Overhead ground pound finisher
        this.playerWeapon.rotation.x = Math.PI / 2 + Math.sin(progress * Math.PI) * 2.2;
        this.playerWeapon.rotation.y = 0;
        this.playerWeapon.rotation.z = 0;
      }

      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.playerWeapon.rotation.set(Math.PI / 4, 0, 0);
      }
    }

    // Vertical Physics & Ground Placement
    this.playerVelocity.y -= 22 * dt;
    this.playerPosition.x += this.playerVelocity.x * dt;
    this.playerPosition.z += this.playerVelocity.z * dt;
    this.playerPosition.y += this.playerVelocity.y * dt;

    const terrainY = getTerrainHeight(this.playerPosition.x, this.playerPosition.z);
    if (this.playerPosition.y <= terrainY) {
      this.playerPosition.y = terrainY;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    }

    this.playerGroup.position.copy(this.playerPosition);
    this.playerGroup.rotation.y = this.playerRotation;

    const maxBound = 145;
    this.playerPosition.x = Math.max(-maxBound, Math.min(maxBound, this.playerPosition.x));
    this.playerPosition.z = Math.max(-maxBound, Math.min(maxBound, this.playerPosition.z));
  }

  private updateSkillEffects(dt: number) {
    if (this.activeSkill === 'none') return;
    this.skillTimer -= dt;

    if (this.activeSkill === 'whirlwind') {
      this.whirlwindMesh.position.copy(this.playerPosition).add(new THREE.Vector3(0, 1.2, 0));
      this.whirlwindMesh.rotation.z += dt * 25;
      this.playerRotation += dt * 18; // Spin player along with whirlwind
    } else if (this.activeSkill === 'nova') {
      this.novaMesh.position.copy(this.playerPosition).add(new THREE.Vector3(0, 1.4, 0));
      const s = (1 - this.skillTimer / 0.6) * 6.5;
      this.novaMesh.scale.set(s, s, s);
    } else if (this.activeSkill === 'heal') {
      this.healPillarMesh.position.copy(this.playerPosition).add(new THREE.Vector3(0, 2.2, 0));
      this.healPillarMesh.rotation.y += dt * 6;
    }

    if (this.skillTimer <= 0) {
      this.activeSkill = 'none';
      this.whirlwindMesh.visible = false;
      this.novaMesh.visible = false;
      this.healPillarMesh.visible = false;
    }
  }

  private updateTrainingDummies(dt: number) {
    this.trainingDummies.forEach((dummy) => {
      if (Math.abs(dummy.wobbleAngle) > 0.01) {
        dummy.wobbleAngle *= Math.max(0, 1 - dt * 6);
        dummy.mesh.rotation.z = Math.sin(dummy.wobbleAngle * 10) * dummy.wobbleAngle;
      } else {
        dummy.mesh.rotation.z = 0;
      }
    });
  }

  private updateLivingNpcs(dt: number) {
    let closestNpc: LivingNpc | null = null;
    let closestDist = Infinity;

    this.npcCitizens.forEach((npc) => {
      const mesh = this.npcMeshes.get(npc.id);
      if (!mesh) return;

      const dist = this.playerPosition.distanceTo(new THREE.Vector3(npc.x, 0, npc.z));

      if (dist > 95) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;

      if (dist < closestDist && dist < this.interactDistance) {
        closestDist = dist;
        closestNpc = npc;
      }

      const uData = mesh.userData;
      uData.animPhase += dt * 1.2;

      if (uData.beacon) {
        uData.beacon.rotation.y += dt * 2.0;
        uData.beacon.position.y = 2.25 + Math.sin(uData.animPhase * 2.5) * 0.08;
      }

      if (dist < 8) {
        const angle = Math.atan2(this.playerPosition.x - npc.x, this.playerPosition.z - npc.z);
        mesh.rotation.y = angle;
      } else {
        mesh.rotation.y = Math.sin(uData.animPhase * 0.5) * 0.3;
      }
    });

    if (this.nearestNpc !== closestNpc) {
      this.nearestNpc = closestNpc;
      if (this.onInteractableNpcChange) {
        this.onInteractableNpcChange(this.nearestNpc);
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.mesh.visible = false;
        this.activeParticles.splice(i, 1);
      } else {
        p.vel.y -= 14 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        const scale = 1 - p.life / p.maxLife;
        p.mesh.scale.set(scale, scale, scale);
      }
    }
  }

  private updateDayNightCycle(dt: number) {
    this.dayTime = (this.dayTime + dt / this.dayDurationSec) % 1.0;

    const sunAngle = this.dayTime * Math.PI * 2;
    const sunX = Math.cos(sunAngle) * 90;
    const sunY = Math.sin(sunAngle) * 90;
    const sunZ = 40;

    this.dirLight.position.set(sunX, Math.max(5, sunY), sunZ);
    const daylight = Math.max(0.15, Math.sin(sunAngle));
    this.dirLight.intensity = Math.max(0.2, daylight * 2.2);

    if (daylight > 0.4) {
      this.scene.background = new THREE.Color(0x0f172a);
      if (this.scene.fog && 'color' in this.scene.fog) {
        this.scene.fog.color.setHex(0x1e293b);
      }
      this.hemiLight.color.setHex(0x87ceeb);
      this.hemiLight.groundColor.setHex(0x386641);
    } else {
      this.scene.background = new THREE.Color(0x020617);
      if (this.scene.fog && 'color' in this.scene.fog) {
        this.scene.fog.color.setHex(0x020617);
      }
      this.hemiLight.color.setHex(0x312e81);
      this.hemiLight.groundColor.setHex(0x0f172a);
    }
  }

  private updateCamera(dt: number) {
    const camOffset = new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance,
      Math.sin(this.cameraPitch) * this.cameraDistance + 1.8,
      Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance
    );

    this.targetCameraPos.copy(this.playerPosition).add(camOffset);

    const minCamY = getTerrainHeight(this.targetCameraPos.x, this.targetCameraPos.z) + 1.2;
    if (this.targetCameraPos.y < minCamY) {
      this.targetCameraPos.y = minCamY;
    }

    this.camera.position.lerp(this.targetCameraPos, Math.min(1, dt * 10));

    const lookTarget = this.playerPosition.clone().add(new THREE.Vector3(0, 1.4, 0));
    this.camera.lookAt(lookTarget);
  }

  private updateTelemetry(rawDt: number) {
    this.frameCount++;
    this.currentFrameTime = rawDt * 1000;

    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;

      if (this.onTelemetryUpdate) {
        const renderInfo = this.renderer.info.render;
        const memoryInfo = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
        const memoryMb = memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024)) : 78;

        let activeNpcCount = 0;
        let culledNpcCount = 0;
        this.npcMeshes.forEach((m) => {
          if (m.visible) activeNpcCount++;
          else culledNpcCount++;
        });

        this.onTelemetryUpdate({
          fps: this.currentFps,
          frameTimeMs: parseFloat(this.currentFrameTime.toFixed(1)),
          drawCalls: renderInfo.calls,
          triangles: renderInfo.triangles,
          activeNpcs: activeNpcCount,
          culledNpcs: culledNpcCount,
          activeChunks: 9,
          memoryMb,
          playerPos: {
            x: Math.round(this.playerPosition.x),
            y: Math.round(this.playerPosition.y),
            z: Math.round(this.playerPosition.z),
          },
        });
      }
    }
  }

  private handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.applyResolutionAndShadows();
  }

  public dispose() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      clearTimeout(this.animFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
