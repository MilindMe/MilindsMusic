"""Add the supplied jukebox to the saved room master, then export the website scene.

Run: Blender -b authoring/music-store.blend --python-exit-code 1 --python scripts/add-jukebox.py
Optional source folder: JUKEBOX_SOURCE=/path/to/jukebox
This is a one-time import; subsequent placement edits belong in the Blender master.
"""
from pathlib import Path
import os
import runpy
import tempfile
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(os.environ.get('JUKEBOX_SOURCE', ROOT.parent / '3d_models/jukebox'))
scene = bpy.context.scene
if any(o.get('entityId') == 'jukebox' for o in scene.objects):
    raise RuntimeError('Jukebox already exists. Edit the Jukebox parent in the master instead.')
if 'Bookshelf_Left' not in scene.objects:
    raise RuntimeError('Open authoring/music-store.blend before running this script.')

existing_images = set(bpy.data.images)
bpy.ops.import_scene.fbx(filepath=str(SOURCE / 'source/Jukebox_01.fbx'), use_anim=False)
fbx_images = set(bpy.data.images) - existing_images
imported = list(bpy.context.selected_objects)
meshes = [o for o in imported if o.type == 'MESH']
if not meshes:
    raise RuntimeError('The jukebox FBX contains no meshes.')

# Rebuild the FBX's broken absolute texture paths as portable glTF PBR materials.
for material in {m for o in meshes for m in o.data.materials if m}:
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    nodes.clear()
    shader = nodes.new('ShaderNodeBsdfPrincipled')
    output = nodes.new('ShaderNodeOutputMaterial')
    links.new(shader.outputs['BSDF'], output.inputs['Surface'])
    prefix = material.name
    diffuse = 'Diffuse' if prefix == 'Jukebox_Main' else 'DiffuseOpacity'
    for suffix, socket in [(diffuse, 'Base Color'), ('Roughness', 'Roughness'),
                           ('Metalic', 'Metallic'), ('Normal', 'Normal'),
                           ('Emission', 'Emission Color')]:
        path = SOURCE / 'textures' / f'{prefix}_{suffix}.png'
        if not path.exists():
            continue
        texture = nodes.new('ShaderNodeTexImage')
        texture.label = suffix
        texture.image = bpy.data.images.load(str(path), check_existing=False)
        if suffix not in (diffuse, 'Emission'):
            texture.image.colorspace_settings.name = 'Non-Color'
        # Keep detailed cabinet artwork, with smaller supporting maps for the web.
        limit = 2048 if prefix == 'Jukebox_Main' and suffix == diffuse else 1024
        if max(texture.image.size) > limit:
            ratio = limit / max(texture.image.size)
            texture.image.scale(*(max(1, round(s * ratio)) for s in texture.image.size))
        # Encode the resized pixels before packing; otherwise Blender may retain
        # the original full-size PNG bytes in the packed image and GLB export.
        with tempfile.TemporaryDirectory(prefix='jukebox-texture-') as directory:
            encoded = Path(directory) / path.name
            texture.image.file_format = 'PNG'
            texture.image.save(filepath=str(encoded))
            data = encoded.read_bytes()
            texture.image.pack(data=data, data_len=len(data))
        if suffix == 'Normal':
            normal = nodes.new('ShaderNodeNormalMap')
            links.new(texture.outputs['Color'], normal.inputs['Color'])
            links.new(normal.outputs['Normal'], shader.inputs[socket])
        else:
            links.new(texture.outputs['Color'], shader.inputs[socket])
        if suffix == diffuse and prefix in ('Jukebox_Alpha', 'Jukebox_Titles'):
            links.new(texture.outputs['Alpha'], shader.inputs['Alpha'])
            material.surface_render_method = 'DITHERED'
        if suffix == 'Emission':
            shader.inputs['Emission Strength'].default_value = .7
    if prefix == 'Jukebox_Titles':
        shader.inputs['Roughness'].default_value = .65

# The FBX leaves unused image datablocks pointing at the author's missing paths.
for image in fbx_images:
    if image.users == 0:
        bpy.data.images.remove(image)

collection = bpy.data.collections.new('Jukebox')
scene.collection.children.link(collection)
parent = bpy.data.objects.new('Jukebox', None)
collection.objects.link(parent)
parent['entityId'] = 'jukebox'
parent['sourceAsset'] = 'jukebox/source/Jukebox_01.fbx'
parent['placementNote'] = 'Floor beneath Bookshelf_Left; move this parent to arrange the cabinet.'
parent.empty_display_type = 'PLAIN_AXES'
parent.empty_display_size = .12
for obj in imported:
    for previous in list(obj.users_collection):
        previous.objects.unlink(obj)
    collection.objects.link(obj)
    if obj.parent not in imported:
        transform = obj.matrix_world.copy()
        obj.parent = parent
        obj.matrix_world = transform

bpy.context.view_layer.update()
points = [o.matrix_world @ Vector(corner) for o in meshes for corner in o.bound_box]
low = Vector(tuple(min(p[k] for p in points) for k in range(3)))
high = Vector(tuple(max(p[k] for p in points) for k in range(3)))
# Fit below the 0.728 m underside of the shelf, with the base on the -0.08 m floor.
height = .76
scale = height / (high.z - low.z)
parent.scale = (scale,) * 3
parent.location = (-1.95 - (low.x + high.x) / 2 * scale,
                   1.94 - high.y * scale,
                   -.08 - low.z * scale)
bpy.context.view_layer.update()

instructions = bpy.data.texts.get('START HERE — Music Store')
if instructions:
    instructions.write('\nJukebox: select the Jukebox parent to move the entire textured cabinet.\n'
                       'It sits on the floor below Bookshelf_Left. Mesh and materials remain editable.\n')
bpy.ops.object.select_all(action='DESELECT')
parent.select_set(True)
bpy.context.view_layer.objects.active = parent
# Avoid external texture dependencies when opening the full scene on another machine.
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'authoring/music-store.blend'))
runpy.run_path(str(ROOT / 'scripts/export-store.py'), run_name='__main__')
print('JUKEBOX_ADDED: editable master saved and website scene exported.')
