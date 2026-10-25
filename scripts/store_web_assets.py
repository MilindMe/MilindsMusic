"""Temporary web assets; the editable Blender master is never downgraded."""
from contextlib import contextmanager
from array import array
from pathlib import Path
import tempfile
import bpy


@contextmanager
def optimized_jukebox(objects):
    parent = next((o for o in objects if o.get('entityId') == 'jukebox'), None)
    if parent is None:
        yield
        return

    originals, meshes, materials, images = [], [], {}, {}
    try:
        with tempfile.TemporaryDirectory(prefix='store-web-textures-') as directory:
            for obj in parent.children_recursive:
                if obj.type != 'MESH':
                    continue
                originals.append((obj, obj.data, [slot.material for slot in obj.material_slots]))
                # Keep UV/material borders and the silhouette while reducing the
                # cabinet to ~6,500 triangles. Existing authored modifiers win.
                obj.data.calc_loop_triangles()
                triangles = len(obj.data.loop_triangles)
                if triangles > 6500 and not obj.modifiers:
                    modifier = obj.modifiers.new('Web simplification', 'DECIMATE')
                    modifier.ratio = 6500 / triangles
                    modifier.delimit = {'UV', 'MATERIAL'}
                    modifier.use_collapse_triangulate = True
                    try:
                        graph = bpy.context.evaluated_depsgraph_get()
                        graph.update()
                        mesh = bpy.data.meshes.new_from_object(
                            obj.evaluated_get(graph), preserve_all_data_layers=True,
                            depsgraph=graph)
                    finally:
                        obj.modifiers.remove(modifier)
                else:
                    mesh = obj.data.copy()
                meshes.append(mesh)
                obj.data = mesh

                for slot in obj.material_slots:
                    original = slot.material
                    if original is None:
                        continue
                    if original not in materials:
                        material = original.copy()
                        material.name = original.name + '_Web'
                        materials[original] = material
                        shader = next((n for n in material.node_tree.nodes
                                       if n.type == 'BSDF_PRINCIPLED'), None)
                        if shader is None:
                            continue
                        # Keep actual glass translucent. Opaque title art should
                        # not enter the transparent queue just because the FBX
                        # connected an unused alpha output to its shader.
                        alpha = shader.inputs['Alpha']
                        if alpha.is_linked:
                            source = alpha.links[0].from_socket
                            if source.node.type == 'TEX_IMAGE' and source.node.image:
                                image = source.node.image
                                pixels = array('f', [0]) * len(image.pixels)
                                image.pixels.foreach_get(pixels)
                                alphas = pixels[3::4]
                                if min(alphas, default=1) >= .999:
                                    material.node_tree.links.remove(alpha.links[0])
                                    alpha.default_value = 1
                                elif sum(.05 < a < .95 for a in alphas) < len(alphas) * .01:
                                    cutout = material.node_tree.nodes.new('ShaderNodeMath')
                                    cutout.operation = 'ROUND'
                                    material.node_tree.links.new(source, cutout.inputs[0])
                                    material.node_tree.links.new(cutout.outputs[0], alpha)
                        else:
                            material.use_backface_culling = True

                        for node in material.node_tree.nodes:
                            if node.type != 'TEX_IMAGE' or node.image is None:
                                continue
                            source = node.image
                            # Base artwork needs more detail than supporting maps.
                            base_links = shader.inputs['Base Color'].links
                            is_base = any(link.from_node == node for link in base_links)
                            has_alpha = any(link.from_socket == node.outputs['Alpha']
                                            for link in material.node_tree.links)
                            limit = 1024 if is_base and original.name.startswith('Jukebox_Main') else 512
                            key = (source, limit, has_alpha)
                            if key not in images:
                                image = source.copy()
                                images[key] = image
                                image.name = source.name + '_Web'
                                if max(image.size) > limit:
                                    ratio = limit / max(image.size)
                                    image.scale(*(max(1, round(s * ratio)) for s in image.size))
                                image.file_format = 'PNG' if has_alpha else 'JPEG'
                                extension = '.png' if has_alpha else '.jpg'
                                path = Path(directory) / f'Jukebox_web_{len(images):02d}{extension}'
                                image.filepath_raw = str(path)
                                # Re-encode pixels: packing alone can retain the
                                # original large PNG rather than the resized image.
                                image.save(filepath=str(path), quality=85)
                                data = path.read_bytes()
                                image.pack(data=data, data_len=len(data))
                            node.image = images[key]
                    slot.material = materials[original]
            yield
    finally:
        # Also restore the live Blender session when the embedded exporter runs.
        for obj, mesh, slots in originals:
            obj.data = mesh
            for slot, material in zip(obj.material_slots, slots):
                slot.material = material
        for mesh in meshes:
            bpy.data.meshes.remove(mesh)
        for material in materials.values():
            bpy.data.materials.remove(material)
        for image in images.values():
            bpy.data.images.remove(image)
