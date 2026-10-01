# Editing the music store in Blender

`music-store.blend` is the editable master. Its textures are packed into the file.
`public/models/music-store.glb` is the generated website asset. Website lighting,
interactions, navigation, responsive framing, and album/project content remain in code.

## Arrange the room

Use the Outliner to select a parent, then move/rotate/scale it:

| Object | Contents / purpose |
| --- | --- |
| `Display_ibanez`, `Display_acoustic` | Each guitar and its hanger arms |
| `Bookshelf_Left`, `Bookshelf_Right` | Shelves and individually editable books |
| `Crate_1`, `Crate_2`, `Crate_3` | Crate parts and six individual records each |
| `Record_Counter` | Counter top and edge |
| `Globe` | Globe model |
| `Globe_Stand` | Stand top and legs |
| `Guitar_Rack` | The wall rail and its trim |
| `Camera_home`, `Camera_projects` | Website camera positions and field of view |
| `target_home`, `target_projects` | Where each camera looks |

The cameras track their target objects. Moving a target changes the viewing direction.
The website uses the camera's position and field of view and looks at its target.
The `fitWidth` custom property on a camera controls minimum horizontal framing;
phones pull back along that viewing direction to fit the scene. Use camera targets
for orientation; camera roll is not used by the website.

Blender and the website use different lighting/renderers, so use the website for
final appearance checks. Preview lights are excluded from the GLB export.

## Preserve interactions

Under **Object Properties → Custom Properties**, `entityId` is the stable identity.
Names may change freely. Keep existing IDs intact and unique. Duplicating an object
also duplicates its properties: give every duplicated ID a new value before export.

- `guitar_ibanez` / `guitar_acoustic`: hover glow, section navigation, project cards.
- `record_01` through `record_18`: sleeve hover and record cards, mapped in order to
  `recordSlots` in `src/data.js`.
- `globe`, bookshelf IDs, and part IDs: available for future behavior mappings.
- `camera_home`, `target_home`, `camera_projects`, `target_projects`: required view markers.

Keep interactive objects separate. A record's `Cover` mesh has `surface=record_cover`:
the website applies the cover from `src/data.js` while preserving its Blender geometry.
Album/project text and audio are also controlled by the existing data files.

`Record_Display` has `visibleIn=home`, preserving the current behavior of hiding the
counter, records, and globe in the guitar view. Remove that property to keep them
visible in both views, or put it on individual objects to control visibility separately.

Adding a new interactive object requires a unique ID plus a code/data binding.
For another guitar, add a project and an object with `entityId=guitar_<project id>`.
For another record slot, add its data and the next `record_XX` object. Static objects
can be added without changing code. Decorative objects do not need behavior properties.

## Send changes to the website

1. Save `authoring/music-store.blend` in Blender.
2. From the project directory, run `npm run export:store`.
3. Refresh the website. No position edits in JavaScript are required.

Alternatively, in Blender's Scripting workspace, select the embedded **Export Website.py**
text and run it with **Alt+P**. It saves the current master and exports it.

The command exports the file on disk, so save before running it. Export validates ID
uniqueness and required camera markers, preserves transforms and custom properties,
and replaces the website GLB only after validation. Keep the project folder structure
when using the embedded export helper. `BLENDER_PATH` can override the Blender executable.

To hand the changes back, save the master in this folder and tell me it is ready.
I can export it, verify the views, and attach further functionality to its objects.

## Validation

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b authoring/music-store.blend --python-exit-code 1 --python scripts/check-store-export.py
npm run build
```

The round-trip check edits only its in-memory test scene and checks transformed object
identity plus duplicate-ID rejection. It never saves over the master.
