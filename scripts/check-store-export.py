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
 try:
  sys.argv=['blender','--',str(path)]
  runpy.run_path(str(ROOT/'scripts/export-store.py'),run_name='__main__')
 finally:sys.argv=old

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
 export_to(output);doc=document(output)
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
 print('PASS: renamed and repositioned guitar retains identity and world transform; duplicate IDs rejected without replacing asset.')
