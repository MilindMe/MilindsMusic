// Add a project here and a Blender object with entityId="guitar_<id>" to add an instrument.
// Layout lives in authoring/music-store.blend; model/rotation/hangerWidth describe the source assets.
// Replace the placeholder copy with your own project information and links.
export const projects = [
 {
  id: 'ibanez', instrument: 'Ibanez JEM', model: '/models/ibanez.glb',
  title: 'Your first project', category: 'Project placeholder',
  summary: 'This guitar is ready to tell the story of a project you’ve built.',
  description: 'Add the idea behind the project, the problem you wanted to solve, and what you made.',
  role: 'Add your role and contribution.',
  technologies: [], links: [], rotation: 0, hangerWidth: 0.11,
 },
 {
  id: 'acoustic', instrument: 'Acoustic guitar', model: '/models/acoustic.glb',
  title: 'Your next project', category: 'Project placeholder',
  summary: 'A space for another idea, experiment, or piece of work.',
  description: 'Share what you explored, the decisions you made, and what you learned along the way.',
  role: 'Add your role and contribution.',
  technologies: [], links: [], rotation: 0, hangerWidth: 0.11,
 },
];
