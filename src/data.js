// Replace the sample collection and prompts with your own albums and reviews.
// Import your own JPG/PNG/WebP here; the same cover appears in 3D, details and player.
import rotationCover from './assets/covers/rotation.svg';
import afterhoursCover from './assets/covers/afterhours.svg';
import discoveriesCover from './assets/covers/discoveries.svg';
import crossbreedbbc from './assets/covers/crossbreed.jpg'
import ledZeppelin from './assets/covers/LedZep1969.jpg'

export const records = [
  { id: 'rotation', 
    cover: rotationCover,
    name: 'Heavy rotation', 
    subtitle: 'The ones I come back to.', 
    tag: 'ON REPEAT', 
    artist: 'Nujabes', 
    album: 'Modal Soul',
    year: '2005', 
    genre: 'Jazz / Hip-hop', 
    color: '#c56539', 
    score: '01', audio: '', 
    review: 'Your review goes here.', 
    prompt: 'What keeps bringing you back? Add a favorite track, a memory, or a few words about how this record makes you feel.' },


  { id: 'afterhours', 
    cover: afterhoursCover,
    name: 'After hours', 
    subtitle: 'For when the world slows down.', 
    tag: 'PAST MIDNIGHT', 
    artist: 'Bon Iver', 
    album: 'For Emma, Forever Ago', 
    year: '2007', genre: 'Indie / Folk', 
    color: '#738882', 
    score: '02', 
    audio: '', 
    review: 'A space for your late-night listening notes.', prompt: 'Tell the story of when you first heard this album, and what you hear in it now.' },
  
    { id: 'discoveries', 
      cover: discoveriesCover,
      name: 'New discoveries', 
      subtitle: 'Good things, recently found.', 
      tag: 'FRESH FINDS', 
      artist: 'Khruangbin', 
      album: 'The Universe Smiles Upon You', 
      year: '2015', 
      genre: 'Psychedelic / Soul', 
      color: '#bca450', 
      score: '03', 
      audio: '', 
      review: 'Every collection starts with a discovery.', prompt: 'Add your review here. What caught your ear? Which track would you share with a friend?' },

    { id: 'ledzep1', 
    cover: ledZeppelin,
    name: 'Led Zeppelin (1969)', 
    subtitle: 'Started it all.', 
    tag: 'ON REPEAT', 
    artist: 'Led Zeppelin', 
    album: 'Led Zeppelin',
    year: '1969', 
    genre: 'Rock', 
    color: '#c56539', 
    score: '01', audio: '', 
    review: 'Your review goes here.', 
    prompt: 'What keeps bringing you back? Add a favorite track, a memory, or a few words about how this record makes you feel.' },

   { id: 'crossbreed', 
    cover: crossbreedbbc,
    name: 'Crossbreed Supersoul (Live at the BBC)', 
    subtitle: 'Maurtian Rock at its greatest.', 
    tag: 'ICONIC', 
    artist: 'Crossbreed Supersoul', 
    album: 'Crossbreed Supersoul (Live at the BBC)',
    year: '2004', 
    genre: 'Rock', 
    color: '#c56539', 
    score: '01', audio: '', 
    review: 'The most iconic mauritian rock band of the 2000s. Give it a try.', 
    prompt: 'What keeps bringing you back? Add a favorite track, a memory, or a few words about how this record makes you feel.' },



];

// replace here to change records
// note : records sorted last to first per row
export const recordSlots = [
 'discoveries', 'afterhours', 'rotation', 'discoveries', 'crossbreed', 'ledzep1',
 'rotation', 'discoveries', 'afterhours', 'rotation', 'discoveries', 'afterhours',
 'afterhours', 'rotation', 'discoveries', 'afterhours', 'rotation', 'discoveries',
];

// Clickable books on the shelves. `entityId` is the book's Blender ID
// (Bookshelf_Left: part_023–part_062, Bookshelf_Right: part_065–part_104).
// Only the bottom rows (part_023–part_042, part_065–part_084) are in the Home camera's frame.
// Add a `cover` import to show artwork in the details card.
export const books = [
  { id: 'hammer',
    entityId: 'part_036',
    title: 'Hammer of the Gods',
    author: 'Stephen Davis',
    year: '1985',
    genre: 'Music / Biography',
    tag: 'BACKSTAGE',
    color: '#8a4b33',
    review: 'Your review goes here.',
    prompt: 'What stayed with you after the last page? Add a favorite passage or why it belongs on this shelf.' },

  { id: 'just-kids',
    entityId: 'part_041',
    title: 'Just Kids',
    author: 'Patti Smith',
    year: '2010',
    genre: 'Memoir',
    tag: 'ON THE NIGHTSTAND',
    color: '#738882',
    review: 'A space for your reading notes.',
    prompt: 'Tell the story of when you first read this, and what you notice in it now.' },

  { id: 'kafka',
    entityId: 'part_066',
    title: 'Kafka on the Shore',
    author: 'Haruki Murakami',
    year: '2002',
    genre: 'Fiction',
    tag: 'REREAD',
    color: '#bca450',
    review: 'Every shelf starts with one book.',
    prompt: 'Add your review here. Which chapter would you hand to a friend?' },

  { id: 'this-is-your-brain',
    entityId: 'part_071',
    title: 'This Is Your Brain on Music',
    author: 'Daniel J. Levitin',
    year: '2006',
    genre: 'Science / Music',
    tag: 'CURIOSITY',
    color: '#4f6b8a',
    review: 'Your review goes here.',
    prompt: 'What changed in how you listen after reading this?' },

  { id: 'chronicles',
    entityId: 'part_026',
    title: 'Chronicles: Volume One',
    author: 'Bob Dylan',
    year: '2004',
    genre: 'Memoir',
    tag: 'LINER NOTES',
    color: '#6b5a3e',
    review: 'Your review goes here.',
    prompt: 'Which page would you dog-ear? Add a line that stuck with you.' },

  { id: 'norwegian-wood',
    entityId: 'part_081',
    title: 'Norwegian Wood',
    author: 'Haruki Murakami',
    year: '1987',
    genre: 'Fiction',
    tag: 'SIDE B',
    color: '#5e7a5a',
    review: 'A space for your reading notes.',
    prompt: 'What song plays in your head when you think of this book?' },
];
