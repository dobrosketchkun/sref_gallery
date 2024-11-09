## Midjourney sref Gallery

This is the static Midjourney sref gallery. All post information is stored in `data.js`. 

Here's how it looks:

![Main page](misc/rep_imgs/sref_gallery_1.png "Main page")

You can preview posts and images, with each image having a unique URL:

![Image preview](misc/rep_imgs/sref_gallery_4.png "Image preview")

There’s also a search function allowing users to search within titles, prompts, srefs, categories, and tags:

![sref search](misc/rep_imgs/sref_gallery_3.png "sref search")

Regarding categories, you can filter posts by one or multiple categories:

![Category filtering](misc/rep_imgs/sref_gallery_2.png "Category filtering")

## Data Preparation

Now, about the workflow. While you could manually save images and edit `data.js` JSON by hand, this process can be very tedious.

Here’s the approach I use. First, you need to save information about each image generation. For this, I created a [userscript](misc/tampermonkey_mj_downloader.js "userscript") for Tampermonkey that saves both the image and its individual JSON data (use Ctrl + ; or Ctrl + /).

![Data extraction page](misc/rep_imgs/mj_1.png "Data extraction page")

After that, use an auxiliary [tagger web application](misc/category_and_tags) (Python Flask-based):

![Tagger main page](misc/rep_imgs/category_and_tags_1.png "Tagger main page")

You can add tags or categories to the main lists from the main window. Additionally, when editing a specific image, you can select from existing tags and categories, or add new ones on the spot:

![Image tagging](misc/rep_imgs/category_and_tags_2.png "Image tagging")

You can also bulk add categories or tags to multiple images at once:

![Bulk tag editing](misc/rep_imgs/category_and_tags_3.png "Bulk tag editing")
