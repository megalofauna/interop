[**Interop v0.1.0**](../index.md)

# InteropList

Render semantic lists from any iterable source.

<style>
.works-with ul {
display: flex !important;
list-style: none;
padding: 0;
margin: 0;


}
</style>

Works seamlessly with

<div class="works-with" markdown>
- InteropCollection
- InteropTheme
- InteropTemplate
- AttributesManagerService
- TrackBy*
</div>

## Selectors

`ol[interop-list], ul[interop-list], dl[interop-list], interop-list`

InteropList enhances HTML lists (`<ol>`, `<ul>`, `<dl>`) and custom elements (`<interop-list>`) by rendering items from any iterable source, such as arrays, sets, or maps. It supports dynamic updates and efficient rendering through track-by keys.

## Protects against
