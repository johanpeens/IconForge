# Step 4: Basket and font

Check your icons. Name them. Preview them. Then make the font, or download the icons as a zip.

The basket has two tabs: **Icons** and **Preview**.

## The Icons tab

![Basket and font](images/12-basket.png)

| What you see | What you can do |
|---|---|
| A tile for each icon | Click the **×** or the red **Remove** button to take it out of the basket |
| A name under each icon | Click it and type a new name |
| A small **checkbox** on each tile | Tick several, then remove them all at once (see below) |
| **+ Add more** | Opens the [library](Library) to pick more icons |
| **Download as zip** | Saves all the icons in a `.zip` (see below) |
| **Clear basket** | Takes every icon out of the basket. It asks first. The files stay in your library. |

**Names matter.** The name of each icon becomes its name in your font. `spaceman-01` becomes the class `myicons-spaceman-01`. Use short names with letters, numbers and dashes.

### Remove many at once

1. Tick the small checkbox on the tiles you want to remove. **Shift + click** a second checkbox to tick the whole run between two.
2. A bar appears at the top of the basket: **"3 selected · Select all 10 · Clear selection · Remove 3 from basket"**.
3. Press **Remove N from basket**.

You can also remove one icon by **right-clicking** it and choosing **Remove from basket**. Removing from the basket never deletes a file.

## The Preview tab

See your icons the way they will look. Change the background to check they work on dark pages too.

![The Preview tab](images/22-basket-preview.png)

| Control | What it does |
|---|---|
| **Background** | White, Light grey, Dark or Black. Or pick any colour with **Custom**. |
| **Icon colour** | The colour of the icons. It switches to white on a dark background by itself, until you pick a colour yourself. |
| **Size** slider and the quick buttons **16, 32, 64, 128, 256, 512** | Show the icons small or very large |
| **Use this colour in the zip** | Paints the icons in this colour in the zip file. Off by default. |
| **Download as zip** | Saves the icons as a zip |

The preview only changes how you see the icons here. A font has no colour of its own. You set it with CSS `color`.

## Download as a zip

Press **Download as zip**. Windows asks where to save it. The zip is named after your font (for example `myicons.zip`).

- It holds one `.svg` file for each icon, named like the icon in your basket.
- **Your edits are applied** (flips, size, position, deleted shapes).
- Two icons with the same name get `-2`, `-3` and so on.
- The saved prompt is **not** put in the files.
- With **Use this colour in the zip** ticked, the icons are painted in the preview colour.

## Make the font

| Step | What to do |
|---|---|
| 1 | In the **Font** box, type a name, like `myicons`. |
| 2 | Look at "Classes will look like…". That is how you will use it. |
| 3 | Press **Create font from N icons** at the bottom. |

It takes a few seconds. **← Back** in the same bar goes back to [Step 3](Step-3-Edit-SVGs).

## When it is done

A green box says **"Font created"**.

![Font created](images/13-font-created.png)

| Button | What it does |
|---|---|
| **Open preview.html** | Opens a page that shows every icon. You can search, resize and change colour. Click an icon to copy its class. |
| **Open folder** | Opens the folder with your font files |
| **Start a new set** | Clears the basket so you can begin again |

The box also shows two lines of code you can copy. See [Use your font](Use-Your-Font).

![The preview page](images/14-font-preview.png)

## Copy a single icon

You do not need a font to use an icon. **Right-click** any icon (in the library, step 2, 3 or 4) and choose:

| Choice | What you get on the clipboard | Paste it into |
|---|---|---|
| **Copy SVG** | The SVG code of the original icon | A code editor, a website, Figma, Illustrator |
| **Copy SVG with my edits** | The SVG code with your flips, size and deletions (shown only if you edited the icon) | The same places |
| **Copy as picture (PNG)** | A 512 px picture on a white background | Word, Slides, email, chat |

A small message says **"copied to clipboard"**. Then press **Ctrl+V** where you want it. The saved prompt is not included.

![Right-click menu](images/15-copy-svg.png)
