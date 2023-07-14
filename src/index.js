import * as THREE from 'three';
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from 'dat.gui';
import vertex from './shader/vertexShader.glsl';
import fragment from './shader/fragmentShader.glsl';
import { OrthographicCamera } from 'three';
import { Matrix3 } from 'three';
import brush from '../brush.png';
import ocean from '../ocean.jpg';

export default class Sketch {
  constructor() {
    this.container = document.getElementById('container');
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.scene2 = new THREE.Scene();

    this.mouse = new THREE.Vector2(0, 0);
    this.prevMouse = new THREE.Vector2(0, 0);
    this.currentWave = 0;

    this.clock = new THREE.Clock();

    this.baseTexture = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    // OrthographicCamera
    let frustumSize = this.height;
    let aspect = this.width / this.height;
    this.camera = new THREE.OrthographicCamera((frustumSize * aspect) / -2, (frustumSize * aspect) / 2, frustumSize / 2, frustumSize / -2, -1000, 1000);

    //PerspectiveCamera
    // this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.001, 1000);
    this.camera.position.z = 1;

    // Controls
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.mouseEvents();
    this.addObject();
    this.render();
    this.setupResize();
    this.settings();
  }

  addObject() {
    const displacementSize = 64;
    this.geometry = new THREE.PlaneGeometry(displacementSize, displacementSize, 1, 1);
    this.geometryFullScreen = new THREE.PlaneGeometry(this.width, this.height);
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable',
      },
      side: THREE.DoubleSide,
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(this.width, this.height) },
        u_displacement: { value: null },
        u_texture: { value: new THREE.TextureLoader().load(ocean) },
        u_rPhaseMult: { value: this.settings.rPhaseMult },
        u_gPhaseMult: { value: this.settings.gPhaseMult },
        u_bPhaseMult: { value: this.settings.bPhaseMult },
        u_rPhase: { value: this.settings.rPhase },
        u_gPhase: { value: this.settings.gPhase },
        u_bPhase: { value: this.settings.bPhase },
        // u_mouse: { value: new THREE.Vector2(0, 0) },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    this.max = 100;
    this.meshes = [];

    for (let index = 0; index < this.max; index++) {
      let m = new THREE.MeshBasicMaterial({ color: 0xff0000, map: new THREE.TextureLoader().load(brush), transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });

      let mesh = new THREE.Mesh(this.geometry, m);
      mesh.visible = false;
      mesh.rotation.z = 2 * Math.PI * Math.random();
      this.scene.add(mesh);
      this.meshes.push(mesh);
    }

    this.quad = new THREE.Mesh(this.geometryFullScreen, this.material);
    this.scene2.add(this.quad);
  }

  settings = () => {
    this.settings = {
      rPhaseMult: 3.339,
      gPhaseMult: 3.664,
      bPhaseMult: 0,
      rPhase: 0,
      gPhase: 3.26,
      bPhase: 0,
    };
    this.gui = new dat.GUI();
    // const phaseFolder = gui.addFolder('Phase');
    // phaseFolder.add(this.settings, 'rPhaseMult', 0.2, 20, 0.01);
    // phaseFolder.open();

    this.gui.add(this.settings, 'rPhaseMult', 0, 10, 0.001);
    this.gui.add(this.settings, 'gPhaseMult', 0, 10, 0.001);
    this.gui.add(this.settings, 'bPhaseMult', 0, 10, 0.001);
    this.gui.add(this.settings, 'rPhase', 0, 2 * Math.PI, 0.01);
    this.gui.add(this.settings, 'gPhase', 0, 2 * Math.PI, 0.01);
    this.gui.add(this.settings, 'bPhase', 0, 2 * Math.PI, 0.01);
    // this.gui.add(this.settings.gPhaseMult, 'g_mult', 0.2, 20, 0.01);
  };

  setNewVawe = (x, y, index) => {
    let m = this.meshes[index];
    m.visible = true;
    m.position.x = x;
    m.position.y = y;
    m.scale.x = 0.2;
    m.scale.y = m.scale.x;
    m.material.opacity = 0.5;
  };

  trackMousePos = () => {
    const treshold = 3;
    if (Math.abs(this.mouse.x - this.prevMouse.x) > treshold || Math.abs(this.mouse.y - this.prevMouse.y) > treshold) {
      this.setNewVawe(this.mouse.x, this.mouse.y, this.currentWave);
      this.currentWave = (this.currentWave + 1) % this.max;
    }

    this.prevMouse.x = this.mouse.x;
    this.prevMouse.y = this.mouse.y;
    // console.log({ wave: this.currentWave });
  };

  render = () => {
    this.trackMousePos();
    const elapsedTime = this.clock.getElapsedTime();
    this.material.uniforms.u_time.value = elapsedTime;
    this.material.uniforms.u_rPhaseMult.value = this.settings.rPhaseMult;
    this.material.uniforms.u_gPhaseMult.value = this.settings.gPhaseMult;
    this.material.uniforms.u_bPhaseMult.value = this.settings.bPhaseMult;
    this.material.uniforms.u_rPhase.value = this.settings.rPhase;
    this.material.uniforms.u_gPhase.value = this.settings.gPhase;
    this.material.uniforms.u_bPhase.value = this.settings.bPhase;
    requestAnimationFrame(this.render);
    // THIS PART IS THE WAVES
    this.renderer.render(this.scene2, this.camera);

    this.renderer.setRenderTarget(this.baseTexture);
    this.renderer.render(this.scene, this.camera);
    this.material.uniforms.u_displacement.value = this.baseTexture.texture;
    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    this.renderer.render(this.scene2, this.camera);

    this.meshes.forEach((mesh) => {
      if (mesh.visible) {
        mesh.rotation.z += 0.02;
        mesh.material.opacity *= 0.96;

        mesh.scale.x = 0.982 * mesh.scale.x + 0.108;
        mesh.scale.y = mesh.scale.x;
        if (mesh.material.opacity < 0.002) mesh.visible = false;
      }
    });
  };

  setupResize = () => {
    window.addEventListener('resize', this.resize);
  };

  resize = () => {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  };

  mouseEvents = () => {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX - this.width / 2;
      this.mouse.y = this.height / 2 - e.clientY;
    });
  };
}

new Sketch();
