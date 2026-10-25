"""Export the saved Blender master, preserving object transforms and custom IDs.
Run through `npm run export:store`, or inside Blender's Scripting workspace.
"""
from pathlib import Path
import bpy, json, os, struct, sys
ROOT=Path(__file__).resolve().parents[1]
# Optional CLI output lets validation tests export a temporary copy.
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
output=Path(args[0]) if args else ROOT/'public/models/music-store.glb'
objects=[o for o in bpy.context.scene.objects if not o.get('previewOnly') and o.type!='LIGHT']
ids={}
for obj in objects:
 identity=obj.get('entityId')
 if identity:
  if not isinstance(identity,str) or identity in ids:raise RuntimeError(f'Duplicate or invalid entityId: {identity} ({obj.name})')
  ids[identity]=obj
for identity in ['camera_home','target_home','camera_projects','target_projects']:
 if identity not in ids:raise RuntimeError(f'Missing required marker: {identity}')
for obj in objects:
 if obj.get('behavior') in ['guitar','record'] and not obj.get('entityId'):raise RuntimeError(f'Interactive object needs entityId: {obj.name}')
for identity in ['camera_home','camera_projects']:
 camera=ids[identity]
 if camera.type!='CAMERA':raise RuntimeError(f'{identity} must remain a camera')
 if camera.get('fitWidth',0)<=0:raise RuntimeError(f'{identity} needs a positive fitWidth')
# Restore selection after export when run in an interactive Blender session.
selection=list(bpy.context.selected_objects);active=bpy.context.view_layer.objects.active
output.parent.mkdir(parents=True,exist_ok=True)
temporary=output.with_name(output.stem+'.exporting.glb')
try:
 bpy.ops.object.select_all(action='DESELECT')
 for obj in objects:obj.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(temporary),export_format='GLB',use_selection=True,
  export_extras=True,export_cameras=True,export_lights=False,export_animations=False,
  export_yup=True,export_image_format='AUTO')
 # Validate the actual artifact before replacing the working website asset.
 data=temporary.read_bytes();length=struct.unpack_from('<I',data,12)[0]
 document=json.loads(data[20:20+length]);exported=[n.get('extras',{}).get('entityId') for n in document['nodes']]
 missing=set(ids)-set(exported)
 if missing:raise RuntimeError(f'Export lost object IDs: {sorted(missing)}')
 os.replace(temporary,output)
 print(f'STORE_EXPORTED {output} ({len(ids)} stable IDs, {len(data):,} bytes)')
finally:
 if temporary.exists():temporary.unlink()
 bpy.ops.object.select_all(action='DESELECT')
 for obj in selection:obj.select_set(True)
 bpy.context.view_layer.objects.active=active
