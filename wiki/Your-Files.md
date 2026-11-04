# Your files

Icon Forge keeps everything in normal folders. You can open them, copy them, or back them up.

## Where things are

| What | Where |
|---|---|
| Your icons (SVG) | `Documents\Icon Forge\<word>\` |
| Your fonts | `Documents\Icon Forge\iconfonts\<font name>\` |
| The AI model | `AppData\Roaming\Icon Forge\models\` (or the folder you chose) |
| Your settings | `AppData\Roaming\Icon Forge\settings.json` |

Tip: press **Open icon folder** in [Settings](Settings), or **Show in folder** in the [library](Library), to jump to your icons.

On some PCs, Documents is kept in OneDrive. Then the folder is `OneDrive\Documents\Icon Forge`.

## How icon files are named

| You typed | Folder | Files |
|---|---|---|
| `spaceman` (Line style) | `spaceman` | `spaceman_01.svg`, `spaceman_02.svg`… |
| `spaceman` (Filled style) | `spaceman_filled` | `spaceman_filled_01.svg`… |
| A version made with [Vary](Vary-an-Icon) | the same folder as the original | the next free number |

## The recipe inside each icon

Every icon made by Icon Forge keeps its **recipe** inside the SVG file, in a `<metadata>` block. It holds the prompt, the subject, the style, the detail, the seed, the model name and the date. A version made with Vary also holds the icon it came from.

- The icon still opens in any SVG program. The recipe is invisible.
- The recipe travels with the file when you copy or move it, so you can [vary](Vary-an-Icon) it later.
- Icons made before this feature have no recipe.
- The recipe is **not** included when you right-click **Copy SVG** or **Download as zip**.

## Use icons you already have

- Put a folder of SVG files inside `Documents\Icon Forge`.
- Restart Icon Forge.
- The folder shows in the [library](Library), and under **"Or start from icons you already have"** in Step 1.
- It works best with one-colour icons.

## Delete icons or sets

Use the [library](Library). Deleting moves files to the **Windows Recycle Bin**, so you can restore them. You can also delete folders in Windows yourself.

## Safe to delete?

| Folder | Safe? |
|---|---|
| A word folder in your library | Yes, if you do not need those icons |
| The `iconfonts` folder | Yes. You can make the fonts again. |
| The model folder | Yes, but you will have to download 17.2 GB again |
