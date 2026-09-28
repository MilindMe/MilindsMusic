"""Extract the supplied PSP archive and export a textured, centered web model."""
import bpy, os, math, tempfile, subprocess
from mathutils import Matrix, Vector
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
source = os.path.expanduser('~/Desktop/projects/3d_models/sony-psp')
with tempfile.TemporaryDirectory() as tmp:
 subprocess.run(['tar', '-xf', source + '/source/PSP_Model.7z', '-C', tmp], check=True)
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.fbx(filepath=tmp + '/psp_low_final.fbx')
 objects = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name != 'ground']
 # The source is posed at 45 degrees; stand the screen upright.
 rotation = Matrix.Rotation(math.pi / 4, 4, 'X')
 for obj in objects:
  transform = rotation @ obj.matrix_world
  for vertex in obj.data.vertices: vertex.co = transform @ vertex.co
  obj.matrix_world = Matrix.Identity(4)
 points = [v.co.copy() for o in objects for v in o.data.vertices]
 low = Vector(tuple(min(p[k] for p in points) for k in range(3)))
 high = Vector(tuple(max(p[k] for p in points) for k in range(3)))
 center = (low + high) / 2
 material = bpy.data.materials.new('PSP / original textures'); material.use_nodes = True
 nodes, links = material.node_tree.nodes, material.node_tree.links
 shader = nodes.get('Principled BSDF')
 for kind, socket in [('albedo','Base Color'),('roughness','Roughness'),('metallic','Metallic'),('normal','Normal'),('emissive','Emission Color')]:
  path = source + '/textures/sony_psp_' + kind + ('.png' if kind == 'normal' else '.jpeg')
  img = bpy.data.images.load(path)
  if kind not in ['albedo','emissive']: img.colorspace_settings.name = 'Non-Color'
  if max(img.size) > 1536:
   ratio = 1536 / max(img.size); img.scale(round(img.size[0]*ratio), round(img.size[1]*ratio))
  img.pack(); node = nodes.new('ShaderNodeTexImage'); node.image = img
  if kind == 'normal':
   normal = nodes.new('ShaderNodeNormalMap'); links.new(node.outputs['Color'],normal.inputs['Color']); links.new(normal.outputs['Normal'],shader.inputs[socket])
  else: links.new(node.outputs['Color'],shader.inputs[socket])
 shader.inputs['Emission Strength'].default_value = .35
 bpy.ops.object.select_all(action='DESELECT')
 for obj in objects:
  for vertex in obj.data.vertices: vertex.co = (vertex.co - center) * (3 / (high.x-low.x))
  obj.data.materials.clear(); obj.data.materials.append(material)
  for face in obj.data.polygons: face.material_index = 0
  obj.select_set(True)
 bpy.ops.export_scene.gltf(filepath=root+'/public/models/psp.glb', export_format='GLB', use_selection=True, export_image_format='JPEG', export_jpeg_quality=88)
