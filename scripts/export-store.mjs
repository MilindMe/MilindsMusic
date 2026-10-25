import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const blender=process.env.BLENDER_PATH || (existsSync('/Applications/Blender.app/Contents/MacOS/Blender')?'/Applications/Blender.app/Contents/MacOS/Blender':'blender');
const result=spawnSync(blender,['-b',path.join(root,'authoring/music-store.blend'),'--python-exit-code','1','--python',path.join(root,'scripts/export-store.py')],{stdio:'inherit'});
if(result.error)console.error(result.error.message);
process.exit(result.status??1);
