"""Check that rename/move round trips preserve IDs, and duplicate IDs cannot publish.
Blender -b authoring/music-store.blend --python-exit-code 1 --python scripts/check-store-export.py
Only edits the in-memory test scene, never the saved master.
"""
from pathlib import Path
import bpy, json, math, runpy, struct, sys, tempfile
from mathutils import Matrix, Quaternion, Vector
ROOT=Path(__file__).resolve().parents[1]

def export_to(path):
 old=sys.argv[:]
 def asset_state():
  return ([(o.name,o.data.as_pointer(),[(s.link,s.material.as_pointer() if s.material else None) for s in o.material_slots],
            [(m.name,m.type) for m in o.modifiers]) for o in bpy.context.scene.objects if o.type=='MESH'],
          [(i.name,tuple(i.size),i.filepath) for i in bpy.data.images],
          sorted(m.name for m in bpy.data.materials),len(bpy.data.meshes))
 before=asset_state()
 try:
  sys.argv=['blender','--',str(path)]
  runpy.run_path(str(ROOT/'scripts/export-store.py'),run_name='__main__')
 finally:
  sys.argv=old
  assert asset_state()==before,'Export changed the editable Blender mesh, materials, or textures'

def document(path):
 data=path.read_bytes();size=struct.unpack_from('<I',data,12)[0]
 return json.loads(data[20:20+size])

def world_for(doc,identity):
 nodes=doc['nodes'];parents={child:i for i,n in enumerate(nodes) for child in n.get('children',[])}
 index=next(i for i,n in enumerate(nodes) if n.get('extras',{}).get('entityId')==identity)
 def world(i):
  n=nodes[i]
  if 'matrix' in n:
   values=n['matrix'];local=Matrix([[values[c*4+r] for c in range(4)] for r in range(4)])
  else:
   x,y,z,w=n.get('rotation',[0,0,0,1])
   local=Matrix.LocRotScale(Vector(n.get('translation',[0,0,0])),Quaternion((w,x,y,z)),Vector(n.get('scale',[1,1,1])))
  return world(parents[i])@local if i in parents else local
 return world(index)

with tempfile.TemporaryDirectory(prefix='store-roundtrip-') as directory:
 output=Path(directory)/'test.glb'
 guitar=next(o for o in bpy.context.scene.objects if o.get('entityId')=='guitar_ibanez')
 guitar.name='Renamed in Blender';guitar.location.x+=.2
 guitar.parent.rotation_euler.z+=.13
 bpy.context.view_layer.update()
 position=guitar.matrix_world.translation.copy();expected=Vector((position.x,position.z,-position.y))
 # Static FBX props must retain direct mesh edits after the saved file is reopened.
 # An inherited one-frame FBX action used to silently reset the jukebox's location.
 jukebox=next((o for o in bpy.context.scene.objects if o.get('entityId')=='jukebox'),None)
 has_jukebox=jukebox is not None
 if has_jukebox:
  mesh=next(o for o in jukebox.children_recursive if o.type=='MESH')
  assert not mesh.animation_data or not mesh.animation_data.action,'Static jukebox must not have transform animation'
  mesh['entityId']='jukebox_mesh_roundtrip';mesh.location.x+=.35
  bpy.context.view_layer.update()
  moved=mesh.matrix_world.translation.copy();jukebox_expected=Vector((moved.x,moved.z,-moved.y))
  saved=Path(directory)/'moved.blend'
  bpy.ops.wm.save_as_mainfile(filepath=str(saved))
  bpy.ops.wm.open_mainfile(filepath=str(saved))
  reopened=next(o for o in bpy.context.scene.objects if o.get('entityId')=='jukebox_mesh_roundtrip')
  assert (reopened.matrix_world.translation-moved).length<.0001,'Jukebox move reset when reopening the saved master'
 export_to(output);doc=document(output)
 if has_jukebox:
  assert (world_for(doc,'jukebox_mesh_roundtrip').translation-jukebox_expected).length<.0001,'Saved jukebox move was not exported'
  index=next(n['mesh'] for n in doc['nodes'] if n.get('extras',{}).get('entityId')=='jukebox_mesh_roundtrip')
  triangles=sum(doc['accessors'][p['indices']]['count']//3 for p in doc['meshes'][index]['primitives'])
  assert triangles<=6500,'Jukebox web mesh exceeded its triangle budget'
  web_materials=[m for m in doc['materials'] if m.get('name','').startswith('Jukebox_')]
  assert len(web_materials)==4,'Jukebox lost a material'
  assert all(m.get('alphaMode','OPAQUE')=='OPAQUE' for m in web_materials if 'Titles' in m['name']),'Opaque title artwork should not require blended transparency'
  assert all(m.get('alphaMode')=='BLEND' for m in web_materials if 'Alpha' in m['name']),'Jukebox glass lost its translucency'
 assert (world_for(doc,'guitar_ibanez').translation-expected).length<.0001,'Authored position was not preserved'
 assert any(n.get('name')=='Renamed_in_Blender' or n.get('name')=='Renamed in Blender' for n in doc['nodes'])
 before=output.read_bytes()
 duplicate=bpy.data.objects.new('Duplicate for validation',None);duplicate['entityId']='guitar_ibanez';bpy.context.scene.collection.objects.link(duplicate)
 try:
  export_to(output)
  raise AssertionError('Duplicate ID should have failed')
 except RuntimeError as error:
  assert 'Duplicate' in str(error)
 assert output.read_bytes()==before,'A failed export replaced the working asset'
 print('PASS: renamed and repositioned guitar retains identity and world transform; jukebox mesh moves survive saving/reopening/export; duplicate IDs rejected without replacing asset.')
