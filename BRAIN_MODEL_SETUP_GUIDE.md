# Brain Model Setup & Customization Guide

## Quick Start

### What You Need
1. A brain 3D model in GLB format (`.glb` file)
2. Optional: Hotspot meshes marked in the model (or we'll generate them automatically)

### Installation (3 Steps)

**Step 1**: Place your brain model
```bash
# Copy your GLB file to:
Frontend/public/models/brain_epicarehub.glb
```

**Step 2**: Start development server
```bash
cd Frontend
npm run dev
# Visit http://localhost:5173/
# Brain should appear rotating in the hero card
```

**Step 3**: If hotspots don't show, update mesh names (see Customization section)

---

## Understanding the Architecture

### BrainModel.jsx: How It Works

```
1. useGLTF loads the GLB file
   ↓
2. Component searches for:
   a) Brain mesh (by name containing "brain" or "cortex", or largest mesh)
   b) Hotspot meshes (by name containing "Hotspot_1", "Hotspot_2", etc.)
   ↓
3. Apply materials to found meshes
   - Brain: purple with subtle glow
   - Hotspots: red/orange/yellow with pulsating glow
   ↓
4. useFrame animation loop:
   - Rotate brain (slow spin)
   - Pulse hotspots (breathing effect)
```

### Fallback Behavior

If the GLB model is missing or meshes aren't found:
- Placeholder sphere appears instead of brain
- Synthetic hotspots render at fixed positions
- No crashes; page fully functional
- Console logs warnings for debugging

---

## Customization Guide

### Scenario 1: Your GLB Has Different Hotspot Names

**Problem**: Hotspots exist in your GLB but aren't detected

**Solution**: Update the hotspot names array

1. Open: `Frontend/src/components/BrainModel.jsx`
2. Find line ~20:
```javascript
const HOTSPOT_NAMES = [
  "Hotspot_1",      // UPDATE: Match your GLB's hotspot mesh names
  "Hotspot_2",
  "Hotspot_3",
];
```

3. Open your GLB in a 3D viewer (e.g., [Three.js Editor](https://threejs.org/editor/))
4. Find the exact names of your hotspot meshes
5. Replace in the array:
```javascript
const HOTSPOT_NAMES = [
  "Seizure_Zone_1",     // Example: Your exact mesh names
  "Seizure_Zone_2",
  "Activation_Point",
];
```

6. Save and reload. Hotspots should now animate.

### Scenario 2: Your GLB Brain Has a Different Color

**Problem**: Brain mesh appears wrong color or not at all

**Solution**: Adjust brain material or check mesh detection

If you want to keep the original GLB mesh colors:
1. In `BrainModel.jsx`, find the brain material setup (line ~94):
```javascript
const brainMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color("#a855f7"),    // Change this purple
  roughness: 0.5,
  metalness: 0.15,
  emissive: new THREE.Color("#7c3aed"), // And this
  emissiveIntensity: 0.08,
});
```

2. Change the hex colors to your preferred palette:
```javascript
color: new THREE.Color("#6366f1"),      // Indigo
emissive: new THREE.Color("#4f46e5"),   // Darker indigo
```

3. Rebuild: `npm run build`

### Scenario 3: Hotspots Pulse Too Fast/Slow

**Problem**: Animation speed doesn't match your preference

**Solution**: Adjust the animation frequency

In `BrainModel.jsx`, find the animation loop (~line 180):
```javascript
const phase = elapsed * 2.5 + (idx * Math.PI) / 1.5;
                      ^^^
                      Change this number
```

- `2.5` = pulse frequency (higher = faster)
- Examples:
  - `1.5` = slow, meditative pulse
  - `2.5` = current (medium)
  - `4.0` = fast, active seizure feel

### Scenario 4: Hotspot Colors Don't Match Your Brand

**Problem**: Red/orange/yellow hotspots clash with your design

**Solution**: Update the color arrays

In `BrainModel.jsx`, find line ~24:
```javascript
const HOTSPOT_COLORS = [
  "#f97316",        // orange - change this
  "#ef4444",        // red
  "#fbbf24",        // yellow
];

const HOTSPOT_EMISSIVES = [
  "#c2410c",        // darker orange
  "#b91c1c",        // darker red
  "#ca8a04",        // darker yellow
];
```

Replace with your colors:
```javascript
const HOTSPOT_COLORS = [
  "#06b6d4",        // cyan
  "#3b82f6",        // blue
  "#8b5cf6",        // purple
];

const HOTSPOT_EMISSIVES = [
  "#0891b2",        // darker cyan
  "#1e40af",        // darker blue
  "#6d28d9",        // darker purple
];
```

### Scenario 5: Brain Rotates Too Fast/Slow

**Problem**: Brain spinning is distracting or too slow

**Solution**: Adjust rotation speed

In `BrainModel.jsx`, find the useFrame rotation code (~line 175):
```javascript
groupRef.current.rotation.y = elapsed * 0.15;
                                       ^^^^
                                       Change this
groupRef.current.rotation.x = Math.sin(elapsed * 0.1) * 0.1;
                                                ^^^
                                                Or this
```

- Y-axis: visible rotation speed
  - `0.08` = very slow (1 rotation per ~80 seconds)
  - `0.15` = current (1 rotation per ~40 seconds)
  - `0.3` = fast (1 rotation per ~20 seconds)
- X-axis: oscillation amount
  - `0.1` = current gentle tilt
  - `0.05` = minimal tilt
  - `0.2` = dramatic rocking motion

---

## Detecting Your GLB Structure

### How to Find Mesh Names

1. **Using Three.js Editor** (easiest):
   - Go to https://threejs.org/editor/
   - Click File → Import
   - Select your GLB file
   - Look at the Scene hierarchy on the left
   - Note down exact names of all meshes

2. **Using a command-line tool**:
```bash
# Install model viewer (one-time):
npm install -g gltf-transform

# Inspect your model:
gltf-transform inspect public/models/brain_epicarehub.glb
# Look for mesh names in the output
```

3. **Programmatically** (in browser console):
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('models/brain_epicarehub.glb', (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      console.log('Mesh name:', child.name);
    }
  });
});
```

### Expected Structure

**Good GLB structure:**
```
Scene
├── Brain (main mesh, high poly)
├── Hotspot_1 (small mesh)
├── Hotspot_2 (small mesh)
└── Hotspot_3 (small mesh)
```

**Also acceptable** (names will be auto-detected):
```
Scene
├── Cortex_Surface
├── Seizure_Zone_A
├── Seizure_Zone_B
└── Seizure_Zone_C
```

**Not ideal** (we'll create synthetic hotspots):
```
Scene
└── Brain_Only (no separate hotspots)
```
→ But still works! Synthetic hotspots will render.

---

## Troubleshooting

### Brain Model Doesn't Load

**Error in console**: `404 brain_epicarehub.glb`

**Fix**:
1. Verify file exists: `ls -la Frontend/public/models/brain_epicarehub.glb`
2. Check spelling and extension (must be `.glb`)
3. Rebuild: `npm run build`

**Error in console**: `Failed to parse GLB` or `Invalid format`

**Fix**:
1. Verify GLB is valid (open in Three.js Editor)
2. Try exporting from Blender with these settings:
   - Format: glTF Binary (.glb)
   - Export: Meshes, Materials, Textures
3. Ensure file size is reasonable (< 50 MB for hero visualization)

### Hotspots Don't Animate

**Check**:
1. Open browser DevTools → Console
2. Look for warnings like: `Hotspot_1 not found`
3. Update `HOTSPOT_NAMES` to match actual mesh names
4. Verify in Three.js Editor that hotspots are separate meshes (not merged)

### Brain Renders Black or Invisible

**Issue**: Likely materials/lighting problem

**Fix**:
1. Verify GLB has materials with color/texture info
2. Try modifying ambient light intensity in `BrainScene()` (~line 60):
```javascript
<ambientLight intensity={1.2} color="#ffffff" /> {/* Increase from 0.6 */}
```
3. Check that brain mesh isn't at (0, 0, 0) scale

### Animation Looks Jerky or Stuttering

**Issue**: Frame rate or animation timing problem

**Check**:
1. Open DevTools → Performance tab
2. Record 3 seconds of animation
3. Check FPS indicator (should be 58-60 FPS)

**If low FPS**:
- Reduce geometry detail in GLB (use decimation in Blender)
- Reduce hotspot count (remove 3rd hotspot)
- Simplify background scene

**If timing looks off**:
- Check that `Date.now()` isn't being used (use `clock` from useFrame)
- Verify no heavy computations in useFrame loop

---

## Performance Tips

### For Large/Complex Brain Models

1. **Decimation** (reduce polygon count):
   - In Blender: Modifiers → Decimate
   - Goal: 20,000-50,000 polygons for hero visualization

2. **Texture Optimization**:
   - Use 1024x1024 or 2048x2048 textures max
   - Compress textures (PNG → WebP if possible)

3. **Material Simplification**:
   - Remove unused texture maps
   - Use basic colors instead of complex shaders

### For Mobile Performance

1. Reduce hotspot count: 2 instead of 3
2. Lower geometry detail: use sphere geometry args `[1, 32, 32]` instead of `[1, 64, 64]`
3. Reduce animation frequency: change `2.5` to `1.5` in pulse calculation

---

## Testing Checklist

After setup, verify:

- [ ] Brain model appears in hero card
- [ ] Brain rotates smoothly (not jerky)
- [ ] Hotspots glow and pulse
- [ ] Colors match your brand
- [ ] No console errors
- [ ] Page loads in < 3 seconds
- [ ] Animation runs at 60 FPS
- [ ] Mobile viewport shows brain correctly
- [ ] Fallback sphere appears if GLB is removed

---

## Getting Help

### Common Questions

**Q: Can I use a different 3D format?**
A: Currently GLB only. Convert other formats (FBX, OBJ) to GLB using Blender or online converters.

**Q: Can I animate hotspots differently?**
A: Yes! Modify the `useFrame` loop in BrainModel.jsx to apply custom animations.

**Q: Can I add interactivity (click hotspots)?**
A: Yes! Add a `useThree` hook to get raycaster and implement click handlers.

**Q: Performance too slow on my device?**
A: Reduce poly count, simplify materials, or decrease animation frequency.

---

## Next Steps

1. ✅ Implementation is complete and ready
2. 📦 Obtain or create your brain GLB model
3. 📁 Place it at: `Frontend/public/models/brain_epicarehub.glb`
4. 🔧 Update hotspot names if needed
5. 🎨 Customize colors/animation speed
6. ✔️ Test and verify everything works

Happy building! 🧠
