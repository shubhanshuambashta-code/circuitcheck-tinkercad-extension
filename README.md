# CircuitCheck for Tinkercad

Review the connectivity recorded in an exported Tinkercad Circuits board from a Chrome or Edge toolbar popup. Version 0.1 reads EAGLE XML `.brd` files entirely in the browser. There is no build step or server.

## Install

1. Download and extract this repository, or clone it.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Turn on **Developer mode**, select **Load unpacked**, and choose this repository’s `extension` folder.
4. Open **CircuitCheck for Tinkercad** from the extensions menu. Select **Try an example** to see a synthetic circuit report.

## Review your circuit

1. Open your circuit in Tinkercad. Use **Send To** or **Export** to save an EAGLE `.brd` board where that option is available.
2. Open the extension and select **Choose .brd file**. Select the XML board export (up to 5 MB).
3. Review the counts and findings. Each finding identifies the relevant component, pad, or signal. Closing the popup clears the report.

**Export errors** flag duplicate component references, signals that reference a component absent from the export, or pads assigned to multiple signal entries. **Review notes** flag signals with one exported contact and components without exported contacts. These can be intentional or reflect export coverage. The example has three components, two signals, three distinct contacts, and two review notes.

This version checks the exported connectivity only. Simulation, breadboard wiring omitted from the export, footprint pad definitions, routing, and PCB fabrication rules are outside its coverage. The companion [CircuitCheck app](https://github.com/shubhanshuambashta-code/circuitcheck) handles native KiCad projects separately.

The extension processes files locally and does not save them. The `activeTab` permission is used to tailor the import instructions when you open the popup on a Tinkercad circuit. The extension does not inject scripts into Tinkercad.

[Autodesk’s Tinkercad Circuits export overview](https://www.autodesk.com/ca-en/solutions/circuit-design-software) · [Chrome’s unpacked extension guide](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
