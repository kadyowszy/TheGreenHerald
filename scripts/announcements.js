function escapeHtml(unsafe) {
    if (unsafe === null || typeof unsafe === 'undefined') return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', () => {
    let featuredItemsData = [];
    let announcementLoopData = [];
    let categories = ["All Categories"];

    let currentFeaturedIndex = 0;
    let slideDirection = 1;
    const slideAnimationDuration = 500;

    const sortOptions = {
        'default': 'Sort',
        'date-newest': 'Date (Newest First)',
        'date-oldest': 'Date (Oldest First)',
        'title-az': 'Title (A-Z)',
        'title-za': 'Title (Z-A)',
        'category-az': 'Category (A-Z)'
    };

    let currentSearchTerm = '';
    let currentCategory = 'All Categories';
    let currentSortOption = 'default';

    async function fetchData() {
        try {
            const response = await fetch('../json/events_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonData = await response.json();

            const normalizeItemDate = (item) => {
                if (item.date) {
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
                        try {
                            const dateObj = new Date(item.date);
                            if (!isNaN(dateObj)) {
                                const year = dateObj.getFullYear();
                                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                const day = String(dateObj.getDate()).padStart(2, '0');
                                item.date = `${year}-${month}-${day}`;
                            } else {
                                console.warn(`Invalid date format for item: "${item.title}". Received: "${item.date}". Keeping original.`);
                            }
                        } catch (e) {
                            console.warn(`Error parsing date for item: "${item.title}". Date: "${item.date}". Keeping original.`, e);
                        }
                    }
                }
                return item;
            };

            featuredItemsData = (jsonData.featuredItems || []).map(normalizeItemDate);
            announcementLoopData = (jsonData.announcements || []).map(normalizeItemDate);

            if (announcementLoopData.length > 0) {
                categories = ["All Categories", ...new Set(announcementLoopData.map(item => item.category).filter(Boolean))];
            } else {
                categories = ["All Categories"];
            }

            setupFeaturedCarousel();
            setupControls();

        } catch (error) {
            console.error("Could not fetch or process data:", error);
            const featuredSlider = document.querySelector('.featured-item-slider');
            if (featuredSlider) {
                featuredSlider.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 20px;">Could not load featured items. Please try again later.</p>';
            }

            const announcementsGrid = document.querySelector('.announcements-grid');
            if (announcementsGrid) {
                announcementsGrid.innerHTML = '<p class="no-results-message" style="color: var(--text-light); text-align: center; grid-column: 1 / -1;">Could not load announcements. Please try again later.</p>';
            }

            const prevBtn = document.querySelector('.featured-carousel-wrapper .prev-arrow');
            const nextBtn = document.querySelector('.featured-carousel-wrapper .next-arrow');
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
        }
    }

    function updateSliderDOM(sliderElement, itemData) {
        const imgEl = sliderElement.querySelector('.featured-img');
        const titleEl = sliderElement.querySelector('.featured-content h3');
        const titleTextSpan = titleEl ? titleEl.querySelector('span') : null;
        const descEl = sliderElement.querySelector('.featured-content p');
        const metaSpans = sliderElement.querySelectorAll('.featured-content .meta span');

        if (imgEl && itemData) {
            imgEl.src = escapeHtml(itemData.imgSrc);
            imgEl.alt = escapeHtml(itemData.title);
        }

        if (itemData && titleTextSpan) {
            titleTextSpan.textContent = itemData.title;
        } else if (itemData && titleEl) {
            const icon = titleEl.querySelector('i.fas.fa-bullhorn');

            Array.from(titleEl.childNodes).forEach(child => {
                if (child !== icon && (child.nodeType === Node.TEXT_NODE || child.tagName === 'SPAN')) {
                    titleEl.removeChild(child);
                }
            });

            const newTitleSpan = document.createElement('span');
            newTitleSpan.textContent = itemData.title;

            if (icon) {
                let currentIconNextSibling = icon.nextSibling;
                while (currentIconNextSibling && currentIconNextSibling.nodeType === Node.TEXT_NODE && currentIconNextSibling.textContent.trim() === '') {
                    let toRemove = currentIconNextSibling;
                    currentIconNextSibling = currentIconNextSibling.nextSibling;
                    titleEl.removeChild(toRemove);
                }
                if (!(currentIconNextSibling && currentIconNextSibling.nodeType === Node.TEXT_NODE && currentIconNextSibling.textContent.startsWith(' '))) {
                    const space = document.createTextNode(' ');
                    icon.insertAdjacentElement('afterend', space);
                    space.insertAdjacentElement('afterend', newTitleSpan);
                } else {
                    icon.insertAdjacentElement('afterend', newTitleSpan);
                }
            } else {
                titleEl.appendChild(newTitleSpan);
            }
        }

        if (descEl && itemData) {
            descEl.textContent = itemData.description;
        }

        if (metaSpans.length >= 2 && itemData) {
            let displayDate = itemData.date;
            try {
                const dateObj = new Date(itemData.date + 'T00:00:00');
                if (!isNaN(dateObj)) {
                    displayDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                }
            } catch (e) { }

            metaSpans[0].textContent = `Posted: ${escapeHtml(displayDate)}`;
            metaSpans[1].textContent = `Category: ${escapeHtml(itemData.category)}`;
        }
    }

    function renderFeaturedAnnouncement(isInitialLoad = false) {
        const featuredItemSlider = document.querySelector('.featured-item-slider');
        if (!featuredItemSlider || featuredItemsData.length === 0) return;

        const item = featuredItemsData[currentFeaturedIndex];
        if (!item) return;

        const slideOutTarget = slideDirection === 1 ? '-100%' : '100%';
        const slideInStart = slideDirection === 1 ? '100%' : '-100%';

        if (isInitialLoad) {
            updateSliderDOM(featuredItemSlider, item);
            featuredItemSlider.style.transition = 'none';
            featuredItemSlider.style.transform = 'translateX(0%)';
            void featuredItemSlider.offsetWidth;
            featuredItemSlider.style.transition = `transform ${slideAnimationDuration}ms ease-in-out`;
        } else {
            const afterSlideOut = () => {
                featuredItemSlider.style.visibility = 'hidden';
                updateSliderDOM(featuredItemSlider, item);
                featuredItemSlider.style.transition = 'none';
                featuredItemSlider.style.transform = `translateX(${slideInStart})`;
                void featuredItemSlider.offsetWidth;
                featuredItemSlider.style.visibility = 'visible';
                featuredItemSlider.style.transition = `transform ${slideAnimationDuration}ms ease-in-out`;
                featuredItemSlider.style.transform = 'translateX(0%)';
            };
            featuredItemSlider.addEventListener('transitionend', afterSlideOut, { once: true });
            featuredItemSlider.style.transform = `translateX(${slideOutTarget})`;
        }
    }

    function setupFeaturedCarousel() {
        const prevBtn = document.querySelector('.featured-carousel-wrapper .prev-arrow');
        const nextBtn = document.querySelector('.featured-carousel-wrapper .next-arrow');
        const featuredItemSlider = document.querySelector('.featured-item-slider');

        if (!featuredItemSlider || featuredItemsData.length === 0) {
            console.log("Featured item slider not found or no data, carousel not set up.");
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            if (featuredItemSlider && featuredItemsData.length === 0 && featuredItemSlider.innerHTML.trim() === '') {
                featuredItemSlider.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 20px;">No featured items to display.</p>';
            }
            return;
        }

        renderFeaturedAnnouncement(true);

        if (prevBtn && nextBtn && featuredItemsData.length > 1) {
            prevBtn.addEventListener('click', () => {
                slideDirection = -1;
                currentFeaturedIndex = (currentFeaturedIndex - 1 + featuredItemsData.length) % featuredItemsData.length;
                renderFeaturedAnnouncement();
            });

            nextBtn.addEventListener('click', () => {
                slideDirection = 1;
                currentFeaturedIndex = (currentFeaturedIndex + 1) % featuredItemsData.length;
                renderFeaturedAnnouncement();
            });
        } else {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
        }
    }

    function renderAnnouncementsGrid(itemsToRender) {
        const grid = document.querySelector('.announcements-grid');
        if (!grid) return;

        grid.innerHTML = '';

        if (itemsToRender.length === 0) {
            grid.innerHTML = '<p class="no-results-message" style="color: var(--text-light); text-align: center; grid-column: 1 / -1;">No announcements match your criteria.</p>';
            return;
        }

        itemsToRender.forEach(item => {
            let displayDate = item.date;
            try {
                const dateObj = new Date(item.date + 'T00:00:00');
                if (!isNaN(dateObj)) {
                    displayDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                }
            } catch (e) { }

            const cardHtml = `
                <div class="announcement-card">
                    <img src="${escapeHtml(item.imgSrc)}" alt="${escapeHtml(item.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.paddingTop='20px';">
                    <div class="card-content">
                        <h4>${escapeHtml(item.title)}</h4>
                        <p>${escapeHtml(item.description)}</p>
                        <div class="meta">
                            <span>Posted: ${escapeHtml(displayDate)}</span>
                            <span>Category: ${escapeHtml(item.category)}</span>
                        </div>
                    </div>
                </div>`;
            grid.insertAdjacentHTML('beforeend', cardHtml);
        });
    }

    function applyFiltersAndSort() {
        let filteredData = [...announcementLoopData];

        if (currentSearchTerm) {
            filteredData = filteredData.filter(item =>
                (item.title && item.title.toLowerCase().includes(currentSearchTerm)) ||
                (item.description && item.description.toLowerCase().includes(currentSearchTerm)) ||
                (item.category && item.category.toLowerCase().includes(currentSearchTerm))
            );
        }

        if (currentCategory !== 'All Categories') {
            filteredData = filteredData.filter(item => item.category === currentCategory);
        }

        switch (currentSortOption) {
            case 'date-newest':
                filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'date-oldest':
                filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'title-az':
                filteredData.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
                break;
            case 'title-za':
                filteredData.sort((a, b) => b.title.toLowerCase().localeCompare(a.title.toLowerCase()));
                break;
            case 'category-az':
                filteredData.sort((a, b) => {
                    const catA = a.category || '';
                    const catB = b.category || '';
                    return catA.toLowerCase().localeCompare(catB.toLowerCase());
                });
                break;
        }
        renderAnnouncementsGrid(filteredData);
    }

    function populateDropdown(dropdownElement, itemsDataSource, currentSelection, buttonElement, type) {
        if (!dropdownElement) return;

        dropdownElement.innerHTML = '';

        const createItemButton = (text, value) => {
            const itemButton = document.createElement('button');
            itemButton.textContent = text;
            itemButton.dataset.value = value;

            if (value === currentSelection) {
                itemButton.classList.add('active');
            }

            itemButton.addEventListener('click', (e) => {
                e.stopPropagation();

                if (type === 'category') {
                    currentCategory = value;
                    buttonElement.firstChild.textContent = currentCategory + " ";
                } else if (type === 'sort') {
                    currentSortOption = value;
                    buttonElement.firstChild.textContent = itemsDataSource[value] + " ";
                }

                applyFiltersAndSort();
                dropdownElement.classList.remove('show');
                buttonElement.classList.remove('open');
                dropdownElement.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                itemButton.classList.add('active');
            });
            dropdownElement.appendChild(itemButton);
        };

        if (type === 'category') {
            itemsDataSource.forEach(categoryName => {
                createItemButton(categoryName, categoryName);
            });
        } else if (type === 'sort') {
            for (const key in itemsDataSource) {
                createItemButton(itemsDataSource[key], key);
            }
        }
    }

    function setupControls() {
        const searchInput = document.getElementById('search-input');
        const categoryFilterBtn = document.getElementById('category-filter-btn');
        const categoryDropdown = document.querySelector('.category-dropdown');
        const sortBtn = document.getElementById('sort-btn');
        const sortDropdown = document.querySelector('.sort-dropdown');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentSearchTerm = e.target.value.toLowerCase().trim();
                applyFiltersAndSort();
            });
        }

        if (categoryFilterBtn && categoryDropdown) {
            populateDropdown(categoryDropdown, categories, currentCategory, categoryFilterBtn, 'category');
            categoryFilterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = categoryDropdown.classList.toggle('show');
                categoryFilterBtn.classList.toggle('open', isOpen);
                if (isOpen && sortDropdown) {
                    sortDropdown.classList.remove('show');
                    if (sortBtn) sortBtn.classList.remove('open');
                }
            });
        } else {
            if (categoryFilterBtn) categoryFilterBtn.style.display = 'none';
        }

        if (sortBtn && sortDropdown) {
            populateDropdown(sortDropdown, sortOptions, currentSortOption, sortBtn, 'sort');
            sortBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = sortDropdown.classList.toggle('show');
                sortBtn.classList.toggle('open', isOpen);
                if (isOpen && categoryDropdown) {
                    categoryDropdown.classList.remove('show');
                    if (categoryFilterBtn) categoryFilterBtn.classList.remove('open');
                }
            });
        } else {
            if (sortBtn) sortBtn.style.display = 'none';
        }

        applyFiltersAndSort();
    }

    document.addEventListener('click', () => {
        const categoryDropdown = document.querySelector('.category-dropdown');
        const categoryFilterBtn = document.getElementById('category-filter-btn');
        const sortDropdown = document.querySelector('.sort-dropdown');
        const sortBtn = document.getElementById('sort-btn');

        if (categoryDropdown) categoryDropdown.classList.remove('show');
        if (categoryFilterBtn) categoryFilterBtn.classList.remove('open');
        if (sortDropdown) sortDropdown.classList.remove('show');
        if (sortBtn) sortBtn.classList.remove('open');
    });

    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileNavLinks = mobileMenu ? mobileMenu.querySelectorAll('nav a') : [];

    function openMenu() {
        if (mobileMenu) {
            mobileMenu.classList.remove('hidden');
            mobileMenu.classList.add('visible');
            if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeMenu() {
        if (mobileMenu) {
            mobileMenu.classList.remove('visible');
            mobileMenu.classList.add('hidden');
            if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    }

    if (menuBtn) menuBtn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            alert('Nothing yet, demo mode.');
        });
    });

    document.addEventListener('click', (event) => {
        if (mobileMenu && mobileMenu.classList.contains('visible') &&
            !mobileMenu.contains(event.target) &&
            event.target !== menuBtn &&
            (menuBtn && !menuBtn.contains(event.target))
        ) {
            closeMenu();
        }
    });

    fetchData();
});