"""Convert the supplied vintage globe to a compact, textured web asset."""
import bpy, os
from mathutils import Vector
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
source = os.path.expanduser('~/Desktop/projects/3d_models/vintage-globe')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=source+'/source/Globus.obj', forward_axis='NEGATIVE_Z', up_axis='Y')
# The separate plane is a baked shadow card; the room supplies real shadows.
for obj in list(bpy.context.scene.objects):
 if obj.name.startswith('Plane'): bpy.data.objects.remove(obj, do_unlink=True)
objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for obj in objects:
 mat = bpy.data.materials.new(obj.name); mat.use_nodes = True
 nodes, links = mat.node_tree.nodes, mat.node_tree.links
 shader = nodes.get('Principled BSDF')
 prefix = 'wire_135110008' if obj.name.startswith('Plane') else 'Globe'
 for kind, socket in [('BaseColor','Base Color'),('Roughness','Roughness'),('Metallic','Metallic'),('Normal','Normal')]:
  path = f'{source}/textures/{prefix}_{kind}.jpg'
  if not os.path.exists(path): continue
  img = bpy.data.images.load(path)
  if kind != 'BaseColor': img.colorspace_settings.name = 'Non-Color'
  if max(img.size)>1024:
   ratio=1024/max(img.size); img.scale(round(img.size[0]*ratio),round(img.size[1]*ratio))
  img.pack(); tex = nodes.new('ShaderNodeTexImage'); tex.image=img
  if kind == 'Normal':
   normal=nodes.new('ShaderNodeNormalMap'); links.new(tex.outputs['Color'],normal.inputs['Color']); links.new(normal.outputs['Normal'],shader.inputs[socket])
  else: links.new(tex.outputs['Color'],shader.inputs[socket])
 obj.data.materials.clear(); obj.data.materials.append(mat)
 for face in obj.data.polygons: face.material_index=0
points=[o.matrix_world @ v.co for o in objects for v in o.data.vertices]
low=Vector(tuple(min(p[k] for p in points) for k in range(3)))
high=Vector(tuple(max(p[k] for p in points) for k in range(3)))
center=Vector(((low.x+high.x)/2,(low.y+high.y)/2,low.z))
for obj in objects:
 transform=obj.matrix_world.copy()
 for v in obj.data.vertices: v.co=(transform @ v.co-center)/(high.z-low.z)
 obj.matrix_world.identity()
bpy.ops.export_scene.gltf(filepath=root+'/public/models/globe.glb',export_format='GLB',export_image_format='JPEG',export_jpeg_quality=85)
