## Generator Utility
**Purpose:** 

AnimateCC stores project specific resources in the lib object.  This uses a GUID to uniquely identify the modules resources.

There are 2 points both within the Template module "DOMdocument.xml" project file that require updating to ensure the projects generated GUID is unique.

The attribute attribute on DOMdocument elment itself (see DOMDocument.orig for this example)

    fileGUID="AA3624DA4340E047BE4D8A7FE55450B3" 

Also at the bottom in the "Module Component" parameter data. 
Within the CDATA  the DOMdoc GUID is embedded -

    defaultValue="AA3624DA4340E047BE4D8A7FE55450B3"

This value is passed to the EdForge "Module Component" on initialization by the AnimateCC custom component loader code.