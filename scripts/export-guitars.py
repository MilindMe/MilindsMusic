"""Export supplied OBJ/FBX guitars as centered, upright GLBs; originals stay untouched.
Run: blender -b --python scripts/export-guitars.py
"""
import bpy, os, math, tempfile, zipfile
from mathutils import Matrix, Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE=os.path.expanduser('~/Desktop/projects/3d_models')
tmp=tempfile.TemporaryDirectory(prefix='side-a-guitars-')
obj_path=os.path.join(tmp.name,'ibanez.obj')
with zipfile.ZipFile(os.path.join(SOURCE,'ibanez-jem-guitar/source/to subs.zip')) as archive:
 with open(obj_path,'wb') as out:out.write(archive.read('to subs.obj'))
assets=[
 ('ibanez',obj_path,'ibanez-jem-guitar',{'base':'to_substance_1001_Diffuse.jpg','normal':'to_substance_1001_Normal.jpg','gloss':'to_substance_1001_Glossiness.jpg'}),
 ('acoustic',os.path.join(SOURCE,'guitar/source/violão.fbx'),'guitar',{'base':'albedo_guitar.png','normal':'normal_map_guitar.png','rough':'rougnhess_guitar.png','metal':'metalic_guitar.png'})
]
for name,path,folder,maps in assets:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 if path.endswith('.obj'): bpy.ops.wm.obj_import(filepath=path)
 else: bpy.ops.import_scene.fbx(filepath=path)
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
 rot=Matrix.Rotation(math.pi/2,4,'Z')@Matrix.Rotation(-math.pi/2,4,'Y') if name=='ibanez' else Matrix.Identity(4)
 for o in objects:
  world=rot@o.matrix_world
  for v in o.data.vertices: v.co=world@v.co
  o.matrix_world=Matrix.Identity(4)
 points=[v.co.copy() for o in objects for v in o.data.vertices]
 lo=Vector(tuple(min(p[k] for p in points) for k in range(3)))
 hi=Vector(tuple(max(p[k] for p in points) for k in range(3)))
 center=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z))
 scale=1.7/(hi.z-lo.z)
 mat=bpy.data.materials.new(name+' / original textures');mat.use_nodes=True
 nodes=mat.node_tree.nodes;links=mat.node_tree.links;shader=nodes.get('Principled BSDF')
 shader.inputs['Roughness'].default_value=.4
 shader.inputs['Metallic'].default_value=.18 if name=='ibanez' else 0
 for kind,filename in maps.items():
  img=bpy.data.images.load(os.path.join(SOURCE,folder,'textures',filename))
  if kind!='base':img.colorspace_settings.name='Non-Color'
  if max(img.size)>1024:
   ratio=1024/max(img.size);img.scale(round(img.size[0]*ratio),round(img.size[1]*ratio))
  img.pack();node=nodes.new('ShaderNodeTexImage');node.image=img
  if kind=='base':links.new(node.outputs['Color'],shader.inputs['Base Color'])
  elif kind=='normal':
   normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.6
   links.new(node.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],shader.inputs['Normal'])
  elif kind=='gloss':
   inv=nodes.new('ShaderNodeInvert');links.new(node.outputs['Color'],inv.inputs['Color']);links.new(inv.outputs['Color'],shader.inputs['Roughness'])
  else:links.new(node.outputs['Color'],shader.inputs['Roughness' if kind=='rough' else 'Metallic'])
 for o in objects:
  for v in o.data.vertices:
   v.co=(v.co-center)*scale
   if name=='ibanez':
    v.co.x=-v.co.x
    v.co.z=1.7-v.co.z
  o.data.materials.clear();o.data.materials.append(mat)
  for poly in o.data.polygons:poly.material_index=0;poly.use_smooth=True
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 out=os.path.join(ROOT,'public/models',name+'.glb')
 bpy.ops.export_scene.gltf(filepath=out,export_format='GLB',use_selection=True,export_image_format='JPEG',export_jpeg_quality=88,export_yup=True)
 print('EXPORTED',name,os.path.getsize(out))
