document.addEventListener('DOMContentLoaded', () => {

    const escapeHtml = (unsafe) => {
        if (unsafe === null || typeof unsafe === 'undefined') {
            return '';
        }
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const getFormattedDate = (dateString) => {
        if (!dateString) {
            return 'Date not available';
        }
        try {
            const dateObj = new Date(dateString + 'T00:00:00');
            if (isNaN(dateObj)) {
                return dateString;
            }
            return dateObj.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    const App = {
        state: {
            allAnnouncements: [],
            featuredItems: [],
            categories: ["All Categories"],
            filters: {
                search: '',
                category: 'All Categories',
                sort: 'default',
            },
            carousel: {
                currentIndex: 0,
                timer: null,
                interval: 5000,
                defaultInterval: 5000,
                interactionInterval: 8000,
            }
        },

        elements: {
            featuredSection: document.querySelector('.featured-section'),
            carouselTrack: document.querySelector('.featured-carousel-track'),
            carouselCounter: document.querySelector('.featured-carousel-counter'),
            prevBtn: document.querySelector('.featured-container .prev-arrow'),
            nextBtn: document.querySelector('.featured-container .next-arrow'),
            searchInput: document.getElementById('search-input'),
            categoryBtn: document.getElementById('category-filter-btn'),
            categoryDropdown: document.querySelector('.category-dropdown'),
            sortBtn: document.getElementById('sort-btn'),
            sortDropdown: document.querySelector('.sort-dropdown'),
            announcementsGrid: document.querySelector('.announcements-grid'),
            menuBtn: document.getElementById('menu-btn'),
            closeBtn: document.getElementById('close-btn'),
            mobileMenu: document.getElementById('mobile-menu'),
        },

        async init() {
            try {
                const response = await fetch('../json/events_data.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();

                this.state.allAnnouncements = data.announcements || [];
                this.state.featuredItems = data.featuredItems || [];
                this.state.categories = ["All Categories", ...new Set(this.state.allAnnouncements.map(item => item.category).filter(Boolean))];

            } catch (error) {
                console.error("Could not fetch or process data:", error);
                if (this.elements.announcementsGrid) {
                    this.elements.announcementsGrid.innerHTML = '<p class="no-results-message">Could not load announcements. Please try again later.</p>';
                }
                if (this.elements.featuredSection) {
                    this.elements.featuredSection.style.display = 'none';
                }
                return;
            }

            this.setupCarousel();
            this.setupControls();
            this.setupMobileMenu();
            this.applyFiltersAndSort();
        },

        renderAnnouncementsGrid(itemsToRender) {
            const grid = this.elements.announcementsGrid;
            if (!grid) {
                return;
            }

            grid.innerHTML = '';

            if (itemsToRender.length === 0) {
                grid.innerHTML = '<p class="no-results-message" style="text-align: center; width: 100%; grid-column: 1 / -1;">No announcements match your criteria.</p>';
                return;
            }

            const fragment = document.createDocumentFragment();
            itemsToRender.forEach(item => {
                const card = document.createElement('div');
                card.className = 'announcement-card';
                card.innerHTML = `
                    <img src="${escapeHtml(item.imgSrc)}" alt="${escapeHtml(item.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.paddingTop='20px';">
                    <div class="card-content">
                        <h4>${escapeHtml(item.title)}</h4>
                        <p>${escapeHtml(item.description)}</p>
                        <div class="meta">
                            <span>Posted: ${getFormattedDate(item.date)}</span>
                            <span>Category: ${escapeHtml(item.category)}</span>
                        </div>
                    </div>
                `;
                fragment.appendChild(card);
            });
            grid.appendChild(fragment);
        },

        applyFiltersAndSort() {
            let filteredData = [...this.state.allAnnouncements];
            const {
                search,
                category,
                sort
            } = this.state.filters;

            if (search) {
                const searchTerm = search.toLowerCase().trim();
                filteredData = filteredData.filter(item =>
                    (item.title && item.title.toLowerCase().includes(searchTerm)) ||
                    (item.description && item.description.toLowerCase().includes(searchTerm)) ||
                    (item.category && item.category.toLowerCase().includes(searchTerm))
                );
            }

            if (category !== 'All Categories') {
                filteredData = filteredData.filter(item => item.category === category);
            }

            switch (sort) {
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
            this.renderAnnouncementsGrid(filteredData);
        },

        renderCarousel() {
            const {
                carouselTrack,
                carouselCounter
            } = this.elements;
            if (!carouselTrack || this.state.featuredItems.length === 0) {
                return;
            }

            const cards = carouselTrack.children;
            const dots = carouselCounter.children;
            const activeCard = cards[this.state.carousel.currentIndex];

            if (!activeCard) {
                return;
            }

            const cardWidth = activeCard.offsetWidth;
            const cardLeft = activeCard.offsetLeft;
            const wrapperWidth = carouselTrack.parentElement.offsetWidth;
            const offset = wrapperWidth / 2 - cardLeft - cardWidth / 2;
            carouselTrack.style.transform = `translateX(${offset}px)`;

            Array.from(cards).forEach((card, index) => card.classList.toggle('active', index === this.state.carousel.currentIndex));
            Array.from(dots).forEach((dot, index) => dot.classList.toggle('active', index === this.state.carousel.currentIndex));
        },

        setupCarousel() {
            const {
                featuredItems
            } = this.state;
            const {
                carouselTrack,
                carouselCounter,
                prevBtn,
                nextBtn,
                featuredSection
            } = this.elements;

            if (featuredItems.length === 0) {
                if (featuredSection) {
                    featuredSection.style.display = 'none';
                }
                return;
            }

            carouselTrack.innerHTML = featuredItems.map(item => `
                <div class="featured-card">
                    <img src="${escapeHtml(item.imgSrc)}" alt="" class="featured-img" onerror="this.onerror=null;this.src='https://placehold.co/100x100/cccccc/333333?text=Image+Not+Found';">
                    <div class="featured-content">
                        <h3>${escapeHtml(item.title)}</h3>
                        <p>${escapeHtml(item.description)}</p>
                        <div class="meta">
                            <span>${getFormattedDate(item.date)}</span>
                        </div>
                    </div>
                </div>`
            ).join('');

            carouselCounter.innerHTML = featuredItems.map((_, i) =>
                `<button class="carousel-dot" data-index="${i}" aria-label="Go to slide ${i + 1}"></button>`
            ).join('');

            prevBtn.addEventListener('click', () => this.moveCarousel(-1));
            nextBtn.addEventListener('click', () => this.moveCarousel(1));
            carouselCounter.addEventListener('click', e => {
                if (e.target.matches('.carousel-dot')) {
                    this.moveCarousel(parseInt(e.target.dataset.index, 10), true);
                }
            });

            setTimeout(() => {
                carouselTrack.style.visibility = 'visible';
                this.renderCarousel();
                this.startAutoScroll();
            }, 100);

            window.addEventListener('resize', () => this.renderCarousel());
        },

        setupControls() {
            const {
                searchInput,
                categoryBtn,
                categoryDropdown,
                sortBtn,
                sortDropdown
            } = this.elements;

            const sortOptions = {
                'default': 'Sort',
                'date-newest': 'Date (Newest First)',
                'date-oldest': 'Date (Oldest First)',
                'title-az': 'Title (A-Z)',
                'title-za': 'Title (Z-A)',
                'category-az': 'Category (A-Z)'
            };

            searchInput.addEventListener('input', (e) => {
                this.state.filters.search = e.target.value.toLowerCase().trim();
                this.applyFiltersAndSort();
            });

            this.populateDropdown(categoryDropdown, this.state.categories, this.state.filters.category, categoryBtn, 'category');
            this.populateDropdown(sortDropdown, sortOptions, this.state.filters.sort, sortBtn, 'sort');

            categoryBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sortDropdown.classList.remove('show');
                categoryDropdown.classList.toggle('show');
            });

            sortBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                categoryDropdown.classList.remove('show');
                sortDropdown.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                categoryDropdown.classList.remove('show');
                sortDropdown.classList.remove('show');
            });
        },

        populateDropdown(dropdownElement, itemsDataSource, currentSelection, buttonElement, type) {
            if (!dropdownElement) {
                return;
            }
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
                        this.state.filters.category = value;
                        buttonElement.firstChild.textContent = text + " ";
                    } else if (type === 'sort') {
                        this.state.filters.sort = value;
                        buttonElement.firstChild.textContent = text + " ";
                    }

                    this.applyFiltersAndSort();
                    dropdownElement.classList.remove('show');
                    buttonElement.classList.remove('open');
                    dropdownElement.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                    itemButton.classList.add('active');
                });
                dropdownElement.appendChild(itemButton);
            };

            if (Array.isArray(itemsDataSource)) {
                itemsDataSource.forEach(categoryName => {
                    createItemButton(categoryName, categoryName);
                });
            } else {
                for (const key in itemsDataSource) {
                    createItemButton(itemsDataSource[key], key);
                }
            }
        },

        setupMobileMenu() {
            const {
                menuBtn,
                closeBtn,
                mobileMenu
            } = this.elements;
            if (!menuBtn || !closeBtn || !mobileMenu) {
                return;
            }
            menuBtn.addEventListener('click', () => mobileMenu.classList.add('visible'));
            closeBtn.addEventListener('click', () => mobileMenu.classList.remove('visible'));
        },

        moveCarousel(direction, isAbsolute = false) {
            const numItems = this.state.featuredItems.length;
            if (isAbsolute) {
                this.state.carousel.currentIndex = direction;
            } else {
                this.state.carousel.currentIndex = (this.state.carousel.currentIndex + direction + numItems) % numItems;
            }
            this.renderCarousel();
            this.resetAutoScroll();
        },

        startAutoScroll() {
            clearInterval(this.state.carousel.timer);
            this.state.carousel.timer = setInterval(() => {
                this.moveCarousel(1);
                if (this.state.carousel.interval === this.state.carousel.interactionInterval) {
                    this.state.carousel.interval = this.state.carousel.defaultInterval;
                    this.startAutoScroll();
                }
            }, this.state.carousel.interval);
        },

        resetAutoScroll() {
            this.state.carousel.interval = this.state.carousel.interactionInterval;
            this.startAutoScroll();
        },
    };

    App.init();
});