/**
 * Site-wide constants shared between components that sit far apart in the tree.
 *
 * This exists for one name. `OpeningSequence` (inside the hero) needs to tell
 * `MusicToggle` (in the root document, beside the edge rail) that the S · D mark
 * has finished clearing, and neither should have to import the other to say so.
 *
 * A DOM CustomEvent carries it instead: the sequence dispatches on `window`, the
 * control listens there. Coupling them through context would mean threading a
 * provider through the whole page for a single notification, and importing the
 * control into the hero to read a constant would drag the audio component into
 * the hero's chunk.
 */
export const SEQUENCE_DONE = "wedding:sequence-done";
