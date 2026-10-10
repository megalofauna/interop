# Component properties (not "levers")

## With InteropButton as an example

### Sizing

button[interop-button][itx-size="md|base|null"] { any of those string values are tantamount to one another}

<!--Since interop-button expresses sizes, it must express its med|base|null aspect by default-->
<!--Since interop-button expresses sizes other than the default, it must express a either a smaller or larger aspect, or both -->
<!-- interop-button expresses 3 sizes: sm, md|base|null, lg 

	The sizing tokens file needs to be created to reflect this implementation:

	--itx-size-1: 0.25rem;
	--itx-size-2: 0.5rem;
	--itx-size-3: 0.75rem;
	--itx-size-4: 1rem;
	--itx-size-5: 1.25rem;
	--itx-size-6: 1.5rem;
	--itx-size-8: 2rem;
	--itx-size-10: 2.5rem;
	--itx-size-12: 3rem;

	through

	--itx-size-32
	
-->


<!--Small -->
button[interop-button][itx-size="sm"] {}

<!--Medium -->
button[interop-button][itx-size="md",
button[interop-button][itx-size="base",
button[interop-button][itx-size] {}

<!-- Large-->
button[interop-button][itx-size="lg"] {}

### Shape
<!--interop-button can express any of interop's preset border radius values.
	There are 3 relative sizes: sm, md, lg
	And 3 special cases: none, nominal(2px), full (9999px []or whatever the industry standard value for "full" is these days)

	The radius tokens file needs to be created to reflect this implementation.
	Simplest implementation wins. We'll have more of these tightly-scoped token files to create. 
-->

button[interop-button][itx-radius="none"] {
<!--0px-->
}

button[interop-button][itx-radius="nominal"] {
<!--2px-->
}

button[interop-button][itx-radius="sm"] {
<!--4px-->
}

button[interop-button][itx-radius="md|base|null"] {
<!--8px-->
}

button[interop-button][itx-radius="lg"] {
<!--16px-->
}

button[interop-button][itx-radius="full"] {
<!--9999px-->
}
<!---->
<!--Consumer should always be able to set this itx-radius attribute on any element inside interop-root [set it on app-root] and know exactly what's going to result. 

How far can we get with the implicit plan contained in this document?
Let's go slowly and methodically, but act decisively. 
-->

## Additional Notes
	Button block sizing will be implemented using a height constraint 
 	- sm			= height: 2rem
  - md|base = height: 2.5rem 
  - lg			= height: 3.5rem

	Button inline padding will be configurable, but will express a default ratio of 1.5:1 (as compared to block padding). E.g., if padding-block (implicit, given the height constraint) is 0.75rem, padding-inline would be 1.25rem.

	Button should be able to express the corner-shape property. Default is "sqircle." itx-radius=full should set corner-shape to "round."

	button is subclassified (via this note only for now) as an interactive element. that means it must express stateful aspects:
	- rest (assumed)
	- hover
	- active
	- focus(-visible)

  ## Relationship between CSS styles and component imports
  Consumer should NOT need to import the InteropButton component ts just in order to enjoy the CSS that Interop provides. This rule should be extrapolate to all components. 

  The component file is only required when the consumer chooses to layer in additional InteropButton functionality. At the moment, there is none, so this is future-facing. But for now, CSS is import free. Global under [interop-root].

## Documentation writing style reminder
The Interop documentation writing style is boring. 
- Unadorned, simple, straightforward sentences
- No component history; just always what this does/what this is RIGHT NOW
- Comment sparingly, documenting areas that require implicit knowledge
- Never tell the consumer something she already knows
- Never burden the consumer with past implementation failures we've abondoned
- No personality
- The writing should be transparent, should disappear into the background
