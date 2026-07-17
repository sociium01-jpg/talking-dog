import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";

export default function ThreeDog({
  size = "Medium",
  earType = "Pointy",
  tailType = "Long",
  color = "Tan",
  isPlayingDemo = false,
  demoMood = "happy",
  onInteraction = null
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const dogGroupRef = useRef(null);
  const headGroupRef = useRef(null);
  const tailGroupRef = useRef(null);
  const earsRef = useRef({ left: null, right: null });
  const tailMeshRef = useRef(null);
  const bodyMeshRef = useRef(null);
  const materialsRef = useRef({});
  
  const [barkBubble, setBarkBubble] = useState(null);
  const clickAnimRef = useRef({ active: false, time: 0, initialY: 0 });

  // Map user-friendly colors to Hex values
  const getColorHex = (c) => {
    switch (c?.toLowerCase()) {
      case "golden": return 0xe5a93c;
      case "white": return 0xf5f6f8;
      case "black": return 0x1f242d;
      case "brown": return 0x6e473b;
      case "grey":
      case "gray": return 0x8a9597;
      case "tan":
      default: return 0xc19a6b;
    }
  };

  // Map sizes to scaling values
  const getSizeScale = (s) => {
    switch (s?.toLowerCase()) {
      case "tiny": return 0.55;
      case "small": return 0.75;
      case "large": return 1.25;
      case "giant": return 1.5;
      case "medium":
      default: return 1.0;
    }
  };

  // Click handler to trigger jump/bark
  const handleCanvasClick = (e) => {
    if (clickAnimRef.current.active) return;
    
    // Trigger bounce animation
    clickAnimRef.current.active = true;
    clickAnimRef.current.time = 0;
    
    // Bark sound effect simulated visually
    const barks = ["Woof!", "Arf!", "Yap!", "Bark!"];
    const randomBark = barks[Math.floor(Math.random() * barks.length)];
    setBarkBubble(randomBark);
    
    setTimeout(() => {
      setBarkBubble(null);
    }, 1200);

    if (onInteraction) {
      onInteraction(randomBark);
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    
    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 6.5);
    camera.lookAt(0, 0.2, 0);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    // Dynamic futuristic rim light
    const pointLight = new THREE.PointLight(0x6366f1, 2, 8);
    pointLight.position.set(-3, 1, -2);
    scene.add(pointLight);

    const pointLightTeal = new THREE.PointLight(0x06b6d4, 1.5, 8);
    pointLightTeal.position.set(3, -1, 2);
    scene.add(pointLightTeal);

    // --- Materials Store ---
    const mainHex = getColorHex(color);
    const materials = {
      primary: new THREE.MeshStandardMaterial({ color: mainHex, roughness: 0.6, metalness: 0.1 }),
      secondary: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }),
      tongue: new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.6 }),
      collar: new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.2, emissive: 0x6366f1, emissiveIntensity: 0.4 }),
      shadowPlane: new THREE.ShadowMaterial({ opacity: 0.18 })
    };
    materialsRef.current = materials;

    // --- Ground shadow receiver ---
    const shadowGeo = new THREE.PlaneGeometry(10, 10);
    const shadowMesh = new THREE.Mesh(shadowGeo, materials.shadowPlane);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.0;
    shadowMesh.receiveShadow = true;
    scene.add(shadowMesh);

    // --- Build Dog Model ---
    const dogGroup = new THREE.Group();
    dogGroupRef.current = dogGroup;
    scene.add(dogGroup);

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.5, 0.9, 0.9);
    const bodyMesh = new THREE.Mesh(bodyGeo, materials.primary);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    dogGroup.add(bodyMesh);
    bodyMeshRef.current = bodyMesh;

    // Neck
    const neckGeo = new THREE.BoxGeometry(0.4, 0.6, 0.4);
    const neckMesh = new THREE.Mesh(neckGeo, materials.primary);
    neckMesh.position.set(0.55, 0.5, 0);
    neckMesh.rotation.z = -Math.PI / 6;
    neckMesh.castShadow = true;
    dogGroup.add(neckMesh);

    // Collar
    const collarGeo = new THREE.BoxGeometry(0.45, 0.15, 0.45);
    const collarMesh = new THREE.Mesh(collarGeo, materials.collar);
    collarMesh.position.set(0.6, 0.65, 0);
    collarMesh.rotation.z = -Math.PI / 6;
    dogGroup.add(collarMesh);

    // Head Group (Pivot point for mouse look)
    const headGroup = new THREE.Group();
    headGroup.position.set(0.75, 0.85, 0);
    headGroupRef.current = headGroup;
    dogGroup.add(headGroup);

    // Head Main
    const headGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const headMesh = new THREE.Mesh(headGeo, materials.primary);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Snout / Muzzle
    const snoutGeo = new THREE.BoxGeometry(0.4, 0.35, 0.4);
    const snoutMesh = new THREE.Mesh(snoutGeo, materials.secondary);
    snoutMesh.position.set(0.4, -0.1, 0);
    snoutMesh.castShadow = true;
    headGroup.add(snoutMesh);

    // Nose
    const noseGeo = new THREE.BoxGeometry(0.12, 0.12, 0.2);
    const noseMesh = new THREE.Mesh(noseGeo, materials.dark);
    noseMesh.position.set(0.61, -0.02, 0);
    headGroup.add(noseMesh);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.1, 0.15, 0.1);
    const eyeLeft = new THREE.Mesh(eyeGeo, materials.dark);
    eyeLeft.position.set(0.31, 0.15, 0.22);
    const eyeRight = eyeLeft.clone();
    eyeRight.position.z = -0.22;
    headGroup.add(eyeLeft);
    headGroup.add(eyeRight);

    // Tongue (slightly visible)
    const tongueGeo = new THREE.BoxGeometry(0.18, 0.05, 0.2);
    const tongueMesh = new THREE.Mesh(tongueGeo, materials.tongue);
    tongueMesh.position.set(0.38, -0.24, 0);
    tongueMesh.rotation.z = -Math.PI / 12;
    headGroup.add(tongueMesh);

    // Ears (Adjustable position)
    const earGeo = new THREE.BoxGeometry(0.18, 0.45, 0.18);
    const earLeft = new THREE.Mesh(earGeo, materials.primary);
    earLeft.castShadow = true;
    const earRight = earLeft.clone();
    
    headGroup.add(earLeft);
    headGroup.add(earRight);
    earsRef.current = { left: earLeft, right: earRight };

    // Apply initial ear morphing
    updateEars(earType);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.24, 0.8, 0.24);
    
    // Front Left
    const legFL = new THREE.Mesh(legGeo, materials.primary);
    legFL.position.set(0.5, -0.65, 0.3);
    legFL.castShadow = true;
    
    // Front Right
    const legFR = legFL.clone();
    legFR.position.z = -0.3;

    // Back Left
    const legBL = legFL.clone();
    legBL.position.x = -0.5;

    // Back Right
    const legBR = legBL.clone();
    legBR.position.z = -0.3;

    dogGroup.add(legFL);
    dogGroup.add(legFR);
    dogGroup.add(legBL);
    dogGroup.add(legBR);

    // Tail Group (Pivot at base of tail)
    const tailGroup = new THREE.Group();
    tailGroup.position.set(-0.75, 0.35, 0);
    tailGroupRef.current = tailGroup;
    dogGroup.add(tailGroup);

    // Tail Mesh
    const tailGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
    const tailMesh = new THREE.Mesh(tailGeo, materials.primary);
    tailMesh.position.set(-0.05, 0.25, 0);
    tailMesh.rotation.z = -Math.PI / 4;
    tailMesh.castShadow = true;
    tailGroup.add(tailMesh);
    tailMeshRef.current = tailMesh;

    // Apply initial tail style
    updateTail(tailType);

    // Set overall scale based on size
    const finalScale = getSizeScale(size);
    dogGroup.scale.set(finalScale, finalScale, finalScale);
    dogGroup.position.y = -1.0 + (0.9 * finalScale); // Keep feet on ground

    // --- Mouse Tracking & Interactions ---
    const mouse = { x: 0, y: 0 };
    const targetHeadRotation = { x: 0, y: 0 };

    const handleMouseMove = (event) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      
      mouse.x = (x / (rect.width / 2)) * 0.55;
      mouse.y = -(y / (rect.height / 2)) * 0.35;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // --- Animation Loop ---
    let animationId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // 1. Mouse Follow (Lerp head rotation)
      targetHeadRotation.y = mouse.x;
      targetHeadRotation.x = mouse.y;
      
      if (headGroup) {
        headGroup.rotation.y += (targetHeadRotation.y - headGroup.rotation.y) * 0.1;
        headGroup.rotation.z += (-targetHeadRotation.x - headGroup.rotation.z) * 0.1;
      }

      // 2. Idle animations / Breathing
      const breathe = Math.sin(elapsedTime * 2.5) * 0.02;
      if (bodyMesh) {
        bodyMesh.scale.y = 1 + breathe;
        bodyMesh.scale.x = 1 - breathe * 0.5;
      }
      
      // 3. Tail Wagging animation (Speed depends on demo state or clicking)
      let wagSpeed = 8;
      let wagAmp = 0.3;

      if (isPlayingDemo) {
        if (demoMood === "happy" || demoMood === "excited") {
          wagSpeed = 22;
          wagAmp = 0.55;
        } else if (demoMood === "scared" || demoMood === "submissive") {
          wagSpeed = 14;
          wagAmp = 0.15;
        } else if (demoMood === "alert") {
          wagSpeed = 4;
          wagAmp = 0.2;
        }
      } else if (clickAnimRef.current.active) {
        wagSpeed = 26;
        wagAmp = 0.6;
      } else {
        wagSpeed = 7 + Math.sin(elapsedTime * 0.5) * 2;
        wagAmp = 0.25;
      }

      if (tailGroup) {
        if (isPlayingDemo && demoMood === "scared") {
          tailGroup.rotation.z += (-Math.PI / 1.8 - tailGroup.rotation.z) * 0.15;
          tailGroup.rotation.y = Math.sin(elapsedTime * wagSpeed) * wagAmp;
        } else if (tailType === "Curled") {
          tailGroup.rotation.z += (-Math.PI / 8 - tailGroup.rotation.z) * 0.15;
          tailGroup.rotation.y = Math.sin(elapsedTime * wagSpeed) * wagAmp;
        } else {
          tailGroup.rotation.z += (-Math.PI / 4 - tailGroup.rotation.z) * 0.15;
          tailGroup.rotation.y = Math.sin(elapsedTime * wagSpeed) * wagAmp;
        }
      }

      // 4. Click Jump/Bounce Animation
      if (clickAnimRef.current.active) {
        clickAnimRef.current.time += 0.055;
        const t = clickAnimRef.current.time;
        
        const jumpY = Math.sin(t * Math.PI) * 0.45;
        const baseHeight = -1.0 + (0.9 * finalScale);
        
        if (dogGroup) {
          dogGroup.position.y = baseHeight + jumpY;
          dogGroup.rotation.z = Math.sin(t * Math.PI) * -0.06;
          legFL.rotation.z = Math.sin(t * Math.PI) * 0.2;
          legBL.rotation.z = Math.sin(t * Math.PI) * -0.15;
        }

        if (t >= 1.0) {
          clickAnimRef.current.active = false;
          if (dogGroup) {
            dogGroup.position.y = baseHeight;
            dogGroup.rotation.z = 0;
            legFL.rotation.z = 0;
            legBL.rotation.z = 0;
          }
        }
      }

      if (dogGroup && !clickAnimRef.current.active) {
        dogGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.03;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      
      Object.values(materials).forEach((m) => m.dispose());
      bodyGeo.dispose();
      neckGeo.dispose();
      collarGeo.dispose();
      headGeo.dispose();
      snoutGeo.dispose();
      noseGeo.dispose();
      eyeGeo.dispose();
      tongueGeo.dispose();
      earGeo.dispose();
      legGeo.dispose();
      tailGeo.dispose();
      shadowGeo.dispose();
      
      renderer.dispose();
    };
  }, [size, earType, tailType, color, isPlayingDemo, demoMood]);

  const updateEars = (type) => {
    const left = earsRef.current.left;
    const right = earsRef.current.right;
    if (!left || !right) return;

    if (type === "Floppy") {
      left.position.set(0.1, 0.15, 0.38);
      left.rotation.set(0, 0, Math.PI / 12);
      left.scale.set(0.9, 1.4, 0.9);
      
      right.position.set(0.1, 0.15, -0.38);
      right.rotation.set(0, 0, Math.PI / 12);
      right.scale.set(0.9, 1.4, 0.9);
    } else {
      left.position.set(0.05, 0.45, 0.28);
      left.rotation.set(Math.PI / 12, 0, -Math.PI / 18);
      left.scale.set(1.0, 1.0, 1.0);
      
      right.position.set(0.05, 0.45, -0.28);
      right.rotation.set(-Math.PI / 12, 0, -Math.PI / 18);
      right.scale.set(1.0, 1.0, 1.0);
    }
  };

  const updateTail = (type) => {
    const tailMesh = tailMeshRef.current;
    if (!tailMesh) return;

    if (type === "Short" || type === "Docked") {
      tailMesh.scale.set(0.8, 0.3, 0.8);
    } else if (type === "Curled") {
      tailMesh.scale.set(0.9, 0.85, 0.9);
    } else {
      tailMesh.scale.set(1.0, 1.25, 1.0);
    }
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: "100%", 
        height: "100%", 
        position: "relative",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      onClick={handleCanvasClick}
    >
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: "block", 
          width: "100%", 
          height: "100%" 
        }} 
      />
      
      <div style={{
        position: "absolute",
        bottom: "8px",
        left: "50%",
        transform: "translateX(-50%)",
        pointerEvents: "none",
        fontSize: "10px",
        color: "rgba(255, 255, 255, 0.35)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        backgroundColor: "rgba(0,0,0,0.3)",
        padding: "3px 10px",
        borderRadius: "20px",
        backdropFilter: "blur(4px)",
        whiteSpace: "nowrap"
      }}>
        👆 Tap to play · 🖱️ Move mouse
      </div>

      {barkBubble && (
        <div style={{
          position: "absolute",
          top: "15%",
          right: "22%",
          backgroundColor: "rgba(99, 102, 241, 0.95)",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: "12px",
          padding: "8px 16px",
          color: "white",
          fontFamily: "var(--font-display)",
          fontWeight: "800",
          fontSize: "15px",
          boxShadow: "var(--shadow-glow), 0 10px 20px rgba(0,0,0,0.4)",
          animation: "slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
          pointerEvents: "none",
        }}>
          {barkBubble}
          <div style={{
            position: "absolute",
            bottom: "-6px",
            left: "20px",
            width: "12px",
            height: "12px",
            backgroundColor: "rgba(99, 102, 241, 0.95)",
            transform: "rotate(45deg)",
            borderBottom: "1px solid rgba(255,255,255,0.25)",
            borderRight: "1px solid rgba(255,255,255,0.25)",
          }} />
        </div>
      )}
    </div>
  );
}
