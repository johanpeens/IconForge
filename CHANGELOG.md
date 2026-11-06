# Changelog

## Next (not released yet)

- **New set.** Make your own empty set in the library, and fill it with icons from other sets.
- **Copy to / Move to.** Copy or move icons between sets from the library bar or the right-click menu. A name that is taken gets the next free number. The basket follows moved icons.

- **Tidier set names.** A set made in Filled, Double line or Hand-drawn style now shows the style as a small tag, not as extra words in its name (it used to read "Spaceman Hand").
- **"Make more" no longer changes your Style.** Pressing Make 5 more on a hand-drawn set used to leave Step 1 on Hand-drawn, so your next new keywords were drawn hand-drawn and got "hand" in their set name. Your Style, Detail and keywords now stay as you left them.
- **Tap an icon in Preview to adjust just that one.** In Basket > Preview, tap (or drag) an icon, then move it, change its size or turn it to any angle. The other icons are not touched, and the changes go into the font and the zip. The size slider there now only zooms the view ("Zoom all"). The selected icon shows a grid with a clear cross for the middle, and a bigger box beside it with the same grid makes placing it easy.
- **The zip now has the icon font too.** Download as zip makes the font from your basket and puts everything in one zip: an svg folder with the icons (with your edits), and a font folder with the .ttf, .woff and .woff2 files, the .css and preview.html. Before, it had the SVG files only.
- **Make more like this, in the library.** Open a set and press **Make 5 more like this**. Icon Forge draws 5 new icons like the one you ticked (or the first one) and adds them to the same set. If the icon has no saved recipe, it opens the Vary screen so you can check the words first.
- **New set from basket.** A button next to Download as zip (in both Basket tabs) saves the whole basket as a new set in your library, with your edits, your names and the saved recipe. It replaces the older "Save to a set…" button. Typing the name of a set that exists adds the icons to it.
- **Search in Copy to / Move to.** The "Copy or move icons" box now has a **Search sets** box at the top, so you can find a set fast when you have many. A set you already ticked stays ticked, even when the search hides it.
- **Right-click fixes.** The right-click menu is no longer cut off near the bottom of the window, and it now also works on Preview icons and in the full-screen view.
- **View full screen.** A ⤢ button on every icon tile (and right-click → View full screen) opens the icon large in a dialog. Flip through the others with ‹ › or the arrow keys, switch Light/Dark, see the saved recipe, select it or vary it. Basket icons show with their edits.
- **Fine rotation in Step 3.** Turn an icon to any angle: a slider, −1° / −0.1° / +0.1° / +1° buttons, and an exact Angle box. It is saved in the icon edits, so the font, the zip and "Copy SVG with my edits" all get the turned icon. A saved angle looks exactly like the one on screen (checked pixel by pixel).
- **The basket is kept.** Closing the app no longer loses your basket, the icon names, your edits or the font name. They come back at the next start. An icon deleted from the library in the meantime is left out.
- **Finish is next after Pick.** The Pick bar now ends with Finish →, and the optional Edit icons step is a button in the Finish step. "Start a new set" asks before it empties the basket.
- **A simpler screen layout.**
  - **Top bar.** Three steps (Make, Pick, Finish) instead of four. The model status moved onto the gear (a dot shows when the AI model is missing or downloading). The separate Basket chip is gone: the Finish step shows how many icons are in the basket. Steps that are not ready yet say why when you point at them.
  - **Home.** Two tiles (Make new icons, My library). Vary an icon is reached from the library, the full-screen viewer, the right-click menu, or the Vary button on any selected icon.
  - **First start.** One question, not two: the app follows the Windows light or dark theme. Pick a theme yourself in Settings.
  - **Keywords.** Detail and Style are tucked into an Options fold-out (it shows what is chosen). The "start from icons you already have" chips are gone: use the Library.
  - **Bottom bar.** The less common actions (Remove from basket, Copy to, Move to, Delete) are in a More menu, and the extra Back button is gone.
  - **Edit icons.** The move sliders are gone (drag the icon, or use the arrow keys). Turning to any angle is under Fine tune. The step is marked optional.
  - **Basket and font.** One remove button on each icon. The font name sits above the icons instead of in a side panel.
  - **Progress.** One bar per keyword, with a count and how many failed, instead of a bar plus a row of numbered circles.
  - **Preview.** The rotate controls that turned the whole view are removed, because they never changed the font or the zip. Tap one icon to change just that one instead.
  - **Smaller things.** Quieter hover effects. Copy SVG button in the full-screen viewer. The zoom button no longer sits inside the icon button. Settings errors show in the dialog, not in a browser pop-up. The messages say "AI model" everywhere.
- **Quieter start.** A second launch while Icon Forge is already running now does nothing, instead of showing an error box. The start-up splash is no longer see-through and is hidden before it is removed, so no picture of it is left on the desktop.

## 1.1.0

A big update. New screens, new tools, and a smoother first start.

**New**
- **Home screen.** The app opens on three tiles: make new icons, open your library, or vary an icon. Click the logo to come back.
- **Library.** Every icon set you made, with search, open-a-set, select, and add to basket.
- **Vary an icon.** Pick an icon, change the words, and the AI draws new versions next to the original. Start from the words or from the icon's own picture. Edit the full prompt if you like.
- **Recipe saved with every new icon.** The prompt, style, detail, seed, model name and date are stored inside the SVG, so an icon can be varied later. The recipe is left out of copied SVGs and zips.
- **Delete from the library.** Icons or whole sets go to the Windows Recycle Bin, after a question. Nothing is erased for good.
- **Basket Preview tab.** See your icons on a white, grey, dark, black or any colour background, at 16 to 512 px.
- **Download as zip.** One `.zip` of SVG files with your edits applied, optionally painted in the preview colour.
- **Basket checkboxes.** Tick icons (Shift + click for a run) and remove them all at once. Right-click and Step 3 can remove one icon too.
- **Place icons by hand.** In Step 3, drag the icon, or use the arrow keys. It snaps to the centre lines.
- **Delete key** in Clean up mode removes the selected shapes, and a red button in the bottom bar does the same.
- **Back buttons** and **Generate** now live in the bar at the bottom of every screen.

**Better**
- **Filled style** asks for clear white gaps between the parts and a single figure, so filled icons stay readable.
- **Hand-drawn style** asks for visibly wobbly pen strokes, so it looks different from Line.
- **First start** is a two-step guide: pick Light or Dark, then download the AI model. A box says Icon Forge will not work until the model is downloaded.
- The installer adds the **Microsoft Visual C++ runtime** if your PC does not have it, so the image engine starts on a fresh Windows.
- The Icon Forge logo shows in the app header.
- The Edit screen now stacks properly on a narrow window.

**Unchanged**
- Line and Double line drawing wording, the model, and your files and settings.

## 1.0.1

- Installer adds the Microsoft Visual C++ runtime when it is missing.
- Two-step first start (look, then model).
- Download link and README tidied for new users.

## 1.0.0

First public release: type a word, get a set of icons, make an icon font. All on your own PC.
