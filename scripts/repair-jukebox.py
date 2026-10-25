"""Remove imported jukebox animation while retaining its current transform.

Run in Blender's Scripting workspace with the room open. This repairs the live
session, so it is also safe when a stale open session restored the FBX action.
Save the master afterwards. This script does not save or export automatically.
"""
import bpy

parent = next(o for o in bpy.context.scene.objects if o.get('entityId') == 'jukebox')
actions = set()
for obj in [parent, *parent.children_recursive]:
    if obj.animation_data:
        if obj.animation_data.action:
            actions.add(obj.animation_data.action)
        transform = obj.matrix_basis.copy()
        obj.animation_data_clear()
        obj.matrix_basis = transform
for action in actions:
    if action.users - int(action.use_fake_user) == 0:
        bpy.data.actions.remove(action)
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
parent.select_set(True)
bpy.context.view_layer.objects.active = parent
print('Jukebox animation removed. Move Jukebox, then save the Blender file.')
