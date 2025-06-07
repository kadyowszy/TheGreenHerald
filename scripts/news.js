document.addEventListener('DOMContentLoaded', () => {
    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const mobileMenuPanel = document.getElementById('mobileMenuPanel');

    if (openMenuBtn && closeMenuBtn && mobileMenuPanel) {
        openMenuBtn.addEventListener('click', () => {
            mobileMenuPanel.classList.add('visible');
        });
        closeMenuBtn.addEventListener('click', () => {
            mobileMenuPanel.classList.remove('visible');
        });
    } else {
        console.error('Mobile menu elements not found. Ensure IDs "openMenuBtn", "closeMenuBtn", and "mobileMenuPanel" exist in your HTML.');
    }

    const searchIconBtn = document.getElementById('searchIconBtn');
    const searchBarModal = document.getElementById('searchBarModal');
    const closeSearchBtn = document.getElementById('closeSearchBtn');
    const searchInput = document.getElementById('searchInput');
    const performSearchBtn = document.getElementById('performSearchBtn');

    if (searchIconBtn && searchBarModal && closeSearchBtn && searchInput && performSearchBtn) {
        searchIconBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            searchBarModal.classList.add('visible');
            searchInput.focus();
        });

        closeSearchBtn.addEventListener('click', () => {
            searchBarModal.classList.remove('visible');
        });

        document.addEventListener('click', (event) => {
            if (searchBarModal.classList.contains('visible') && 
                !searchBarModal.contains(event.target) && 
                event.target !== searchIconBtn && 
                !searchIconBtn.contains(event.target)) {
                searchBarModal.classList.remove('visible');
            }
        });
        
        searchBarModal.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        performSearchBtn.addEventListener('click', () => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                window.location.href = `search.html?query=${encodeURIComponent(searchTerm)}`;
            } else {
                alert("Please enter a search term.");
                searchInput.focus();
            }
        });

        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                performSearchBtn.click();
            }
        });

    } else {
        console.error('Search bar elements not found. Check IDs: searchIconBtn, searchBarModal, closeSearchBtn, searchInput, performSearchBtn.');
    }

    const featuredContainer = document.getElementById('featured-article-container');
    const trendingContainer = document.getElementById('trending-news-container');
    const otherNewsGridContainer = document.getElementById('other-news-grid-container');
    const latestNewsListContainer = document.getElementById('latest-news-list-container');
    const eventsListContainer = document.querySelector('.upcoming-events .events-list');

    function createImageElement(src, alt, fallbackSrc, className) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        if (className) {
            img.className = className;
        }
        img.onerror = function() {
            console.warn(`Image failed to load: ${src}. Attempting fallback: ${fallbackSrc}`);
            this.onerror = null;
            this.src = fallbackSrc;
        };
        return img;
    }

    function buildStandardArticleCard(article, classNames = {}) {
        const card = document.createElement('div');
        card.classList.add(classNames.cardClass || 'article-card');

        const imageBox = document.createElement('div');
        imageBox.classList.add('image-box');
        const img = createImageElement(article.imageUrl, article.imageAlt, article.fallbackImageUrl, classNames.imageClass || 'article-image');
        imageBox.appendChild(img);

        const content = document.createElement('div');
        content.classList.add(classNames.contentClass || 'article-content');

        const titleDiv = document.createElement('div');
        titleDiv.classList.add(classNames.titleClass || 'article-title');
        titleDiv.textContent = article.headline;

        const textDiv = document.createElement('div');
        textDiv.classList.add(classNames.textClass || 'article-text');
        textDiv.textContent = article.news_body;

        content.appendChild(titleDiv);
        content.appendChild(textDiv);
        
        card.appendChild(imageBox);
        card.appendChild(content);
        
        return card;
    }

    function renderFeaturedArticle(article) {
        if (!featuredContainer) return;
        featuredContainer.innerHTML = '';
        
        if (!article) {
            featuredContainer.innerHTML = '<p>No featured article to display.</p>';
            return;
        }
        
        const articleLink = document.createElement('a');
        articleLink.href = `article.html?id=${article.id}`;
        articleLink.classList.add('article-link');
        articleLink.setAttribute('aria-label', `Read more about ${article.headline}`);

        const card = buildStandardArticleCard(article, {
            cardClass: 'article-card',
            imageClass: 'article-image',
            contentClass: 'article-content',
            titleClass: 'article-title',
            textClass: 'article-text'
        });
        
        articleLink.appendChild(card);
        featuredContainer.appendChild(articleLink);
    }

    function renderTrendingArticles(articles) {
        if (!trendingContainer) return;
        trendingContainer.innerHTML = '';

        if (!articles || articles.length === 0) {
            trendingContainer.innerHTML = '<p>No trending news to display.</p>';
            return;
        }

        articles.forEach(article => {
            const articleLink = document.createElement('a');
            articleLink.href = `article.html?id=${article.id}`;
            articleLink.classList.add('article-link');
            articleLink.setAttribute('aria-label', `Read more about ${article.headline}`);

            const card = buildStandardArticleCard(article, {
                cardClass: 'article-card',
                imageClass: 'article-image',
                contentClass: 'article-content',
                titleClass: 'article-title',
                textClass: 'article-text'
            });

            articleLink.appendChild(card);
            trendingContainer.appendChild(articleLink);
        });
    }

    function renderOtherNewsArticles(articles) {
        if (!otherNewsGridContainer) return;
        otherNewsGridContainer.innerHTML = '';

        if (!articles || articles.length === 0) {
            otherNewsGridContainer.innerHTML = '<p>No other news to display.</p>';
            return;
        }

        articles.forEach(article => {
            const articleLink = document.createElement('a');
            articleLink.href = `article.html?id=${article.id}`;
            articleLink.classList.add('article-link');
            articleLink.setAttribute('aria-label', `Read more about ${article.headline}`);

            const imageBox = document.createElement('div');
            imageBox.classList.add('image-box');
            const img = createImageElement(article.imageUrl, article.imageAlt, article.fallbackImageUrl, 'other-news-image');
            imageBox.appendChild(img);

            const textContentWrapper = document.createElement('div');
            textContentWrapper.classList.add('article-content-wrapper');

            const titleDiv = document.createElement('div');
            titleDiv.classList.add('article-title');
            titleDiv.textContent = article.headline;

            const textDiv = document.createElement('div');
            textDiv.classList.add('article-text');
            textDiv.textContent = article.news_body;
            
            textContentWrapper.appendChild(titleDiv);
            textContentWrapper.appendChild(textDiv);

            articleLink.appendChild(imageBox);
            articleLink.appendChild(textContentWrapper);
            otherNewsGridContainer.appendChild(articleLink);
        });
    }

    function renderLatestNewsArticles(articles) {
        if (!latestNewsListContainer) return;
        latestNewsListContainer.innerHTML = '';

        if (!articles || articles.length === 0) {
            latestNewsListContainer.innerHTML = '<p>No latest news to display.</p>';
            return;
        }

        articles.forEach(article => {
            const articleLink = document.createElement('a');
            articleLink.href = `article.html?id=${article.id}`;
            articleLink.classList.add('article-link');
            articleLink.setAttribute('aria-label', `Read more about ${article.headline}`);

            const item = buildStandardArticleCard(article, {
                cardClass: 'latest-news-item',
                imageClass: 'latest-news-image',
                contentClass: 'latest-news-content',
                titleClass: 'latest-news-title',
                textClass: 'latest-news-text'
            });

            articleLink.appendChild(item);
            latestNewsListContainer.appendChild(articleLink);
        });
    }

    async function loadArticles() {
        try {
            const response = await fetch('../json/news_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, while fetching ${response.url}`);
            }
            const data = await response.json();
            
            if (!data || !data.articles) {
                throw new Error("JSON data is not in the expected format (missing 'articles' array).");
            }
            const allArticles = data.articles;

            const featured = allArticles.find(art => art.layout_category === 'featured');
            const trending = allArticles.filter(art => art.layout_category === 'trending');
            const other = allArticles.filter(art => art.layout_category === 'other');
            const latest = allArticles.filter(art => art.layout_category === 'latest');

            if (featuredContainer) renderFeaturedArticle(featured);
            if (trendingContainer) renderTrendingArticles(trending);
            if (otherNewsGridContainer) renderOtherNewsArticles(other);  
            if (latestNewsListContainer) renderLatestNewsArticles(latest);

        } catch (error) {
            console.error("Could not load or render articles:", error);
            if (featuredContainer) featuredContainer.innerHTML = `<p>Error loading featured article. ${error.message}</p>`;
            if (trendingContainer) trendingContainer.innerHTML = `<p>Error loading trending articles. ${error.message}</p>`;
            if (otherNewsGridContainer) otherNewsGridContainer.innerHTML = `<p>Error loading other news. ${error.message}</p>`;
            if (latestNewsListContainer) latestNewsListContainer.innerHTML = `<p>Error loading latest news. ${error.message}</p>`;
        }
    }

    function renderUpcomingEvents(events) {
        if (!eventsListContainer) {
            console.error("Events list container not found.");
            return;
        }
        eventsListContainer.innerHTML = '';

        if (!events || events.length === 0) {
            eventsListContainer.innerHTML = '<p>No upcoming events to display.</p>';
            const seeMoreLink = document.createElement('a');
            seeMoreLink.href = "../sections/calendar.html";
            seeMoreLink.classList.add('see-more');
            seeMoreLink.textContent = 'See more...';
            eventsListContainer.appendChild(seeMoreLink);
            return;
        }
        
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        events.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.classList.add('event-item');

            const eventDateDiv = document.createElement('div');
            eventDateDiv.classList.add('event-date');
            
            const dateObj = new Date(event.date + 'T00:00:00');

            const eventMonthDiv = document.createElement('div');
            eventMonthDiv.classList.add('event-month');
            eventMonthDiv.textContent = monthNames[dateObj.getMonth()];

            const eventDayDiv = document.createElement('div');
            eventDayDiv.classList.add('event-day');
            eventDayDiv.textContent = dateObj.getDate();

            eventDateDiv.appendChild(eventMonthDiv);
            eventDateDiv.appendChild(eventDayDiv);

            const eventDetailsDiv = document.createElement('div');
            eventDetailsDiv.classList.add('event-details');

            const eventTitleDiv = document.createElement('div');
            eventTitleDiv.classList.add('event-title');
            eventTitleDiv.textContent = event.title;

            const eventDescDiv = document.createElement('div');
            eventDescDiv.classList.add('event-desc');
            eventDescDiv.textContent = event.description;

            eventDetailsDiv.appendChild(eventTitleDiv);
            eventDetailsDiv.appendChild(eventDescDiv);

            eventItem.appendChild(eventDateDiv);
            eventItem.appendChild(eventDetailsDiv);

            eventsListContainer.appendChild(eventItem);
        });

        const seeMoreLink = document.createElement('a');
        seeMoreLink.href = "../sections/calendar.html";
        seeMoreLink.classList.add('see-more');
        seeMoreLink.textContent = 'See more...';
        eventsListContainer.appendChild(seeMoreLink);
    }

    async function loadUpcomingEvents() {
        if (!eventsListContainer) return;

        try {
            const response = await fetch('../json/events_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, while fetching events_data.json`);
            }
            const data = await response.json();

            if (!data || !data.upcomingEvents) {
                throw new Error("Events JSON data is not in the expected format (missing 'upcomingEvents' array).");
            }
            renderUpcomingEvents(data.upcomingEvents);
        } catch (error) {
            console.error("Could not load or render upcoming events:", error);
            if (eventsListContainer) {
                eventsListContainer.innerHTML = `<p>Error loading events. ${error.message}</p>`;
            }
        }
    }

    if (featuredContainer || trendingContainer || otherNewsGridContainer || latestNewsListContainer) {
        loadArticles();
    }
    if (eventsListContainer) {
        loadUpcomingEvents();
    }
});