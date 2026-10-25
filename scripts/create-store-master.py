"""Rebuild an editable master from the current website GLB into an editable Blender master.
Run: Blender -b --python scripts/create-store-master.py
Never run this over an edited master; export-store.py handles subsequent exports.
"""
from pathlib import Path
import bpy, math
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / 'authoring/music-store.blend'
if MASTER.exists():
 raise RuntimeError(f'Refusing to overwrite edited master: {MASTER}')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/models/music-store.glb'))
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=1
scene.render.engine='CYCLES'
scene.cycles.samples=32
scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=100
entities={o.get('entityId'):o for o in scene.objects if o.get('entityId')}
# Separate collections make the Outliner useful while preserving imported parenting.
collections={name:bpy.data.collections.new(name) for name in ['Room','Bookshelves','Guitars','Records and Globe','Camera Views','Preview Lighting']}
for collection in collections.values():scene.collection.children.link(collection)
for obj in list(scene.objects):
 ancestors=[];p=obj
 while p:ancestors.append(p);p=p.parent
 ids=[p.get('entityId','') for p in ancestors];names=[p.name for p in ancestors]
 category='Room'
 if 'record_display' in ids:category='Records and Globe'
 elif any(i.startswith('bookshelf_') for i in ids):category='Bookshelves'
 elif any(n.startswith('Display_') for n in names):category='Guitars'
 elif any(n.startswith('Camera_Markers') for n in names):category='Camera Views'
 for collection in list(obj.users_collection):collection.objects.unlink(obj)
 collections[category].objects.link(obj)
# Give the remaining architectural parts meaningful names.
room_meshes=[o for o in collections['Room'].objects if o.type=='MESH']
for obj in room_meshes:
 dimensions=sorted(obj.dimensions)
 if max(obj.dimensions)>20 and dimensions[1]>1:obj.name='Back_Wall'
 elif max(obj.dimensions)>15 and dimensions[1]>1:obj.name='Floor'
 elif max(obj.dimensions)>10:obj.name='Wall_Batten'
 elif obj.dimensions.x>2:obj.name='Guitar_Rail'
for key in ['home','projects']:
 old=entities[f'camera_{key}'];target=entities[f'target_{key}']
 data=bpy.data.cameras.new(f'Camera_{key}');data.sensor_fit='VERTICAL';data.lens=data.sensor_height/(2*math.tan(math.radians(17)));data.clip_start=.01;data.clip_end=100
 cam=bpy.data.objects.new(f'Camera_{key}',data);collections['Camera Views'].objects.link(cam)
 cam.parent=old.parent;cam.matrix_world=old.matrix_world.copy()
 for k in old.keys():cam[k]=old[k]
 cam['fitWidth']=3.0 if key=='home' else 3.4
 cam.rotation_euler=(target.matrix_world.translation-cam.matrix_world.translation).to_track_quat('-Z','Y').to_euler()
 constraint=cam.constraints.new('TRACK_TO');constraint.target=target;constraint.track_axis='TRACK_NEGATIVE_Z';constraint.up_axis='UP_Y'
 bpy.data.objects.remove(old,do_unlink=True);entities[f'camera_{key}']=cam
 target.empty_display_type='SPHERE';target.empty_display_size=.075
 if key=='home':scene.camera=cam
# Preview lighting is deliberately excluded from the website export.
world=bpy.data.worlds.new('Store Preview');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.3,.4,.32,1);world.node_tree.nodes['Background'].inputs[1].default_value=.65;scene.world=world
for name,position,energy,color in [('Warm_Key',(-2.5,-3,4),450,(1,.82,.62)),('Soft_Fill',(3,-3,2),250,(.72,.84,.79))]:
 data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=4;data.color=color
 light=bpy.data.objects.new(name,data);collections['Preview Lighting'].objects.link(light);light.location=position;light.rotation_euler=(Vector((0,1,1))-light.location).to_track_quat('-Z','Y').to_euler();light['previewOnly']=True
for obj in scene.objects:
 if obj.type=='EMPTY':obj.empty_display_size=.06
# Master instructions travel with the .blend.
readme=bpy.data.texts.new('START HERE — Music Store')
readme.write('''Arrange the room by moving the parent objects in the Outliner.
Move Display_ibanez / Display_acoustic to move each guitar with its hangers.
Move Bookshelf_Left / Bookshelf_Right to move a complete shelf and its books.
Crate_1 / Crate_2 / Crate_3 include their individual record sleeves.

Object > Custom Properties > entityId is the stable website identity.
You may rename objects, but keep their entityId values unchanged and unique.
When duplicating an object, give the duplicate a NEW entityId.
Keep interactive objects separate; keep cover surfaces under their record parent.

Camera_home / Camera_projects and their target empties define website views.
The camera tracks its target. Move the target to change the viewing direction.
fitWidth controls the minimum horizontal framing on narrower screens.
Record_Display has visibleIn="home" to match the current guitar view.
Preview lights are Blender-only; website lighting stays controlled by code.

Save this file. From the project directory run: npm run export:store
This validates IDs and exports the SAVED master to public/models/music-store.glb.
The website reloads on refresh; clicks, glow, and record hover are attached in code.
''')
bpy.ops.file.pack_all()
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   area.spaces.active.region_3d.view_perspective='CAMERA'
   area.spaces.active.shading.type='MATERIAL'
bpy.ops.object.select_all(action='DESELECT')
scene.camera.select_set(True);bpy.context.view_layer.objects.active=scene.camera
bpy.ops.wm.save_as_mainfile(filepath=str(MASTER))
print('MASTER_CREATED',MASTER)
