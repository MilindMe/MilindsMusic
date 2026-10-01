import React from 'react';
import ShopScene from './ShopScene';

// The guitar section is a camera destination inside the record store.
export default function GuitarScene(props) {
 return <ShopScene {...props} view="projects"/>;
}
