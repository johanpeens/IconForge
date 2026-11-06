# Step 1: Make (keywords)

Tell Icon Forge what to draw. Each word becomes a set of icons.

![Step 1, empty](images/06-keywords-empty.png)

## Add your words

| Step | What to do |
|---|---|
| 1 | Click the box. Type a word, like `apple pie`. |
| 2 | Press **Enter**. The word appears as a little tag. |
| 3 | Add more words the same way. You can also type `apple pie, scottish terrier` and press Enter. |
| 4 | Made a mistake? Click the **×** on a tag. |

Tip: simple, single things work best. "scottish terrier" works better than "a scottish terrier chasing a ball at night".

![Words added](images/07-keywords-added.png)

## Choose how they look

**Icons per keyword** is always on show. **Detail** and **Style** are hidden under the **Options** line. Click **Options** to open them. The line shows what is chosen now, for example "Options: Medium detail · Line style". The defaults suit most icons.

| Setting | Choices | What it does |
|---|---|---|
| **Icons per keyword** | 1 to 24 (starts at 5) | How many icons you get for each word |
| **Detail** | Simple, Medium, Detailed | Simple has thick lines and few shapes. It is best for small icons. Detailed has fine lines. It is best for big icons, and it is slower. |
| **Style** | Line, Filled, Double line, Hand-drawn | Line is an outline. Filled is a solid shape. Double line is an outline with a thin line inside. Hand-drawn is wobbly and friendly. |

Next to **Icons per keyword** you see how many icons you will get and about how long it takes.

## Press Generate

Press **Generate** in the bar at the bottom. It says how many icons you will get. **← Back** next to it goes back to Home. Now Icon Forge draws.

If the AI model is not installed yet, the bar says so and **Generate** stays off until it is. See [Download the model](Download-the-Model.md).

| What you see | What it means |
|---|---|
| A message at the top of the list | What Icon Forge is doing right now |
| A row for each word | The word, a progress bar and a count such as `3/5`. If some icons did not finish, the count says so, for example `3/5 · 2 failed`. |

![Drawing icons](images/08-generating.png)

### The first icon takes longer

- Icon Forge has to load the 17 GB model first.
- That takes about a minute extra.
- The next icons are quicker.

### Want to stop?

- Press **Stop generating** at the bottom.
- Icons that are already drawn are kept.

## When it is done

- Icon Forge moves you to [Step 2](Step-2-Pick-Icons.md).
- Your icons are saved as SVG files. See [Your files](Your-Files.md).

## Start from icons you already have

Open the [library](Library.md), open a set and pick icons from there. You do not need to draw them again.

## Notes

- Each word gets its own folder. `apple pie` makes a folder called `apple_pie`.
- A style other than Line adds its name: `apple_pie_filled`.
- Drawing more of the same word adds new icons. Old ones are never overwritten.
- Letters, numbers, spaces and dashes work in words. Other characters are removed.
