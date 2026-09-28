# Side A

A quiet 3D record shop with an expanding navigation rail, built with React, Vite, and Three.js.

## Development

```sh
npm install
npm run dev
```

Build with `npm run build`; serve with `npm run preview`.

## Structure

- `src/main.jsx`: icon sidebar, hash navigation, loading/retry states.
- `src/ShopScene.jsx`: lighting, wooden crates, model loading, camera, and picking.
- `src/styles.css`: fullscreen scene and responsive sidebar.
- `public/models/vinyl-sleeves.glb`: 18 textured sleeves from the supplied “50+1 vinyls” Blender asset, with textures capped at 768px.

Home contains only the scene and icon controls. The short navigation rail sits halfway down the left edge and expands on hover or keyboard focus; touch devices have an explicit toggle. Home, Projects, Memories, and Resume use hash URLs that support history and refresh. Projects opens the guitar shop; Resume is an empty destination awaiting content. Project descriptions remain marked placeholders until supplied.

Drag to look around and reset with the corner icon. Hover an individual sleeve to lift it, then click to open its listening notes. Tab and Enter provide keyboard selection. Escape closes the card and returns focus to the sleeve. Cover images are applied over the supplied sleeve geometry.

The supplied asset contains sleeves and vinyl geometry, not a separate box mesh. The wooden crates and room are built in Three.js. The original asset is untouched. To regenerate the optimized model, extract the source archive alongside its `maps` directory, then run:

```sh
blender -b '/path/to/50+1 vinyls.blend' --python scripts/export-vinyls.py
```

The scene renders only when loading, resizing, or interacting and disposes GPU resources on unmount. Hover movement and sidebar transitions respect reduced-motion preferences. Loading and failure controls have accessible labels without visible copy.

## Music player and collection cards

The glass player stays centered at the bottom of every page. It includes play/pause, previous and next, shuffle, repeat, seek, mute, and volume controls. Add a local audio file under `public/audio`, then set a record's `audio` field in `src/data.js` to a public path such as `/audio/my-track.mp3`. Controls stay disabled when no audio has been added, so the sample album names never imply that copyrighted music is bundled with the site.

Clicking a record sleeve opens its listening card. **Play me** closes the card, sends its cover and album details to the persistent player, and starts its configured audio. Albums without audio still load into the player with “Audio coming soon.” Clicking a guitar opens its project card. Both use native modal dialogs with Escape and backdrop closing. Record copy is edited in `src/data.js`; project copy is edited in `src/projects.js`.

### Change covers and albums

Put a square JPG, PNG, WebP, or SVG in `src/assets/covers/`, import it at the top of `src/data.js`, and assign it to the album's `cover` field:

```js
import myCover from './assets/covers/my-album.jpg';
// In the records array:
// { id: 'my-album', cover: myCover, album: 'Album title', artist: 'Artist',
//   audio: '/audio/my-track.mp3', ...other listening-note fields }
```

That one image updates the 3D sleeve, details card, and player. The bundled abstract covers are editable placeholders, not the named albums' official artwork. Prefer square images around 1024px. Alternatively, put an image in `public/covers` and use `cover: '/covers/my-album.jpg'` without an import. No upload service is needed.

The `recordSlots` array at the bottom of `src/data.js` maps individual sleeves to record IDs: six per rack, back to front, with racks ordered left to right. The initial 18 sleeves repeat the three sample albums. Add unique records to `records` and replace these IDs to curate the collection; keep 18 slots for the current three-rack layout.

### Memories

Memories lazy-loads `public/models/psp.glb`, converted from the supplied Sony PSP model with its original textures. Drag the PSP to rotate it, or focus its canvas and use arrow keys. The monochrome dot background responds to pointer movement; reduced-motion preferences keep it static. Rendering happens on interaction rather than in a continuous animation loop. Navigation disposes the scene's GPU resources while the music player keeps its current track.

To regenerate the model from `~/Desktop/projects/3d_models/sony-psp`:

```sh
blender -b --python scripts/export-psp.py
```

## Guitar shop / projects

The Projects destination loads the supplied Ibanez JEM and acoustic guitar models on a wooden wall rack. Click an instrument to open project details. Invisible focusable controls keep the instruments accessible from the keyboard; the details dialog traps focus, closes with Escape or its close button, and returns focus to the selected instrument.

Edit `src/projects.js` to map each instrument to a project: title, category, summary, description, role, technologies, and optional links (`{label, url}`). Current descriptions are explicitly marked placeholders. Add another entry with a GLB model URL to extend the rack; spacing and camera framing follow the number of instruments. Models should be centered horizontally, stand upright along Y, and measure 1.7 units high with their base at zero. Use `rotation` for any horizontal facing correction and `hangerWidth` to fit a different neck width.

`src/GuitarScene.jsx` owns the rack, lighting, hit testing, and loading. `src/ProjectDetails.jsx` renders the accessible details dialog. Guitars are loaded only when visiting Projects and resources are disposed when leaving.

The two original assets are converted by `scripts/export-guitars.py`, including reconnecting their supplied textures, correcting orientation, and reducing textures to 1024 pixels. The GLBs total about 2 MB. Regenerate them using Blender:

```sh
blender -b --python scripts/export-guitars.py
```

The script expects the supplied archives and textures under `~/Desktop/projects/3d_models` and leaves them untouched.
