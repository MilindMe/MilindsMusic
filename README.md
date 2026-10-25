# MilindsMusic — Side A

An interactive website that tells you a bit more about me.

A quiet 3D record shop with an expanding navigation rail, built with React, Vite, and Three.js.

## Development

```sh
npm install
npm run dev
```

Build with `npm run build`; serve with `npm run preview`.

## Blender master

The store layout now lives in [`authoring/music-store.blend`](authoring/music-store.blend). Move objects in Blender, save, run `npm run export:store`, and refresh the website. Stable `entityId` custom properties preserve interactions across object moves and renames. See [the editing guide](authoring/README.md) for groups, cameras, object IDs, and the Blender export button script.

## Structure

- `src/main.jsx`: icon sidebar, hash navigation, loading/retry states.
- `src/ShopScene.jsx`: master scene loading, ID-based behavior bindings, lighting, cameras, and picking.
- `authoring/music-store.blend`: editable room, objects, packed textures, and camera views.
- `public/models/music-store.glb`: exported master scene consumed by the website.
- `src/styles.css`: fullscreen scene and responsive sidebar.
- `public/models/vinyl-sleeves.glb`: 18 textured sleeves from the supplied “50+1 vinyls” Blender asset, with textures capped at 768px.

Home contains only the scene and icon controls. The short navigation rail sits halfway down the left edge and expands on hover or keyboard focus; touch devices have an explicit toggle. Home, Projects, Memories, and Resume use hash URLs that support history and refresh. Projects opens the guitar shop; Resume contains a Mauritius origin card and placeholders for experience, education, and skills. Project descriptions remain marked placeholders until supplied.

Drag to look around and reset with the corner icon. Hover an individual sleeve to lift it, then click to open its listening notes. Tab and Enter provide keyboard selection. Escape closes the card and returns focus to the sleeve. Cover images are applied over the supplied sleeve geometry.

The supplied asset contains sleeves and vinyl geometry, not a separate box mesh. The wooden crates and room were initially built in Three.js and are now editable meshes in the Blender master. The original asset is untouched. To regenerate the optimized model, extract the source archive alongside its `maps` directory, then run:

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

Edit `src/projects.js` to map each instrument to a project: title, category, summary, description, role, technologies, and optional links (`{label, url}`). Current descriptions are explicitly marked placeholders. To add another instrument, add its project entry and a separate object in the Blender master with `entityId=guitar_<project id>`, then position it and export the room. Models should be centered horizontally, stand upright along Y, and measure 1.7 units high with their base at zero. The legacy source fields `model`, `rotation`, and `hangerWidth` are retained as source-asset metadata; current placement, orientation, and hangers are edited in Blender.

`src/ShopScene.jsx` owns the shared room, rack, lighting, hit testing, and loading; `src/GuitarScene.jsx` is a compatibility wrapper for the guitar view. `src/ProjectDetails.jsx` renders the accessible details dialog. Home and Projects share a loaded scene; moving between them animates the camera without reloading the models. Resources are disposed when leaving the room.

The two original assets are converted by `scripts/export-guitars.py`, including reconnecting their supplied textures, correcting orientation, and reducing textures to 1024 pixels. The GLBs total about 2 MB. Regenerate them using Blender:

```sh
blender -b --python scripts/export-guitars.py
```

The script expects the supplied archives and textures under `~/Desktop/projects/3d_models` and leaves them untouched.

## Shared room and loading screen

The guitars hang between the rear bookshelves and glow softly on hover. Select one from Home to travel to Projects; select it again in the guitar view to open its project card. The guitar camera crops the outside of both bookshelves. The vintage globe sits on a small stand behind the right side of the vinyl counter.

Every route change, including Resume and browser history, shows a neutral green-gray splash with a guitar silhouette filling as model and texture loading completes. A matching HTML placeholder appears before JavaScript starts. Home ↔ Projects transitions play a fast camera flight with a temporary field-of-view pulse, then show the splash before revealing the destination. The white “← Back” link at the top left of Projects flies back to Home. A temporary SVG overlay adds psychedelic guitar outlines, wavy ribbons, rippling contours, and starbursts during these flights; the return flight reverses the expanding shapes. It clears before the splash and is hidden for reduced-motion preferences. Reduced-motion preferences disable the camera animation.

Regenerate the globe from `~/Desktop/projects/3d_models/vintage-globe` with:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --python scripts/export-globe.py
```

The exporter reconnects the supplied textures, removes the baked shadow card, normalizes the globe to one unit tall, and writes `public/models/globe.glb`.

## Globe journey and cursor

The native orange circle cursor uses a small SVG cursor image, with no JavaScript tracking or trailing animation. Fine pointers get the custom cursor; touch devices retain their normal behavior.

Click the globe (or focus its keyboard target and press Enter) to pulse a red Mauritius regional marker for 4.1 seconds, then fly into the globe with a plane, flight route, globe grid, and tropical island overlay. The guitar loading splash leads into Resume. Escape, selecting another object, camera reset, and route changes cancel the pending trip. Reduced-motion preferences keep the marker static and skip the flight.

The marker uses the lower-right visible globe face as an approximate starting position. For exact placement after Blender edits, add an empty with `entityId=mauritius` on the globe surface and export; the website will use its position. Resume placeholder content lives in `src/ResumePage.jsx`.
