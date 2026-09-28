"""Run with Blender -b <source.blend> --python scripts/export-vinyls.py.
Creates a web asset from the supplied sleeves; leaves the source untouched.
"""
import bpy, math, os
from mathutils import Vector
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
selected = []
for i in range(1, 19):
    obj = bpy.data.objects.get(f'VINYL.{i:03d}')
    if not obj: continue
    obj.data = obj.data.copy()
    lo = Vector(tuple(min(v.co[k] for v in obj.data.vertices) for k in range(3)))
    hi = Vector(tuple(max(v.co[k] for v in obj.data.vertices) for k in range(3)))
    center = (lo + hi) / 2
    for v in obj.data.vertices: v.co -= center
    obj.location = (0, 0, 0)
    obj.rotation_euler = (math.pi / 2, 0, 0)
    obj.scale = (1, 1, 1)
    selected.append(obj)
for image in bpy.data.images:
    if image.size[0] and image.source == 'FILE':
        image.filepath = bpy.path.abspath(image.filepath)
        if max(image.size) > 768:
            ratio = 768 / max(image.size)
            image.scale(round(image.size[0]*ratio), round(image.size[1]*ratio))
        image.pack()
bpy.ops.object.select_all(action='DESELECT')
for obj in selected: obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(root,'public/models/vinyl-sleeves.glb'), export_format='GLB', use_selection=True, export_image_format='JPEG', export_jpeg_quality=82, export_materials='EXPORT', export_yup=True)
print('EXPORTED', len(selected), 'sleeves')
