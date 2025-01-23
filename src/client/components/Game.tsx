import {BabylonScene} from "./BabylonScene.tsx";

import {
	AssetsManager,
	CascadedShadowGenerator,
	DirectionalLight, Effect,
	GIRSM,
	GIRSMManager,
	HavokPlugin,
	HemisphericLight,
	Mesh,
	MeshBuilder, Nullable,
	PhysicsAggregate,
	PhysicsShapeType,
	ReflectionProbe,
	ReflectiveShadowMap,
	Scene, ShaderMaterial,
	ShadowGenerator, Texture,
	Vector3
} from "@babylonjs/core";
import {useCallback, useRef} from "react";
import {useColyseusRoom} from "../hooks/colyseus.ts";
import HavokPhysics from "@babylonjs/havok";
import {RemoteCharacterController} from "../game/RemoteCharacterController.ts";
import {LocalCharacterController} from "../game/LocalCharacterController.ts";
import * as GUI from '@babylonjs/gui'
import { Inspector } from '@babylonjs/inspector';

interface PlayerMeshes {
	[sessionId: string]: RemoteCharacterController;
}

export const Game = ({onBackToMenu}: { onBackToMenu: () => void }) => {
	const room = useColyseusRoom();
	const playerControllers = useRef<PlayerMeshes>({});
	const localController = useRef<LocalCharacterController | undefined>(undefined);

	const onSceneReady = useCallback(async (scene: Scene) => {
		if (!room) return;

		// On Ctrl + Alt + Shift = I open inspector
		scene.onKeyboardObservable.add((kbInfo) => {
			if (kbInfo.event.ctrlKey && kbInfo.event.altKey && kbInfo.event.shiftKey && kbInfo.event.key === "I") {
				if (Inspector.IsVisible) {
					Inspector.Hide();
				} else {
					Inspector.Show(scene, {});
				}
			}
		});

		// Initialize AssetsManager
		const assetsManager = new AssetsManager(scene);

		// Load the character model
		const characterTask = assetsManager.addContainerTask("character task", "", "assets/characters/", "character.glb");

		const hk = new HavokPlugin(true, await HavokPhysics())
		scene.enablePhysics(new Vector3(0, -9.81, 0), hk);

		// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
		const hemisphericLight = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
		hemisphericLight.intensity = 0.3;

		// Directional Light
		const sun = new DirectionalLight("light", new Vector3(-5, -10, 5).normalize(), scene);
		sun.position = sun.direction.negate().scaleInPlace(40);

		// Global Illumination Manager
		const outputDimensions = {
			width: scene.getEngine().getRenderWidth(),
			height: scene.getEngine().getRenderHeight()
		}

		// Global Illumination
		const rsm = new ReflectiveShadowMap(scene, sun, outputDimensions);
		rsm.addMesh()

		const defaultGITextureRatio = 2;

		const giTextureDimensions = {
			width: Math.floor(scene.getEngine().getRenderWidth(true) / defaultGITextureRatio),
			height: Math.floor(scene.getEngine().getRenderHeight(true) / defaultGITextureRatio),
		};

		const giRSMMgr = new GIRSMManager(scene, outputDimensions, giTextureDimensions, 2048);

		const giRSM = new GIRSM(rsm);

		giRSMMgr.addGIRSM(giRSM);
		giRSMMgr.addMaterial();

		// Shadows
		const shadowGenerator = new CascadedShadowGenerator(1024, sun);
		shadowGenerator.blurKernel = 32;
		shadowGenerator.useKernelBlur = true;
		shadowGenerator.usePercentageCloserFiltering = true;
		shadowGenerator.shadowMaxZ = 20;
		shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;

		const hemiLight = new HemisphericLight("hemi", Vector3.Up(), scene);
		hemiLight.intensity = 0.4;

		Effect.ShadersStore["customVertexShader"] = `
precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;

// Uniforms
uniform mat4 worldViewProjection;
uniform mat4 world;

// Varying
varying vec3 vWorldNormal;

void main() {
    // Standard transform
    gl_Position = worldViewProjection * vec4(position, 1.0);

    // Transform normal to world space
    vWorldNormal = normalize((world * vec4(normal, 0.0)).xyz);
}
`;


		Effect.ShadersStore["customFragmentShader"] = `
precision highp float;

varying vec3 vWorldNormal;

// Uniforms (add any you want, for time etc.)
uniform float iTime;
uniform float sunx;   // added for directional lighting
uniform float suny;   // added for directional lighting

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 3D Simplex Noise Implementation
// (adapted from Ashima / IQ / etc. compact versions)
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
float permute(float x){return floor(mod(((x*34.0)+1.0)*x, 289.0));}

vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float taylorInvSqrt(float r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Fractal Brownian Motion in 3D
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
float fbm(vec3 p) {
    float sum  = 0.0;
    float amp  = 0.5;
    for(int i=0; i<5; i++) {
        sum += amp * snoise(p);
        p   = 2.02 * p;   // frequency boost each octave
        amp *= 0.5;       // amplitude halves each octave
    }
    return sum;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Main
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
void main() {
    // Normalized direction from the sphere
    vec3 N = normalize(vWorldNormal);
    
    // A sun direction from the user uniforms
    // (Assumes you animate sunx / suny in registerBeforeRender)
    vec3 sunDir = normalize(vec3(sunx, suny, 0.7)); 
    
    // Sample fractal noise
    float cloudScale = 8.0;
    float speed = 0.1;
    float n = fbm(N * cloudScale + iTime * speed);
    
    // Shape the noise into clouds
    float coverage = 0.02;  // lower coverage => more blue sky
    float contrast = 3.2;   // how sharply we transition into cloud
    float clouds = smoothstep(coverage, 1.0, n * contrast);
    
    // Add extra detail
    float detail = fbm(N * (cloudScale * 4.0) + iTime * (speed * 2.0));
    float finalClouds = clamp(clouds + 0.3 * detail, 0.0, 1.0);

    // -----------------------------
    // Simple directional lighting
    // -----------------------------
    // Dot product with the sun’s direction:
    float lighting = clamp(dot(N, sunDir), 0.0, 1.0);

    // Cloud shadow color (a little bluish) and highlight color (somewhat warm)
    // Tweak these to taste.
    vec3 shadowColor   = vec3(0.7, 0.8, 0.9);
    vec3 highlightColor = vec3(1.0, 0.95, 0.88);

    // Final per-pixel cloud color combining shadow and highlight:
    // We only apply lighting where there is cloud (finalClouds).
    vec3 litCloudColor = mix(shadowColor, highlightColor, lighting);

    // Strengthen the lit areas a bit for a more dramatic effect
    // (use an exponent or extra curve if you want more punch)
    litCloudColor = litCloudColor * (0.9 + 0.4 * lighting);

    // -----------------------------
    // Sky color gradient
    // -----------------------------
    float t = 0.5 * (N.y + 1.0);
    vec3 skyColorLow  = vec3(0.3, 0.5, 0.8);
    vec3 skyColorHigh = vec3(0.7, 0.9, 1.0);
    vec3 sky = mix(skyColorLow, skyColorHigh, t);

    // -----------------------------
    // Combine sky and cloud
    // -----------------------------
    // The final cloud color is litCloudColor where clouds exist
    // and pure sky where no clouds.
    vec3 finalColor = mix(sky, litCloudColor, finalClouds);

    gl_FragColor = vec4(finalColor, 1.0);
}

`;

		// Compile
		const shaderMaterial = new ShaderMaterial("shader", scene, {
				vertex: "custom",
				fragment: "custom",
			},
			{
				attributes: ["position", "normal", "uv"],
				uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
			});


		const mainTexture = new Texture("https://i.imgur.com/kUJBvin.png", scene, true, false, 12);

		//https://www.shadertoy.com/view/ltlSWB
		shaderMaterial.setTexture("iChannel0", mainTexture);
		shaderMaterial.setFloat("iTime", 0);
		shaderMaterial.setFloat("offset", 10);
		shaderMaterial.setFloat("sunx", 2.0);
		shaderMaterial.setFloat("suny", 5.0);
		shaderMaterial.backFaceCulling = false;

		const skybox = MeshBuilder.CreateSphere("skyBox", {diameter: 1000}, scene);
		skybox.material = shaderMaterial;

		// Reflection probe
		const rp = new ReflectionProbe("ref", 512, scene);
		rp.renderList?.push(skybox);

		scene.environmentTexture = rp.cubeTexture;

		// Ground
		const ground = MeshBuilder.CreateGround("ground", {width: 50, height: 50}, scene);
		ground.receiveShadows = true;
		ground.isPickable = true;

		new PhysicsAggregate(ground, PhysicsShapeType.BOX, {
			mass: 0,
		}, scene);

		const cube = MeshBuilder.CreateBox("cube", {size: 0.5}, scene);
		cube.position = new Vector3(2, 0.25, 2);
		cube.receiveShadows = true;
		shadowGenerator.addShadowCaster(cube);
		new PhysicsAggregate(cube, PhysicsShapeType.BOX, {
			mass: 0
		}, scene);

		characterTask.onSuccess = (task) => {
			const localPlayer = task.loadedContainer.instantiateModelsToScene((name) => name);

			// Create local player
			const mesh = localPlayer.rootNodes[0] as Mesh;
			mesh.scaling = new Vector3(1, 1, 1);
			mesh.rotation = new Vector3(0, 0, 0);
			localController.current = new LocalCharacterController(mesh, localPlayer.animationGroups, scene);
			localController.current.model.receiveShadows = true;

			shadowGenerator.addShadowCaster(localController.current.model);

			room.state.players.onAdd(async (player, sessionId) => {
				if (sessionId === room.sessionId) {
					// Initialize local player position and rotation
					localController.current?.setPosition(
						new Vector3(player.x, player.y, player.z)
					);
					localController.current?.setRotationY(player.rot);
					return
				}

				const remotePlayer = task.loadedContainer.instantiateModelsToScene((name) => name);
				const mesh = remotePlayer.rootNodes[0] as Mesh;
				mesh.scaling = new Vector3(1, 1, 1);
				mesh.rotation = new Vector3(0, 0, 0);
				const remoteController = new RemoteCharacterController(mesh, scene, remotePlayer.animationGroups);
				remoteController.setPosition(new Vector3(player.x, player.y, player.z));
				remoteController.setRotationY(player.rot);

				remoteController.model.receiveShadows = true;
				shadowGenerator.addShadowCaster(remoteController.model);
				playerControllers.current[sessionId] = remoteController;

				remoteController.receiveState(player);

				player.onChange(() => {
					remoteController.receiveState(player);
				})

				// Handle player removal
				player.onRemove(() => {
					remoteController.dispose();
					delete playerControllers.current[sessionId];
				});
			})
		}

		assetsManager.onFinish = _ => {
			// Create GUI
			const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

			// Add FPS Counter
			const fpsText = new GUI.TextBlock();
			fpsText.text = "FPS: 0";
			fpsText.color = "white";
			fpsText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
			fpsText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
			fpsText.paddingRight = "10px";
			fpsText.paddingTop = "10px";
			advancedTexture.addControl(fpsText);

			scene.onBeforeRenderObservable.add(() => {
				fpsText.text = `FPS: ${scene.getEngine().getFps().toFixed()}`;
			});
		}

		assetsManager.load();

		let time = 0;
		scene.registerBeforeRender(function () {
			const shaderMaterial = scene.getMaterialByName("shader") as Nullable<ShaderMaterial>
			if (!shaderMaterial) return;
			shaderMaterial.setFloat("iTime", time);

			time += 0.0001 * scene.deltaTime;
		});

		// Lock the cursor when the game is running
		scene.getEngine().getRenderingCanvas()?.requestPointerLock()
			.catch(console.error);

		// Make sure the canvas is focused
		scene.getEngine().getRenderingCanvas()?.focus();
	}, [room]);

	/**
	 * Will run on every frame render. We are updating the local player and interpolating remote players.
	 */
	const onUpdate = useCallback(
		(scene: Scene) => {
			const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
			localController.current?.update(deltaSeconds);
			if (room && localController.current) {
				const transform = localController.current.getTransform();
				const animationState = localController.current.getTargetAnim.name;

				room.send("move", {
					position: {
						x: transform.position.x,
						y: transform.position.y,
						z: transform.position.z,
					},
					rotation: {
						y: transform.rotationQuaternion?.toEulerAngles().y,
					},
					animationState: animationState,
					timestamp: Date.now(),
				});
			}

			// Update remote players with interpolation
			Object.values(playerControllers.current).forEach((remoteController) => {
				remoteController.update(deltaSeconds);
			});
		},
		[room]
	);

	return <div className="relative w-full h-full">
		<BabylonScene antialias onSceneReady={onSceneReady} onRender={onUpdate} id="my-canvas"
					  className="w-full h-full"/>
		<button
			onClick={onBackToMenu}
			className="absolute top-4 left-4 btn btn-primary"
		>
			Back to Menu
		</button>
	</div>
}
