let currentPage = 1;
const itemsPerPage = 6;
let filteredPosts = [...galleryData.posts];

// Initialize unique categories from all posts
const allCategories = [...new Set(galleryData.posts.flatMap(post => post.categories))];

// Mapping of category names to their corresponding buttons
const categoryButtons = {};

// Populate category filters
const categoryFiltersContainer = document.getElementById('categoryFilters');
allCategories.forEach(category => {
    const button = document.createElement('button');
    button.className = 'category-filter';
    button.textContent = category;
    button.addEventListener('click', () => toggleCategoryFilter(button, category));
    categoryFiltersContainer.appendChild(button);
    categoryButtons[category] = button;
});

// Enhanced search functionality
const searchInput = document.getElementById('search');
searchInput.addEventListener('input', debounce(handleSearch, 300));

function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    applyFilters(searchTerm);
}

// Clipboard functionality
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        button.classList.add('copied');
        const originalContent = button.innerHTML;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = originalContent;
        }, 2000);
    });
}

// Category Filter functionality
let activeCategories = new Set();

function toggleCategoryFilter(button, category) {
    button.classList.toggle('active');
    if (activeCategories.has(category)) {
        activeCategories.delete(category);
    } else {
        activeCategories.add(category);
    }

    applyFilters(searchInput.value.toLowerCase());
}

// Apply Filters (Search and Categories)
function applyFilters(searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    filteredPosts = galleryData.posts.filter(post =>
        (activeCategories.size === 0 || post.categories.some(cat => activeCategories.has(cat))) &&
        (
            searchTerm === "" ||
            // Search over specific fields in post
            [
                post.title,
                post.sref.join(' '),
                post.tags.join(' '),
                post.categories.join(' ')
            ].some(field => field.toLowerCase().includes(lowerSearchTerm)) ||
            // Search over specific fields in images
            post.images.some(image =>
                [
                    image.prompt,
                    image.sref.join(' '),
                    image.tags.join(' ')
                ].some(field => field.toLowerCase().includes(lowerSearchTerm))
            )
        )
    );
    currentPage = 1;
    renderGallery();
}

// Popup functionality
let currentPopupPost = null;
let currentPopupImageIndex = 0;
let isZoomed = false;

function openPopup(post, imageIndex = 0, pushState = true) {
    currentPopupPost = post;
    currentPopupImageIndex = imageIndex;
    isZoomed = false;

    const popup = document.getElementById('popup');
    const popupImage = document.getElementById('popupImage');
    const popupInfo = document.getElementById('popupInfo');
    const popupTitle = document.getElementById('popupTitle');

    popupTitle.textContent = post.title;
    popupImage.src = post.images[currentPopupImageIndex].url;
    popupImage.alt = post.images[currentPopupImageIndex].title;

    // Build popupInfo content using DOM methods
    buildPopupInfo(post, currentPopupImageIndex);

    // Add navigation arrows
    addNavigationArrows();

    // Add click listener for zooming
    popupImage.addEventListener('click', toggleZoom);

    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Update URL and history state
    if (pushState) {
        const url = `?postId=${post.postId}&imageIndex=${currentPopupImageIndex}`;
        history.pushState({ postId: post.postId, imageIndex: currentPopupImageIndex }, '', url);
    }
}

function closePopup(pushState = true) {
    const popup = document.getElementById('popup');
    const popupImage = document.getElementById('popupImage');
    popup.style.display = 'none';
    document.body.style.overflow = 'auto';
    removeNavigationArrows();
    currentPopupPost = null;
    currentPopupImageIndex = 0;
    isZoomed = false;
    popupImage.classList.remove('zoomed');
    // Remove zoom click listener
    popupImage.removeEventListener('click', toggleZoom);

    // Update URL and history state
    if (pushState) {
        history.pushState(null, '', window.location.pathname);
    }
}

// Navigation arrows
function addNavigationArrows() {
    const popupContent = document.querySelector('.popup-content');

    const prevArrow = document.createElement('button');
    prevArrow.className = 'nav-arrow prev-arrow';
    prevArrow.innerHTML = '&#10094;';
    prevArrow.onclick = showPreviousImage;

    const nextArrow = document.createElement('button');
    nextArrow.className = 'nav-arrow next-arrow';
    nextArrow.innerHTML = '&#10095;';
    nextArrow.onclick = showNextImage;

    popupContent.appendChild(prevArrow);
    popupContent.appendChild(nextArrow);
}

function removeNavigationArrows() {
    const prevArrow = document.querySelector('.prev-arrow');
    const nextArrow = document.querySelector('.next-arrow');
    if (prevArrow) prevArrow.remove();
    if (nextArrow) nextArrow.remove();
}

function showPreviousImage() {
    if (!currentPopupPost) return;
    currentPopupImageIndex = (currentPopupImageIndex - 1 + currentPopupPost.images.length) % currentPopupPost.images.length;
    updatePopupImage();
}

function showNextImage() {
    if (!currentPopupPost) return;
    currentPopupImageIndex = (currentPopupImageIndex + 1) % currentPopupPost.images.length;
    updatePopupImage();
}

function updatePopupImage() {
    const popupImage = document.getElementById('popupImage');
    const popupTitle = document.getElementById('popupTitle');
    const image = currentPopupPost.images[currentPopupImageIndex];
    popupImage.src = image.url;
    popupImage.alt = image.title;
    popupTitle.textContent = currentPopupPost.title;

    // Rebuild popupInfo content
    buildPopupInfo(currentPopupPost, currentPopupImageIndex);

    // Update URL and history state
    const url = `?postId=${currentPopupPost.postId}&imageIndex=${currentPopupImageIndex}`;
    history.replaceState({ postId: currentPopupPost.postId, imageIndex: currentPopupImageIndex }, '', url);

    // Maintain zoomed state
    const popupContent = document.querySelector('.popup-content');
    if (isZoomed) {
        popupImage.classList.add('zoomed');
        popupContent.classList.add('zoomed');
    } else {
        popupImage.classList.remove('zoomed');
        popupContent.classList.remove('zoomed');
    }
}

function toggleZoom() {
    const popupImage = document.getElementById('popupImage');
    const popupContent = document.querySelector('.popup-content');

    if (!isZoomed) {
        popupImage.classList.add('zoomed');
        popupContent.classList.add('zoomed');
        isZoomed = true;
    } else {
        popupImage.classList.remove('zoomed');
        popupContent.classList.remove('zoomed');
        isZoomed = false;
    }
}

// Close popup when clicking outside the content
document.getElementById('popup').addEventListener('click', function(e) {
    if (e.target === this) {
        closePopup();
    }
});

// Add keyboard support for closing popup and navigating images
document.addEventListener('keydown', function(e) {
    const popup = document.getElementById('popup');
    if (popup.style.display === 'flex') {
        if (e.key === 'Escape') {
            if (isZoomed) {
                toggleZoom(); // Exit zoom first
            } else {
                closePopup();
            }
        } else if (e.key === 'ArrowLeft') {
            showPreviousImage();
        } else if (e.key === 'ArrowRight') {
            showNextImage();
        }
    }
});

function createCopyButton(text) {
    const button = document.createElement('button');
    button.className = 'copy-btn';
    button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    `;
    button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent opening the popup when copying
        copyToClipboard(text, button);
    });
    return button;
}

function createCategorySpan(category) {
    const span = document.createElement('span');
    span.className = 'category';
    span.textContent = category;
    span.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent any parent click events
        const button = categoryButtons[category];
        if (button) {
            // Ensure the category is active
            if (!activeCategories.has(category)) {
                toggleCategoryFilter(button, category);
            }
            // Close the popup
            closePopup();
        }
    });
    return span;
}

function renderGallery() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';

    const start = 0;
    const end = currentPage * itemsPerPage;
    const visiblePosts = filteredPosts.slice(start, end);

    visiblePosts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';

        const titleEl = document.createElement('div');
        titleEl.className = 'post-title';
        titleEl.textContent = post.title;

        const imagesGrid = document.createElement('div');
        imagesGrid.className = 'images-grid';

        post.images.forEach((img, index) => {
            const imgEl = document.createElement('img');
            imgEl.src = img.url;
            imgEl.alt = img.title;
            imgEl.className = 'grid-image';
            imgEl.addEventListener('click', (e) => {
                e.stopPropagation();
                openPopup(post, index);
            });
            imagesGrid.appendChild(imgEl);
        });

        const imageInfo = document.createElement('div');
        imageInfo.className = 'image-info';

        // SREF row
        const srefRow = document.createElement('div');
        srefRow.className = 'info-row';

        const srefSpan = document.createElement('span');
        srefSpan.className = 'sref';
        srefSpan.textContent = `--sref ${post.sref.join(', ')}`;

        srefRow.appendChild(srefSpan);
        srefRow.appendChild(createCopyButton(`--sref ${post.sref.join(', ')}`));

        // Categories
        const categoriesDiv = document.createElement('div');
        categoriesDiv.className = 'image-categories';

        post.categories.forEach(category => {
            const span = createCategorySpan(category);
            categoriesDiv.appendChild(span);
        });

        imageInfo.appendChild(srefRow);
        imageInfo.appendChild(categoriesDiv);

        postCard.appendChild(titleEl);
        postCard.appendChild(imagesGrid);
        postCard.appendChild(imageInfo);

        postCard.addEventListener('click', () => openPopup(post));
        gallery.appendChild(postCard);
    });

    const loadMoreBtn = document.getElementById('loadMore');
    if (end >= filteredPosts.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
}

// Load more functionality
document.getElementById('loadMore').addEventListener('click', () => {
    currentPage++;
    renderGallery();
});

// Utility function for debouncing search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function to build popupInfo content
function buildPopupInfo(post, imageIndex) {
    const popupInfo = document.getElementById('popupInfo');
    popupInfo.innerHTML = '';

    const image = post.images[imageIndex];

    // Info Row 1: Prompt
    const infoRow1 = document.createElement('div');
    infoRow1.className = 'info-row';

    const copyButton1 = createCopyButton(image.prompt);

    const promptP = document.createElement('p');
    promptP.textContent = image.prompt;

    infoRow1.appendChild(copyButton1);
    infoRow1.appendChild(promptP);

    // Info Row 2: SREF
    const infoRow2 = document.createElement('div');
    infoRow2.className = 'info-row';

    const srefText = `--sref ${image.sref.join(', ')}`;
    const copyButton2 = createCopyButton(srefText);

    const srefSpan = document.createElement('span');
    srefSpan.className = 'sref';
    srefSpan.textContent = srefText;

    infoRow2.appendChild(copyButton2);
    infoRow2.appendChild(srefSpan);

    // Image Tags
    const imageTagsDiv = document.createElement('div');
    imageTagsDiv.className = 'image-tags';

    image.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag';
        tagSpan.textContent = tag;
        imageTagsDiv.appendChild(tagSpan);
    });

    // Image Categories
    const imageCategoriesDiv = document.createElement('div');
    imageCategoriesDiv.className = 'image-categories';

    post.categories.forEach(category => {
        const span = createCategorySpan(category);
        imageCategoriesDiv.appendChild(span);
    });

    // Append all to popupInfo
    popupInfo.appendChild(infoRow1);
    popupInfo.appendChild(infoRow2);
    popupInfo.appendChild(imageTagsDiv);
    popupInfo.appendChild(imageCategoriesDiv);
}

// Initial render
renderGallery();

// Handle history state and URL parameters
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.postId !== undefined) {
        const postId = event.state.postId;
        const imageIndex = event.state.imageIndex || 0;
        const post = galleryData.posts.find(p => p.postId === postId);
        if (post) {
            openPopup(post, imageIndex, false);
        }
    } else {
        if (currentPopupPost) {
            closePopup(false);
        }
    }
});

// On page load, check URL parameters
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('postId')) {
        const postId = parseInt(params.get('postId'), 10);
        const imageIndex = parseInt(params.get('imageIndex'), 10) || 0;
        const post = galleryData.posts.find(p => p.postId === postId);
        if (post) {
            openPopup(post, imageIndex, false);
        }
    }
});
