# Horizon's default product template

`templates/product.json` belongs to the Horizon theme, not to us. It was
overwritten on the staging theme while the Manual Manipulators page was being
built there, which made every other product render that page.

`horizon-default-product-template.json` in this folder is the live theme's own
copy of it, read back and verified byte for byte:

    md5 2c4c8656f4b99fee81eceb3ce40da6c0, 25089 bytes

It is kept here, rather than under `templates/`, because it is the theme's file
and should not look like one of ours. It exists so the staging theme's default
can be restored without reading the live theme again:

    themeFilesUpsert templates/product.json <- this file

The SemiProbe product page now lives at
`templates/product.manual-manipulators.json`, which applies to nothing until a
product is pointed at it.
